/** The seven regions used by Explore. Order follows the map from west to east. */
export const REGIONS = [
  { key: 'sumatra', name: 'Sumatra', art: 'coral' },
  { key: 'jawa', name: 'Jawa', art: 'mango' },
  { key: 'kalimantan', name: 'Kalimantan', art: 'turquoise' },
  { key: 'sulawesi', name: 'Sulawesi', art: 'lilac' },
  { key: 'bali-nusa-tenggara', name: 'Bali & Nusa Tenggara', art: 'coral' },
  { key: 'maluku', name: 'Maluku', art: 'mango' },
  { key: 'papua', name: 'Papua', art: 'turquoise' },
];
export const REGION_KEYS = REGIONS.map((r) => r.key);
export const regionName = (key) => REGIONS.find((r) => r.key === key)?.name ?? null;
