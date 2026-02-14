import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(subscriberId: number, params: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 50, search = '' } = params;
    const skip = (page - 1) * limit;
    const where: any = { subscriberId };
    if (search) {
      where.OR = [
        { action: { equals: search as any } },
        { objectType: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { occurredAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
