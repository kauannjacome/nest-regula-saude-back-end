import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // ========== CONFIG ==========

  @Get('config')
  async getConfig(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getConfig(subscriberId);
  }

  @Put('config')
  async updateConfig(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.updateConfig(subscriberId, body);
  }

  // ========== CONNECT / DISCONNECT / STATUS ==========

  @Post('connect')
  async connect(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.connect(subscriberId, body);
  }

  @Get('connect')
  async getConnectionStatus(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getConnectionStatus(subscriberId);
  }

  @Post('disconnect')
  async disconnect(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.disconnect(subscriberId);
  }

  // ========== SEND ==========

  @Post('send')
  async send(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.send(subscriberId, body);
  }

  // ========== RECONNECT ==========

  @Post('reconnect')
  async reconnect(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.reconnect(subscriberId);
  }

  // ========== WEBHOOK ==========

  @Get('webhook')
  async webhookHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.whatsappService.handleWebhook(body);
  }

  // ========== SYNC ==========

  @Post('sync')
  async sync() {
    return this.whatsappService.syncAll();
  }

  // ========== TEST ==========

  @Get('test')
  async getTestStatus(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getTestStatus(subscriberId);
  }

  @Post('test')
  async sendTest(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.sendTest(subscriberId, body);
  }

  // ========== TEMPLATES ==========

  @Get('templates')
  async getTemplates(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.getTemplates(subscriberId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Post('templates')
  async createTemplate(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.createTemplate(subscriberId, body);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.whatsappService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.whatsappService.deleteTemplate(id);
  }

  // ========== TEMPLATES BY TRIGGER ==========

  @Get('templates-by-trigger')
  async getTemplatesByTrigger(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('trigger') trigger: string,
  ) {
    return this.whatsappService.getTemplatesByTrigger(subscriberId, trigger);
  }

  // ========== RULES ==========

  @Get('rules')
  async getRules(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getRules(subscriberId);
  }

  @Post('rules')
  async createRule(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.createRule(subscriberId, body);
  }

  @Put('rules/:id')
  async updateRule(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.whatsappService.updateRule(id, body);
  }

  @Delete('rules/:id')
  async deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.whatsappService.deleteRule(id);
  }

  // ========== AVAILABLE PROVIDERS ==========

  @Get('available-providers')
  async getAvailableProviders() {
    return this.whatsappService.getAvailableProviders();
  }

  // ========== NOTIFICATION PREFERENCES ==========

  @Get('notification-preferences')
  async getNotificationPreferences(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getNotificationPreferences(subscriberId);
  }

  @Put('notification-preferences')
  async updateNotificationPreference(
    @CurrentUser('subscriberId') subscriberId: number,
    @Body() body: any,
  ) {
    return this.whatsappService.updateNotificationPreference(subscriberId, body);
  }

  // ========== PROGRAMMED ==========

  @Get('programmed')
  async getProgrammed(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.getProgrammed(subscriberId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }
}
