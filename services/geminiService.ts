import { GoogleGenAI } from '@google/genai';

// ============================================================================
// StyleShift — AI styling service
// One job: take a selfie + a description (and optionally an outfit photo) and
// return a new image of the SAME person wearing the new look.
// ============================================================================

const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
];

const LOCALSTORAGE_KEY = 'styleshift_api_key';

/**
 * Resolve the Gemini API key. We prefer a key the user pasted into Settings
 * (kept in localStorage so no rebuild is needed), and fall back to the
 * build-time GEMINI_API_KEY that Vite injects.
 */
export const getApiKey = (): string | undefined => {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    /* localStorage may be unavailable — fall through */
  }
  return process.env.API_KEY || undefined;
};

export const setApiKey = (key: string): void => {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, key.trim());
  } catch {
    /* ignore */
  }
};

/**
 * When the app is built with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, all
 * generation is routed through the Supabase Edge Function, which holds the
 * Gemini key server-side. No client key is needed in that mode.
 */
const getSupabaseConfig = (): { url: string; anon: string } | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && anon) return { url: String(url).replace(/\/+$/, ''), anon: String(anon) };
  return null;
};

export const isBackendMode = (): boolean => getSupabaseConfig() !== null;

/** The app is ready to generate if a backend is wired up OR a client key exists. */
export const hasApiKey = (): boolean => isBackendMode() || Boolean(getApiKey());

/** Convert a File to the { mimeType, data } shape the API expects. */
const fileToPart = async (
  file: File,
): Promise<{ mimeType: string; data: string }> => {
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ mimeType: file.type, data: result.split(',')[1] });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  // Unsupported formats (e.g. AVIF) — repaint onto a canvas as PNG.
  return convertToPng(file);
};

/** Convert a base64 data URL string to the { mimeType, data } shape. */
const dataUrlToPart = (dataUrl: string): { mimeType: string; data: string } => {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Unsupported image data.');
  return { mimeType: match[1] || 'image/png', data: match[2] };
};

const convertToPng = async (
  file: File,
): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Could not process image.'));
      }
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL('image/png').split(',')[1];
      URL.revokeObjectURL(url);
      resolve({ mimeType: 'image/png', data });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image.'));
    };
    img.src = url;
  });
};

/** Pull the generated image out of a Gemini response as a data URL. */
const extractImage = (response: any): string => {
  const parts = response?.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p: any) => p.inlineData);
  if (imagePart?.inlineData) {
    const mime = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mime};base64,${imagePart.inlineData.data}`;
  }
  // Sometimes the model refuses and returns text instead of an image.
  const textPart = parts?.find((p: any) => p.text)?.text;
  throw new Error(
    textPart
      ? `The AI couldn't create that look: ${textPart}`
      : 'No image was returned. Try rephrasing your look.',
  );
};

// The identity guardrail. Baked into every request so the result always looks
// like the SAME person — just re-styled.
const IDENTITY_RULES = [
  'ROLE: You are an expert beauty and fashion photo editor.',
  'The FIRST image is a selfie of the user.',
  "STRICT REQUIREMENT: Keep the person's facial identity, bone structure, eyes, nose, lips, skin tone, and expression EXACTLY as in the selfie.",
  'Do NOT generate a different face or beautify away their features. The result must clearly be a photo of the SAME person, only re-styled.',
  'Keep the result photorealistic with natural, believable lighting.',
].join(' ');

/** Assemble the instruction text shared by both generation modes. */
const buildInstructions = (prompt: string, hasOutfit: boolean): string => {
  let instructions = IDENTITY_RULES;
  if (hasOutfit) {
    instructions +=
      ' The SECOND image is an OUTFIT REFERENCE. Take ONLY the clothing/outfit from it (ignore any person, body shape, or face in that image) and dress the person from the selfie in it, fitting it naturally to their pose and body.';
  }
  instructions += ` USER REQUEST: ${
    prompt.trim() || 'Refresh the styling while keeping everything else natural.'
  }`;
  instructions += ' OUTPUT: a single high-quality, photorealistic image.';
  return instructions;
};

/**
 * Generate a re-styled image of the user.
 *
 * @param selfie     the user's uploaded photo (base image)
 * @param prompt     free-text description of the desired look
 * @param outfitRef  optional outfit/style reference (a File upload or a data URL
 *                   from the closet). When present, the AI dresses the user in it.
 *
 * Routes through the Supabase Edge Function when the app is configured with one
 * (key stays server-side); otherwise calls Gemini directly with a client key.
 */
export const generateStyledImage = async (
  selfie: File,
  prompt: string,
  outfitRef?: File | string | null,
): Promise<string> => {
  const selfiePart = await fileToPart(selfie);
  const outfitPart = outfitRef
    ? typeof outfitRef === 'string'
      ? dataUrlToPart(outfitRef)
      : await fileToPart(outfitRef)
    : null;

  const backend = getSupabaseConfig();
  return backend
    ? generateViaBackend(backend, prompt, selfiePart, outfitPart)
    : generateDirect(prompt, selfiePart, outfitPart);
};

/** Production path: the Supabase Edge Function holds the Gemini key. */
const generateViaBackend = async (
  backend: { url: string; anon: string },
  prompt: string,
  selfie: { mimeType: string; data: string },
  outfit: { mimeType: string; data: string } | null,
): Promise<string> => {
  let res: Response;
  try {
    res = await fetch(`${backend.url}/functions/v1/generate-look`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backend.anon}`,
        apikey: backend.anon,
      },
      body: JSON.stringify({ prompt, selfie, outfit: outfit || undefined }),
    });
  } catch (err) {
    throw new Error(`Couldn't reach the styling service: ${String(err)}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.image) {
    throw new Error(data.error || `Styling service error (${res.status}).`);
  }
  return data.image as string;
};

/** Local / no-backend path: call Gemini straight from the browser. */
const generateDirect = async (
  prompt: string,
  selfie: { mimeType: string; data: string },
  outfit: { mimeType: string; data: string } | null,
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key set. Open Settings and paste your Google Gemini API key to start creating looks.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [{ inlineData: selfie }];
  if (outfit) parts.push({ inlineData: outfit });
  parts.push({ text: buildInstructions(prompt, Boolean(outfit)) });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  return extractImage(response);
};
