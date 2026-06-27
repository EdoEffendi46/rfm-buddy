// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// Deploy targets (see deploy/README.md):
//   - Lovable sandbox → cloudflare-module (forced)
//   - Vercel → nitro preset "vercel" when VERCEL=1
//   - Local CI / preview → NITRO_PRESET=vercel bun run build
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function resolveNitroOptions():
  | { preset: string; vercel?: { entryFormat: "node" } }
  | true
  | undefined {
  const preset = process.env.NITRO_PRESET?.trim();
  if (preset) {
    return preset === "vercel"
      ? { preset: "vercel", vercel: { entryFormat: "node" } }
      : { preset };
  }
  if (process.env.VERCEL === "1") {
    return { preset: "vercel", vercel: { entryFormat: "node" } };
  }
  return undefined;
}

const nitroOptions = resolveNitroOptions();

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(nitroOptions ? { nitro: nitroOptions } : {}),
});
