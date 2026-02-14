import {
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BaseCrudService, PaginationParams } from './base-crud.service';

/**
 * Controller base abstrato para CRUD.
 * Extenda este controller e chame super() no construtor.
 *
 * Replica o padrao de rotas do monolito:
 * GET    /api/{resource}      -> list com paginacao
 * POST   /api/{resource}      -> create
 * GET    /api/{resource}/:id  -> findOne
 * PUT    /api/{resource}/:id  -> update
 * DELETE /api/{resource}/:id  -> soft delete
 */
@UseGuards(JwtAuthGuard, TenantGuard)
export abstract class BaseCrudController<T = any> {
  constructor(protected readonly service: BaseCrudService<T>) {}

  @Get()
  async findAll(
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('trash') trash?: string,
  ) {
    const params: PaginationParams = {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      search: search || '',
      trash: trash === 'true',
    };
    return this.service.findAll(subscriberId, params, isSystemManager);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.service.findOne(id, subscriberId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: any,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.service.create(body, subscriberId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.service.update(id, body, subscriberId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.service.remove(id, subscriberId);
  }
}
