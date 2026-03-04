import { ethers } from "ethers";
import { env } from "../config/env.js";

const CTS_ABI = [
  "function students(address) view returns (string username, address wallet, bool isRegistered)",
  "function registerStudent(address _wallet, string _username)",
];

const normalizePrivateKey = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("0x") ? raw : `0x${raw}`;
};

const ensureConfigured = () => {
  if (!env.ethRpcUrl || !env.ctsContractAddress || !env.ctsOwnerPrivateKey) {
    const error = new Error(
      "On-chain registration is not configured. Set ETH_RPC_URL, CTS_CONTRACT_ADDRESS, and CTS_OWNER_PRIVATE_KEY."
    );
    error.statusCode = 500;
    throw error;
  }
};

const getContract = () => {
  ensureConfigured();
  const provider = new ethers.JsonRpcProvider(env.ethRpcUrl);
  const wallet = new ethers.Wallet(normalizePrivateKey(env.ctsOwnerPrivateKey), provider);
  return new ethers.Contract(env.ctsContractAddress, CTS_ABI, wallet);
};

const extractEthersMessage = (error) =>
  error?.shortMessage ||
  error?.reason ||
  error?.info?.error?.message ||
  error?.message ||
  "Unknown blockchain error";

export const registerStudentOnChainByOwner = async ({ walletAddress, username }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();
  const name = String(username || "").trim();

  if (!wallet || !name) {
    const error = new Error("Wallet address and username are required for on-chain student registration.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.students(wallet);
    if (row?.isRegistered) {
      return { alreadyRegistered: true, txHash: null };
    }

    const tx = await contract.registerStudent(wallet, name);
    await tx.wait();
    return { alreadyRegistered: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("already registered")) {
      return { alreadyRegistered: true, txHash: null };
    }
    const wrapped = new Error(`On-chain student registration failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};
