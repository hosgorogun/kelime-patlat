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
    background: "#F7F5EE",
    surface: "#FFFFFF",
    surfaceSelected: "#B9EDD0",
    cellBorder: "#CED8C9",
    text: "#293541",
    trayBackground: "#E9EFE3",
    headerText: "#626F73",
    accentColor: "#167653"
  },
  space: {
    id: "space",
    name: "Gökyüzü",
    background: "#F0F6FD",
    surface: "#FFFFFF",
    surfaceSelected: "#B6DCFF",
    cellBorder: "#C9DAE8",
    text: "#293541",
    trayBackground: "#E2EEFA",
    headerText: "#526C81",
    accentColor: "#216A9F"
  },
  cyber: {
    id: "cyber",
    name: "Şeker Molası",
    background: "#FBF2F6",
    surface: "#FFFFFF",
    surfaceSelected: "#F4BED4",
    cellBorder: "#E3CED8",
    text: "#293541",
    trayBackground: "#F5E3EC",
    headerText: "#78596B",
    accentColor: "#A3396A"
  },
  retro: {
    id: "retro",
    name: "Gün Işığı",
    background: "#FFF8E8",
    surface: "#FFFFFF",
    surfaceSelected: "#FFD66E",
    cellBorder: "#E1D5B8",
    text: "#293541",
    trayBackground: "#F4EBD0",
    headerText: "#786941",
    accentColor: "#996000"
  }
};

export function getThemeForLevel(level: number): VisualTheme {
  if (level >= 71) return VISUAL_THEMES.retro!;
  if (level >= 41) return VISUAL_THEMES.cyber!;
  if (level >= 16) return VISUAL_THEMES.space!;
  return VISUAL_THEMES.standard!;
}
