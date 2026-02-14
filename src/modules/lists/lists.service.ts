import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import * as crypto from 'crypto';

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async listBatches(userId: string) {
    const batches = await this.prisma.batchAction.findMany({
      where: {
        userId,
        qrcodeSmartAction: { deletedAt: null },
      },
      include: {
        qrcodeSmartAction: {
          select: {
            hash: true,
            expiresAt: true,
            accessCount: true,
            accessLimit: true,
          },
        },
        _count: {
          select: {
            regulations: true,
            schedules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches.map(({ qrcodeSmartAction, ...batch }) => ({
      ...batch,
      hash: qrcodeSmartAction?.hash ?? '',
      expiresAt: qrcodeSmartAction?.expiresAt ?? null,
      accessCount: qrcodeSmartAction?.accessCount ?? 0,
      accessLimit: qrcodeSmartAction?.accessLimit ?? 0,
    }));
  }

  async getBatchByHash(hash: string) {
    const qrcodeSmartAction = await this.prisma.qrcodeSmartAction.findFirst({
      where: { hash, deletedAt: null },
      include: {
        batchAction: {
          include: {
            subscriber: { select: { name: true } },
            regulations: {
              where: { deletedAt: null },
              include: {
                citizen: { select: { name: true, cpf: true, birthDate: true } },
                cares: { include: { care: { select: { name: true } } } },
              },
              orderBy: { createdAt: 'desc' },
            },
            schedules: {
              where: { deletedAt: null },
              include: {
                professional: { select: { name: true } },
                regulation: {
                  include: {
                    citizen: { select: { name: true, cpf: true, birthDate: true } },
                    cares: { include: { care: { select: { name: true } } } },
                  },
                },
              },
              orderBy: { scheduledDate: 'desc' },
            },
          },
        },
      },
    });

    if (!qrcodeSmartAction || !qrcodeSmartAction.batchAction) {
      throw new NotFoundException('Link de atualizacao em lista nao encontrado');
    }

    const batchAction = qrcodeSmartAction.batchAction;

    // Check expiration
    const now = new Date();
    if (now > qrcodeSmartAction.expiresAt) {
      throw new BadRequestException('Este link de atualizacao expirou');
    }

    // Check access limit
    const accessLimit = qrcodeSmartAction.accessLimit > 0 ? qrcodeSmartAction.accessLimit : 3;
    if (qrcodeSmartAction.accessCount >= accessLimit) {
      throw new BadRequestException('Este link de atualizacao expirou (limite de acessos atingido)');
    }

    const itemType = batchAction.regulations.length > 0 ? 'REGULATION' : 'SCHEDULE';
    const rawItems: any[] = itemType === 'REGULATION' ? batchAction.regulations : batchAction.schedules;

    // Data masking for SUPPLIER_LIST
    const processedItems = rawItems.map((item: any) => {
      const citizen = item.citizen ?? item.regulation?.citizen;
      let age = null;
      if (citizen?.birthDate) {
        const today = new Date();
        const birth = new Date(citizen.birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      }

      if (batchAction.type === 'SUPPLIER_LIST') {
        return {
          id: item.id,
          citizen: {
            name: citizen?.name,
            cpf: citizen?.cpf ? `${citizen.cpf.substring(0, 3)}.***.***-**` : null,
            age,
          },
          cares: item.cares ?? item.regulation?.cares,
          professional: item.professional,
          status: item.status,
          scheduledDate: item.scheduledDate,
          createdAt: item.createdAt,
        };
      }

      return { ...item, citizen: { ...citizen, age } };
    });

    // Increment access count
    await this.prisma.qrcodeSmartAction.updateMany({
      where: { id: qrcodeSmartAction.id, deletedAt: null, accessCount: { lt: accessLimit } },
      data: { accessCount: { increment: 1 } },
    });

    return {
      batch: {
        uuid: batchAction.uuid,
        type: batchAction.type,
        expiresAt: qrcodeSmartAction.expiresAt,
        allowedActions: qrcodeSmartAction.allowedActions,
        subscriberName: batchAction.subscriber.name,
        accessCount: qrcodeSmartAction.accessCount + 1,
        accessLimit,
      },
      itemType,
      items: processedItems,
    };
  }

  async updateBatchItem(hash: string, body: { itemId: number; status?: string; notes?: string }) {
    const qrcodeSmartAction = await this.prisma.qrcodeSmartAction.findFirst({
      where: { hash, deletedAt: null },
      include: { batchAction: { select: { id: true } } },
    });

    if (!qrcodeSmartAction || !qrcodeSmartAction.batchAction) {
      throw new NotFoundException('Link de lista nao encontrado');
    }

    if (new Date() > qrcodeSmartAction.expiresAt) {
      throw new BadRequestException('Este link de lista expirou');
    }

    const { itemId, status, notes } = body;

    // Determine type
    const batchWithItems = await this.prisma.batchAction.findUnique({
      where: { id: qrcodeSmartAction.batchAction.id },
      include: {
        regulations: { select: { id: true } },
        schedules: { select: { id: true } },
      },
    });

    const isRegulation = batchWithItems?.regulations.some((r) => r.id === itemId);
    const isSchedule = batchWithItems?.schedules.some((s) => s.id === itemId);

    if (!isRegulation && !isSchedule) {
      throw new ForbiddenException('Este item nao pertence ao lista atual');
    }

    // Restrict status values
    const allowedStatuses = ['APPROVED', 'DENIED'];
    if (status && !allowedStatuses.includes(status)) {
      throw new BadRequestException(`Status ${status} nao permitido via lista`);
    }

    if (status && !qrcodeSmartAction.allowedActions.includes('STATUS')) {
      throw new ForbiddenException('Atualizacao de status nao permitida para este link');
    }

    let updatedItem;
    if (isRegulation) {
      const current = await this.prisma.regulation.findUnique({ where: { id: itemId } });
      const updatedNotes = notes
        ? (current?.notes ? `${current.notes}\n[Mobile]: ${notes}` : `[Mobile]: ${notes}`)
        : undefined;

      updatedItem = await this.prisma.regulation.update({
        where: { id: itemId },
        data: { status: (status as any) || undefined, notes: updatedNotes },
      });
    } else {
      const current = await this.prisma.schedule.findUnique({ where: { id: itemId } });
      const updatedNotes = notes
        ? (current?.notes ? `${current.notes}\n[Mobile]: ${notes}` : `[Mobile]: ${notes}`)
        : undefined;

      updatedItem = await this.prisma.schedule.update({
        where: { id: itemId },
        data: { status: (status as any) || undefined, notes: updatedNotes },
      });
    }

    // Log the change
    const currentLogs = Array.isArray(qrcodeSmartAction.executionLogs) ? qrcodeSmartAction.executionLogs : [];
    const newLog = {
      timestamp: new Date().toISOString(),
      itemId,
      type: isRegulation ? 'REGULATION' : 'SCHEDULE',
      action: status ? 'UPDATE_STATUS' : 'UPDATE_NOTES',
      payload: { status, notes },
      success: true,
    };

    await this.prisma.qrcodeSmartAction.update({
      where: { id: qrcodeSmartAction.id },
      data: { executionLogs: [...(currentLogs as any[]), newLog] },
    });

    return { message: 'Item atualizado com sucesso', item: updatedItem };
  }

  async deleteBatch(hash: string, userId: string) {
    const qrcodeSmartAction = await this.prisma.qrcodeSmartAction.findFirst({
      where: { hash, deletedAt: null },
      include: { batchAction: { select: { userId: true } } },
    });

    if (!qrcodeSmartAction || !qrcodeSmartAction.batchAction) {
      throw new NotFoundException('Lista nao encontrada');
    }

    if (qrcodeSmartAction.batchAction.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.prisma.qrcodeSmartAction.update({
      where: { id: qrcodeSmartAction.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Lista excluido com sucesso' };
  }

  async uploadToBatch(hash: string, file: Express.Multer.File, itemId: number, documentType: string, notes?: string) {
    const qrcodeSmartAction = await this.prisma.qrcodeSmartAction.findFirst({
      where: { hash, deletedAt: null },
      include: {
        batchAction: {
          include: {
            subscriber: { select: { id: true, name: true } },
            regulations: { select: { id: true } },
            schedules: { select: { id: true } },
          },
        },
      },
    });

    if (!qrcodeSmartAction || !qrcodeSmartAction.batchAction) {
      throw new NotFoundException('Link de lista nao encontrado');
    }

    if (new Date() > qrcodeSmartAction.expiresAt) {
      throw new BadRequestException('Este link de lista expirou');
    }

    if (!qrcodeSmartAction.allowedActions.includes('UPLOAD_REGULATION')) {
      throw new ForbiddenException('Upload de documentos nao permitido para este link');
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo excede o tamanho maximo de 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo nao permitido. Use JPG, PNG ou PDF.');
    }

    const batchAction = qrcodeSmartAction.batchAction;
    const isRegulation = batchAction.regulations.some((r) => r.id === itemId);
    const isSchedule = batchAction.schedules.some((s) => s.id === itemId);

    if (!isRegulation && !isSchedule) {
      throw new ForbiddenException('Este item nao pertence ao lista atual');
    }

    let regulationId = itemId;
    if (isSchedule) {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: itemId },
        select: { regulationId: true },
      });
      if (!schedule?.regulationId) {
        throw new BadRequestException('Agendamento nao possui regulacao associada');
      }
      regulationId = schedule.regulationId;
    }

    // Upload to S3
    const ext = file.originalname.split('.').pop() || 'bin';
    const s3Key = `subscribers/${batchAction.subscriber.id}/regulations/${regulationId}/${documentType}/${crypto.randomUUID()}.${ext}`;

    const uploadResult = await this.s3Service.uploadToS3({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    // Create Upload record
    const upload = await this.prisma.upload.create({
      data: {
        fileName: file.originalname,
        fileUrl: uploadResult.url,
        fileType: file.mimetype,
        fileSize: file.size,
        tag: documentType,
        subscriberId: batchAction.subscriber.id,
        regulationId,
        s3Key,
        s3Bucket: this.s3Service.getBucket(),
        s3Region: this.s3Service.getRegion(),
      },
    });

    // Update regulation notes
    if (notes) {
      const regulation = await this.prisma.regulation.findUnique({ where: { id: regulationId } });
      const updatedNotes = regulation?.notes
        ? `${regulation.notes}\n[Mobile Upload - ${documentType}]: ${notes}`
        : `[Mobile Upload - ${documentType}]: ${notes}`;

      await this.prisma.regulation.update({
        where: { id: regulationId },
        data: { notes: updatedNotes },
      });
    }

    // Log the upload
    const currentLogs = Array.isArray(qrcodeSmartAction.executionLogs) ? qrcodeSmartAction.executionLogs : [];
    const newLog = {
      timestamp: new Date().toISOString(),
      itemId,
      regulationId,
      action: 'UPLOAD_DOCUMENT',
      payload: { documentType, fileName: file.originalname, fileSize: file.size, uploadId: upload.id },
      success: true,
    };

    await this.prisma.qrcodeSmartAction.update({
      where: { id: qrcodeSmartAction.id },
      data: { executionLogs: [...(currentLogs as any[]), newLog] },
    });

    return {
      message: 'Documento enviado com sucesso',
      upload: { id: upload.id, fileName: upload.fileName, fileType: upload.fileType },
    };
  }

  async generateBatch(data: {
    subscriberId: number;
    userId: string;
    ids: number[];
    type: 'REGULATION' | 'SCHEDULE';
    batchType: string;
    allowedActions?: string[];
    expiryHours?: number;
    accessLimit?: number;
  }) {
    const { subscriberId, userId, ids, type, batchType, allowedActions, expiryHours, accessLimit } = data;

    if (!ids || ids.length === 0) {
      throw new BadRequestException('Nenhum registro selecionado para atualizacao em lista');
    }

    const numericIds = ids.map((id) => parseInt(String(id))).filter((id) => !isNaN(id));
    if (numericIds.length === 0) {
      throw new BadRequestException('IDs selecionados sao invalidos');
    }

    const hash = crypto.randomBytes(16).toString('hex');
    const parsedExpiry = Number(expiryHours);
    const expiryHoursValue = Number.isFinite(parsedExpiry) && parsedExpiry > 0 ? parsedExpiry : 2;
    const expiresAt = new Date(Date.now() + expiryHoursValue * 60 * 60 * 1000);

    const parsedAccessLimit = Number(accessLimit);
    const accessLimitValue = Number.isFinite(parsedAccessLimit) && parsedAccessLimit > 0
      ? Math.min(parsedAccessLimit, 5)
      : 3;

    const initPayload = {
      itemType: type,
      ids: numericIds,
      batchType,
      expiryHours: expiryHoursValue,
      accessLimit: accessLimitValue,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const { qrcodeSmartAction, batchAction } = await this.prisma.$transaction(async (tx) => {
      const qrcodeSmartAction = await tx.qrcodeSmartAction.create({
        data: {
          hash,
          expiresAt,
          allowedActions: allowedActions || ['STATUS'],
          accessLimit: accessLimitValue,
          targetData: initPayload,
          executionLogs: [{ timestamp: new Date().toISOString(), action: 'BATCH_INIT', payload: initPayload }],
        },
      });

      const batchAction = await tx.batchAction.create({
        data: {
          subscriberId,
          userId,
          type: batchType,
          qrcodeSmartActionId: qrcodeSmartAction.id,
          regulations: type === 'REGULATION'
            ? { connect: numericIds.map((id) => ({ id })) }
            : undefined,
          schedules: type === 'SCHEDULE'
            ? { connect: numericIds.map((id) => ({ id })) }
            : undefined,
        },
      });

      return { qrcodeSmartAction, batchAction };
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${baseUrl}/list/${hash}`;

    return {
      id: batchAction.id,
      hash: qrcodeSmartAction.hash,
      link,
      expiresAt: qrcodeSmartAction.expiresAt,
      itemCount: ids.length,
    };
  }

  async batchUpload(subscriberId: number, file: Express.Multer.File) {
    // Parse Excel/CSV for batch citizen import
    if (!file) {
      throw new BadRequestException('Arquivo nao enviado');
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    let rows: string[][] = [];

    if (file.originalname.endsWith('.csv')) {
      const content = file.buffer.toString('utf-8');
      rows = content.split('\n').filter((l) => l.trim()).map((l) => l.split(/[,;]/));
    } else {
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        worksheet.eachRow((row, idx) => {
          if (idx === 1) return; // skip header
          const values = (row.values as any[]).slice(1).map((v) => String(v || '').trim());
          rows.push(values);
        });
      }
    }

    let created = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const [name, cpf, birthDateStr] = rows[i];
      if (!name) {
        errors.push({ row: i + 2, error: 'Nome obrigatorio' });
        continue;
      }

      try {
        // Check duplicate by CPF
        if (cpf) {
          const cleanCpf = cpf.replace(/\D/g, '');
          const existing = await this.prisma.citizen.findFirst({
            where: { subscriberId, cpf: cleanCpf, deletedAt: null },
          });
          if (existing) {
            skipped++;
            continue;
          }
        }

        let birthDate: Date = new Date(2000, 0, 1); // default
        if (birthDateStr) {
          const parts = birthDateStr.split('/');
          if (parts.length === 3) {
            birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            birthDate = new Date(birthDateStr);
          }
          if (isNaN(birthDate.getTime())) birthDate = new Date(2000, 0, 1);
        }

        await this.prisma.citizen.create({
          data: {
            subscriberId,
            name: name.trim(),
            nameNormalized: name.trim().toLowerCase(),
            cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
            birthDate,
          },
        });
        created++;
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    return {
      totalRows: rows.length,
      created,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 50),
    };
  }
}
