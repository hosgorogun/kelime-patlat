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
    name: "Zümrüt Vadisi",
    background: "#EDF7F2",
    surface: "#FFFFFF",
    surfaceSelected: "#6EE7B7",
    cellBorder: "#A7F3D0",
    text: "#064E3B",
    trayBackground: "#D1FAE5",
    headerText: "#047857",
    accentColor: "#059669"
  },
  space: {
    id: "space",
    name: "Kozmik Gökyüzü",
    background: "#EFF6FF",
    surface: "#FFFFFF",
    surfaceSelected: "#7DD3FC",
    cellBorder: "#BAE6FD",
    text: "#0C4A6E",
    trayBackground: "#E0F2FE",
    headerText: "#0369A1",
    accentColor: "#0284C7"
  },
  cyber: {
    id: "cyber",
    name: "Şeker Şöleni",
    background: "#FDF2F8",
    surface: "#FFFFFF",
    surfaceSelected: "#F472B6",
    cellBorder: "#FBCFE8",
    text: "#831843",
    trayBackground: "#FCE7F3",
    headerText: "#BE185D",
    accentColor: "#DB2777"
  },
  retro: {
    id: "retro",
    name: "Altın Vadi",
    background: "#FEFCE8",
    surface: "#FFFFFF",
    surfaceSelected: "#FCD34D",
    cellBorder: "#FDE68A",
    text: "#78350F",
    trayBackground: "#FEF9C3",
    headerText: "#B45309",
    accentColor: "#D97706"
  }
};

export function getThemeForLevel(level: number): VisualTheme {
  if (level >= 71) return VISUAL_THEMES.retro!;
  if (level >= 41) return VISUAL_THEMES.cyber!;
  if (level >= 16) return VISUAL_THEMES.space!;
  return VISUAL_THEMES.standard!;
}
