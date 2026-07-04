import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Info, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export function GoogleContactsSection() {
  const { googleContacts, setGoogleContactsAutoSync } = useStore();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-700">
            G
          </div>
          <div>
            <h2 className="text-base font-semibold">Google Contacts</h2>
            <div className="text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Belum Terhubung
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600">
        Setiap kali customer baru ditambahkan, kontaknya akan otomatis muncul di HP yang login
        dengan akun Google yang terhubung. Berguna saat membuat status WhatsApp promosi — semua
        customer bisa melihatnya sebagai kontak tersimpan.
      </p>

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div>
          <div className="text-sm font-medium">Sinkronkan otomatis customer baru</div>
          <div className="text-xs text-slate-500">Mode simulasi — belum terhubung ke Google</div>
        </div>
        <Switch
          checked={googleContacts.autoSync}
          onCheckedChange={(v) => {
            setGoogleContactsAutoSync(v);
            toast.success(v ? "Auto-sync diaktifkan (simulasi)" : "Auto-sync dinonaktifkan");
          }}
        />
      </div>

      <Button
        variant="outline"
        className="mb-3"
        onClick={() =>
          toast.message("Belum tersedia", {
            description:
              "Untuk menghubungkan, perlu setup Google Cloud OAuth Client & verifikasi scope sensitif dari Google. Hubungi tim teknis untuk proses ini.",
          })
        }
      >
        Hubungkan Akun Google
      </Button>

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Estimasi waktu verifikasi Google: 3-7 hari kerja untuk sensitive scope.</span>
      </div>

      {googleContacts.autoSync && googleContacts.history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5" /> Riwayat Sinkronisasi (Simulasi)
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="pb-2 text-left">Nama Customer</th>
                <th className="pb-2 text-left">Waktu</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {googleContacts.history.slice(0, 10).map((h) => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="py-2">{h.customerName}</td>
                  <td className="text-xs text-slate-500">{formatDate(h.syncedAt)}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <Smartphone className="h-3 w-3" /> Tersinkron
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}