import { Controller, Get, Put, Post, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemManagerGuard } from '../../common/guards/system-manager.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, SystemManagerGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('subscribers')
  async getSubscribers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.adminService.getSubscribers({ page: parseInt(page || '1'), limit: parseInt(limit || '50'), search });
  }

  @Get('subscribers/:id')
  async getSubscriber(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSubscriber(id);
  }

  @Put('subscribers/:id')
  async updateSubscriber(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.updateSubscriber(id, body);
  }

  @Get('monitoring')
  async getMonitoring() {
    return this.adminService.getMonitoring();
  }

  @Get('routines')
  async getRoutines() {
    return this.adminService.getRoutines();
  }

  @Post('routines/:name/execute')
  async executeRoutine(@Param('name') name: string) {
    return this.adminService.executeRoutine(name);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() body: any) {
    return this.adminService.updateSettings(body);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs({ page: parseInt(page || '1'), limit: parseInt(limit || '50') });
  }

  @Get('trash')
  async getTrash(@CurrentUser('subscriberId') subscriberId: number, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getTrash(subscriberId, { page: parseInt(page || '1'), limit: parseInt(limit || '50') });
  }

  @Get('backups')
  async getBackups(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getBackups({ page: parseInt(page || '1'), limit: parseInt(limit || '50') });
  }

  @Post('enter-subscriber/:id')
  async enterSubscriber(@CurrentUser('id') userId: string, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.enterSubscriber(userId, id);
  }

  @Post('exit-subscriber')
  async exitSubscriber(@CurrentUser('id') userId: string) {
    return this.adminService.exitSubscriber(userId);
  }
}
