import { describe, it, expect } from "vitest";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "../shared/tr-utils";

describe("Türkçe Karakter Normalizasyonu ve Karşılaştırma Testleri", () => {
  it("standart toLowerCase'in 'I/ı' harfindeki hatasını ve normalizeTr'nin doğruluğunu kanıtlar", () => {
    // Standart JS İngilizceye göre "I" -> "i" yapar, Türkçede ise "I" -> "ı" olmalıdır
    expect("IRMAK".toLowerCase()).toBe("irmak"); // İngilizce i (Türkçede hatalı)
    expect(normalizeTr("IRMAK")).toBe("ırmak"); // Türkçe ı (Doğru)
  });

  it("'İ/i' harflerini büyük/küçük koşulsuz doğru dönüştürür", () => {
    expect(normalizeTr("İSMAİL")).toBe("ismail");
    expect(normalizeTrUpper("ismail")).toBe("İSMAİL");
  });

  it("özel Türkçe karakterleri (ç, ğ, ı, ö, ş, ü) eksiksiz korur", () => {
    expect(normalizeTr("ÇİĞDEM")).toBe("çiğdem");
    expect(normalizeTr("ŞÜKRÜ")).toBe("şükrü");
    expect(normalizeTr("ÖZGÜR")).toBe("özgür");
  });

  it("isEqualTr büyük/küçük ve Türkçe karakter duyarsız kullanıcı adı eşleşmesini doğrular", () => {
    expect(isEqualTr("IRMAK", "ırmak")).toBe(true);
    expect(isEqualTr("İsmail", "İSMAİL")).toBe(true);
    expect(isEqualTr("   ışık  ", "IŞIK")).toBe(true);
    expect(isEqualTr("Ahmet", "ahmet")).toBe(true);
    expect(isEqualTr("Mehmet", "Ahmet")).toBe(false);
  });

  it("boş, null veya tanımsız girdilerde güvenli çalışır", () => {
    expect(normalizeTr("")).toBe("");
    expect(normalizeTr(null)).toBe("");
    expect(normalizeTr(undefined)).toBe("");
    expect(isEqualTr(null, "")).toBe(true);
    expect(isEqualTr(undefined, undefined)).toBe(true);
  });
});
