import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { SessionTokenPayload, extractSessionToken, verifySessionToken } from '../session-token'

interface AuthenticatedRequest {
  headers: Record<string, string | undefined>
  cookies?: Record<string, string>
  user?: SessionTokenPayload
}

/**
 * Protege rotas exclusivas de ADMIN. Aceita JWT no header Authorization
 * ou no cookie httpOnly emitido no login.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = extractSessionToken(request)

    if (!token) {
      throw new UnauthorizedException('Autenticação necessária')
    }

    const payload = verifySessionToken(token)
    if (!payload) {
      throw new UnauthorizedException('Sessão inválida ou expirada')
    }

    if (payload.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores')
    }

    request.user = payload
    return true
  }
}
