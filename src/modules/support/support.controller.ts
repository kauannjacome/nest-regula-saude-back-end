import {
  Controller, Get, Post, Patch, Param, Query, Body,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  async getTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTickets(userId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Post()
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.supportService.createTicket(userId, body);
  }

  @Get(':id')
  async getTicketDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
  ) {
    return this.supportService.getTicketDetail(id, userId, isSystemManager);
  }

  @Patch(':id')
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
    @Body() body: any,
  ) {
    return this.supportService.updateTicket(id, userId, isSystemManager, body);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
    @Body() body: any,
  ) {
    return this.supportService.addMessage(id, userId, isSystemManager, body);
  }

  @Post(':id/resolve')
  async resolveTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
    @Body() body: any,
  ) {
    return this.supportService.resolveTicket(id, userId, isSystemManager, body);
  }
}
