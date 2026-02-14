import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController extends BaseCrudController {
  constructor(private readonly unitsService: UnitsService) {
    super(unitsService);
  }
}
