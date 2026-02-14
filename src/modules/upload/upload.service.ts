import { Injectable, BadRequestException, NotFoundException, GoneException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import * as crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TOKEN_EXPIRY_MINUTES = 13;

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  // ── Upload ──────────────────────────────────────────────────────────

  async upload(
    file: Express.Multer.File,
    subscriberId: number,
    userId: string,
    category: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o limite de 10MB');
    }

    // Normalize aliases
    if (category === 'avatars') category = 'user-avatar';
    if (category === 'templates') category = 'template';
    if (!category) category = 'general';

    // Build S3 key based on category
    const uuid = crypto.randomUUID();
    const ext = file.originalname.split('.').pop() || 'bin';
    let s3Key: string;

    if (category === 'user-avatar') {
      s3Key = `${subscriberId}/usuarios/${userId}/avatar/${uuid}.${ext}`;
    } else if (category === 'template') {
      s3Key = `${subscriberId}/templates/${uuid}.${ext}`;
    } else {
      const subfolder = category !== 'general' ? category : 'geral';
      s3Key = `${subscriberId}/${subfolder}/${uuid}.${ext}`;
    }

    const s3Result = await this.s3Service.uploadToS3({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        subscriberId: String(subscriberId),
        category,
        ...(userId ? { userId } : {}),
      },
    });

    const proxyUrl = `/api/s3/${s3Result.key}`;

    // For avatars and templates, skip DB save
    if (category === 'user-avatar' || category === 'template') {
      return { url: proxyUrl, key: s3Result.key, category };
    }

    // For images, save to Upload table
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      const upload = await this.prisma.upload.create({
        data: {
          fileName: s3Key.split('/').pop() || file.originalname,
          originalName: file.originalname,
          fileUrl: proxyUrl,
          fileType: file.mimetype,
          fileSize: file.size,
          mimeType: file.mimetype,
          s3Key: s3Result.key,
          s3Bucket: this.s3Service.getBucket(),
          s3Region: this.s3Service.getRegion(),
          subscriberId,
          uploaderId: userId,
          securityLevel: 'PUBLIC',
        },
      });

      return { upload, url: proxyUrl, key: s3Result.key, category };
    }

    // Non-image file
    return {
      url: proxyUrl,
      key: s3Result.key,
      bucket: this.s3Service.getBucket(),
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype,
      category,
    };
  }

  // ── Presign ─────────────────────────────────────────────────────────

  async presign(
    subscriberId: number,
    fileName: string,
    contentType: string,
    folder: string,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName e contentType sao obrigatorios');
    }

    const uuid = crypto.randomUUID();
    const ext = fileName.split('.').pop() || 'bin';

    const subfolder = folder === 'templates' ? 'templates' : (folder !== 'general' ? folder : 'geral');
    const key = `${subscriberId}/${subfolder}/${uuid}.${ext}`;

    const uploadUrl = await this.s3Service.getPresignedUploadUrl(key, contentType, 600);

    return {
      uploadUrl,
      key,
      publicUrl: `/api/s3/${key}`,
    };
  }

  // ── S3 Proxy ────────────────────────────────────────────────────────

  async getS3Object(s3Key: string, subscriberId: number, isSystemManager: boolean) {
    // Cross-tenant check: extract subscriberId from S3 key prefix
    const subscriberMatch = s3Key.match(/^(?:.*-)?(\d+)\//);
    if (subscriberMatch) {
      const keySubscriberId = subscriberMatch[1];
      if (keySubscriberId !== String(subscriberId) && !isSystemManager) {
        return null; // Access denied
      }
    }

    try {
      const response = await this.s3Service.getObject(s3Key);
      if (!response.Body) return null;

      const bytes = await response.Body.transformToByteArray();
      return {
        body: Buffer.from(bytes),
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: bytes.length,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  // ── QR Code Upload ──────────────────────────────────────────────────

  async generateQrCodeToken(
    subscriberId: number,
    createdById: string,
    entityType: string,
    entityId: string,
    documentType: string,
    baseUrl: string,
  ) {
    if (!entityType || !entityId || !documentType) {
      throw new BadRequestException('Campos obrigatorios: entityType, entityId, documentType');
    }

    const validEntityTypes = ['CITIZEN', 'USER', 'REGULATION'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestException('entityType invalido. Use CITIZEN, USER ou REGULATION.');
    }

    const hash = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const token = await this.prisma.documentUploadToken.create({
      data: {
        hash,
        subscriberId,
        createdById,
        entityType,
        entityId: String(entityId),
        documentType,
        expiresAt,
      },
    });

    const link = `${baseUrl}/upload/${hash}`;

    return {
      hash: token.hash,
      link,
      expiresAt: token.expiresAt.toISOString(),
    };
  }

  async getQrCodeToken(hash: string) {
    const token = await this.prisma.documentUploadToken.findUnique({
      where: { hash },
      include: {
        subscriber: { select: { name: true } },
      },
    });

    if (!token) {
      throw new NotFoundException('Link invalido');
    }

    if (new Date() > token.expiresAt) {
      throw new GoneException('Link expirado');
    }

    if (token.usedAt) {
      throw new GoneException('Link ja utilizado');
    }

    return {
      entityType: token.entityType,
      documentType: token.documentType,
      subscriberName: token.subscriber.name,
    };
  }

  async uploadViaQrCode(hash: string, file: Express.Multer.File) {
    const token = await this.prisma.documentUploadToken.findUnique({
      where: { hash },
      include: {
        subscriber: { select: { name: true } },
      },
    });

    if (!token) {
      throw new NotFoundException('Link invalido');
    }

    if (new Date() > token.expiresAt) {
      throw new GoneException('Link expirado');
    }

    if (token.usedAt) {
      throw new GoneException('Link ja utilizado');
    }

    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio');
    }

    const subscriberId = token.subscriberId;
    const uuid = crypto.randomUUID();
    const ext = file.originalname.split('.').pop() || 'bin';
    let uploadId: number | null = null;

    if (token.entityType === 'CITIZEN') {
      const citizenId = parseInt(token.entityId);
      const s3Key = `${subscriberId}/cidadaos/${citizenId}/documentos/${token.documentType}/${uuid}.${ext}`;

      await this.s3Service.uploadToS3({
        key: s3Key,
        body: file.buffer,
        contentType: file.mimetype,
        metadata: {
          citizenId: String(citizenId),
          documentType: token.documentType,
          uploadSource: 'qrcode',
        },
      });

      const doc = await this.prisma.upload.create({
        data: {
          citizenId,
          subscriberId,
          entityType: 'PATIENT_DOCUMENT',
          documentType: token.documentType as any,
          category: 'PRINTED_DOCUMENT' as any,
          fileName: file.originalname,
          fileUrl: `/api/s3/${s3Key}`,
          fileType: file.mimetype,
          fileSize: file.size,
          uploaderId: token.createdById,
          securityLevel: 'INTERNAL',
        },
      });
      uploadId = doc.id;
    } else if (token.entityType === 'USER') {
      const userId = token.entityId;
      const s3Key = `${subscriberId}/usuarios/${userId}/documentos/${token.documentType}/${uuid}.${ext}`;

      await this.s3Service.uploadToS3({
        key: s3Key,
        body: file.buffer,
        contentType: file.mimetype,
        metadata: {
          userId,
          documentType: token.documentType,
          uploadSource: 'qrcode',
        },
      });

      const doc = await this.prisma.upload.create({
        data: {
          userId,
          subscriberId,
          entityType: 'USER_DOCUMENT',
          documentType: token.documentType as any,
          category: 'PRINTED_DOCUMENT' as any,
          fileName: file.originalname,
          fileUrl: `/api/s3/${s3Key}`,
          fileType: file.mimetype,
          fileSize: file.size,
          uploaderId: token.createdById,
          securityLevel: 'INTERNAL',
        },
      });
      uploadId = doc.id;
    } else if (token.entityType === 'REGULATION') {
      const regulationId = parseInt(token.entityId);
      const s3Key = `${subscriberId}/regulations/${regulationId}/attachments/${uuid}.${ext}`;

      await this.s3Service.uploadToS3({
        key: s3Key,
        body: file.buffer,
        contentType: file.mimetype,
        metadata: {
          regulationId: String(regulationId),
          tag: token.documentType,
          uploadSource: 'qrcode',
        },
      });

      const upload = await this.prisma.upload.create({
        data: {
          fileName: file.originalname,
          fileUrl: `/api/s3/${s3Key}`,
          fileType: file.mimetype,
          fileSize: file.size,
          tag: token.documentType,
          regulationId,
          subscriberId,
          uploaderId: token.createdById,
          entityType: 'REGULATION_DOCUMENT',
          securityLevel: 'INTERNAL',
        },
      });
      uploadId = upload.id;
    }

    await this.prisma.documentUploadToken.update({
      where: { id: token.id },
      data: {
        usedAt: new Date(),
        uploadId,
      },
    });

    return { success: true, uploadId };
  }

  async getQrCodeStatus(hash: string) {
    const token = await this.prisma.documentUploadToken.findUnique({
      where: { hash },
    });

    if (!token) {
      throw new NotFoundException('Token nao encontrado');
    }

    return {
      used: token.usedAt !== null,
      expired: new Date() > token.expiresAt,
      uploadId: token.uploadId,
    };
  }
}
