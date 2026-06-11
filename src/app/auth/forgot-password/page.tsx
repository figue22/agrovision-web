'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Leaf, Loader2, ArrowLeft, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<{
    mensaje: string;
    dev_reset_url?: string;
    dev_token?: string;
    dev_expira?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.forgotPassword(correo);
      setResultado(res);
    } catch {
      setResultado({ mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">
            {resultado ? 'Solicitud enviada' : 'Recuperar contraseña'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {resultado
              ? resultado.mensaje
              : 'Te enviaremos un enlace para restablecer tu contraseña'}
          </p>
        </div>

        {resultado ? (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-50 p-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
            </div>

            {resultado.dev_reset_url && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  🛠 Modo desarrollo — enlace de recuperación
                </p>
                <p className="text-xs text-amber-700">
                  En producción este enlace se enviaría por correo. Por ahora úsalo directamente:
                </p>
                <a
                  href={resultado.dev_reset_url}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir enlace de recuperación
                </a>
                <div className="space-y-1 text-[11px] text-amber-600">
                  <p>Token: <span className="font-mono break-all">{resultado.dev_token}</span></p>
                  <p>Expira: {resultado.dev_expira ? new Date(resultado.dev_expira).toLocaleString('es-CO') : '—'}</p>
                </div>
              </div>
            )}

            {!resultado.dev_reset_url && (
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground text-center">
                Revisa tu bandeja de entrada y también la carpeta de spam.
                El enlace es válido por <span className="font-medium text-foreground">1 hora</span>.
              </div>
            )}

            <button
              onClick={() => { setResultado(null); setCorreo(''); }}
              className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-accent"
            >
              Intentar con otro correo
            </button>

            <div className="text-center">
              <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                  placeholder="juan@correo.com"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !correo}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Recuperar contraseña'}
            </button>

            <div className="text-center">
              <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}