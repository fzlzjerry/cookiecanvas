import type { ChainSnapshot } from "../lib/chain";
import type { ConnectedNightly } from "../lib/nightly";
import { ExternalIcon, LoaderIcon, WalletIcon } from "./Icons";

interface AppHeaderProps {
  chain: ChainSnapshot | null;
  chainError: string | null;
  wallet: ConnectedNightly | null;
  walletError: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function AppHeader({
  chain,
  chainError,
  wallet,
  walletError,
  isConnecting,
  onConnect,
  onDisconnect,
}: AppHeaderProps) {
  const healthy = chain && !chainError;

  return (
    <header className="app-header">
      <a className="wordmark" href="#top" aria-label="CookieCanvas home">
        <span>Cookie</span>Canvas
      </a>
      <nav aria-label="Primary navigation">
        <a href="#how-it-works">How it works</a>
        <a href="https://bridge.cookiescan.io" target="_blank" rel="noreferrer">
          Bridge <ExternalIcon />
        </a>
      </nav>
      <div className="header-actions">
        <div className={`network-health ${healthy ? "is-healthy" : "is-waiting"}`}>
          <span className="health-dot" />
          <span>{healthy ? `Cookie Chain · ${chain.latencyMs} ms` : "Checking chain"}</span>
        </div>
        {wallet ? (
          <button className="wallet-button connected" type="button" onClick={onDisconnect}>
            <WalletIcon />
            <span>Nightly</span>
            <code>{shortAddress(wallet.address)}</code>
          </button>
        ) : (
          <button
            className="wallet-button"
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? <LoaderIcon /> : <WalletIcon />}
            <span>{isConnecting ? "Connecting" : "Connect Nightly"}</span>
          </button>
        )}
      </div>
      {(walletError || chainError) && (
        <div className="header-notice" role="status">
          {walletError ?? chainError}
        </div>
      )}
    </header>
  );
}
