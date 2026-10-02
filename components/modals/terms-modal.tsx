import React from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { haptics } from "@/lib/haptics";

export function TermsModal({
  visible,
  onAccept,
}: {
  visible: boolean;
  onAccept: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAccept}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>📜</Text>
          <Text style={styles.title}>HOŞ GELDİNİZ!</Text>
          <Text style={styles.subtitle}>KULLANIM ŞARTLARI VE GİZLİLİK ONAYI</Text>

          <ScrollView style={{ maxHeight: 220, marginVertical: 8 }} contentContainerStyle={{ paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              Kelime Patlat dünyasına katılmadan önce lütfen kullanım şartlarımızı ve gizlilik politikamızı inceleyin.
              {"\n\n"}
              • İlerlemeniz ve skorlarınız güvende tutulur.{"\n"}
              • Oyun içi çipleriniz ve profil özelleştirmeleriniz hesabınıza tanımlanır.{"\n"}
              • İstediğiniz an Profil sayfasından hesabınızı kalıcı olarak silebilirsiniz.
            </Text>
          </ScrollView>

          <View style={styles.linksRow}>
            <Pressable
              onPress={() => {
                haptics.light();
                Alert.alert(
                  "🔒 GİZLİLİK POLİTİKASI",
                  "Kelime Patlat, kullanıcı verilerini en yüksek güvenlik standartlarında korur. Hesabınız ve maç ilerlemeniz yalnızca sıralama ve senkronizasyon için saklanır.\n\nİletişim: destek@kelimepatlat.app",
                  [{ text: "TAMAM" }]
                );
              }}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>GİZLİLİK POLİTİKASI</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              haptics.success();
              onAccept();
            }}
            style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
          >
            <Text style={styles.acceptText}>KABUL ET VE BAŞLA →</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 22,
    alignItems: "center",
  },
  icon: {
    fontSize: 36,
    marginBottom: 6,
  },
  title: {
    color: "#293541",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#2a9c7a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 12,
  },
  body: {
    color: "#293541",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  linksRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  linkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  linkText: {
    color: "#8c7540",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  acceptBtn: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    backgroundColor: "#aef5e0",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
