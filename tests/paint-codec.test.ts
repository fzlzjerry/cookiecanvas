import { describe, expect, it } from "vitest";
import {
  decodePaint,
  encodePaint,
  MAX_ALIAS_BYTES,
  MAX_NOTE_BYTES,
  PAINT_HEADER_BYTES,
} from "../src/lib/paint-codec";

describe("CookieCanvas paint wire format", () => {
  it("round-trips a valid payload without normalizing away meaningful text", () => {
    const encoded = encodePaint({
      x: 11,
      y: 7,
      color: "#ed9229",
      alias: " CrumbArtist ",
      note: "  adding a chip 🍪  ",
    });

    expect(encoded.slice(0, 4)).toEqual(new Uint8Array([0x43, 0x43, 0x56, 0x31]));
    expect(encoded.byteLength).toBe(PAINT_HEADER_BYTES + 11 + 18);
    expect(decodePaint(encoded)).toEqual({
      x: 11,
      y: 7,
      color: "#ED9229",
      alias: "CrumbArtist",
      note: "adding a chip 🍪",
    });
  });

  it.each([
    [{ x: -1, y: 0, color: "#000000", alias: "a", note: "" }, "Pixel x"],
    [{ x: 0, y: 16, color: "#000000", alias: "a", note: "" }, "Pixel y"],
    [{ x: 0, y: 0, color: "orange", alias: "a", note: "" }, "six-digit hex"],
    [{ x: 0, y: 0, color: "#000000", alias: "bad@alias", note: "" }, "Alias may"],
    [{ x: 0, y: 0, color: "#000000", alias: "a", note: "line\nfeed" }, "control"],
  ])("rejects invalid payload %#", (payload, message) => {
    expect(() => encodePaint(payload)).toThrow(message);
  });

  it("enforces UTF-8 byte limits rather than JavaScript character count", () => {
    const alias = "a".repeat(MAX_ALIAS_BYTES + 1);
    const note = "🍪".repeat(MAX_NOTE_BYTES / 4 + 1);
    expect(() => encodePaint({ x: 0, y: 0, color: "#000000", alias, note: "" })).toThrow(
      "UTF-8 bytes",
    );
    expect(() => encodePaint({ x: 0, y: 0, color: "#000000", alias: "ok", note })).toThrow(
      "UTF-8 bytes",
    );
  });

  it("rejects truncated, foreign-version, and mismatched-length instructions", () => {
    expect(() => decodePaint(new Uint8Array([1, 2, 3]))).toThrow("truncated");

    const valid = encodePaint({ x: 1, y: 2, color: "#ABCDEF", alias: "ok", note: "" });
    const foreign = valid.slice();
    foreign[3] = 2;
    expect(() => decodePaint(foreign)).toThrow("unknown version");

    const mismatched = valid.slice();
    mismatched[10] = 1;
    expect(() => decodePaint(mismatched)).toThrow("does not match");
  });
});
