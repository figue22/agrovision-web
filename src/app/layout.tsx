import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthLayout } from '@/components/layout/auth-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgroVision — Predictor & RAG-Support',
  description:
    'Plataforma agrícola digital con IA predictiva, sistema RAG y chatbot WhatsApp para agricultores colombianos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <QueryProvider>
          <AuthLayout>{children}</AuthLayout>
        </QueryProvider>
      </body>
    </html>
  );
}