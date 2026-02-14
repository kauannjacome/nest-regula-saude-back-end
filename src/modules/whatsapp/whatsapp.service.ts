import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  async getConfig(subscriberId: number) {
    return this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
  }

  async updateConfig(subscriberId: number, data: any) {
    const existing = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (existing) {
      return this.prisma.whatsAppConfig.update({ where: { id: existing.id }, data });
    }
    return this.prisma.whatsAppConfig.create({ data: { ...data, subscriberId } });
  }

  async connect(subscriberId: number) {
    return { status: 'connecting', subscriberId };
  }

  async disconnect(subscriberId: number) {
    return { status: 'disconnected', subscriberId };
  }

  async send(subscriberId: number, data: { phone: string; message: string }) {
    return { success: true, phone: data.phone };
  }

  async getTemplates(subscriberId: number, params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const where = { subscriberId };
    const [items, total] = await Promise.all([
      this.prisma.whatsAppProgrammed.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.whatsAppProgrammed.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTemplate(subscriberId: number, data: any) {
    return this.prisma.whatsAppProgrammed.create({ data: { ...data, subscriberId } });
  }

  async updateTemplate(id: number, data: any) {
    return this.prisma.whatsAppProgrammed.update({ where: { id }, data });
  }

  async deleteTemplate(id: number) {
    return this.prisma.whatsAppProgrammed.delete({ where: { id } });
  }

  async getRules(subscriberId: number) {
    return this.prisma.notificationRule.findMany({ where: { subscriberId } });
  }

  async getProgrammed(subscriberId: number, params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const where = { subscriberId };
    const [items, total] = await Promise.all([
      this.prisma.whatsAppProgrammed.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.whatsAppProgrammed.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
