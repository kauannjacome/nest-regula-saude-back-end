import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  subscriberId: number;
  isSystemManager: boolean;
  permissions: string[];
  menus: string[];
  role: string | null;
  roleDisplayName: string | null;
  homePage: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      email: payload.email,
      subscriberId: payload.subscriberId,
      isSystemManager: payload.isSystemManager,
      permissions: payload.permissions,
      menus: payload.menus,
      role: payload.role,
      roleDisplayName: payload.roleDisplayName,
      homePage: payload.homePage,
    };
  }
}
