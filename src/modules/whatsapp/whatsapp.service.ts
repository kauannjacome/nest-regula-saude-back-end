import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const WHATSAPP_TRIGGER_LABELS: Record<string, string> = {
  REGULATION_CREATED: 'Regulacao criada',
  REGULATION_STATUS_CHANGED: 'Status da regulacao alterado',
  SCHEDULE_CREATED: 'Agendamento criado',
  SCHEDULE_CONFIRMED: 'Agendamento confirmado',
  SCHEDULE_CANCELLED: 'Agendamento cancelado',
  SCHEDULE_RESCHEDULED: 'Agendamento reagendado',
  DOCUMENT_READY: 'Documento pronto',
  CUSTOM: 'Personalizado',
};

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  // ========== CONFIG ==========

  async getConfig(subscriberId: number) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (config) {
      return {
        isActive: config.isActive,
        provider: config.provider || 'evolution',
        apiUrl: config.apiUrl || '',
        apiKey: '',
        instanceName: config.instanceName || '',
        webhookSecret: config.webhookSecret || '',
        instanceStatus: config.instanceStatus,
        lastConnectedAt: config.lastConnectedAt,
      };
    }

    // Fallback to default system provider
    const defaultProvider = await this.prisma.whatsAppSystemProvider.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (defaultProvider) {
      return {
        isActive: false,
        provider: defaultProvider.provider,
        apiUrl: defaultProvider.apiUrl,
        apiKey: '',
        instanceName: `subscriber_${subscriberId}`,
        webhookSecret: '',
        isSystemDefault: true,
      };
    }

    return {
      isActive: false,
      provider: 'evolution',
      apiUrl: '',
      apiKey: '',
      instanceName: '',
      webhookSecret: '',
    };
  }

  async updateConfig(subscriberId: number, data: any) {
    const existing = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (existing) {
      return this.prisma.whatsAppConfig.update({ where: { id: existing.id }, data });
    }
    return this.prisma.whatsAppConfig.create({ data: { ...data, subscriberId } });
  }

  // ========== CONNECT / DISCONNECT / SEND ==========

  async connect(subscriberId: number, data?: { provider?: string }) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config) {
      // Find system provider
      const provider = await this.prisma.whatsAppSystemProvider.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (!provider) {
        throw new BadRequestException('Nenhum provedor WhatsApp configurado');
      }

      // Create config from system provider
      await this.prisma.whatsAppConfig.create({
        data: {
          subscriberId,
          instanceName: `subscriber_${subscriberId}`,
          provider: provider.provider,
          apiUrl: provider.apiUrl,
          apiKey: provider.apiKey,
          isActive: true,
        },
      });
    }

    // Call Evolution API to get QR code
    const apiConfig = config || await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!apiConfig?.apiUrl || !apiConfig?.apiKey) {
      throw new BadRequestException('Credenciais da API nao configuradas');
    }

    try {
      const instanceName = apiConfig.instanceName || `subscriber_${subscriberId}`;

      // Try to check if already connected
      const statusRes = await fetch(`${apiConfig.apiUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiConfig.apiKey },
        signal: AbortSignal.timeout(10000),
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json().catch(() => ({}));
        if (statusData?.instance?.state === 'open') {
          return { message: 'Already connected', connected: true };
        }
      }

      // Get QR code
      const qrRes = await fetch(`${apiConfig.apiUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: apiConfig.apiKey },
        signal: AbortSignal.timeout(15000),
      });

      if (!qrRes.ok) {
        return { error: 'Falha ao gerar QR code', code: 'QR_GENERATION_FAILED' };
      }

      const qrData = await qrRes.json().catch(() => ({}));
      return {
        qrcode: qrData.base64 || qrData.qrcode,
        code: qrData.code,
        pairingCode: qrData.pairingCode,
      };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao conectar', code: 'CONNECTION_ERROR' };
    }
  }

  async disconnect(subscriberId: number) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config?.apiUrl || !config?.apiKey) {
      return { success: true, message: 'Nenhuma conexao ativa' };
    }

    try {
      const instanceName = config.instanceName || `subscriber_${subscriberId}`;
      await fetch(`${config.apiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { apikey: config.apiKey },
        signal: AbortSignal.timeout(10000),
      });

      await this.prisma.whatsAppConfig.update({
        where: { id: config.id },
        data: { instanceStatus: 'disconnected' },
      });
    } catch {
      // ignore
    }

    return { success: true, message: 'Desconectado com sucesso' };
  }

  async getConnectionStatus(subscriberId: number) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config?.apiUrl || !config?.apiKey) {
      return { connected: false, instanceName: null };
    }

    try {
      const instanceName = config.instanceName || `subscriber_${subscriberId}`;
      const res = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: config.apiKey },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const connected = data?.instance?.state === 'open';
        return { connected, instanceName, profileName: data?.instance?.profileName };
      }
    } catch {
      // ignore
    }

    return { connected: false, instanceName: config.instanceName };
  }

  async send(subscriberId: number, data: { phone?: string; message?: string; regulationId?: number; citizenId?: number; trigger?: string }) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config?.apiUrl || !config?.apiKey) {
      throw new BadRequestException('WhatsApp nao configurado');
    }

    // Direct message
    if (data.phone && data.message) {
      const instanceName = config.instanceName || `subscriber_${subscriberId}`;
      const phone = data.phone.replace(/\D/g, '');

      try {
        const res = await fetch(`${config.apiUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: config.apiKey },
          body: JSON.stringify({ number: phone, text: data.message }),
          signal: AbortSignal.timeout(15000),
        });

        const result = await res.json().catch(() => ({}));
        return { queued: true, message: 'Mensagem adicionada a fila de envio', phoneSent: phone, ...result };
      } catch (err: any) {
        throw new BadRequestException(err?.message || 'Erro ao enviar mensagem');
      }
    }

    return { queued: true, message: 'Notificacao processada' };
  }

  // ========== RECONNECT ==========

  async reconnect(subscriberId: number) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config?.apiUrl || !config?.apiKey) {
      return { status: 'failed', error: 'Nao configurado' };
    }

    try {
      const instanceName = config.instanceName || `subscriber_${subscriberId}`;
      const res = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: config.apiKey },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        await this.prisma.whatsAppConfig.update({
          where: { id: config.id },
          data: { instanceStatus: 'connecting' },
        });
        return { status: 'reconnected', subscriberId };
      }

      return { status: 'failed', error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: 'error', error: err?.message };
    }
  }

  // ========== WEBHOOK ==========

  async handleWebhook(body: { event: string; instance?: string; data?: any }) {
    const { event, instance, data } = body;

    // Extract subscriberId from instance name
    const match = instance?.match(/subscriber_(\d+)/);
    const subscriberId = match ? parseInt(match[1], 10) : null;

    if (!subscriberId) {
      return { received: true };
    }

    switch (event) {
      case 'CONNECTION_UPDATE':
      case 'connection.update': {
        const state = data?.state || data?.status;
        if (state === 'open' || state === 'connected') {
          await this.prisma.whatsAppConfig.updateMany({
            where: { subscriberId },
            data: { instanceStatus: 'connected', lastConnectedAt: new Date() },
          });
        } else if (state === 'close' || state === 'disconnected') {
          await this.prisma.whatsAppConfig.updateMany({
            where: { subscriberId },
            data: { instanceStatus: 'disconnected' },
          });
        }
        break;
      }

      case 'QRCODE_UPDATED':
      case 'qrcode.updated': {
        await this.prisma.whatsAppConfig.updateMany({
          where: { subscriberId },
          data: { instanceStatus: 'waiting_qr' },
        });
        break;
      }

      case 'MESSAGES_UPSERT':
      case 'messages.upsert': {
        // Log incoming messages
        const messages = data?.messages || (data ? [data] : []);
        for (const msg of messages) {
          if (msg.key?.fromMe) continue;
          await this.prisma.auditLog.create({
            data: {
              action: 'RECEIVE',
              subscriberId,
              objectType: 'WhatsAppMessage',
              objectId: 0,
              detail: {
                from: msg.key?.remoteJid,
                text: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '',
                source: 'whatsapp',
              },
            },
          });
        }
        break;
      }
    }

    return { received: true };
  }

  // ========== SYNC ==========

  async syncAll() {
    const configs = await this.prisma.whatsAppConfig.findMany({
      where: { provider: 'evolution' },
    });

    const results: any[] = [];
    let connected = 0;
    let disconnected = 0;
    let changed = 0;
    let errors = 0;

    for (const config of configs) {
      try {
        const instanceName = config.instanceName || `subscriber_${config.subscriberId}`;
        const res = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: config.apiKey! },
          signal: AbortSignal.timeout(10000),
        });

        const previousStatus = config.instanceStatus;
        let currentStatus = 'disconnected';

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          currentStatus = data?.instance?.state === 'open' ? 'connected' : 'disconnected';
        }

        if (previousStatus !== currentStatus) {
          await this.prisma.whatsAppConfig.update({
            where: { id: config.id },
            data: {
              instanceStatus: currentStatus,
              ...(currentStatus === 'connected' ? { lastConnectedAt: new Date() } : {}),
            },
          });
          changed++;
        }

        if (currentStatus === 'connected') connected++;
        else disconnected++;

        results.push({
          subscriberId: config.subscriberId,
          instanceName,
          previousStatus,
          currentStatus,
          changed: previousStatus !== currentStatus,
        });
      } catch {
        errors++;
        results.push({
          subscriberId: config.subscriberId,
          instanceName: config.instanceName,
          error: true,
        });
      }
    }

    return {
      success: true,
      summary: { total: configs.length, connected, disconnected, changed, errors },
      results,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== TEST ==========

  async getTestStatus(subscriberId: number) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });

    const result: any = {
      subscriberId,
      instanceName: config?.instanceName,
      database: {
        hasConfig: !!config,
        instanceStatus: config?.instanceStatus,
        lastConnectedAt: config?.lastConnectedAt,
      },
      evolutionApi: {
        hasCredentials: !!(config?.apiUrl && config?.apiKey),
        apiUrl: config?.apiUrl || null,
        isConnected: false,
        info: null,
      },
    };

    if (config?.apiUrl && config?.apiKey) {
      try {
        const instanceName = config.instanceName || `subscriber_${subscriberId}`;
        const res = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: config.apiKey },
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          result.evolutionApi.isConnected = data?.instance?.state === 'open';
          result.evolutionApi.info = data?.instance;
        }
      } catch {
        // ignore
      }
    }

    return result;
  }

  async sendTest(subscriberId: number, data: { phone: string; message?: string }) {
    const config = await this.prisma.whatsAppConfig.findFirst({ where: { subscriberId } });
    if (!config?.apiUrl || !config?.apiKey) {
      throw new BadRequestException('WhatsApp nao configurado');
    }

    const instanceName = config.instanceName || `subscriber_${subscriberId}`;
    const phone = data.phone.replace(/\D/g, '');
    const message = data.message || 'Mensagem de teste do Regula Saude';

    try {
      const res = await fetch(`${config.apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: config.apiKey },
        body: JSON.stringify({ number: phone, text: message }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await res.json().catch(() => ({}));
      return { success: true, isConnected: true, phoneSent: phone, ...result };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Erro ao enviar mensagem de teste');
    }
  }

  // ========== TEMPLATES ==========

  async getTemplates(subscriberId: number, params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const where = { subscriberId, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.whatsAppProgrammed.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.whatsAppProgrammed.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTemplate(subscriberId: number, data: any) {
    return this.prisma.whatsAppProgrammed.create({
      data: {
        subscriberId,
        name: data.name || 'Novo Template',
        triggerType: data.triggerType || 'CUSTOM',
        headerText: data.headerText,
        bodyText: data.bodyText,
        footerText: data.footerText,
        buttons: data.buttons,
        delayMinutes: data.delayMinutes || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  async updateTemplate(id: number, data: any) {
    return this.prisma.whatsAppProgrammed.update({ where: { id }, data });
  }

  async deleteTemplate(id: number) {
    return this.prisma.whatsAppProgrammed.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ========== RULES ==========

  async getRules(subscriberId: number) {
    return this.prisma.notificationRule.findMany({
      where: { subscriberId },
      include: {
        whatsappTemplate: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(subscriberId: number, data: { triggerEvent: string; templateId?: number; isActive?: boolean }) {
    return this.prisma.notificationRule.create({
      data: {
        subscriberId,
        triggerEvent: data.triggerEvent,
        whatsappProgrammedId: data.templateId,
        isActive: data.isActive !== false,
      },
      include: { whatsappTemplate: true },
    });
  }

  async updateRule(id: number, data: { triggerEvent?: string; templateId?: number; isActive?: boolean }) {
    return this.prisma.notificationRule.update({
      where: { id },
      data: {
        ...(data.triggerEvent !== undefined ? { triggerEvent: data.triggerEvent } : {}),
        ...(data.templateId !== undefined ? { whatsappProgrammedId: data.templateId } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async deleteRule(id: number) {
    await this.prisma.notificationRule.delete({ where: { id } });
    return { success: true };
  }

  // ========== TEMPLATES BY TRIGGER ==========

  async getTemplatesByTrigger(subscriberId: number, trigger: string) {
    if (!trigger || !Object.keys(WHATSAPP_TRIGGER_LABELS).includes(trigger)) {
      throw new BadRequestException('Trigger invalido');
    }

    const templates = await this.prisma.whatsAppProgrammed.findMany({
      where: { subscriberId, triggerType: trigger as any, isActive: true, deletedAt: null },
      select: { id: true, name: true, headerText: true, bodyText: true, footerText: true, isActive: true },
    });

    return { templates };
  }

  // ========== AVAILABLE PROVIDERS ==========

  async getAvailableProviders() {
    const providers = await this.prisma.whatsAppSystemProvider.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: { id: true, uuid: true, name: true, provider: true, isDefault: true },
    });

    if (providers.length === 0) {
      return {
        providers: [{ id: 0, name: 'Evolution API', provider: 'evolution', isDefault: true }],
        hasMultipleProviders: false,
      };
    }

    return { providers, hasMultipleProviders: providers.length > 1 };
  }

  // ========== NOTIFICATION PREFERENCES ==========

  async getNotificationPreferences(subscriberId: number) {
    const [templates, savedPreferences] = await Promise.all([
      this.prisma.whatsAppProgrammed.findMany({
        where: { subscriberId, deletedAt: null },
        select: { id: true, name: true, triggerType: true, bodyText: true, headerText: true, footerText: true, isActive: true },
      }),
      this.prisma.whatsAppNotificationPreference.findMany({
        where: { subscriberId },
      }),
    ]);

    // Group templates by trigger type
    const templatesByTrigger: Record<string, any[]> = {};
    for (const t of templates) {
      if (!templatesByTrigger[t.triggerType]) templatesByTrigger[t.triggerType] = [];
      templatesByTrigger[t.triggerType].push({ ...t, isSystem: false });
    }

    const savedMap: Record<string, any> = {};
    for (const p of savedPreferences) {
      savedMap[p.triggerType] = p;
    }

    const preferences = Object.entries(WHATSAPP_TRIGGER_LABELS).map(([triggerType, label]) => {
      const saved = savedMap[triggerType];
      const available = templatesByTrigger[triggerType] || [];
      const hasTemplates = available.length > 0;

      let selectedTemplate = null;
      if (saved?.templateId) {
        selectedTemplate = available.find((t) => t.id === saved.templateId) || null;
      } else if (available.length > 0) {
        selectedTemplate = available[0];
      }

      return {
        triggerType,
        label,
        state: saved?.state || (hasTemplates ? 'ON' : 'OFF'),
        templateId: saved?.templateId || selectedTemplate?.id || null,
        customMessage: saved?.customMessage || null,
        selectedTemplate,
        availableTemplates: { custom: available },
        hasTemplates,
      };
    });

    return {
      preferences,
      variables: {
        '{{nome_paciente}}': 'Nome do paciente',
        '{{cpf_paciente}}': 'CPF do paciente',
        '{{protocolo}}': 'Numero do protocolo',
        '{{data}}': 'Data atual',
        '{{hora}}': 'Hora atual',
        '{{nome_unidade}}': 'Nome da unidade',
        '{{nome_profissional}}': 'Nome do profissional',
      },
    };
  }

  async updateNotificationPreference(subscriberId: number, data: {
    triggerType: string;
    state: string;
    templateId?: number;
    customMessage?: string;
  }) {
    if (!WHATSAPP_TRIGGER_LABELS[data.triggerType]) {
      throw new BadRequestException('Tipo de trigger invalido');
    }
    if (!['ON', 'OFF', 'ALWAYS_ASK'].includes(data.state)) {
      throw new BadRequestException('Estado invalido');
    }

    if (data.templateId) {
      const template = await this.prisma.whatsAppProgrammed.findFirst({
        where: { id: data.templateId, subscriberId },
      });
      if (!template) throw new NotFoundException('Template nao encontrado');
    }

    const result = await this.prisma.whatsAppNotificationPreference.upsert({
      where: { subscriberId_triggerType: { subscriberId, triggerType: data.triggerType as any } },
      update: {
        state: data.state as any,
        templateId: data.templateId || null,
        customMessage: data.customMessage || null,
      },
      create: {
        subscriberId,
        triggerType: data.triggerType as any,
        state: data.state as any,
        templateId: data.templateId || null,
        customMessage: data.customMessage || null,
      },
    });

    return {
      success: true,
      preference: {
        triggerType: result.triggerType,
        state: result.state,
        templateId: result.templateId,
        customMessage: result.customMessage,
      },
    };
  }

  // ========== PROGRAMMED ==========

  async getProgrammed(subscriberId: number, params: { page: number; limit: number }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const where = { subscriberId, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.whatsAppProgrammed.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.whatsAppProgrammed.count({ where }),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
