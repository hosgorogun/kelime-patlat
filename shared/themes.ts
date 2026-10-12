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
    name: "Kelime Bahçesi",
    background: "#F4F7F2",
    surface: "#FFFFFF",
    surfaceSelected: "#A7F3D0",
    cellBorder: "#CBD5E1",
    text: "#0F172A",
    trayBackground: "#E2EBE0",
    headerText: "#475569",
    accentColor: "#059669"
  },
  space: {
    id: "space",
    name: "Gökyüzü",
    background: "#F0F7FF",
    surface: "#FFFFFF",
    surfaceSelected: "#BAE6FD",
    cellBorder: "#CBD5E1",
    text: "#0F172A",
    trayBackground: "#E0EDFB",
    headerText: "#475569",
    accentColor: "#0284C7"
  },
  cyber: {
    id: "cyber",
    name: "Şeker Molası",
    background: "#FDF2F8",
    surface: "#FFFFFF",
    surfaceSelected: "#FBCFE8",
    cellBorder: "#CBD5E1",
    text: "#0F172A",
    trayBackground: "#FCE7F3",
    headerText: "#475569",
    accentColor: "#DB2777"
  },
  retro: {
    id: "retro",
    name: "Gün Işığı",
    background: "#FFFBEB",
    surface: "#FFFFFF",
    surfaceSelected: "#FDE68A",
    cellBorder: "#CBD5E1",
    text: "#0F172A",
    trayBackground: "#FEF3C7",
    headerText: "#475569",
    accentColor: "#D97706"
  }
};

export function getThemeForLevel(level: number): VisualTheme {
  if (level >= 71) return VISUAL_THEMES.retro!;
  if (level >= 41) return VISUAL_THEMES.cyber!;
  if (level >= 16) return VISUAL_THEMES.space!;
  return VISUAL_THEMES.standard!;
}
