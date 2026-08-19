export type VisualTheme = {
  id: string;
  name: string;
  background: string;
  surface: string;
  surfaceSelected: string;
  cellBorder: string;
  text: string;
  trayBackground: string;
  headerText: string;
  accentColor: string;
};

export const VISUAL_THEMES: Record<string, VisualTheme> = {
  standard: {
    id: "standard",
    name: "Klasik Gece Yarısı",
    background: "#0F0B24",
    surface: "#30264D",
    surfaceSelected: "#4D3B81",
    cellBorder: "#594884",
    text: "#FFF9FC",
    trayBackground: "#211A3D",
    headerText: "#B8ADD1",
    accentColor: "#9A76ED"
  },
  space: {
    id: "space",
    name: "Derin Uzay",
    background: "#080B16",
    surface: "#182643",
    surfaceSelected: "#2A457D",
    cellBorder: "#2E477F",
    text: "#E5F4FF",
    trayBackground: "#11182C",
    headerText: "#8FA4CF",
    accentColor: "#50E3C2"
  },
  cyber: {
    id: "cyber",
    name: "Siberpunk Neon",
    background: "#18061B",
    surface: "#38103F",
    surfaceSelected: "#691975",
    cellBorder: "#781885",
    text: "#FFF5FE",
    trayBackground: "#28072E",
    headerText: "#D8A3DF",
    accentColor: "#FF647C"
  },
  retro: {
    id: "retro",
    name: "Retro Arcade",
    background: "#1C1C18",
    surface: "#383630",
    surfaceSelected: "#5E5B51",
    cellBorder: "#706B5F",
    text: "#FFFFE0",
    trayBackground: "#2A2924",
    headerText: "#C4C0B5",
    accentColor: "#FFC24A"
  }
};

export function getThemeForLevel(level: number): VisualTheme {
  if (level >= 71) return VISUAL_THEMES.retro!;
  if (level >= 41) return VISUAL_THEMES.cyber!;
  if (level >= 16) return VISUAL_THEMES.space!;
  return VISUAL_THEMES.standard!;
}
