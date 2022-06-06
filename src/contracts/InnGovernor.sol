// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
import "./IGovernorINNToken.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";



//https://mirror.xyz/0xf880FCd62e27495aA3c9427c4c70A5De66D8d0d2/MLhpkbLf1gsLJ2ih4h4lq564nr5BswXCP8C5jd99914


contract InnGovernor is IGovernorINNToken, EIP712Upgradeable,OwnableUpgradeable {
    constructor(
        address _InnTokenAddress,
        address startValidator,
        address _RESERVE_WALLET,
        address _COMMISSION_WALLET,
        uint256 _votingDelay,
        uint256 _votingPeriod
    ) EIP712("InnGovernor" , "1") 
      payable 
    {
        COMMISSION_WALLET = _COMMISSION_WALLET;
        RESERVE_WALLET = _RESERVE_WALLET;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        isValidator[startValidator] = true;
        validatorCnt = 1;
        InnTokenAddress = _InnTokenAddress;
    }

    uint256 private votingDelay; //TODO :: getter and setter 
    uint256 private votingPeriod;

    bool initiated = false ; //TODO : don't transfer till initiated is not true 

    //for address we don't have new signature
    bytes4 private constant transferSignature =
        bytes4(keccak256("transferFrom(address,address,uint256)"));
    bytes4 private constant grantRoleSignature =
        bytes4(keccak256("grantRole(bytes32,address)"));
    bytes4 private constant renounceRoleSignature =
        bytes4(keccak256("renounceRole(bytes32,address)"));
    bytes4 private constant freezeAccountSignature =
        bytes4(keccak256("freezeAccount(address)"));
    bytes4 private constant unfreezeAccountSignature =
        bytes4(keccak256("unFreezeAccount(address)"));
    bytes32 public constant BALLOT_TYPEHASH =
        keccak256("Ballot(uint256 proposalId,uint8 support)");

    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    address private RESERVE_WALLET;
    address private COMMISSION_WALLET;
    address InnTokenAddress;
    using Timers for Timers.Timestamp;
    struct ProposalCore {
        Timers.Timestamp voteStart;
        Timers.Timestamp voteEnd;
        bool executed;
        bool canceled;
    }
    using EnumerableSet for EnumerableSet.AddressSet;
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        // mapping(address => bool) hasVoted; //TODO : enmurable map beshe ;D address + enum
        EnumerableSet.AddressSet hasVoted; //for reward
    }
    struct ProposalDetails {
        bytes32 descriptionHash; //in the event must emit string of description
        bytes32 ID;
        address proposer;
        address candidate; //startup changed to candidate
        uint32 tokenOffer;
        uint8 sharedStake;
        ProposalType proposalType;
        //need to refactor for padding
        // ProposalCore _proposalCore;
    }

    mapping(uint256 => ProposalDetails) private _proposalDetails; //proposalID to details
    mapping(address => bool) private isValidator; //
    uint32 public validatorCnt;
    mapping(uint256 => ProposalVote) private _proposalVotes;
    mapping(uint256 => ProposalCore) private _proposalCores; //the main struct in governor changed from block to timer

    // modifiers
    function _isValidator(address addr) public view returns (bool) {
        return isValidator[addr];
    }

    modifier onlyValidators() {
        require(
            isValidator[msg.sender] == true,
            "Governor: only validator can vote"
        );
        _;
    }

    function disableValidator(address validator) public onlyOwner {
        require(
            isValidator[validator] != false,
            "Validator: only exist validator can be disable"
        );
        isValidator[validator] = false;
        validatorCnt -= 1;
    }

    // /**
    //  * @notice module:user-config
    //  * @dev Delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
    //  * leave time for users to buy voting power, of delegate it, before the voting of a proposal starts.
    //  */
    // function votingDelay() public pure override returns (uint256){
    //     return votingDelay ; // return numberOfDays
    // }
    // function votingPeriod() public pure override returns (uint256){
    //     return votingPeriod ; // return numberOfDays
    // }

    function hashProposal(
        bytes32 descriptionHash, //in the event must emit string of description
        bytes32 ID,
        address proposer,
        address candidate,
        uint32 tokenOffer,
        uint8 sharedStake,
        ProposalType proposalType
    ) public pure override returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        descriptionHash,
                        ID,
                        proposer,
                        candidate,
                        tokenOffer,
                        sharedStake,
                        proposalType
                    )
                )
            );
    }
    //TODO : signature will recieve from front and checked that the msg sender is admin or not 
    // TODO : admin can propose validator 
    function propose(
        string memory description, //in the event must emit string of description
        bytes32 ID,// TODO :: change to ID for Validator add in database 
        address candidate,
        uint32 tokenOffer,
        uint8 sharedStake,
        ProposalType proposalType
    ) public override onlyValidators returns (uint256) { 
        uint256 proposalId = hashProposal(
            keccak256(bytes(description)),
            ID,
            msg.sender,
            candidate,
            tokenOffer,
            sharedStake,
            proposalType
        );
        {
            ProposalCore storage proposal = _proposalCores[proposalId];
            uint64 startTimeStamp = (uint64)(block.timestamp) +
                (uint64)(1 seconds * votingDelay);
            uint64 endTimeStamp = (uint64)(block.timestamp) +
                (uint64)(1 seconds * votingPeriod);
            proposal.voteStart.setDeadline(startTimeStamp);
            proposal.voteEnd.setDeadline(endTimeStamp);
        }
        {
            bytes32 descriptionHash = keccak256(bytes(description));
            ProposalDetails storage proposal = _proposalDetails[proposalId];
            proposal.descriptionHash = descriptionHash; //in the event must emit string of description
            proposal.ID = ID;
            proposal.proposer = msg.sender;
            proposal.candidate = candidate;
            proposal.tokenOffer = tokenOffer;
            proposal.sharedStake = sharedStake;
            proposal.proposalType = proposalType;
        }
        emit ProposalCreated(
            proposalId,
            ID,
            msg.sender,
            candidate,
            tokenOffer,
            sharedStake,
            uint64(block.timestamp),
            description
        );

        return proposalId;
    }

    /**
     * @dev See {IGovernor-castVoteBySig}.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public override {
        address voter = ECDSA.recover(
            _hashTypedDataV4(
                keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support))
            ),
            v,
            r,
            s
        );
        _castVote(proposalId, voter , support, "");
    }

    function castVote(uint256 proposalId, uint8 support)
        public
        override
        onlyValidators
    {
        _castVote(proposalId, msg.sender, support, "");
    }

    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public override {
        _castVote(proposalId, msg.sender, support, reason);
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal {
        // require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");
        require(
            state(proposalId) == ProposalState.Active,
            "Governor: vote not currently active"
        );

        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        require(
            !proposalVote.hasVoted.contains(account),
            "GovernorVotingSimple: vote already cast"
        );
        proposalVote.hasVoted.add(account);

        if (uint8(support) == uint8(VoteType.Against)) {
            proposalVote.againstVotes += 1;
        } else if (uint8(support) == uint8(VoteType.For)) {
            proposalVote.forVotes += 1;
        } else if (uint8(support) == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += 1;
        } //TODO : else emit an evnet for incorrect support

        emit VoteCast(account, proposalId, support, reason);
    }

    // function quorum() public view  returns (uint256){
    //     return validatorCnt/2 ;//TODO : need to check fo odd numbers
    // }
    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        ProposalDetails storage proposalDetails = _proposalDetails[proposalId]; // TODO : check efficiency
        if (proposalDetails.proposalType == ProposalType.GrantRole)
            return (2 * validatorCnt) / 3 + 1 >= proposalvote.forVotes;
        else return validatorCnt / 2 + 1 >= proposalvote.forVotes;
    }

    function _fullQuorum(uint256 proposalId) internal view returns (bool) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return
            validatorCnt ==
            (proposalvote.forVotes +
                proposalvote.againstVotes +
                proposalvote.abstainVotes);
    }

    /**
     * @dev See {IGovernor-state}.
     * need to change the state machine
     */
    function state(uint256 proposalId)
        public
        view
        override
        returns (ProposalState)
    {
        ProposalCore storage proposal = _proposalCores[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        } else if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.voteStart.getDeadline() >= block.timestamp) {
            return ProposalState.Pending;
        } else if (
            proposal.voteEnd.getDeadline() >= block.timestamp &&
            !_fullQuorum(proposalId)
        ) {
            return ProposalState.Active;
        } else if (proposal.voteEnd.isExpired() || _fullQuorum(proposalId)) {
            // return ProposalState.Defeated;//TODO: change this shit
            // if(proposal.)
            return
                _quorumReached(proposalId)
                    ? ProposalState.Succeeded
                    : ProposalState.Defeated;
        } else {
            revert("Governor: unknown proposal id");
        }
    }

    /**
     * @notice module:voting
     * @dev Returns weither `account` has cast a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account)
        public
        view
        override
        returns (bool)
    {
        return _proposalVotes[proposalId].hasVoted.contains(account);
    }

    function _cancel(uint256 proposalId) internal override returns (bool) {
        require(
            msg.sender == _proposalDetails[proposalId].proposer,
            "Governor : only proposer can cancel . "
        );
        ProposalState status = state(proposalId);

        require(
            status != ProposalState.Canceled &&
                status != ProposalState.Expired &&
                status != ProposalState.Executed,
            "Governor: proposal not active"
        );
        _proposalCores[proposalId].canceled = true;

        emit ProposalCanceled(proposalId);

        return true;
    }

    function execute(uint256 proposalId)
        public
        payable
        override
        onlyOwner
        returns (bool)
    {
        ProposalState status = state(proposalId);
        require(
            status == ProposalState.Succeeded || status == ProposalState.Queued,
            "Governor: proposal not successful"
        );
        _proposalCores[proposalId].executed = true;

        bool Succeeded = _execute(proposalId);
        if (Succeeded) emit ProposalExecuted(proposalId);

        return Succeeded;
    }

    function executeFreeze(address freezeAccount) external onlyOwner {
        bytes memory callFreezeAccount = abi.encodeWithSelector(
            freezeAccountSignature,
            freezeAccount
        );
        (bool success, ) = address(InnTokenAddress).call(callFreezeAccount);
        require(success, "Freeze : Freeze by admin failes! "); //TODO : get calldata outputs
    }

    function executeUnfreeze(address unfreezeAccount) external onlyOwner {
        bytes memory callUnfreezeAccount = abi.encodeWithSelector(
            unfreezeAccountSignature,
            unfreezeAccount
        );
        (bool success, ) = address(InnTokenAddress).call(callUnfreezeAccount);
        require(success, "Freeze : Unfreeze by admin failes! "); //TODO : get calldata outputs
    }

    function executeTransferCommissionWallet(address reciever, uint256 amount)
        external
        onlyOwner
    {
        bytes memory callTransferFromCommissionWallet = abi.encodeWithSelector(
            transferSignature,
            COMMISSION_WALLET,
            reciever,
            amount
        );
        (bool success, ) = address(InnTokenAddress).call(
            callTransferFromCommissionWallet
        );
        require(success, "TRANSFER : transfer failes! "); //TODO : get calldata outputs
    }

    // event sendCondidate();
    // event sendCOMMISION();
    // event sendProposer();
    // event sendVoters();
    /**
     * @dev Internal execution mechanism. Can be overriden to implement different execution mechanism
     */
    function _execute(uint256 proposalId) internal virtual returns (bool) {
        bool success = true;
        ProposalDetails storage proposal = _proposalDetails[proposalId];
        if (proposal.proposalType == ProposalType.NewValidator) {
            isValidator[proposal.candidate] = true;
            validatorCnt += 1;
            success = true;
        } else if (
            (
                _proposalDetails[proposalId].proposalType ==
                ProposalType.NewProposal ||
                _proposalDetails[proposalId].proposalType ==
                ProposalType.WithdrawFromInvestment 
            )  && initiated
        ) {
            success = (success &&
                _transferToken(proposal.candidate, proposal.tokenOffer));

            success = (success &&
                _transferToken(
                    COMMISSION_WALLET,
                    (5 * proposal.tokenOffer) / 100
                ));

            success = (success &&
                _transferToken(proposal.proposer, (proposal.tokenOffer) / 100));

            success = (success &&
                _sendRewards(proposalId, proposal.tokenOffer));
        } else if (
            _proposalDetails[proposalId].proposalType == ProposalType.GrantRole
        ) {
            grantConsensueRole(proposal.candidate);
        }
        return success;
        // string memory errorMessage = "Governor: call reverted without message";
        // for (uint256 i = 0; i < targets.length; ++i) {
        //     (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
        //     Address.verifyCallResult(success, returndata, errorMessage);
        // }
    }

    function grantConsensueRole(address newConsensuseRole)
        internal
        returns (bool)
    {
        bytes memory callDataSetConsensuseRole = abi.encodeWithSelector(
            grantRoleSignature,
            CONSENSUS_ROLE,
            newConsensuseRole
        );
        bytes memory callDataSetAdminRole = abi.encodeWithSelector(
            grantRoleSignature,
            DEFAULT_ADMIN_ROLE,
            newConsensuseRole
        );
        (bool successSetConsensuse, ) = address(InnTokenAddress).call(
            callDataSetConsensuseRole
        );
        (bool successSetAdmin, ) = address(InnTokenAddress).call(
            callDataSetAdminRole
        );

        //renounceRole
        bytes memory callDataRenounceConsensuseRole = abi.encodeWithSelector(
            renounceRoleSignature,
            CONSENSUS_ROLE,
            address(this)
        );
        bytes memory callDataRenounceAdminRole = abi.encodeWithSelector(
            renounceRoleSignature,
            DEFAULT_ADMIN_ROLE,
            address(this)
        );
        (bool successRenounceConsensuse, ) = address(InnTokenAddress).call(
            callDataRenounceConsensuseRole
        );
        (bool successRenounceAdmin, ) = address(InnTokenAddress).call(
            callDataRenounceAdminRole
        );

        return
            successSetConsensuse &&
            successSetAdmin &&
            successRenounceConsensuse &&
            successRenounceAdmin;
    }

    function _sendRewards(uint256 proposalID, uint32 tokenOffer)
        internal
        returns (bool)
    {
        ProposalVote storage proposalVote = _proposalVotes[proposalID];
        uint256 voterLength = proposalVote.hasVoted.length();
        uint256 reward = ((2 * tokenOffer) / 100) / voterLength;
        bool success;
        for (uint256 i = 0; i < voterLength; i++) {
            success = (success &&
                _transferToken(proposalVote.hasVoted.at(i), reward));
        }
        return success;
    }

    function _transferToken(address receiver, uint256 amount)
        internal
        returns (bool)
    {
        bytes memory callData = abi.encodeWithSelector(
            transferSignature,
            RESERVE_WALLET,
            receiver,
            amount
        );
        (bool success,  ) = address(InnTokenAddress).call(
            callData
        );
        require(success, "TRANSFER : transfer failes! "); //TODO : get calldata outputs
        return success;
    }
}
