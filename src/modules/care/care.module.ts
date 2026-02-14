import { Module } from '@nestjs/common';
import { CareService } from './care.service';
import { CareController } from './care.controller';

@Module({
  controllers: [CareController],
  providers: [CareService],
  exports: [CareService],
})
export class CareModule {}
