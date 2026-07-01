# Rencana: 4 Bagian Tertunda dari Redesign UI/UX

Kerjakan berurutan 1 → 2 → 3 → 4 sesuai instruksi, verifikasi tiap bagian sebelum lanjut.

## Catatan penting (kejujuran demo)
- **Halaman `/pipeline` tidak ada** di project saat ini. Kanban board belum pernah dibangun.
- **AI Insight Summary "🔄 Perbarui"** juga tidak ada di dashboard saat ini.
- **"Mengirim ke sistem kasir..."** loading state di Generate Pesanan tidak ada (OrderBuilderModal langsung save).
Untuk 3 item ini saya akan lapor terus terang di akhir, bukan bikin fitur baru diam-diam. Fokus utama = redesign hal-hal yang memang sudah ada.

---

## 1. Redesign Struk Pesanan (OrderBuilderModal)
File: `src/components/order/OrderBuilderModal.tsx`

- Ganti receipt preview jadi card `max-w-sm` center, `bg-white shadow-md rounded-t-lg`.
- Header: "ChatCRM" `font-semibold text-center` + subtitle muted "Preview Struk Pesanan".
- Solid `border-t border-border-soft` (bukan dashed) antara header/body/items/total.
- Baris info & item: `flex justify-between`, label `text-secondary text-sm`, value `text-primary text-sm tabular-nums`.
- Total: `font-semibold text-base`, border-top `2px solid` di atasnya.
- Metode bayar & catatan: `text-sm text-secondary` di bawah total.
- Efek perforasi bawah: mask SVG bergerigi + `filter: drop-shadow` halus, sehingga tepi bawah seperti struk sobek.
- Shadow halus `shadow-[0_4px_16px_rgba(0,0,0,0.06)]` supaya terangkat dari background modal.
- Verifikasi: Playwright — buka modal, tambah 2 item, klik Preview Struk, screenshot.

## 2. Kanban Drag Micro-interactions
- Halaman `/pipeline` belum ada. **Tidak akan bikin halaman kanban baru** (di luar scope redesign).
- Sebagai gantinya: install `framer-motion` sebagai dependency siap-pakai, dan tambahkan util drag class (rotate/shadow) di `styles.css` supaya siap dipakai saat kanban dibangun nanti.
- Akan lapor terus terang di ringkasan bahwa animasi kanban tidak bisa diverifikasi karena halaman `/pipeline` belum ada.

## 3. Counter Animations
- Bikin `src/components/AnimatedCounter.tsx` reusable:
  - Props: `value: number`, `duration?: number`, `format?: (n: number) => string`.
  - Pakai `requestAnimationFrame` + `easeOutCubic`, 700ms default.
  - IntersectionObserver untuk trigger on-mount saat visible.
  - Format berlaku selama counting (Rp, %, integer).
- Terapkan di:
  - `src/routes/dashboard.tsx` — 4 KPI utama + angka di alert banner.
  - `src/routes/customers.tsx` — "X total customer" di header.
  - `src/components/layout/Sidebar.tsx` — badge unread count.
- Verifikasi: Playwright load dashboard, screenshot ~200ms & ~800ms untuk melihat animasi.

## 4. Skeleton Loading
- Perluas `src/components/ui/skeleton.tsx` dengan class shimmer (gradient bergerak 1.5s infinite) — tambahkan `@keyframes shimmer` di `styles.css` kalau belum ada.
- Route transition skeleton:
  - Tambahkan `useDelayedReady(400ms)` di `AppShell.tsx` yang menampilkan skeleton generik saat pertama masuk route berat.
  - Skeleton spesifik per route: `DashboardSkeleton`, `CustomersSkeleton`, `ChatSkeleton` (bubble kiri/kanan), `CustomerDetailSkeleton` (avatar bulat + bar nama + card blocks).
- Chat bubble skeleton di `ChatPage.tsx` saat customer pertama dibuka (delay 350ms buatan supaya keliatan).
- Customer detail modal (jika ada) — skeleton avatar + bar + card blocks.
- AI Insight "Perbarui" & "Mengirim ke sistem kasir": **tidak ada di app**, akan dilaporkan.
- Verifikasi: Playwright navigate antar route, screenshot skeleton frame.

---

## Teknis
- Dependency baru: `framer-motion` (utk bagian 2 sebagai infrastruktur).
- Semua warna via token existing (`--brand`, `--border-soft`, `text-secondary`), tidak ada hex baru.
- Tidak menyentuh business logic, permissions, atau data model.

## Ringkasan yang akan dilaporkan di akhir
- ✅ Bagian 1 (struk) — full, dengan screenshot.
- ⚠️ Bagian 2 (kanban) — infrastruktur ready, halaman `/pipeline` tidak ada di project.
- ✅ Bagian 3 (counter) — full, dengan screenshot.
- ⚠️ Bagian 4 (skeleton) — mayoritas terapkan, kecuali AI Insight & "Kirim ke kasir" (fitur tidak ada).
