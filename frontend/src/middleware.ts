import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Rate limiting configuration per governance.yaml
// 100 req/5min/IP (generate endpoint: 10/5min)
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes in ms
const DEFAULT_RATE_LIMIT = 100;
const GENERATE_RATE_LIMIT = 10;

// In-memory store for demo (production should use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Create internationalization middleware
const intlMiddleware = createMiddleware({
  locales: ['ja', 'en', 'zz-ZZ'],
  defaultLocale: 'ja',
  localePrefix: 'always'
});

function getRateLimitData(ip: string, isGenerateEndpoint: boolean) {
  const limit = isGenerateEndpoint ? GENERATE_RATE_LIMIT : DEFAULT_RATE_LIMIT;
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  
  if (!existing || now > existing.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(ip, { count: 1, resetTime });
    return { count: 1, limit, resetTime };
  }
  
  existing.count += 1;
  return { count: existing.count, limit, resetTime: existing.resetTime };
}

export function middleware(request: NextRequest) {
  // Apply internationalization first for locale detection
  if (!request.nextUrl.pathname.startsWith('/api') && 
      !request.nextUrl.pathname.startsWith('/_next')) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;
  }
  
  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.includes('/generate')) {
    
    // Get client IP - Next.js 15 compatible
    const ip = request.headers.get('x-real-ip') ?? 
      request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
      '127.0.0.1';
    
    const isGenerateEndpoint = request.nextUrl.pathname.includes('/generate');
    const { count, limit, resetTime } = getRateLimitData(ip, isGenerateEndpoint);
    
    if (count > limit) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${limit}/5min`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }
    
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', (limit - count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for static assets and API routes for i18n
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Include API routes for rate limiting
    '/api/:path*',
    '/generate/:path*',
  ],
};