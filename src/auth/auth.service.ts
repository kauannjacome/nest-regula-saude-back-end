import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { normalizeString } from '../crud/base-crud.service';

const APP_NAME = 'NextSaude';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string, twoFactorCode?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employments: {
          where: { isActive: true, isPrimary: true, status: 'ACCEPTED' },
          include: {
            subscriber: true,
            tenantRole: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    // Check subscription status
    const primaryEmployment = user?.employments?.[0];
    if (primaryEmployment?.subscriber?.subscriptionStatus === 'BLOCKED') {
      throw new ForbiddenException({ code: 'SUBSCRIPTION_BLOCKED', error: 'Assinatura bloqueada' });
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    if (user.isBlocked) {
      throw new ForbiddenException({ code: 'ACCOUNT_BLOCKED', error: 'Conta bloqueada' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const newTry = (user.numberTry || 0) + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { numberTry: newTry, isBlocked: newTry >= 10 },
      });
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Reset password try counter
    if (user.numberTry && user.numberTry > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { numberTry: 0 },
      });
    }

    // 2FA check
    const skip2FA = process.env.SKIP_2FA === 'true';
    if (!skip2FA && user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        throw new ForbiddenException({ code: '2FA_REQUIRED', error: 'Codigo 2FA necessario' });
      }
      const isCodeValid = this.verifyTOTPCode(user.twoFactorSecret, twoFactorCode);
      if (!isCodeValid) {
        const new2FATry = (user.numberTry2FA || 0) + 1;
        await this.prisma.user.update({
          where: { id: user.id },
          data: { numberTry2FA: new2FATry, isBlocked: new2FATry >= 10 },
        });
        throw new ForbiddenException({ code: '2FA_INVALID_CODE', error: 'Codigo 2FA invalido' });
      }
      if (user.numberTry2FA && user.numberTry2FA > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { numberTry2FA: 0 },
        });
      }
    }

    // Check employment for non-system managers
    if (!user.isSystemManager) {
      if (!primaryEmployment) {
        const pending = await this.prisma.userEmployment.findFirst({
          where: { userId: user.id, status: 'PENDING' },
        });
        if (pending) {
          throw new ForbiddenException({ code: 'EMPLOYMENT_PENDING', error: 'Vinculo pendente' });
        }
        throw new ForbiddenException({ code: 'NO_EMPLOYMENT', error: 'Sem vinculo ativo' });
      }
    }

    // Build JWT payload
    const employment = primaryEmployment;
    const permissions = employment?.tenantRole?.permissions.map(
      (rp: any) => rp.permission.name,
    ) || (user.isSystemManager ? ['*'] : []);

    const resourcesWithRead = new Set<string>();
    for (const pName of permissions) {
      const [resource, action] = pName.split('.');
      if (action === 'read' || action === 'view' || action === 'create') {
        resourcesWithRead.add(resource);
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      subscriberId: employment?.subscriberId || 0,
      isSystemManager: user.isSystemManager || false,
      permissions,
      menus: user.isSystemManager && !employment ? [] : Array.from(resourcesWithRead),
      role: employment?.tenantRole?.name || null,
      roleDisplayName: employment?.tenantRole?.displayName || (user.isSystemManager ? 'System Manager' : null),
      homePage: employment?.tenantRole?.homePage || (user.isSystemManager ? '/admin/dashboard' : '/regulations'),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSystemManager: user.isSystemManager || false,
        isPasswordTemp: user.isPasswordTemp,
        acceptedTerms: user.acceptedTerms,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorResetRequired: user.twoFactorResetRequired === true,
        subscriberId: employment?.subscriberId ? String(employment.subscriberId) : null,
        subscriberName: employment?.subscriber?.name || null,
        subscriptionStatus: employment?.subscriber?.subscriptionStatus || null,
        role: payload.role,
        roleDisplayName: payload.roleDisplayName,
        homePage: payload.homePage,
        permissions: payload.permissions,
        menus: payload.menus,
      },
    };
  }

  // ── Register ──────────────────────────────────────────────────────────

  async validateCnes(cnes: string) {
    if (!cnes || cnes.trim().length === 0) {
      throw new BadRequestException('CNES e obrigatorio');
    }

    const unit = await this.prisma.unit.findFirst({
      where: { cnes: cnes.trim(), deletedAt: null },
      include: {
        subscriber: {
          select: { name: true, municipalityName: true },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidade nao encontrada com este CNES');
    }

    return {
      unitName: unit.name,
      municipalityName: (unit as any).subscriber?.municipalityName || (unit as any).subscriber?.name || '',
    };
  }

  async register(data: {
    cnes: string;
    name: string;
    email: string;
    cpf: string;
    phoneNumber: string;
    password: string;
    birthDate?: string;
    sex?: string;
    maritalStatus?: string;
    motherName?: string;
    fatherName?: string;
    nationality?: string;
    rg?: string;
    cns?: string;
    council?: string;
    councilNumber?: string;
    councilUf?: string;
    specialty?: string;
    address?: {
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
    };
  }) {
    // Validate CNES
    const unit = await this.prisma.unit.findFirst({
      where: { cnes: data.cnes.trim(), deletedAt: null },
    });

    if (!unit) {
      throw new BadRequestException('CNES invalido ou unidade nao encontrada');
    }

    const subscriberId = unit.subscriberId;

    // Check existing user by email
    const existingByEmail = await this.prisma.user.findFirst({
      where: { email: data.email.toLowerCase() },
    });

    // If user exists, check if already has employment for this subscriber
    if (existingByEmail) {
      const existingEmployment = await this.prisma.userEmployment.findFirst({
        where: {
          userId: existingByEmail.id,
          subscriberId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      });

      if (existingEmployment) {
        if (existingEmployment.status === 'PENDING') {
          throw new ConflictException('Ja existe uma solicitacao pendente para este usuario nesta unidade.');
        }
        throw new ConflictException('Usuario ja possui vinculo ativo com esta unidade.');
      }

      // Create employment for existing user
      await this.prisma.userEmployment.create({
        data: {
          userId: existingByEmail.id,
          subscriberId,
          unitId: unit.id,
          status: 'PENDING',
          isActive: false,
          isPrimary: false,
          requestedById: existingByEmail.id,
        },
      });

      await this.notifyAdmins(subscriberId, existingByEmail.id, existingByEmail.name || data.name, 0);

      return { message: 'Solicitacao de acesso enviada. Aguarde aprovacao do administrador.' };
    }

    // Check existing user by CPF
    const cpfClean = data.cpf.replace(/\D/g, '');
    const existingByCpf = await this.prisma.user.findFirst({
      where: { cpf: cpfClean },
    });

    if (existingByCpf) {
      throw new ConflictException('Ja existe uma conta com este CPF.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user + employment in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          nameNormalized: normalizeString(data.name),
          email: data.email.toLowerCase(),
          cpf: cpfClean,
          phoneNumber: data.phoneNumber,
          passwordHash,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          sex: (data.sex as any) || null,
          maritalStatus: data.maritalStatus || null,
          motherName: data.motherName || null,
          fatherName: data.fatherName || null,
          nationality: data.nationality || null,
          rg: data.rg || null,
          cns: data.cns || null,
          registryType: data.council || null,
          registryNumber: data.councilNumber || null,
          registryState: data.councilUf || null,
          postalCode: data.address?.cep || null,
          address: data.address?.logradouro || null,
          number: data.address?.numero || null,
          complement: data.address?.complemento || null,
          neighborhood: data.address?.bairro || null,
          city: data.address?.cidade || null,
          state: data.address?.estado || null,
        },
      });

      const employment = await tx.userEmployment.create({
        data: {
          userId: user.id,
          subscriberId,
          unitId: unit.id,
          status: 'PENDING',
          isActive: false,
          isPrimary: true,
          requestedById: user.id,
        },
      });

      return { user, employment };
    });

    // Notify admins (outside transaction)
    await this.notifyAdmins(subscriberId, result.user.id, data.name, result.employment.id);

    return { message: 'Cadastro realizado com sucesso. Aguarde aprovacao do administrador.' };
  }

  private async notifyAdmins(subscriberId: number, requestingUserId: string, userName: string, employmentId: number) {
    try {
      const adminEmployments = await this.prisma.userEmployment.findMany({
        where: {
          subscriberId,
          isActive: true,
          status: 'ACCEPTED',
          tenantRole: {
            name: { in: ['admin_municipal', 'assistant_municipal'] },
            deletedAt: null,
          },
        },
        select: { userId: true },
      });

      if (adminEmployments.length > 0) {
        await this.prisma.notification.createMany({
          data: adminEmployments.map((emp) => ({
            subscriberId,
            userId: emp.userId,
            title: 'Nova solicitacao de acesso',
            message: `${userName} solicitou acesso ao sistema.`,
            type: 'EMPLOYMENT_REQUESTED' as const,
            ...(employmentId ? { employmentId } : {}),
          })),
        });
      }
    } catch (error) {
      console.error('[REGISTER] Error notifying admins:', error);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Senha atual e nova senha sao obrigatorias');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Nova senha deve ter pelo menos 8 caracteres');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da senha atual');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        isPasswordTemp: false,
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  async cleanup() {
    // In the NestJS backend with JWT, there are no server-side sessions to clean.
    // This endpoint exists for API compatibility with the monolith.
    return { success: true };
  }

  // ── 2FA Setup ─────────────────────────────────────────────────────────

  async twoFactorSetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorResetRequired: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    // If 2FA is enabled and NOT reset by admin, don't allow re-setup
    if (user.twoFactorEnabled && !user.twoFactorResetRequired) {
      throw new BadRequestException('2FA ja esta ativado. Desative primeiro para reconfigurar.');
    }

    // If admin reset the 2FA, clear old state
    if (user.twoFactorEnabled && user.twoFactorResetRequired) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorVerifiedAt: null,
        },
      });
    }

    // Generate new TOTP secret
    const generated = this.generateTOTPSecret(user.email || user.id);

    // Save the secret temporarily (will be activated after verification)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: generated.secret,
        twoFactorEnabled: false,
      },
    });

    // Generate QR Code as Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(generated.otpauthUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    return {
      qrCode: qrCodeDataUrl,
      secret: generated.secret,
      message: 'Escaneie o QR Code com o Google Authenticator e digite o codigo para confirmar',
    };
  }

  // ── 2FA Verify (activate) ─────────────────────────────────────────────

  async twoFactorVerify(userId: string, code: string) {
    if (!code || typeof code !== 'string' || code.length !== 6) {
      throw new BadRequestException('Codigo invalido. Digite os 6 digitos do aplicativo.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Configure o 2FA primeiro usando /api/auth/two-factor/setup');
    }

    const isValid = this.verifyTOTPCode(user.twoFactorSecret, code);
    if (!isValid) {
      throw new BadRequestException('Codigo incorreto. Verifique o codigo no aplicativo e tente novamente.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
        twoFactorResetRequired: false,
      },
    });

    return { message: 'Autenticacao de dois fatores ativada com sucesso!' };
  }

  // ── 2FA Disable ───────────────────────────────────────────────────────

  async twoFactorDisable(userId: string, password: string) {
    if (!password) {
      throw new BadRequestException('Senha e obrigatoria para desativar o 2FA');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA nao esta ativado');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Usuario sem senha configurada');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha incorreta');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
      },
    });

    return { message: 'Autenticacao de dois fatores desativada com sucesso' };
  }

  // ── 2FA Status ────────────────────────────────────────────────────────

  async twoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return {
      enabled: user.twoFactorEnabled,
      verifiedAt: user.twoFactorVerifiedAt,
    };
  }

  // ── 2FA Validate (without activating) ─────────────────────────────────

  async twoFactorValidate(userId: string, code: string) {
    if (!code || typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('Codigo invalido. Digite os 6 digitos do aplicativo.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA nao esta ativado para este usuario');
    }

    const isCodeValid = this.verifyTOTPCode(user.twoFactorSecret, code);
    if (!isCodeValid) {
      throw new BadRequestException('Codigo de verificacao incorreto');
    }

    return { message: 'Codigo verificado com sucesso' };
  }

  // ── TOTP Helpers ──────────────────────────────────────────────────────

  private generateTOTPSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    return {
      secret: totp.secret.base32,
      otpauthUrl: totp.toString(),
    };
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }
}
