'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Loader2, Navigation } from 'lucide-react';
import { parcelasService } from '@/services/parcelas.service';

const parcelaSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  latitud: z.number({ error: 'Latitud requerida' }).min(-90).max(90),
  longitud: z.number({ error: 'Longitud requerida' }).min(-180).max(180),
  area_hectareas: z.number({ error: 'Área requerida' }).min(0.01, 'Debe ser mayor a 0'),
  tipo_suelo: z.string().optional(),
  ph_suelo: z.union([z.number().min(0).max(14), z.nan()]).optional(),
  altitud_msnm: z.union([z.number().min(0), z.nan()]).optional(),
  limites_geojson_text: z.string().optional(),
});

type ParcelaForm = z.infer<typeof parcelaSchema>;

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200";

export default function NewParcelaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ParcelaForm>({
    resolver: zodResolver(parcelaSchema),
  });

  useEffect(() => { captureGPS(); }, []);

  const captureGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitud', parseFloat(pos.coords.latitude.toFixed(6)));
        setValue('longitud', parseFloat(pos.coords.longitude.toFixed(6)));
        if (pos.coords.altitude) setValue('altitud_msnm', Math.round(pos.coords.altitude));
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true },
    );
  };

  const onSubmit = async (data: ParcelaForm) => {
    setLoading(true);
    setError('');
    try {
      let limites = undefined;
      if (data.limites_geojson_text?.trim()) {
        try {
          const parsed = JSON.parse(data.limites_geojson_text);
          if (parsed.type === 'Polygon' && parsed.coordinates) {
            limites = parsed;
          } else {
            setError('El GeoJSON debe tener type: "Polygon" y coordinates');
            setLoading(false);
            return;
          }
        } catch {
          setError('El formato del GeoJSON no es válido. Debe ser JSON válido.');
          setLoading(false);
          return;
        }
      }

      await parcelasService.create({
        nombre: data.nombre,
        ubicacion: { latitud: data.latitud, longitud: data.longitud },
        area_hectareas: data.area_hectareas,
        tipo_suelo: data.tipo_suelo || undefined,
        ph_suelo: data.ph_suelo && !isNaN(data.ph_suelo) ? data.ph_suelo : undefined,
        altitud_msnm: data.altitud_msnm && !isNaN(data.altitud_msnm) ? data.altitud_msnm : undefined,
        limites_geojson: limites,
      });
      router.push('/parcels');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al crear la parcela');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/parcels" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva parcela</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra una nueva parcela con geolocalización</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nombre de la parcela</label>
          <input {...register('nombre')} className={inputClass} placeholder="Parcela San José" />
          {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium">Ubicación GPS</label>
            <button type="button" onClick={captureGPS} disabled={gpsLoading} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
              {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
              {gpsLoading ? 'Obteniendo...' : 'Capturar GPS'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input {...register('latitud', { valueAsNumber: true })} type="number" step="any" className={inputClass} placeholder="Latitud (ej: 5.0689)" />
              {errors.latitud && <p className="mt-1 text-xs text-red-500">{errors.latitud.message}</p>}
            </div>
            <div>
              <input {...register('longitud', { valueAsNumber: true })} type="number" step="any" className={inputClass} placeholder="Longitud (ej: -75.5174)" />
              {errors.longitud && <p className="mt-1 text-xs text-red-500">{errors.longitud.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Área (hectáreas)</label>
          <input {...register('area_hectareas', { valueAsNumber: true })} type="number" step="0.01" className={inputClass} placeholder="3.5" />
          {errors.area_hectareas && <p className="mt-1 text-xs text-red-500">{errors.area_hectareas.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Tipo de suelo <span className="text-muted-foreground">(opcional)</span></label>
          <select {...register('tipo_suelo')} className={inputClass}>
            <option value="">Seleccionar...</option>
            <option value="arcilloso">Arcilloso</option>
            <option value="arenoso">Arenoso</option>
            <option value="limoso">Limoso</option>
            <option value="franco">Franco</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">pH del suelo <span className="text-muted-foreground">(opc)</span></label>
            <input {...register('ph_suelo', { valueAsNumber: true })} type="number" step="0.1" min="0" max="14" className={inputClass} placeholder="6.5" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Altitud msnm <span className="text-muted-foreground">(opc)</span></label>
            <input {...register('altitud_msnm', { valueAsNumber: true })} type="number" min="0" className={inputClass} placeholder="1520" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Límites GeoJSON <span className="text-muted-foreground">(opcional)</span></label>
          <textarea
            {...register('limites_geojson_text')}
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 font-mono"
            placeholder='{"type":"Polygon","coordinates":[[[-75.518,5.068],[-75.516,5.068],[-75.516,5.069],[-75.518,5.069],[-75.518,5.068]]]}'
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Pega un GeoJSON Polygon. Las coordenadas van en formato [longitud, latitud]. El primer y último punto deben ser iguales.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/parcels" className="flex h-10 flex-1 items-center justify-center rounded-lg border bg-background text-sm font-medium hover:bg-accent">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</> : <><MapPin className="h-4 w-4" /> Crear parcela</>}
          </button>
        </div>
      </form>
    </div>
  );
}
