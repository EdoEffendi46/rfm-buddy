# Beli putus - strategi hosting & infra

Catatan keputusan deploy untuk ChatCRM MVP 1 (single tenant per client). Baca ulang sebelum onboard client baru.

**Model penjualan:** beli putus (lisensi + setup), bukan SaaS multi-tenant. Infra **bukan** janji gratis selamanya kecuali ada paket maintenance.

---

## Arsitektur (jangan dicampur)

```
App (TanStack Start)          Supabase
─────────────────────         ─────────────────
• UI + SSR                    • PostgreSQL (data CRM)
• Server fn (invite, setup)   • Auth (login, reset, invite)
• Webhook WA                  • Bukan app server
Host: Vercel / Lovable / VPS
```

Supabase = DB + Auth. **Bukan** pengganti host app. Server fn dan webhook jalan di host app.

Tanpa Supabase terkonfigurasi: demo in-memory (refresh hilang).

---

## Keputusan default (disetujui)

### 1. Dev / testing (kamu)

| Layer | Pilihan |
| ----- | ------- |
| DB + Auth | **Supabase Free** - project terpisah `chatcrm-dev` (`.env.local`) |
| App | **localhost** (`bun dev`) |
| WA | Meta sandbox + ngrok (lihat Settings → WhatsApp) |

### 1b. Staging (pre-production)

| Layer | Pilihan |
| ----- | ------- |
| DB + Auth | **Supabase Free** - project `chatcrm-staging` (`.env.staging`) |
| App | **Vercel Free** - lihat [deploy/staging.md](../deploy/staging.md) |
| Scripts | `DEPLOY_PROFILE=staging bun db:migrate` · `bun run deploy:check:staging` |

Jangan campur project dev, staging, dan client.

### 2. Client (beli putus)

| Fase | Infra | Catatan |
| ---- | ----- | ------- |
| **Pilot** | Supabase Free + Vercel Free (atau Lovable) | OK untuk UMKM kecil, 2-5 CS |
| **Produksi** | Upgrade Supabase Pro (+ Vercel Pro jika perlu) | Saat data, tim, atau ToS hosting menuntut |

**Prinsip:** client **boleh** mulai free; upgrade **vertikal** (Free → Pro) tanpa ganti kode.

**Ownership akun (disarankan):** akun Supabase + Vercel **milik client**; kamu collaborator untuk deploy. Saat upgrade, client bayar langsung ke provider **atau** lewat paket maintenance kamu.

**Wajib:** **1 client = 1 Supabase project** (jangan multi-tenant satu project).

---

## Stack recommended per paket

### Starter (paling murah)

- Supabase Free + Vercel Free / Lovable publish
- WA: **manual** (CS chat di app WhatsApp Business di HP; ChatCRM untuk CRM)
- Infra: ~Rp 0/bulan
- Jujur di kontrak: inbox belum sync WA sampai Cloud API aktif

### Standard (sweet spot)

- Supabase Pro (1 project dedicated) + Vercel Pro atau VPS kecil app-only
- WA: Meta Cloud API (webhook + kirim dari inbox)
- Infra: ~Rp 500rb-1 juta/bulan
- Maintenance tahunan wajib disarankan

### Enterprise (jarang)

- VPS / server client + Postgres self-managed
- Harga 2-3× Standard; hanya kalau client minta data di server mereka

**VPS full stack (app + Postgres + auth sendiri):** tidak default - kode sudah terikat Supabase Auth; effort rewrite besar.

**Baileys / whatsapp-web.js:** tidak untuk produk beli putus (ToS + ban + ops 24/7).

---

## Host app - urutan pilihan

1. **Lovable publish + Supabase** - paling sedikit config (sudah di ekosistem repo)
2. **Vercel + Supabase** - kalau lepas Lovable; cocok TanStack Start + server fn
3. **Netlify + Supabase** - OK, second choice
4. **VPS $5** - hanya host app; DB tetap Supabase

Vercel > Netlify untuk stack ini. Cloudflare Pages juga dekat dengan Nitro default di `vite.config.ts`.

---

## Env per deploy client

**Di host (Vercel / Lovable Secrets):**

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=          # server only - invite, setup, WA
VITE_APP_URL=https://...      # domain client
APP_ENV=production
SETUP_TOKEN=                  # optional hardening /setup
WHATSAPP_*=                   # optional, kalau paket inbox WA
```

**Di Supabase Dashboard (project client):**

- Authentication → URL Configuration: Site URL + redirect `/accept-invite`, `/reset-password`
- Email Templates: paste dari `supabase/templates/` (Invite user, Recovery, dll.)
- Production: Custom SMTP (domain client) - lihat `supabase/templates/README.md`

**Migration (sekali per project, dari laptop):**

```bash
bun db:migrate
```

Client buka URL → `/setup` → owner → invite tim dari Settings.

---

## Kapan client harus upgrade

**Supabase Free → Pro:**

- Database mendekati limit (~500 MB)
- Auth / API traffic ramai
- Butuh backup PITR, support, atau SLA

**Vercel Free → Pro:**

- Traffic / build limit
- Commercial production (ToS Hobby)
- Cold start mengganggu jam operasional CS

**Trigger komunikasi ke client:** "Tim > X orang atau inbox WA aktif full → rencana Pro ~Rp X/bulan."

---

## Copy penjualan (jujur)

> Termasuk setup di tier gratis Supabase/Vercel. Cocok untuk tim kecil. Jika data atau tim membesar, upgrade infra (~Rp 500rb/bulan) - client bayar langsung ke provider atau lewat maintenance kami.

Beli putus = **software + setup**. Hosting ongoing = **maintenance optional/tahunan**, bukan subsidize selamanya dari akun pribadi dev.

---

## Risiko yang dihindari

| Jangan | Kenapa |
| ------ | ------ |
| Banyak client satu Supabase project | Security, blast radius |
| Produksi jangka panjang di free tier tanpa kontrak | Limit, pause, ToS |
| Semua client di akun Vercel/Supabase pribadi kamu | Kamu yang kena tagihan & tanggung jawab |
| Klaim omnichannel WA tanpa Cloud API configured | Melanggar demo-honesty |

---

## WhatsApp (ringkas)

| Mode | Testing tanpa API |
| ---- | ----------------- |
| Manual | WA Business App di HP + CRM di ChatCRM |
| Supabase, tanpa env WA | Kirim chat tersimpan `channel: internal` (tidak ke HP customer) |
| Meta sandbox | developers.facebook.com + ngrok + env WA + webhook |

Detail checklist: Settings → WhatsApp di app + `.env.example`.

---

## Checklist onboard client baru

Lihat **[deploy/client-onboard.md](../deploy/client-onboard.md)** (step-by-step ulang per client).

- [ ] Buat Supabase project baru (1 client)
- [ ] Buat deploy app (Vercel/Lovable) + env
- [ ] `bun db:migrate` ke project client
- [ ] Auth redirect + email template Invite
- [ ] Client `/setup` + owner login
- [ ] Tentukan WA: manual atau Cloud API
- [ ] Kontrak: ownership akun, batas pilot free, path upgrade

---

## Related docs

- [dual-backend-setup.md](./dual-backend-setup.md) - local vs Lovable Supabase
- [../deploy/README.md](../deploy/README.md) - **staging + client deploy boilerplate**
- [supabase-backend-migration.md](./supabase-backend-migration.md) - schema & migration
- [lovable-preview-setup.md](./lovable-preview-setup.md) - preview Lovable
- `README.md` - Production deploy steps
- `.env.example` - env vars template
