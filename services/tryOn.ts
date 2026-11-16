import { EditOptions, Product } from '../types';

export type EditorCategory =
  | 'looks'
  | 'makeup'
  | 'hair'
  | 'outfit'
  | 'shop'
  | 'closet'
  | 'ask-ai'
  | 'eraser';

export interface TryOnResult {
  optionsPatch: Partial<EditOptions>;
  category: EditorCategory;
  subCategory?: string;
}

/**
 * Map a shop product onto the editor slot it actually belongs to.
 * Makeup items must never fall back to `makeupLook` just because they have a
 * color name like "Red" — that used to apply Ruby Woo as a whole-face look.
 */
export const getProductTryOn = (product: Product): TryOnResult | null => {
  if (product.tryOn) {
    return {
      optionsPatch: product.tryOn.options,
      category: product.tryOn.category,
      subCategory: product.tryOn.subCategory,
    };
  }

  // Outfits can safely use the legacy styleValue as the outfit preset.
  if (product.category === 'outfit' && product.styleValue && product.styleValue !== 'No Change') {
    return {
      optionsPatch: { outfit: product.styleValue },
      category: 'outfit',
    };
  }

  return null;
};

export const applyTryOnOptions = (
  current: EditOptions,
  patch: Partial<EditOptions>
): EditOptions => ({ ...current, ...patch });
