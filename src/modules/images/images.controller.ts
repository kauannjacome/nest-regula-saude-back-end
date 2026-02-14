import {
  Controller, Get, Post, Delete, Param, Query, Body,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImagesService } from './images.service';

@Controller('images')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  async listImages(
    @CurrentUser('subscriberId') subscriberId: number,
    @Query('format') format?: string,
    @Query('security') security?: string,
    @Query('uploadedBy') uploadedBy?: string,
  ) {
    return this.imagesService.listImages(subscriberId, { format, security, uploadedBy });
  }

  @Post()
  async createImage(@Body() body: any) {
    return this.imagesService.createImage(body);
  }

  @Get(':id')
  async getImage(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.getImageById(id);
  }

  @Delete(':id')
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.imagesService.deleteImage(id, subscriberId);
  }

  @Post(':id/sign')
  async signImage(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: string,
  ) {
    return this.imagesService.signImage(id, userId);
  }

  @Post(':id/signed-url')
  async getSignedUrl(
    @Param('id', ParseIntPipe) id: number,
    @Body('expiresInHours') expiresInHours?: number,
  ) {
    return this.imagesService.getSignedUrl(id, expiresInHours || 24);
  }
}
