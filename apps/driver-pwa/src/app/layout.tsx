import type { Metadata, Viewport } from 'next';
import { brandConfig } from '@pedidosgo/config';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: `${brandConfig.appName} — Repartidores`,
  description: brandConfig.appDescription,
  manifest: '/manifest.json',
  applicationName: brandConfig.appShortName,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: brandConfig.appShortName,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: brandConfig.appPrimaryColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
