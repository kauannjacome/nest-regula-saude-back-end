import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  async getStatus(@CurrentUser('id') userId: string) {
    return this.onboardingService.getStatus(userId);
  }

  @Put()
  async updateStep(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.onboardingService.updateStep(userId, body);
  }

  @Post('import')
  async importData(@Body() body: any) {
    return this.onboardingService.importData(body);
  }
}
