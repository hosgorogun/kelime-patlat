const isProduction = process.env.NODE_ENV === "production";
const cookieSecret = process.env.JWT_SECRET?.trim();

if (isProduction && (!cookieSecret || cookieSecret.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}

if (!isProduction && !cookieSecret) {
  console.warn(
    "[ENV] JWT_SECRET tanımlı değil — geliştirme amaçlı varsayılan anahtar kullanılıyor. " +
    "Üretimde mutlaka güçlü bir JWT_SECRET ayarlayın."
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID?.trim() || "kelime-patlat",
  cookieSecret: cookieSecret || "development-only-kelime-patlat-secret-key",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
