import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCrudService } from '../../crud/base-crud.service';

@Injectable()
export class NotificationsService extends BaseCrudService {
  constructor(private prisma: PrismaService) {
    super({
      modelName: 'Notificacao',
      searchFields: ['title'],
      defaultOrderBy: { createdAt: 'asc' },
      softDelete: true,
    });
  }

  protected getModel() {
    return this.prisma.notification;
  }
}
