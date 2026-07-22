import type { Metadata } from 'next';
import { brandConfig } from '@pedidosgo/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${brandConfig.appName} — Seguimiento`,
  description: brandConfig.appDescription,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
