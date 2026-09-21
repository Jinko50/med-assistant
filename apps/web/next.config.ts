import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Documents no longer travel through this server: the browser uploads them straight to
  // Supabase Storage with a signed URL, so these limits bound only small metadata calls.
  // They are still raised above the 10 MiB default because a body over
  // proxyClientMaxBodySize is silently TRUNCATED rather than refused, the truncated
  // multipart payload then fails to parse ("expected boundary after body"), and that
  // throws outside any action's try/catch — which is exactly how the family's upload
  // became a full-page server error. Verified by probing a built server at 9/10/11 MiB.
  // Keep in step with MAX_UPLOAD_REQUEST_BYTES in packages/domain/document.ts.
  experimental: { serverActions: { bodySizeLimit: '12mb' }, proxyClientMaxBodySize: '12mb' },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      // Content-Security-Policy is set in proxy.ts instead. Documents are uploaded by the
      // browser straight to Supabase Storage, so connect-src must name that project's
      // origin, and the origin is only known at runtime from app-config.json. A value
      // baked in here at build time would be wrong for any other project.
    ] }];
  },
};
export default config;
