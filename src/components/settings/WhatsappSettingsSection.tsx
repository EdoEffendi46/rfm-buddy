import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Copy, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getWhatsappStatusServerFn, type WhatsappConnectionStatus } from "@/lib/whatsapp/status.fn";

function CopyField({ label, value }: { label: string; value: string }) {
  const copy = () => {
    void navigator.clipboard.writeText(value);
    toast.success(`${label} disalin`);
  };

  return (
    <div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border bg-slate-50 px-2 py-1.5 text-xs">
          {value}
        </code>
        <Button type="button" size="sm" variant="outline" onClick={copy} title={`Salin ${label}`}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
      }
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function WhatsappSettingsSection() {
  const [status, setStatus] = useState<WhatsappConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWhatsappStatusServerFn()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat status WhatsApp...
      </div>
    );
  }

  if (!status) {
    return <p className="text-sm text-slate-500">Gagal memuat status koneksi.</p>;
  }

  const receivedWebhook = Boolean(status.connectedAt);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[#25D366]/10 p-2">
            <MessageCircle className="h-5 w-5 text-[#128C7E]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">WhatsApp Business Cloud API</div>
            <p className="mt-1 text-xs text-slate-500">
              Hubungkan nomor WA bisnis ke inbox ChatCRM. Pesan customer masuk via webhook; CS balas
              dari chat.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                ok={status.configured}
                label={status.configured ? "Env OK" : "Env belum lengkap"}
              />
              <StatusBadge
                ok={receivedWebhook}
                label={receivedWebhook ? "Webhook aktif" : "Menunggu webhook"}
              />
            </div>
          </div>
        </div>
      </div>

      {status.configured ? (
        <div className="space-y-3 rounded-xl border p-4">
          <CopyField label="Callback URL (Webhook)" value={status.webhookUrl} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-500">Phone Number ID</div>
              <div className="mt-1 font-mono text-sm">{status.phoneNumberIdMasked ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Nomor bisnis (dari Meta)</div>
              <div className="mt-1 text-sm">{status.phoneDisplay ?? "Belum ada event masuk"}</div>
            </div>
          </div>
          {status.connectedAt && (
            <div className="text-xs text-slate-500">
              Webhook pertama diterima: {new Date(status.connectedAt).toLocaleString("id-ID")}
            </div>
          )}
          {!status.hasAppSecret && (
            <p className="text-xs text-amber-700">
              WHATSAPP_APP_SECRET belum diset. Webhook inbound tidak diverifikasi signature (tidak
              disarankan untuk production).
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
          Isi env vars WhatsApp di server (lihat <code className="text-xs">.env.example</code>),
          lalu restart app.
        </div>
      )}

      <div className="rounded-xl border p-4">
        <div className="mb-2 text-sm font-semibold">Langkah di Meta Developer</div>
        <ol className="list-decimal space-y-2 pl-4 text-xs text-slate-600">
          <li>Buat Business Portfolio di business.facebook.com</li>
          <li>Tambah WhatsApp → daftarkan nomor bisnis</li>
          <li>Developer App → WhatsApp → Configuration</li>
          <li>
            Callback URL: paste webhook di atas · Verify token: sama dengan{" "}
            <code>WHATSAPP_VERIFY_TOKEN</code>
          </li>
          <li>
            Subscribe fields: <strong>messages</strong>
          </li>
          <li>Salin Phone Number ID + Access Token ke env server</li>
          <li>Test: kirim WA ke nomor bisnis → cek inbox ChatCRM</li>
        </ol>
      </div>

      <p className="text-[11px] text-slate-400">
        Local dev: Meta tidak bisa reach localhost. Pakai ngrok (<code>bun dev</code> + tunnel) atau
        deploy preview dulu.
      </p>
    </div>
  );
}
