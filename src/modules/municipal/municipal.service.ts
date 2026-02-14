import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MunicipalService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(subscriberId: number) {
    const [regulationsCount, citizensCount, schedulesCount, usersCount] = await Promise.all([
      this.prisma.regulation.count({ where: { subscriberId, deletedAt: null } }),
      this.prisma.citizen.count({ where: { subscriberId, deletedAt: null } }),
      this.prisma.schedule.count({ where: { subscriberId, deletedAt: null } }),
      this.prisma.user.count({ where: { employments: { some: { subscriberId, isActive: true } } } }),
    ]);
    return { regulationsCount, citizensCount, schedulesCount, usersCount };
  }
}
