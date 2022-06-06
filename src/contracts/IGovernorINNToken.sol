// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/TimersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";

interface IGovernorINNToken is IERC165Upgradeable {
    
    /**
     * @dev Enum type of votes
     */
    enum VoteType {
        NONE,
        AGAINST,
        FOR,
        ABSTAIN
    }

    /**
     * @dev Enum type of proposals
     */
    enum ProposalType {
        NONE,
        VALIDATOR,
        INVESTMENT,
        GOVERNANCE
    }

    /**
     * @dev Enum type of actions
     */
    enum ActionType {
        NONE,
        NEW,
        EXIT,
        MODIFY,
        REMOVE,
        COMMAND
    }
    
    /**
     * @dev Enum state of consensus proposal
     */
    enum ProposalState {
        NONE,
        PENDING, //
        ACTIVE,
        CANCELED,
        DEFEATED, // < 51
        SUCCEEDED, //51 >
        QUEUED,
        EXPIRED,
        EXECUTED
    }

     /**
     * @dev Struct request for proposal creation
     */
    struct ProposalRequest {
        bytes32 offchainID;
        address proposer;
        ProposalType propsalType;
        ActionType actionType;
        uint64 startAt;
        string description;
        bytes[] data;
    }


    /**
     * @dev Struct proposal storage
     */
    struct ProposalCore {
        uint256 proposalID;
        bytes32 offchainID;
        bytes32 description;
        address proposer;
        TimersUpgradeable.Timestamp startAt;
        TimersUpgradeable.Timestamp endAt;
        ProposalType propsalType;
        ActionType actionType;
        bool isExecuted;
        bool isCanceled;
        bytes[] data;
    }

    /**
     * @dev Struct New Validator Proposal
     */
    struct NewValidatorProposal {
        string validatorName;
        address validatorEOA;
        bytes4 commandSig; 
    }

    /**
     * @dev Struct New Investment Proposal
     */
    struct NewInvestmentProposal {
        string startupName;
        uint256 tokenOffer;
        address startupEOA;
        uint16 sharedStake;
        bytes4 commandSig;
    }

    /**
     * @dev Struct Exit Investment Proposal
     */
    struct ExitInvestmentProposal {
        string startupName;
        uint256 tokenOffer;
        address validatorEOA;
        uint16 sharedStake;
        bytes4 commandSig;
    }

    /**
     * @dev Struct Freeze Investment Proposal
     */
    struct FreezeInvestmentProposal {
        address account;
        bytes4 commandSig;
    }

    /**
     * @dev Struct Unfreeze Investment Proposal
     */
    struct UnfreezeInvestmentProposal {
        address account;
        bytes4 commandSig;
    }

    /**
     * @dev Emitted when a NewValidator proposal is created.
     */
    event NewValidatorProposalCreated(
        uint256 indexed proposalID,
        address indexed proposer,
        address indexed validatorEOA, 
        bytes32 offchainID,
        string description,
        string validatorName,
        bytes4 commandSig
    );

    /**
     * @dev Emitted when a NewInvestment proposal is created.
     */
    event NewInvestmentProposalCreated(
        uint256 indexed proposalID,
        address indexed proposer,
        address indexed startupEOA,
        uint256 tokenOffer,
        bytes32 offchainID,
        string description,
        string startupName,
        uint16 sharedStake,
        bytes4 commandSig
    );

    /**
     * @dev Emitted when a ExitInvestment proposal is created.
     */
    event ExitInvestmentProposalCreated(
        uint256 indexed proposalID,
        address indexed proposer,
        address indexed validatorEOA,
        uint256 tokenOffer,
        bytes32 offchainID,
        string description,
        string startupName,
        uint16 sharedStake,
        bytes4 commandSig
    );

    /**
     * @dev Emitted when a FreezeAccount proposal is created.
     */
    event FreezeAccountProposalCreated(
        uint256 indexed proposalID,
        address indexed proposer,
        address indexed account,
        string description,
        bytes32 offchainID,
        bytes4 commandSig
    );

    /**
     * @dev Emitted when a UnfreezeAccount proposal is created.
     */
    event UnfreezeAccountProposalCreated(
        uint256 indexed proposalID,
        address indexed proposer,
        address indexed account,
        string description,
        bytes32 offchainID,
        bytes4 commandSig
    );

    /**
     * @dev Emitted when a VoteCast created.
     */
    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        VoteType vote,
        string reason
    );

    /**
     * @dev Emitted when a proposal is executed.
     * TODO work on Event
     */
    event ProposalExecuted(uint256 indexed proposalId);


    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(uint256 indexed proposalId, string reason);


   /**
     * @dev Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
     * deadline to be reached.
     *
     * Emits a {ProposalExecuted} event.
     *
     */
    function execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external payable returns (bool);


    /**
     * @dev Cancel a proposal. Cancels a proposal only if sender is the proposer.
     * We need to decide to conditions of consensus cancelation
     *    
     * Emits a {ProposalCanceled} event.
     *
     */
    function cancel(uint256 proposalId, string memory reason) external returns (bool);

   
    /**
     * @dev Create a new proposal.
     * Emits a {ProposalCreated} event.
     */
    function propose(ProposalRequest memory proposalRequest) external returns (uint256);


    /**
     * @dev Cast a vote
     * Emits a {VoteCast} event.
     */
    function castVote(uint256 proposalId, VoteType vote) external returns (bool);

    /**
     * @dev Cast a with a reason
     * Emits a {VoteCast} event.
     */
    function castVoteWithReason(
        string calldata reason,
        uint256 proposalId,
        VoteType vote       
    ) external returns (bool);

    /**
     * @dev Cast a vote using the user cryptographic signature.
     * Emits a {VoteCast} event.
     */
    function castVoteBySig(
        uint256 proposalId,
        VoteType vote,
        bytes memory signature
    ) external returns (bool);

    /**
     * @dev Cast a vote using the user cryptographic signature and reason
     * Emits a {VoteCast} event.
     */
    function castVoteWithReasonBySig(
        string calldata reason,
        uint256 proposalId,
        VoteType vote,
        bytes memory signature
    ) external returns (bool);


    /**
     * @dev Returns weither `account` has cast a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account)
        external
        view
        returns (VoteType);

    /**
     * @dev Current state of a proposal, following Compound's convention
     */
    function state(uint256 proposalId)
        external
        view
        returns (ProposalState);

    /**
     * @dev Name of the governor instance (used in building the ERC712 domain separator).
     */
    function name() external view returns (string memory);

    /**
     * @dev Version of the governor instance (used in building the ERC712 domain separator). Default: "1"
     */
    function version() external view  returns (string memory);


    /**
     * @dev Hashing function used to (re)build the proposal id from the proposal details..
     */
    function hashProposal(
        bytes32 offchainID,
        address proposer,
        uint64 startAt,
        ProposalType propsalType,
        ActionType actionType,
        string calldata description,
        bytes[] calldata data
    ) external pure returns (uint256);
  
}
