import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController extends BaseCrudController {
  constructor(private readonly reportsService: ReportsService) {
    super(reportsService);
  }
}
