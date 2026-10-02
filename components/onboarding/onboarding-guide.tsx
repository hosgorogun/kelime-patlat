import React, { useEffect, useState } from "react";
import { Pressable, Text, View, Modal, ScrollView, useWindowDimensions } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { GuideTabKey, GuideSection, GuideBlock } from "./onboarding.types";
import { GUIDE_SECTIONS } from "./onboarding.data";
import { onboardingStyles as styles } from "./onboarding.styles";
import {
  RouteVisual,
  ModesVisual,
  LeaguesVisual,
  RewardsVisual,
  MultipliersVisual,
} from "./onboarding-visuals";

export { GuideTabKey, GuideSection, GuideBlock, GUIDE_SECTIONS };

export function OnboardingGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<GuideTabKey>("basics");

  useEffect(() => {
    if (visible) setActiveTab("basics");
  }, [visible]);

  const currentIndex = GUIDE_SECTIONS.findIndex((s) => s.key === activeTab);
  const currentSection = GUIDE_SECTIONS[currentIndex] || GUIDE_SECTIONS[0]!;

  const handleNext = () => {
    triggerHapticSelection();
    if (currentIndex < GUIDE_SECTIONS.length - 1) {
      setActiveTab(GUIDE_SECTIONS[currentIndex + 1]!.key);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    triggerHapticSelection();
    if (currentIndex > 0) {
      setActiveTab(GUIDE_SECTIONS[currentIndex - 1]!.key);
    }
  };

  const handleSelectTab = (key: GuideTabKey) => {
    triggerHapticSelection();
    setActiveTab(key);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { maxWidth: Math.min(width - 24, 480) }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={styles.headerKickerRow}>
                <Text style={[styles.badgeText, { color: currentSection.color }]}>{currentSection.badge}</Text>
                <View style={[styles.sectionPill, { borderColor: currentSection.color }]}>
                  <Text style={[styles.sectionPillText, { color: currentSection.color }]}>
                    {currentIndex + 1} / {GUIDE_SECTIONS.length}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>SİBER OYUN KILAVUZU & REHBER</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Category Chips Selector */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {GUIDE_SECTIONS.map((sec) => {
                const isActive = sec.key === activeTab;
                return (
                  <Pressable
                    key={sec.key}
                    onPress={() => handleSelectTab(sec.key)}
                    style={[
                      styles.tabChip,
                      isActive && [styles.tabChipActive, { borderColor: sec.color, backgroundColor: `${sec.color}22` }],
                    ]}
                  >
                    <Text style={styles.tabChipIcon}>{sec.icon}</Text>
                    <Text style={[styles.tabChipText, isActive && { color: sec.color, fontWeight: "900" }]}>
                      {sec.tabLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Content Area */}
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Title Banner */}
            <View style={[styles.bannerCard, { borderColor: `${currentSection.color}55` }]}>
              <View style={[styles.iconCircle, { borderColor: currentSection.color, backgroundColor: `${currentSection.color}15` }]}>
                <Text style={styles.bannerIcon}>{currentSection.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionHeading, { color: currentSection.color }]}>{currentSection.title}</Text>
                <Text style={styles.sectionDescription}>{currentSection.description}</Text>
              </View>
            </View>

            {/* Visual Examples */}
            {currentSection.customVisual === "route" && <RouteVisual />}
            {currentSection.customVisual === "modes" && <ModesVisual />}
            {currentSection.customVisual === "leagues" && <LeaguesVisual />}
            {currentSection.customVisual === "rewards" && <RewardsVisual />}
            {currentSection.customVisual === "multipliers" && <MultipliersVisual />}

            {/* Structured Topic Blocks */}
            <View style={styles.blocksList}>
              {currentSection.blocks.map((block, idx) => (
                <View key={idx} style={styles.blockCard}>
                  <View style={styles.blockHead}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    {block.tag && (
                      <View style={[styles.blockTag, { borderColor: block.tagColor || currentSection.color, backgroundColor: `${block.tagColor || currentSection.color}20` }]}>
                        <Text style={[styles.blockTagText, { color: block.tagColor || currentSection.color }]}>{block.tag}</Text>
                      </View>
                    )}
                  </View>
                  {block.details.map((detail, dIdx) => (
                    <View key={dIdx} style={styles.detailRow}>
                      <Text style={[styles.detailBullet, { color: currentSection.color }]}>▪</Text>
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Navigation & Action Footer */}
          <View style={styles.footer}>
            <View style={styles.indicatorRow}>
              {GUIDE_SECTIONS.map((sec, idx) => (
                <Pressable key={sec.key} onPress={() => handleSelectTab(sec.key)}>
                  <View
                    style={[
                      styles.dot,
                      idx === currentIndex && [styles.dotActive, { backgroundColor: currentSection.color }],
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.footerButtonsRow}>
              {currentIndex > 0 ? (
                <Pressable onPress={handlePrev} style={styles.prevBtn}>
                  <Text style={styles.prevBtnText}>← ÖNCEKİ</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {currentIndex < GUIDE_SECTIONS.length - 1 ? (
                <Pressable onPress={handleNext} style={[styles.nextBtn, { backgroundColor: currentSection.color }]}>
                  <Text style={[styles.nextBtnText, { color: "#293541" }]}>
                    SONRAKİ BÖLÜM →
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={onClose} style={[styles.nextBtn, styles.finishBtn]}>
                  <Text style={styles.finishBtnText}>ANLADIM, OYUNA DÖN 🚀</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
