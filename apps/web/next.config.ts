import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Both limits must exceed MAX_DOCUMENT_BYTES (10 MiB) to leave room for multipart
  // framing. proxyClientMaxBodySize defaults to exactly 10 MiB, and a body over it is
  // silently TRUNCATED rather than refused: the multipart payload then fails to parse
  // ("expected boundary after body"), which throws outside the server action's
  // try/catch and renders a full-page server error. Verified by probing a built server
  // with synthetic bodies at 9/10/11 MiB before and after this setting.
  // Keep in step with MAX_UPLOAD_REQUEST_BYTES in packages/domain/document.ts.
  experimental: { serverActions: { bodySizeLimit: '12mb' }, proxyClientMaxBodySize: '12mb' },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
    ] }];
  },
};
export default config;
