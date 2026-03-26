import { ethers } from "ethers";
import { env } from "../config/env.js";

const CTS_ABI = [
  "function students(address) view returns (string username, address wallet, bool isRegistered)",
  "function colleges(address) view returns (string name, address wallet, bool isRegistered)",
  "function daoMembers(address) view returns (bool isMember)",
  "function registerStudent(address _wallet, string _username)",
  "function deregisterStudent(address _wallet)",
  "function registerCollege(address _wallet, string _username)",
  "function deregisterCollege(address _wallet)",
  "function addDaoMember(address _wallet)",
  "function removeDaoMember(address _wallet)",
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

export const roleNeedsOnChainRegistration = (role) =>
  ["student", "college", "dao"].includes(String(role || "").trim().toLowerCase());

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const normalizeWallet = (walletAddress) => String(walletAddress || "").trim().toLowerCase();

const normalizeName = (value) => String(value || "").trim();

const roleStoresNameOnChain = (role) => ["student", "college"].includes(normalizeRole(role));

const normalizeState = (state = {}) => ({
  role: normalizeRole(state.role),
  walletAddress: normalizeWallet(state.walletAddress),
  username: normalizeName(state.username),
});

const hasOnChainState = (state) => roleNeedsOnChainRegistration(state.role) && Boolean(state.walletAddress);

const sameOnChainState = (leftInput, rightInput) => {
  const left = normalizeState(leftInput);
  const right = normalizeState(rightInput);

  if (left.role !== right.role || left.walletAddress !== right.walletAddress) return false;
  if (roleStoresNameOnChain(left.role)) {
    return left.username === right.username;
  }
  return true;
};

const makeValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const assertStateIsSyncable = (state, label = "User") => {
  if (!roleNeedsOnChainRegistration(state.role)) return;
  if (!state.walletAddress) {
    throw makeValidationError(`${label} wallet address is required for on-chain ${state.role} sync.`);
  }
  if (roleStoresNameOnChain(state.role) && !state.username) {
    throw makeValidationError(`${label} name is required for on-chain ${state.role} sync.`);
  }
};

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

export const deregisterStudentOnChainByOwner = async ({ walletAddress }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();

  if (!wallet) {
    const error = new Error("Wallet address is required for on-chain student deregistration.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.students(wallet);
    if (!row?.isRegistered) {
      return { alreadyCleared: true, txHash: null };
    }

    const tx = await contract.deregisterStudent(wallet);
    await tx.wait();
    return { alreadyCleared: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("not registered")) {
      return { alreadyCleared: true, txHash: null };
    }
    const wrapped = new Error(`On-chain student deregistration failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const registerCollegeOnChainByOwner = async ({ walletAddress, username }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();
  const name = String(username || "").trim();

  if (!wallet || !name) {
    const error = new Error("Wallet address and username are required for on-chain college registration.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.colleges(wallet);
    if (row?.isRegistered) {
      return { alreadyRegistered: true, txHash: null };
    }

    const tx = await contract.registerCollege(wallet, name);
    await tx.wait();
    return { alreadyRegistered: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("already registered")) {
      return { alreadyRegistered: true, txHash: null };
    }
    const wrapped = new Error(`On-chain college registration failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const deregisterCollegeOnChainByOwner = async ({ walletAddress }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();

  if (!wallet) {
    const error = new Error("Wallet address is required for on-chain college deregistration.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.colleges(wallet);
    if (!row?.isRegistered) {
      return { alreadyCleared: true, txHash: null };
    }

    const tx = await contract.deregisterCollege(wallet);
    await tx.wait();
    return { alreadyCleared: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("not registered")) {
      return { alreadyCleared: true, txHash: null };
    }
    const wrapped = new Error(`On-chain college deregistration failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const addDaoMemberOnChainByOwner = async ({ walletAddress }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();

  if (!wallet) {
    const error = new Error("Wallet address is required for on-chain DAO member registration.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.daoMembers(wallet);
    if (row) {
      return { alreadyRegistered: true, txHash: null };
    }

    const tx = await contract.addDaoMember(wallet);
    await tx.wait();
    return { alreadyRegistered: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("already") || String(message).toLowerCase().includes("member")) {
      return { alreadyRegistered: true, txHash: null };
    }
    const wrapped = new Error(`On-chain DAO member registration failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const removeDaoMemberOnChainByOwner = async ({ walletAddress }) => {
  const contract = getContract();
  const wallet = String(walletAddress || "").trim();

  if (!wallet) {
    const error = new Error("Wallet address is required for on-chain DAO member removal.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const row = await contract.daoMembers(wallet);
    if (!row) {
      return { alreadyCleared: true, txHash: null };
    }

    const tx = await contract.removeDaoMember(wallet);
    await tx.wait();
    return { alreadyCleared: false, txHash: tx.hash };
  } catch (error) {
    const message = extractEthersMessage(error);
    if (String(message).toLowerCase().includes("not dao member") || String(message).toLowerCase().includes("not member")) {
      return { alreadyCleared: true, txHash: null };
    }
    const wrapped = new Error(`On-chain DAO member removal failed: ${message}`);
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const registerUserOnChainByRole = async ({ role, walletAddress, username }) => {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "student") {
    return registerStudentOnChainByOwner({ walletAddress, username });
  }

  if (normalizedRole === "college") {
    return registerCollegeOnChainByOwner({ walletAddress, username });
  }

  if (normalizedRole === "dao") {
    return addDaoMemberOnChainByOwner({ walletAddress });
  }

  return { skipped: true, reason: "role_not_supported", txHash: null };
};

export const clearUserOnChainByRole = async ({ role, walletAddress }) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "student") {
    return deregisterStudentOnChainByOwner({ walletAddress });
  }

  if (normalizedRole === "college") {
    return deregisterCollegeOnChainByOwner({ walletAddress });
  }

  if (normalizedRole === "dao") {
    return removeDaoMemberOnChainByOwner({ walletAddress });
  }

  return { skipped: true, reason: "role_not_supported", txHash: null };
};

const makeRegisterOperation = (state) => ({
  label: `register:${state.role}:${state.walletAddress}`,
  apply: () => registerUserOnChainByRole(state),
  compensate: () => clearUserOnChainByRole(state),
});

const makeClearOperation = (state) => ({
  label: `clear:${state.role}:${state.walletAddress}`,
  apply: () => clearUserOnChainByRole(state),
  compensate: () => registerUserOnChainByRole(state),
});

export const syncUserOnChainState = async ({ previous = {}, next = {} }) => {
  const prev = normalizeState(previous);
  const target = normalizeState(next);

  assertStateIsSyncable(target, "Updated user");

  if (sameOnChainState(prev, target)) {
    return { changed: false, operations: [] };
  }

  const operations = [];

  if (
    hasOnChainState(prev) &&
    hasOnChainState(target) &&
    prev.role === target.role &&
    prev.walletAddress === target.walletAddress &&
    roleStoresNameOnChain(target.role) &&
    prev.username !== target.username
  ) {
    operations.push(makeClearOperation(prev));
    operations.push(makeRegisterOperation(target));
  } else {
    if (hasOnChainState(target)) {
      operations.push(makeRegisterOperation(target));
    }
    if (hasOnChainState(prev)) {
      operations.push(makeClearOperation(prev));
    }
  }

  const completed = [];

  try {
    for (const operation of operations) {
      const result = await operation.apply();
      completed.push({ ...operation, result });
    }

    return {
      changed: completed.length > 0,
      operations: completed.map(({ label, result }) => ({ label, ...result })),
    };
  } catch (error) {
    const rollbackErrors = [];

    for (let index = completed.length - 1; index >= 0; index -= 1) {
      const operation = completed[index];
      try {
        await operation.compensate();
      } catch (rollbackError) {
        rollbackErrors.push(`${operation.label}: ${extractEthersMessage(rollbackError)}`);
      }
    }

    if (rollbackErrors.length) {
      error.message = `${error.message} Rollback issues: ${rollbackErrors.join("; ")}`;
    }

    throw error;
  }
};
