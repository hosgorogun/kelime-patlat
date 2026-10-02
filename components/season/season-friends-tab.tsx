import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import type { LeaderboardEntry, BoardSize } from "@/shared/game";
import { socialManager, type FriendUser, type FriendRequest } from "@/shared/social";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { styles } from "./season-hub.styles";

export type SeasonFriendsTabProps = {
  friendsList: FriendUser[];
  onlineFriendsCount: number;
  friendInput: string;
  setFriendInput: (val: string) => void;
  handleAddFriend: () => void;
  socialMessage: string | null;
  friendsSubTab: "friends" | "requests";
  setFriendsSubTab: (tab: "friends" | "requests") => void;
  pendingRequestsList: FriendRequest[];
  setPendingRequestsList: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
  setFriendsList: React.Dispatch<React.SetStateAction<FriendUser[]>>;
  handleRemoveFriend: (friend: FriendUser) => void;
  handleDuelPress: (friend: FriendUser) => void;
  onInspectUser?: (user: Partial<LeaderboardEntry> & { id: string; name: string }) => void;
  onChallengeFriend?: (friendName: string, size: BoardSize) => void;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
};

export const SeasonFriendsTab = React.memo(({
  friendsList,
  onlineFriendsCount,
  friendInput,
  setFriendInput,
  handleAddFriend,
  socialMessage,
  friendsSubTab,
  setFriendsSubTab,
  pendingRequestsList,
  setPendingRequestsList,
  setFriendsList,
  handleRemoveFriend,
  handleDuelPress,
  onInspectUser,
  onChallengeFriend,
  onAcceptRequest,
  onRejectRequest,
}: SeasonFriendsTabProps) => {
  return (
    <View>
      <View style={styles.socialHero}>
        <Text style={styles.socialHeroKicker}>TOPLULUK AĞI</Text>
        <Text style={styles.socialHeroTitle}>ARKADAŞLARINLA YARIŞ</Text>
        <Text style={styles.socialHeroBody}>
          {friendsList.length} arkadaş listende · {onlineFriendsCount} şu an çevrim içi
        </Text>
      </View>

      <View style={styles.addCard}>
        <Text style={styles.addCardLabel}>YENİ ARKADAŞ EKLE</Text>
        <View style={styles.addFriendRow}>
          <TextInput
            value={friendInput}
            onChangeText={setFriendInput}
            placeholder="Kullanıcı adı girin (Örn: neon_007)"
            placeholderTextColor="#293541"
            autoCapitalize="none"
            style={styles.addFriendInput}
          />
          <Pressable onPress={handleAddFriend} style={styles.addFriendBtn}>
            <Text style={styles.addFriendBtnText}>EKLE</Text>
          </Pressable>
        </View>
        {socialMessage && <Text style={styles.socialMsg}>{socialMessage}</Text>}
      </View>

      {/* Sub-tab switcher: Arkadaşlarım vs Gelen İstekler */}
      <View style={styles.subTabContainer}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setFriendsSubTab("friends");
          }}
          style={[styles.subTabBtn, friendsSubTab === "friends" && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabText, friendsSubTab === "friends" && styles.subTabTextActive]}>
            ARKADAŞLAR ({friendsList.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setFriendsSubTab("requests");
          }}
          style={[styles.subTabBtn, friendsSubTab === "requests" && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabText, friendsSubTab === "requests" && styles.subTabTextActive]}>
            GELEN İSTEKLER ({pendingRequestsList.length})
          </Text>
          {pendingRequestsList.length > 0 && (
            <View style={styles.requestBadgeDot}>
              <Text style={styles.requestBadgeText}>{pendingRequestsList.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {friendsSubTab === "friends" && (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>ARKADAŞ LİSTESİ</Text>
            <Text style={styles.sectionMeta}>{onlineFriendsCount} ÇEVRİM İÇİ</Text>
          </View>

          <View style={styles.friendsBoard}>
            {friendsList.length === 0 && (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyTitle}>LİSTE BOŞ</Text>
                <Text style={styles.emptyCopy}>Yukarıdan kullanıcı adı girerek arkadaş ekleyebilirsin.</Text>
              </View>
            )}
            {friendsList.map((f) => (
              <View key={f.id} style={styles.friendRow}>
                {/* Top row: avatar + info + status dot + remove */}
                <View style={styles.friendRowTop}>
                  <Pressable
                    style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, gap: 10 }}
                    onPress={() => {
                      triggerHapticSelection();
                      onInspectUser?.(f);
                    }}
                  >
                    <Text style={styles.friendAvatarText}>{f.avatar}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text numberOfLines={1} style={styles.friendNameText}>{f.name}</Text>
                        <View
                          style={{
                            backgroundColor: "#38BDF820",
                            borderWidth: 1,
                            borderColor: "#DCE1D7",
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#2a8fbc", fontSize: 9, fontWeight: "900" }}>
                            SEVİYE {f.level ?? Math.floor(f.xp / 200) + 1}
                          </Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={styles.friendXpText}>
                        @{f.username} · {f.tier ?? "DEMİR"} ({f.lp ?? f.xp} LP) · {f.xp} XP
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.statusWrap}>
                    <View style={[styles.onlineDot, f.isOnline ? styles.onlineDotActive : styles.onlineDotOffline]} />
                    <Text style={styles.onlineStatusText}>{f.isOnline ? "ÇEVRİM İÇİ" : "ÇEVRİM DIŞI"}</Text>
                  </View>
                  <Pressable
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleRemoveFriend(f)}
                    style={({ pressed }) => [styles.removeFriendBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={styles.removeFriendText}>✕</Text>
                  </Pressable>
                </View>

                {/* Bottom row: challenge button */}
                {onChallengeFriend && (
                  <Pressable
                    onPress={() => handleDuelPress(f)}
                    style={({ pressed }) => [styles.challengeBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.challengeBtnText}>⚡ DÜELLO GÖNDERİ OLUŞTUR</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {friendsSubTab === "requests" && (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>BEKLEYEN İSTEKLER</Text>
            <Text style={styles.sectionMeta}>{pendingRequestsList.length} İSTEK</Text>
          </View>

          <View style={styles.friendsBoard}>
            {pendingRequestsList.length === 0 && (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyTitle}>BEKLEYEN İSTEK YOK</Text>
                <Text style={styles.emptyCopy}>Şu anda sana gönderilen yeni bir arkadaşlık isteği bulunmuyor.</Text>
              </View>
            )}
            {pendingRequestsList.map((req) => (
              <View key={req.id} style={styles.requestRow}>
                <View style={styles.friendRowTop}>
                  <Text style={styles.friendAvatarText}>{req.fromAvatar || "🎮"}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text numberOfLines={1} style={styles.friendNameText}>{req.fromName}</Text>
                      <View
                        style={{
                          backgroundColor: "#38BDF820",
                          borderWidth: 1,
                          borderColor: "#DCE1D7",
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: "#2a8fbc", fontSize: 9, fontWeight: "900" }}>
                          SEVİYE {req.fromLevel ?? 1}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.friendXpText}>
                      @{req.fromUsername} · {req.fromTier ?? "DEMİR"} ({req.fromLp ?? 0} LP)
                    </Text>
                  </View>
                </View>
                <View style={styles.requestActionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => {
                      triggerHapticSuccess();
                      if (onAcceptRequest) {
                        onAcceptRequest(req.id);
                      } else {
                        socialManager.addFriend({
                          id: req.fromUserId,
                          name: req.fromName,
                          username: req.fromUsername,
                          avatar: req.fromAvatar,
                          level: req.fromLevel,
                          tier: req.fromTier,
                          lp: req.fromLp,
                          xp: req.fromXp,
                        });
                        socialManager.removePendingRequest(req.id);
                        setPendingRequestsList([...socialManager.getPendingRequests()]);
                        setFriendsList([...socialManager.getFriends()]);
                      }
                    }}
                  >
                    <Text style={styles.acceptBtnText}>✓ KABUL ET</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => {
                      triggerHapticSelection();
                      if (onRejectRequest) {
                        onRejectRequest(req.id);
                      } else {
                        socialManager.removePendingRequest(req.id);
                        setPendingRequestsList([...socialManager.getPendingRequests()]);
                      }
                    }}
                  >
                    <Text style={styles.rejectBtnText}>✕ REDDET</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
});

SeasonFriendsTab.displayName = "SeasonFriendsTab";
