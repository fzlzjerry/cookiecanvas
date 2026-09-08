import { BOARD_SIZE } from "../config";
import type { PixelState } from "../lib/mural";

export interface SelectedPixel {
  x: number;
  y: number;
}

interface PixelMuralProps {
  board: PixelState[];
  selected: SelectedPixel;
  onSelect: (pixel: SelectedPixel) => void;
  livePaintCount: number;
}

export function PixelMural({ board, selected, onSelect, livePaintCount }: PixelMuralProps) {
  return (
    <section className="mural-region" aria-labelledby="mural-title">
      <h1 className="sr-only" id="mural-title">CookieCanvas community mural</h1>
      <div className="mural-axis" aria-label="16 by 16 selectable pixel mural">
        <span className="axis-corner" aria-hidden="true" />
        {Array.from({ length: BOARD_SIZE }, (_, x) => (
          <span className="axis-label axis-top" aria-hidden="true" key={`top-${x}`}>
            {x}
          </span>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, y) => (
          <div className="mural-row" key={`row-${y}`}>
            <span className="axis-label axis-side" aria-hidden="true">
              {y}
            </span>
            {Array.from({ length: BOARD_SIZE }, (_, x) => {
              const pixel = board[y * BOARD_SIZE + x];
              const isSelected = selected.x === x && selected.y === y;
              const detail = pixel?.event
                ? `Painted ${pixel.event.color} by ${pixel.event.alias}${pixel.event.note ? `: ${pixel.event.note}` : ""}`
                : "Genesis mural pixel";
              return (
                <button
                  type="button"
                  className={`mural-pixel ${isSelected ? "is-selected" : ""} ${pixel?.isGenesis ? "is-genesis" : "is-live"}`}
                  style={{ backgroundColor: pixel?.color ?? "#F8E9C8" }}
                  aria-label={`Pixel ${x}, ${y}. ${detail}`}
                  aria-pressed={isSelected}
                  title={`(${x}, ${y}) · ${detail}`}
                  onClick={() => onSelect({ x, y })}
                  key={`${x}-${y}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mural-caption">
        <span>Click a pixel to select</span>
        <span>16 × 16 pixels · {livePaintCount} live paints</span>
      </div>
    </section>
  );
}
