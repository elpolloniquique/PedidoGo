import type { NextConfig } from 'next';
import { buildSecurityHeaderRoutes } from '@pedidosgo/config';
import fs from 'node:fs';
import path from 'node:path';

/** Carga .env.local / .env desde la raíz del monorepo PedidoGo. */
function loadRootEnv() {
  const root = path.join(__dirname, '../..');
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadRootEnv();

const nextConfig: NextConfig = {
  transpilePackages: [
    '@pedidosgo/ui',
    '@pedidosgo/config',
    '@pedidosgo/types',
    '@pedidosgo/shared',
    '@pedidosgo/validation',
    '@pedidosgo/supabase',
    '@pedidosgo/auth',
    '@pedidosgo/maps',
  ],
  headers: async () => buildSecurityHeaderRoutes(),
};

export default nextConfig;
