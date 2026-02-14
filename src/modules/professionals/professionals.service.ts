import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class ProfessionalsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Profissional',
      searchFields: ['name'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.userEmployment;
  }

  async getActiveProfessionals(subscriberId: number, params: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 50, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      employments: {
        some: {
          subscriberId,
          isActive: true,
          status: 'ACCEPTED',
        },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          cpf: true,
          position: true,
          registryType: true,
          registryNumber: true,
          registryState: true,
          createdAt: true,
          employments: {
            where: { subscriberId, isActive: true },
            select: {
              id: true,
              subscriberId: true,
              isPrimary: true,
              tenantRole: { select: { id: true, name: true, displayName: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
