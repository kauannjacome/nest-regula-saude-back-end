import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, S3Service],
  exports: [ImagesService],
})
export class ImagesModule {}
