import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';
import { S3Service } from '../../common/services/s3.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class RegulationsService extends BaseCrudService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
    super({
      modelName: 'Regulacao',
      searchFields: ['protocol', 'citizenName'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
      include: { citizen: true, unit: true, care: true },
    });
  }

  protected getModel() {
    return this.prisma.regulation;
  }

  // ── Schedules ─────────────────────────────────────────────────────────

  async findSchedules(regulationId: number, subscriberId: number) {
    const regulation = await this.prisma.regulation.findFirst({
      where: { id: regulationId, subscriberId, deletedAt: null },
    });

    if (!regulation) {
      throw new NotFoundException('Regulacao nao encontrada');
    }

    const schedules = await this.prisma.schedule.findMany({
      where: { regulationId, subscriberId, deletedAt: null },
      orderBy: { scheduledDate: 'desc' },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        scheduledEndDate: true,
        notes: true,
        recurrenceType: true,
        parentScheduleId: true,
        professional: { select: { id: true, name: true } },
      },
    });

    return { schedules };
  }

  // ── Attachments ───────────────────────────────────────────────────────

  async uploadAttachment(
    regulationId: number,
    subscriberId: number,
    uploaderId: string,
    file: Express.Multer.File,
    tag?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo nao fornecido');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o tamanho maximo de 10MB');
    }

    const regulation = await this.prisma.regulation.findFirst({
      where: { id: regulationId, subscriberId },
    });

    if (!regulation) {
      throw new NotFoundException('Regulacao nao encontrada');
    }

    const s3Key = `${subscriberId}/regulations/${regulationId}/attachments/${Date.now()}-${file.originalname}`;

    await this.s3Service.uploadToS3({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
      metadata: {
        regulationId: String(regulationId),
        tag: tag || 'attachment',
        ...(uploaderId ? { uploadedBy: uploaderId } : {}),
      },
    });

    const upload = await this.prisma.upload.create({
      data: {
        fileName: file.originalname,
        fileUrl: `/api/s3/${s3Key}`,
        fileType: file.mimetype,
        fileSize: file.size,
        tag: tag || 'REGULATION_ATTACHMENT',
        regulationId,
        subscriberId,
        uploaderId: uploaderId || null,
      },
    });

    return upload;
  }

  async deleteAttachment(uploadId: number, subscriberId: number) {
    const upload = await this.prisma.upload.findFirst({
      where: { id: uploadId, subscriberId },
    });

    if (!upload) {
      throw new NotFoundException('Documento nao encontrado');
    }

    // Extract S3 key from proxy URL
    if (upload.fileUrl.startsWith('/api/s3/')) {
      const s3Key = upload.fileUrl.replace('/api/s3/', '');
      try {
        await this.s3Service.deleteFromS3(s3Key);
      } catch (s3Err) {
        console.warn('Falha ao deletar do S3:', s3Err);
      }
    }

    await this.prisma.upload.delete({
      where: { id: uploadId },
    });

    return { success: true };
  }
}
