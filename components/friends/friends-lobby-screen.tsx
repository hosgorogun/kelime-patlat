import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { haptics } from "@/lib/haptics";
import { BoardSize } from "@/shared/game";
import { InspectableUser } from "@/components/profile/user-profile-modal";
import { styles } from "./friends-lobby.styles";

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
              onRoomCodeChange(val.replace(/[iıİ]/g, "I").toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            maxLength={5}
            autoCapitalize="characters"
            placeholder="5 HANELİ KOD"
            placeholderTextColor="#293541"
            style={styles.codeInput}
          />
          <Pressable
            onPress={onJoinRoom}
            style={({ pressed }) => [
              styles.joinButton,
              roomCodeInput.length < 5 && styles.joinButtonDisabled,
              pressed && styles.pressed,
            ]}
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
