import React from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
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
      onRequestClose={onDismiss}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={[styles.deleteModalCard, { borderColor: "#DCE1D7" }]}>
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
        </View>
      </View>
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
            placeholderTextColor="#ed4343"
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
      onRequestClose={onDismiss}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={[styles.deleteModalCard, { borderColor: "#DCE1D7" }]}>
          <Text style={{ fontSize: 40, marginBottom: 6 }}>🔒</Text>
          <Text style={[styles.deleteModalTitle, { color: "#2a9c7a" }]}>GİZLİLİK POLİTİKASI</Text>
          <Text style={[styles.deleteModalDesc, { color: "#293541", lineHeight: 20 }]}>
            Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız ve maç ilerlemeniz yalnızca sıralama ve senkronizasyon için saklanır.
            {"\n\n"}
            İletişim: destek@kelimepatlat.app
          </Text>
          <Pressable
            onPress={onDismiss}
            style={[styles.deleteModalCancelBtn, { backgroundColor: "#aef5e0", borderColor: "#DCE1D7", marginTop: 12 }]}
          >
            <Text style={[styles.deleteModalCancelText, { color: "#293541", fontWeight: "900" }]}>ANLADIM</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

ProfilePrivacyModal.displayName = "ProfilePrivacyModal";
