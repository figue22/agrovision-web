'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, Shield } from 'lucide-react';
import { authService, AuthResponse } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/services/api';

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [credentials, setCredentials] = useState<{ correo: string; contrasena: string } | null>(null);
  const [code2fa, setCode2fa] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', contrasena: '' },
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({
        correo: data.correo,
        contrasena: data.contrasena,
      });

      if ('requiere_2fa' in response) {
        setNeeds2fa(true);
        setCredentials({ correo: data.correo, contrasena: data.contrasena });
        setLoading(false);
        return;
      }

      const authData = response as AuthResponse;
      setAuth(authData.usuario, authData.access_token, authData.refresh_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit2fa = async () => {
    if (!credentials || code2fa.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login-2fa', {
        correo: credentials.correo,
        contrasena: credentials.contrasena,
        codigo_2fa: code2fa,
      });

      setAuth(response.data.usuario, response.data.access_token, response.data.refresh_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Código 2FA inválido');
      setCode2fa('');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setNeeds2fa(false);
    setCredentials(null);
    setCode2fa('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">
            {needs2fa ? 'Verificación 2FA' : 'Iniciar sesión'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {needs2fa
              ? 'Ingresa el código de tu app autenticadora'
              : 'Ingresa a tu cuenta de AgroVision'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!needs2fa ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
              <input
                {...register('correo')}
                type="email"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="juan@correo.com"
              />
              {errors.correo && <p className="mt-1 text-xs text-red-500">{errors.correo.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
              <input
                {...register('contrasena')}
                type="password"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="Tu contraseña"
              />
              {errors.contrasena && <p className="mt-1 text-xs text-red-500">{errors.contrasena.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Ingresando...</> : 'Iniciar sesión'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="font-medium text-emerald-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-50 p-4"><Shield className="h-8 w-8 text-blue-600" /></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Abre Google Authenticator o Authy e ingresa el código de 6 dígitos
              </p>
            </div>

            <div className="flex justify-center">
              <input
                value={code2fa}
                onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 w-48 rounded-xl border bg-background text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="000000"
                maxLength={6}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') onSubmit2fa(); }}
              />
            </div>

            <button
              onClick={onSubmit2fa}
              disabled={loading || code2fa.length !== 6}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</> : 'Verificar código'}
            </button>

            <button
              onClick={backToLogin}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}