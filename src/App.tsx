import { useMemo, useState } from "react";
import { COOKIE_CHAIN } from "./config";
import { AppHeader } from "./components/AppHeader";
import { ActivitySection } from "./components/ActivitySection";
import { PaintComposer } from "./components/PaintComposer";
import { PixelMural, type SelectedPixel } from "./components/PixelMural";
import { ExternalIcon } from "./components/Icons";
import { useCookieCanvas } from "./hooks/useCookieCanvas";
import { buildMural } from "./lib/mural";

export default function App() {
  const [selected, setSelected] = useState<SelectedPixel>({ x: 11, y: 7 });
  const state = useCookieCanvas();
  const board = useMemo(() => buildMural(state.events), [state.events]);

  return (
    <div className="app-shell" id="top">
      <AppHeader
        chain={state.chain}
        chainError={state.chainError}
        wallet={state.wallet}
        walletError={state.walletError}
        isConnecting={state.isConnecting}
        onConnect={() => void state.connect()}
        onDisconnect={() => void state.disconnect()}
      />
      <main>
        <div className="workspace">
          <PixelMural
            board={board}
            selected={selected}
            onSelect={setSelected}
            livePaintCount={state.events.length}
          />
          <PaintComposer
            selected={selected}
            wallet={state.wallet}
            programDeployed={state.chain?.programDeployed ?? false}
            transaction={state.transaction}
            onConnect={() => void state.connect()}
            onSubmit={state.submitPaint}
            onResetTransaction={state.resetTransaction}
          />
        </div>
        <ActivitySection
          events={state.events}
          isRefreshing={state.isRefreshing}
          onRefresh={() => void state.refresh()}
        />
        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div>
            <h2 id="how-title">One signed instruction. A mural anyone can replay.</h2>
            <p>
              CookieCanvas stores no proprietary database of pixels. Its small SVM program validates the
              painter, coordinates, color, alias, and note, then emits the exact versioned bytes. The app
              rebuilds the canvas from confirmed program history.
            </p>
          </div>
          <ol>
            <li><span>1</span><strong>Connect Nightly</strong><small>Switch to the verified Cookie Chain genesis hash.</small></li>
            <li><span>2</span><strong>Choose one pixel</strong><small>Review the payload and network fee before signing.</small></li>
            <li><span>3</span><strong>Verify on CookieScan</strong><small>Follow the signature and replay the public instruction.</small></li>
          </ol>
        </section>
      </main>
      <footer>
        <div><span className="health-dot" /> Cookie Chain</div>
        <p>Paints are permanent and publicly verifiable.</p>
        <div className="footer-links">
          <a href={COOKIE_CHAIN.bridgeUrl} target="_blank" rel="noreferrer">Bridge <ExternalIcon /></a>
          <a href={COOKIE_CHAIN.explorerUrl} target="_blank" rel="noreferrer">CookieScan <ExternalIcon /></a>
        </div>
      </footer>
    </div>
  );
}
