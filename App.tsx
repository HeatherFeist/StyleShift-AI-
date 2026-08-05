import React, { useEffect, useRef, useState } from 'react';
import {
  Status,
  ClosetItem,
  StyleTemplate,
  STYLE_TEMPLATES,
} from './types';
import {
  generateStyledImage,
  hasApiKey,
  setApiKey,
  isBackendMode,
} from './services/geminiService';
import {
  Button,
  Spinner,
  Alert,
  Modal,
  TemplateCard,
  ClosetCard,
} from './components/UIComponents';

// ============================================================================
// StyleShift — a lightweight AI styling app.
// Upload a selfie → describe a look (or tap a template) → see it on you.
// Save outfits and looks to your closet and try them on any time.
// ============================================================================

const CLOSET_KEY = 'styleshift_closet';

// ---- tiny helpers ----------------------------------------------------------

const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToFile = async (
  dataUrl: string,
  filename: string,
): Promise<File> => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

/** Shrink an image so the closet stays inside the browser's storage budget. */
const downscale = (dataUrl: string, max = 768): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

// ---- app -------------------------------------------------------------------

const App: React.FC = () => {
  const [tab, setTab] = useState<'create' | 'closet'>('create');

  // The base photo of the user.
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  // The most recent generated look.
  const [result, setResult] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [closet, setCloset] = useState<ClosetItem[]>([]);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyReady, setKeyReady] = useState(hasApiKey());

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const outfitInputRef = useRef<HTMLInputElement>(null);

  const isGenerating = status === Status.GENERATING;

  // Load the closet once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLOSET_KEY);
      if (raw) setCloset(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // Persist the closet whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(CLOSET_KEY, JSON.stringify(closet));
    } catch {
      setToast('Closet storage is full — older items may not survive a reload.');
    }
  }, [closet]);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Clean up the selfie object URL.
  useEffect(
    () => () => {
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    },
    [selfieUrl],
  );

  // ---- actions -------------------------------------------------------------

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    setSelfie(file);
    setSelfieUrl(URL.createObjectURL(file));
    setResult(null);
    setShowOriginal(false);
    setError(null);
    e.target.value = '';
  };

  const runGeneration = async (
    promptText: string,
    outfitRef?: File | string | null,
  ) => {
    if (!selfie) {
      setTab('create');
      setError('Upload a photo of yourself first.');
      return;
    }
    if (!keyReady) {
      setShowSettings(true);
      return;
    }
    setStatus(Status.GENERATING);
    setError(null);
    try {
      const image = await generateStyledImage(selfie, promptText, outfitRef);
      setResult(image);
      setShowOriginal(false);
      setStatus(Status.SUCCESS);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setStatus(Status.ERROR);
    }
  };

  const handleGenerate = () => runGeneration(prompt);

  const handleTemplate = (t: StyleTemplate) => {
    setPrompt(t.prompt);
    setTab('create');
    runGeneration(t.prompt);
  };

  const handleUploadOutfit = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const stored = await downscale(dataUrl);
    setCloset((prev) => [
      {
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, '') || 'Outfit',
        type: 'outfit',
        image: stored,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setToast('Outfit added to your closet.');
    e.target.value = '';
  };

  const handleTryOn = (item: ClosetItem) => {
    setTab('create');
    setPrompt('Try on my closet outfit');
    runGeneration(
      'Dress me in this outfit, fitting it naturally to my body and pose.',
      item.image,
    );
  };

  const handleSaveLook = async () => {
    if (!result) return;
    const stored = await downscale(result);
    setCloset((prev) => [
      {
        id: uid(),
        name: prompt.trim().slice(0, 32) || 'My Look',
        type: 'look',
        image: stored,
        prompt,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setToast('Look saved to your closet.');
  };

  const useImageAsBase = async (dataUrl: string, note: string) => {
    const file = await dataUrlToFile(dataUrl, 'look.png');
    if (selfieUrl) URL.revokeObjectURL(selfieUrl);
    setSelfie(file);
    setSelfieUrl(URL.createObjectURL(file));
    setResult(null);
    setShowOriginal(false);
    setTab('create');
    setToast(note);
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = 'styleshift-look.png';
    a.click();
  };

  const deleteClosetItem = (id: string) =>
    setCloset((prev) => prev.filter((i) => i.id !== id));

  const saveKey = () => {
    if (!apiKeyInput.trim()) return;
    setApiKey(apiKeyInput);
    setKeyReady(hasApiKey());
    setApiKeyInput('');
    setShowSettings(false);
    setToast('API key saved.');
  };

  const viewerImage = result && !showOriginal ? result : selfieUrl;
  const outfits = closet.filter((i) => i.type === 'outfit');
  const looks = closet.filter((i) => i.type === 'look');

  // ---- render --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-fuchsia-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-rose-100/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💄</span>
            <span className="text-lg font-extrabold tracking-tight">
              Style
              <span className="bg-gradient-to-r from-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
                Shift
              </span>
            </span>
          </div>

          <nav className="flex items-center gap-1 rounded-full bg-rose-50 p-1">
            {(['create', 'closet'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  tab === t
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t === 'closet'
                  ? `Closet${closet.length ? ` · ${closet.length}` : ''}`
                  : t}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!keyReady && (
          <div className="mb-5">
            <Alert type="info">
              Add your free Google Gemini API key to start creating looks.{' '}
              <button
                onClick={() => setShowSettings(true)}
                className="font-semibold underline"
              >
                Add key
              </button>
            </Alert>
          </div>
        )}

        {tab === 'create' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Viewer */}
            <section>
              <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
                {viewerImage ? (
                  <img
                    src={viewerImage}
                    alt="Your look"
                    className="max-h-[560px] w-full object-contain"
                  />
                ) : (
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 px-6 py-16 text-center"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">
                      📸
                    </span>
                    <span className="text-lg font-semibold">
                      Upload a photo of yourself
                    </span>
                    <span className="max-w-xs text-sm text-gray-500">
                      A clear, front-facing selfie works best. We keep your face —
                      only the styling changes.
                    </span>
                    <span className="mt-1 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white">
                      Choose photo
                    </span>
                  </button>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
                    <Spinner className="h-8 w-8 text-fuchsia-600" />
                    <p className="text-sm font-medium text-gray-700">
                      Creating your look…
                    </p>
                  </div>
                )}

                {result && !isGenerating && (
                  <button
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onMouseLeave={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    {showOriginal ? 'Original photo' : 'Hold to compare'}
                  </button>
                )}
              </div>

              {selfieUrl && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="text-sm font-medium text-rose-600 hover:underline"
                  >
                    Change photo
                  </button>
                </div>
              )}
            </section>

            {/* Controls */}
            <section className="flex flex-col gap-5">
              {error && (
                <Alert type="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
                <label className="text-sm font-semibold text-gray-800">
                  Describe your new look
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Give me long wavy auburn hair, soft glam makeup, and a cream blazer."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
                />
                <Button
                  fullWidth
                  className="mt-3"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selfie}
                >
                  {isGenerating ? (
                    <>
                      <Spinner className="h-4 w-4" /> Working…
                    </>
                  ) : (
                    <>✨ Create my look</>
                  )}
                </Button>

                {result && !isGenerating && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={handleSaveLook}>
                      💾 Save to closet
                    </Button>
                    <Button variant="secondary" onClick={handleDownload}>
                      ⬇️ Download
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        useImageAsBase(
                          result,
                          'Now styling on top of this look.',
                        )
                      }
                    >
                      🔁 Keep editing
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setResult(null);
                        setShowOriginal(false);
                      }}
                    >
                      ↩️ Back to photo
                    </Button>
                  </div>
                )}
              </div>

              {/* Templates */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-bold text-gray-900">Template looks</h3>
                  <span className="text-xs text-gray-400">
                    Tap to try instantly
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {STYLE_TEMPLATES.map((t) => (
                    <TemplateCard
                      key={t.id}
                      emoji={t.emoji}
                      name={t.name}
                      blurb={t.blurb}
                      disabled={isGenerating || !selfie}
                      onClick={() => handleTemplate(t)}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ---- Closet tab ---- */
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">My Closet</h2>
                <p className="text-sm text-gray-500">
                  Upload outfits to try on, and keep the looks you love.
                </p>
              </div>
              <Button onClick={() => outfitInputRef.current?.click()}>
                ➕ Upload outfit
              </Button>
            </div>

            {closet.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-rose-200 bg-white/60 px-6 py-16 text-center">
                <p className="text-4xl">👗</p>
                <p className="mt-3 font-semibold">Your closet is empty</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                  Upload a photo of an outfit — a dress, a jacket, anything — and
                  try it on virtually over your selfie.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => outfitInputRef.current?.click()}
                >
                  Upload your first outfit
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {outfits.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-bold text-gray-900">Outfits</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {outfits.map((item) => (
                        <ClosetCard
                          key={item.id}
                          image={item.image}
                          name={item.name}
                          type="outfit"
                          primaryLabel="👗 Try it on"
                          onPrimary={() => handleTryOn(item)}
                          onDelete={() => deleteClosetItem(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {looks.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-bold text-gray-900">Saved looks</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {looks.map((item) => (
                        <ClosetCard
                          key={item.id}
                          image={item.image}
                          name={item.name}
                          type="look"
                          primaryLabel="🔁 Restyle"
                          onPrimary={() =>
                            useImageAsBase(
                              item.image,
                              'Loaded your saved look — style it further.',
                            )
                          }
                          onDelete={() => deleteClosetItem(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden file inputs */}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelfieChange}
      />
      <input
        ref={outfitInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadOutfit}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Settings */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
      >
        {isBackendMode() ? (
          <p className="text-sm text-gray-600">
            This app is connected to a secure backend that keeps the Gemini key
            on the server — you don't need to enter anything here to create looks.
          </p>
        ) : (
        <>
        <p className="text-sm text-gray-600">
          StyleShift uses Google Gemini to create your looks. Paste your API key
          below — it stays in this browser only.
        </p>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={
            keyReady
              ? 'A key is already saved — paste to replace'
              : 'Paste your Gemini API key'
          }
          className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
        />
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-medium text-rose-600 hover:underline"
        >
          Get a free Gemini API key →
        </a>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button onClick={saveKey} disabled={!apiKeyInput.trim()}>
            Save
          </Button>
        </div>
        </>
        )}
      </Modal>
    </div>
  );
};

export default App;
