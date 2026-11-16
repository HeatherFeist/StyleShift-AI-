# StyleShift AI

An AI-powered personal stylist editor. Upload a selfie to try makeup, hair, outfits, and backgrounds.

View the original AI Studio app: https://ai.studio/apps/drive/1Sn9AevqiZgPtYomvS61F8p1h_LCzT35M

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app: `npm run dev`

Local Vite still talks to Gemini from the browser (AI Studio workflow). Production on Cloudflare does **not** — the key stays in a Pages secret.

## Deploy to Cloudflare Pages

StyleShift is a Vite React SPA plus one Pages Function (`/api/generate`) that holds `GEMINI_API_KEY`. That is the path you want for hosting: static assets on Pages, generation on a Worker, no API key in the client bundle.

### 1. One-time Cloudflare account

1. Create or sign in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Open **Workers & Pages**.
3. You do not need a custom domain for the first deploy. You will get `styleshift.<account>.pages.dev`.

### 2. Install and log in (CLI)

From this repo:

```bash
npm install
npx wrangler login
```

Wrangler opens a browser window so you can authorize the Cloudflare account that should own the project.

### 3. Put the Gemini key in a Pages secret

Never put the key in `wrangler.toml` or the client.

```bash
npx wrangler pages secret put GEMINI_API_KEY --project-name styleshift
```

Paste the key when prompted. Copy `.dev.vars.example` to `.dev.vars` for local Pages preview (`npm run preview:cf`). `.dev.vars` is gitignored.

### 4. Deploy

```bash
npm run deploy
```

That runs `vite build` and `wrangler pages deploy dist --project-name styleshift`. Wrangler uploads `dist/` plus `functions/`. After the first deploy, the CLI prints the `*.pages.dev` URL.

Preview the Worker locally before a production push:

```bash
npm run preview:cf
```

Image generation can take longer than a free-plan Worker wall-clock budget. If `/api/generate` times out, use a paid Workers plan.

### 5. Or connect Git in the dashboard (no CLI)

1. Push this branch to GitHub.
2. In Cloudflare: **Workers & Pages → Create → Pages → Import a Git repository**.
3. Select the StyleShift repo.
4. Build settings:
   - Production branch: `main` (or this feature branch while testing)
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add secret **GEMINI_API_KEY** under **Settings → Environment variables** (Production and Preview).
6. Save and deploy. Pages will also pick up `functions/api/generate.ts` from the repo root.

SPA routing is handled by `public/_redirects`. `/api/*` is served by the Pages Function first.

### 6. Confirm it is hosted correctly

- Open the `*.pages.dev` URL.
- Upload a selfie (or take one after the 18+ camera consent).
- Apply a look and click **Generate**. The Network tab should show `POST /api/generate`, not a Google API key in JS.
- **Download** / **Share** export the current look.
- Shop **Try On** should land on the matching slot (lips, eyes, outfit), not a whole-face preset.
- Bag checkout is labeled as a demo and does not charge or ship.

### Optional: Stripe Projects

Stripe Directory lists Cloudflare as provisionable with `stripe provision cloudflare`. Use that only if you want Cloudflare credentials created through Stripe Projects. This walkthrough uses a normal Cloudflare account and Wrangler instead.
