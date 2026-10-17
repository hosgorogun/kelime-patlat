import React from "react";
import { Alert, Linking, View, Text, Pressable, Modal, TextInput } from "react-native";
import { isEqualTr } from "@/shared/tr-utils";
import { styles } from "./profile.styles";

export type ProfileLogoutModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onConfirmLogout: () => void;
};

export const ProfileLogoutModal = React.memo(({
  visible,
  onDismiss,
  onConfirmLogout,
}: ProfileLogoutModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.deleteModalOverlay} onPress={onDismiss}>
        <Pressable style={[styles.deleteModalCard, { borderColor: "#DCE1D7" }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalIconTopWrap}>
            <Text style={styles.modalIconTop}>🚪</Text>
          </View>
          <Text style={[styles.deleteModalTitle, { color: "#293541" }]}>HESAP ÇIKIŞI</Text>
          <Text style={styles.deleteModalDesc}>
            Hesabınızdan çıkış yapmak ve oturumu sıfırlamak istediğinize emin misiniz? Tekrar giriş yaparak verilerinize erişebilirsiniz.
          </Text>
          <View style={styles.deleteModalActions}>
            <Pressable onPress={onDismiss} style={styles.deleteModalCancelBtn}>
              <Text style={styles.deleteModalCancelText}>VAZGEÇ</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onDismiss();
                onConfirmLogout();
              }}
              style={[styles.deleteModalConfirmBtn, { backgroundColor: "#e8d8a4" }]}
            >
              <Text style={[styles.deleteModalConfirmText, { color: "#293541" }]}>ÇIKIŞ YAP</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

ProfileLogoutModal.displayName = "ProfileLogoutModal";

export type ProfileDeleteModalProps = {
  visible: boolean;
  deleteConfirmInput: string;
  setDeleteConfirmInput: (val: string) => void;
  onDismiss: () => void;
  onConfirmDelete: () => void;
};

export const ProfileDeleteModal = React.memo(({
  visible,
  deleteConfirmInput,
  setDeleteConfirmInput,
  onDismiss,
  onConfirmDelete,
}: ProfileDeleteModalProps) => {
  const isSilValid = isEqualTr(deleteConfirmInput.trim(), "SİL") || isEqualTr(deleteConfirmInput.trim(), "SIL");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModalCard}>
          <View style={[styles.modalIconTopWrap, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#DCE1D7" }]}>
            <Text style={styles.modalIconTop}>🚨</Text>
          </View>
          <Text style={styles.deleteModalTitle}>HESAP SİLME İŞLEMİ</Text>
          <Text style={styles.deleteModalDesc}>
            Hesabınız ve tüm kayıtlı ilerlemeniz (XP, Çip, Seviye, Başarılar) kalıcı olarak silinecektir. Bu işlem{" "}
            <Text style={{ fontWeight: "900", color: "#ed4343" }}>GERİ ALINAMAZ</Text>.
          </Text>
          <Text style={styles.deleteModalPrompt}>
            Onaylamak için aşağıya büyük harflerle{" "}
            <Text style={{ fontWeight: "900", color: "#ed4343" }}>SİL</Text> yazın:
          </Text>
          <TextInput
            value={deleteConfirmInput}
            onChangeText={setDeleteConfirmInput}
            placeholder="SİL"
            placeholderTextColor="rgba(237, 67, 67, 0.4)"
            autoCapitalize="characters"
            style={styles.deleteModalInput}
          />
          <View style={styles.deleteModalActions}>
            <Pressable onPress={onDismiss} style={styles.deleteModalCancelBtn}>
              <Text style={styles.deleteModalCancelText}>VAZGEÇ</Text>
            </Pressable>
            <Pressable
              disabled={!isSilValid}
              onPress={() => {
                if (isSilValid) {
                  onDismiss();
                  onConfirmDelete();
                }
              }}
              style={[
                styles.deleteModalConfirmBtn,
                !isSilValid && styles.deleteModalConfirmDisabled,
              ]}
            >
              <Text style={styles.deleteModalConfirmText}>EVET, SİL</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

ProfileDeleteModal.displayName = "ProfileDeleteModal";

export type ProfilePrivacyModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export const ProfilePrivacyModal = React.memo(({
  visible,
  onDismiss,
}: ProfilePrivacyModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.deleteModalOverlay} onPress={onDismiss}>
        <Pressable style={[styles.deleteModalCard, { borderColor: "#DCE1D7" }]} onPress={(e) => e.stopPropagation()}>
          <Text style={{ fontSize: 36, marginBottom: 6 }}>🔒</Text>
          <Text style={[styles.deleteModalTitle, { color: "#2a9c7a" }]}>GİZLİLİK POLİTİKASI</Text>
          <Text style={[styles.deleteModalDesc, { color: "#293541", lineHeight: 20 }]}>
            Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız, takma adınız ve maç ilerlemeniz yalnızca çok oyunculu sıralama ve cihazlar arası senkronizasyon için saklanır.
            {"\n\n"}
            Kişisel verileriniz asla 3. taraflarla paylaşılmaz veya satılmaz. Dilediğiniz zaman ayarlar menüsünden hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz.
            {"\n\n"}
            İletişim & Destek: destek@kelimepatlat.app
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <Pressable
              onPress={() => {
                const targetUrl = process.env.EXPO_PUBLIC_API_BASE_URL
                  ? `${process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/privacy-policy`
                  : "https://kelime-patlat.onrender.com/privacy-policy";
                Linking.openURL(targetUrl).catch(() => {
                  Alert.alert("Bağlantı", `Gizlilik politikası sayfasına ${targetUrl} adresinden ulaşabilirsiniz.`);
                });
              }}
              style={[styles.deleteModalCancelBtn, { flex: 1, backgroundColor: "#E9EDE7", borderColor: "#DCE1D7" }]}
            >
              <Text style={[styles.deleteModalCancelText, { color: "#293541", fontSize: 12 }]}>🌐 WEB SAYFASI</Text>
            </Pressable>
            <Pressable
              onPress={onDismiss}
              style={[styles.deleteModalCancelBtn, { flex: 1, backgroundColor: "#aef5e0", borderColor: "#DCE1D7" }]}
            >
              <Text style={[styles.deleteModalCancelText, { color: "#293541", fontWeight: "900", fontSize: 12 }]}>ANLADIM</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

ProfilePrivacyModal.displayName = "ProfilePrivacyModal";
