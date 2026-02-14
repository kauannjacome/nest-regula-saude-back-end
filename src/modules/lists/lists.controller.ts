import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ListsService } from './lists.service';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get('lists')
  async listBatches(@CurrentUser('id') userId: string) {
    return this.listsService.listBatches(userId);
  }

  @Get('lists/:hash')
  async getBatch(@Param('hash') hash: string) {
    return this.listsService.getBatchByHash(hash);
  }

  @Patch('lists/:hash')
  async updateBatchItem(
    @Param('hash') hash: string,
    @Body() body: { itemId: number; status?: string; notes?: string },
  ) {
    return this.listsService.updateBatchItem(hash, body);
  }

  @Delete('lists/:hash')
  async deleteBatch(
    @Param('hash') hash: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.listsService.deleteBatch(hash, userId);
  }

  @Post('lists/:hash/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToBatch(
    @Param('hash') hash: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('itemId') itemId: string,
    @Body('documentType') documentType: string,
    @Body('notes') notes: string,
  ) {
    return this.listsService.uploadToBatch(
      hash,
      file,
      parseInt(itemId),
      documentType || 'OUTROS',
      notes,
    );
  }

  @Post('lists/generate')
  async generate(
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.listsService.generateBatch({
      subscriberId,
      userId,
      ids: body.ids,
      type: body.type,
      batchType: body.batchType,
      allowedActions: body.allowedActions,
      expiryHours: body.expiryHours,
      accessLimit: body.accessLimit,
    });
  }

  @Post('batch-upload')
  @UseInterceptors(FileInterceptor('file'))
  async batchUpload(
    @CurrentUser('subscriberId') subscriberId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.listsService.batchUpload(subscriberId, file);
  }
}
