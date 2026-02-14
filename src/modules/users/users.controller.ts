import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, Req, HttpCode, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseCrudController } from '../../crud/base-crud.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { Request } from 'express';

@Controller('users')
export class UsersController extends BaseCrudController {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  // ── Reset Password ────────────────────────────────────────────────────

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async resetPassword(
    @Param('id') targetUserId: string,
    @CurrentUser('id') requesterId: string,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
    @Body() body: { reset2FA?: boolean },
  ) {
    return this.usersService.resetPassword(targetUserId, requesterId, subscriberId, isSystemManager, body?.reset2FA);
  }

  // ── Reset 2FA ─────────────────────────────────────────────────────────

  @Post(':id/reset-2fa')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async reset2FA(
    @Param('id') targetUserId: string,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('isSystemManager') isSystemManager: boolean,
  ) {
    return this.usersService.reset2FA(targetUserId, subscriberId, isSystemManager);
  }

  // ── User Documents ────────────────────────────────────────────────────

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listDocuments(@Param('id') targetUserId: string) {
    return this.usersService.listDocuments(targetUserId);
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadDocument(
    @Param('id') targetUserId: string,
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') uploaderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType?: string,
    @Body('category') category?: string,
    @Body('expiryDays') expiryDays?: string,
  ) {
    return this.usersService.uploadDocument(
      targetUserId, subscriberId, uploaderId, file,
      documentType, category, expiryDays ? parseInt(expiryDays) : undefined,
    );
  }

  @Delete(':id/documents/:docId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async deleteDocument(
    @Param('id') targetUserId: string,
    @Param('docId', ParseIntPipe) docId: number,
  ) {
    return this.usersService.deleteDocument(targetUserId, docId);
  }

  @Post(':id/documents/:docId/access')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async accessDocument(
    @Param('docId', ParseIntPipe) docId: number,
    @CurrentUser('id') userId: string,
    @Body() body: { justification: string; action: string },
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.usersService.accessDocument(docId, userId, body.action, body.justification, ipAddress, userAgent);
  }

  // ── User Employments ──────────────────────────────────────────────────

  @Get(':id/employments')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listEmployments(@Param('id') targetUserId: string) {
    return this.usersService.listEmployments(targetUserId);
  }

  @Post(':id/employments')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(201)
  async createEmployment(
    @Param('id') targetUserId: string,
    @Body() body: { subscriberId: number; unitId?: number; roleId?: string; isPrimary?: boolean },
  ) {
    return this.usersService.createEmployment(targetUserId, body.subscriberId, body.unitId, body.roleId, body.isPrimary);
  }

  @Delete(':id/employments/:empId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async deleteEmployment(@Param('empId', ParseIntPipe) empId: number) {
    return this.usersService.deleteEmployment(empId);
  }

  @Patch(':id/employments/:empId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async updateEmployment(
    @Param('empId', ParseIntPipe) empId: number,
    @Body() body: { isActive?: boolean; roleId?: string; unitId?: number },
  ) {
    return this.usersService.updateEmployment(empId, body);
  }

  // ── Invite ────────────────────────────────────────────────────────────

  @Post('invite')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(200)
  async invite(
    @CurrentUser('subscriberId') subscriberId: number,
    @CurrentUser('id') invitedById: string,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.usersService.invite(subscriberId, invitedById, body.userId, body.roleId);
  }

  // ── Lookup ────────────────────────────────────────────────────────────

  @Get('lookup')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async lookup(
    @Query('cpf') cpf: string,
    @CurrentUser('subscriberId') subscriberId: number,
  ) {
    return this.usersService.lookup(cpf, subscriberId);
  }
}
