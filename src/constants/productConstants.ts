export const CATEGORIES = [
  'dairy',
  'meat',
  'vegetables',
  'fruits',
  'grains',
  'beverages',
  'snacks',
  'other'
] as const;

export const LOCATIONS = [
  'fridge',
  'freezer',
  'pantry',
  'other'
] as const;

export type ProductCategory = typeof CATEGORIES[number];
export type ProductLocation = typeof LOCATIONS[number];
