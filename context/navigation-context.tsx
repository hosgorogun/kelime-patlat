import React, { createContext, useContext } from "react";
import type { Screen } from "@/components/shell/types";
import type { SeasonTab } from "@/components/season/season-hub";

export interface NavigationContextValue {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  seasonInitialTab: SeasonTab;
  setSeasonInitialTab: (tab: SeasonTab) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  value,
  children,
}: {
  value: NavigationContextValue;
  children: React.ReactNode;
}) {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
