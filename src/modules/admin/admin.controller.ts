import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemManagerGuard } from '../../common/guards/system-manager.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, SystemManagerGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== DASHBOARD ==========

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // ========== SUBSCRIBERS ==========

  @Get('subscribers')
  async getSubscribers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getSubscribers({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      search,
    });
  }

  @Post('subscribers')
  async createSubscriber(@Body() body: any) {
    return this.adminService.createSubscriber(body);
  }

  @Get('subscribers/:id')
  async getSubscriber(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSubscriber(id);
  }

  @Put('subscribers/:id')
  async updateSubscriber(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.updateSubscriber(id, body);
  }

  // ========== SUBSCRIBER USERS ==========

  @Get('subscribers/:id/users')
  async getSubscriberUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getSubscriberUsers(id, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      search,
    });
  }

  @Post('subscribers/:id/users')
  async createSubscriberUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.createSubscriberUser(id, body);
  }

  @Get('subscribers/:id/users/:userId')
  async getSubscriberUser(@Param('id', ParseIntPipe) id: number, @Param('userId') userId: string) {
    return this.adminService.getSubscriberUser(id, userId);
  }

  @Put('subscribers/:id/users/:userId')
  async updateSubscriberUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    return this.adminService.updateSubscriberUser(id, userId, body);
  }

  @Delete('subscribers/:id/users/:userId')
  async deleteSubscriberUser(@Param('id', ParseIntPipe) id: number, @Param('userId') userId: string) {
    return this.adminService.deleteSubscriberUser(id, userId);
  }

  // ========== SUBSCRIBER NOTIFICATIONS ==========

  @Get('subscribers/:id/notifications')
  async getSubscriberNotifications(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSubscriberNotifications(id);
  }

  // ========== SYSTEM STATS ==========

  @Get('system-stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // ========== MONITORING ==========

  @Get('monitoring')
  async getMonitoring() {
    return this.adminService.getMonitoring();
  }

  // ========== ROUTINES ==========

  @Get('routines')
  async getRoutines() {
    return this.adminService.getRoutines();
  }

  @Post('routines/:name/execute')
  async executeRoutine(@Param('name') name: string) {
    return this.adminService.executeRoutine(name);
  }

  // ========== SETTINGS ==========

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() body: any) {
    return this.adminService.updateSettings(body);
  }

  // ========== AUDIT LOGS ==========

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  // ========== TRASH ==========

  @Get('trash')
  async getTrash(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTrash(subscriberId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Post('trash/restore')
  async restoreTrash(@Body() body: { type: string; id: string }) {
    return this.adminService.restoreTrash(body.type, body.id);
  }

  // ========== BACKUPS ==========

  @Get('backups')
  async getBackups(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getBackups({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Post('backups')
  async createBackup(@CurrentUser('id') userId: string) {
    return this.adminService.createBackup(userId);
  }

  @Delete('backups/:id')
  async deleteBackup(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteBackup(id);
  }

  @Get('backups/config')
  async getBackupConfig() {
    return this.adminService.getBackupConfig();
  }

  @Put('backups/config')
  async updateBackupConfig(@Body() body: any) {
    return this.adminService.updateBackupConfig(body);
  }

  @Get('backups/download/:id')
  async getBackupDownload(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getBackupDownloadUrl(id);
  }

  // ========== ADMIN USERS ==========

  @Get('users')
  async getAdminUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('subscriberId') subscriberId?: string,
  ) {
    return this.adminService.getAdminUsers({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      search,
      status,
      subscriberId: subscriberId ? parseInt(subscriberId) : undefined,
    });
  }

  @Patch('users/:userId')
  async updateAdminUser(@Param('userId') userId: string, @Body() body: any) {
    return this.adminService.updateAdminUser(userId, body);
  }

  // ========== WHATSAPP PROVIDERS ==========

  @Get('whatsapp-providers')
  async getWhatsappProviders() {
    return this.adminService.getWhatsappProviders();
  }

  @Post('whatsapp-providers')
  async createWhatsappProvider(@Body() body: any) {
    return this.adminService.createWhatsappProvider(body);
  }

  @Get('whatsapp-providers/:id')
  async getWhatsappProvider(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getWhatsappProvider(id);
  }

  @Put('whatsapp-providers/:id')
  async updateWhatsappProvider(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.updateWhatsappProvider(id, body);
  }

  @Delete('whatsapp-providers/:id')
  async deleteWhatsappProvider(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteWhatsappProvider(id);
  }

  @Post('whatsapp-providers/:id/test')
  async testWhatsappProvider(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.testWhatsappProvider(id);
  }

  // ========== EXPORT ==========

  @Post('export')
  async exportData(@Body() body: any) {
    return this.adminService.exportData(body);
  }

  // ========== RESET ==========

  @Get('reset')
  async getResetCounts(@Query('subscriberId') subscriberId?: string) {
    return this.adminService.getResetCounts(subscriberId ? parseInt(subscriberId) : undefined);
  }

  @Post('reset')
  async resetData(@Body() body: any) {
    return this.adminService.resetData(body);
  }

  // ========== ENTER/EXIT SUBSCRIBER ==========

  @Post('enter-subscriber/:id')
  async enterSubscriber(@CurrentUser('id') userId: string, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.enterSubscriber(userId, id);
  }

  @Post('exit-subscriber')
  async exitSubscriber(@CurrentUser('id') userId: string) {
    return this.adminService.exitSubscriber(userId);
  }
}
