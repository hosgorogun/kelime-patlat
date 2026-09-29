import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { haptics } from "../lib/haptics";
import { BoardSize } from "../shared/game";
import { InspectableUser } from "./user-profile-modal";

export interface FriendItem {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  avatarPhoto?: string;
  selectedTitle?: string;
  level?: number;
  tier?: string;
  lp?: number;
  wins?: number;
  matches?: number;
  streak?: number;
  bestScore?: number;
  bestTempo?: number;
  xp?: number;
  isOnline?: boolean;
}

interface FriendsLobbyScreenProps {
  selectedSize: BoardSize;
  onSelectSize: (size: BoardSize) => void;
  roomCodeInput: string;
  onRoomCodeChange: (code: string) => void;
  friendsList: FriendItem[];
  notice?: string | null;
  onBack: () => void;
  onCreateRoom: (size: BoardSize) => void;
  onJoinRoom: () => void;
  onInspectUser: (user: InspectableUser) => void;
  onChallengeFriend: (user: InspectableUser, size: BoardSize) => void;
  onFindFriends: () => void;
  onOpenLeaderboard: () => void;
}

export const FriendsLobbyScreen: React.FC<FriendsLobbyScreenProps> = ({
  selectedSize,
  onSelectSize,
  roomCodeInput,
  onRoomCodeChange,
  friendsList,
  notice,
  onBack,
  onCreateRoom,
  onJoinRoom,
  onInspectUser,
  onChallengeFriend,
  onFindFriends,
  onOpenLeaderboard,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.subHeaderKicker}>SOSYAL ARENA</Text>
          <Text style={styles.subHeaderTitle}>ARKADAŞLA OYNA</Text>
        </View>
      </View>

      <Text style={styles.modeIntro}>
        Arkadaşlarınla özel oda kurup yarışabilir, davet koduyla odaya katılabilir veya arkadaş listendeki rakiplere doğrudan düello daveti gönderebilirsin.
      </Text>

      <Text style={styles.sectionLabel}>DÜELLO TAHTA BOYUTU (TÜM BOYUTLAR AÇIK)</Text>
      <View style={styles.sizeRow}>
        {([4, 6, 8, 10] as BoardSize[]).map((size) => {
          const isSelected = selectedSize === size;
          return (
            <Pressable
              key={size}
              onPress={() => {
                haptics.light();
                onSelectSize(size);
              }}
              style={({ pressed }) => [
                styles.sizeCard,
                isSelected && styles.sizeCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.sizeValue, isSelected && styles.sizeValueSelected]}>
                {`${size}×${size}`}
              </Text>
              <Text style={styles.sizeCaption}>
                {size === 4
                  ? "Nabız (Hızlı)"
                  : size === 6
                  ? "Akış (Orta)"
                  : size === 8
                  ? "Derinlik (Zor)"
                  : "Zirve (Usta)"}
              </Text>
              <Text style={styles.sizeDetail}>
                {size === 4
                  ? "3 rota · 55 sn"
                  : size === 6
                  ? "6 rota · 75 sn"
                  : size === 8
                  ? "8 rota · 95 sn"
                  : "12 rota · 125 sn"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onCreateRoom(selectedSize)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>🤝 ÖZEL ODA KUR VE DAVET ET</Text>
        <Text style={styles.primaryButtonArrow}>→</Text>
      </Pressable>

      <View style={styles.joinCard}>
        <Text style={styles.joinTitle}>DAVET KODUYLA ODAYA KATIL</Text>
        <View style={styles.joinRow}>
          <TextInput
            value={roomCodeInput}
            onChangeText={(val) =>
              onRoomCodeChange(val.toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, ""))
            }
            maxLength={5}
            autoCapitalize="characters"
            placeholder="5 HANELİ KOD"
            placeholderTextColor="#293541"
            style={styles.codeInput}
          />
          <Pressable
            onPress={onJoinRoom}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
          >
            <Text style={styles.joinButtonText}>ODAYA GİR</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.friendsHeaderRow}>
        <Text style={styles.friendsHeaderTitle}>
          ARKADAŞLARINLA DÜELLO YAP ({friendsList.length})
        </Text>
        <Pressable onPress={onFindFriends}>
          <Text style={styles.findFriendsLink}>+ YENİ ARKADAŞ BUL</Text>
        </Pressable>
      </View>

      {friendsList.length === 0 ? (
        <View style={styles.emptyFriendsCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
          <Text style={styles.emptyFriendsTitle}>Henüz Arkadaşın Yok</Text>
          <Text style={styles.emptyFriendsText}>
            Liderlik tablosundaki oyuncuları inceleyerek veya maç sonu ekranlarından rakipleri arkadaş olarak ekleyebilirsin.
          </Text>
          <Pressable onPress={onOpenLeaderboard} style={styles.emptyFriendsButton}>
            <Text style={styles.emptyFriendsButtonText}>🏆 LİDERLİK TABLOSUNU AÇ</Text>
          </Pressable>
        </View>
      ) : (
        friendsList.map((friend) => {
          const inspectable: InspectableUser = {
            id: friend.id,
            name: friend.name,
            username: friend.username,
            avatar: friend.avatar,
            avatarPhoto: friend.avatarPhoto,
            selectedTitle: friend.selectedTitle,
            level: friend.level,
            tier: friend.tier,
            lp: friend.lp,
            wins: friend.wins,
            matches: friend.matches,
            streak: friend.streak,
            bestScore: friend.bestScore,
            bestTempo: friend.bestTempo,
            xp: friend.xp,
            isBot: false,
          };

          return (
            <Pressable
              key={friend.id}
              onPress={() => onInspectUser(inspectable)}
              style={({ pressed }) => [styles.friendDuelCard, pressed && styles.pressed]}
            >
              <View style={styles.friendDuelLeft}>
                <View style={styles.friendAvatarWrap}>
                  {friend.avatarPhoto ? (
                    <Image
                      source={{ uri: friend.avatarPhoto }}
                      style={{ width: 38, height: 38, borderRadius: 12 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{friend.avatar || "👤"}</Text>
                  )}
                  <View
                    style={[
                      styles.friendOnlineDot,
                      { backgroundColor: friend.isOnline ? "#10B981" : "#bec5ce" },
                    ]}
                  />
                </View>
                <View style={styles.friendDuelInfo}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.friendDuelName} numberOfLines={1}>
                      {friend.name}
                    </Text>
                    {friend.selectedTitle ? (
                      <Text style={styles.friendDuelTag}>{friend.selectedTitle}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.friendDuelMeta}>
                    {friend.isOnline ? "🟢 Çevrimiçi" : "⚪ Çevrimdışı"} · {friend.tier || "BRONZ"} ({friend.lp || 0} LP)
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => onChallengeFriend(inspectable, selectedSize)}
                style={({ pressed }) => [styles.friendDuelButton, pressed && styles.pressed]}
              >
                <Text style={styles.friendDuelButtonText}>⚔️ DÜELLO</Text>
              </Pressable>
            </Pressable>
          );
        })
      )}

      {Boolean(notice) && <Text style={styles.notice}>{notice}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    color: "#293541",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  headerTitles: {
    flex: 1,
  },
  subHeaderKicker: {
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subHeaderTitle: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modeIntro: {
    color: "#293541",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  sizeCardSelected: {
    borderColor: "#F0C855",
    borderWidth: 2,
    backgroundColor: "#FFF9E6",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sizeValue: {
    color: "#293541",
    fontSize: 18,
    fontWeight: "900",
  },
  sizeValueSelected: {
    color: "#293541",
  },
  sizeCaption: {
    color: "#293541",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  sizeDetail: {
    color: "#718096",
    fontSize: 8,
    marginTop: 2,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#aef5e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButtonArrow: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
  },
  joinCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 16,
    marginTop: 14,
  },
  joinTitle: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  joinRow: {
    flexDirection: "row",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 2,
  },
  joinButton: {
    backgroundColor: "#aef5e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButtonText: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  friendsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  friendsHeaderTitle: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  findFriendsLink: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyFriendsCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 24,
    alignItems: "center",
  },
  emptyFriendsTitle: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  emptyFriendsText: {
    color: "#718096",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
  },
  emptyFriendsButton: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyFriendsButtonText: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  friendDuelCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  friendDuelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  friendAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(35,48,59,0.06)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  friendOnlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#F0F5ED",
  },
  friendDuelInfo: {
    flex: 1,
  },
  friendDuelName: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
  },
  friendDuelTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8c7540",
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  friendDuelMeta: {
    color: "#718096",
    fontSize: 10,
    marginTop: 2,
  },
  friendDuelButton: {
    backgroundColor: "#aef5e0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  friendDuelButtonText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  notice: {
    color: "#718096",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
