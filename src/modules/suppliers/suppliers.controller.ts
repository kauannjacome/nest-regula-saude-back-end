import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController extends BaseCrudController {
  constructor(private readonly suppliersService: SuppliersService) {
    super(suppliersService);
  }
}
