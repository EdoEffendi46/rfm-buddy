# ChatCRM — Supabase Email Templates

Template HTML bertema ChatCRM (`#25D366`, `#111B21`) dengan copy Bahasa Indonesia.

## Cara pasang (Supabase Dashboard)

1. Buka **Authentication → Email Templates**
2. Pilih template → paste **Subject** + **Body (HTML)** dari tabel bawah
3. **Save**

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

---

## Variabel Supabase (sudah dipakai)

- `{{ .ConfirmationURL }}` — link utama (invite / reset)
- `{{ .Email }}` — email penerima
- `{{ .Data.name }}` — nama dari invite metadata
- `{{ .Data.role }}` — role (cs / supervisor / owner)
- `{{ .Token }}` — OTP 6 digit (opsional)

---

## Production (beli putus)

Aktifkan **Custom SMTP** di Authentication → SMTP Settings agar email dari domain klien (mis. `noreply@laundryanda.com`).

Matikan **email tracking** di provider SMTP agar link auth tidak rusak.

---

## Preview lokal

Buka file `.html` di browser untuk preview layout (variabel `{{ }}` akan tampil mentah — normal).
