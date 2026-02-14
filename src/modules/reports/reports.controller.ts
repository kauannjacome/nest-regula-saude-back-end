import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController extends BaseCrudController {
  constructor(private readonly reportsService: ReportsService) {
    super(reportsService);
  }
}

@Controller('generated-reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class GeneratedReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async list(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('reportType') reportType?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportsService.listGeneratedReports(subscriberId, {
      reportType,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Post()
  async create(
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    // Fetch subscriber data for header
    return this.reportsService.createGeneratedReport({
      subscriberId,
      userId,
      reportType: body.reportType,
      title: body.title,
      description: body.description,
      headerData: body.headerData || {},
      filtersUsed: body.filters || {},
      columns: body.columns || [],
      reportData: body.data || [],
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.reportsService.getGeneratedReport(id, subscriberId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.reportsService.deleteGeneratedReport(id, subscriberId);
  }
}
