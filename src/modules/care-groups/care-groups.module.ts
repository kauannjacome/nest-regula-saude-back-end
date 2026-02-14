import { Module } from '@nestjs/common';
import { CareGroupsService } from './care-groups.service';
import { CareGroupsController } from './care-groups.controller';

@Module({
  controllers: [CareGroupsController],
  providers: [CareGroupsService],
  exports: [CareGroupsService],
})
export class CareGroupsModule {}
