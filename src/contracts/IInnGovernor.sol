// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

abstract contract IInnGovernor {
    enum VoteType {
        None,
        Against,
        For,
        Abstain
    }

    enum ProposalType {
        None,
        NewValidator,
        NewProposal,
        GrantRole, 
        WithdrawFromInverstment
    }//TODO : Withdraw From Investment
    //description: grant role for consensuse role in ERC20 contract
    //this means that the new governance address will be used for governance and have access to transferFrom reserved wallet
    enum ProposalState {
        None,
        Pending, //
        Active,
        Canceled,
        Defeated, // < 51
        Succeeded, //51 >
        Queued,
        Expired,
        Executed
    }

    //RSV 712 , castVoteBySig  , castVote
    //Timelock in /home/mamadeus/Documents/SolStuff/TruffleStart/node_modules/openzeppelin-solidity/contracts/governance
    //0 for not 1 for execute and other for other shits
    //Events
    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        string reason
    );

    function hashProposal(
        bytes32 descriptionHash, //in the event must emit string of description
        bytes32 startupID,
        address proposer,
        address startup,
        uint32 tokenOffer,
        uint8 sharedStake,
        ProposalType proposalType
    ) public pure virtual returns (uint256);

    // /**
    //  * @notice module:user-config
    //  * @dev Delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
    //  * leave time for users to buy voting power, of delegate it, before the voting of a proposal starts.
    //  */
    // function votingDelay() public view virtual returns (uint256);//TODO:change to period
    // function votingPeriod() public view virtual returns (uint256);//TODO:change to period

    /**
     * @dev Create a new proposal. Vote start {IGovernor-votingDelay} blocks after the proposal is created and ends
     * {IGovernor-votingPeriod} blocks after the voting starts.
     *
     * Emits a {ProposalCreated} event.
     */
    function propose(
        string memory description, //in the event must emit string of description
        bytes32 ID,
        address startup,
        uint32 tokenOffer,
        uint8 sharedStake,
        ProposalType proposalType
    ) public virtual returns (uint256);

    /**
     * @dev Emitted when a proposal is created.
     */
    event ProposalCreated(
        uint256 proposalId,
        bytes32 startupID,
        address proposer,
        address startup,
        uint32 tokenOffer,
        uint8 sharedStake,
        uint64 startTimestamp,
        string description
    );

    // /**
    //  * @dev Execute a successful proposal. This requires the quorum to be reached, the vote to be successful, and the
    //  * deadline to be reached.
    //  *
    //  * Emits a {ProposalExecuted} event.
    //  *
    //  * Note: some module can modify the requirements for execution, for example by adding an additional timelock.
    //  */
    // function execute(
    //     address[] memory targets,
    //     uint256[] memory values,
    //     bytes[] memory calldatas,
    //     bytes32 descriptionHash
    // ) public payable virtual returns (uint256);

    /**
     * @dev Cast a vote
     *
     * Emits a {VoteCast} event.
     */
    function castVote(uint256 proposalId, uint8 support) public virtual;

    /**
     * @dev Cast a with a reason
     *
     * Emits a {VoteCast} event.
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public virtual;

    /**
     * @dev Cast a vote using the user cryptographic signature.
     *
     * Emits a {VoteCast} event.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual ;

    /**
     * @notice module:voting
     * @dev Returns weither `account` has cast a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account)
        public
        view
        virtual
        returns (bool);

    /**
     * @notice module:core
     * @dev Current state of a proposal, following Compound's convention
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        returns (ProposalState);

    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(uint256 proposalId);

    function _cancel(uint256 proposalId) internal virtual returns (bool); //TODO

    /**
     * @dev See {IGovernor-execute}.
     */
    function execute(uint256 proposalId) public payable virtual returns (bool);

    /**
     * @dev Emitted when a proposal is executed.
     */
    event ProposalExecuted(uint256 proposalId);
}
