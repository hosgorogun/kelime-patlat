import React from "react";
import { NavigationProvider, type NavigationContextValue } from "./navigation-context";
import { AuthProvider, type AuthContextValue } from "./auth-context";
import { ProgressionProvider, type ProgressionContextValue } from "./progression-context";
import { UIFeedbackProvider, type UIFeedbackContextValue } from "./ui-feedback-context";
import { PvPProvider, type PvPContextValue } from "./pvp-context";

export interface AppProvidersProps {
  navigation: NavigationContextValue;
  auth: AuthContextValue;
  progression: ProgressionContextValue;
  uiFeedback: UIFeedbackContextValue;
  pvp?: PvPContextValue;
  children: React.ReactNode;
}

export function AppProviders({
  navigation,
  auth,
  progression,
  uiFeedback,
  pvp,
  children,
}: AppProvidersProps) {
  const content = pvp ? (
    <PvPProvider value={pvp}>
      {children}
    </PvPProvider>
  ) : (
    children
  );

  return (
    <NavigationProvider value={navigation}>
      <AuthProvider value={auth}>
        <ProgressionProvider value={progression}>
          <UIFeedbackProvider value={uiFeedback}>
            {content}
          </UIFeedbackProvider>
        </ProgressionProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
