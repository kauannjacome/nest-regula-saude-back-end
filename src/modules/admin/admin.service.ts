import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [subscribersCount, usersCount, regulationsCount] = await Promise.all([
      this.prisma.subscriber.count(),
      this.prisma.user.count(),
      this.prisma.regulation.count({ where: { deletedAt: null } }),
    ]);
    return { subscribersCount, usersCount, regulationsCount };
  }

  async getSubscribers(params: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 50, search = '' } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [items, total] = await Promise.all([
      this.prisma.subscriber.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.subscriber.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSubscriber(id: number) {
    const item = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Assinante nao encontrado');
    return item;
  }

  async updateSubscriber(id: number, data: any) {
    await this.getSubscriber(id);
    return this.prisma.subscriber.update({ where: { id }, data });
  }

  async getMonitoring() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async getRoutines() {
    return { routines: [] };
  }

  async executeRoutine(name: string) {
    return { success: true, routine: name };
  }

  async getSettings() {
    return this.prisma.systemConfig.findMany();
  }

  async updateSettings(data: any) {
    return data;
  }

  async getAuditLogs(params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getTrash(subscriberId: number, params: { page: number; limit: number }) {
    return { data: [], pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 0 } };
  }

  async getBackups(params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.backupHistory.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.backupHistory.count(),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async enterSubscriber(userId: string, subscriberId: number) {
    return { subscriberId };
  }

  async exitSubscriber(userId: string) {
    return { success: true };
  }
}
