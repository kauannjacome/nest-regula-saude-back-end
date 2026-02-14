import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProfessionalsController extends BaseCrudController {
  constructor(private readonly professionalsService: ProfessionalsService) {
    super(professionalsService);
  }

  @Get('active')
  async getActiveProfessionals(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.professionalsService.getActiveProfessionals(subscriberId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      search,
    });
  }
}
