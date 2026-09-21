import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "com.app.kelimepatlat";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const APP_ID = env.appId;
export const API_BASE_URL = env.apiBaseUrl;

import Constants from "expo-constants";

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web, derive from current window location
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, origin } = window.location;
    if (process.env.NODE_ENV === "production") {
      return origin;
    }
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
    // Local dev on web: same host, port 3000
    return `${protocol}//${hostname}:3000`;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("[API] EXPO_PUBLIC_API_BASE_URL is not configured for production mobile builds. Falling back to local network host.");
  }

  // Check Expo Metro host IP if available (dynamically resolves Metro host for Android emulator or physical device)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3000`;
    }
  }

  // Android emulator: localhost maps to 10.0.2.2
  if (ReactNative.Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  // iOS simulator: localhost works
  return "http://localhost:3000";
}

export const SESSION_TOKEN_KEY = "app_session_token";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    return Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }
};

export function isOAuthConfigured(): boolean {
  return Boolean(OAUTH_PORTAL_URL && OAUTH_PORTAL_URL.trim().length > 0);
}

export const getLoginUrl = (provider?: string) => {
  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);
  const portal = (OAUTH_PORTAL_URL || getApiBaseUrl()).trim();
  const base = portal.startsWith("http") ? portal : `https://${portal}`;

  const url = new URL(`${base.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", APP_ID || "kelime-patlat");
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  if (provider) {
    url.searchParams.set("provider", provider.toLowerCase());
  }

  return url.toString();
};

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), open the system browser directly so
 * the OAuth callback returns via deep link to the app.
 *
 * On web, this simply redirects to the login URL.
 */
export async function startOAuthLogin(provider?: string): Promise<{ success: boolean; message?: string }> {
  if (!isOAuthConfigured()) {
    return {
      success: false,
      message: `${provider || "Sosyal"} giriş altyapısı için OAuth sunucusu yapılandırılmamış. Lütfen kullanıcı adı ve şifre ile giriş yapın veya Misafir olarak devam edin.`
    };
  }

  const loginUrl = getLoginUrl(provider);

  if (ReactNative.Platform.OS === "web") {
    // On web, just redirect
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return { success: true };
  }

  const supported = await Linking.canOpenURL(loginUrl);
  if (!supported) {
    console.warn("[OAuth] Cannot open login URL: URL scheme not supported");
    return { success: false, message: "Cihazınızda oturum açma bağlantısı açılamadı." };
  }

  try {
    await Linking.openURL(loginUrl);
    return { success: true };
  } catch (error: any) {
    console.error("[OAuth] Failed to open login URL:", error);
    return { success: false, message: error?.message || "Bağlantı açılamadı." };
  }
}
