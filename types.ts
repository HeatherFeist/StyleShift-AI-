
export interface EditOptions {
  hairColor: string;
  hairStyle: string;
  makeupLook: string;
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
  category: 'outfit' | 'hair' | 'makeup';
  description: string;
  addedAt: number;
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
  'Long Layers', 'Braids', 'Ponytail', 'Messy Bun', 'Bald'
];

export const MAKEUP_LOOKS = [
  'No Change', 'Natural / No-Makeup Look', 'Soft Glam', 'Full Glam', 'Smokey Eye', 
  'Vintage / Red Lip', 'Goth', 'Cyberpunk', 'Euphoria Style', 'Bridal'
];

export const OUTFIT_STYLES = [
  'No Change', 'Casual T-Shirt & Jeans', 'Business Suit', 'Evening Gown', 'Summer Dress',
  'Leather Jacket & Black Jeans', 'Cyberpunk Techwear', 'Vintage 90s', 'Streetwear', 
  'Bohemian', 'Superhero Costume'
];

export const BACKGROUNDS = [
  'No Change', 'White Studio Background', 'City Street at Night', 'Tropical Beach', 
  'Cozy Coffee Shop', 'Luxury Penthouse', 'Neon Cyberpunk City', 'Forest Nature', 
  'Space Station', 'Abstract Gradient'
];

export const MOCK_PRODUCTS: Product[] = [
  // --- USER INVENTORY START ---
  // You can copy and paste the block below to add more products.
  { 
    id: 'my-shop-001', 
    name: 'Highlighter Makeup Powder', 
    category: 'makeup', 
    price: 14.99, 
    // This 'styleValue' is what the AI will try to replicate in the image
    styleValue: '8-Color Highlighter Palette - Waterproof Long-Lasting Matte & Shimmer Finish, Multi-Purpose Blush & Contour Eyeshadow, Natural Brightening Shades from Light Pink to Golden Glitter, Portable Makeup Palette for Face Brightening, Blush Palette, Shimmering Effect, Metallic Finish', 
    description: '8-Color Highlighter Palette - Waterproof Long-Lasting Matte & Shimmer Finish.',
    // imageUrl: 'C:\Users\heath\Downloads\Makeup Highlighter image.avif' // Add your image URL here
    supplierSku: 'ITEM-8821-GLOW', // Your Product Number / SKU
  },
  // --- USER INVENTORY END ---

  { id: 'p1', name: 'Midnight Velvet Gown', category: 'outfit', price: 299, styleValue: 'Evening Gown', description: 'Elegant floor-length velvet gown.', supplierSku: 'DRESS-001' },
  { id: 'p2', name: 'Urban Tech Jacket', category: 'outfit', price: 150, styleValue: 'Cyberpunk Techwear', description: 'Waterproof shell with neon accents.', supplierSku: 'JKT-TECH-99' },
  { id: 'p3', name: 'Vintage Denim Set', category: 'outfit', price: 89, styleValue: 'Vintage 90s', description: 'Classic high-waisted jeans and jacket.', supplierSku: 'DNM-SET-90' },
  { id: 'p4', name: 'Ruby Woo Lipstick', category: 'makeup', price: 25, styleValue: 'Vintage / Red Lip', description: 'Iconic matte vivid red.', supplierSku: 'LIP-RED-01' },
  { id: 'p5', name: 'Smokey Eye Palette', category: 'makeup', price: 45, styleValue: 'Smokey Eye', description: 'Deep charcoals and shimmers.', supplierSku: 'EYE-SMK-05' },
  { id: 'p6', name: 'Boho Floral Dress', category: 'outfit', price: 75, styleValue: 'Summer Dress', description: 'Lightweight floral print with ruffles.', supplierSku: 'DRS-FLR-22' },
  { id: 'p7', name: 'Executive Blazer', category: 'outfit', price: 199, styleValue: 'Business Suit', description: 'Tailored fit navy blazer.', supplierSku: 'BLZ-NAVY-01' },
  { id: 'p8', name: 'Goth Choker & Liner', category: 'makeup', price: 35, styleValue: 'Goth', description: 'Heavy eyeliner kit with velvet choker.', supplierSku: 'ACC-GOTH-66' },
];
