'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);

  useEffect(() => {
    if (!token) setError('El enlace de recuperación es inválido o ha expirado.');
  }, [token]);

  // Validaciones en tiempo real
  const longitudOk  = contrasena.length >= 8;
  const mayusculaOk = /[A-Z]/.test(contrasena);
  const numeroOk    = /[0-9]/.test(contrasena);
  const coincideOk  = contrasena === confirmar && confirmar.length > 0;
  const formValido  = longitudOk && mayusculaOk && numeroOk && coincideOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido || !token) return;

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, contrasena);
      setExitoso(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'El enlace es inválido o ha expirado. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const ReqItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
      {label}
    </li>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">
            {exitoso ? '¡Contraseña actualizada!' : 'Nueva contraseña'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exitoso ? 'Redirigiendo al login...' : 'Elige una contraseña segura para tu cuenta'}
          </p>
        </div>

        {exitoso ? (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-50 p-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu contraseña fue actualizada correctamente. Serás redirigido al login en unos segundos.
            </p>
            <Link href="/auth/login" className="inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Ir al login ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!token && (
              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-sm font-medium text-emerald-600 hover:underline">
                  Solicitar nuevo enlace
                </Link>
              </div>
            )}

            {token && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      className="h-10 w-full rounded-lg border bg-background px-3 pr-9 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                      placeholder="Mínimo 8 caracteres"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Requisitos */}
                  {contrasena.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      <ReqItem ok={longitudOk}  label="Mínimo 8 caracteres" />
                      <ReqItem ok={mayusculaOk} label="Al menos una mayúscula" />
                      <ReqItem ok={numeroOk}    label="Al menos un número" />
                    </ul>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Confirmar contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className={`h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-1 ${
                      confirmar.length > 0
                        ? coincideOk
                          ? 'border-emerald-300 focus:border-emerald-300 focus:ring-emerald-200'
                          : 'border-red-300 focus:border-red-300 focus:ring-red-200'
                        : 'focus:border-emerald-300 focus:ring-emerald-200'
                    }`}
                    placeholder="Repite la contraseña"
                  />
                  {confirmar.length > 0 && !coincideOk && (
                    <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !formValido}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Actualizando...</> : 'Establecer nueva contraseña'}
                </button>
              </>
            )}

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