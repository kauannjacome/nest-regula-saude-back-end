import { Module } from '@nestjs/common';
import { RegulationsService } from './regulations.service';
import { RegulationsController } from './regulations.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [RegulationsController],
  providers: [RegulationsService, S3Service],
  exports: [RegulationsService],
})
export class RegulationsModule {}
