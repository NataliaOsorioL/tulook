export const GARMENT_CATEGORIES = {
  TOP: 'top',
  BOTTOM: 'bottom',
  DRESS: 'dress',
  SHOES: 'shoes',
  ACCESSORY: 'accessory',
};

export const GARMENT_CATEGORIES_LABELS = {
  [GARMENT_CATEGORIES.TOP]: 'Parte Superior',
  [GARMENT_CATEGORIES.BOTTOM]: 'Parte Inferior',
  [GARMENT_CATEGORIES.DRESS]: 'Vestido',
  [GARMENT_CATEGORIES.SHOES]: 'Calzado',
  [GARMENT_CATEGORIES.ACCESSORY]: 'Accesorios',
};

export const GARMENT_TYPES = {
  [GARMENT_CATEGORIES.TOP]: [
    'Blusa', 'Camisa', 'Crop top', 'Playera', 'Suéter', 'Chamarra',
    'Abrigo', 'Chaleco', 'Body', 'Top deportivo',
  ],
  [GARMENT_CATEGORIES.BOTTOM]: [
    'Falda', 'Jean', 'Pantalón', 'Short', 'Leggings', 'Bermuda', 'Pantalón de vestir',
  ],
  [GARMENT_CATEGORIES.DRESS]: [
    'Vestido corto', 'Vestido largo', 'Overol', 'Mono',
  ],
  [GARMENT_CATEGORIES.SHOES]: [
    'Tenis', 'Tacones', 'Sandalias', 'Botas', 'Bailarinas',
    'Playas', 'Mocasines', 'Botines',
  ],
  [GARMENT_CATEGORIES.ACCESSORY]: [
    'Bufanda', 'Gorra', 'Bolso', 'Collar', 'Pulsera', 'Cinturón',
    'Lentes', 'Sombrero', 'Reloj', 'Pañuelo',
  ],
};

export const TEMPERATURE_UNITS = {
  CELSIUS: 'C',
  FAHRENHEIT: 'F',
};

export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

export const WEATHER_CACHE_TTL_MINUTES = 30;

export const DAILY_OUTFIT_RULES = {
  MIN_GARMENTS_REQUIRED: 2,
  REPEAT_PENALTY_DAYS: 14,
  EXCLUDE_RECENT_DAYS: 7,
  RECENT_GARMENTS_LIMIT: 3,
  STALE_WEATHER_TEMP_DEFAULT: 20,
  STALE_WEATHER_CONDITION_DEFAULT: 'Clear',
};

export const SCORING_WEIGHTS = {
  RECENTLY_USED_PENALTY: -50,
  LOW_USAGE_BONUS: 20,
  FAVORITE_BONUS: 10,
  FORGOTTEN_BONUS: 15,
  SEASON_MISMATCH_PENALTY: -100,
};

export const SEASON_TAGS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  FALL: 'fall',
  WINTER: 'winter',
};

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  GARMENTS: 'garments',
  OUTFITS: 'outfits',
  OUTFIT_GARMENTS: 'outfit_garments',
  DAILY_OUTFITS: 'daily_outfits',
  WEATHER_CACHE: 'weather_cache',
};
