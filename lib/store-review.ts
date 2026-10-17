import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_REVIEWED = "@kelime_patlat_reviewed";
const STORAGE_KEY_POSTPONED = "@kelime_patlat_review_postponed_at";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kelimepatlat.app";
const APP_STORE_URL = "https://apps.apple.com/app/kelime-patlat/id6470000000"; // Canlıya çıkışta ID güncellenebilir

export interface ReviewCheckOptions {
  wins?: number;
  level?: number;
  force?: boolean;
}

/**
 * Oyuncu belirli bir başarıya ulaştığında (örn. 5 galibiyet veya 3. seviye)
 * kullanıcıyı rahatsız etmeden Google Play / App Store değerlendirmesi ister.
 */
export async function checkAndPromptReview(options: ReviewCheckOptions = {}): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const hasReviewed = await AsyncStorage.getItem(STORAGE_KEY_REVIEWED);
    if (hasReviewed === "true") return false;

    const postponedAtStr = await AsyncStorage.getItem(STORAGE_KEY_POSTPONED);
    if (postponedAtStr && !options.force) {
      const postponedAt = parseInt(postponedAtStr, 10);
      const daysSincePostponed = (Date.now() - postponedAt) / (1000 * 60 * 60 * 24);
      // Daha sonraya basıldıysa en az 5 gün tekrar sorma
      if (daysSincePostponed < 5) return false;
    }

    const { wins = 0, level = 1, force = false } = options;
    const isEligible = force || wins >= 5 || level >= 3;

    if (!isEligible) return false;

    Alert.alert(
      "⭐ Kelime Patlat'ı Sevdin mi?",
      "Gelişmemize destek olmak ve topluluğumuzu büyütmek için mağazada 5 yıldızla değerlendirmek ister misin?",
      [
        {
          text: "Daha Sonra",
          style: "cancel",
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEY_POSTPONED, Date.now().toString());
          },
        },
        {
          text: "Hayır",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEY_REVIEWED, "dismissed");
          },
        },
        {
          text: "⭐ Şimdi Puanla",
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEY_REVIEWED, "true");
            const targetUrl = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
            Linking.openURL(targetUrl).catch(() => {
              // Mağaza linki açılamazsa genel siteyi aç
              Linking.openURL("https://kelimepatlat.com");
            });
          },
        },
      ]
    );

    return true;
  } catch (err) {
    console.warn("[StoreReview] Puanlama kontrolü hatası:", err);
    return false;
  }
}
