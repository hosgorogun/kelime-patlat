import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RoomSnapshot } from "@/shared/game";
import { PROFILE_FRAMES } from "@/shared/store-items";

function initials(name: string) {
  return name.trim().slice(0, 2).toLocaleUpperCase("tr-TR") || "KP";
}

interface PlayerRowProps {
  player: {
    id?: string;
    name: string;
    connected: boolean;
    ready: boolean;
    isBot?: boolean;
    avatar?: string;
    avatarPhoto?: string;
    selectedFrame?: string;
  };
  isMe: boolean;
  accent: string;
  onPress?: () => void;
}

export function PlayerRow({
  player,
  isMe,
  accent,
  onPress,
}: PlayerRowProps) {
  const frameColor = PROFILE_FRAMES.find(([fId]) => fId === player.selectedFrame)?.[2];
  const avatarBorderColor = frameColor || accent;
  const [imgError, setImgError] = useState(false);

  const rowContent = (
    <View style={styles.playerRow}>
      <View style={[styles.playerAvatar, { borderColor: avatarBorderColor, overflow: "hidden" }]}>
        {player.avatarPhoto && !imgError ? (
          <Image
            source={{ uri: player.avatarPhoto }}
            style={{ width: "100%", height: "100%", borderRadius: 20 }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={styles.playerAvatarText}>
            {player.isBot
              ? "BOT"
              : player.avatar && player.avatar.length <= 3
              ? player.avatar
              : initials(player.name)}
          </Text>
        )}
      </View>
      <View style={styles.playerInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.playerName}>{player.name}{isMe ? "  (SEN)" : ""}</Text>
          {onPress && <Text style={{ fontSize: 9, opacity: 0.8 }}>👤</Text>}
        </View>
        <Text style={styles.playerState}>
          {player.isBot
            ? "YAPAY RAKİP HAZIR"
            : player.connected
            ? player.ready
              ? "HAZIR"
              : "TAHTAYI İNCELİYOR"
            : "BAĞLANTI YENİLENİYOR"}
        </Text>
      </View>
      <View style={[styles.readyDot, { backgroundColor: player.ready ? "#d8f4aa" : "#EDF4FC" }]} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {rowContent}
      </Pressable>
    );
  }

  return rowContent;
}

interface RoomWaitingScreenProps {
  room: RoomSnapshot;
  playerId: string;
  notice?: string | null;
  onLeaveRoom: () => void;
  onShareInvite: () => void;
  onMarkReady: () => void;
  onOpenUserProfile: (player: any) => void;
}

export const RoomWaitingScreen: React.FC<RoomWaitingScreenProps> = ({
  room,
  playerId,
  notice,
  onLeaveRoom,
  onShareInvite,
  onMarkReady,
  onOpenUserProfile,
}) => {
  const bothPlayers = room.players.length === 2;
  const me = room.players.find((p) => p.id === playerId);
  const isBotRoom = room.players.some((p) => p.isBot);

  return (
    <ScrollView contentContainerStyle={styles.roomScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.navRow}>
        <Pressable onPress={onLeaveRoom} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {isBotRoom ? "BOT DÜELLOSU" : "CANLI DÜELLO LOBİSİ"}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <View style={styles.roomHero}>
        <Text style={styles.eyebrow}>DAVET KODU</Text>
        <Text style={styles.roomCode}>{room.code}</Text>
        <Text style={styles.roomHint}>Rakibin bu kodla odaya katılabilir.</Text>
        <Pressable
          onPress={onShareInvite}
          style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
        >
          <Text style={styles.inviteButtonText}>DAVET BAĞLANTISINI PAYLAŞ</Text>
          <Text style={styles.inviteButtonIcon}>↗</Text>
        </Pressable>
      </View>

      <View style={styles.playerList}>
        {room.players.map((player, index) => (
          <PlayerRow
            key={player.id}
            player={player}
            isMe={player.id === playerId}
            accent={index === 0 ? "#2DD4BF" : "#FB7185"}
            onPress={
              player.id !== playerId
                ? () => {
                    onOpenUserProfile(player);
                  }
                : undefined
            }
          />
        ))}
        {!bothPlayers && (
          <View style={styles.waitPlayer}>
            <View style={styles.waitAvatar}>
              <Text style={styles.waitAvatarText}>?</Text>
            </View>
            <View>
              <Text style={styles.waitTitle}>RAKİP BEKLENİYOR</Text>
              <Text style={styles.waitSub}>Oda kodunu paylaş</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.ruleCard}>
        <Text style={styles.ruleIcon}>✦</Text>
        <View style={styles.ruleTextWrap}>
          <Text style={styles.ruleTitle}>
            {room.size}×{room.size} TAHTA · {room.wordsTotal} KELİME
          </Text>
          <Text style={styles.ruleCopy}>
            Aynı tahtadaki tüm kelimeleri bul. Sadece yatay ve dikey komşu harfleri bağla.
          </Text>
        </View>
      </View>

      <Pressable
        disabled={!bothPlayers || me?.ready}
        onPress={onMarkReady}
        style={({ pressed }) => [
          styles.primaryButton,
          (!bothPlayers || me?.ready) && styles.disabledButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {me?.ready ? "RAKİP HAZIRLANIYOR" : "HAZIRIM"}
        </Text>
        <Text style={styles.primaryButtonArrow}>{me?.ready ? "…" : "✓"}</Text>
      </Pressable>

      {Boolean(notice) && <Text style={styles.notice}>{notice}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  roomScroll: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  navTitle: {
    color: "#293541",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  navSpacer: {
    width: 38,
  },
  roomHero: {
    backgroundColor: "#F0F5ED",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eyebrow: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  roomCode: {
    color: "#293541",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 6,
    marginVertical: 4,
  },
  roomHint: {
    color: "#718096",
    fontSize: 12,
    marginBottom: 14,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inviteButtonText: {
    color: "#2a9c7a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  inviteButtonIcon: {
    color: "#2a9c7a",
    fontSize: 14,
    fontWeight: "900",
  },
  playerList: {
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 8,
    marginBottom: 16,
    gap: 4,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: 8,
    gap: 11,
  },
  playerAvatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    backgroundColor: "#F0F5ED",
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: {
    color: "#293541",
    fontWeight: "900",
    fontSize: 13,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "800",
  },
  playerState: {
    color: "#718096",
    fontSize: 10,
    marginTop: 3,
    fontWeight: "700",
  },
  readyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
  },
  waitPlayer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: 8,
    gap: 11,
    opacity: 0.6,
  },
  waitAvatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  waitAvatarText: {
    color: "#718096",
    fontSize: 18,
    fontWeight: "900",
  },
  waitTitle: {
    color: "#718096",
    fontSize: 13,
    fontWeight: "800",
  },
  waitSub: {
    color: "#A0AEC0",
    fontSize: 10,
    marginTop: 2,
  },
  ruleCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  ruleIcon: {
    fontSize: 20,
    color: "#2a9c7a",
  },
  ruleTextWrap: {
    flex: 1,
  },
  ruleTitle: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  ruleCopy: {
    color: "#718096",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
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
  disabledButton: {
    opacity: 0.45,
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
