import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./components/error-boundary";
import { initManusRuntime } from "./lib/_core/manus-runtime";
import { AppRoot, type Screen } from "./components/app-root";

export type { Screen };

export default function App() {
  useEffect(() => {
    initManusRuntime();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppRoot />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
