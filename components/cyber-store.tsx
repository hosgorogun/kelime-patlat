import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DIGITAL_STORE_PRODUCTS, monetizationManager, type ProductItem } from "@/shared/monetization";
import { socialManager, type FriendUser } from "@/shared/social";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

export function CyberStore({
  coins,
  onBuyCoins,
  onBuyRadar,
  onBack,
}: {
  coins: number;
  onBuyCoins: (amount: number) => void;
  onBuyRadar: () => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"store" | "friends">("store");
  const [friendInput, setFriendInput] = useState("");
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handlePurchase = async (product: ProductItem) => {
    triggerHapticSelection();
    setBuyingId(product.id);
    const res = await monetizationManager.purchaseProduct(product.id);
    setBuyingId(null);
    if (res.success && res.product) {
      triggerHapticSuccess();
      if (res.product.coins > 0) {
        onBuyCoins(res.product.coins);
      }
      if (res.product.unlimitedRadar) {
        onBuyRadar();
      }
    }
  };

  const handleAddFriend = () => {
    if (!friendInput.trim()) return;
    const res = socialManager.addFriend(friendInput);
    setSocialMessage(res.message);
    if (res.success) {
      setFriendsList([...socialManager.getFriends()]);
      setFriendInput("");
    }
    setTimeout(() => setSocialMessage(null), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerKicker}>SİBER MARKETS & TOPLULUK</Text>
          <Text style={styles.headerTitle}>SİBER MAĞAZA</Text>
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("store");
          }}
          style={[styles.tabButton, activeTab === "store" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "store" && styles.tabTextActive]}>🛒 ÇİP & PAKETLER</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("friends");
          }}
          style={[styles.tabButton, activeTab === "friends" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>👥 ARKADAŞLAR</Text>
        </Pressable>
      </View>

      {activeTab === "store" ? (
        <View style={styles.storeList}>
          {DIGITAL_STORE_PRODUCTS.map((prod) => (
            <View key={prod.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productIcon}>{prod.type === "radar_pack" ? "👁" : "🪙"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{prod.name}</Text>
                  <Text style={styles.productDesc}>{prod.description}</Text>
                </View>
              </View>
              <Pressable
                disabled={buyingId === prod.id}
                onPress={() => handlePurchase(prod)}
                style={({ pressed }) => [styles.buyButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.buyButtonText}>
                  {buyingId === prod.id ? "İŞLENİYOR..." : prod.priceText}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.friendsWrap}>
          {/* Add Friend Input */}
          <View style={styles.addFriendCard}>
            <Text style={styles.addTitle}>YENİ ARKADAŞ EKLE</Text>
            <View style={styles.addInputRow}>
              <TextInput
                value={friendInput}
                onChangeText={setFriendInput}
                placeholder="Kullanıcı adı girin (Örn: neon_007)"
                placeholderTextColor="#877A9E"
                autoCapitalize="none"
                style={styles.realInput}
              />
              <Pressable
                onPress={handleAddFriend}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>EKLE</Text>
              </Pressable>
            </View>
            {socialMessage && <Text style={styles.socialMsg}>{socialMessage}</Text>}
          </View>

          {/* Friends List */}
          <Text style={styles.sectionHeader}>ARKADAŞ LİSTESİ ({friendsList.length})</Text>
          {friendsList.map((f) => (
            <View key={f.id} style={styles.friendCard}>
              <Text style={styles.friendAvatar}>{f.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.friendName}>{f.name}</Text>
                <Text style={styles.friendXp}>@{f.username} · {f.xp} XP</Text>
              </View>
              <View style={[styles.statusDot, f.isOnline ? styles.onlineDot : styles.offlineDot]} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0F0B1E", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#1F1936", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF", fontSize: 24, lineHeight: 24 },
  headerTitleWrap: { flex: 1, marginLeft: 12 },
  headerKicker: { color: "#7C5CF6", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", marginTop: 2 },
  coinBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#271E44", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#FFC24A" },
  coinIcon: { fontSize: 14, marginRight: 4 },
  coinText: { color: "#FFC24A", fontSize: 13, fontWeight: "900" },
  tabContainer: { flexDirection: "row", backgroundColor: "#19132F", borderRadius: 14, padding: 4, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#7C5CF6" },
  tabText: { color: "#A49BBF", fontSize: 11, fontWeight: "900" },
  tabTextActive: { color: "#FFF" },
  storeList: { gap: 12 },
  productCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1B1533", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#2F2654" },
  productInfo: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  productIcon: { fontSize: 28, marginRight: 12 },
  productName: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  productDesc: { color: "#9285B2", fontSize: 9, marginTop: 2 },
  buyButton: { backgroundColor: "#00F5D4", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  buyButtonText: { color: "#121025", fontSize: 11, fontWeight: "900" },
  friendsWrap: { gap: 14 },
  addFriendCard: { backgroundColor: "#1B1533", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#2F2654" },
  addTitle: { color: "#7C5CF6", fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginBottom: 8 },
  addInputRow: { flexDirection: "row", gap: 8 },
  realInput: { flex: 1, backgroundColor: "#110D24", borderRadius: 10, paddingHorizontal: 12, color: "#FFF", fontSize: 12, height: 42 },
  addButton: { backgroundColor: "#7C5CF6", paddingHorizontal: 16, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  addButtonText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  socialMsg: { color: "#00F5D4", fontSize: 10, fontWeight: "800", marginTop: 8 },
  sectionHeader: { color: "#A49BBF", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 6 },
  friendCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1B1533", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#2F2654" },
  friendAvatar: { fontSize: 22, marginRight: 10 },
  friendName: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  friendXp: { color: "#877A9E", fontSize: 9, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  onlineDot: { backgroundColor: "#00F5D4" },
  offlineDot: { backgroundColor: "#52476D" },
});
