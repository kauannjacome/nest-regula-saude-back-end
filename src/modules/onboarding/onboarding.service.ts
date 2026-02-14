import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    return this.prisma.userOnboarding.findFirst({ where: { userId } });
  }

  async updateStep(userId: string, data: any) {
    const existing = await this.prisma.userOnboarding.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.userOnboarding.update({ where: { id: existing.id }, data });
    }
    return this.prisma.userOnboarding.create({ data: { ...data, userId } });
  }

  async importData(data: any) {
    return { success: true };
  }
}
