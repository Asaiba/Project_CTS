// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * CollegeTokenizedSystem
 *
 * Flow:
 *  1. Student submits an essay-based application off-chain (backend only).
 *  2. College approves it, then calls submitProposal() with:
 *       - student wallet
 *       - schoolFees  (fixed floor — DAO cannot offer below this, auto-sent to college)
 *       - offer window duration
 *  3. DAO members respond with either a YES offer (must be >= schoolFees)
 *     or a NO pass with no amount attached.
 *     The excess over schoolFees is what the student receives.
 *  4. After the offer window ends, if at least one YES offer exists:
 *       - Student calls chooseDaoOffer() to pick the DAO member whose offer they prefer.
 *  5. The chosen DAO member calls fundOffer() sending exactly their offerAmount:
 *       - schoolFees  → instantly forwarded to the college wallet.
 *       - remainder   → held in contract for the student.
 *  6. Student calls claimFunds() to receive their share.
 */
contract CollegeTokenizedSystem is ReentrancyGuard {

    /* ─────────────────────── CONSTANTS ─────────────────────── */

    address public owner;
    uint256 public proposalCount;

    uint256 public constant MAX_OFFER           = 10 ether;
    uint256 public constant MIN_NAME_LENGTH     = 2;
    uint256 public constant MAX_NAME_LENGTH     = 60;
    uint256 public constant MIN_VOTING_DURATION = 30 seconds;
    uint256 public constant MAX_VOTING_DURATION = 30 days;

    /* ─────────────────────── CONSTRUCTOR ───────────────────── */

    constructor() {
        owner = msg.sender;
    }

    /* ─────────────────────── MODIFIERS ─────────────────────── */

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

    /* ─────────────────────── STRUCTS ───────────────────────── */

    struct College {
        string  name;
        address wallet;
        bool    isRegistered;
    }

    struct Student {
        string  username;
        address wallet;
        bool    isRegistered;
    }

    struct Proposal {
        uint256 id;
        address college;     // receives schoolFees automatically on funding
        address student;     // receives (offerAmount - schoolFees) on claim
        uint256 schoolFees;  // fixed floor: minimum any DAO offer must cover; auto-sent to college
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool    funded;      // true once the selected DAO member calls fundOffer()
        bool    claimed;     // true once the student calls claimFunds()
        bool    cancelled;
    }

    /* ─────────────────────── STORAGE ───────────────────────── */

    mapping(address => College)                   public colleges;
    mapping(address => Student)                   public students;
    mapping(address => bool)                      public daoMembers;
    mapping(uint256 => Proposal)                  public proposals;

    // per-proposal response and offer state
    mapping(uint256 => mapping(address => bool))    public hasVoted;
    mapping(uint256 => mapping(address => bool))    public voteSupport;
    mapping(uint256 => mapping(address => uint256)) public daoOfferAmount;
    mapping(uint256 => address[])                   private offerMembers;

    // selection & funding state
    mapping(uint256 => address)  public selectedDaoOffer;    // DAO member chosen by student
    mapping(uint256 => uint256)  public selectedOfferAmount; // their offer amount
    mapping(uint256 => bool)     public offerFunded;
    mapping(uint256 => uint256)  public pendingStudentPayout; // offer - schoolFees

    /* ─────────────────────── EVENTS ────────────────────────── */

    event CollegeRegistered   (address indexed college, string name);
    event CollegeDeregistered (address indexed college);
    event DaoMemberAdded      (address indexed member);
    event DaoMemberRemoved    (address indexed member);
    event StudentRegistered   (address indexed student, string username);
    event StudentDeregistered (address indexed student);

    event ProposalSubmitted(
        uint256 indexed proposalId,
        address indexed college,
        address indexed student,
        uint256 schoolFees,
        uint256 deadline
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool    support,
        uint256 offerAmount  // 0 when declining
    );

    event DaoOfferSelected(
        uint256 indexed proposalId,
        address indexed student,
        address indexed daoMember,
        uint256 offerAmount
    );

    event OfferFunded(
        uint256 indexed proposalId,
        address indexed daoMember,
        address indexed college,
        uint256 schoolFees,
        uint256 studentShare
    );

    event FundsClaimed(
        uint256 indexed proposalId,
        address indexed student,
        uint256 amount
    );

    event ProposalCancelled(uint256 indexed proposalId);

    /* ─────────────────────── ADMIN ─────────────────────────── */

    function addDaoMember(address _member) external onlyOwner {
        require(_member != address(0), "Invalid address");
        require(!daoMembers[_member], "Already DAO member");
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
        uint256 len = bytes(_username).length;
        require(len >= MIN_NAME_LENGTH && len <= MAX_NAME_LENGTH, "Invalid username length");
        require(!students[_wallet].isRegistered, "Already registered");
        students[_wallet] = Student({ username: _username, wallet: _wallet, isRegistered: true });
        emit StudentRegistered(_wallet, _username);
    }

    function deregisterStudent(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        require(students[_wallet].isRegistered, "Not registered");
        students[_wallet].isRegistered = false;
        emit StudentDeregistered(_wallet);
    }

    function registerCollege(address _wallet, string memory _name) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        uint256 len = bytes(_name).length;
        require(len >= MIN_NAME_LENGTH && len <= MAX_NAME_LENGTH, "Invalid college name length");
        require(!colleges[_wallet].isRegistered, "Already registered");
        colleges[_wallet] = College({ name: _name, wallet: _wallet, isRegistered: true });
        emit CollegeRegistered(_wallet, _name);
    }

    function deregisterCollege(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        require(colleges[_wallet].isRegistered, "Not registered");
        colleges[_wallet].isRegistered = false;
        emit CollegeDeregistered(_wallet);
    }

    /* ─────────────────────── PROPOSAL ──────────────────────── */

    /**
     * College submits a proposal after approving a student's essay application.
     * @param _student        Registered student wallet.
     * @param _schoolFees     Fixed floor amount (in wei). Every DAO offer must be >= this.
     *                        Automatically forwarded to the college wallet when funded.
     * @param _votingDuration Seconds the offer window stays open.
     */
    function submitProposal(
        address _student,
        uint256 _schoolFees,
        uint256 _votingDuration
    ) external onlyCollege {
        require(_student != address(0), "Invalid student address");
        require(students[_student].isRegistered, "Student not registered on-chain");
        require(_schoolFees > 0, "School fees must be > 0");
        require(_schoolFees <= MAX_OFFER, "School fees exceed cap");
        require(
            _votingDuration >= MIN_VOTING_DURATION &&
            _votingDuration <= MAX_VOTING_DURATION,
            "Invalid offer window duration"
        );

        proposalCount++;
        uint256 deadline = block.timestamp + _votingDuration;

        proposals[proposalCount] = Proposal({
            id:          proposalCount,
            college:     msg.sender,
            student:     _student,
            schoolFees:  _schoolFees,
            votesFor:    0,
            votesAgainst: 0,
            deadline:    deadline,
            funded:      false,
            claimed:     false,
            cancelled:   false
        });

        emit ProposalSubmitted(proposalCount, msg.sender, _student, _schoolFees, deadline);
    }

    /* ─────────────────── OFFER RESPONSES ───────────────────── */

    /**
     * Decline without making an offer.
     * This records a pass without attaching funds.
     */
    function voteAgainst(uint256 _proposalId) external onlyDaoMember {
        _recordVote(_proposalId, false, 0);
    }

    /**
     * Submit an offer. Must be >= schoolFees.
     * The excess (offerAmount - schoolFees) is what the student will receive.
     * @param _offerAmount Total ETH the DAO member is willing to send (in wei).
     */
    function voteWithOffer(uint256 _proposalId, uint256 _offerAmount) external onlyDaoMember {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Proposal does not exist");
        require(_offerAmount >= p.schoolFees, "Offer must cover school fees");
        require(_offerAmount <= MAX_OFFER,    "Offer exceeds cap");
        _recordVote(_proposalId, true, _offerAmount);
    }

    function _recordVote(uint256 _proposalId, bool _support, uint256 _offerAmount) internal {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0,              "Proposal does not exist");
        require(!p.funded,              "Already funded");
        require(!p.cancelled,           "Proposal cancelled");
        require(block.timestamp < p.deadline, "Offer window closed");
        require(!hasVoted[_proposalId][msg.sender], "Already responded");

        if (_support) {
            p.votesFor++;
            daoOfferAmount[_proposalId][msg.sender] = _offerAmount;
            offerMembers[_proposalId].push(msg.sender);
        } else {
            p.votesAgainst++;
        }

        hasVoted[_proposalId][msg.sender]    = true;
        voteSupport[_proposalId][msg.sender] = _support;

        emit Voted(_proposalId, msg.sender, _support, _offerAmount);
    }

    /* ─────────────────────── SELECTION ─────────────────────── */

    /**
     * Student picks which DAO member's offer they want.
     * Higher offers mean more ETH for the student after school fees are deducted.
     */
    function chooseDaoOffer(uint256 _proposalId, address _daoMember) external onlyStudent {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0,                    "Proposal does not exist");
        require(p.student == msg.sender,      "Not your proposal");
        require(!p.funded,                    "Already funded");
        require(!p.cancelled,                 "Proposal cancelled");
        require(block.timestamp >= p.deadline, "Offer window still active");
        require(p.votesFor > 0,               "No YES offers received");
        require(selectedDaoOffer[_proposalId] == address(0), "Offer already selected");
        require(daoMembers[_daoMember],       "Not a DAO member");
        require(hasVoted[_proposalId][_daoMember], "DAO member did not respond");
        require(voteSupport[_proposalId][_daoMember], "DAO member did not submit an offer");

        uint256 offer = daoOfferAmount[_proposalId][_daoMember];
        require(offer >= p.schoolFees, "Offer does not cover school fees");

        selectedDaoOffer[_proposalId]    = _daoMember;
        selectedOfferAmount[_proposalId] = offer;

        emit DaoOfferSelected(_proposalId, msg.sender, _daoMember, offer);
    }

    /* ─────────────────────── FUNDING ───────────────────────── */

    /**
     * The selected DAO member sends exactly their offer amount.
     * School fees are instantly forwarded to the college.
     * The remainder is held for the student to claim.
     */
    function fundOffer(uint256 _proposalId) external payable onlyDaoMember nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0,                    "Proposal does not exist");
        require(!p.funded,                    "Already funded");
        require(!p.cancelled,                 "Proposal cancelled");
        require(block.timestamp >= p.deadline, "Offer window still active");
        require(p.votesFor > 0,               "No YES offers received");
        require(selectedDaoOffer[_proposalId] != address(0), "Student has not chosen yet");
        require(msg.sender == selectedDaoOffer[_proposalId], "Not the selected DAO member");
        require(!offerFunded[_proposalId],    "Offer already funded");
        require(msg.value == selectedOfferAmount[_proposalId], "Send exactly offer amount");

        offerFunded[_proposalId] = true;
        p.funded = true;

        uint256 studentShare = msg.value - p.schoolFees;
        pendingStudentPayout[_proposalId] = studentShare;

        // Instantly forward school fees to the college wallet
        (bool feeSent, ) = payable(p.college).call{ value: p.schoolFees }("");
        require(feeSent, "School fee transfer failed");

        emit OfferFunded(_proposalId, msg.sender, p.college, p.schoolFees, studentShare);
    }

    /* ─────────────────────── CLAIM ─────────────────────────── */

    /**
     * Student claims their share (offer - schoolFees) whenever they are ready.
     */
    function claimFunds(uint256 _proposalId) external onlyStudent nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0,               "Proposal does not exist");
        require(p.student == msg.sender, "Not your proposal");
        require(p.funded,                "Not funded yet");
        require(!p.claimed,              "Already claimed");

        uint256 amount = pendingStudentPayout[_proposalId];
        require(amount > 0, "Nothing to claim");

        pendingStudentPayout[_proposalId] = 0;
        p.claimed = true;

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Transfer failed");

        emit FundsClaimed(_proposalId, msg.sender, amount);
    }

    /* ─────────────────────── CANCEL ────────────────────────── */

    /**
     * College can cancel only before the offer is funded.
     */
    function cancelProposal(uint256 _proposalId) external onlyCollege {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0,               "Proposal does not exist");
        require(p.college == msg.sender, "Not your proposal");
        require(!p.funded,               "Already funded");
        require(!p.cancelled,            "Already cancelled");

        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    /* ─────────────────────── VIEWS ─────────────────────────── */

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        require(proposals[_proposalId].id != 0, "Proposal does not exist");
        return proposals[_proposalId];
    }

    function getDaoOffers(uint256 _proposalId)
        external
        view
        returns (
            address[] memory daoWallets,
            uint256[] memory offerAmounts,
            bool[]    memory isSelected
        )
    {
        require(proposals[_proposalId].id != 0, "Proposal does not exist");
        address[] storage members = offerMembers[_proposalId];
        uint256 len = members.length;
        daoWallets   = new address[](len);
        offerAmounts = new uint256[](len);
        isSelected   = new bool[](len);
        address chosen = selectedDaoOffer[_proposalId];

        for (uint256 i = 0; i < len; i++) {
            address m = members[i];
            daoWallets[i]   = m;
            offerAmounts[i] = daoOfferAmount[_proposalId][m];
            isSelected[i]   = (chosen == m);
        }
    }

    function getPendingStudentPayout(uint256 _proposalId) external view returns (uint256) {
        return pendingStudentPayout[_proposalId];
    }

    function hasProposalPassed(uint256 _proposalId) external view returns (bool) {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Proposal does not exist");
        return block.timestamp >= p.deadline && p.votesFor > 0;
    }

    /* ─────────────────────── TREASURY ──────────────────────── */

    receive() external payable {}
}
