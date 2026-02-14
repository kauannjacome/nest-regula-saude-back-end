import {
  Controller, Post, Get, Param, Query, Body, Req, Res,
  UseGuards, UseInterceptors, UploadedFile, HttpCode,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ── Upload ──────────────────────────────────────────────────────────

  @Post('upload')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
    @Body('category') category?: string,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.upload(
      file,
      subscriberId,
      userId,
      category || folder || 'general',
    );
  }

  // ── Presign ─────────────────────────────────────────────────────────

  @Post('upload/presign')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async presign(
    @CurrentUser('subscriberId') subscriberId: number,
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.presign(
      subscriberId,
      fileName,
      contentType,
      folder || 'general',
    );
  }

  // ── S3 Proxy ────────────────────────────────────────────────────────

  @Get('s3/*')
  @UseGuards(JwtAuthGuard)
  async s3Proxy(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as any;
    // Extract the key from the URL path after /api/s3/
    const fullPath = req.path;
    const s3Key = fullPath.replace(/^\/api\/s3\//, '');

    if (!s3Key) {
      throw new NotFoundException('Chave S3 nao fornecida');
    }

    const result = await this.uploadService.getS3Object(
      s3Key,
      user.subscriberId,
      user.isSystemManager,
    );

    if (!result) {
      throw new NotFoundException('Arquivo nao encontrado');
    }

    res.set({
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(result.contentLength),
    });
    res.send(result.body);
  }

  // ── QR Code Generate ───────────────────────────────────────────────

  @Post('upload/qrcode/generate')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async generateQrCode(
    @Req() req: Request,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('documentType') documentType: string,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.uploadService.generateQrCodeToken(
      subscriberId,
      userId,
      entityType,
      entityId,
      documentType,
      baseUrl,
    );
  }

  // ── QR Code Token Info (public - no TenantGuard) ───────────────────

  @Get('upload/qrcode/:hash')
  @UseGuards(JwtAuthGuard)
  async getQrCodeToken(@Param('hash') hash: string) {
    return this.uploadService.getQrCodeToken(hash);
  }

  // ── QR Code Upload (public - no TenantGuard) ──────────────────────

  @Post('upload/qrcode/:hash')
  @UseInterceptors(FileInterceptor('file'))
  async uploadViaQrCode(
    @Param('hash') hash: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.uploadViaQrCode(hash, file);
  }

  // ── QR Code Status ────────────────────────────────────────────────

  @Get('upload/qrcode/:hash/status')
  @UseGuards(JwtAuthGuard)
  async getQrCodeStatus(@Param('hash') hash: string) {
    return this.uploadService.getQrCodeStatus(hash);
  }
}
