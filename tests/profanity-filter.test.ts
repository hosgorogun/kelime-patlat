import { describe, it, expect } from "vitest";
import { containsProfanity, cleanProfanity } from "../shared/profanity-filter";

describe("Turkish Profanity & Slang Filter (containsProfanity)", () => {
  it("should catch direct profanity in standard Turkish", () => {
    expect(containsProfanity("orospu")).toBe(true);
    expect(containsProfanity("piç")).toBe(true);
    expect(containsProfanity("sikik")).toBe(true);
    expect(containsProfanity("yarrak")).toBe(true);
    expect(containsProfanity("pezevenk")).toBe(true);
    expect(containsProfanity("gavat")).toBe(true);
  });

  it("should catch leetspeak and punctuation obfuscations", () => {
    expect(containsProfanity("0r0spu")).toBe(true);
    expect(containsProfanity("s.i.k.i.k")).toBe(true);
    expect(containsProfanity("p-i-ç")).toBe(true);
    expect(containsProfanity("y@rr@k")).toBe(true);
    expect(containsProfanity("a.m.k")).toBe(true);
    expect(containsProfanity("amk")).toBe(true);
  });

  it("should NOT flag innocent Turkish words (false positive protection)", () => {
    expect(containsProfanity("pamuk")).toBe(false);
    expect(containsProfanity("kamusal")).toBe(false);
    expect(containsProfanity("bostan")).toBe(false);
    expect(containsProfanity("kestane")).toBe(false);
    expect(containsProfanity("samuray")).toBe(false);
    expect(containsProfanity("ahmet123")).toBe(false);
    expect(containsProfanity("kelime_ustasi")).toBe(false);
    expect(containsProfanity("zeynep")).toBe(false);
  });

  it("should clean profanity properly", () => {
    const cleaned = cleanProfanity("sen bir orospu musun");
    expect(cleaned).not.toContain("orospu");
    expect(cleaned).toContain("******");
  });
});
