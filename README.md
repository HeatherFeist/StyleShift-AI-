# StyleShift 💄✨

A lightweight **AI style & beauty** app. Upload a photo of yourself, describe a
new look in plain words, and see it on you — while keeping your own face.

## What it does

- **📸 Upload your photo** — a clear, front-facing selfie works best.
- **✨ Prompt a look** — type anything ("long wavy auburn hair, soft glam
  makeup, cream blazer") and the AI restyles you, keeping your face and identity.
- **💅 Template looks** — one-tap presets like Soft Glam, Bold Red Lip, Smokey
  Night Out, Beach Waves, Blonde Balayage, Business Pro, and more.
- **👗 Virtual closet** — upload photos of outfits and **try them on** over your
  selfie. Save the looks you love and restyle them further.

Everything runs in the browser. Your photos and closet stay on your device; the
only thing sent out is the image + prompt to Google Gemini to create the look.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide a Google Gemini API key (either one works):
   - Set `GEMINI_API_KEY` in a `.env.local` file, **or**
   - Run the app and paste your key into **Settings** (it's stored in your
     browser only). Get a free key at https://aistudio.google.com/apikey
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Secure backend with Supabase (recommended for public deploys)

Because this is a browser app, calling Gemini directly means the key would ship
inside the downloadable JavaScript. To deploy publicly and keep your key safe,
route generation through a **Supabase Edge Function** (`supabase/functions/generate-look`)
that holds the key server-side. When `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are set, the app uses this backend automatically — no
client key required.

One-time setup (the CLI ships as a dev dependency):

```bash
# 1. Create a project at https://supabase.com, then log in
npx supabase login                       # paste a token from your Supabase account

# 2. Link this repo to your project (find the ref in the project URL/settings)
npx supabase link --project-ref YOUR-PROJECT-REF

# 3. Store your Gemini key as a server-side secret (never committed)
npx supabase secrets set GEMINI_API_KEY=your-gemini-key

# 4. Deploy the function
npx supabase functions deploy generate-look
```

Then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from **Project
Settings → API**) in `.env.local` or in your host's environment variables, and
deploy the frontend (e.g. Vercel or Netlify). See `.env.local.example`.

## Tech

React 19 · Vite · Tailwind (CDN) · `@google/genai` (Gemini image model) ·
Supabase Edge Functions (optional secure backend).
