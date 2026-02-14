import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { EmploymentsService } from './employments.service';

@Controller('employments')
export class EmploymentsController extends BaseCrudController {
  constructor(private readonly employmentsService: EmploymentsService) {
    super(employmentsService);
  }
}
