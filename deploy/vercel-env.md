# Vercel environment variables

Copy ke **Project → Settings → Environment Variables**.

Centang **Production** untuk client live. Centang **Preview** juga untuk staging branch.

## Wajib

| Variable | Scope | Notes |
| -------- | ----- | ----- |
| `VITE_SUPABASE_URL` | Production, Preview | Public at build time |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | sb_publishable_... |
| `SUPABASE_SECRET_KEY` | Production, Preview | Server only - jangan expose |
| `VITE_APP_URL` | Production, Preview | HTTPS, no trailing slash |
| `APP_ENV` | Production | `production` |

## Disarankan (client production)

| Variable | Notes |
| -------- | ----- |
| `SETUP_TOKEN` | Random string - wajib di form /setup jika diset |

## Opsional (WhatsApp Cloud API)

| Variable | Notes |
| -------- | ----- |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Rotate periodically |
| `WHATSAPP_VERIFY_TOKEN` | Same as Meta webhook config |
| `WHATSAPP_APP_SECRET` | Signature verification |

## Tidak perlu di Vercel

| Variable | Where |
| -------- | ----- |
| `DATABASE_URL` | Local CLI migrations only |
| `SUPABASE_POOLER_URL` | Local CLI |
| `SUPABASE_PROJECT_ID` | GitHub Actions optional |

## Setelah ubah `VITE_*`

**Redeploy** - Vite embed values at build time.

## Local parity test

```bash
bun run build:vercel
npx vercel deploy --prebuilt   # optional, needs Vercel CLI
```
