# Rencana: Multi-Cabang & Google Contacts Sync

Kerjakan **Fitur 1 sampai selesai**, verifikasi, baru **Fitur 2**. Semua field baru optional (backward compatible), pakai `hasPermission` (bukan hardcode role).

## Fitur 1 — Multi-Cabang & Multi-Nomor WA

**Types** (`src/types/index.ts`):
- `Branch { id, name, city, waNumber, waNumberFormatted, isActive, createdAt }`
- `Agent.branchId?: string`, `Customer.branchId?: string`
- Tambah 4 permission ke `Permission` union: `branch_view_own`, `branch_view_all`, `branch_manage`, `branch_view_cross_open_assigned`

**Permission defaults** (`src/lib/permissions.ts`):
- cs: `branch_view_own` + `branch_view_cross_open_assigned` = true
- supervisor: + `branch_view_all` + `branch_manage`
- owner: semua true
- Tambah helper `canViewConversation(agent, customer)` — same-branch → boleh; beda branch → butuh `branch_view_all` atau (`branch_view_cross_open_assigned` + status open + `assignedAgentId === agent.id`)

**Seed**:
- `src/data/branches.ts` (br-smg, br-jpr)
- `src/data/agents.ts`: rina/budi → br-smg, sari → br-jpr; admin/hartono tanpa branchId
- `src/data/customers.ts`: split 7 Semarang / 5 Jepara, 1 customer Jepara open+assigned ke Rina untuk demo cross-branch

**Store**: aksi `addBranch`, `updateBranch`, `toggleBranchActive`, `setAgentBranch`; state `branches[]` + selected branch filter untuk `branch_view_all`.

**Filtering**: 
- `useCustomers` & `useConversations`: pakai `canViewConversation` menggantikan filter branch (canAccessCustomer tetap sebagai gate assignment)
- Hormati filter branch aktif (dropdown) untuk agent dengan `branch_view_all`

**UI**:
- `AppShell` topbar: `BranchSwitcher` — dropdown untuk `branch_view_all`, label statis untuk lainnya (icon `Building2`)
- `ChatPage` conversation list: badge "Lintas Cabang" (`ArrowLeftRight` 10px, purple-50/purple-600) bila `customer.branchId !== agent.branchId`
- `settings.tsx`: sub-nav "Manajemen Cabang" (gate `branch_manage`) — tabel + modal tambah cabang + toggle aktif; di Manajemen Agent tambah dropdown Cabang
- `dashboard.tsx`: dropdown filter cabang untuk agent dengan `branch_view_all`, filter enriched customers

## Fitur 2 — Google Contacts Sync (Placeholder)

**Types**: `Customer.googleContactSynced?`, `googleContactSyncedAt?`
**Lib**: `src/lib/googleContactsSync.ts` — placeholder sesuai spec (1s delay, console.log, return fake contactId), comment jelas "PLACEHOLDER"
**Store**: settings `googleContactsSync: { enabled, connected, autoSync, history: [] }`
**Integrasi**:
- Add Customer flow di `customers.tsx`: bila autoSync aktif → panggil placeholder, toast "📱 Kontak disinkronkan ke Google (Simulasi)", set flag + timestamp
- Badge `Smartphone` hijau di tabel customer bila synced (tooltip "Tersinkron ke Google Contacts")
**Settings**: sub-nav "Integrasi Google Contacts" — card status "Belum Terhubung", deskripsi, toggle auto-sync (label "Mode Simulasi"), tombol "Hubungkan Akun Google" → toast jujur soal butuh OAuth + verifikasi Google, info box estimasi 3-7 hari, riwayat sinkronisasi dummy bila autoSync aktif

## Verifikasi
- `bun run lint && bun run build`
- Manual: login Rina/Sari/Admin/Hartono → cek filter customer & chat, cross-branch badge, manajemen cabang, add customer + sync toast
- Laporan jujur bagian mana yang selesai / trade-off

## Trade-off yang saya antisipasi
- `settings.tsx` sudah 1727 baris — saya extract "Manajemen Cabang" & "Google Contacts" ke `src/components/settings/BranchManagement.tsx` & `GoogleContactsSection.tsx` biar tidak menambah beban.
- `AppShell` cuma 42 baris tanpa topbar khusus — saya tambahkan slot topbar minimal untuk BranchSwitcher (tidak mengubah layout drastis).
- Branch filter global disimpan di store sebagai `selectedBranchFilter?: string | "all"` — dipakai `useCustomers`, `useConversations`, `dashboard`.

Lanjut implement?
