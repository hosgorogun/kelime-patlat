import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PROGRESS } from "@/shared/progression";

// Profile, Store, Shell & Common Components
import { StoreEquipmentTab } from "@/components/store/store-equipment-tab";
import { ProfileHeroCard } from "@/components/profile/profile-hero-card";
import { ProfileStatsGrid } from "@/components/profile/profile-stats-grid";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { MainShell } from "@/components/shell/main-shell";
import { PremiumDock } from "@/components/common/premium-dock";
import { OnboardingGuide } from "@/components/onboarding/onboarding-guide";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { GlobalGameToast } from "@/components/common/global-game-toast";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CommandInfoModal } from "@/components/command/command-info-modal";
import { GoogleLogo, AppleLogo } from "@/components/common/brand-logos";

describe("Component Tests: Profile, Store, Shell & Common Views", () => {
  describe("StoreEquipmentTab", () => {
    it("ekipman başlığını ve reklam sponsor bannerını render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(StoreEquipmentTab, {
          progress: DEFAULT_PROGRESS,
          coins: 100,
          remainingAds: 3,
          dailyAdLimit: 3,
          adLoading: false,
          onWatchAd: vi.fn(),
          onSpendChips: vi.fn(),
        })
      );
      expect(html).toContain("ÇİPLERİNLE ALABİLECEĞİN EKİPMANLAR");
      expect(html).toContain("Sponsorlu Reklam İle Çip Kazan");
      expect(html).toContain("3/3 HAK");
    });
  });

  describe("ProfileHeroCard & ProfileStatsGrid", () => {
    it("ProfileHeroCard oyuncu adı ve seviye bilgisini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileHeroCard, {
          safeName: "Usta_Kelimeci",
          activeAvatar: { id: "avatar_01", label: "Gezgin", icon: "🧭" } as any,
          currentFrameId: "frame_01",
          activeFrameColor: "#2a9c7a",
          progress: DEFAULT_PROGRESS,
          imgError: false,
          setImgError: vi.fn(),
          isEditingName: false,
          setIsEditingName: vi.fn(),
          nameInput: "Usta_Kelimeci",
          setNameInput: vi.fn(),
          handleSaveName: vi.fn(),
          handlePickPhoto: vi.fn(),
          handleResetToGlyph: vi.fn(),
          currentLevel: 5,
          currentLevelXp: 150,
          nextLevelXp: 300,
          progressRatio: 0.5,
          activeTitle: "ROTA USTASI",
          currentLeague: { tier: "ALTIN", color: "#F0C855", name: "Altın Ligi" } as any,
        })
      );
      expect(html).toContain("Usta_Kelimeci");
      expect(html).toContain("5");
      expect(html).toContain("ROTA USTASI");
    });

    it("ProfileStatsGrid maç ve kelime istatistiklerini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileStatsGrid, {
          progress: { ...DEFAULT_PROGRESS, wins: 18 },
          totalMatches: 24,
          winRate: 75,
          wordPoolCount: 120,
          longestWord: "MUVAFFAKİYET",
        })
      );
      expect(html).toContain("18");
      expect(html).toContain("24");
      expect(html).toContain("%75");
      expect(html).toContain("120");
      expect(html).toContain("MUVAFFAKİYET");
    });
  });

  describe("ProfileScreen", () => {
    it("profil ekranında Lügat Müzesi bannerını ve sekmeleri göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(ProfileScreen, {
          playerName: "DenemeOyuncu",
          onUpdatePlayerName: vi.fn(),
          progress: {
            ...DEFAULT_PROGRESS,
            discoveredWords: ["KİTAP", "DEFTER"],
          },
          sfxOn: true,
          toggleSfx: vi.fn(),
          hapticsOn: true,
          toggleHaptics: vi.fn(),
          onBack: vi.fn(),
          isGuest: false,
          onOpenAuth: vi.fn(),
          onLogout: vi.fn(),
          onDeleteAccount: vi.fn(),
        })
      );
      expect(html).toContain("DenemeOyuncu");
      expect(html).toContain("LÜGAT MÜZESİ &amp; DEFTERİ");
      expect(html).toContain("Genel bakış");
      expect(html).toContain("Ayarlar");
    });
  });

  describe("MainShell & PremiumDock", () => {
    it("MainShell içeriği ve dock menüsünü render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          MainShell,
          {
            active: "home",
            onNavigate: vi.fn(),
            children: React.createElement("div", null, "Ana Ekran İçeriği"),
          }
        )
      );
      expect(html).toContain("Ana Ekran İçeriği");
      expect(html).toContain("Mağaza");
      expect(html).toContain("Görevler");
      expect(html).toContain("Oyna");
      expect(html).toContain("Lig");
      expect(html).toContain("Profil");
    });
  });

  describe("PremiumDock", () => {
    it("tüm tab butonlarını ve erişilebilirlik etiketlerini içermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(PremiumDock, {
          active: "season",
          onNavigate: vi.fn(),
          missionsBadgeCount: 2,
          storeBadgeCount: 1,
        })
      );
      expect(html).toContain("Mağaza");
      expect(html).toContain("Lig");
      expect(html).toContain("tablist");
    });
  });

  describe("OnboardingGuide", () => {
    it("visible false iken hiçbir şey render etmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(OnboardingGuide, {
          visible: false,
          onClose: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("visible true iken rehber adımlarını ve ileri butonunu göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(OnboardingGuide, {
          visible: true,
          onClose: vi.fn(),
        })
      );
      expect(html).toContain("SİBER OYUN KILAVUZU");
      expect(html).toContain("SONRAKİ BÖLÜM");
    });
  });

  describe("ErrorBoundary", () => {
    it("hata olmadığında alt bileşenleri sorunsuz render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement("span", null, "Sorunsuz Bileşen")
        )
      );
      expect(html).toContain("Sorunsuz Bileşen");
    });

    it("hata durumunda kurtarma ekranını ve yeniden başlat butonunu göstermelidir", () => {
      const boundary = new ErrorBoundary({ children: null });
      boundary.state = { hasError: true, error: new Error("Test Crash") };

      const html = renderToStaticMarkup(boundary.render());
      expect(html).toContain("SİBER SİSTEM KORUMASI");
      expect(html).toContain("BİR AKSAMA OLUŞTU");
      expect(html).toContain("YENİDEN BAŞLAT");
    });
  });

  describe("GlobalGameToast", () => {
    it("toast null iken render edilmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(GlobalGameToast, {
          toast: null,
          onDismiss: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("toast verisi varken başlık ve alt başlığı göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(GlobalGameToast, {
          toast: {
            id: "t1",
            title: "Seviye Atladın!",
            subtitle: "+50 Çip Kazandın",
            icon: "⭐",
            accentColor: "#F59E0B",
          },
          onDismiss: vi.fn(),
        })
      );
      expect(html).toContain("Seviye Atladın!");
      expect(html).toContain("+50 Çip Kazandın");
      expect(html).toContain("⭐");
    });
  });

  describe("AuthScreen", () => {
    it("marka başlığını ve Giriş Yap / Kayıt Ol sekmelerini render etmelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(AuthScreen, {
          onSuccess: vi.fn(),
          onCancel: vi.fn(),
        })
      );
      expect(html).toContain("KELİME PATLAT");
      expect(html).toContain("Giriş Yap");
      expect(html).toContain("Kayıt Ol");
    });
  });

  describe("CommandInfoModal", () => {
    it("infoModal null iken render edilmemelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CommandInfoModal, {
          infoModal: null,
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          livesCalc: { lives: 5 },
          league: { tier: "ALTIN" } as any,
          mystery: { word: "TEST", definition: "Açıklama", rewardXp: 50 },
          onNavigate: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("shield tipinde seri kalkanı bilgilendirmesini göstermelidir", () => {
      const html = renderToStaticMarkup(
        React.createElement(CommandInfoModal, {
          infoModal: "shield",
          onClose: vi.fn(),
          progress: DEFAULT_PROGRESS,
          livesCalc: { lives: 5 },
          league: { tier: "ALTIN" } as any,
          mystery: { word: "TEST", definition: "Açıklama", rewardXp: 50 },
          onNavigate: vi.fn(),
        })
      );
      expect(html).toContain("SAVUNMA YÜZÜĞÜ");
      expect(html).toContain("Seri Kalkanı");
    });
  });

  describe("BrandLogos", () => {
    it("GoogleLogo ve AppleLogo bileşenlerini hatasız render etmelidir", () => {
      const googleHtml = renderToStaticMarkup(React.createElement(GoogleLogo, { size: 28 }));
      expect(googleHtml).toBeDefined();

      const appleHtml = renderToStaticMarkup(React.createElement(AppleLogo, { size: 28 }));
      expect(appleHtml).toBeDefined();
    });
  });
});
