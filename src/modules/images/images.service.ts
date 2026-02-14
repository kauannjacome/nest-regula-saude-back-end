import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async listImages(subscriberId: number, filters?: {
    format?: string;
    security?: string;
    uploadedBy?: string;
  }) {
    const where: any = {
      subscriberId,
      deletedAt: null,
      mimeType: { startsWith: 'image/' },
    };

    if (filters?.format) {
      where.mimeType = { contains: filters.format.toLowerCase() };
    }
    if (filters?.security) {
      where.securityLevel = filters.security;
    }
    if (filters?.uploadedBy) {
      where.uploaderId = filters.uploadedBy;
    }

    return this.prisma.upload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createImage(data: {
    subscriberId: number;
    fileName: string;
    originalName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    security?: string;
    uploadedBy?: string;
    s3Bucket?: string;
    s3Key?: string;
    s3Region?: string;
  }) {
    return this.prisma.upload.create({
      data: {
        subscriberId: data.subscriberId,
        fileName: data.fileName,
        originalName: data.originalName,
        fileUrl: data.fileUrl,
        fileType: data.mimeType,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        securityLevel: (data.security as any) || 'PUBLIC',
        uploaderId: data.uploadedBy || null,
        s3Bucket: data.s3Bucket || null,
        s3Key: data.s3Key || null,
        s3Region: data.s3Region || null,
      },
    });
  }

  async getImageById(id: number) {
    const image = await this.prisma.upload.findFirst({
      where: { id, deletedAt: null, mimeType: { startsWith: 'image/' } },
    });

    if (!image) {
      throw new NotFoundException('Imagem nao encontrada');
    }

    return image;
  }

  async deleteImage(id: number, subscriberId: number) {
    const image = await this.prisma.upload.findFirst({
      where: { id, subscriberId, deletedAt: null },
    });

    if (!image) {
      throw new NotFoundException('Imagem nao encontrada');
    }

    // Delete from S3 if key exists
    if (image.s3Key) {
      try {
        await this.s3Service.deleteFromS3(image.s3Key);
      } catch (err) {
        console.warn('Falha ao deletar do S3:', err);
      }
    }

    await this.prisma.upload.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Imagem deletada com sucesso' };
  }

  async signImage(id: number, userId: string) {
    const image = await this.prisma.upload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!image) {
      throw new NotFoundException('Imagem nao encontrada');
    }

    return this.prisma.upload.update({
      where: { id },
      data: { securityLevel: 'INTERNAL' },
    });
  }

  async getSignedUrl(id: number, expiresInHours = 24) {
    const image = await this.prisma.upload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!image) {
      throw new NotFoundException('Imagem nao encontrada');
    }

    if (!image.s3Key) {
      throw new BadRequestException('Imagem sem chave S3');
    }

    const expiresIn = expiresInHours * 3600;
    const url = await this.s3Service.getPresignedUrl(image.s3Key, expiresIn);

    return { url, expiresIn: expiresInHours };
  }
}
