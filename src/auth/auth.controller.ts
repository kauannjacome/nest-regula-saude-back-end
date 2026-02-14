import { Controller, Post, Get, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  @IsString() @IsNotEmpty()
  email!: string;
  @IsString() @IsNotEmpty()
  password!: string;
  @IsOptional() @IsString()
  twoFactorCode?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.twoFactorCode);
  }

  // ── Public endpoints (no auth) ────────────────────────────────────────

  @Post('register')
  @HttpCode(201)
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('register/validate-cnes')
  async validateCnes(@Query('cnes') cnes: string) {
    return this.authService.validateCnes(cnes);
  }

  @Post('cleanup')
  @HttpCode(200)
  async cleanup() {
    return this.authService.cleanup();
  }

  // ── Authenticated endpoints (skip tenant check) ───────────────────────

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('two-factor/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async twoFactorSetup(@CurrentUser('id') userId: string) {
    return this.authService.twoFactorSetup(userId);
  }

  @Post('two-factor/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async twoFactorVerify(
    @CurrentUser('id') userId: string,
    @Body() body: { code: string },
  ) {
    return this.authService.twoFactorVerify(userId, body.code);
  }

  @Post('two-factor/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async twoFactorDisable(
    @CurrentUser('id') userId: string,
    @Body() body: { password: string },
  ) {
    return this.authService.twoFactorDisable(userId, body.password);
  }

  @Get('two-factor/status')
  @UseGuards(JwtAuthGuard)
  async twoFactorStatus(@CurrentUser('id') userId: string) {
    return this.authService.twoFactorStatus(userId);
  }

  @Post('two-factor/validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async twoFactorValidate(
    @CurrentUser('id') userId: string,
    @Body() body: { code: string },
  ) {
    return this.authService.twoFactorValidate(userId, body.code);
  }
}
