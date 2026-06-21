# ChatCRM — Supabase Email Templates

Template HTML bertema ChatCRM (`#25D366`, `#111B21`) dengan copy Bahasa Indonesia.

> **Penting:** File di folder ini **hanya referensi di git**. Supabase **tidak** membacanya otomatis saat deploy / invite dari app. Email tetap default English (`You've been invited` dari `noreply@mail.app.supabase.io`) sampai template dipasang di **Dashboard project yang sama** dengan `VITE_SUPABASE_URL` app kamu.

## Cara pasang (Supabase Dashboard) — wajib untuk hosted

1. Buka project Supabase yang dipakai app (cek `VITE_SUPABASE_URL` di `.env.local` — ref project di subdomain URL).
2. **Authentication → Email Templates**
3. Pilih **Invite user** → paste **Subject** + **Body (HTML)** dari tabel bawah → **Save**
4. Ulangi untuk Recovery / Confirm jika perlu
5. Kirim undangan **baru** (email lama tidak berubah)

**Dual backend:** kalau local pakai project pribadi dan Lovable pakai Cloud — template harus dipasang **di masing-masing project**, bukan cuma satu.

Pastikan **URL Configuration** sudah benar:
- Site URL: `http://localhost:8080` (dev) / domain production
- Redirect: `/accept-invite`, `/reset-password`

---

## Subject lines (Bahasa Indonesia)

| Template di Dashboard | Subject |
|----------------------|---------|
| **Invite user** | `Undangan bergabung ke ChatCRM` |
| **Reset password** | `Reset password ChatCRM` |
| **Confirm signup** | `Konfirmasi email ChatCRM` |
| **Change email** | `Konfirmasi perubahan email ChatCRM` |
| **Magic link** | `Link masuk ChatCRM` |
| **Password changed** (Security) | `Password ChatCRM Anda diperbarui` |

---

## Body HTML — copy dari file

| Template | File |
|----------|------|
| Invite user | [`invite.html`](./invite.html) |
| Reset password | [`recovery.html`](./recovery.html) |
| Confirm signup | [`confirmation.html`](./confirmation.html) |
| Password changed | [`password_changed.html`](./password_changed.html) |

Buka file → **Select All → Copy** → paste ke field **Message body** di Dashboard.

Desain: header gelap + logo **CC**, tombol hijau **full width**, tanpa emoji atau simbol panah di teks tombol.

---

## Variabel Supabase (sudah dipakai)

- `{{ .ConfirmationURL }}` — link utama (invite / reset)
- `{{ .Email }}` — email penerima
- `{{ .Data.name }}` — nama dari invite metadata
- `{{ .Data.role }}` — role (cs / supervisor / owner)
- `{{ .Token }}` — OTP 6 digit (opsional)

---

## Production (beli putus)

Aktifkan **Custom SMTP** di Authentication → SMTP Settings agar email dari domain klien (mis. `noreply@bisnisanda.com`).

Matikan **email tracking** di provider SMTP agar link auth tidak rusak.

---

## Preview lokal

Buka file `.html` di browser untuk preview layout (variabel `{{ }}` akan tampil mentah — normal).
