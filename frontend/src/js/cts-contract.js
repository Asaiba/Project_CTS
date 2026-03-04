import { CTS_CONTRACT_ADDRESS } from "./config.js";
import { ensureSepoliaNetwork } from "./web3.js";

const CTS_ABI = [
  "function owner() view returns (address)",
  "function colleges(address) view returns (string name, address wallet, bool isRegistered)",
  "function students(address) view returns (string username, address wallet, bool isRegistered)",
  "function daoMembers(address) view returns (bool)",
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address college, address student, uint256 amount, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed, bool cancelled)",
  "function hasVoted(uint256,address) view returns (bool)",
  "function voteSupport(uint256,address) view returns (bool)",
  "function daoOfferAmount(uint256,address) view returns (uint256)",
  "function selectedDaoOffer(uint256) view returns (address)",
  "function selectedOfferAmount(uint256) view returns (uint256)",
  "function offerFunded(uint256) view returns (bool)",
  "function pendingPayoutByProposal(uint256) view returns (uint256)",
  "function getDaoOffers(uint256) view returns (address[] daoWallets, uint256[] offerAmounts, bool[] isSelected)",
  "function registerCollege(address _wallet, string _name)",
  "function registerStudent(address _wallet, string _username)",
  "function addDaoMember(address _member)",
  "function submitScholarshipProposal(address _student, uint256 _amount, uint256 _votingDuration)",
  "function voteOnProposal(uint256 _proposalId, bool _support)",
  "function voteOnProposalWithOffer(uint256 _proposalId, bool _support, uint256 _offerAmount)",
  "function chooseDaoOffer(uint256 _proposalId, address _daoMember)",
  "function fundSelectedOffer(uint256 _proposalId) payable",
  "function withdrawScholarship(uint256 _proposalId)",
  "function executeProposal(uint256 _proposalId)",
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

export const submitScholarshipProposalOnChain = async ({ studentAddress, amountEth, votingDurationSeconds }) => {
  const { contract } = await getSignerContract();
  const amountWei = await parseEth(amountEth);
  const tx = await contract.submitScholarshipProposal(studentAddress, amountWei, BigInt(votingDurationSeconds));
  await tx.wait();
  const proposalId = Number(await contract.proposalCount());
  return { txHash: tx.hash, proposalId };
};

export const voteProposalOnChain = async ({ proposalId, support, offerAmountEth = "" }) => {
  const { contract } = await getSignerContract();
  let tx;
  if (Boolean(support)) {
    const offerAmountWei = await parseEth(offerAmountEth);
    tx = await contract.voteOnProposalWithOffer(BigInt(proposalId), true, offerAmountWei);
  } else {
    tx = await contract.voteOnProposal(BigInt(proposalId), false);
  }
  await tx.wait();
  return tx.hash;
};

export const executeProposalOnChain = async (proposalId) => {
  const { contract } = await getSignerContract();
  const tx = await contract.executeProposal(BigInt(proposalId));
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

export const fundSelectedOfferOnChain = async ({ proposalId, amountWei }) => {
  const { contract } = await getSignerContract();
  const tx = await contract.fundSelectedOffer(BigInt(proposalId), { value: amountWei });
  await tx.wait();
  return tx.hash;
};

export const withdrawScholarshipOnChain = async (proposalId) => {
  const { contract } = await getSignerContract();
  const tx = await contract.withdrawScholarship(BigInt(proposalId));
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
    const isActive = !proposal.executed && !proposal.cancelled && !hasEnded;
    const selectedDao = await contract.selectedDaoOffer(BigInt(id));
    const selectedAmountWei = await contract.selectedOfferAmount(BigInt(id));
    const isFunded = await contract.offerFunded(BigInt(id));
    const pendingPayoutWei = await contract.pendingPayoutByProposal(BigInt(id));
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
      amountWei: proposal.amount,
      votesFor,
      votesAgainst,
      deadlineSec,
      deadlineAt: new Date(deadlineSec * 1000).toISOString(),
      executed: proposal.executed,
      cancelled: proposal.cancelled,
      isActive,
      hasEnded,
      remainingMs: Math.max(0, deadlineSec * 1000 - Date.now()),
      hasVoted,
      viewerVoteSupport,
      viewerOfferAmountWei,
      selectedDao,
      selectedAmountWei,
      isFunded,
      pendingPayoutWei,
    });
  }
  return items;
};

const proposalMetaKey = "cts_proposal_meta";

const readMetaStore = () => {
  try {
    return JSON.parse(localStorage.getItem(proposalMetaKey) || "{}");
  } catch (_error) {
    return {};
  }
};

export const saveProposalMetadata = ({ proposalId, title = "", description = "" }) => {
  if (!proposalId) return;
  const store = readMetaStore();
  store[String(proposalId)] = {
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(proposalMetaKey, JSON.stringify(store));
};

export const getProposalMetadata = (proposalId) => {
  const store = readMetaStore();
  return store[String(proposalId)] || null;
};
