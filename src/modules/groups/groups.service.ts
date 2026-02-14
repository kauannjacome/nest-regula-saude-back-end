import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class GroupsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Grupo',
      searchFields: ['name'],
      defaultOrderBy: { name: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.group;
  }
}
