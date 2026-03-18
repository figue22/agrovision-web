'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

// ── Validación con Zod ──

const step1Schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  correo: z.string().email('Correo inválido'),
  telefono: z.string().optional(),
  contrasena: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      'Debe tener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial',
    ),
  confirmarContrasena: z.string(),
}).refine((data) => data.contrasena === data.confirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarContrasena'],
});

const step2Schema = z.object({
  cedula: z.string().min(5, 'Cédula inválida'),
  municipio: z.string().min(2, 'Municipio obligatorio'),
  departamento: z.string().min(2, 'Departamento obligatorio'),
  direccion: z.string().optional(),
  tamano_finca_ha: z.union([z.number().min(0), z.nan()]).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 form
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { nombre: '', apellido: '', correo: '', telefono: '', contrasena: '', confirmarContrasena: '' },
  });

  // Step 2 form
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { cedula: '', municipio: '', departamento: '', direccion: '', tamano_finca_ha: undefined },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
    setError('');
  };

  const onStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;
    setLoading(true);
    setError('');

    try {
      const response = await authService.register({
        correo: step1Data.correo,
        contrasena: step1Data.contrasena,
        nombre: step1Data.nombre,
        apellido: step1Data.apellido,
        telefono: step1Data.telefono || undefined,
        agricultor: {
          cedula: data.cedula,
          municipio: data.municipio,
          departamento: data.departamento,
          direccion: data.direccion || undefined,
          tamano_finca_ha: data.tamano_finca_ha && !isNaN(data.tamano_finca_ha)
            ? data.tamano_finca_ha
            : undefined,
        },
      });

      setAuth(response.usuario, response.access_token, response.refresh_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Regístrate como agricultor en AgroVision
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>1</div>
            <span className="text-sm font-medium">Datos personales</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>2</div>
            <span className="text-sm font-medium">Datos de finca</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Datos personales */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nombre</label>
                <input
                  {...form1.register('nombre')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                  placeholder="Juan Manuel"
                />
                {form1.formState.errors.nombre && (
                  <p className="mt-1 text-xs text-red-500">{form1.formState.errors.nombre.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Apellido</label>
                <input
                  {...form1.register('apellido')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                  placeholder="Figueroa Valencia"
                />
                {form1.formState.errors.apellido && (
                  <p className="mt-1 text-xs text-red-500">{form1.formState.errors.apellido.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
              <input
                {...form1.register('correo')}
                type="email"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="juan@correo.com"
              />
              {form1.formState.errors.correo && (
                <p className="mt-1 text-xs text-red-500">{form1.formState.errors.correo.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Teléfono <span className="text-muted-foreground">(opcional)</span></label>
              <input
                {...form1.register('telefono')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="+573001234567"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
              <input
                {...form1.register('contrasena')}
                type="password"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="Mínimo 8 caracteres"
              />
              {form1.formState.errors.contrasena && (
                <p className="mt-1 text-xs text-red-500">{form1.formState.errors.contrasena.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirmar contraseña</label>
              <input
                {...form1.register('confirmarContrasena')}
                type="password"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="Repite tu contraseña"
              />
              {form1.formState.errors.confirmarContrasena && (
                <p className="mt-1 text-xs text-red-500">{form1.formState.errors.confirmarContrasena.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="font-medium text-emerald-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Datos de finca */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cédula de ciudadanía</label>
              <input
                {...form2.register('cedula')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="1053845678"
              />
              {form2.formState.errors.cedula && (
                <p className="mt-1 text-xs text-red-500">{form2.formState.errors.cedula.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Municipio</label>
                <input
                  {...form2.register('municipio')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                  placeholder="Manizales"
                />
                {form2.formState.errors.municipio && (
                  <p className="mt-1 text-xs text-red-500">{form2.formState.errors.municipio.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Departamento</label>
                <input
                  {...form2.register('departamento')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                  placeholder="Caldas"
                />
                {form2.formState.errors.departamento && (
                  <p className="mt-1 text-xs text-red-500">{form2.formState.errors.departamento.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Dirección <span className="text-muted-foreground">(opcional)</span></label>
              <input
                {...form2.register('direccion')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="Vereda La Esperanza, Km 5"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Tamaño de finca (hectáreas) <span className="text-muted-foreground">(opcional)</span></label>
              <input
                {...form2.register('tamano_finca_ha', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                placeholder="3.5"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-background text-sm font-medium transition-colors hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
