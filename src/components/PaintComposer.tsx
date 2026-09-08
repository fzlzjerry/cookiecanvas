import { useEffect, useMemo, useState } from "react";
import { COOKIE_CHAIN, DEFAULT_COLOR, PALETTE } from "../config";
import { explorerTransactionUrl } from "../lib/chain";
import { paintByteLength, validatePaint, type PaintPayload } from "../lib/paint-codec";
import type { ConnectedNightly } from "../lib/nightly";
import type { TransactionState, TransactionStage } from "../hooks/useCookieCanvas";
import type { SelectedPixel } from "./PixelMural";
import { AlertIcon, ArrowIcon, CheckIcon, ExternalIcon, LoaderIcon, WalletIcon } from "./Icons";

interface PaintComposerProps {
  selected: SelectedPixel;
  wallet: ConnectedNightly | null;
  programDeployed: boolean;
  transaction: TransactionState;
  onConnect: () => void;
  onSubmit: (payload: PaintPayload) => Promise<void>;
  onResetTransaction: () => void;
}

const STAGES: Array<{ key: TransactionStage; label: string }> = [
  { key: "preparing", label: "Prepared" },
  { key: "approval", label: "Wallet approval" },
  { key: "submitted", label: "Submitted" },
  { key: "confirmed", label: "Confirmed" },
];

function stagePosition(stage: TransactionStage): number {
  if (stage === "failed") return -1;
  return STAGES.findIndex(({ key }) => key === stage);
}

export function PaintComposer({
  selected,
  wallet,
  programDeployed,
  transaction,
  onConnect,
  onSubmit,
  onResetTransaction,
}: PaintComposerProps) {
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [alias, setAlias] = useState("CrumbArtist");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const busy = ["preparing", "approval", "submitted"].includes(transaction.stage);

  useEffect(() => {
    if (transaction.stage === "confirmed") setNote("");
  }, [transaction.stage]);

  const payload = useMemo(
    () => ({ x: selected.x, y: selected.y, color, alias, note }),
    [alias, color, note, selected.x, selected.y],
  );
  const wireBytes = useMemo(() => {
    try {
      return paintByteLength(payload);
    } catch {
      return null;
    }
  }, [payload]);

  const submit = async () => {
    setFormError(null);
    try {
      const valid = validatePaint(payload);
      onResetTransaction();
      await onSubmit(valid);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Check the paint details.");
    }
  };

  const currentPosition = stagePosition(transaction.stage);

  return (
    <aside className="composer-region" aria-labelledby="composer-title">
      <div className="composer-title-row">
        <div>
          <h2 id="composer-title">Paint on-chain</h2>
          <p>A compact, versioned instruction. Your wallet pays only the network fee.</p>
        </div>
        <div className="selected-coordinate" aria-label={`Selected pixel ${selected.x}, ${selected.y}`}>
          <span>X</span><strong>{selected.x}</strong><span>Y</span><strong>{selected.y}</strong>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <label>Choose color</label>
          <code>{color}</code>
        </div>
        <div className="palette" role="radiogroup" aria-label="Paint color">
          {PALETTE.map((entry) => (
            <button
              type="button"
              role="radio"
              aria-checked={color === entry.value}
              aria-label={entry.name}
              title={`${entry.name} · ${entry.value}`}
              className={color === entry.value ? "is-active" : ""}
              style={{ backgroundColor: entry.value }}
              onClick={() => setColor(entry.value)}
              key={entry.value}
            >
              {color === entry.value && <CheckIcon />}
            </button>
          ))}
        </div>
      </div>

      <label className="input-field">
        <span>Your alias <small>{new TextEncoder().encode(alias).length} / 16 bytes</small></span>
        <input
          value={alias}
          maxLength={16}
          autoComplete="nickname"
          spellCheck="false"
          onChange={(event) => setAlias(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="input-field">
        <span>Note (optional) <small>{new TextEncoder().encode(note.trim()).length} / 64 bytes</small></span>
        <input
          value={note}
          maxLength={64}
          placeholder="What changed?"
          onChange={(event) => setNote(event.target.value)}
          disabled={busy}
        />
      </label>

      <div className="cost-preview">
        <div>
          <span>Network fee only</span>
          <strong>
            {transaction.estimatedFee === null
              ? "Estimated by Cookie Chain at signing"
              : `${transaction.estimatedFee.toLocaleString()} lamports`}
          </strong>
        </div>
        <div>
          <span>Instruction</span>
          <strong>{wireBytes === null ? "Check fields" : `${wireBytes} bytes · CCV1`}</strong>
        </div>
      </div>

      {(formError || transaction.error) && (
        <div className="error-banner" role="alert">
          <AlertIcon />
          <span>{formError ?? transaction.error}</span>
        </div>
      )}

      {!wallet ? (
        <button className="primary-action" type="button" onClick={onConnect}>
          <WalletIcon />
          Connect Nightly
          <ArrowIcon />
        </button>
      ) : (
        <button
          className="primary-action"
          type="button"
          onClick={() => void submit()}
          disabled={busy || !programDeployed}
          title={!programDeployed ? "The on-chain program is awaiting deployment." : undefined}
        >
          {busy ? <LoaderIcon /> : <span className="pixel-action-icon" />}
          {busy
            ? transaction.stage === "approval"
              ? "Approve in Nightly"
              : transaction.stage === "submitted"
                ? "Confirming on-chain"
                : "Preparing transaction"
            : programDeployed
              ? "Paint on-chain"
              : "Program deployment pending"}
          {!busy && <ArrowIcon />}
        </button>
      )}

      <section className="transaction-rail" aria-labelledby="transaction-title">
        <div className="rail-heading">
          <h3 id="transaction-title">Live on Cookie Chain</h3>
          <span>{transaction.stage === "idle" ? "Ready" : transaction.stage}</span>
        </div>
        <ol>
          {STAGES.map((stage, index) => {
            const complete = currentPosition >= index || transaction.stage === "confirmed";
            const active = currentPosition === index && transaction.stage !== "confirmed";
            return (
              <li className={`${complete ? "is-complete" : ""} ${active ? "is-active" : ""}`} key={stage.key}>
                <span className="rail-node">{complete && !active ? <CheckIcon /> : index + 1}</span>
                <span>{stage.label}</span>
              </li>
            );
          })}
        </ol>
        {transaction.signature && (
          <a
            className="explorer-link"
            href={explorerTransactionUrl(transaction.signature)}
            target="_blank"
            rel="noreferrer"
          >
            View {transaction.signature.slice(0, 6)}…{transaction.signature.slice(-6)} on CookieScan
            <ExternalIcon />
          </a>
        )}
        {!programDeployed && (
          <p className="deployment-note">
            The interface is connected to <code>{COOKIE_CHAIN.rpcUrl}</code>. Painting unlocks after the
            audited program is deployed.
          </p>
        )}
      </section>
    </aside>
  );
}
