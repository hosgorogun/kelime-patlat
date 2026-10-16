import "dotenv/config";
import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";
let cookieSecret = process.env.JWT_SECRET?.trim();

if (isProduction && (!cookieSecret || cookieSecret.length < 32)) {
  const generatedSecret = crypto.randomBytes(32).toString("hex");
  console.warn(
    "[SECURITY WARNING] JWT_SECRET ortam değişkeni ayarlanmamış veya 32 karakterden kısa!\n" +
    "[SECURITY WARNING] Cloud/üretim ortamında sunucunun çökmesini engellemek için bu oturuma özel geçici 256-bit anahtar üretildi.\n" +
    "[SECURITY WARNING] Sunucu yeniden başladığında oturumların korunması için cloud panelinde en az 32 karakterlik JWT_SECRET tanımlayınız."
  );
  cookieSecret = cookieSecret || generatedSecret;
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

