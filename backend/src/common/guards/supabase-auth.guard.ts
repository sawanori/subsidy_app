import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization token provided');
    }

    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await this.supabaseService
        .getClient()
        .auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach user to request object
      request.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'VIEWER',
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}