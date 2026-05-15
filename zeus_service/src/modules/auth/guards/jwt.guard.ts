import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader =
      req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return false;
    const parts = String(authHeader).split(' ');
    if (parts.length !== 2) return false;
    const token = parts[1];
    const decoded = this.auth.verifyJwt(token);
    if (!decoded) return false;
    // attach user id to request for downstream handlers
    req.user = { id: decoded.sub };
    return true;
  }
}
