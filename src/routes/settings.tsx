import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/lib/store";
import { Avatar, AgentAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Trash2, Edit2, Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — ChatCRM" }] }),
  component: SettingsPage,
});

type Section = "profile" | "agents" | "templates" | "tags" | "services" | "notifications" | "about";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Profil Saya", icon: "👤" },
  { id: "agents", label: "Manajemen Agent", icon: "👥" },
  { id: "templates", label: "Template Balasan", icon: "⚡" },
  { id: "tags", label: "Tags", icon: "🏷️" },
  { id: "services", label: "Layanan & Produk", icon: "🛠️" },
  { id: "notifications", label: "Notifikasi", icon: "🔔" },
  { id: "about", label: "Tentang Aplikasi", icon: "ℹ️" },
];

function SettingsPage() {
  const [section, setSection] = useState<Section>("profile");
  return (
    <AppShell>
      <div className="flex h-full">
        <aside className="w-[220px] border-r border-slate-200 bg-white p-3">
          <h2 className="px-2 py-2 text-sm font-semibold text-slate-700">Pengaturan</h2>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                  section === s.id ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex-1 overflow-y-auto p-6">
          {section === "profile" && <ProfileSection />}
          {section === "agents" && <AgentsSection />}
          {section === "templates" && <TemplatesSection />}
          {section === "tags" && <TagsSection />}
          {section === "services" && <ServicesSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "about" && <AboutSection />}
        </div>
      </div>
    </AppShell>
  );
}

function ProfileSection() {
  const { agent } = useAuth();
  const { updateAgent, toggleAgentOnline } = useStore();
  const [name, setName] = useState(agent?.name ?? "");
  if (!agent) return null;
  return (
    <Card title="Profil Saya">
      <div className="flex items-center gap-4">
        <AgentAvatar agent={agent} size={64} online />
        <div className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <div className="mt-1 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase">{agent.role}</span>
          </div>
        </div>
        <Button
          onClick={() => { updateAgent(agent.id, { name }); toast.success("Profil diperbarui"); }}
        >Simpan</Button>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
        <div>
          <div className="text-sm font-medium">Status Online</div>
          <div className="text-xs text-slate-500">Tampilkan diri sebagai aktif untuk tim.</div>
        </div>
        <Switch checked={agent.isOnline} onCheckedChange={() => toggleAgentOnline(agent.id)} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
        <div>
          <div className="text-sm font-medium">Password</div>
          <div className="font-mono text-xs text-slate-500">●●●●●●●●</div>
        </div>
        <Button variant="outline" onClick={() => toast.info("Fitur segera hadir")}>Ubah Password</Button>
      </div>
    </Card>
  );
}

function AgentsSection() {
  const { role } = useAuth();
  const { agents, customers, addAgent } = useStore();
  const [name, setName] = useState("");
  const [newRole, setNewRole] = useState<"cs" | "supervisor">("cs");
  const [color, setColor] = useState("#0EA5E9");

  if (role !== "supervisor") {
    return (
      <Card title="Manajemen Agent">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <Lock className="h-4 w-4" /> Hanya Supervisor yang dapat mengelola agent.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Manajemen Agent">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr><th></th><th className="text-left">Nama</th><th className="text-left">Role</th><th className="text-right">Customer</th><th>Status</th></tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-t border-slate-100">
              <td className="py-2"><AgentAvatar agent={a} size={28} /></td>
              <td>{a.name}</td>
              <td><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase">{a.role}</span></td>
              <td className="text-right font-mono text-xs">{customers.filter((c) => c.assignedAgentId === a.id).length}</td>
              <td className="text-center"><span className={cn("inline-block h-2 w-2 rounded-full", a.isOnline ? "bg-emerald-500" : "bg-slate-300")} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 rounded-lg border p-3">
        <div className="mb-2 text-sm font-semibold">+ Tambah Agent</div>
        <div className="flex flex-wrap items-end gap-2">
          <Input value={name} placeholder="Nama" onChange={(e) => setName(e.target.value)} className="w-40" />
          <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cs">CS</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {["#0EA5E9","#8B5CF6","#EC4899","#F59E0B","#22C55E","#EF4444"].map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cn("h-7 w-7 rounded-full border-2", color === c ? "border-slate-700" : "border-transparent")} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Button
            disabled={!name.trim()}
            onClick={() => { addAgent({ name, role: newRole, color, isOnline: true }); setName(""); toast.success("Agent ditambahkan"); }}
            className="bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TemplatesSection() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  return (
    <Card title={`Template Balasan (${templates.length}/20)`}>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-start gap-2 rounded-lg border p-3">
            {editingId === t.id ? (
              <>
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1" rows={2} />
                <Button size="sm" onClick={() => { updateTemplate(t.id, editText); setEditingId(null); toast.success("Template diperbarui"); }}><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <div className="flex-1 text-sm">{t.text}</div>
                <Button size="sm" variant="ghost" onClick={() => { setEditingId(t.id); setEditText(t.text); }}><Edit2 className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Hapus template?")) { deleteTemplate(t.id); toast.success("Template dihapus"); } }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border p-3">
        <div className="text-sm font-semibold">+ Tambah Template</div>
        <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} className="mt-2" rows={2} placeholder="Tulis template..." />
        <Button
          className="mt-2 bg-[#25D366] text-white hover:bg-[#128C7E]"
          disabled={!newText.trim() || templates.length >= 20}
          onClick={() => { addTemplate(newText); setNewText(""); toast.success("Template ditambahkan"); }}
        >Tambah</Button>
      </div>
    </Card>
  );
}

function TagsSection() {
  const { tags, addTag, deleteTag, customers } = useStore();
  const [scope, setScope] = useState<"customer" | "conversation">("customer");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22C55E");
  const list = tags.filter((t) => t.scope === scope);

  return (
    <Card title="Tags">
      <div className="mb-3 flex gap-2">
        {(["customer", "conversation"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              scope === s ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
            )}
          >
            {s === "customer" ? "Tag Customer" : "Tag Percakapan"}
          </button>
        ))}
      </div>
      <div className="space-y-1">
        {list.map((t) => {
          const count = scope === "customer"
            ? customers.filter((c) => c.tags.includes(t.name)).length
            : customers.filter((c) => c.conversationTags.includes(t.name)).length;
          return (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-slate-500">· {count} {scope === "customer" ? "customer" : "percakapan"}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Hapus tag?")) { deleteTag(t.id); toast.success("Tag dihapus"); } }}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-end gap-2 rounded-lg border p-3">
        <div className="flex-1">
          <label className="text-xs font-medium">Nama tag</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {["#22C55E","#EF4444","#F59E0B","#3B82F6","#7C3AED","#EC4899"].map((c) => (
            <button key={c} onClick={() => setColor(c)} className={cn("h-7 w-7 rounded-full border-2", color === c ? "border-slate-700" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button
          disabled={!name.trim()}
          onClick={() => { addTag({ name, color, scope }); setName(""); toast.success("Tag ditambahkan"); }}
          className="bg-[#25D366] text-white hover:bg-[#128C7E]"
        >
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>
    </Card>
  );
}

function ServicesSection() {
  const { services, addService, updateService, deleteService } = useStore();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<"laundry" | "salon">("laundry");

  return (
    <Card title="Layanan & Produk">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr><th className="text-left">Nama</th><th className="text-left">Kategori</th><th className="text-right">Harga Default</th><th></th></tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="py-2">{s.name}</td>
              <td><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", s.category === "laundry" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700")}>{s.category}</span></td>
              <td className="text-right">
                <Input
                  type="number"
                  defaultValue={s.defaultPrice}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== s.defaultPrice) { updateService(s.id, { defaultPrice: v }); toast.success("Harga diperbarui"); }
                  }}
                  className="ml-auto h-7 w-24 text-right"
                />
              </td>
              <td className="text-right">
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Hapus layanan?")) { deleteService(s.id); toast.success("Layanan dihapus"); } }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-end gap-2 rounded-lg border p-3">
        <div className="flex-1">
          <label className="text-xs font-medium">Nama Layanan</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="w-32">
          <label className="text-xs font-medium">Kategori</label>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="laundry">Laundry</SelectItem>
              <SelectItem value="salon">Salon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <label className="text-xs font-medium">Harga</label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <Button
          disabled={!name.trim() || !price}
          onClick={() => { addService({ name, category, defaultPrice: Number(price) }); setName(""); setPrice(""); toast.success("Layanan ditambahkan"); }}
          className="bg-[#25D366] text-white hover:bg-[#128C7E]"
        >
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Total nilai default semua layanan: {formatRupiah(services.reduce((s, x) => s + x.defaultPrice, 0))}</p>
    </Card>
  );
}

function NotificationsSection() {
  const items = [
    "Notifikasi pesan baru masuk",
    "Alert customer At Risk",
    "Reminder follow up Dormant (harian)",
    "Laporan performa harian (email)",
    "Alert jika tidak ada balasan lebih dari 1 jam",
  ];
  const [state, setState] = useState<boolean[]>(items.map(() => true));
  return (
    <Card title="Notifikasi">
      <div className="space-y-2">
        {items.map((label, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">{label}</span>
            <Switch checked={state[i]} onCheckedChange={(v) => setState((s) => s.map((x, j) => j === i ? v : x))} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function AboutSection() {
  return (
    <Card title="Tentang Aplikasi">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white text-xl font-bold">CC</div>
        <div>
          <div className="text-xl font-bold">ChatCRM</div>
          <div className="font-mono text-xs text-slate-500">v1.0.0-demo</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Dibangun dengan React + TypeScript + Tailwind CSS + shadcn/ui.
      </p>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">Proteksi data customer</div>
          Nomor telepon customer terenkripsi (masked) untuk role CS. Hanya Supervisor yang dapat melihat nomor lengkap.
        </div>
      </div>
      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600">
        <li>Omnichannel inbox dengan filter status & segment</li>
        <li>Segmentasi RFM otomatis dari riwayat transaksi</li>
        <li>Estimasi Customer Lifetime Value (CLV)</li>
        <li>Template balasan cepat & catatan internal</li>
        <li>Dashboard analitik untuk Supervisor</li>
      </ul>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}