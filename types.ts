
export interface EditOptions {
  hairColor: string;
  hairStyle: string;
  
  // Individual Makeup fields
  lipColor: string;
  lipIntensity: number;
  blushColor: string;
  blushIntensity: number;
  eyeshadowColor: string;
  eyeshadowStyle: string; // New field
  eyeshadowIntensity: number;
  eyelinerStyle: string;
  eyelashesStyle: string;
  
  // Contour fields
  contourColor: string;
  contourMode: string;
  contourIntensity: number; // Used for blending/opacity
  contourReference?: File | null; // Specific file for placement guide
  
  // Magic Eraser
  maskImage?: File | null; // The generated mask from canvas

  // Legacy/Fallback field
  makeupLook: string;
  makeupIntensity: number; // 0 to 100
  
  outfit: string;
  background: string;
  customPrompt: string;
  resolution: string;
  styleStrength: string;
  hairReference?: File | null;
  makeupReference?: File | null;
  outfitReference?: File | null;
}

export interface SavedStyle {
  id: string;
  name: string;
  options: EditOptions;
  createdAt: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface ClosetItem {
  id: string;
  name: string;
  category: 'outfit' | 'hair' | 'makeup' | 'look';
  description: string;
  addedAt: number;
  image?: string;
  customData?: Partial<EditOptions>;
}

export interface Product {
  id: string;
  name: string;
  category: 'outfit' | 'makeup' | 'hair';
  price: number;
  imageUrl?: string; // URL to the product image
  styleValue: string; // The value to apply to the styling option (e.g., description of the item)
  description: string;
  supplierSku?: string; // The unique product number for ordering
  purchaseUrl?: string; // External link to buy the product (optional now)
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum OrderStatus {
  IDLE = 'IDLE',
  PROCESSING_PAYMENT = 'PROCESSING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  SENDING_TO_SUPPLIER = 'SENDING_TO_SUPPLIER',
  SUPPLIER_CONFIRMED = 'SUPPLIER_CONFIRMED',
  SHIPPED = 'SHIPPED',
}

export const RESOLUTION_OPTIONS = [
  'Standard', 'High (Pro)'
];

export const STYLE_STRENGTH_OPTIONS = [
  'Subtle', 'Balanced', 'Intense'
];

export const HAIR_COLORS = [
  'No Change', 
  'Blonde', 'Platinum Blonde', 'Honey Blonde', 
  'Brunette', 'Dark Brown', 'Black', 'Jet Black', 
  'Red', 'Auburn', 'Copper', 
  'Pink', 'Purple', 'Blue', 'Silver/Grey',
  'Ombre: Black to Blonde',
  'Ombre: Dark Brown to Caramel',
  'Ombre: Brown to Honey',
  'Ombre: Black to Silver',
  'Ombre: Dark to Red',
  'Ombre: Pink to Peach',
  'Ombre: Purple to Pink',
  'Ombre: Blue to Teal',
  'Ombre: Fire (Red to Orange)',
  'Ombre: Mermaid (Blue/Green/Purple)',
  'Ombre: Pastel Rainbow'
];

export const HAIR_STYLES = [
  'No Change', 'Straight', 'Wavy', 'Curly', 'Afro', 'Bob Cut', 'Pixie Cut', 
  'Long Layers', 'Braids', 'Ponytail', 'Messy Bun', 'Bald',
  'Wolf Cut', 'Curtain Bangs', 'Beach Waves', 'Hollywood Waves', 'Buzz Cut'
];

// Specific Makeup Option Lists
export const LIP_COLORS = [
  'No Change', 'Red', 'Pink', 'Nude', 'Berry', 'Coral', 'Purple', 'Brown', 'Glossy Clear'
];

export const BLUSH_COLORS = [
  'No Change', 'Pink', 'Peach', 'Rose', 'Bronze', 'Coral', 'Plum'
];

export const EYESHADOW_COLORS = [
  'No Change', 'Neutral/Browns', 'Smokey Black', 'Gold Shimmer', 'Pink/Rose', 'Blue', 'Green', 'Purple', 'Glitter'
];

export const EYESHADOW_STYLES = [
  'No Change', 'Smokey Eye', 'Cut Crease', 'Smudged/Grunge', 'Halo Eye', 'Winged Out', 'Glitter Topper', 'Matte Blend', 'Graphic'
];

export const EYELINER_STYLES = [
  'No Change', 'Subtle Line', 'Classic Wing', 'Thick Wing', 'Smudged/Grunge', 'Graphic Liner', 'Cat Eye'
];

export const EYELASH_STYLES = [
  'No Change', 'Natural', 'Volume', 'Lengthening', 'Wispy', 'Dramatic/Falsies'
];

export const CONTOUR_COLORS = [
  'No Change', 'Cool Taupe', 'Warm Bronze', 'Deep Espresso', 'Neutral Beige', 'Terracotta', 'Soft Brown'
];

export const CONTOUR_MODES = [
  'No Change', 'Soft Sculpt (Natural)', 'Sharp Definition (Glam)', 'Sun-Kissed (Bronzer)', 'Chiseled Jawline'
];

export const MAKEUP_LOOKS = [
  'No Change', 'Natural / No-Makeup Look', 'Soft Glam', 'Full Glam', 'Smokey Eye', 
  'Vintage / Red Lip', 'Goth', 'Cyberpunk', 'Euphoria Style', 'Bridal'
];

export const OUTFIT_STYLES = [
  'No Change', 'Casual T-Shirt & Jeans', 'Business Suit', 'Evening Gown', 'Summer Dress',
  'Leather Jacket & Black Jeans', 'Cyberpunk Techwear', 'Vintage 90s', 'Streetwear', 
  'Bohemian', 'Superhero Costume',
  'Old Money', 'Y2K Pop', 'Athleisure', 'Cottagecore', 'Dark Academia'
];

export const BACKGROUNDS = [
  'No Change', 'White Studio Background', 'City Street at Night', 'Tropical Beach', 
  'Cozy Coffee Shop', 'Luxury Penthouse', 'Neon Cyberpunk City', 'Forest Nature', 
  'Space Station', 'Abstract Gradient'
];

export const MOCK_PRODUCTS: Product[] = [
  // --- USER INVENTORY START ---
  { 
    id: 'heatherfeist-20', 
    name: 'Highlighter Makeup Powder', 
    category: 'makeup', 
    price: 14.99, 
    styleValue: 'Highlighter', 
    description: '8-Color Highlighter Palette - Waterproof Long-Lasting Matte & Shimmer Finish.',
    supplierSku: 'https://amzn.to/443MzpL', 
  },
  // --- USER INVENTORY END ---

  { id: 'p1', name: 'Midnight Velvet Gown', category: 'outfit', price: 299, styleValue: 'Evening Gown', description: 'Elegant floor-length velvet gown.', supplierSku: 'DRESS-001' },
  { id: 'p2', name: 'Urban Tech Jacket', category: 'outfit', price: 150, styleValue: 'Cyberpunk Techwear', description: 'Waterproof shell with neon accents.', supplierSku: 'JKT-TECH-99' },
  { id: 'p3', name: 'Vintage Denim Set', category: 'outfit', price: 89, styleValue: 'Vintage 90s', description: 'Classic high-waisted jeans and jacket.', supplierSku: 'DNM-SET-90' },
  { id: 'p4', name: 'Ruby Woo Lipstick', category: 'makeup', price: 25, styleValue: 'Red', description: 'Iconic matte vivid red lipstick.', supplierSku: 'LIP-RED-01' },
  { id: 'p5', name: 'Smokey Eye Palette', category: 'makeup', price: 45, styleValue: 'Smokey Black', description: 'Deep charcoals and shimmers.', supplierSku: 'EYE-SMK-05' },
  { id: 'p6', name: 'Boho Floral Dress', category: 'outfit', price: 75, styleValue: 'Summer Dress', description: 'Lightweight floral print with ruffles.', supplierSku: 'DRS-FLR-22' },
  { id: 'p7', name: 'Executive Blazer', category: 'outfit', price: 199, styleValue: 'Business Suit', description: 'Tailored fit navy blazer.', supplierSku: 'BLZ-NAVY-01' },
  { id: 'p8', name: 'Goth Choker & Liner', category: 'makeup', price: 35, styleValue: 'Goth', description: 'Heavy eyeliner kit with velvet choker.', supplierSku: 'ACC-GOTH-66' },
];

declare global {
  interface Window {
    paypal: any;
    // aistudio is intentionally omitted to avoid conflict with ambient declaration
  }
}
