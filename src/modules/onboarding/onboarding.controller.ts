import {
  Controller, Get, Post, Put, Param, Body, Res,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  async getStatus(@CurrentUser('id') userId: string) {
    return this.onboardingService.getStatus(userId);
  }

  @Put()
  async updateStep(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.onboardingService.updateStep(userId, body);
  }

  @Get('templates/:type')
  async downloadTemplate(
    @Param('type') type: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.onboardingService.generateTemplate(type);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(buffer);
  }

  @Post('import/validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    return this.onboardingService.validateImport(file, type);
  }

  @Post('import/process')
  @UseInterceptors(FileInterceptor('file'))
  async processImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.onboardingService.processImport(file, type, subscriberId, userId);
  }
}
