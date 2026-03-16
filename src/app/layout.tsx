import type { Metadata } from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-64 flex flex-1 flex-col transition-all duration-300">
              <Header />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
