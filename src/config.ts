export const COOKIE_CHAIN = {
  name: "Cookie Chain",
  rpcUrl: "https://rpc.cookiescan.io",
  wsUrl: "https://wss.cookiescan.io",
  explorerUrl: "https://cookiescan.io",
  bridgeUrl: "https://bridge.cookiescan.io",
  genesisHash: "9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2",
  programId: "ADBTs2V6QG9VHiZi9ZkhWz7eSDhYW327st6ieLTqeeBQ",
} as const;

export const BOARD_SIZE = 16;
export const HISTORY_LIMIT = 64;

export const PALETTE = [
  { name: "Dough", value: "#F6D79A" },
  { name: "Honey", value: "#ED9229" },
  { name: "Caramel", value: "#B8661F" },
  { name: "Cocoa", value: "#6F3519" },
  { name: "Dark chip", value: "#231610" },
  { name: "Cream", value: "#FFF4DC" },
  { name: "Berry", value: "#D75344" },
  { name: "Rose", value: "#E8848D" },
  { name: "Grape", value: "#7D4C94" },
  { name: "Blueberry", value: "#3975B8" },
  { name: "Sky", value: "#70A9C9" },
  { name: "Pistachio", value: "#76A85A" },
  { name: "Lemon", value: "#F5C64D" },
] as const;

export const DEFAULT_COLOR = PALETTE[1].value;
