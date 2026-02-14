import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService, normalizeString } from '../../crud/base-crud.service';
import { S3Service } from '../../common/services/s3.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService extends BaseCrudService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
    super({
      modelName: 'Usuario',
      searchFields: ['name', 'email'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.user;
  }

  protected buildSubscriberFilter(subscriberId: number) {
    return {
      employments: {
        some: { subscriberId, isActive: true, status: 'ACCEPTED' },
      },
    };
  }

  // ── Reset Password ────────────────────────────────────────────────────

  async resetPassword(targetUserId: string, requesterId: string, subscriberId: number, isSystemManager: boolean, reset2FA?: boolean) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        employments: {
          where: { isActive: true, status: 'ACCEPTED' },
          select: { subscriberId: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    // Check subscriber access
    if (!isSystemManager) {
      const belongsToSubscriber = targetUser.employments.some((e) => e.subscriberId === subscriberId);
      if (!belongsToSubscriber) {
        throw new ForbiddenException('Usuario nao pertence ao seu subscriber');
      }
    }

    // Cannot reset SM password unless requester is also SM
    if (targetUser.isSystemManager && !isSystemManager) {
      throw new ForbiddenException('Nao e possivel resetar senha de administrador do sistema');
    }

    // Generate temp password
    const tempPassword = crypto.randomBytes(5).toString('hex'); // 10 chars
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const updateData: any = {
      passwordHash,
      isPasswordTemp: true,
      isBlocked: false,
      numberTry: 0,
    };

    if (reset2FA) {
      updateData.twoFactorEnabled = false;
      updateData.twoFactorSecret = null;
      updateData.twoFactorVerifiedAt = null;
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Senha resetada com sucesso',
      tempPassword,
      userName: targetUser.name,
      userEmail: targetUser.email,
    };
  }

  // ── Reset 2FA ─────────────────────────────────────────────────────────

  async reset2FA(targetUserId: string, subscriberId: number, isSystemManager: boolean) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        employments: {
          where: { isActive: true, status: 'ACCEPTED' },
          select: { subscriberId: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (!isSystemManager) {
      const belongsToSubscriber = targetUser.employments.some((e) => e.subscriberId === subscriberId);
      if (!belongsToSubscriber) {
        throw new ForbiddenException('Usuario nao pertence ao seu subscriber');
      }
    }

    if (targetUser.isSystemManager && !isSystemManager) {
      throw new ForbiddenException('Nao e possivel resetar 2FA de administrador do sistema');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
        twoFactorResetRequired: true,
      },
    });

    return {
      success: true,
      message: '2FA resetado com sucesso. O usuario precisara configurar novamente no proximo login.',
      userName: targetUser.name,
      userEmail: targetUser.email,
    };
  }

  // ── User Documents ────────────────────────────────────────────────────

  async listDocuments(targetUserId: string) {
    const documents = await this.prisma.upload.findMany({
      where: {
        userId: targetUserId,
        entityType: 'USER_DOCUMENT',
        deletedAt: null,
      },
      include: {
        uploader: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => ({
      ...doc,
      isExpired: doc.expiryDays
        ? new Date() > new Date(doc.createdAt.getTime() + doc.expiryDays * 86400000)
        : false,
      expiryDate: doc.expiryDays
        ? new Date(doc.createdAt.getTime() + doc.expiryDays * 86400000)
        : null,
    }));
  }

  async uploadDocument(
    targetUserId: string,
    subscriberId: number,
    uploaderId: string,
    file: Express.Multer.File,
    documentType?: string,
    category?: string,
    expiryDays?: number,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo nao fornecido');
    }

    const s3Key = `${subscriberId}/users/${targetUserId}/documents/${Date.now()}-${file.originalname}`;

    await this.s3Service.uploadToS3({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
      metadata: {
        userId: targetUserId,
        documentType: documentType || 'OTHER',
        uploadedBy: uploaderId,
      },
    });

    const upload = await this.prisma.upload.create({
      data: {
        userId: targetUserId,
        subscriberId,
        documentType: (documentType as any) || null,
        category: (category as any) || null,
        entityType: 'USER_DOCUMENT',
        entityId: targetUserId,
        fileName: file.originalname,
        fileUrl: `/api/s3/${s3Key}`,
        s3Key,
        s3Bucket: this.s3Service.getBucket(),
        s3Region: this.s3Service.getRegion(),
        fileSize: file.size,
        mimeType: file.mimetype,
        expiryDays: expiryDays || null,
        uploaderId,
      },
    });

    return upload;
  }

  async deleteDocument(targetUserId: string, docId: number) {
    const doc = await this.prisma.upload.findFirst({
      where: {
        id: docId,
        userId: targetUserId,
        entityType: 'USER_DOCUMENT',
        deletedAt: null,
      },
    });

    if (!doc) {
      throw new NotFoundException('Documento nao encontrado');
    }

    await this.prisma.upload.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async accessDocument(docId: number, userId: string, action: string, justification: string, ipAddress: string, userAgent: string) {
    if (!justification || justification.length < 10) {
      throw new BadRequestException('Justificativa deve ter no minimo 10 caracteres');
    }

    if (!['VIEW', 'DOWNLOAD'].includes(action)) {
      throw new BadRequestException('Acao deve ser VIEW ou DOWNLOAD');
    }

    const doc = await this.prisma.upload.findFirst({
      where: { id: docId, deletedAt: null },
    });

    if (!doc) {
      throw new NotFoundException('Documento nao encontrado');
    }

    await this.prisma.uploadAccessLog.create({
      data: {
        uploadId: docId,
        userId,
        action: action as any,
        justification,
        ipAddress,
        userAgent,
      },
    });

    let url = doc.fileUrl;
    if (action === 'DOWNLOAD' && doc.s3Key) {
      url = await this.s3Service.getPresignedUrl(doc.s3Key, 300);
    }

    return { url, action };
  }

  // ── User Employments ──────────────────────────────────────────────────

  async listEmployments(targetUserId: string) {
    return this.prisma.userEmployment.findMany({
      where: { userId: targetUserId },
      include: {
        subscriber: { select: { id: true, name: true, municipalityName: true } },
        unit: { select: { id: true, name: true } },
        tenantRole: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmployment(targetUserId: string, subscriberId: number, unitId?: number, roleId?: string, isPrimary?: boolean) {
    // Check duplicate
    const existing = await this.prisma.userEmployment.findFirst({
      where: {
        userId: targetUserId,
        subscriberId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existing) {
      throw new ConflictException('Usuario ja possui vinculo com este subscriber');
    }

    return this.prisma.userEmployment.create({
      data: {
        userId: targetUserId,
        subscriberId,
        unitId: unitId || null,
        roleId: roleId || null,
        isPrimary: isPrimary || false,
        isActive: true,
        status: 'ACCEPTED',
      },
    });
  }

  async deleteEmployment(employmentId: number) {
    const employment = await this.prisma.userEmployment.findUnique({
      where: { id: employmentId },
    });

    if (!employment) {
      throw new NotFoundException('Vinculo nao encontrado');
    }

    await this.prisma.userEmployment.delete({
      where: { id: employmentId },
    });

    return { success: true };
  }

  async updateEmployment(employmentId: number, data: { isActive?: boolean; roleId?: string; unitId?: number }) {
    const employment = await this.prisma.userEmployment.findUnique({
      where: { id: employmentId },
    });

    if (!employment) {
      throw new NotFoundException('Vinculo nao encontrado');
    }

    return this.prisma.userEmployment.update({
      where: { id: employmentId },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.unitId !== undefined && { unitId: data.unitId }),
      },
    });
  }

  // ── Invite ────────────────────────────────────────────────────────────

  async invite(subscriberId: number, invitedById: string, targetUserId: string, roleId: string) {
    // Verify target user exists
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    // Verify role exists and belongs to subscriber
    const role = await this.prisma.tenantRole.findFirst({
      where: { id: roleId, subscriberId, deletedAt: null },
    });

    if (!role) {
      throw new NotFoundException('Perfil nao encontrado');
    }

    // Check inviter's role priority
    const inviterEmployment = await this.prisma.userEmployment.findFirst({
      where: { userId: invitedById, subscriberId, isActive: true, status: 'ACCEPTED' },
      include: { tenantRole: { select: { priority: true } } },
    });

    if (inviterEmployment?.tenantRole && role.priority > (inviterEmployment.tenantRole.priority || 0)) {
      throw new ForbiddenException('Voce nao pode convidar para um perfil com prioridade superior ao seu');
    }

    // Check existing employment
    const existing = await this.prisma.userEmployment.findFirst({
      where: {
        userId: targetUserId,
        subscriberId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existing) {
      throw new ConflictException('Usuario ja possui vinculo ou convite pendente');
    }

    const employment = await this.prisma.userEmployment.create({
      data: {
        userId: targetUserId,
        subscriberId,
        roleId,
        status: 'PENDING',
        isActive: false,
        isPrimary: false,
        invitedById,
        invitedAt: new Date(),
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        subscriberId,
        userId: targetUserId,
        title: 'Novo convite de acesso',
        message: 'Voce recebeu um convite para acessar o sistema.',
        type: 'EMPLOYMENT_INVITED',
        employmentId: employment.id,
      },
    });

    return { message: 'Convite enviado com sucesso.', employmentId: employment.id };
  }

  // ── Lookup ────────────────────────────────────────────────────────────

  async lookup(cpf: string, subscriberId: number) {
    if (!cpf) {
      throw new BadRequestException('CPF e obrigatorio');
    }

    const cleanedCpf = cpf.replace(/\D/g, '');
    if (cleanedCpf.length !== 11) {
      throw new BadRequestException('CPF invalido');
    }

    // Format CPF
    const formattedCpf = cleanedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ cpf: formattedCpf }, { cpf: cleanedCpf }],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phoneNumber: true,
        employments: {
          where: { subscriberId },
          select: { id: true, status: true, isActive: true },
        },
      },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phoneNumber: user.phoneNumber,
      },
      hasEmployment: user.employments.length > 0,
      employmentStatus: user.employments[0]?.status || null,
    };
  }
}
