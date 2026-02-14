import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantService } from './tenant.service';

@Controller('tenant')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('roles')
  async getRoles(@CurrentUser('subscriberId') subscriberId: number) {
    return this.tenantService.getRoles(subscriberId);
  }

  @Post('roles')
  async createRole(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.tenantService.createRole(subscriberId, body);
  }

  @Put('roles/:id')
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.tenantService.updateRole(id, body);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.deleteRole(id);
  }

  @Get('permissions')
  async getPermissions() {
    return this.tenantService.getPermissions();
  }

  @Get('settings')
  async getSettings(@CurrentUser('subscriberId') subscriberId: number) {
    return this.tenantService.getSettings(subscriberId);
  }

  @Put('settings')
  async updateSettings(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.tenantService.updateSettings(subscriberId, body);
  }
}
