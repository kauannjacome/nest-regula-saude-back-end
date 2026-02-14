import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class RegulationsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
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
}
