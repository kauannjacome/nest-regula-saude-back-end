import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(subscriberId: number, userId: string) {
    // Get current user's role priority
    const currentEmployment = await this.prisma.userEmployment.findFirst({
      where: { userId, subscriberId, isActive: true, status: 'ACCEPTED' },
      include: { tenantRole: { select: { priority: true } } },
    });

    const currentPriority = currentEmployment?.tenantRole?.priority ?? 0;

    // Get all roles for this subscriber with priority <= current user
    const roles = await this.prisma.tenantRole.findMany({
      where: {
        subscriberId,
        deletedAt: null,
        priority: { lte: currentPriority },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        priority: true,
      },
      orderBy: { priority: 'desc' },
    });

    return roles;
  }
}
