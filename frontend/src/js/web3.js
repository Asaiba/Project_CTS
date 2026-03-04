import { CTS_CONTRACT_ADDRESS } from "./config.js";

const requireEthereum = () => {
  if (!window.ethereum || !window.ethereum.request) {
    throw new Error("MetaMask is not detected. Please install MetaMask.");
  }
  return window.ethereum;
};

const SEPOLIA_CHAIN_ID = "0xaa36a7";

export const ensureSepoliaNetwork = async () => {
  const ethereum = requireEthereum();
  const current = await ethereum.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === SEPOLIA_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      throw new Error("Sepolia network is not available in MetaMask. Add Sepolia and try again.");
    }
    throw new Error("Please switch MetaMask network to Sepolia.");
  }
};

export const getConnectedWallet = async () => {
  const ethereum = requireEthereum();
  let accounts = await ethereum.request({ method: "eth_accounts" });
  if (!accounts || !accounts.length) {
    accounts = await ethereum.request({ method: "eth_requestAccounts" });
  }
  if (!accounts || !accounts.length) {
    throw new Error("No wallet account available.");
  }
  return accounts[0];
};

export const getChainIdHex = async () => {
  const ethereum = requireEthereum();
  return ethereum.request({ method: "eth_chainId" });
};

const chainExplorerMap = {
  "0x1": "https://etherscan.io",
  "0xaa36a7": "https://sepolia.etherscan.io",
  "0x5": "https://goerli.etherscan.io",
  "0x89": "https://polygonscan.com",
  "0x13881": "https://mumbai.polygonscan.com",
  "0xa4b1": "https://arbiscan.io",
  "0x66eee": "https://holesky.etherscan.io",
};

export const getExplorerBaseUrl = async () => {
  const chainId = await getChainIdHex();
  return chainExplorerMap[chainId] || "https://etherscan.io";
};

export const openContractOnExplorer = async () => {
  const base = await getExplorerBaseUrl();
  window.open(`${base}/address/${CTS_CONTRACT_ADDRESS}`, "_blank", "noopener,noreferrer");
};

const parseEthToWeiHex = (valueEth) => {
  const normalized = String(valueEth || "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid ETH amount.");
  }
  const [whole, fractionRaw = ""] = normalized.split(".");
  const fraction = `${fractionRaw}000000000000000000`.slice(0, 18);
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction);
  if (wei <= 0n) {
    throw new Error("Amount must be greater than 0.");
  }
  return `0x${wei.toString(16)}`;
};

export const sendEth = async ({ from, to, amountEth }) => {
  const ethereum = requireEthereum();
  await ensureSepoliaNetwork();
  const txHash = await ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to,
        value: parseEthToWeiHex(amountEth),
      },
    ],
  });
  return txHash;
};
