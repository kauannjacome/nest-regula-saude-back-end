import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Nao autenticado');
    }

    if (user.isSystemManager) {
      return true;
    }

    if (!user.subscriberId) {
      throw new ForbiddenException('Acesso negado. Entre no contexto de um assinante primeiro.');
    }

    return true;
  }
}
