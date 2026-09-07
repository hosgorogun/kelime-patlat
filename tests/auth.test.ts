import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../server/db";

describe("Custom Credentials Parola Güvenliği", () => {
  it("şifreleri doğru şekilde tuzlar ve hash'ler", () => {
    const rawPassword = "oyuncu_sifre_123";
    const storedHash = hashPassword(rawPassword);
    
    // New format: "iterations:salt:hash" (3 colon-separated parts)
    const parts = storedHash.split(":");
    expect(parts).toHaveLength(3);
    expect(Number(parts[0])).toBeGreaterThanOrEqual(100_000); // strong iteration count
    expect(parts[1]).toHaveLength(32); // 16 bytes = 32 hex chars (salt)
    expect(parts[2]).toHaveLength(128); // 64 bytes = 128 hex chars (hash)
    
    // Verification should succeed with correct password
    expect(verifyPassword(rawPassword, storedHash)).toBe(true);
    
    // Verification should fail with wrong password
    expect(verifyPassword("yanlis_sifre", storedHash)).toBe(false);
  });

  it("Türkçe özel karakterler ve semboller içeren parolaları güvenle hash'ler", () => {
    const rawPassword = "ŞifreÇözümleme!2026_🔑";
    const storedHash = hashPassword(rawPassword);
    
    expect(verifyPassword(rawPassword, storedHash)).toBe(true);
    expect(verifyPassword("SifreCozumleme!2026_🔑", storedHash)).toBe(false);
  });
});
