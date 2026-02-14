import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Normaliza uma string removendo acentos e convertendo para minusculas.
 * Mesmo comportamento do monolito.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  trash?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CrudConfig {
  modelName: string;
  searchFields?: string[];
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  select?: Record<string, boolean | object>;
  include?: Record<string, boolean | object>;
  softDelete?: boolean;
}

/**
 * Servico base abstrato para CRUD com paginacao, soft delete, nameNormalized.
 * Replica o comportamento de crud-factory.ts do monolito.
 */
export abstract class BaseCrudService<T = any> {
  protected config: CrudConfig;

  constructor(config: CrudConfig) {
    this.config = {
      searchFields: ['name'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
      ...config,
    };
  }

  protected abstract getModel(): any;

  /**
   * Build the subscriber filter for where clause.
   * Override in subclasses where the model doesn't have a direct subscriberId
   * (e.g. User uses employments.subscriberId).
   */
  protected buildSubscriberFilter(subscriberId: number): Record<string, any> {
    return { subscriberId };
  }

  async findAll(
    subscriberId: number,
    params: PaginationParams,
    isSystemManager = false,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 50, search = '', trash = false } = params;
    const skip = (page - 1) * limit;

    if (trash && !isSystemManager) {
      throw new ForbiddenException(
        'Acesso negado. Apenas administradores do sistema podem acessar a lixeira.',
      );
    }

    const where: any = {
      ...this.buildSubscriberFilter(subscriberId),
      ...(this.config.softDelete && {
        deletedAt: trash ? { not: null } : null,
      }),
    };

    // Search conditions
    if (search && this.config.searchFields!.length > 0) {
      if (this.config.searchFields!.length === 1) {
        where[this.config.searchFields![0]] = {
          contains: search,
          mode: 'insensitive',
        };
      } else {
        where.OR = this.config.searchFields!.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }
    }

    const queryOptions: any = {
      where,
      orderBy: trash ? { deletedAt: 'desc' } : this.config.defaultOrderBy,
      skip,
      take: limit,
    };

    if (this.config.select) {
      queryOptions.select = trash
        ? { ...this.config.select, deletedAt: true }
        : this.config.select;
    }
    if (this.config.include) {
      queryOptions.include = this.config.include;
    }

    const model = this.getModel();
    const [items, total] = await Promise.all([
      model.findMany(queryOptions),
      model.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number | string, subscriberId: number): Promise<T> {
    const where: any = {
      id,
      ...this.buildSubscriberFilter(subscriberId),
      ...(this.config.softDelete && { deletedAt: null }),
    };

    const queryOptions: any = { where };
    if (this.config.include) {
      queryOptions.include = this.config.include;
    }

    const item = await this.getModel().findFirst(queryOptions);
    if (!item) {
      throw new NotFoundException(`${this.config.modelName} nao encontrado`);
    }
    return item;
  }

  async create(data: any, subscriberId: number): Promise<T> {
    // Auto nameNormalized
    if (data.name && !data.nameNormalized) {
      data.nameNormalized = normalizeString(String(data.name));
    }
    data.subscriberId = subscriberId;

    return this.getModel().create({ data });
  }

  async update(id: number, data: any, subscriberId: number): Promise<T> {
    // Verify existence and ownership
    await this.findOne(id, subscriberId);

    // Auto nameNormalized
    if (data.name && !data.nameNormalized) {
      data.nameNormalized = normalizeString(String(data.name));
    }

    return this.getModel().update({ where: { id }, data });
  }

  async remove(id: number, subscriberId: number): Promise<T> {
    // Verify existence and ownership
    await this.findOne(id, subscriberId);

    if (this.config.softDelete) {
      return this.getModel().update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    return this.getModel().delete({ where: { id } });
  }
}
