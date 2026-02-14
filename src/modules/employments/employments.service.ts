import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class EmploymentsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Vinculo',
      searchFields: ['userId'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.userEmployment;
  }

  async findPending(subscriberId: number) {
    const employments = await this.prisma.userEmployment.findMany({
      where: { subscriberId, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, cpf: true, phoneNumber: true } },
        unit: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return employments.map((emp) => ({
      id: emp.id,
      userId: emp.userId,
      userName: emp.user?.name || null,
      userEmail: emp.user?.email || null,
      userCpf: emp.user?.cpf || null,
      userPhone: emp.user?.phoneNumber || null,
      unitName: emp.unit?.name || null,
      type: emp.invitedById ? 'INVITE' : 'SELF_REGISTRATION',
      invitedByName: emp.invitedBy?.name || null,
      requestedByName: emp.requestedBy?.name || null,
      createdAt: emp.createdAt,
    }));
  }

  async respond(employmentId: number, subscriberId: number, action: string, roleId?: string) {
    if (!['ACCEPT', 'REJECT'].includes(action)) {
      throw new BadRequestException('Acao deve ser ACCEPT ou REJECT');
    }

    const employment = await this.prisma.userEmployment.findFirst({
      where: { id: employmentId, subscriberId, status: 'PENDING' },
    });

    if (!employment) {
      throw new NotFoundException('Solicitacao pendente nao encontrada');
    }

    if (action === 'ACCEPT') {
      if (!roleId) {
        throw new BadRequestException('roleId e obrigatorio para aceitar');
      }

      const role = await this.prisma.tenantRole.findFirst({
        where: { id: roleId, subscriberId, deletedAt: null },
      });

      if (!role) {
        throw new NotFoundException('Perfil nao encontrado');
      }

      const existingActive = await this.prisma.userEmployment.findFirst({
        where: {
          userId: employment.userId,
          subscriberId,
          isActive: true,
          status: 'ACCEPTED',
          id: { not: employmentId },
        },
      });

      await this.prisma.userEmployment.update({
        where: { id: employmentId },
        data: {
          status: 'ACCEPTED',
          isActive: true,
          roleId,
          isPrimary: !existingActive,
          respondedAt: new Date(),
        },
      });

      await this.prisma.notification.create({
        data: {
          subscriberId,
          userId: employment.userId,
          title: 'Solicitacao aceita',
          message: 'Sua solicitacao de acesso foi aceita.',
          type: 'EMPLOYMENT_ACCEPTED',
          employmentId,
        },
      });

      return { message: 'Solicitacao aceita com sucesso.' };
    }

    // REJECT
    await this.prisma.userEmployment.update({
      where: { id: employmentId },
      data: {
        status: 'REJECTED',
        isActive: false,
        respondedAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        subscriberId,
        userId: employment.userId,
        title: 'Solicitacao rejeitada',
        message: 'Sua solicitacao de acesso foi rejeitada.',
        type: 'EMPLOYMENT_REJECTED',
        employmentId,
      },
    });

    return { message: 'Solicitacao rejeitada com sucesso.' };
  }
}
