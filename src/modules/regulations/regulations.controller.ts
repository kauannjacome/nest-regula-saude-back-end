import {
  Controller, Get, Post, Delete, Param, Query, Body,
  UseGuards, UseInterceptors, UploadedFile, HttpCode, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
export class RegulationsController extends BaseCrudController {
  constructor(private readonly regulationsService: RegulationsService) {
    super(regulationsService);
  }

  @Get(':id/schedules')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async findSchedules(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.regulationsService.findSchedules(id, subscriberId);
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') uploaderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('tag') tag?: string,
  ) {
    return this.regulationsService.uploadAttachment(id, subscriberId, uploaderId, file, tag);
  }

  @Delete(':id/attachments')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async deleteAttachment(
    @Query('uploadId', ParseIntPipe) uploadId: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.regulationsService.deleteAttachment(uploadId, subscriberId);
  }
}
