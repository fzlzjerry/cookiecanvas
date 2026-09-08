import { useCallback, useEffect, useRef, useState } from "react";
import { COOKIE_CHAIN } from "../config";
import { fetchPaintEvents, preparePaintTransaction, probeChain, type ChainSnapshot } from "../lib/chain";
import type { PaintPayload } from "../lib/paint-codec";
import type { PaintEvent } from "../lib/mural";
import {
  connectNightly,
  disconnectNightly,
  isNightlyInstalled,
  publicKeyFor,
  signAndSendWithNightly,
  type ConnectedNightly,
} from "../lib/nightly";

export type TransactionStage =
  | "idle"
  | "preparing"
  | "approval"
  | "submitted"
  | "confirmed"
  | "failed";

export interface TransactionState {
  stage: TransactionStage;
  signature: string | null;
  error: string | null;
  estimatedFee: number | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected operation failed.";
}

export function useCookieCanvas() {
  const [chain, setChain] = useState<ChainSnapshot | null>(null);
  const [chainError, setChainError] = useState<string | null>(null);
  const [events, setEvents] = useState<PaintEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [wallet, setWallet] = useState<ConnectedNightly | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transaction, setTransaction] = useState<TransactionState>({
    stage: "idle",
    signature: null,
    error: null,
    estimatedFee: null,
  });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextChain = await probeChain();
      if (!mounted.current) return;
      setChain(nextChain);
      setChainError(
        nextChain.genesisHash === COOKIE_CHAIN.genesisHash
          ? null
          : "The RPC returned an unexpected genesis hash.",
      );
      setEvents(nextChain.programDeployed ? await fetchPaintEvents() : []);
    } catch (error) {
      if (mounted.current) setChainError(errorMessage(error));
    } finally {
      if (mounted.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);

    if (isNightlyInstalled()) {
      void connectNightly(true)
        .then((connected) => mounted.current && setWallet(connected))
        .catch(() => undefined);
    }

    return () => {
      mounted.current = false;
      window.clearInterval(interval);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setWalletError(null);
    try {
      const connected = await connectNightly(false);
      setWallet(connected);
    } catch (error) {
      setWalletError(errorMessage(error));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectNightly();
    } finally {
      setWallet(null);
      setWalletError(null);
    }
  }, []);

  const submitPaint = useCallback(
    async (payload: PaintPayload) => {
      if (!wallet) {
        setWalletError("Connect Nightly before publishing a paint event.");
        return;
      }
      if (!chain?.programDeployed) {
        setTransaction({
          stage: "failed",
          signature: null,
          error: "The CookieCanvas program is not deployed on this chain yet.",
          estimatedFee: null,
        });
        return;
      }

      setTransaction({ stage: "preparing", signature: null, error: null, estimatedFee: null });
      try {
        const prepared = await preparePaintTransaction(publicKeyFor(wallet), payload);
        setTransaction({
          stage: "approval",
          signature: null,
          error: null,
          estimatedFee: prepared.estimatedFee,
        });
        const signature = await signAndSendWithNightly(wallet, prepared, (submitted) => {
          setTransaction({
            stage: "submitted",
            signature: submitted,
            error: null,
            estimatedFee: prepared.estimatedFee,
          });
        });
        setTransaction({
          stage: "confirmed",
          signature,
          error: null,
          estimatedFee: prepared.estimatedFee,
        });
        await refresh();
      } catch (error) {
        setTransaction((current) => ({
          ...current,
          stage: "failed",
          error: errorMessage(error),
        }));
      }
    },
    [chain?.programDeployed, refresh, wallet],
  );

  const resetTransaction = useCallback(() => {
    setTransaction({ stage: "idle", signature: null, error: null, estimatedFee: null });
  }, []);

  return {
    chain,
    chainError,
    events,
    isRefreshing,
    refresh,
    wallet,
    walletError,
    isConnecting,
    connect,
    disconnect,
    transaction,
    submitPaint,
    resetTransaction,
  };
}
