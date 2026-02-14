import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController extends BaseCrudController {
  constructor(private readonly foldersService: FoldersService) {
    super(foldersService);
  }
}
