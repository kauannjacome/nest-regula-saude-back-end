import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController extends BaseCrudController {
  constructor(private readonly schedulesService: SchedulesService) {
    super(schedulesService);
  }
}
