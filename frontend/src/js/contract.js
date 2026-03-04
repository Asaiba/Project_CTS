import { CTS_CONTRACT_ADDRESS } from "./config.js";

export const getCtsContractAddress = () => CTS_CONTRACT_ADDRESS;

export const shortAddress = (address = "") => {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const assertContractDeployed = async (provider = window.ethereum) => {
  if (!provider || !provider.request) {
    throw new Error("Ethereum provider is not available");
  }
  const code = await provider.request({
    method: "eth_getCode",
    params: [CTS_CONTRACT_ADDRESS, "latest"],
  });
  if (!code || code === "0x") {
    throw new Error("CTS contract not found on current network. Switch network in MetaMask.");
  }
  return { address: CTS_CONTRACT_ADDRESS, code };
};
