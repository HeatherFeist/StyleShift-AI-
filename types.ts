// ============================================================================
// StyleShift — core types
// A lightweight AI styling app: upload a selfie, describe a look, try it on.
// ============================================================================

/** How the app is currently working. Used to drive the loading / error UI. */
export enum Status {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/** A one-tap preset look. Clicking it drops its prompt into the box. */
export interface StyleTemplate {
  id: string;
  name: string;
  emoji: string;
  /** Short blurb shown under the name. */
  blurb: string;
  /** The prompt sent to the AI when this template is used. */
  prompt: string;
}

/**
 * Something saved in the user's closet.
 *  - 'outfit' items are uploaded clothing photos you can virtually try on.
 *  - 'look'   items are AI-generated results you liked and saved.
 */
export interface ClosetItem {
  id: string;
  name: string;
  type: 'outfit' | 'look';
  /** Data URL of the image (uploaded outfit or generated look). */
  image: string;
  /** For 'look' items, the prompt that created it. */
  prompt?: string;
  createdAt: number;
}

/** A pre-made set of template looks, grouped for the gallery. */
export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'soft-glam',
    name: 'Soft Glam',
    emoji: '✨',
    blurb: 'Everyday polished makeup',
    prompt:
      'Apply a soft glam makeup look: warm neutral eyeshadow, subtle winged eyeliner, defined lashes, a soft peachy blush, gentle contour, and a natural glossy nude-pink lip. Keep skin looking fresh and dewy.',
  },
  {
    id: 'bold-red',
    name: 'Bold Red Lip',
    emoji: '💋',
    blurb: 'Classic, confident, timeless',
    prompt:
      'Give a classic glam look with a bold matte red lip, clean skin, softly defined eyes with mascara, and a light natural blush. Elegant and timeless.',
  },
  {
    id: 'smokey-night',
    name: 'Smokey Night Out',
    emoji: '🌙',
    blurb: 'Sultry evening drama',
    prompt:
      'Create a sultry smokey eye makeup look with blended charcoal and bronze eyeshadow, dramatic lashes, sharp eyeliner, sculpted contour, and a nude lip. Evening glam vibe.',
  },
  {
    id: 'natural',
    name: 'Natural Glow',
    emoji: '🌿',
    blurb: 'Barely-there, fresh skin',
    prompt:
      'Apply a natural "no-makeup" makeup look: even glowing skin, subtle mascara, groomed brows, a hint of cream blush, and a tinted balm lip. Fresh and effortless.',
  },
  {
    id: 'beach-waves',
    name: 'Beach Waves',
    emoji: '🏖️',
    blurb: 'Effortless tousled hair',
    prompt:
      'Restyle the hair into loose, tousled beach waves with natural volume and movement. Keep the hair color the same. Sun-kissed, effortless look.',
  },
  {
    id: 'blonde-balayage',
    name: 'Blonde Balayage',
    emoji: '👱‍♀️',
    blurb: 'Sun-lit dimensional blonde',
    prompt:
      'Change the hair color to a dimensional blonde balayage with soft honey and champagne tones, keeping the roots slightly deeper for a natural sun-lit effect.',
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    emoji: '💼',
    blurb: 'Sharp, put-together outfit',
    prompt:
      'Dress the person in a sharp, tailored business-professional outfit: a well-fitted blazer over a clean blouse. Polished, modern, and confident.',
  },
  {
    id: 'evening-gown',
    name: 'Evening Gown',
    emoji: '👗',
    blurb: 'Elegant formal look',
    prompt:
      'Dress the person in an elegant floor-length evening gown suitable for a formal event. Flattering, sophisticated, and camera-ready.',
  },
];
