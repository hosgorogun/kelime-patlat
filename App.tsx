import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./components/common/error-boundary";
import { initManusRuntime } from "./lib/_core/manus-runtime";
import { AppRoot } from "./components/shell/app-root";
import type { Screen } from "./components/shell/types";

LogBox.ignoreLogs([
  "[Notifications]",
  "props.pointerEvents is deprecated",
  "\"shadow*\" style props are deprecated",
  "\"textShadow*\" style props are deprecated",
]);

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
