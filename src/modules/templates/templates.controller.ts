import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('available')
  async getAvailable(
    @Query('regulationId') regulationId?: string,
    @Query('citizenId') citizenId?: string,
  ) {
    return this.templatesService.getAvailableTemplates(
      regulationId ? parseInt(regulationId) : undefined,
      citizenId ? parseInt(citizenId) : undefined,
    );
  }

  @Post('print')
  async print(
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('name') userName: string,
    @Body() body: any,
  ) {
    return this.templatesService.printTemplate({
      subscriberId,
      userId,
      userName: userName || 'Usuario do Sistema',
      templateTypes: body.templateTypes,
      regulationId: body.regulationId,
      citizenId: body.citizenId,
      documentDate: body.documentDate,
      download: body.download,
    });
  }
}
