# Lovable Preview — supaya auth & Supabase jalan (seperti lokal)

> **Penyebab #1:** File `.env` di Cursor **tidak** dipakai Lovable Preview.  
> Secrets harus di-set di **Lovable → Cloud → Secrets**, lalu **rebuild preview**.

---

## Checklist (urutan wajib)

### 1. Push kode ke GitHub

Lovable sync dari repo. Pastikan branch `main` sudah up to date (auth, invite, migration files).

### 2. Set Secrets di Lovable (bukan `.env` lokal)

Di editor Lovable:

1. Klik **+** di samping panel Preview → tab **Cloud**
2. Buka **Secrets**
3. Tambahkan (copy dari `.env` lokal Anda):

| Secret | Wajib untuk | Contoh |
|--------|-------------|--------|
| `VITE_SUPABASE_URL` | Login, load data | `https://btdoqpowkfbssfdyygpm.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Login, load data | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | **Invite owner** (server fn) | `sb_secret_...` |

**Tanpa `VITE_*`:** preview fallback ke **demo picker lama** (pilih agent tanpa password) — bukan form email login.

**Tanpa `SUPABASE_SECRET_KEY`:** login bisa jalan, tapi **Kirim undangan** gagal di preview.

### 3. Rebuild preview

Setelah menambah/mengubah Secrets:

- Klik **Build** / refresh preview (Vite embed `VITE_*` saat **build**, bukan runtime)
- Tunggu build selesai, buka preview lagi

### 4. Supabase Auth — URL Lovable

Di **Supabase Dashboard → Authentication → URL Configuration**:

**Site URL** (salah satu, sesuaikan domain preview Anda):

```
https://YOUR-PROJECT-ID.lovable.app
```

**Redirect URLs** — tambahkan (ganti dengan URL preview Lovable yang sebenarnya):

```
https://YOUR-PROJECT-ID.lovable.app/accept-invite
https://YOUR-PROJECT-ID.lovable.app/reset-password
https://YOUR-PROJECT-ID.lovable.app/**
```

Cara lihat URL preview: buka preview Lovable → copy domain dari address bar.

Tanpa ini: login/invite **redirect error** setelah klik link email.

### 5. Database — project yang sama

Lovable Supabase connector harus menunjuk ke **project yang sama** dengan lokal (`btdoqpowkfbssfdyygpm`).  
Migration sudah di-run lokal = DB sudah OK untuk preview juga.

---

## Gejala vs penyebab

| Gejala di Lovable | Penyebab |
|-------------------|----------|
| Halaman login = pilih agent (tanpa email/password) | `VITE_SUPABASE_*` belum di Secrets / belum rebuild |
| Form login ada, tapi "loading" terus | Keys salah atau project beda |
| Login gagal / invalid key | Publishable key typo atau project mismatch |
| Invite gagal / error server | `SUPABASE_SECRET_KEY` belum di Lovable Secrets |
| Link email invite error redirect | URL Lovable belum di Supabase Redirect URLs |
| Preview blank / build error | Build gagal — cek Build log di Lovable |

---

## Verifikasi cepat di preview

1. Buka `/` → harus ada **form email + password** (bukan hanya picker agent)
2. Login `hartono@chatcrm.demo` / `Demo1234!`
3. Dashboard load data customer dari Supabase
4. Owner → Settings → Kirim undangan (butuh secret key)

---

## Catatan Lovable Cloud vs external Supabase

- **Connector Supabase** di Lovable Settings kadang auto-inject `VITE_SUPABASE_*`
- Kalau pakai **project Supabase sendiri** (seperti setup Cursor), **manual** isi Secrets seperti di atas
- `.env` di repo **gitignore** — tidak pernah sync ke Lovable

---

## Production / published URL

Saat publish ke domain Lovable atau custom domain, ulangi langkah **Redirect URLs** di Supabase untuk domain production tersebut.
