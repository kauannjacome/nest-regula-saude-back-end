import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  // ========== DASHBOARD ==========

  async getDashboard() {
    const [subscribersCount, usersCount, regulationsCount] = await Promise.all([
      this.prisma.subscriber.count(),
      this.prisma.user.count(),
      this.prisma.regulation.count({ where: { deletedAt: null } }),
    ]);
    return { subscribersCount, usersCount, regulationsCount };
  }

  // ========== SUBSCRIBERS ==========

  async getSubscribers(params: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 50, search = '' } = params;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { municipalityName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.subscriber.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select: {
          id: true, uuid: true, name: true, municipalityName: true,
          email: true, telephone: true, cnpj: true, city: true,
          stateName: true, stateAcronym: true, subscriptionStatus: true, createdAt: true,
          _count: { select: { userEmployments: true, citizens: true, regulations: true } },
        },
      }),
      this.prisma.subscriber.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSubscriber(id: number) {
    const item = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Assinante nao encontrado');
    return item;
  }

  async createSubscriber(data: any) {
    const requiredFields = ['name', 'municipalityName', 'email', 'telephone', 'cnpj', 'postalCode', 'city', 'neighborhood', 'street', 'number', 'stateName', 'stateAcronym'];
    const missingFields = requiredFields.filter((f) => !data[f]);
    if (missingFields.length > 0) {
      throw new BadRequestException(`Campos obrigatorios ausentes: ${missingFields.join(', ')}`);
    }

    const existing = await this.prisma.subscriber.findFirst({
      where: { cnpj: data.cnpj, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('Ja existe um assinante com este CNPJ');
    }

    return this.prisma.subscriber.create({
      data: {
        name: data.name,
        municipalityName: data.municipalityName,
        email: data.email,
        telephone: data.telephone,
        cnpj: data.cnpj,
        postalCode: data.postalCode,
        city: data.city,
        neighborhood: data.neighborhood,
        street: data.street,
        number: data.number,
        stateName: data.stateName,
        stateAcronym: data.stateAcronym,
        subscriptionStatus: data.subscriptionStatus ?? 'ACTIVE',
      },
    });
  }

  async updateSubscriber(id: number, data: any) {
    await this.getSubscriber(id);
    return this.prisma.subscriber.update({ where: { id }, data });
  }

  // ========== SUBSCRIBER USERS ==========

  async getSubscriberUsers(subscriberId: number, params: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 50, search } = params;
    const skip = (page - 1) * limit;
    const where: any = {
      subscriberId,
      isActive: true,
    };

    const [items, total] = await Promise.all([
      this.prisma.userEmployment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, cpf: true, phoneNumber: true, createdAt: true } },
          tenantRole: { select: { id: true, name: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userEmployment.count({ where }),
    ]);

    let data = items.map((emp) => ({
      ...emp.user,
      employmentId: emp.id,
      role: emp.tenantRole,
      isPrimary: emp.isPrimary,
    }));

    if (search) {
      const s = search.toLowerCase();
      data = data.filter((u) =>
        u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.cpf?.includes(s),
      );
    }

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createSubscriberUser(subscriberId: number, data: any) {
    const passwordHash = await bcrypt.hash(data.password || 'Temp@12345678', 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        phoneNumber: data.phone,
        passwordHash,
        isPasswordTemp: !data.password,
      },
    });

    // Find role
    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.tenantRole.findFirst({
        where: { subscriberId, name: 'professional' },
      });
      roleId = defaultRole?.id;
    }

    await this.prisma.userEmployment.create({
      data: {
        userId: user.id,
        subscriberId,
        status: 'ACCEPTED' as any,
        isPrimary: true,
        isActive: true,
        roleId,
      },
    });

    return user;
  }

  async getSubscriberUser(subscriberId: number, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        employments: {
          where: { subscriberId },
          include: { tenantRole: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async updateSubscriberUser(subscriberId: number, userId: string, data: any) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.cpf) updateData.cpf = data.cpf;
    if (data.phone) updateData.phoneNumber = data.phone;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (data.roleId) {
      await this.prisma.userEmployment.updateMany({
        where: { userId, subscriberId },
        data: { roleId: data.roleId },
      });
    }

    return updated;
  }

  async deleteSubscriberUser(subscriberId: number, userId: string) {
    // Remove employment
    await this.prisma.userEmployment.updateMany({
      where: { userId, subscriberId },
      data: { isActive: false },
    });

    // Check if user has other active employments
    const otherEmployments = await this.prisma.userEmployment.count({
      where: { userId, isActive: true, subscriberId: { not: subscriberId } },
    });

    if (otherEmployments === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    }

    return { message: 'Usuario removido com sucesso' };
  }

  // ========== SYSTEM STATS ==========

  async getSystemStats() {
    const [totalSubscribers, activeSubscribers, totalUsers, totalTenantRoles] = await Promise.all([
      this.prisma.subscriber.count({ where: { deletedAt: null } }),
      this.prisma.subscriber.count({
        where: { deletedAt: null, subscriptionStatus: { in: ['ACTIVE', 'OVERDUE', 'TEMPORARY_UNBLOCK'] } },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.tenantRole.count(),
    ]);
    return { totalSubscribers, activeSubscribers, totalUsers, totalTenantRoles };
  }

  // ========== MONITORING ==========

  async getMonitoring() {
    const [userCount, regulationCount, recentErrors] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.regulation.count({ where: { deletedAt: null } }),
      this.prisma.auditLog.count({
        where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics: { userCount, regulationCount, recentErrors },
    };
  }

  // ========== ROUTINES ==========

  async getRoutines() {
    const routines = [
      { name: 'cleanup-expired-tokens', description: 'Limpa tokens expirados', schedule: '0 2 * * *' },
      { name: 'cleanup-expired-reports', description: 'Limpa relatorios expirados', schedule: '0 3 * * *' },
      { name: 'sync-whatsapp', description: 'Sincroniza WhatsApp', schedule: '*/5 * * * *' },
    ];
    return { routines };
  }

  async executeRoutine(name: string) {
    return { success: true, routine: name, executedAt: new Date().toISOString() };
  }

  // ========== SETTINGS ==========

  async getSettings() {
    return this.prisma.systemConfig.findMany();
  }

  async updateSettings(data: any) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const result = await this.prisma.systemConfig.upsert({
        where: { key },
        update: { value: value as any, updatedAt: new Date() },
        create: { key, value: value as any },
      });
      results.push(result);
    }
    return results;
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { occurredAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ========== TRASH ==========

  async getTrash(subscriberId: number, params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;

    // Collect soft-deleted items from various tables
    const [citizens, regulations, cares, units, suppliers, folders] = await Promise.all([
      this.prisma.citizen.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, name: true, deletedAt: true } }),
      this.prisma.regulation.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, protocolNumber: true, deletedAt: true } }),
      this.prisma.care.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, name: true, deletedAt: true } }),
      this.prisma.unit.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, name: true, deletedAt: true } }),
      this.prisma.supplier.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, name: true, deletedAt: true } }),
      this.prisma.folder.findMany({ where: { subscriberId, deletedAt: { not: null } }, take: limit, select: { id: true, name: true, deletedAt: true } }),
    ]);

    const items = [
      ...citizens.map((c) => ({ ...c, type: 'Citizen' })),
      ...regulations.map((r) => ({ id: r.id, name: `Regulacao #${r.protocolNumber}`, deletedAt: r.deletedAt, type: 'Regulation' })),
      ...cares.map((c) => ({ ...c, type: 'Care' })),
      ...units.map((u) => ({ ...u, type: 'Unit' })),
      ...suppliers.map((s) => ({ ...s, type: 'Supplier' })),
      ...folders.map((f) => ({ ...f, type: 'Folder' })),
    ].sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return {
      data: items.slice(0, limit),
      pagination: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
    };
  }

  async restoreTrash(type: string, id: string) {
    if (!type || !id) {
      throw new BadRequestException('Tipo e ID sao obrigatorios');
    }

    const data = { deletedAt: null };

    switch (type) {
      case 'Subscriber':
        await this.prisma.subscriber.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'User':
        await this.prisma.user.update({ where: { id }, data });
        break;
      case 'TenantRole':
        await this.prisma.tenantRole.update({ where: { id }, data });
        break;
      case 'Citizen':
        await this.prisma.citizen.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'Regulation':
        await this.prisma.regulation.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'Care':
        await this.prisma.care.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'Unit':
        await this.prisma.unit.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'Supplier':
        await this.prisma.supplier.update({ where: { id: parseInt(id, 10) }, data });
        break;
      case 'Folder':
        await this.prisma.folder.update({ where: { id: parseInt(id, 10) }, data });
        break;
      default:
        throw new BadRequestException(`Tipo desconhecido: ${type}`);
    }

    return { message: 'Item restaurado com sucesso' };
  }

  // ========== BACKUPS ==========

  async getBackups(params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.backupHistory.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: { createdBy: { select: { name: true } } },
      }),
      this.prisma.backupHistory.count(),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createBackup(userId: string) {
    const backup = await this.prisma.backupHistory.create({
      data: {
        filename: `backup-${Date.now()}.sql`,
        s3Key: `backups/backup-${Date.now()}.sql`,
        type: 'MANUAL' as any,
        status: 'PENDING' as any,
        createdById: userId,
      },
    });
    return backup;
  }

  async deleteBackup(id: number) {
    const backup = await this.prisma.backupHistory.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException('Backup nao encontrado');

    if (backup.s3Key) {
      try {
        await this.s3Service.deleteFromS3(backup.s3Key);
      } catch {
        // ignore
      }
    }

    await this.prisma.backupHistory.delete({ where: { id } });
    return { message: 'Backup removido com sucesso' };
  }

  async getBackupConfig() {
    const config = await this.prisma.systemConfig.findFirst({
      where: { key: 'backup_config' },
    });
    const recent = await this.prisma.backupHistory.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    });
    return { config: config?.value || {}, recentBackups: recent };
  }

  async updateBackupConfig(data: any) {
    return this.prisma.systemConfig.upsert({
      where: { key: 'backup_config' },
      update: { value: data },
      create: { key: 'backup_config', value: data },
    });
  }

  async getBackupDownloadUrl(id: number) {
    const backup = await this.prisma.backupHistory.findUnique({ where: { id } });
    if (!backup?.s3Key) throw new NotFoundException('Backup nao encontrado ou sem arquivo');

    const url = await this.s3Service.getPresignedUrl(backup.s3Key, 900); // 15min
    return { url, expiresIn: 900 };
  }

  // ========== ADMIN USERS ==========

  async getAdminUsers(params: { page: number; limit: number; search?: string; status?: string; subscriberId?: number }) {
    const { page = 1, limit = 50, search, status, subscriberId } = params;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
      ];
    }
    if (status === 'blocked') where.isBlocked = true;
    if (status === 'active') where.isBlocked = { not: true };

    if (subscriberId) {
      where.employments = { some: { subscriberId } };
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, email: true, cpf: true, phoneNumber: true,
          isBlocked: true, isPasswordTemp: true, createdAt: true,
          employments: {
            select: {
              subscriberId: true, isActive: true,
              subscriber: { select: { name: true } },
              tenantRole: { select: { displayName: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateAdminUser(userId: string, data: any) {
    const updateData: any = {};

    if (data.action === 'block') updateData.isBlocked = true;
    if (data.action === 'unblock') {
      updateData.isBlocked = false;
      updateData.numberTry = 0;
    }
    if (data.action === 'reset_tries') updateData.numberTry = 0;
    if (data.action === 'reset_password') {
      updateData.passwordHash = await bcrypt.hash('Temp@12345678', 10);
      updateData.isPasswordTemp = true;
    }

    return this.prisma.user.update({ where: { id: userId }, data: updateData });
  }

  // ========== WHATSAPP PROVIDERS ==========

  async getWhatsappProviders() {
    return this.prisma.whatsAppSystemProvider.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createWhatsappProvider(data: any) {
    if (data.isDefault) {
      await this.prisma.whatsAppSystemProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.whatsAppSystemProvider.create({ data });
  }

  async getWhatsappProvider(id: number) {
    const provider = await this.prisma.whatsAppSystemProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provedor nao encontrado');
    return provider;
  }

  async updateWhatsappProvider(id: number, data: any) {
    if (data.isDefault) {
      await this.prisma.whatsAppSystemProvider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.whatsAppSystemProvider.update({ where: { id }, data });
  }

  async deleteWhatsappProvider(id: number) {
    const activeCount = await this.prisma.whatsAppSystemProvider.count({ where: { isActive: true } });
    const provider = await this.prisma.whatsAppSystemProvider.findUnique({ where: { id } });

    if (provider?.isActive && activeCount <= 1) {
      throw new BadRequestException('Nao e possivel remover o unico provedor ativo');
    }

    await this.prisma.whatsAppSystemProvider.delete({ where: { id } });
    return { message: 'Provedor removido com sucesso' };
  }

  async testWhatsappProvider(id: number) {
    const provider = await this.getWhatsappProvider(id);
    const startTime = Date.now();

    try {
      const response = await fetch(`${provider.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', apikey: provider.apiKey },
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return { success: false, error: `Erro HTTP ${response.status}`, latency };
      }

      const data = await response.json().catch(() => []);
      const instances = Array.isArray(data) ? data : [];

      return {
        success: true,
        message: 'Conexao estabelecida com sucesso!',
        latency,
        instances: instances.length,
        connectedInstances: instances.filter((i: any) => i.connectionStatus === 'open' || i.state === 'open').length,
      };
    } catch (err: any) {
      const latency = Date.now() - startTime;
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        return { success: false, error: 'Tempo limite excedido.', latency };
      }
      return { success: false, error: err?.message || 'Erro ao conectar', latency };
    }
  }

  // ========== EXPORT ==========

  async exportData(data: { type: string; format?: string; subscriberId?: number }) {
    const { type, format = 'json', subscriberId } = data;
    let result: any[] = [];

    const where: any = subscriberId ? { subscriberId, deletedAt: null } : { deletedAt: null };

    switch (type) {
      case 'users':
        result = await this.prisma.user.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, cpf: true, createdAt: true },
        });
        break;
      case 'subscribers':
        result = await this.prisma.subscriber.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, municipalityName: true, cnpj: true, email: true, createdAt: true },
        });
        break;
      case 'regulations':
        result = await this.prisma.regulation.findMany({
          where,
          select: { id: true, protocolNumber: true, status: true, priority: true, createdAt: true },
          take: 10000,
        });
        break;
      case 'citizens':
        result = await this.prisma.citizen.findMany({
          where,
          select: { id: true, name: true, cpf: true, birthDate: true, createdAt: true },
          take: 10000,
        });
        break;
      default:
        throw new BadRequestException(`Tipo de exportacao desconhecido: ${type}`);
    }

    if (format === 'csv') {
      if (result.length === 0) return { data: '', format: 'csv' };
      const headers = Object.keys(result[0]);
      const csvLines = [
        headers.join(','),
        ...result.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
      ];
      return { data: csvLines.join('\n'), format: 'csv' };
    }

    return { data: result, format: 'json' };
  }

  // ========== RESET ==========

  async getResetCounts(subscriberId?: number) {
    const where: any = subscriberId ? { subscriberId, deletedAt: null } : { deletedAt: null };
    const [regulations, citizens, documents] = await Promise.all([
      this.prisma.regulation.count({ where }),
      this.prisma.citizen.count({ where }),
      this.prisma.generatedDocument.count({ where }),
    ]);
    return { regulations, citizens, documents };
  }

  async resetData(data: { subscriberId?: number; types: string[] }) {
    const { subscriberId, types } = data;
    const where: any = subscriberId ? { subscriberId } : {};
    const results: any = {};

    for (const type of types) {
      switch (type) {
        case 'regulations':
          results.regulations = await this.prisma.regulation.deleteMany({ where });
          break;
        case 'citizens':
          results.citizens = await this.prisma.citizen.deleteMany({ where });
          break;
        case 'documents':
          results.documents = await this.prisma.generatedDocument.deleteMany({ where });
          break;
      }
    }

    return results;
  }

  // ========== ENTER/EXIT SUBSCRIBER ==========

  async enterSubscriber(userId: string, subscriberId: number) {
    await this.getSubscriber(subscriberId);
    return { subscriberId, message: 'Contexto alterado com sucesso' };
  }

  async exitSubscriber(userId: string) {
    return { success: true, message: 'Contexto resetado' };
  }

  // ========== SUBSCRIBER NOTIFICATIONS ==========

  async getSubscriberNotifications(subscriberId: number) {
    const [configs, templates] = await Promise.all([
      this.prisma.notificationConfig.findMany({ where: { subscriberId } }),
      this.prisma.whatsAppProgrammed.findMany({
        where: { subscriberId, deletedAt: null },
        select: { id: true, name: true, triggerType: true, bodyText: true, isActive: true },
      }),
    ]);
    return { configs, templates };
  }
}
