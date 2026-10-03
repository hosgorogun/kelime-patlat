import { describe, expect, it } from "vitest";
import React from "react";
import {
  useNavigation,
  useAuth,
  useProgression,
  useUIFeedback,
} from "../context";

describe("Application Contexts & Providers Architecture Tests", () => {
  it("useNavigation throws error when context is missing", () => {
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevH = internals?.H;
    if (internals) internals.H = { useContext: () => null };
    try {
      expect(() => useNavigation()).toThrow(
        "useNavigation must be used within a NavigationProvider"
      );
    } finally {
      if (internals) internals.H = prevH;
    }
  });

  it("useAuth throws error when context is missing", () => {
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevH = internals?.H;
    if (internals) internals.H = { useContext: () => null };
    try {
      expect(() => useAuth()).toThrow("useAuth must be used within an AuthProvider");
    } finally {
      if (internals) internals.H = prevH;
    }
  });

  it("useProgression throws error when context is missing", () => {
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevH = internals?.H;
    if (internals) internals.H = { useContext: () => null };
    try {
      expect(() => useProgression()).toThrow(
        "useProgression must be used within a ProgressionProvider"
      );
    } finally {
      if (internals) internals.H = prevH;
    }
  });

  it("useUIFeedback throws error when context is missing", () => {
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevH = internals?.H;
    if (internals) internals.H = { useContext: () => null };
    try {
      expect(() => useUIFeedback()).toThrow(
        "useUIFeedback must be used within a UIFeedbackProvider"
      );
    } finally {
      if (internals) internals.H = prevH;
    }
  });

  it("context hooks return values when context is provided", () => {
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const mockAuth = { safeName: "Efe", playerId: "p-1", authToken: "token-123" };
    const prevH = internals?.H;
    if (internals) internals.H = { useContext: () => mockAuth };
    try {
      const auth = useAuth();
      expect(auth.safeName).toBe("Efe");
      expect(auth.playerId).toBe("p-1");
      expect(auth.authToken).toBe("token-123");
    } finally {
      if (internals) internals.H = prevH;
    }
  });
});
