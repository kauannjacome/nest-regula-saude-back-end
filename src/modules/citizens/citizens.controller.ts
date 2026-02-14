import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { CitizensService } from './citizens.service';

@Controller('citizens')
export class CitizensController extends BaseCrudController {
  constructor(private readonly citizensService: CitizensService) {
    super(citizensService);
  }
}
