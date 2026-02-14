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
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
