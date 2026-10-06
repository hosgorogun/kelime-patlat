import React from "react";
import { Image } from "react-native";

export function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/google-logo.png")}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function AppleLogo({ size = 24, color = "#000000" }: { size?: number; color?: string }) {
  return (
    <Image
      source={require("../../assets/apple-logo.png")}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}
