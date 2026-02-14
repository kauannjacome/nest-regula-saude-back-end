import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class DocumentsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Documento',
      searchFields: ['name'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.generatedDocument;
  }

  async getRecentDocuments(subscriberId: number, limit: number) {
    return this.prisma.generatedDocument.findMany({
      where: { subscriberId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        template: { select: { id: true, name: true } },
        generator: { select: { id: true, name: true } },
      },
    });
  }

  async cleanOldDocuments(subscriberId: number, daysOld: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.generatedDocument.updateMany({
      where: {
        subscriberId,
        deletedAt: null,
        createdAt: { lt: cutoffDate },
      },
      data: { deletedAt: new Date() },
    });

    return { deletedCount: result.count };
  }
}
