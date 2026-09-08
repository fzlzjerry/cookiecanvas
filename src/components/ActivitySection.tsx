import { useMemo } from "react";
import { COOKIE_CHAIN } from "../config";
import { explorerAddressUrl, explorerTransactionUrl } from "../lib/chain";
import { activityBuckets, colorDistribution, type PaintEvent } from "../lib/mural";
import { ExternalIcon, LoaderIcon, RefreshIcon } from "./Icons";

interface ActivitySectionProps {
  events: PaintEvent[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

function short(value: string, start = 5, end = 5): string {
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function relativeTime(timestamp: number): string {
  if (!timestamp) return "time unavailable";
  const seconds = Math.max(0, Math.round(Date.now() / 1000 - timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ActivityChart({ events }: { events: PaintEvent[] }) {
  const buckets = useMemo(() => activityBuckets(events), [events]);
  const width = 360;
  const height = 130;
  const padding = 12;
  const max = Math.max(1, ...buckets.map(({ count }) => count));
  const points = buckets.map(({ count }, index) => ({
    x: padding + (index / Math.max(1, buckets.length - 1)) * (width - padding * 2),
    y: height - padding - (count / max) * (height - padding * 2),
  }));
  const path = points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Confirmed paint activity in the last 24 hours">
        <defs>
          <linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ED9229" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#ED9229" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-grid" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} className="chart-grid" />
        <path d={area} fill="url(#activity-fill)" />
        <path d={path} className="chart-line" />
        {points.map(({ x, y }, index) => (
          <circle cx={x} cy={y} r={buckets[index]?.count ? 2.8 : 1.4} className="chart-point" key={index} />
        ))}
      </svg>
      <div className="chart-axis">
        <span>{buckets[0]?.label}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
        <span>now</span>
      </div>
    </div>
  );
}

function DistributionChart({ events }: { events: PaintEvent[] }) {
  const distribution = useMemo(() => colorDistribution(events), [events]);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = distribution.map((item) => {
    const start = (cursor / Math.max(total, 1)) * 100;
    cursor += item.count;
    const end = (cursor / Math.max(total, 1)) * 100;
    return `${item.color} ${start}% ${end}%`;
  });
  const background = segments.length ? `conic-gradient(${segments.join(", ")})` : "#2b261f";

  return (
    <div className="distribution-wrap">
      <div className="donut" style={{ background }} aria-label={`${total} live paints represented by color`}>
        <span>{total}</span>
        <small>paints</small>
      </div>
      <ul className="color-legend">
        {distribution.slice(0, 5).map((item) => (
          <li key={item.color}>
            <i style={{ backgroundColor: item.color }} />
            <code>{item.color}</code>
            <span>{Math.round((item.count / total) * 100)}%</span>
          </li>
        ))}
        {distribution.length === 0 && <li className="empty-legend">First live color is still open.</li>}
      </ul>
    </div>
  );
}

export function ActivitySection({ events, isRefreshing, onRefresh }: ActivitySectionProps) {
  return (
    <section className="evidence-band" aria-labelledby="activity-title">
      <div className="activity-table-panel">
        <div className="panel-heading">
          <div>
            <h2 id="activity-title">Recent paints</h2>
            <p>Confirmed program instructions, newest first.</p>
          </div>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} aria-label="Refresh chain activity">
            {isRefreshing ? <LoaderIcon /> : <RefreshIcon />}
            Refresh
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Alias</th>
                <th>Pixel</th>
                <th>Color</th>
                <th>Note</th>
                <th>Painter</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 7).map((event) => (
                <tr key={`${event.signature}-${event.x}-${event.y}`}>
                  <td>{relativeTime(event.timestamp)}</td>
                  <td>{event.alias}</td>
                  <td><code>({event.x}, {event.y})</code></td>
                  <td><i className="table-color" style={{ backgroundColor: event.color }} /><code>{event.color}</code></td>
                  <td className="note-cell">{event.note || "—"}</td>
                  <td>
                    <a href={explorerAddressUrl(event.painter)} target="_blank" rel="noreferrer">
                      <code>{short(event.painter)}</code>
                    </a>
                  </td>
                  <td>
                    <a href={explorerTransactionUrl(event.signature)} target="_blank" rel="noreferrer" aria-label="Open transaction in CookieScan">
                      <code>{short(event.signature, 4, 4)}</code><ExternalIcon />
                    </a>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No confirmed CookieCanvas paints yet. The genesis mural stays visible while the first
                    community transaction is prepared.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="analytics-panel">
        <div className="analytics-block">
          <div className="panel-heading compact">
            <div>
              <h2>Paint activity</h2>
              <p>Last 24 hours</p>
            </div>
          </div>
          <ActivityChart events={events} />
        </div>
        <div className="analytics-block distribution-block">
          <div className="panel-heading compact">
            <div>
              <h2>Color distribution</h2>
              <p>Confirmed paints</p>
            </div>
          </div>
          <DistributionChart events={events} />
        </div>
      </div>
      <div className="program-proof">
        <span>Program</span>
        <a href={explorerAddressUrl(COOKIE_CHAIN.programId)} target="_blank" rel="noreferrer">
          <code>{COOKIE_CHAIN.programId}</code><ExternalIcon />
        </a>
      </div>
    </section>
  );
}
