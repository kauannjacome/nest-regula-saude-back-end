import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string, subscriberId: number) {
    return this.prisma.userOnboarding.findFirst({ where: { userId, subscriberId } });
  }

  async updateStep(userId: string, subscriberId: number, data: any) {
    const existing = await this.prisma.userOnboarding.findFirst({ where: { userId, subscriberId } });
    if (existing) {
      return this.prisma.userOnboarding.update({ where: { id: existing.id }, data });
    }
    return this.prisma.userOnboarding.create({ data: { ...data, userId, subscriberId } });
  }

  async importData(subscriberId: number, data: any) {
    return { success: true };
  }
}
