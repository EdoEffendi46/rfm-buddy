# Client onboard - checklist ulang per beli putus

Satu client = **1 Supabase project** + **1 Vercel project** (atau subdomain + env group).

Estimasi waktu: **2-4 jam** setelah sudah rutin.

---

## Before sales handoff

- [ ] Domain client (optional) atau subdomain kamu: `crm.namaclient.com`
- [ ] Client punya akun Supabase (disarankan) atau kamu buat under agency
- [ ] Paket: Starter (manual WA) vs Standard (Cloud API)

---

## 1. Supabase

1. New project: `chatcrm-{namaclient}` (Free pilot OK)
2. Simpan password + API keys

```bash
cp deploy/env/client.example.env .env.client
# edit: VITE_* , SUPABASE_*, VITE_APP_URL, SETUP_TOKEN

DEPLOY_PROFILE=client bun db:migrate
DEPLOY_PROFILE=client bun run deploy:check:client
```

3. Auth URLs → domain client final
4. Email template Invite (Bahasa Indonesia)
5. (Nanti) Custom SMTP domain client

---

## 2. Vercel

**Opsi A - project baru (disarankan):**

1. Import same repo → project name `chatcrm-{client}`
2. Env vars dari `.env.client` (lihat `deploy:check` output)
3. Custom domain jika ada
4. `VITE_APP_URL` = domain final → redeploy

**Opsi B - env group di project staging:**

Hanya untuk internal demo, **bukan** client production (campur data).

---

## 3. First visit client

1. Kirim URL + (optional) `SETUP_TOKEN` ke owner
2. Owner: `/setup` → nama bisnis + akun
3. Owner: Settings → undang CS
4. Training: manual WA vs inbox (sesuai paket)

---

## 4. Handover doc (template)

```
URL: https://...
Owner login: (set by client at /setup)
Supabase project: (ref id) - owner dashboard access
Maintenance: (contact / renewal date)
WA mode: manual | Cloud API
Upgrade path: Supabase/Vercel Free → Pro when ...
```

---

## 5. Post-deploy

- [ ] `APP_ENV=production` on host
- [ ] Demo shortcuts login disabled in production UI (already dev-only label)
- [ ] Backup: Supabase dashboard / upgrade Pro for PITR
- [ ] Catat env di password manager client (1Password, dll.)

---

## Repeat

Copy `.env.client` → edit → migrate → Vercel project → Auth URLs → handover.

Lihat juga: [.lovable/beli-putus-hosting.md](../.lovable/beli-putus-hosting.md)
