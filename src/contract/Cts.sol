// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CollegeTokenizedSystem is ReentrancyGuard {

    /* ========== ROLES ========== */

    address public owner;
    uint256 public proposalCount;
    uint256 public constant MAX_SCHOLARSHIP = 10 ether;

    // Voting duration limits
    uint256 public constant MIN_VOTING_DURATION = 30 seconds;
    uint256 public constant MAX_VOTING_DURATION = 30 days;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyCollege() {
        require(colleges[msg.sender].isRegistered, "Not registered college");
        _;
    }

    modifier onlyDaoMember() {
        require(daoMembers[msg.sender], "Not DAO member");
        _;
    }

    /* ========== STRUCTS ========== */

    struct College {
        string name;
        address wallet;
        bool isRegistered;
    }

    struct ScholarshipProposal {
        uint256 id;
        address college;
        address student;
        uint256 amount;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        bool cancelled;
    }

    /* ========== STORAGE ========== */

    mapping(address => College) public colleges;
    mapping(uint256 => ScholarshipProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public daoMembers;

    /* ========== EVENTS ========== */

    event CollegeRegistered(address indexed college, string name);
    event CollegeDeregistered(address indexed college);
    event DaoMemberAdded(address indexed member);

    event ProposalSubmitted(
        uint256 indexed proposalId,
        address indexed college,
        address indexed student,
        uint256 amount,
        uint256 deadline
    );

    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalCancelled(uint256 indexed proposalId);

    event ScholarshipDisbursed(
        uint256 indexed proposalId,
        address indexed student,
        uint256 amount
    );

    /* ========== ADMIN FUNCTIONS ========== */

    function addDaoMember(address _member) external onlyOwner {
        require(_member != address(0), "Invalid address");
        daoMembers[_member] = true;
        emit DaoMemberAdded(_member);
    }

    function registerCollege(address _wallet, string memory _name)
        external
        onlyOwner
    {
        require(_wallet != address(0), "Invalid address");
        require(!colleges[_wallet].isRegistered, "Already registered");

        colleges[_wallet] = College({
            name: _name,
            wallet: _wallet,
            isRegistered: true
        });

        emit CollegeRegistered(_wallet, _name);
    }

    function deregisterCollege(address _wallet) external onlyOwner {
        require(colleges[_wallet].isRegistered, "Not registered");
        colleges[_wallet].isRegistered = false;
        emit CollegeDeregistered(_wallet);
    }

    /* ========== SCHOLARSHIP LOGIC ========== */

    function submitScholarshipProposal(
        address _student,
        uint256 _amount,
        uint256 _votingDuration
    ) external onlyCollege {

        require(_student != address(0), "Invalid student address");
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount <= MAX_SCHOLARSHIP, "Exceeds max scholarship");

        require(
            _votingDuration >= MIN_VOTING_DURATION &&
            _votingDuration <= MAX_VOTING_DURATION,
            "Invalid voting duration"
        );

        proposalCount++;

        uint256 deadline = block.timestamp + _votingDuration;

        proposals[proposalCount] = ScholarshipProposal({
            id: proposalCount,
            college: msg.sender,
            student: _student,
            amount: _amount,
            votesFor: 0,
            votesAgainst: 0,
            deadline: deadline,
            executed: false,
            cancelled: false
        });

        emit ProposalSubmitted(
            proposalCount,
            msg.sender,
            _student,
            _amount,
            deadline
        );
    }

    function voteOnProposal(uint256 _proposalId, bool _support)
        external
        onlyDaoMember
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        if (_support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        hasVoted[_proposalId][msg.sender] = true;

        emit Voted(_proposalId, msg.sender, _support);
    }

    function executeProposal(uint256 _proposalId)
        external
        onlyDaoMember
        nonReentrant
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        require(address(this).balance >= proposal.amount, "Insufficient funds");

        proposal.executed = true;

        (bool success, ) = payable(proposal.student).call{
            value: proposal.amount
        }("");

        require(success, "Transfer failed");

        emit ScholarshipDisbursed(
            _proposalId,
            proposal.student,
            proposal.amount
        );
    }

    function cancelProposal(uint256 _proposalId)
        external
        onlyCollege
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.college == msg.sender, "Not your proposal");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");

        proposal.cancelled = true;

        emit ProposalCancelled(_proposalId);
    }

    /* ========== FUNDING (DAO TREASURY) ========== */

    receive() external payable {}
}
