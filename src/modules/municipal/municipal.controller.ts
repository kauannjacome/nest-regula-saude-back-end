import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MunicipalService } from './municipal.service';

@Controller('municipal')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MunicipalController {
  constructor(private readonly municipalService: MunicipalService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser('subscriberId') subscriberId: number) {
    return this.municipalService.getDashboard(subscriberId);
  }
}
