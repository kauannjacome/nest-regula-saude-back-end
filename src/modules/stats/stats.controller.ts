import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('documents')
  async getDocumentStats(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.statsService.getDocumentStats(subscriberId, dateFrom, dateTo);
  }

  @Get('storage')
  async getStorageStats(@CurrentUser('subscriberId') subscriberId: number) {
    return this.statsService.getStorageStats(subscriberId);
  }
}
