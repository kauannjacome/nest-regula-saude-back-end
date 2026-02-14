import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
export class ProfessionalsController extends BaseCrudController {
  constructor(private readonly professionalsService: ProfessionalsService) {
    super(professionalsService);
  }
}
