import React from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import {
  THEME_PACKS,
  type PlayerProgress,
  type GenderType,
  type ThemePackId,
} from "@/shared/progression";
import { triggerHapticError, triggerHapticSelection } from "@/shared/audio-haptics";
import { styles } from "./profile.styles";

export type ProfileSettingsTabProps = {
  sfxOn: boolean;
  toggleSfx: (val: boolean) => void;
  hapticsOn: boolean;
  toggleHaptics: (val: boolean) => void;
  progress: PlayerProgress;
  onUpdateGender?: (gender: GenderType) => void;
  onSelectTheme?: (theme: ThemePackId) => void;
  isGuest?: boolean;
  onOpenAuth?: () => void;
  onOpenLogoutModal: () => void;
  onOpenDeleteModal: () => void;
  onOpenPrivacyModal: () => void;
  hasDeleteAccount: boolean;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
};

export const ProfileSettingsTab = React.memo(({
  sfxOn,
  toggleSfx,
  hapticsOn,
  toggleHaptics,
  progress,
  onUpdateGender,
  onSelectTheme,
  isGuest,
  onOpenAuth,
  onOpenLogoutModal,
  onOpenDeleteModal,
  onOpenPrivacyModal,
  hasDeleteAccount,
  onShowToast,
}: ProfileSettingsTabProps) => {
  return (
    <>
      {/* 8. AYARLAR & SİSTEM KONTROLLERİ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚙️ SES VE GERİ BİLDİRİM</Text>
        <Text style={styles.sectionMeta}>TERCİHLER</Text>
      </View>

      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <View style={[styles.settingIconCircle, { backgroundColor: "rgba(62, 232, 181, 0.12)" }]}>
              <Text style={styles.settingRowIcon}>🔊</Text>
            </View>
            <View>
              <Text style={styles.settingLabel}>SES EFEKTLERİ</Text>
              <Text style={styles.settingSubLabel}>Patlama, eşleşme ve zafer sesleri</Text>
            </View>
          </View>
          <Switch
            value={sfxOn}
            onValueChange={(val) => {
              triggerHapticSelection();
              toggleSfx(val);
            }}
            trackColor={{ false: "#EDF4FC", true: "#3EE8B5" }}
            thumbColor="#FFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingLabelWrap}>
            <View style={[styles.settingIconCircle, { backgroundColor: "rgba(167, 139, 250, 0.12)" }]}>
              <Text style={styles.settingRowIcon}>📳</Text>
            </View>
            <View>
              <Text style={styles.settingLabel}>HAPTİK TİTREŞİM</Text>
              <Text style={styles.settingSubLabel}>Dokunma ve patlama titreşim tepkileri</Text>
            </View>
          </View>
          <Switch
            value={hapticsOn}
            onValueChange={(val) => {
              triggerHapticSelection();
              toggleHaptics(val);
            }}
            trackColor={{ false: "#EDF4FC", true: "#3EE8B5" }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* Cinsiyet ve Hitap Tercihi */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>👤 HİTAP VE KİMLİK</Text>
        <Text style={styles.sectionMeta}>PROFİL TERCİHİ</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.genderTitle}>OYUN İÇİ HİTAP ŞEKLİ</Text>
        <Text style={styles.genderSub}>Profilinizde ve zafer duyurularında kullanılacak hitap tarzı</Text>

        <View style={styles.genderRow}>
          {[
            { id: "unspecified", label: "Belirtilmemiş", icon: "🌐" },
            { id: "male", label: "Erkek", icon: "♂️" },
            { id: "female", label: "Kadın", icon: "♀️" },
          ].map((item) => {
            const isSelected = (progress.gender || "unspecified") === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  triggerHapticSelection();
                  onUpdateGender?.(item.id as GenderType);
                  if (onShowToast) {
                    onShowToast("HİTAP GÜNCELLENDİ", `Hitap tercihi "${item.label}" olarak belirlendi.`, item.icon, "#3EE8B5");
                  }
                }}
                style={[styles.genderPill, isSelected && styles.genderPillSelected]}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>{item.icon}</Text>
                <Text style={[styles.genderPillText, isSelected && styles.genderPillTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Hızlı Tema Tercihi */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>🎨 OYUN TEMASI</Text>
        <Text style={styles.sectionMeta}>GÖRSEL TEMA</Text>
      </View>

      <View style={styles.settingsCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {THEME_PACKS.map((theme) => {
            const isSelected = (progress.selectedTheme || "classic") === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => {
                  triggerHapticSelection();
                  onSelectTheme?.(theme.id as ThemePackId);
                  if (onShowToast) {
                    onShowToast("TEMA GÜNCELLENDİ", `"${theme.label}" teması kuşanıldı.`, "🎨", "#3EE8B5");
                  }
                }}
                style={[styles.themePill, isSelected && styles.themePillSelected]}
              >
                <Text style={[styles.themePillText, isSelected && styles.themePillTextSelected]}>
                  {theme.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sistem Bilgisi */}
      <View style={styles.appInfoCard}>
        <Text style={styles.appInfoTitle}>KELİME PATLAT CYBER EDITION</Text>
        <Text style={styles.appInfoSub}>Versiyon 1.0.0 · Build 2026.09 · Çevrim İçi Motor Etkin</Text>
      </View>

      {/* Danger Zone & Account Management */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>🛡️ HESAP VE GÜVENLİK</Text>
        <Text style={[styles.sectionMeta, { color: "#bf5757" }]}>GÜVENLİ BÖLGE</Text>
      </View>

      <View style={styles.dangerZoneCard}>
        {isGuest ? (
          <View
            style={{
              backgroundColor: "#FFF8E7",
              borderColor: "#EDCD8A",
              borderWidth: 1.5,
              borderRadius: 16,
              padding: 14,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>⭐</Text>
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#293541", textAlign: "center" }}>
              MİSAFİR HESABI KULLANIYORSUN
            </Text>
            <Text style={{ fontSize: 11, color: "#626F73", textAlign: "center", marginVertical: 6, lineHeight: 15 }}>
              İlerlemeni kalıcı olarak buluta yedeklemek ve skor tablosuna adını yazdırmak için ücretsiz hesabını oluştur veya giriş yap!
            </Text>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                if (onOpenAuth) onOpenAuth();
              }}
              style={({ pressed }) => [
                styles.actionButtonSecondary,
                { backgroundColor: "#FFD66E", borderColor: "#D48B00", width: "100%", marginTop: 4 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.actionBtnSecondaryText, { color: "#293541" }]}>HESABINI BAĞLA / GİRİŞ YAP ➔</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              triggerHapticError();
              onOpenLogoutModal();
            }}
            style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.actionBtnIcon}>🚪</Text>
            <Text style={styles.actionBtnSecondaryText}>HESAPTAN ÇIKIŞ YAP</Text>
          </Pressable>
        )}

        {hasDeleteAccount && (
          <Pressable
            onPress={() => {
              triggerHapticError();
              onOpenDeleteModal();
            }}
            style={({ pressed }) => [styles.actionButtonDanger, pressed && styles.pressed]}
          >
            <Text style={styles.actionBtnIcon}>🗑️</Text>
            <Text style={styles.actionBtnDangerText}>HESABIMI KALICI OLARAK SİL</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={onOpenPrivacyModal} style={styles.privacyBtn}>
        <Text style={styles.privacyBtnText}>🔒 GİZLİLİK POLİTİKASI (PRIVACY POLICY)</Text>
      </Pressable>
    </>
  );
});

ProfileSettingsTab.displayName = "ProfileSettingsTab";
