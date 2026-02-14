import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class EmploymentsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Vinculo',
      searchFields: ['userId'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.userEmployment;
  }
}
