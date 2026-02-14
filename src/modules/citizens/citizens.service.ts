import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class CitizensService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Cidadao',
      searchFields: ['name', 'cpf'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.citizen;
  }
}
