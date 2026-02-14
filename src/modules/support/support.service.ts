import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(bytes[i] % chars.length);
  }
  return password;
}

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(userId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTicket(userId: string, data: any) {
    return this.prisma.supportTicket.create({ data: { ...data, userId } });
  }

  // ── Ticket Detail ──────────────────────────────────────────────────

  async getTicketDetail(ticketId: number, userId: string, isSystemManager: boolean) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        subscriber: {
          select: { id: true, name: true, municipalityName: true, email: true, telephone: true },
        },
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
          where: isSystemManager ? {} : { isInternal: false },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket nao encontrado');
    }

    if (!isSystemManager && ticket.userId !== userId) {
      throw new ForbiddenException('Sem permissao');
    }

    return ticket;
  }

  // ── Update Ticket ──────────────────────────────────────────────────

  async updateTicket(ticketId: number, userId: string, isSystemManager: boolean, body: any) {
    if (!isSystemManager) {
      throw new ForbiddenException('Apenas System Manager pode atualizar tickets');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket nao encontrado');
    }

    const { status, priority, assignedToId, resolution } = body;
    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (!ticket.firstResponseAt && status === 'IN_PROGRESS') {
        updateData.firstResponseAt = new Date();
      }

      if (['RESOLVED', 'CLOSED', 'CANCELED'].includes(status)) {
        updateData.resolvedById = userId;
        updateData.resolvedAt = new Date();
        if (status === 'CLOSED') {
          updateData.closedAt = new Date();
        }
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId) {
        updateData.assignedAt = new Date();
      }
    }

    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        subscriber: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    return { message: 'Ticket atualizado', ticket: updatedTicket };
  }

  // ── Add Message ────────────────────────────────────────────────────

  async addMessage(ticketId: number, userId: string, isSystemManager: boolean, body: any) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket nao encontrado');
    }

    const isOwner = ticket.userId === userId;
    if (!isSystemManager && !isOwner) {
      throw new ForbiddenException('Sem permissao');
    }

    const { message, isInternal = false, attachments } = body;

    if (!message || message.trim() === '') {
      throw new BadRequestException('Mensagem e obrigatoria');
    }

    if (isInternal && !isSystemManager) {
      throw new ForbiddenException('Apenas System Manager pode criar notas internas');
    }

    const newMessage = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId,
        message: message.trim(),
        isInternal,
        isFromUser: isOwner && !isSystemManager,
        attachments: attachments || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // If support responded, update status and first response time
    if (isSystemManager && !isInternal) {
      const updateData: any = {};

      if (!ticket.firstResponseAt) {
        updateData.firstResponseAt = new Date();
      }

      if (ticket.status === 'OPEN' || ticket.status === 'WAITING_USER') {
        updateData.status = 'IN_PROGRESS';
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.supportTicket.update({
          where: { id: ticketId },
          data: updateData,
        });
      }
    }

    // If user responded, change from WAITING_USER to IN_PROGRESS
    if (isOwner && ticket.status === 'WAITING_USER') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return { message: newMessage };
  }

  // ── Resolve Ticket ─────────────────────────────────────────────────

  async resolveTicket(ticketId: number, userId: string, isSystemManager: boolean, body: any) {
    if (!isSystemManager) {
      throw new ForbiddenException('Apenas System Manager pode resolver tickets');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket nao encontrado');
    }

    if (['RESOLVED', 'CLOSED', 'CANCELED'].includes(ticket.status)) {
      throw new BadRequestException('Ticket ja foi resolvido ou cancelado');
    }

    if (!ticket.userId) {
      throw new BadRequestException('Ticket sem usuario vinculado');
    }

    const { action, resolution } = body;
    const result: any = { success: true };

    const actionToExecute = action || ticket.subcategory;

    if (actionToExecute === 'password_reset' || actionToExecute === 'login_error') {
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await Promise.all([
        this.prisma.user.update({
          where: { id: ticket.userId },
          data: {
            passwordHash: hashedPassword,
            isPasswordTemp: true,
            numberTry: 0,
            numberTry2FA: 0,
            isBlocked: false,
          },
        }),
        this.prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            resolvedById: userId,
            resolvedAt: new Date(),
            resolution: resolution || `Senha resetada. Nova senha temporaria: ${tempPassword}`,
          },
        }),
        this.prisma.supportTicketMessage.create({
          data: {
            ticketId,
            userId,
            message: `Senha do usuario foi resetada.\n\nNova senha temporaria: ${tempPassword}\n\nO usuario devera trocar a senha no proximo login.`,
            isInternal: true,
            isFromUser: false,
          },
        }),
      ]);

      result.message = 'Senha resetada com sucesso';
      result.tempPassword = tempPassword;
      result.userName = ticket.user?.name;
      result.userEmail = ticket.user?.email;

    } else if (actionToExecute === '2fa_reset' || actionToExecute === 'two_factor_reset') {
      await Promise.all([
        this.prisma.user.update({
          where: { id: ticket.userId },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorVerifiedAt: null,
            twoFactorResetRequired: true,
          },
        }),
        this.prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            resolvedById: userId,
            resolvedAt: new Date(),
            resolution: resolution || '2FA resetado. Usuario devera configurar novamente no proximo login.',
          },
        }),
        this.prisma.supportTicketMessage.create({
          data: {
            ticketId,
            userId,
            message: 'Autenticacao de dois fatores (2FA) foi desativada.\n\nO usuario precisara configurar novamente no proximo login.',
            isInternal: false,
            isFromUser: false,
          },
        }),
      ]);

      result.message = '2FA resetado com sucesso';
      result.userName = ticket.user?.name;
      result.userEmail = ticket.user?.email;

    } else if (actionToExecute === 'unblock_user') {
      await Promise.all([
        this.prisma.user.update({
          where: { id: ticket.userId },
          data: {
            isBlocked: false,
            numberTry: 0,
            numberTry2FA: 0,
          },
        }),
        this.prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            resolvedById: userId,
            resolvedAt: new Date(),
            resolution: resolution || 'Usuario desbloqueado.',
          },
        }),
      ]);

      result.message = 'Usuario desbloqueado com sucesso';
      result.userName = ticket.user?.name;

    } else {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'RESOLVED',
          resolvedById: userId,
          resolvedAt: new Date(),
          resolution: resolution || 'Resolvido manualmente.',
        },
      });

      result.message = 'Ticket marcado como resolvido';
    }

    return result;
  }
}
