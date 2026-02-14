import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController extends BaseCrudController {
  constructor(private readonly documentsService: DocumentsService) {
    super(documentsService);
  }
}
