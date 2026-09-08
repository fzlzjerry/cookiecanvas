interface NightlyWalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: readonly string[];
  features: readonly string[];
}

interface NightlySolanaWallet {
  name?: string;
  genesisHash?: string;
  standardWallet?: unknown;
  changeNetwork?: (network: { genesisHash: string; url?: string }) => Promise<void>;
  features: Record<string, Record<string, unknown>>;
}

interface Window {
  nightly?: {
    solana?: NightlySolanaWallet;
  };
}


declare module "*.css";
