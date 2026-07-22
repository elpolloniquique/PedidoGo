import type { Metadata } from 'next';
import { brandConfig } from '@pedidosgo/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${brandConfig.appName} — Panel Superadministrador`,
  description: brandConfig.appDescription,
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
