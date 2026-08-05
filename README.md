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

## Tech

React 19 · Vite · Tailwind (CDN) · `@google/genai` (Gemini image model).
