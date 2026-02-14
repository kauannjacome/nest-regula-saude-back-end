import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, S3Service],
  exports: [AdminService],
})
export class AdminModule {}
