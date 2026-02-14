import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController, GeneratedReportsController } from './reports.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [ReportsController, GeneratedReportsController],
  providers: [ReportsService, S3Service],
  exports: [ReportsService],
})
export class ReportsModule {}
