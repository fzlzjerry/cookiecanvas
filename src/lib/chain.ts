import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type BlockhashWithExpiryBlockHeight,
  type ParsedInstruction,
  type PartiallyDecodedInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { COOKIE_CHAIN, HISTORY_LIMIT } from "../config";
import { decodePaint, encodePaint, type PaintPayload } from "./paint-codec";
import type { PaintEvent } from "./mural";

export interface ChainSnapshot {
  genesisHash: string;
  slot: number;
  version: string;
  latencyMs: number;
  programDeployed: boolean;
  programOwner: string | null;
  checkedAt: number;
}

export interface PreparedPaintTransaction {
  transaction: Transaction;
  blockhash: BlockhashWithExpiryBlockHeight;
  estimatedFee: number | null;
}

export const connection = new Connection(COOKIE_CHAIN.rpcUrl, {
  commitment: "confirmed",
  wsEndpoint: COOKIE_CHAIN.wsUrl,
  disableRetryOnRateLimit: false,
});

export async function probeChain(): Promise<ChainSnapshot> {
  const startedAt = performance.now();
  const program = new PublicKey(COOKIE_CHAIN.programId);
  const [genesisHash, slot, version, programInfo] = await Promise.all([
    connection.getGenesisHash(),
    connection.getSlot("confirmed"),
    connection.getVersion(),
    connection.getAccountInfo(program, "confirmed"),
  ]);

  return {
    genesisHash,
    slot,
    version: version["solana-core"],
    latencyMs: Math.round(performance.now() - startedAt),
    programDeployed: Boolean(programInfo?.executable),
    programOwner: programInfo?.owner.toBase58() ?? null,
    checkedAt: Date.now(),
  };
}

export function buildPaintInstruction(painter: PublicKey, payload: PaintPayload): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(COOKIE_CHAIN.programId),
    keys: [{ pubkey: painter, isSigner: true, isWritable: false }],
    data: Buffer.from(encodePaint(payload)),
  });
}

export async function preparePaintTransaction(
  painter: PublicKey,
  payload: PaintPayload,
): Promise<PreparedPaintTransaction> {
  const blockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: painter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(buildPaintInstruction(painter, payload));
  const fee = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");

  return { transaction, blockhash, estimatedFee: fee.value };
}

function isPartiallyDecoded(
  instruction: ParsedInstruction | PartiallyDecodedInstruction,
): instruction is PartiallyDecodedInstruction {
  return "data" in instruction && "programId" in instruction;
}

export async function fetchPaintEvents(limit = HISTORY_LIMIT): Promise<PaintEvent[]> {
  const programId = new PublicKey(COOKIE_CHAIN.programId);
  const signatures = await connection.getSignaturesForAddress(programId, { limit }, "confirmed");
  if (signatures.length === 0) return [];

  const transactions = await connection.getParsedTransactions(
    signatures.map(({ signature }) => signature),
    { commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  );

  const events: PaintEvent[] = [];
  transactions.forEach((transaction, transactionIndex) => {
    if (!transaction?.meta || transaction.meta.err) return;
    const signatureInfo = signatures[transactionIndex];
    if (!signatureInfo) return;

    const painter = transaction.transaction.message.accountKeys.find(({ signer }) => signer)?.pubkey.toBase58();
    if (!painter) return;

    for (const instruction of transaction.transaction.message.instructions) {
      if (!isPartiallyDecoded(instruction) || !instruction.programId.equals(programId)) continue;
      try {
        const payload = decodePaint(bs58.decode(instruction.data));
        events.push({
          ...payload,
          signature: signatureInfo.signature,
          painter,
          timestamp: transaction.blockTime ?? 0,
          slot: transaction.slot,
          confirmationStatus: signatureInfo.confirmationStatus ?? null,
        });
      } catch {
        // Ignore unrelated instructions addressed to a future program version.
      }
    }
  });

  return events.sort(
    (a, b) => b.slot - a.slot || b.timestamp - a.timestamp || b.signature.localeCompare(a.signature),
  );
}

export function explorerTransactionUrl(signature: string): string {
  return `${COOKIE_CHAIN.explorerUrl}/tx/${encodeURIComponent(signature)}`;
}

export function explorerAddressUrl(address: string): string {
  return `${COOKIE_CHAIN.explorerUrl}/address/${encodeURIComponent(address)}`;
}
