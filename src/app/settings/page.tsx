'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Settings, Shield, Loader2, CheckCircle2, QrCode, Key, RefreshCw, Copy, Check } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsPage() {
  const { usuario } = useAuthStore();
  const [twoFaStatus, setTwoFaStatus] = useState<{ tiene_2fa: boolean; backup_codes_remaining: number } | null>(null);
  const [qrData, setQrData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const check2faStatus = async () => {
    try {
      const res = await api.get<{ tiene_2fa: boolean; backup_codes_remaining: number }>('/auth/2fa/status');
      setTwoFaStatus(res.data);
    } catch {
      setError('Error al verificar estado 2FA');
    }
  };

  const generate2fa = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ secret: string; otpauth_url: string; qr_code: string }>('/auth/2fa/generate');
      setQrData({ secret: res.data.secret, qr_code: res.data.qr_code });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar QR');
    } finally {
      setLoading(false);
    }
  };

  const verify2fa = async () => {
    if (code.length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ mensaje: string; backup_codes: string[] }>('/auth/2fa/verify', { codigo: code });
      setMessage(res.data.mensaje);
      setBackupCodes(res.data.backup_codes);
      setQrData(null);
      setCode('');
      setTwoFaStatus({ tiene_2fa: true, backup_codes_remaining: res.data.backup_codes.length });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const disable2fa = async () => {
    if (code.length < 6) { setError('Ingresa tu código TOTP o un código de respaldo'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ mensaje: string }>('/auth/2fa/disable', { codigo: code });
      setMessage(res.data.mensaje);
      setCode('');
      setTwoFaStatus({ tiene_2fa: false, backup_codes_remaining: 0 });
      setBackupCodes(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (code.length !== 6) { setError('Ingresa tu código TOTP actual'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ backup_codes: string[] }>('/auth/2fa/regenerate-backup', { codigo: code });
      setBackupCodes(res.data.backup_codes);
      setCode('');
      setMessage('Nuevos códigos de respaldo generados');
      setTwoFaStatus((prev) => prev ? { ...prev, backup_codes_remaining: res.data.backup_codes.length } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!backupCodes) return;
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (twoFaStatus === null) { check2faStatus(); }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferencias de seguridad y cuenta</p>
      </div>

      {/* 2FA Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Shield className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-semibold">Autenticación en dos pasos (2FA)</h2>
            <p className="text-xs text-muted-foreground">Agrega una capa extra de seguridad con Google Authenticator o Authy</p>
          </div>
        </div>

        {twoFaStatus === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</div>
        ) : twoFaStatus.tiene_2fa ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /> 2FA está activo</div>
              <span className="text-xs text-muted-foreground">
                <Key className="mr-1 inline h-3 w-3" />{twoFaStatus.backup_codes_remaining} códigos de respaldo restantes
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Código TOTP o código de respaldo:</label>
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))} className="h-10 w-48 rounded-lg border bg-background px-3 text-center text-lg tracking-widest outline-none focus:border-emerald-300" placeholder="000000" maxLength={8} />
                <button onClick={disable2fa} disabled={loading} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desactivar'}
                </button>
                <button onClick={regenerateBackupCodes} disabled={loading} className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerar códigos
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">2FA no está activo.</p>

            {!qrData ? (
              <button onClick={generate2fa} disabled={loading} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Activar 2FA
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-medium">1. Escanea este QR con Google Authenticator o Authy:</p>
                  <div className="flex justify-center">
                    <Image src={qrData.qr_code} alt="QR Code 2FA" width={192} height={192} className="rounded-lg" />
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">O ingresa manualmente: <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{qrData.secret}</code></p>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">2. Ingresa el código de 6 dígitos:</p>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-10 w-40 rounded-lg border bg-background px-3 text-center text-lg tracking-widest outline-none focus:border-emerald-300" placeholder="000000" maxLength={6} />
                    <button onClick={verify2fa} disabled={loading || code.length !== 6} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar y activar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{message}</div>}
      </div>

      {/* Backup Codes */}
      {backupCodes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700"><Key className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Códigos de respaldo</h2>
                <p className="text-xs text-amber-700">Guarda estos códigos en un lugar seguro. Cada uno funciona una sola vez.</p>
              </div>
            </div>
            <button onClick={copyBackupCodes} className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copiados</> : <><Copy className="h-3.5 w-3.5" /> Copiar todos</>}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {backupCodes.map((bc, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-center font-mono text-sm font-medium text-amber-900">
                {bc}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-600">
            Si pierdes acceso a tu app autenticadora, puedes usar uno de estos códigos para iniciar sesión.
            Después de usar un código, se elimina automáticamente.
          </p>
        </div>
      )}

      {/* Account info */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-gray-100 p-2 text-gray-600"><Settings className="h-5 w-5" /></div>
          <h2 className="text-lg font-semibold">Información de cuenta</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Correo</span><span className="font-medium">{usuario?.correo}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{usuario?.nombre} {usuario?.apellido}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Rol</span><span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{usuario?.rol}</span></div>
        </div>
      </div>
    </div>
  );
}