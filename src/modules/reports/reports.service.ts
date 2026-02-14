import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class ReportsService extends BaseCrudService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
    super({
      modelName: 'Relatorio',
      searchFields: ['name'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.generatedReport;
  }

  async listGeneratedReports(subscriberId: number, filters?: {
    reportType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { subscriberId, deletedAt: null };

    if (filters?.reportType) where.reportType = filters.reportType;
    if (filters?.status) where.status = filters.status;

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [items, total] = await Promise.all([
      this.prisma.generatedReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          generator: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.generatedReport.count({ where }),
    ]);

    return { data: items, total };
  }

  async getGeneratedReport(id: number, subscriberId: number) {
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, subscriberId, deletedAt: null },
      include: {
        generator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report) throw new NotFoundException('Relatorio nao encontrado');

    let downloadUrl = null;
    if (report.s3Key) {
      try {
        downloadUrl = await this.s3Service.getPresignedUrl(report.s3Key, 3600);
      } catch {
        // ignore
      }
    }

    return { ...report, downloadUrl };
  }

  async createGeneratedReport(data: {
    subscriberId: number;
    userId: string;
    reportType: string;
    title: string;
    description?: string;
    headerData: any;
    filtersUsed: any;
    columns: any[];
    reportData: any[];
  }) {
    const report = await this.prisma.generatedReport.create({
      data: {
        subscriberId: data.subscriberId,
        reportType: data.reportType as any,
        title: data.title,
        description: data.description,
        headerData: data.headerData,
        filtersUsed: data.filtersUsed,
        resultCount: data.reportData?.length || 0,
        status: 'COMPLETED' as any,
        generatedBy: data.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return report;
  }

  async deleteGeneratedReport(id: number, subscriberId: number) {
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, subscriberId, deletedAt: null },
    });

    if (!report) throw new NotFoundException('Relatorio nao encontrado');

    await this.prisma.generatedReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Relatorio deletado com sucesso' };
  }
}
