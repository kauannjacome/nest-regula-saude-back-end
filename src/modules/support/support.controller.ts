import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  async getTickets(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.supportService.getTickets(userId, { page: parseInt(page || '1'), limit: parseInt(limit || '50') });
  }

  @Post()
  async createTicket(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.supportService.createTicket(userId, body);
  }
}
