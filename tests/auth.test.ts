import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../server/db";

describe("Custom Credentials Parola Güvenliği", () => {
  it("şifreleri doğru şekilde tuzlar ve hash'ler", () => {
    const rawPassword = "oyuncu_sifre_123";
    const storedHash = hashPassword(rawPassword);
    
    // Hash format should contain salt and digest separated by colon
    expect(storedHash).toContain(":");
    expect(storedHash.split(":")[0]).toHaveLength(32); // 16 bytes = 32 hex chars
    
    // Verification should succeed with correct password
    expect(verifyPassword(rawPassword, storedHash)).toBe(true);
    
    // Verification should fail with wrong password
    expect(verifyPassword("yanlis_sifre", storedHash)).toBe(false);
  });
});
