import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class SchedulesService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Agendamento',
      searchFields: ['citizenName'],
      defaultOrderBy: { scheduledDate: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.schedule;
  }
}
