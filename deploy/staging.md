# Staging - setup pertama

Staging = **Supabase Free + Vercel Free**, project terpisah dari dev local dan dari client.

---

## 1. Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Name: `chatcrm-staging`
3. Region: Singapore (dekat Indonesia)
4. Simpan database password

---

## 2. Env file

```bash
cp deploy/env/staging.example.env .env.staging
```

Isi dari **Settings → API Keys** (publishable + secret).

---

## 3. Migration

```bash
DEPLOY_PROFILE=staging bun db:migrate
DEPLOY_PROFILE=staging bun run deploy:check:staging
```

---

## 4. Vercel project

1. [vercel.com/new](https://vercel.com/new) → import repo Git
2. Root directory: `/` (default)
3. `vercel.json` sudah set `bun install` + `bun run build`
4. **Environment Variables** (Production + Preview):

| Key | Value |
| --- | ----- |
| `VITE_SUPABASE_URL` | dari Supabase staging |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | sb_publishable_... |
| `SUPABASE_SECRET_KEY` | sb_secret_... |
| `VITE_APP_URL` | placeholder dulu: `https://PROJECT.vercel.app` |
| `APP_ENV` | `production` |

5. Deploy pertama
6. Copy URL final → update `VITE_APP_URL` di Vercel **dan** `.env.staging` → **Redeploy**

---

## 5. Supabase Auth URLs

Dashboard staging → Authentication → URL Configuration:

- **Site URL:** `https://PROJECT.vercel.app`
- **Redirect URLs:**
  - `https://PROJECT.vercel.app/accept-invite`
  - `https://PROJECT.vercel.app/reset-password`
  - `http://localhost:8080/accept-invite` (optional, dev local ke staging DB)

Paste template Invite: `supabase/templates/invite.html`

---

## 6. Smoke test

1. Buka staging URL (incognito) → `/setup`
2. Buat owner staging
3. Login → dashboard, chat, customers, settings
4. Settings → WhatsApp (status env)
5. Invite 1 test agent → cek email

---

## 7. Dev local + DB staging (optional)

`.env.local` bisa arah ke staging Supabase untuk debug, **atau** tetap project dev terpisah.

Jangan arahkan `.env.local` ke DB client production.

---

## Upgrade staging

- Supabase Dashboard → Upgrade to Pro
- Vercel → Pro (kalau commercial / limit)

Tidak perlu ubah kode.
