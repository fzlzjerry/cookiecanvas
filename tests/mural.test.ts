import { describe, expect, it } from "vitest";
import { BOARD_SIZE } from "../src/config";
import {
  activityBuckets,
  buildMural,
  colorDistribution,
  pixelIndex,
  type PaintEvent,
} from "../src/lib/mural";

function event(overrides: Partial<PaintEvent> = {}): PaintEvent {
  return {
    x: 2,
    y: 3,
    color: "#ED9229",
    alias: "Painter",
    note: "",
    signature: "signature-a",
    painter: "wallet-a",
    timestamp: 1_000,
    slot: 10,
    confirmationStatus: "confirmed",
    ...overrides,
  };
}

describe("mural reconstruction", () => {
  it("starts from a complete immutable genesis mural", () => {
    const board = buildMural([]);
    expect(board).toHaveLength(BOARD_SIZE * BOARD_SIZE);
    expect(board.every((pixel) => pixel.isGenesis)).toBe(true);
  });

  it("applies events by chain order even when RPC returns newest first", () => {
    const newest = event({ slot: 12, signature: "new", color: "#3975B8" });
    const oldest = event({ slot: 11, signature: "old", color: "#D75344" });
    const board = buildMural([newest, oldest]);
    const pixel = board[pixelIndex(2, 3)];
    expect(pixel?.isGenesis).toBe(false);
    expect(pixel?.color).toBe("#3975B8");
    expect(pixel?.event?.signature).toBe("new");
  });

  it("builds deterministic activity buckets and color counts", () => {
    const nowMs = 100 * 60 * 60 * 1000;
    const events = [
      event({ timestamp: nowMs / 1000 - 60, color: "#ED9229" }),
      event({ timestamp: nowMs / 1000 - 120, color: "#ED9229", signature: "b" }),
      event({ timestamp: nowMs / 1000 - 60 * 60 * 23, color: "#3975B8", signature: "c" }),
      event({ timestamp: nowMs / 1000 - 60 * 60 * 25, color: "#FFFFFF", signature: "old" }),
    ];

    const buckets = activityBuckets(events, nowMs, 12, 24);
    expect(buckets).toHaveLength(12);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
    expect(colorDistribution(events)).toEqual([
      { color: "#ED9229", count: 2 },
      { color: "#3975B8", count: 1 },
      { color: "#FFFFFF", count: 1 },
    ]);
  });
});
