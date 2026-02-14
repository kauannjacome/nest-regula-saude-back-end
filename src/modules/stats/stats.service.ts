import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDocumentStats(subscriberId: number, dateFrom?: string, dateTo?: string) {
    const where: any = { subscriberId, deletedAt: null };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [totalDocuments, totalTemplates, recentDocuments] = await Promise.all([
      this.prisma.generatedDocument.count({ where }),
      this.prisma.documentTemplate.count({ where: { subscriberId, deletedAt: null } }),
      this.prisma.generatedDocument.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        },
      }),
    ]);

    // Group by template
    const byTemplate = await this.prisma.generatedDocument.groupBy({
      by: ['templateId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch template names
    const templateIds = byTemplate.map((b) => b.templateId).filter(Boolean) as number[];
    const templates = templateIds.length > 0
      ? await this.prisma.documentTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, name: true },
        })
      : [];

    const templateMap = new Map(templates.map((t) => [t.id, t.name]));

    return {
      totalDocuments,
      totalTemplates,
      recentDocuments,
      byTemplate: byTemplate.map((b) => ({
        templateId: b.templateId,
        templateName: templateMap.get(b.templateId!) || 'Desconhecido',
        count: b._count.id,
      })),
    };
  }

  async getStorageStats(subscriberId: number) {
    const uploads = await this.prisma.upload.findMany({
      where: { subscriberId, deletedAt: null },
      select: { fileSize: true, mimeType: true },
    });

    let totalSize = 0;
    let imageCount = 0;
    let documentCount = 0;
    let otherCount = 0;
    let imageSize = 0;
    let documentSize = 0;

    for (const u of uploads) {
      const size = u.fileSize || 0;
      totalSize += size;

      if (u.mimeType?.startsWith('image/')) {
        imageCount++;
        imageSize += size;
      } else if (u.mimeType?.includes('pdf') || u.mimeType?.includes('document') || u.mimeType?.includes('spreadsheet')) {
        documentCount++;
        documentSize += size;
      } else {
        otherCount++;
      }
    }

    return {
      totalFiles: uploads.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      breakdown: {
        images: { count: imageCount, size: imageSize, sizeFormatted: this.formatBytes(imageSize) },
        documents: { count: documentCount, size: documentSize, sizeFormatted: this.formatBytes(documentSize) },
        other: { count: otherCount, size: totalSize - imageSize - documentSize, sizeFormatted: this.formatBytes(totalSize - imageSize - documentSize) },
      },
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
