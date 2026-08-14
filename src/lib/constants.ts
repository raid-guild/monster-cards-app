import { mainnet } from "viem/chains";

export const MONSTERS_CHAIN_ID = 1;
export const MONSTERS_CONTRACT = "0xecb9b2ea457740fbde58c758e4c574834224413e" as const;
export const DEFAULT_STYLE = "ember-archive";
export const OPENSEA_COLLECTION_URL = "https://opensea.io/collection/monsters-7vx3cc5ojl";
export const ETHERSCAN_CONTRACT_URL = `https://etherscan.io/token/${MONSTERS_CONTRACT}`;
export const RAIDGUILD_URL = "https://www.raidguild.org/";

export const ethereumMainnet = mainnet;

export const monstersAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "uri", type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "owner", type: "address" }],
  },
] as const;
