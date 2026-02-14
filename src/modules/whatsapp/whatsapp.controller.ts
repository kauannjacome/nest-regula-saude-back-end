import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('config')
  async getConfig(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getConfig(subscriberId);
  }

  @Put('config')
  async updateConfig(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.updateConfig(subscriberId, body);
  }

  @Post('connect')
  async connect(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.connect(subscriberId);
  }

  @Post('disconnect')
  async disconnect(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.disconnect(subscriberId);
  }

  @Post('send')
  async send(@CurrentUser('subscriberId') subscriberId: number, @Body() body: any) {
    return this.whatsappService.send(subscriberId, body);
  }

  @Get('templates')
  async getTemplates(@CurrentUser('subscriberId') subscriberId: number, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.whatsappService.getTemplates(subscriberId, { page: parseInt(page || '1'), limit: parseInt(limit || '50') });
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

  @Get('rules')
  async getRules(@CurrentUser('subscriberId') subscriberId: number) {
    return this.whatsappService.getRules(subscriberId);
  }

  @Get('programmed')
  async getProgrammed(@CurrentUser('subscriberId') subscriberId: number, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.whatsappService.getProgrammed(subscriberId, { page: parseInt(page || '1'), limit: parseInt(limit || '50') });
  }
}
