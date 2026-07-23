import type { Metadata } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import { brandConfig } from '@pedidosgo/config';
import './globals.css';

const brand = Syne({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${brandConfig.appName} — App del Repartidor`,
  description: brandConfig.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${brand.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
