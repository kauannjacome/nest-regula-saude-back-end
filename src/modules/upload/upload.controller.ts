import { Controller, Post, Get, Query, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @CurrentUser('subscriberId') subscriberId: number,
    @Body('folder') folder: string,
  ) {
    return this.uploadService.upload(file, subscriberId, folder || 'uploads');
  }

  @Get('presign')
  async getSignedUrl(@Query('key') key: string) {
    return this.uploadService.getSignedUrl(key);
  }
}
