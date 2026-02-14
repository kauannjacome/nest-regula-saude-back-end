import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
export class RegulationsController extends BaseCrudController {
  constructor(private readonly regulationsService: RegulationsService) {
    super(regulationsService);
  }
}
