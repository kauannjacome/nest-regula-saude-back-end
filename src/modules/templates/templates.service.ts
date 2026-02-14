import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Template type definitions (matching monolith)
export enum TemplateType {
  REGULATION = 'REGULATION',
  REGULATION_WITHDRAWAL = 'REGULATION_WITHDRAWAL',
  REQUEST = 'REQUEST',
  RESIDENCE_DECLARATION = 'RESIDENCE_DECLARATION',
  WITHDRAWAL_DECLARATION = 'WITHDRAWAL_DECLARATION',
  COST_ASSISTANCE = 'COST_ASSISTANCE',
  SUS_CARD_CREATE = 'SUS_CARD_CREATE',
  SUS_CARD_UPDATE = 'SUS_CARD_UPDATE',
  HIGH_COST_MEDICATION = 'HIGH_COST_MEDICATION',
  RECEIPT_DECLARATION = 'RECEIPT_DECLARATION',
  AIH = 'AIH',
  TCLE = 'TCLE',
  TREATMENT_REFUSAL = 'TREATMENT_REFUSAL',
  PATIENT_RESPONSIBILITY = 'PATIENT_RESPONSIBILITY',
  TREATMENT_ADHERENCE = 'TREATMENT_ADHERENCE',
  SCHEDULING_CARD = 'SCHEDULING_CARD',
  CARE_CONTROL = 'CARE_CONTROL',
  SCHEDULING_LIST = 'SCHEDULING_LIST',
  SUPPLIER_LIST = 'SUPPLIER_LIST',
  MEDICATION_FAST_LIST = 'MEDICATION_FAST_LIST',
}

interface TemplateConfig {
  type: TemplateType;
  name: string;
  description: string;
  category: string;
  pages: number;
  requiresRegulation: boolean;
  requiresCitizen: boolean;
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  [TemplateType.REGULATION]: {
    type: TemplateType.REGULATION,
    name: 'Documento de Regulação',
    description: 'Documento oficial de regulação com dados do paciente e procedimentos',
    category: 'Regulação',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.REGULATION_WITHDRAWAL]: {
    type: TemplateType.REGULATION_WITHDRAWAL,
    name: 'Declaração de Desistência de Regulação',
    description: 'Termo de desistência de regulação pelo paciente',
    category: 'Regulação',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.REQUEST]: {
    type: TemplateType.REQUEST,
    name: 'Requerimento',
    description: 'Requerimento genérico',
    category: 'Documentos',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.RESIDENCE_DECLARATION]: {
    type: TemplateType.RESIDENCE_DECLARATION,
    name: 'Declaração de Residência',
    description: 'Declaração de residência do cidadão',
    category: 'Documentos',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.WITHDRAWAL_DECLARATION]: {
    type: TemplateType.WITHDRAWAL_DECLARATION,
    name: 'Declaração de Desistência',
    description: 'Declaração de desistência genérica',
    category: 'Documentos',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.COST_ASSISTANCE]: {
    type: TemplateType.COST_ASSISTANCE,
    name: 'Ajuda de Custo',
    description: 'Documento de ajuda de custo para deslocamento',
    category: 'Documentos',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.SUS_CARD_CREATE]: {
    type: TemplateType.SUS_CARD_CREATE,
    name: 'Criação de Cartão SUS',
    description: 'Formulário de criação do Cartão SUS',
    category: 'SUS',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.SUS_CARD_UPDATE]: {
    type: TemplateType.SUS_CARD_UPDATE,
    name: 'Atualização de Cartão SUS',
    description: 'Formulário de atualização do Cartão SUS',
    category: 'SUS',
    pages: 1,
    requiresRegulation: false,
    requiresCitizen: true,
  },
  [TemplateType.HIGH_COST_MEDICATION]: {
    type: TemplateType.HIGH_COST_MEDICATION,
    name: 'Medicamento de Alto Custo',
    description: 'Formulário de medicamento de alto custo',
    category: 'Medicamentos',
    pages: 2,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.RECEIPT_DECLARATION]: {
    type: TemplateType.RECEIPT_DECLARATION,
    name: 'Declaração de Recebimento',
    description: 'Declaração de recebimento de medicamento',
    category: 'Medicamentos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.AIH]: {
    type: TemplateType.AIH,
    name: 'AIH',
    description: 'Autorização de Internação Hospitalar',
    category: 'Internação',
    pages: 2,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.TCLE]: {
    type: TemplateType.TCLE,
    name: 'TCLE',
    description: 'Termo de Consentimento Livre e Esclarecido',
    category: 'Termos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.TREATMENT_REFUSAL]: {
    type: TemplateType.TREATMENT_REFUSAL,
    name: 'Termo de Recusa de Tratamento',
    description: 'Termo de recusa de tratamento pelo paciente',
    category: 'Termos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.PATIENT_RESPONSIBILITY]: {
    type: TemplateType.PATIENT_RESPONSIBILITY,
    name: 'Termo de Responsabilidade',
    description: 'Termo de responsabilidade do paciente',
    category: 'Termos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.TREATMENT_ADHERENCE]: {
    type: TemplateType.TREATMENT_ADHERENCE,
    name: 'Termo de Adesão ao Tratamento',
    description: 'Termo de adesão ao tratamento',
    category: 'Termos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.SCHEDULING_CARD]: {
    type: TemplateType.SCHEDULING_CARD,
    name: 'Cartão de Agendamento',
    description: 'Cartão de agendamento para o paciente',
    category: 'Agendamento',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: true,
  },
  [TemplateType.CARE_CONTROL]: {
    type: TemplateType.CARE_CONTROL,
    name: 'Controle de Cuidado',
    description: 'Lista de controle de cuidado',
    category: 'Listas',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: false,
  },
  [TemplateType.SCHEDULING_LIST]: {
    type: TemplateType.SCHEDULING_LIST,
    name: 'Lista de Agendamento',
    description: 'Lista de agendamentos',
    category: 'Listas',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: false,
  },
  [TemplateType.SUPPLIER_LIST]: {
    type: TemplateType.SUPPLIER_LIST,
    name: 'Lista por Fornecedor',
    description: 'Lista de regulações por fornecedor',
    category: 'Listas',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: false,
  },
  [TemplateType.MEDICATION_FAST_LIST]: {
    type: TemplateType.MEDICATION_FAST_LIST,
    name: 'Lista Rápida de Medicamentos',
    description: 'Lista rápida de medicamentos com QR codes',
    category: 'Medicamentos',
    pages: 1,
    requiresRegulation: true,
    requiresCitizen: false,
  },
};

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async getAvailableTemplates(regulationId?: number, citizenId?: number) {
    const configs = Object.values(TEMPLATE_CONFIGS).filter((config) => {
      if (regulationId) {
        return true;
      } else if (citizenId) {
        return !config.requiresRegulation && config.requiresCitizen;
      }
      return false;
    });

    const templates = configs.map((config) => ({
      type: config.type,
      name: config.name,
      description: config.description,
      category: config.category,
      pages: config.pages,
      printHistory: null,
      documentDate: new Date().toISOString(),
    }));

    return { templates };
  }

  async printTemplate(data: {
    subscriberId: number;
    userId: string;
    userName: string;
    templateTypes: string[];
    regulationId?: number;
    citizenId?: number;
    documentDate?: string;
    download?: boolean;
  }) {
    const {
      subscriberId,
      templateTypes,
      regulationId,
      citizenId,
      documentDate = new Date().toISOString(),
    } = data;

    if (!templateTypes || templateTypes.length === 0) {
      throw new BadRequestException('Nenhum template selecionado');
    }

    // Fetch subscriber data
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: {
        logoStateLogo: true,
        logoMunicipalLogo: true,
        logoAdministrationLogo: true,
      },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber nao encontrado');
    }

    // Build template data (regulation / citizen)
    let regulation: any = null;
    let citizen: any = null;

    if (regulationId) {
      const reg = await this.prisma.regulation.findUnique({
        where: { id: regulationId },
        include: {
          citizen: true,
          creator: { select: { id: true, name: true } },
          cares: {
            include: {
              care: {
                select: { id: true, name: true, unitMeasure: true, value: true },
              },
            },
          },
        },
      });

      if (reg?.citizen) {
        citizen = this.mapCitizen(reg.citizen);
        regulation = {
          id: reg.id,
          protocolNumber: reg.protocolNumber,
          status: reg.status || 'IN_PROGRESS',
          priority: reg.priority || 'ELECTIVE',
          requestDate: reg.requestDate,
          notes: reg.notes,
          clinicalIndication: reg.clinicalIndication,
          cid: reg.cid,
          requestingProfessional: reg.requestingProfessional,
          cares: reg.cares.map((cr) => ({
            id: cr.care.id,
            name: cr.care.name,
            unitMeasure: cr.care.unitMeasure,
            quantity: cr.quantity,
            value: cr.care.value ? Number(cr.care.value) : null,
          })),
          citizen,
          createdAt: reg.createdAt,
          creator: reg.creator
            ? { id: reg.creator.id, name: reg.creator.name || '' }
            : null,
        };
      }
    } else if (citizenId) {
      const cit = await this.prisma.citizen.findUnique({
        where: { id: citizenId },
      });
      if (cit) {
        citizen = this.mapCitizen(cit);
      }
    }

    if (!citizen && !regulation) {
      throw new NotFoundException('Cidadao ou regulacao nao encontrado');
    }

    // Return the template data for client-side PDF generation
    // (PDF generation requires browser-side libraries like jsPDF)
    return {
      subscriberHeader: {
        subscriberName: subscriber.name || null,
        stateName: subscriber.stateName || 'Sao Paulo',
        municipalityName: subscriber.municipalityName || 'Municipio',
        secretariatName: 'Secretaria Municipal de Saude',
        logoStateUrl: subscriber.logoStateLogo?.fileUrl || null,
        logoMunicipalUrl: subscriber.logoMunicipalLogo?.fileUrl || null,
        logoAdministrationUrl: subscriber.logoAdministrationLogo?.fileUrl || null,
      },
      templateType: templateTypes[0],
      regulation,
      citizen,
      documentDate,
    };
  }

  private mapCitizen(cit: any) {
    return {
      id: cit.id,
      name: cit.name,
      cpf: cit.cpf || '',
      cns: cit.cns,
      birthDate: cit.birthDate,
      phone: cit.phone,
      email: cit.email,
      address: cit.address,
      number: cit.number,
      neighborhood: cit.neighborhood,
      city: cit.city,
      state: cit.state,
      postalCode: cit.postalCode,
      motherName: cit.motherName,
    };
  }
}
