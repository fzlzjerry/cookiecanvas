import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { COOKIE_CHAIN } from "../config";
import { connection, type PreparedPaintTransaction } from "./chain";

export interface ConnectedNightly {
  account: NightlyWalletAccount;
  address: string;
}

interface ConnectFeature {
  connect: (input?: { silent?: boolean }) => Promise<{ accounts: readonly NightlyWalletAccount[] }>;
}

interface DisconnectFeature {
  disconnect: () => Promise<void>;
}

interface SignAndSendFeature {
  signAndSendTransaction: (input: {
    account: NightlyWalletAccount;
    transaction: Uint8Array;
    chain: `${string}:${string}`;
    options?: {
      preflightCommitment?: "processed" | "confirmed" | "finalized";
      commitment?: "processed" | "confirmed" | "finalized";
      maxRetries?: number;
    };
  }) => Promise<readonly { signature: Uint8Array }[]>;
}

interface SignFeature {
  signTransaction: (input: {
    account: NightlyWalletAccount;
    transaction: Uint8Array;
    chain?: `${string}:${string}`;
    options?: { preflightCommitment?: "processed" | "confirmed" | "finalized" };
  }) => Promise<readonly { signedTransaction: Uint8Array }[]>;
}

function nightlyWallet(): NightlySolanaWallet {
  const wallet = window.nightly?.solana;
  if (!wallet) {
    throw new Error("Nightly wallet was not detected. Install Nightly, then reload this page.");
  }
  return wallet;
}

export function isNightlyInstalled(): boolean {
  return Boolean(window.nightly?.solana);
}

function getMethod<T>(wallet: NightlySolanaWallet, featureName: string, methodName: string): T | null {
  const feature = wallet.features[featureName];
  const method = feature?.[methodName];
  return typeof method === "function" ? (method as T) : null;
}

export async function connectNightly(silent = false): Promise<ConnectedNightly> {
  const wallet = nightlyWallet();
  if (!silent && wallet.genesisHash !== COOKIE_CHAIN.genesisHash && wallet.changeNetwork) {
    await wallet.changeNetwork({ genesisHash: COOKIE_CHAIN.genesisHash, url: COOKIE_CHAIN.rpcUrl });
  }

  const connect = getMethod<ConnectFeature["connect"]>(wallet, "standard:connect", "connect");
  if (!connect) throw new Error("This Nightly version does not expose Wallet Standard connect.");
  const { accounts } = await connect({ silent });
  const account = accounts[0];
  if (!account) throw new Error("Nightly did not return a connected Solana account.");

  return { account, address: account.address };
}

export async function disconnectNightly(): Promise<void> {
  const wallet = nightlyWallet();
  const disconnect = getMethod<DisconnectFeature["disconnect"]>(
    wallet,
    "standard:disconnect",
    "disconnect",
  );
  if (disconnect) await disconnect();
}

export async function signAndSendWithNightly(
  connected: ConnectedNightly,
  prepared: PreparedPaintTransaction,
  onSubmitted?: (signature: string) => void,
): Promise<string> {
  const wallet = nightlyWallet();
  const unsigned = new Uint8Array(
    prepared.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }),
  );
  const chain = `solana:${COOKIE_CHAIN.genesisHash}` as const;

  const signAndSend = getMethod<SignAndSendFeature["signAndSendTransaction"]>(
    wallet,
    "solana:signAndSendTransaction",
    "signAndSendTransaction",
  );

  let signature: string;
  if (signAndSend) {
    const output = await signAndSend({
      account: connected.account,
      transaction: unsigned,
      chain,
      options: { preflightCommitment: "confirmed", commitment: "confirmed", maxRetries: 3 },
    });
    const result = output[0];
    if (!result) throw new Error("Nightly returned no transaction signature.");
    signature = bs58.encode(result.signature);
  } else {
    const sign = getMethod<SignFeature["signTransaction"]>(
      wallet,
      "solana:signTransaction",
      "signTransaction",
    );
    if (!sign) throw new Error("This Nightly version cannot sign Solana transactions.");
    const output = await sign({
      account: connected.account,
      transaction: unsigned,
      chain,
      options: { preflightCommitment: "confirmed" },
    });
    const result = output[0];
    if (!result) throw new Error("Nightly returned no signed transaction.");
    signature = await connection.sendRawTransaction(result.signedTransaction, {
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });
  }

  onSubmitted?.(signature);
  const confirmation = await connection.confirmTransaction(
    { signature, ...prepared.blockhash },
    "confirmed",
  );
  if (confirmation.value.err) {
    throw new Error(`Cookie Chain rejected the transaction: ${JSON.stringify(confirmation.value.err)}`);
  }
  return signature;
}

export function publicKeyFor(connected: ConnectedNightly): PublicKey {
  return new PublicKey(connected.address);
}

export function transactionFromSignedBytes(bytes: Uint8Array): Transaction {
  return Transaction.from(bytes);
}
