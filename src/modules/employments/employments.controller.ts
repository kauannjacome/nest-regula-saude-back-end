import { Controller, Get, Patch, Param, Body, UseGuards, HttpCode, ParseIntPipe } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmploymentsService } from './employments.service';

@Controller('employments')
export class EmploymentsController extends BaseCrudController {
  constructor(private readonly employmentsService: EmploymentsService) {
    super(employmentsService);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async findPending(@CurrentUser('subscriberId') subscriberId: number) {
    return this.employmentsService.findPending(subscriberId);
  }

  @Patch(':id/respond')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async respond(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
    @Body() body: { action: string; roleId?: string },
  ) {
    return this.employmentsService.respond(id, subscriberId, body.action, body.roleId);
  }
}
