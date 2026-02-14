import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController extends BaseCrudController {
  constructor(private readonly documentsService: DocumentsService) {
    super(documentsService);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getRecentDocuments(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.getRecentDocuments(
      subscriberId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('clean')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async cleanOldDocuments(
    @CurrentUser('subscriberId') subscriberId: number,
    @Body('daysOld') daysOld?: number,
  ) {
    const result = await this.documentsService.cleanOldDocuments(
      subscriberId,
      daysOld || 90,
    );
    return {
      message: `${result.deletedCount} documentos deletados`,
      deletedCount: result.deletedCount,
    };
  }
}
