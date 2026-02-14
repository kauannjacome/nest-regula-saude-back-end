import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController extends BaseCrudController {
  constructor(private readonly notificationsService: NotificationsService) {
    super(notificationsService);
  }
}
