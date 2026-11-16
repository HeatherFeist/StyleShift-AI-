const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
]);

interface GenerateBody {
  model?: string;
  parts?: unknown[];
  config?: {
    imageConfig?: { imageSize?: string };
  };
}

const toRestParts = (parts: unknown[]): unknown[] =>
  parts.map((part) => {
    const p = part as { inlineData?: { mimeType?: string; data?: string }; text?: string };
    if (p?.inlineData?.data) {
      return {
        inline_data: {
          mime_type: p.inlineData.mimeType || 'image/png',
          data: p.inlineData.data,
        },
      };
    }
    return { text: p?.text || '' };
  });

export const onRequestPost = async (context: {
  request: Request;
  env: { GEMINI_API_KEY?: string };
}) => {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not set on this Pages project.' },
      { status: 500 }
    );
  }

  let body: GenerateBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const model = body.model || 'gemini-2.5-flash-image';
  if (!ALLOWED_MODELS.has(model) || !Array.isArray(body.parts) || body.parts.length === 0) {
    return Response.json({ error: 'Invalid generate request.' }, { status: 400 });
  }

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };
  if (body.config?.imageConfig) {
    generationConfig.imageConfig = body.config.imageConfig;
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: toRestParts(body.parts) }],
        generationConfig,
      }),
    }
  );

  const payload = (await geminiResponse.json().catch(() => ({}))) as {
    error?: { message?: string } | string;
  };
  if (!geminiResponse.ok) {
    const message =
      (typeof payload.error === 'string' ? payload.error : payload.error?.message) ||
      `Gemini request failed (${geminiResponse.status})`;
    return Response.json({ error: message }, { status: geminiResponse.status });
  }

  return Response.json(payload);
};
