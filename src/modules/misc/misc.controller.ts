import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { MiscService } from './misc.service';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Post('print-pdf')
  async printPdf(@Body() body: { html: string; templateName?: string }) {
    return this.miscService.printPdf(body.html, body.templateName);
  }

  @Post('import-docx')
  @UseInterceptors(FileInterceptor('file'))
  async importDocx(@UploadedFile() file: Express.Multer.File) {
    return this.miscService.importDocx(file);
  }
}
