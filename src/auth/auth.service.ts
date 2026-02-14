import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';

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

  private verifyTOTPCode(secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: 'NextSaude',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }
}
