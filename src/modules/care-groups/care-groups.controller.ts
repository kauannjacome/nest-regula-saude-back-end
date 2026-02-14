import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { CareGroupsService } from './care-groups.service';

@Controller('care-groups')
export class CareGroupsController extends BaseCrudController {
  constructor(private readonly careGroupsService: CareGroupsService) {
    super(careGroupsService);
  }
}
