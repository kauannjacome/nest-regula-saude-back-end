import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class ProfessionalsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Profissional',
      searchFields: ['name'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.userEmployment;
  }
}
