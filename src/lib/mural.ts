import { BOARD_SIZE, PALETTE } from "../config";
import type { PaintPayload } from "./paint-codec";

export interface PaintEvent extends PaintPayload {
  signature: string;
  painter: string;
  timestamp: number;
  slot: number;
  confirmationStatus: "processed" | "confirmed" | "finalized" | null;
}

export interface PixelState {
  color: string;
  event?: PaintEvent;
  isGenesis: boolean;
}

const dough = PALETTE[0].value;
const honey = PALETTE[1].value;
const caramel = PALETTE[2].value;
const chip = PALETTE[4].value;
const cream = PALETTE[5].value;
const berry = PALETTE[6].value;

// A small immutable starting mural. Confirmed paint events always win over it.
const GENESIS_ART = [
  "................",
  "..rr........r...",
  "...r..oooo..rr..",
  "....oohhhho.....",
  "...ohhhhdhho....",
  "..ohhdhhhhhhho..",
  "..ohhhcchdhhho..",
  ".ohhhhccchhdhho.",
  ".ohhdhhhhcchhho.",
  "..ohhhhhhhhhho..",
  "..ohhchdhhchho..",
  "...ohhhhhhhho...",
  "....oohhhhoo....",
  "......oooo......",
  "................",
  "................",
] as const;

const GENESIS_COLORS: Record<string, string> = {
  o: caramel,
  h: honey,
  d: dough,
  c: chip,
  r: berry,
  w: cream,
};

function createGenesisBoard(): PixelState[] {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
    const x = index % BOARD_SIZE;
    const y = Math.floor(index / BOARD_SIZE);
    const token = GENESIS_ART[y]?.[x] ?? ".";
    return {
      color: GENESIS_COLORS[token] ?? "#F8E9C8",
      isGenesis: true,
    };
  });
}

export function pixelIndex(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}

export function buildMural(events: PaintEvent[]): PixelState[] {
  const board = createGenesisBoard();
  const ordered = [...events].sort(
    (a, b) => a.slot - b.slot || a.timestamp - b.timestamp || a.signature.localeCompare(b.signature),
  );
  for (const event of ordered) {
    const index = pixelIndex(event.x, event.y);
    board[index] = { color: event.color, event, isGenesis: false };
  }
  return board;
}

export interface ActivityBucket {
  label: string;
  count: number;
}

export function activityBuckets(
  events: PaintEvent[],
  nowMs = Date.now(),
  bucketCount = 12,
  horizonHours = 24,
): ActivityBucket[] {
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const bucketMs = horizonMs / bucketCount;
  const start = nowMs - horizonMs;
  const counts = Array.from({ length: bucketCount }, () => 0);

  for (const event of events) {
    const timestampMs = event.timestamp * 1000;
    if (timestampMs < start || timestampMs > nowMs) continue;
    const index = Math.min(bucketCount - 1, Math.floor((timestampMs - start) / bucketMs));
    counts[index] = (counts[index] ?? 0) + 1;
  }

  return counts.map((count, index) => {
    const time = new Date(start + index * bucketMs);
    return {
      label: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      count,
    };
  });
}

export function colorDistribution(events: PaintEvent[]): Array<{ color: string; count: number }> {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.color, (counts.get(event.color) ?? 0) + 1);
  return [...counts.entries()]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count || a.color.localeCompare(b.color));
}
