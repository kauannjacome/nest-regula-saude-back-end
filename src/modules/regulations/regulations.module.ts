import { Module } from '@nestjs/common';
import { RegulationsService } from './regulations.service';
import { RegulationsController } from './regulations.controller';

@Module({
  controllers: [RegulationsController],
  providers: [RegulationsService],
  exports: [RegulationsService],
})
export class RegulationsModule {}
