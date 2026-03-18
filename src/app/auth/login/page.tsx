'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

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

      setAuth(response.usuario, response.access_token, response.refresh_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa a tu cuenta de AgroVision
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
            <input
              {...register('correo')}
              type="email"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
              placeholder="juan@correo.com"
            />
            {errors.correo && (
              <p className="mt-1 text-xs text-red-500">{errors.correo.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
            <input
              {...register('contrasena')}
              type="password"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
              placeholder="Tu contraseña"
            />
            {errors.contrasena && (
              <p className="mt-1 text-xs text-red-500">{errors.contrasena.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Ingresando...</>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="font-medium text-emerald-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
