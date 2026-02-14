import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [ListsController],
  providers: [ListsService, S3Service],
  exports: [ListsService],
})
export class ListsModule {}
