import { Controller } from '@nestjs/common';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController extends BaseCrudController {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }
}
