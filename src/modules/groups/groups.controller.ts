import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController extends BaseCrudController {
  constructor(private readonly groupsService: GroupsService) {
    super(groupsService);
  }
}
