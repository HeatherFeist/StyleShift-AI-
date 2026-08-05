// ============================================================================
// StyleShift — "generate-look" Edge Function
// A thin, secure proxy in front of Google Gemini. The Gemini API key lives
// here as a Supabase secret (GEMINI_API_KEY) and never reaches the browser.
//
// Request (POST, JSON):
//   {
//     prompt: string,
//     selfie: { mimeType: string, data: string },   // base64, no data: prefix
//     outfit?: { mimeType: string, data: string }    // optional outfit reference
//   }
// Response (JSON): { image: "data:image/png;base64,..." }  or  { error: string }
// ============================================================================

const MODEL = 'gemini-2.5-flash-image';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Same identity guardrail the app uses, kept server-side as the source of truth.
const IDENTITY_RULES = [
  'ROLE: You are an expert beauty and fashion photo editor.',
  'The FIRST image is a selfie of the user.',
  "STRICT REQUIREMENT: Keep the person's facial identity, bone structure, eyes, nose, lips, skin tone, and expression EXACTLY as in the selfie.",
  'Do NOT generate a different face or beautify away their features. The result must clearly be a photo of the SAME person, only re-styled.',
  'Keep the result photorealistic with natural, believable lighting.',
].join(' ');

interface ImagePart {
  mimeType: string;
  data: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json(
      { error: 'Server is missing GEMINI_API_KEY. Set it with `supabase secrets set`.' },
      500,
    );
  }

  let payload: {
    prompt?: string;
    selfie?: ImagePart;
    outfit?: ImagePart | null;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { prompt, selfie, outfit } = payload;
  if (!selfie?.data || !selfie?.mimeType) {
    return json({ error: 'A selfie image is required.' }, 400);
  }

  // Build the parts: selfie, optional outfit reference, then instructions.
  const parts: Array<Record<string, unknown>> = [
    { inlineData: { mimeType: selfie.mimeType, data: selfie.data } },
  ];

  let instructions = IDENTITY_RULES;
  if (outfit?.data && outfit?.mimeType) {
    parts.push({
      inlineData: { mimeType: outfit.mimeType, data: outfit.data },
    });
    instructions +=
      ' The SECOND image is an OUTFIT REFERENCE. Take ONLY the clothing/outfit from it (ignore any person, body shape, or face in that image) and dress the person from the selfie in it, fitting it naturally to their pose and body.';
  }
  instructions += ` USER REQUEST: ${
    (prompt || '').trim() ||
    'Refresh the styling while keeping everything else natural.'
  }`;
  instructions += ' OUTPUT: a single high-quality, photorealistic image.';
  parts.push({ text: instructions });

  // Call the Gemini REST API.
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
  } catch (err) {
    return json({ error: `Could not reach Gemini: ${String(err)}` }, 502);
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    return json(
      { error: `Gemini error (${geminiRes.status}): ${detail.slice(0, 300)}` },
      502,
    );
  }

  const result = await geminiRes.json();
  const resultParts = result?.candidates?.[0]?.content?.parts ?? [];
  const image = resultParts.find(
    (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData,
  );

  if (image?.inlineData?.data) {
    const mime = image.inlineData.mimeType || 'image/png';
    return json({ image: `data:${mime};base64,${image.inlineData.data}` });
  }

  // The model sometimes returns a text refusal instead of an image.
  const text = resultParts.find((p: { text?: string }) => p.text)?.text;
  return json(
    {
      error: text
        ? `The AI couldn't create that look: ${text}`
        : 'No image was returned. Try rephrasing your look.',
    },
    422,
  );
});
