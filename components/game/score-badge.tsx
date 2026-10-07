import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AVATARS } from "@/shared/progression";
import { PROFILE_FRAMES } from "@/shared/store-items";
import { normalizeTr } from "@/shared/tr-utils";

export interface ScoreBadgeProps {
  name: string;
  score: number;
  words: number;
  total: number;
  active: boolean;
  won: boolean;
  accent: string;
  combo?: number;
  avatar?: string;
  avatarPhoto?: string;
  selectedFrame?: string;
  onPress?: () => void;
}

export function ScoreBadge({
  name,
  score,
  words,
  total,
  active,
  won,
  accent,
  combo,
  avatar,
  avatarPhoto,
  selectedFrame,
  onPress,
}: ScoreBadgeProps) {
  const activeAvatarObj = AVATARS.find((a) => a.id === avatar);
  const displayIcon = activeAvatarObj
    ? activeAvatarObj.icon
    : (avatar && avatar.length <= 3
        ? avatar
        : (normalizeTr(name).includes("bot") ? "🤖" : "👤"));
  const frameColor = PROFILE_FRAMES.find(([fId]) => fId === selectedFrame)?.[2];
  const avatarBorderColor = frameColor || (activeAvatarObj ? activeAvatarObj.color : accent);
  const avatarBgColor = activeAvatarObj ? activeAvatarObj.surface : `${accent}25`;
  const [imgError, setImgError] = useState(false);

  const scoreScale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      if (score > prevScore.current) {
        Animated.sequence([
          Animated.timing(scoreScale, { toValue: 1.25, duration: 110, useNativeDriver: true }),
          Animated.spring(scoreScale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
        ]).start();
      }
      prevScore.current = score;
    }
  }, [score, scoreScale]);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1 }, onPress && pressed && styles.pressed]}
    >
      <View
        style={[
          styles.scoreBadge,
          { width: "100%", minHeight: 88, paddingVertical: 6 },
          won && {
            borderColor: accent,
            shadowColor: accent,
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            marginBottom: 4,
          }}
        >
          {/* Profil Fotoğrafı / Avatar Dairesi */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: avatarBgColor,
              borderWidth: 1.5,
              borderColor: avatarBorderColor,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {avatarPhoto && !imgError ? (
              <Image
                source={{ uri: avatarPhoto }}
                style={{ width: "100%", height: "100%", borderRadius: 18, resizeMode: "cover" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <Text
                style={{
                  fontSize: 17,
                  color: activeAvatarObj ? activeAvatarObj.color : "#293541",
                  fontWeight: "900",
                }}
              >
                {displayIcon}
              </Text>
            )}
          </View>

          <View style={{ justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text numberOfLines={1} style={[styles.scoreName, { flexShrink: 1 }]}>
                {name}
              </Text>
              {combo && combo >= 2 ? (
                <Text style={{ fontSize: 9, fontWeight: "900", color: "#a96741" }}>
                  🔥x{combo}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.scoreStatus, won && { color: accent }]}>
              {words} / {total} KELİME
            </Text>
          </View>
        </View>

        <Animated.Text
          style={[
            styles.scoreValue,
            active && { color: accent },
            { textAlign: "center", marginTop: 0, transform: [{ scale: scoreScale }] },
          ]}
        >
          {score}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scoreBadge: {
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  scoreName: {
    color: "#293541",
    maxWidth: 105,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  scoreValue: {
    color: "#293541",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  scoreStatus: {
    color: "#293541",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
