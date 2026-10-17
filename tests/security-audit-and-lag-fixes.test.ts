import { describe, it, expect, vi } from "vitest";
import { getGameSocket } from "../lib/game-socket";

vi.unmock("@/lib/game-socket");
vi.unmock("../lib/game-socket");

// Mock socket.io-client to inspect connection behavior
vi.mock("socket.io-client", () => {
  const fakeSocket = {
    connected: false,
    disconnected: false, // In connecting state
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  return {
    io: vi.fn(() => fakeSocket),
  };
});

describe("Deep Security & Lag Fixes Audit", () => {
  describe("1. Socket Handshake & Connection Thrashing (Lag Elimination)", () => {
    it("should NOT repeatedly invoke .connect() if socket is already created and connecting", () => {
      const sock1 = getGameSocket();
      const initialConnectCalls = (sock1.connect as any).mock.calls.length;

      // Call getGameSocket multiple times (simulating rapid UI renders/submits)
      getGameSocket();
      getGameSocket();
      getGameSocket();

      // Because socket is already in-flight (not explicitly disconnected), connect should not be thrashed
      expect((sock1.connect as any).mock.calls.length).toBe(initialConnectCalls);
    });
  });

  describe("2. Turn Match Authorization Security Verification", () => {
    it("should reject tampered or invalid bearer authorization", async () => {
      const { turnMatchRouter } = await import("../server/routes/turn-match.routes");

      // Find the /create handler in the router stack
      const createLayer = turnMatchRouter.stack.find((s: any) => s.route?.path === "/create" && s.route?.methods?.post) as any;
      expect(createLayer).toBeDefined();

      const handler = createLayer.route.stack[0].handle;

      const mockReq: any = {
        headers: {
          authorization: "Bearer invalid_malformed_token",
        },
        body: {
          player1Id: "player_alice",
          player1Name: "Alice",
          player2Id: "player_bob",
          player2Name: "Bob",
          size: 4,
        },
      };

      let statusSent = 0;
      let bodySent: any = null;

      const mockRes: any = {
        status: (s: number) => {
          statusSent = s;
          return mockRes;
        },
        json: (b: any) => {
          bodySent = b;
          return mockRes;
        },
      };

      await (handler as any)(mockReq, mockRes, () => {});

      expect(statusSent).toBe(401);
      expect(bodySent?.error).toContain("Geçersiz");
    });
  });
});
