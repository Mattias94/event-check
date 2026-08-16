import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { SessionTokenPayload, verifySessionToken } from '../session-token'

interface AuthenticatedRequest {
  headers: Record<string, string | undefined>
  user?: SessionTokenPayload
}

/**
 * Protege rotas exclusivas de ADMIN. Exige o header
 * `Authorization: Bearer <token>` com o JWT de sessão emitido no login
 * e verifica se o papel embutido no token é `admin`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const header = request.headers.authorization

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Autenticação necessária')
    }

    const payload = verifySessionToken(header.slice('Bearer '.length))
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
