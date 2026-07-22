export type SecurityHeader = {
  key: string;
  value: string;
};

/** Cabeceras HTTP recomendadas para apps Next.js en producción. */
export function getSecurityHeaders(): SecurityHeader[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  let supabaseOrigin = 'https://*.supabase.co';
  try {
    if (supabaseUrl) supabaseOrigin = new URL(supabaseUrl).origin;
  } catch {
    // fallback wildcard
  }

  const mapbox = 'https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com';
  const supabaseWs = supabaseOrigin.includes('*')
    ? 'wss://*.supabase.co'
    : `wss://${new URL(supabaseOrigin).host}`;

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
    `img-src 'self' data: blob: ${mapbox} ${supabaseOrigin}`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseWs} ${mapbox}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(self), payment=()',
    },
    { key: 'Content-Security-Policy', value: csp },
  ];
}

export type NextHeaderRoute = {
  source: string;
  headers: SecurityHeader[];
};

/** Para `headers` en next.config.ts */
export function buildSecurityHeaderRoutes(extra: NextHeaderRoute[] = []): NextHeaderRoute[] {
  return [{ source: '/:path*', headers: getSecurityHeaders() }, ...extra];
}
