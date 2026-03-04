// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CollegeTokenizedSystem is ReentrancyGuard {

    /* ========== ROLES ========== */

    address public owner;
    uint256 public proposalCount;
    uint256 public constant MAX_SCHOLARSHIP = 10 ether;
    uint256 public constant MIN_NAME_LENGTH = 2;
    uint256 public constant MAX_NAME_LENGTH = 60;

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

    modifier onlyStudent() {
        require(students[msg.sender].isRegistered, "Not registered student");
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
        uint256 amount; // Requested amount (set by college)
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        bool cancelled;
    }

    struct Student {
        string username;
        address wallet;
        bool isRegistered;
    }

    /* ========== STORAGE ========== */

    mapping(address => College) public colleges;
    mapping(uint256 => ScholarshipProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteSupport;
    mapping(uint256 => mapping(address => uint256)) public daoOfferAmount;
    mapping(uint256 => address[]) private proposalOfferMembers;
    mapping(uint256 => address) public selectedDaoOffer;
    mapping(uint256 => uint256) public selectedOfferAmount;
    mapping(uint256 => bool) public offerFunded;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => uint256) public pendingPayoutByProposal;
    mapping(address => bool) public daoMembers;
    mapping(address => Student) public students;

    /* ========== EVENTS ========== */

    event CollegeRegistered(address indexed college, string name);
    event CollegeDeregistered(address indexed college);
    event DaoMemberAdded(address indexed member);
    event DaoMemberRemoved(address indexed member);
    event StudentRegistered(address indexed student, string username);
    event StudentDeregistered(address indexed student);

    event ProposalSubmitted(
        uint256 indexed proposalId,
        address indexed college,
        address indexed student,
        uint256 amount,
        uint256 deadline
    );

    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event DaoOfferSubmitted(
        uint256 indexed proposalId,
        address indexed daoMember,
        uint256 offerAmount,
        bool support
    );
    event DaoOfferSelected(
        uint256 indexed proposalId,
        address indexed student,
        address indexed daoMember,
        uint256 offerAmount
    );
    event DaoOfferFunded(
        uint256 indexed proposalId,
        address indexed daoMember,
        address indexed student,
        uint256 amount
    );
    event ScholarshipWithdrawn(
        uint256 indexed proposalId,
        address indexed student,
        uint256 amount
    );
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

    function removeDaoMember(address _member) external onlyOwner {
        require(_member != address(0), "Invalid address");
        require(daoMembers[_member], "Not DAO member");
        daoMembers[_member] = false;
        emit DaoMemberRemoved(_member);
    }

    function registerStudent(address _wallet, string memory _username) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        uint256 usernameLen = bytes(_username).length;
        require(usernameLen >= MIN_NAME_LENGTH && usernameLen <= MAX_NAME_LENGTH, "Invalid username");
        require(!students[_wallet].isRegistered, "Already registered");
        students[_wallet] = Student({
            username: _username,
            wallet: _wallet,
            isRegistered: true
        });
        emit StudentRegistered(_wallet, _username);
    }

    function deregisterStudent(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        require(students[_wallet].isRegistered, "Not registered");
        students[_wallet].isRegistered = false;
        emit StudentDeregistered(_wallet);
    }

    function registerCollege(address _wallet, string memory _name)
        external
        onlyOwner
    {
        require(_wallet != address(0), "Invalid address");
        uint256 nameLen = bytes(_name).length;
        require(nameLen >= MIN_NAME_LENGTH && nameLen <= MAX_NAME_LENGTH, "Invalid college name");
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
        require(students[_student].isRegistered, "Student not registered");
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
        _voteOnProposalInternal(_proposalId, _support, 0);
    }

    function voteOnProposalWithOffer(
        uint256 _proposalId,
        bool _support,
        uint256 _offerAmount
    ) external onlyDaoMember {
        _voteOnProposalInternal(_proposalId, _support, _offerAmount);
    }

    function _voteOnProposalInternal(
        uint256 _proposalId,
        bool _support,
        uint256 _offerAmount
    ) internal {
        ScholarshipProposal storage proposal = proposals[_proposalId];

        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        if (_support) {
            require(_offerAmount > 0, "Offer amount required");
            require(_offerAmount <= MAX_SCHOLARSHIP, "Offer exceeds max scholarship");
            require(_offerAmount <= proposal.amount, "Offer exceeds requested amount");
        }

        if (_support) {
            proposal.votesFor++;
            daoOfferAmount[_proposalId][msg.sender] = _offerAmount;
            proposalOfferMembers[_proposalId].push(msg.sender);
        } else {
            proposal.votesAgainst++;
        }

        hasVoted[_proposalId][msg.sender] = true;
        voteSupport[_proposalId][msg.sender] = _support;

        emit Voted(_proposalId, msg.sender, _support);
        emit DaoOfferSubmitted(_proposalId, msg.sender, _offerAmount, _support);
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
        require(selectedDaoOffer[_proposalId] != address(0), "Student has not selected DAO offer");
        require(offerFunded[_proposalId], "Selected DAO offer not funded yet");

        proposal.executed = true;

        emit ScholarshipDisbursed(_proposalId, proposal.student, selectedOfferAmount[_proposalId]);
    }

    function chooseDaoOffer(uint256 _proposalId, address _daoMember)
        external
        onlyStudent
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(proposal.student == msg.sender, "Not your proposal");
        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        require(selectedDaoOffer[_proposalId] == address(0), "DAO offer already selected");
        require(daoMembers[_daoMember], "Selected wallet is not DAO member");
        require(hasVoted[_proposalId][_daoMember], "DAO member did not vote");
        require(voteSupport[_proposalId][_daoMember], "DAO member vote was not YES");
        uint256 offerAmount = daoOfferAmount[_proposalId][_daoMember];
        require(offerAmount > 0, "No DAO offer from selected wallet");

        selectedDaoOffer[_proposalId] = _daoMember;
        selectedOfferAmount[_proposalId] = offerAmount;

        emit DaoOfferSelected(_proposalId, msg.sender, _daoMember, offerAmount);
    }

    function fundSelectedOffer(uint256 _proposalId)
        external
        payable
        onlyDaoMember
        nonReentrant
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        require(selectedDaoOffer[_proposalId] != address(0), "Student has not selected DAO offer");
        require(msg.sender == selectedDaoOffer[_proposalId], "Not selected DAO wallet");
        require(!offerFunded[_proposalId], "Offer already funded");
        require(msg.value == selectedOfferAmount[_proposalId], "Incorrect funding amount");

        offerFunded[_proposalId] = true;
        pendingWithdrawals[proposal.student] += msg.value;
        pendingPayoutByProposal[_proposalId] = msg.value;

        emit DaoOfferFunded(_proposalId, msg.sender, proposal.student, msg.value);
    }

    function withdrawScholarship(uint256 _proposalId)
        external
        nonReentrant
        onlyStudent
    {
        ScholarshipProposal storage proposal = proposals[_proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.student == msg.sender, "Not your proposal");
        require(offerFunded[_proposalId], "Offer not funded");

        uint256 amount = pendingPayoutByProposal[_proposalId];
        require(amount > 0, "No pending payout");

        pendingPayoutByProposal[_proposalId] = 0;
        pendingWithdrawals[msg.sender] -= amount;
        proposal.executed = true;

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Withdraw transfer failed");

        emit ScholarshipWithdrawn(_proposalId, msg.sender, amount);
        emit ScholarshipDisbursed(_proposalId, msg.sender, amount);
    }

    function getDaoOffers(uint256 _proposalId)
        external
        view
        returns (
            address[] memory daoWallets,
            uint256[] memory offerAmounts,
            bool[] memory isSelected
        )
    {
        require(proposals[_proposalId].id != 0, "Proposal does not exist");
        address[] storage members = proposalOfferMembers[_proposalId];
        uint256 len = members.length;
        daoWallets = new address[](len);
        offerAmounts = new uint256[](len);
        isSelected = new bool[](len);
        address selected = selectedDaoOffer[_proposalId];

        for (uint256 i = 0; i < len; i++) {
            address daoWallet = members[i];
            daoWallets[i] = daoWallet;
            offerAmounts[i] = daoOfferAmount[_proposalId][daoWallet];
            isSelected[i] = (selected == daoWallet);
        }
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
