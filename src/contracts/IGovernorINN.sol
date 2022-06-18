// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";

interface IGovernorINN {
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
        FREEZE,
        UNFREEZE
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
        EXPIRED,
        EXECUTED
    }

    /**
     * @dev Struct request for proposal creation
     */
    struct ProposalRequest {
        bytes32 offchainID;
        ProposalType proposalType;
        ActionType actionType;
        string description;
        bytes data;
    }

    /**
     * @dev Struct New Validator Proposal
     */
    struct NewValidatorProposal {
        string validatorName;
        address validatorEOA;
    }

    /**
     * @dev Struct New Investment Proposal
     */
    struct NewInvestmentProposal {
        string startupName;
        uint256 tokenOffer;
        address startupEOA;
        uint16 sharedStake;
    }

    /**
     * @dev Struct Exit Investment Proposal
     */
    struct ExitInvestmentProposal {
        string startupName;
        uint256 tokenOffer;
        address validatorEOA; // validator same as a proposer ???? if true should remove validatorEOA
        uint16 sharedStake;
    }

    /**
     * @dev Struct Freeze Investment Proposal
     */
    struct FreezeInvestmentProposal {
        address account;
    }

    /**
     * @dev Struct Unfreeze Investment Proposal
     */
    struct UnfreezeInvestmentProposal {
        address account;
    }

    /**
     * @dev Emitted when a NewValidator proposal is created.
     */
    event NewValidatorProposalCreated(
        bytes32 indexed proposalID,
        address indexed proposer,
        address indexed validatorEOA,
        bytes32 offchainID,
        bytes32 description,
        string validatorName
    );

    /**
     * @dev Emitted when a NewInvestment proposal is created.
     */
    event NewInvestmentProposalCreated(
        bytes32 indexed proposalID,
        address indexed proposer,
        address indexed startupEOA,
        uint256 tokenOffer,
        bytes32 offchainID,
        bytes32 description,
        string startupName,
        uint16 sharedStake
    );

    /**
     * @dev Emitted when a ExitInvestment proposal is created.
     */
    event ExitInvestmentProposalCreated(
        bytes32 indexed proposalId,
        address indexed proposer,
        address indexed validatorEOA,
        uint256 tokenOffer,
        bytes32 offchainID,
        bytes32 description,
        string startupName,
        uint16 sharedStake
    );

    /**
     * @dev Emitted when a FreezeAccount proposal is created.
     */
    event FreezeInvestmentProposalCreated(
        bytes32 indexed proposalId,
        address indexed proposer,
        address indexed account,
        bytes32 offchainID,
        bytes32 description
    );

    /**
     * @dev Emitted when a UnfreezeAccount proposal is created.
     */
    event UnfreezeInvestmentProposalCreated(
        bytes32 indexed proposalID,
        address indexed proposer,
        address indexed account,
        bytes32 offchainID,
        bytes32 description
    );

    /**
     * @dev Emitted when a VoteCast created.
     */
    event VoteCast(address indexed voter, bytes32 indexed proposalId, VoteType vote, string reason);

    /**
     * @dev Emitted when a proposal is executed.
     * TODO work on Event
     */
    event ProposalExecuted(bytes32 indexed proposalId);

    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(bytes32 indexed proposalId, string reason);

    /**
     * @dev Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
     * deadline to be reached.
     *
     * Emits a {ProposalExecuted} event.
     *
     */
    function execute(bytes32 proposalId) external payable returns (bool);

    /**
     * @dev Cancel a proposal. Cancels a proposal only if sender is the proposer.
     * We need to decide to conditions of consensus cancelation
     *
     * Emits a {ProposalCanceled} event.
     *
     */
    function cancel(bytes32 proposalId, string memory reason) external returns (bool);

    /**
     * @dev Create a new proposal.
     * Emits a {ProposalCreated} event.
     */
    function propose(ProposalRequest memory proposalRequest, bytes memory signature) external returns (bytes32);

    /**
     * @dev Cast a vote
     * Emits a {VoteCast} event.
     */
    function castVote(
        string calldata reason,
        bytes32 proposalId,
        VoteType vote
    ) external returns (bool);

    /**
     * @dev Cast a vote
     * Emits a {castVoteAdmin} event.
     */
    function castVoteAdmin(bytes32 proposalId) external returns (bool);

    /**
     * @dev disableValidator"
     */
    function disableValidator(address validator) external;

    /**
     * @dev Returns weither `account` has cast a vote on `proposalId`.
     */
    function hasVoted(bytes32 proposalId, address account) external view returns (bool);

    /**
     * @dev Current state of a proposal, following Compound's convention
     */
    function state(bytes32 proposalId) external view returns (ProposalState);

    /**
     * @dev Name of the governor instance (used in building the ERC712 domain separator).
     */
    function name() external view returns (string memory);

    /**
     * @dev Version of the governor instance (used in building the ERC712 domain separator). Default: "1"
     */
    function version() external view returns (string memory);

    /**
     * @dev isValidator
     */
    function isValidator(address addr) external view returns (bool);

    /**
     * @dev isStartup
     */
    function isStartup(address addr) external view returns (bool);

    /**
     * @dev Hashing function used to (re)build the proposal id from the proposal ...
     */
    function hashProposal(
        bytes32 offchainID,
        bytes32 descriptionHash,
        address proposer,
        ProposalType proposalType,
        ActionType actionType,
        bytes memory data
    ) external pure returns (bytes32);
}
