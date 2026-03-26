import { CTS_CONTRACT_ADDRESS } from "./config.js";
import { ensureSepoliaNetwork } from "./web3.js";

const CTS_ABI = [
  "function owner() view returns (address)",
  "function colleges(address) view returns (string name, address wallet, bool isRegistered)",
  "function students(address) view returns (string username, address wallet, bool isRegistered)",
  "function daoMembers(address) view returns (bool)",
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address college, address student, uint256 schoolFees, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool funded, bool claimed, bool cancelled)",
  "function hasVoted(uint256,address) view returns (bool)",
  "function voteSupport(uint256,address) view returns (bool)",
  "function daoOfferAmount(uint256,address) view returns (uint256)",
  "function selectedDaoOffer(uint256) view returns (address)",
  "function selectedOfferAmount(uint256) view returns (uint256)",
  "function offerFunded(uint256) view returns (bool)",
  "function pendingStudentPayout(uint256) view returns (uint256)",
  "function getDaoOffers(uint256) view returns (address[] daoWallets, uint256[] offerAmounts, bool[] isSelected)",
  "function registerCollege(address _wallet, string _name)",
  "function registerStudent(address _wallet, string _username)",
  "function addDaoMember(address _member)",
  "function submitProposal(address _student, uint256 _schoolFees, uint256 _votingDuration)",
  "function voteWithOffer(uint256 _proposalId, uint256 _offerAmount)",
  "function voteAgainst(uint256 _proposalId)",
  "function chooseDaoOffer(uint256 _proposalId, address _daoMember)",
  "function fundOffer(uint256 _proposalId) payable",
  "function claimFunds(uint256 _proposalId)",
  "function cancelProposal(uint256 _proposalId)",
];

const loadEthers = async () => import("https://cdn.jsdelivr.net/npm/ethers@6.13.4/+esm");

const getProvider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  await ensureSepoliaNetwork();
  const { BrowserProvider } = await loadEthers();
  return new BrowserProvider(window.ethereum);
};

const getSignerContract = async () => {
  const { Contract } = await loadEthers();
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const contract = new Contract(CTS_CONTRACT_ADDRESS, CTS_ABI, signer);
  return { provider, signer, contract };
};

const getReadContract = async () => {
  const { Contract } = await loadEthers();
  const provider = await getProvider();
  const contract = new Contract(CTS_CONTRACT_ADDRESS, CTS_ABI, provider);
  return { provider, contract };
};

export const parseEth = async (value) => {
  const { parseEther } = await loadEthers();
  return parseEther(String(value || "0"));
};

export const formatEth = async (weiValue) => {
  const { formatEther } = await loadEthers();
  return Number(formatEther(weiValue)).toFixed(4);
};

export const getConnectedAddress = async () => {
  const { signer } = await getSignerContract();
  return signer.getAddress();
};

export const isCollegeRegisteredOnChain = async (walletAddress) => {
  if (!walletAddress) return false;
  const { contract } = await getReadContract();
  const college = await contract.colleges(walletAddress);
  return Boolean(college?.isRegistered);
};

export const getContractOwnerAddress = async () => {
  const { contract } = await getReadContract();
  return contract.owner();
};

export const registerCollegeOnChain = async ({ walletAddress, collegeName }) => {
  if (!walletAddress) throw new Error("Wallet address is required.");
  const trimmedName = String(collegeName || "").trim();
  if (!trimmedName) throw new Error("College name is required.");
  const { contract } = await getSignerContract();
  const tx = await contract.registerCollege(walletAddress, trimmedName);
  await tx.wait();
  return tx.hash;
};

export const isStudentRegisteredOnChain = async (walletAddress) => {
  if (!walletAddress) return false;
  const { contract } = await getReadContract();
  const student = await contract.students(walletAddress);
  return Boolean(student?.isRegistered);
};

export const registerStudentOnChain = async (walletAddress, username = "") => {
  if (!walletAddress) throw new Error("Wallet address is required.");
  const trimmedUsername = String(username || "").trim();
  if (trimmedUsername.length < 2) throw new Error("Student username is required.");
  const { contract } = await getSignerContract();
  const tx = await contract.registerStudent(walletAddress, trimmedUsername);
  await tx.wait();
  return tx.hash;
};

export const isDaoMemberOnChain = async (walletAddress) => {
  if (!walletAddress) return false;
  const { contract } = await getReadContract();
  return Boolean(await contract.daoMembers(walletAddress));
};

export const addDaoMemberOnChain = async (walletAddress) => {
  if (!walletAddress) throw new Error("Wallet address is required.");
  const { contract } = await getSignerContract();
  const tx = await contract.addDaoMember(walletAddress);
  await tx.wait();
  return tx.hash;
};

/**
 * College submits a proposal for a student.
 * @param {string} studentAddress - Student's wallet address.
 * @param {string} schoolFeesEth  - Fixed school fees in ETH (floor for DAO offers).
 * @param {number} offerWindowSeconds - Seconds DAO members have to respond with an offer or pass.
 */
export const submitProposalOnChain = async ({
  studentAddress,
  schoolFeesEth,
  offerWindowSeconds,
  votingDurationSeconds,
}) => {
  const { contract } = await getSignerContract();
  const schoolFeesWei = await parseEth(schoolFeesEth);
  const windowSeconds = offerWindowSeconds ?? votingDurationSeconds;
  if (windowSeconds == null) {
    throw new Error("Offer window duration is required.");
  }
  const tx = await contract.submitProposal(studentAddress, schoolFeesWei, BigInt(windowSeconds));
  await tx.wait();
  const proposalId = Number(await contract.proposalCount());
  return { txHash: tx.hash, proposalId };
};

/**
 * DAO member records a response by submitting an offer or passing.
 * Legacy vote naming is kept here to match the contract ABI.
 * @param {string|number} proposalId
 * @param {boolean} support
 * @param {string} [offerAmountEth] - Required when support=true; must be >= schoolFees.
 */
export const voteProposalOnChain = async ({ proposalId, support, offerAmountEth = "" }) => {
  const { contract } = await getSignerContract();
  let tx;
  if (Boolean(support)) {
    const offerWei = await parseEth(offerAmountEth);
    tx = await contract.voteWithOffer(BigInt(proposalId), offerWei);
  } else {
    tx = await contract.voteAgainst(BigInt(proposalId));
  }
  await tx.wait();
  return tx.hash;
};

export const cancelProposalOnChain = async (proposalId) => {
  const { contract } = await getSignerContract();
  const tx = await contract.cancelProposal(BigInt(proposalId));
  await tx.wait();
  return tx.hash;
};

export const chooseDaoOfferOnChain = async ({ proposalId, daoWallet }) => {
  const { contract } = await getSignerContract();
  const tx = await contract.chooseDaoOffer(BigInt(proposalId), daoWallet);
  await tx.wait();
  return tx.hash;
};

/**
 * Selected DAO member sends exactly their offer amount to fund the proposal.
 * School fees are auto-forwarded to the college; the rest is held for the student.
 */
export const fundSelectedOfferOnChain = async ({ proposalId, amountWei }) => {
  const { contract } = await getSignerContract();
  const tx = await contract.fundOffer(BigInt(proposalId), { value: amountWei });
  await tx.wait();
  return tx.hash;
};

/**
 * Student claims their share (offer amount minus school fees).
 */
export const claimFundsOnChain = async (proposalId) => {
  const { contract } = await getSignerContract();
  const tx = await contract.claimFunds(BigInt(proposalId));
  await tx.wait();
  return tx.hash;
};

export const listDaoOffersOnChain = async (proposalId) => {
  const { contract } = await getReadContract();
  const [wallets, amounts, selectedFlags] = await contract.getDaoOffers(BigInt(proposalId));
  return wallets.map((wallet, index) => ({
    daoWallet: wallet,
    amountWei: amounts[index],
    isSelected: Boolean(selectedFlags[index]),
  }));
};

export const listProposalsOnChain = async ({ maxItems = 100, viewerAddress = "" } = {}) => {
  const { contract } = await getReadContract();
  const total = Number(await contract.proposalCount());
  const now = Math.floor(Date.now() / 1000);
  const items = [];
  const start = Math.max(1, total - maxItems + 1);

  for (let id = total; id >= start; id -= 1) {
    const proposal = await contract.proposals(BigInt(id));
    const votesFor = Number(proposal.votesFor);
    const votesAgainst = Number(proposal.votesAgainst);
    const deadlineSec = Number(proposal.deadline);
    const hasEnded = deadlineSec <= now;
    const isActive = !proposal.funded && !proposal.cancelled && !hasEnded;
    const selectedDao = await contract.selectedDaoOffer(BigInt(id));
    const selectedAmountWei = await contract.selectedOfferAmount(BigInt(id));
    const isFunded = Boolean(proposal.funded);
    const pendingPayoutWei = await contract.pendingStudentPayout(BigInt(id));
    let hasVoted = false;
    let viewerVoteSupport = false;
    let viewerOfferAmountWei = 0n;
    if (viewerAddress) {
      hasVoted = await contract.hasVoted(BigInt(id), viewerAddress);
      if (hasVoted) {
        viewerVoteSupport = await contract.voteSupport(BigInt(id), viewerAddress);
        viewerOfferAmountWei = await contract.daoOfferAmount(BigInt(id), viewerAddress);
      }
    }
    items.push({
      id,
      college: proposal.college,
      student: proposal.student,
      amountWei: proposal.schoolFees,   // schoolFees is the "amount" for display purposes
      schoolFeesWei: proposal.schoolFees,
      votesFor,
      votesAgainst,
      deadlineSec,
      deadlineAt: new Date(deadlineSec * 1000).toISOString(),
      executed: isFunded,               // kept for backwards compat with history page
      claimed: Boolean(proposal.claimed),
      cancelled: Boolean(proposal.cancelled),
      isFunded,
      isActive,
      hasEnded,
      remainingMs: Math.max(0, deadlineSec * 1000 - Date.now()),
      hasVoted,
      viewerVoteSupport,
      viewerOfferAmountWei,
      selectedDao,
      selectedAmountWei,
      pendingPayoutWei,
    });
  }
  return items;
};

const proposalMetaKey = "cts_proposal_meta";
const normalizeAddress = (value = "") => String(value || "").trim().toLowerCase();
const normalizeText = (value = "") => String(value || "").trim().replace(/\s+/g, " ");

const readMetaStore = () => {
  try {
    return JSON.parse(localStorage.getItem(proposalMetaKey) || "{}");
  } catch (_error) {
    return {};
  }
};

export const saveProposalMetadata = ({
  proposalId,
  title = "",
  description = "",
  essay = "",
  applicationId = "",
  studentWallet = "",
  collegeWallet = "",
}) => {
  if (!proposalId) return;
  const trimmedDescription = String(description || "").trim();
  const trimmedEssay = String(essay || trimmedDescription).trim();
  const store = readMetaStore();
  store[String(proposalId)] = {
    title: String(title || "").trim(),
    description: trimmedDescription,
    essay: trimmedEssay,
    applicationId: String(applicationId || "").trim(),
    studentWallet: String(studentWallet || "").trim(),
    collegeWallet: String(collegeWallet || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(proposalMetaKey, JSON.stringify(store));
};

export const getProposalMetadata = (proposalId) => {
  const store = readMetaStore();
  const entry = store[String(proposalId)] || null;
  if (!entry) return null;
  return {
    ...entry,
    essay: String(entry.essay || entry.description || "").trim(),
  };
};

const applicationStatusLabel = (statusKey = "") => {
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    offer_window_open: "Offer Window Open",
    offers_received: "Offers Received",
    awaiting_funding: "Awaiting Funding",
    funded: "Funded",
    funded_claimed: "Funded / Claimed",
    no_offers: "No DAO Offers",
    cancelled: "Cancelled",
  };
  return labels[statusKey] || "Pending";
};

const proposalMatchesApplication = ({ proposal, application, viewerWallet = "" }) => {
  const metadata = getProposalMetadata(proposal.id) || {};
  const applicationId = String(application?.id || "").trim();
  if (applicationId && metadata.applicationId && String(metadata.applicationId) === applicationId) {
    return true;
  }

  const proposalStudent = normalizeAddress(proposal.student);
  const proposalCollege = normalizeAddress(proposal.college);
  const appStudent = normalizeAddress(viewerWallet || metadata.studentWallet);
  const appCollege = normalizeAddress(application?.college?.walletAddress || metadata.collegeWallet);
  if (!proposalStudent || !proposalCollege || !appStudent || !appCollege) {
    return false;
  }
  if (proposalStudent !== appStudent || proposalCollege !== appCollege) {
    return false;
  }

  const appEssay = normalizeText(application?.essay || application?.message || application?.description || application?.title || "");
  const proposalEssay = normalizeText(metadata.essay || "");
  if (appEssay && proposalEssay) {
    return appEssay === proposalEssay;
  }

  return true;
};

export const resolveApplicationDisplayStatus = ({ application, proposals = [], viewerWallet = "" }) => {
  const baseStatus = String(application?.status || "pending").toLowerCase();
  const matched = proposals
    .filter((proposal) => proposalMatchesApplication({ proposal, application, viewerWallet }))
    .sort((left, right) => Number(right.id || 0) - Number(left.id || 0));

  const proposal = matched[0];
  if (!proposal) {
    return {
      key: baseStatus,
      label: applicationStatusLabel(baseStatus),
      proposalId: null,
      source: "application",
    };
  }

  let key = baseStatus;
  if (proposal.cancelled) {
    key = "cancelled";
  } else if (proposal.isFunded) {
    key = proposal.claimed ? "funded_claimed" : "funded";
  } else if (proposal.hasEnded && Number(proposal.votesFor || 0) === 0) {
    key = "no_offers";
  } else if (proposal.selectedDao) {
    key = "awaiting_funding";
  } else if (proposal.hasEnded && Number(proposal.votesFor || 0) > 0) {
    key = "offers_received";
  } else if (proposal.isActive) {
    key = "offer_window_open";
  }

  return {
    key,
    label: applicationStatusLabel(key),
    proposalId: proposal.id,
    source: "proposal",
  };
};
