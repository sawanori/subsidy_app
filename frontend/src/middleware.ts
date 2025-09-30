import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = ['/applications', '/profile', '/settings'];
  const authPaths = ['/login', '/signup'];
  const pathname = request.nextUrl.pathname;

  // Check if the path is protected (considering locale prefix)
  const isProtectedPath = protectedPaths.some(path =>
    pathname.includes(path)
  );

  // Check if the path is an auth path
  const isAuthPath = authPaths.some(path =>
    pathname.includes(path)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedPath && !user) {
    // Extract locale from pathname
    const locale = pathname.split('/')[1] || 'ja';
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to applications if accessing auth pages while authenticated
  if (isAuthPath && user) {
    const locale = pathname.split('/')[1] || 'ja';
    return NextResponse.redirect(new URL(`/${locale}/applications`, request.url));
  }

  // Apply internationalization for non-API routes
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
  
  return response;
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