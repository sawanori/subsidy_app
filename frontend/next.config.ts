import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 大きなファイルアップロード対応
  experimental: {
    // @ts-ignore
    bodyParser: false, // リバースプロキシでは無効化（バックエンド側で処理）
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // 本番環境ではNEXT_PUBLIC_API_URLを使用、開発環境ではlocalhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    return [
      // Catch-all: proxy all API requests to backend
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/api/intake/:path*',
        destination: `${apiUrl}/intake/:path*`,
      },
      {
        source: '/api/health/:path*',
        destination: `${apiUrl}/health/:path*`,
      },
      {
        source: '/api/evidence/:path*',
        destination: `${apiUrl}/evidence/:path*`,
      },
      {
        source: '/api/applications/:path*',
        destination: `${apiUrl}/applications/:path*`,
      },
      {
        source: '/api/plans/:path*',
        destination: `${apiUrl}/plans/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply CSP to all routes - governance.yaml requirement
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob:", // Per governance.yaml
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // For development
              "connect-src 'self' http://localhost:3001 http://localhost:3000 http://localhost:3002 https://wcxjtqzekllzjpxbbicj.supabase.co https://*.supabase.co",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
