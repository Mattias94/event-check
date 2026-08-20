import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { SessionTokenPayload, verifySessionToken } from '../session-token'

interface AuthenticatedRequest {
  headers: Record<string, string | undefined>
  params: Record<string, string | undefined>
  user?: SessionTokenPayload
}

/**
 * Protege rotas que operam sobre dados de um usuário específico
 * (`:userId` na rota). Exige sessão válida e que o usuário autenticado
 * seja o dono do recurso — admins têm passe livre.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
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

    const targetUserId = request.params.userId ?? request.params.id
    if (payload.role !== 'admin' && targetUserId && payload.sub !== targetUserId) {
      throw new ForbiddenException('Você não pode acessar inscrições de outro usuário')
    }

    request.user = payload
    return true
  }
}
