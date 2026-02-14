import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
