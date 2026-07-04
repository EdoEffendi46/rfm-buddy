import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

export function BranchManagementSection() {
  const { branches, addBranch, toggleBranchActive, agents, customers } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [waNumber, setWaNumber] = useState("");

  const submit = () => {
    if (!name.trim() || !city.trim() || !waNumber.trim()) {
      toast.error("Nama, kota, dan nomor WA wajib diisi");
      return;
    }
    const formatted = waNumber.replace(/\D/g, "").replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
    addBranch({
      name: name.trim(),
      city: city.trim(),
      waNumber: waNumber.replace(/\D/g, ""),
      waNumberFormatted: formatted,
      isActive: true,
    });
    toast.success("Cabang ditambahkan");
    setName("");
    setCity("");
    setWaNumber("");
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500" />
          <h2 className="text-base font-semibold">Manajemen Cabang</h2>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#16A34A] text-white hover:bg-[#15803D]"
        >
          <Plus className="h-4 w-4" /> Tambah Cabang
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="pb-2 text-left">Nama Cabang</th>
            <th className="pb-2 text-left">Kota</th>
            <th className="pb-2 text-left">Nomor WA</th>
            <th className="pb-2 text-right">CS</th>
            <th className="pb-2 text-right">Customer</th>
            <th className="pb-2 text-center">Aktif</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => {
            const csCount = agents.filter((a) => a.branchId === b.id && a.role === "cs").length;
            const custCount = customers.filter((c) => c.branchId === b.id).length;
            return (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="py-2 font-medium">{b.name}</td>
                <td>{b.city}</td>
                <td className="font-mono text-xs">{b.waNumberFormatted}</td>
                <td className="text-right font-mono text-xs">{csCount}</td>
                <td className="text-right font-mono text-xs">{custCount}</td>
                <td className="text-center">
                  <Switch
                    checked={b.isActive}
                    onCheckedChange={() => {
                      toggleBranchActive(b.id);
                      toast.success(b.isActive ? "Cabang dinonaktifkan" : "Cabang diaktifkan");
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Cabang Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Nama Cabang</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cabang Yogyakarta"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Kota</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Yogyakarta"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Nomor WhatsApp</label>
              <Input
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="081234500003"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} className="bg-[#16A34A] text-white hover:bg-[#15803D]">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}