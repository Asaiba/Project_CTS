import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const parseEnvFile = (filePath) => {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const entries = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    entries.push([key, value]);
  }
  return Object.fromEntries(entries);
};

const envPath = path.join(repoRoot, "backend", ".env");
const env = parseEnvFile(envPath);

const required = ["ETH_RPC_URL", "CTS_CONTRACT_ADDRESS", "CTS_OWNER_PRIVATE_KEY"];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing ${key} in backend/.env`);
  }
}

const provider = new ethers.JsonRpcProvider(env.ETH_RPC_URL);
const ownerWallet = new ethers.Wallet(env.CTS_OWNER_PRIVATE_KEY, provider);

const ABI = [
  "function owner() view returns (address)",
  "function proposalCount() view returns (uint256)",
  "function registerCollege(address _wallet, string _name)",
  "function registerStudent(address _wallet, string _username)",
  "function addDaoMember(address _member)",
  "function deregisterCollege(address _wallet)",
  "function deregisterStudent(address _wallet)",
  "function removeDaoMember(address _wallet)",
  "function submitProposal(address _student, uint256 _schoolFees, uint256 _votingDuration)",
  "function voteWithOffer(uint256 _proposalId, uint256 _offerAmount)",
  "function chooseDaoOffer(uint256 _proposalId, address _daoMember)",
  "function fundOffer(uint256 _proposalId) payable",
  "function claimFunds(uint256 _proposalId)",
  "function pendingStudentPayout(uint256) view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address college, address student, uint256 schoolFees, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool funded, bool claimed, bool cancelled)",
  "function selectedDaoOffer(uint256) view returns (address)",
  "function selectedOfferAmount(uint256) view returns (uint256)",
  "function colleges(address) view returns (string name, address wallet, bool isRegistered)",
  "function students(address) view returns (string username, address wallet, bool isRegistered)",
  "function daoMembers(address) view returns (bool)",
];

const contract = new ethers.Contract(env.CTS_CONTRACT_ADDRESS, ABI, ownerWallet);

const short = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForChainTimestamp = async (targetTimestamp) => {
  let latestBlock = await provider.getBlock("latest");
  while (!latestBlock || Number(latestBlock.timestamp) < Number(targetTimestamp)) {
    console.log(
      `Waiting for chain time... latest ${latestBlock ? latestBlock.timestamp : "unknown"} / target ${targetTimestamp}`,
    );
    await sleep(5000);
    latestBlock = await provider.getBlock("latest");
  }
};

const sendEth = async (to, amountWei, label) => {
  const tx = await ownerWallet.sendTransaction({ to, value: amountWei });
  const receipt = await tx.wait();
  console.log(`Funded ${label}: ${short(to)} | tx ${tx.hash} | gas ${receipt.gasUsed.toString()}`);
};

const cleanupRole = async (label, fn) => {
  try {
    const tx = await fn();
    await tx.wait();
    console.log(`Cleanup ok: ${label}`);
  } catch (error) {
    console.log(`Cleanup skipped/failed for ${label}: ${error.shortMessage || error.message}`);
  }
};

const main = async () => {
  const network = await provider.getNetwork();
  console.log(`Connected chain: ${network.name} (${network.chainId})`);
  if (Number(network.chainId) !== 11155111) {
    throw new Error(`Expected Sepolia (11155111), got ${network.chainId}`);
  }

  const contractOwner = await contract.owner();
  if (contractOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
    throw new Error(`Configured owner wallet ${ownerWallet.address} is not the contract owner ${contractOwner}`);
  }

  const ownerBalanceStart = await provider.getBalance(ownerWallet.address);
  console.log(`Owner wallet: ${ownerWallet.address}`);
  console.log(`Owner starting balance: ${ethers.formatEther(ownerBalanceStart)} ETH`);

  const collegeWallet = ethers.Wallet.createRandom().connect(provider);
  const studentWallet = ethers.Wallet.createRandom().connect(provider);
  const daoWallet = ethers.Wallet.createRandom().connect(provider);

  console.log(`Test college wallet: ${collegeWallet.address}`);
  console.log(`Test student wallet: ${studentWallet.address}`);
  console.log(`Test DAO wallet: ${daoWallet.address}`);

  const gasTopupCollege = ethers.parseEther("0.004");
  const gasTopupStudent = ethers.parseEther("0.004");
  const gasTopupDao = ethers.parseEther("0.008");
  const schoolFeesWei = ethers.parseEther("0.0012");
  const daoOfferWei = ethers.parseEther("0.0019");
  const expectedStudentPayout = daoOfferWei - schoolFeesWei;
  const offerWindowSeconds = 31n;

  await sendEth(collegeWallet.address, gasTopupCollege, "college gas");
  await sendEth(studentWallet.address, gasTopupStudent, "student gas");
  await sendEth(daoWallet.address, gasTopupDao, "dao gas+offer");

  console.log("Registering wallets on-chain...");
  await (await contract.registerCollege(collegeWallet.address, "Test College")).wait();
  await (await contract.registerStudent(studentWallet.address, "teststudent")).wait();
  await (await contract.addDaoMember(daoWallet.address)).wait();

  const collegeRow = await contract.colleges(collegeWallet.address);
  const studentRow = await contract.students(studentWallet.address);
  const daoRegistered = await contract.daoMembers(daoWallet.address);
  if (!collegeRow.isRegistered || !studentRow.isRegistered || !daoRegistered) {
    throw new Error("One or more test wallets did not register correctly on-chain.");
  }
  console.log("Registrations confirmed.");

  const collegeContract = contract.connect(collegeWallet);
  const studentContract = contract.connect(studentWallet);
  const daoContract = contract.connect(daoWallet);

  console.log("Submitting proposal...");
  const submitTx = await collegeContract.submitProposal(studentWallet.address, schoolFeesWei, offerWindowSeconds);
  await submitTx.wait();
  const proposalId = Number(await contract.proposalCount());
  console.log(`Proposal created: #${proposalId} | tx ${submitTx.hash}`);

  console.log("DAO sends an offer...");
  const offerTx = await daoContract.voteWithOffer(BigInt(proposalId), daoOfferWei);
  await offerTx.wait();
  console.log(`Offer submitted: ${ethers.formatEther(daoOfferWei)} ETH | tx ${offerTx.hash}`);

  const proposalAfterVote = await contract.proposals(BigInt(proposalId));
  console.log(`Votes for after offer: ${proposalAfterVote.votesFor.toString()}`);

  console.log("Waiting for offer window to end...");
  await waitForChainTimestamp(Number(proposalAfterVote.deadline) + 1);

  console.log("Student chooses the DAO offer...");
  const chooseTx = await studentContract.chooseDaoOffer(BigInt(proposalId), daoWallet.address);
  await chooseTx.wait();
  console.log(`DAO selected | tx ${chooseTx.hash}`);

  const selectedDao = await contract.selectedDaoOffer(BigInt(proposalId));
  const selectedAmount = await contract.selectedOfferAmount(BigInt(proposalId));
  if (selectedDao.toLowerCase() !== daoWallet.address.toLowerCase()) {
    throw new Error("Selected DAO wallet does not match the expected DAO.");
  }
  if (selectedAmount !== daoOfferWei) {
    throw new Error("Selected DAO offer amount does not match the expected amount.");
  }

  const collegeBalanceBeforeFund = await provider.getBalance(collegeWallet.address);
  console.log(`College balance before fund: ${ethers.formatEther(collegeBalanceBeforeFund)} ETH`);

  console.log("Selected DAO funds the proposal...");
  const fundTx = await daoContract.fundOffer(BigInt(proposalId), { value: daoOfferWei });
  await fundTx.wait();
  console.log(`Funding tx sent | tx ${fundTx.hash}`);

  const collegeBalanceAfterFund = await provider.getBalance(collegeWallet.address);
  const collegeReceived = collegeBalanceAfterFund - collegeBalanceBeforeFund;
  const pendingPayoutAfterFund = await contract.pendingStudentPayout(BigInt(proposalId));
  const proposalAfterFund = await contract.proposals(BigInt(proposalId));

  console.log(`College received: ${ethers.formatEther(collegeReceived)} ETH`);
  console.log(`Pending student payout: ${ethers.formatEther(pendingPayoutAfterFund)} ETH`);

  if (collegeReceived !== schoolFeesWei) {
    throw new Error(
      `College received ${ethers.formatEther(collegeReceived)} ETH, expected ${ethers.formatEther(schoolFeesWei)} ETH`,
    );
  }
  if (pendingPayoutAfterFund !== expectedStudentPayout) {
    throw new Error(
      `Pending student payout ${ethers.formatEther(pendingPayoutAfterFund)} ETH, expected ${ethers.formatEther(expectedStudentPayout)} ETH`,
    );
  }
  if (!proposalAfterFund.funded) {
    throw new Error("Proposal is not marked funded after fundOffer.");
  }

  const studentBalanceBeforeClaim = await provider.getBalance(studentWallet.address);
  console.log(`Student balance before claim: ${ethers.formatEther(studentBalanceBeforeClaim)} ETH`);

  console.log("Student claims the remaining payout...");
  const claimTx = await studentContract.claimFunds(BigInt(proposalId));
  const claimReceipt = await claimTx.wait();
  const studentBalanceAfterClaim = await provider.getBalance(studentWallet.address);
  const claimFee = claimReceipt.fee ?? (claimReceipt.gasUsed * claimReceipt.gasPrice);
  const normalizedStudentGain = studentBalanceAfterClaim + claimFee - studentBalanceBeforeClaim;
  const pendingPayoutAfterClaim = await contract.pendingStudentPayout(BigInt(proposalId));
  const proposalAfterClaim = await contract.proposals(BigInt(proposalId));

  console.log(`Student net received (after adding gas back): ${ethers.formatEther(normalizedStudentGain)} ETH`);
  console.log(`Pending payout after claim: ${ethers.formatEther(pendingPayoutAfterClaim)} ETH`);

  if (normalizedStudentGain !== expectedStudentPayout) {
    throw new Error(
      `Student received ${ethers.formatEther(normalizedStudentGain)} ETH, expected ${ethers.formatEther(expectedStudentPayout)} ETH`,
    );
  }
  if (pendingPayoutAfterClaim !== 0n) {
    throw new Error("Pending student payout did not clear after claim.");
  }
  if (!proposalAfterClaim.claimed) {
    throw new Error("Proposal is not marked claimed after claimFunds.");
  }

  console.log("");
  console.log("TEST PASSED");
  console.log(`Proposal #${proposalId}`);
  console.log(`School fees to college: ${ethers.formatEther(schoolFeesWei)} ETH`);
  console.log(`Student payout after claim: ${ethers.formatEther(expectedStudentPayout)} ETH`);

  console.log("");
  console.log("Cleaning up test role registrations...");
  await cleanupRole("DAO member", () => contract.removeDaoMember(daoWallet.address));
  await cleanupRole("Student", () => contract.deregisterStudent(studentWallet.address));
  await cleanupRole("College", () => contract.deregisterCollege(collegeWallet.address));

  const ownerBalanceEnd = await provider.getBalance(ownerWallet.address);
  console.log(`Owner ending balance: ${ethers.formatEther(ownerBalanceEnd)} ETH`);
};

main().catch((error) => {
  console.error("TEST FAILED");
  console.error(error.shortMessage || error.message || error);
  process.exitCode = 1;
});
