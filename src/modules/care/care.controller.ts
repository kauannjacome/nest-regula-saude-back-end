import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { CareService } from './care.service';

@Controller('care')
export class CareController extends BaseCrudController {
  constructor(private readonly careService: CareService) {
    super(careService);
  }
}
