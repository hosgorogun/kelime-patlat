import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./components/common/error-boundary";
import { initManusRuntime } from "./lib/_core/manus-runtime";
import { AppRoot } from "./components/shell/app-root";
import type { Screen } from "./components/shell/types";

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
