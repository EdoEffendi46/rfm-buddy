Kerjakan spec dari `prompt_3_fitur_lengkap.txt` secara berurutan (Pipeline → AI Insight → Import). Semua field baru pada types tetap optional agar backward compatible, semua state via `useStore()`, semua permission via `hasPermission`/`hasFlag`, phone via `maskPhone`/`getFieldDisplay`, toast pakai sonner.

## Dependencies baru
- `@dnd-kit/core`, `@dnd-kit/sortable` — drag & drop kanban
- `papaparse` + `@types/papaparse` — CSV parse/unparse
- `xlsx` — parse Excel

## Fitur 1 — Pipeline Kanban (`/pipeline`)
- `src/types/index.ts`: tambah optional `orderStatusChangedAt?: string` di `Customer`.
- `src/lib/store.tsx`: `setOrderStatus` di-update supaya juga menulis `orderStatusChangedAt = new Date().toISOString()` + `logAudit({ action: "settings_changed", ... })` (pakai action yang sudah ada supaya tidak menambah type baru untuk fitur 1).
- `src/routes/pipeline.tsx`: route baru, `AppShell`, filter bar (search, filter CS untuk supervisor/owner via `hasPermission`, filter segment).
- `src/components/pipeline/KanbanBoard.tsx`: 4 kolom (Order Masuk = customer tanpa purchase 14 hari terakhir *atau* segmen "new" tanpa order aktif — implementasi: fallback ke `dalam_proses` juga; kami interpretasikan "Order Masuk" = customer aktif tapi status field belum diset / baru dibuat, praktis kolom pertama menampilkan customer segment "new" dan yang belum punya purchase di 14 hari). Header kolom: nama, jumlah, total nilai (sum `lastPurchase.price`).
- Card: `Avatar`, nama, `SegmentBadge`, `maskPhone(phone, role)`, nama+harga layanan terakhir, `AgentAvatar` kecil, waktu di status dari `orderStatusChangedAt`, priority dot (red/yellow/gray), amber left-border jika `dalam_proses` >24 jam, tombol `MessageSquare` → `/chat/$customerId`.
- Drag & drop pakai `@dnd-kit/core` + `@dnd-kit/sortable`. Saat drop: `setOrderStatus` + toast + audit. Drag handle disembunyikan jika `!hasPermission(agent, "chat_change_order_status")`.
- Sidebar: tambah `NavItem` icon `Kanban` di antara Chat dan Customer.
- Dashboard: tambah KPI "Order Macet" (>24 jam di `dalam_proses`) untuk supervisor/owner, klik → `/pipeline`.

## Fitur 2 — AI Insight + Sentiment
- `src/lib/aiInsight.ts`: `gatherInsightFacts(customer, messages)` + `generateInsightNarrative(facts)` deterministik (seed dari `customer.id + variantSeed`), 3+ template variasi Bahasa Indonesia. Lead: overdue → warning, normal → loyalty/siklus.
- `src/lib/aiSentiment.ts`: `analyzeMessage(content)` + `analyzeConversation(messages)` pakai keyword matching Indonesia (list dari spec).
- `ChatPage.tsx` right panel: card "AI Insight" (icon `Sparkles`), narasi, tombol "Perbarui" (loading 800ms, re-run dengan variant baru), footer muted 11px. Diletakkan setelah profile header, sebelum RFM bars.
- Conversation list: icon 😊/😟 kecil di samping timestamp bila confidence ≥ sedang.
- Chat header: suggested auto-tag dengan dashed border + prefix "✨", tombol ✓ (add ke conversationTags via `addConversationTag`) dan ✕ (dismiss lokal). Gate: `hasPermission(agent, "chat_add_conversation_tag")`.
- Dashboard: card "Percakapan Negatif" untuk supervisor/owner, klik → `/chat`.

## Fitur 3 — Import Customer CSV/Excel
- `src/types/index.ts`: `source?: "manual" | "chat_generated" | "imported"` dan `importBatchTag?: string` di `Customer`. Tambah `"customer_bulk_imported"` di `AuditAction`.
- `src/lib/store.tsx`: `addCustomer` signature tetap kompatibel — `source`/`importBatchTag` optional. Tambah action opsional `bulkAddCustomers` untuk efisiensi (satu batch, satu audit entry).
- `src/routes/customers.tsx`: tombol "Import Customer" outline di sebelah "+ Customer Baru", gate `hasFlag(agent, "customer_create")`. Badge kecil "Import" (icon `Download`) di kolom Nama bila `source === "imported"`.
- `src/components/customers/ImportCustomerModal.tsx`: wizard 4 step (Upload → Mapping → Validasi → Konfirmasi) sesuai spec, papaparse/xlsx, auto-detect kolom, deteksi duplikat by phone digit-only, opsi Lewati/Update/Import ulang, round-robin assignment, tag import, audit `customer_bulk_imported`.

## Verifikasi
`bun run lint && bun run build` + smoke path 3 role.

## Catatan jujur
Ini scope besar (~15-20 file). Saya akan kerjakan **berurutan** dan **berhenti setelah tiap fitur** untuk report progress bila ada satu yang butuh trade-off besar. Yang saya tandai potensi trade-off:
- "Order Masuk" kolom tidak ada di enum `OrderStatus`. Saya interpretasi sebagai bucket UI-only (customer segment "new" + purchase count 0 atau belum ada `orderStatusChangedAt`). Drop ke kolom ini akan set status ke `dalam_proses` dengan flag khusus, atau lebih baik: kolom "Order Masuk" **read-only** (tidak bisa drop ke sana). Saya pilih read-only agar tidak melanggar type.
- Emoji 😊/😟 di conversation list — spec no.6 melarang emoji sebagai pengganti icon, tapi spec fitur 2 eksplisit meminta emoji. Saya ikuti spec eksplisit fitur 2.

Boleh saya lanjut?