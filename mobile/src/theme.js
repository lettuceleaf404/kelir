// KELIR design tokens for React Native. Generated from the design system's tokens.json (do not edit by hand).
export const light = {
  "ink": "#24243A",
  "coral": "#FF7165",
  "mango": "#FFC857",
  "turquoise": "#38C6B5",
  "lilac": "#9484E8",
  "cream": "#FFF8ED",
  "softPeach": "#FFE0D5",
  "paleMint": "#DDF5EC",
  "softLavender": "#EBE6FF",
  "warmSand": "#F1E5D2",
  "deepTeal": "#176F69",
  "darkCoral": "#C9473D",
  "bg": "#FFF8ED",
  "surface": "#FFFFFF",
  "surface2": "#F1E5D2",
  "text": "#24243A",
  "text2": "#68677A",
  "border": "#E8DFD3",
  "primary": "#C9473D",
  "onPrimary": "#FFFFFF",
  "primaryHover": "#B13D34",
  "secondary": "#176F69",
  "turquoiseHover": "#2FB3A3",
  "mangoHover": "#F5B93A",
  "highlight": "#FFC857",
  "focus": "#9484E8",
  "borderStrong": "#8C8A9B",
  "success": "#247A59",
  "warning": "#9A6500",
  "error": "#B83232",
  "premiumBg": "#24243A",
  "premiumFg": "#FFC857",
  "scrim": "rgba(25, 25, 39, 0.72)"
};

export const dark = {
  "ink": "#24243A",
  "coral": "#FF7165",
  "mango": "#FFC857",
  "turquoise": "#38C6B5",
  "lilac": "#9484E8",
  "cream": "#FFF8ED",
  "softPeach": "#FFE0D5",
  "paleMint": "#DDF5EC",
  "softLavender": "#EBE6FF",
  "warmSand": "#F1E5D2",
  "deepTeal": "#176F69",
  "darkCoral": "#C9473D",
  "bg": "#191927",
  "surface": "#24243A",
  "surface2": "#303047",
  "text": "#FFF8ED",
  "text2": "#C4C0D0",
  "border": "#45445B",
  "primary": "#FF8A7E",
  "onPrimary": "#24243A",
  "primaryHover": "#FF9E94",
  "secondary": "#55D5C4",
  "turquoiseHover": "#2FB3A3",
  "mangoHover": "#F5B93A",
  "highlight": "#FFC857",
  "focus": "#B3A7FF",
  "borderStrong": "#77758F",
  "success": "#6ED3A6",
  "warning": "#F2B544",
  "error": "#FF8F8F",
  "premiumBg": "#FFC857",
  "premiumFg": "#24243A",
  "scrim": "rgba(25, 25, 39, 0.72)"
};

/** Spacing scale (4 px based): space[4] = 16 */
export const space = {"1": 4, "2": 8, "4": 16, "6": 24, "8": 32, "12": 48, "16": 64};

export const radius = {"md": 12, "lg": 16, "xl": 24, "pill": 999};

/** Plus Jakarta Sans weights loaded in App.js */
export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

/** Type scale from the design system (display 48/800 … label 12/700). Mobile steps display down to 36. */
export const type = {
  display: { fontFamily: font.extrabold, fontSize: 36, lineHeight: 44, letterSpacing: -0.6 },
  h1: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 36, letterSpacing: -0.4 },
  h2: { fontFamily: font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
  bodyL: { fontFamily: font.regular, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
};
