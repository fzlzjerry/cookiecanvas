import { BOARD_SIZE } from "../config";

export const PAINT_MAGIC = new Uint8Array([0x43, 0x43, 0x56, 0x31]); // CCV1
export const MAX_ALIAS_BYTES = 16;
export const MAX_NOTE_BYTES = 64;
export const PAINT_HEADER_BYTES = 11;

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export interface PaintPayload {
  x: number;
  y: number;
  color: string;
  alias: string;
  note: string;
}

function utf8Length(value: string): number {
  return encoder.encode(value).byteLength;
}

export function normalizeColor(color: string): string {
  const normalized = color.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    throw new Error("Color must be a six-digit hex value.");
  }
  return normalized;
}

export function validatePaint(payload: PaintPayload): PaintPayload {
  if (!Number.isInteger(payload.x) || payload.x < 0 || payload.x >= BOARD_SIZE) {
    throw new Error(`Pixel x must be an integer from 0 to ${BOARD_SIZE - 1}.`);
  }
  if (!Number.isInteger(payload.y) || payload.y < 0 || payload.y >= BOARD_SIZE) {
    throw new Error(`Pixel y must be an integer from 0 to ${BOARD_SIZE - 1}.`);
  }

  const alias = payload.alias.trim();
  if (!alias || !/^[A-Za-z0-9 _-]+$/.test(alias)) {
    throw new Error("Alias may contain letters, numbers, spaces, dashes, and underscores.");
  }
  if (utf8Length(alias) > MAX_ALIAS_BYTES) {
    throw new Error(`Alias must fit in ${MAX_ALIAS_BYTES} UTF-8 bytes.`);
  }

  const note = payload.note.trim();
  if (/\p{Cc}/u.test(note)) {
    throw new Error("Note cannot contain control characters.");
  }
  if (utf8Length(note) > MAX_NOTE_BYTES) {
    throw new Error(`Note must fit in ${MAX_NOTE_BYTES} UTF-8 bytes.`);
  }

  return {
    x: payload.x,
    y: payload.y,
    color: normalizeColor(payload.color),
    alias,
    note,
  };
}

export function encodePaint(input: PaintPayload): Uint8Array {
  const payload = validatePaint(input);
  const alias = encoder.encode(payload.alias);
  const note = encoder.encode(payload.note);
  const color = payload.color.slice(1);

  const bytes = new Uint8Array(PAINT_HEADER_BYTES + alias.length + note.length);
  bytes.set(PAINT_MAGIC, 0);
  bytes[4] = payload.x;
  bytes[5] = payload.y;
  bytes[6] = Number.parseInt(color.slice(0, 2), 16);
  bytes[7] = Number.parseInt(color.slice(2, 4), 16);
  bytes[8] = Number.parseInt(color.slice(4, 6), 16);
  bytes[9] = alias.length;
  bytes[10] = note.length;
  bytes.set(alias, PAINT_HEADER_BYTES);
  bytes.set(note, PAINT_HEADER_BYTES + alias.length);
  return bytes;
}

export function decodePaint(input: Uint8Array): PaintPayload {
  if (input.length < PAINT_HEADER_BYTES) {
    throw new Error("Paint instruction is truncated.");
  }
  if (!PAINT_MAGIC.every((byte, index) => input[index] === byte)) {
    throw new Error("Paint instruction has an unknown version.");
  }

  const aliasLength = input[9] ?? 0;
  const noteLength = input[10] ?? 0;
  if (aliasLength > MAX_ALIAS_BYTES || noteLength > MAX_NOTE_BYTES) {
    throw new Error("Paint instruction exceeds text limits.");
  }
  if (input.length !== PAINT_HEADER_BYTES + aliasLength + noteLength) {
    throw new Error("Paint instruction length does not match its header.");
  }

  const toHex = (byte: number | undefined) =>
    (byte ?? 0).toString(16).padStart(2, "0").toUpperCase();
  const aliasStart = PAINT_HEADER_BYTES;
  const noteStart = aliasStart + aliasLength;

  return validatePaint({
    x: input[4] ?? -1,
    y: input[5] ?? -1,
    color: `#${toHex(input[6])}${toHex(input[7])}${toHex(input[8])}`,
    alias: decoder.decode(input.slice(aliasStart, noteStart)),
    note: decoder.decode(input.slice(noteStart)),
  });
}

export function paintByteLength(payload: PaintPayload): number {
  return encodePaint(payload).byteLength;
}
