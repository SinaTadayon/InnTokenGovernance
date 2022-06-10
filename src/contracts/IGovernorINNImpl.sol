// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;
import "./IGovernorINN.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/TimersUpgradeable.sol";

contract InnGovernor is
    IGovernorINN,
    Initializable,
    UUPSUpgradeable,
    EIP712Upgradeable,
    AccessControlUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    using TimersUpgradeable for TimersUpgradeable.Timestamp;

    /**
     * @dev Struct proposal storage
     */
    struct ProposalCore {
        uint256 proposalID;
        bytes32 offchainID;
        bytes32 descriptionHash;
        address proposer;
        TimersUpgradeable.Timestamp votingStartAt;
        TimersUpgradeable.Timestamp votingEndAt;
        ProposalType proposalType;
        ActionType actionType;
        bool isExecuted;
        bool isCanceled;
        bytes data;
    }

    struct ProposalVote {
        uint64 againstVotes;
        uint64 forVotes;
        uint64 abstainVotes;
        EnumerableSetUpgradeable.AddressSet hasVoted;
    }

    bytes4 public constant TRANSFER_SIGNATURE =
        bytes4(keccak256("transferFrom(address,address,uint256)"));
    bytes4 public constant FREEZE_ACCOUNT_SIGNATURE = bytes4(keccak256("freezeAccount(address)"));
    bytes4 public constant UNFREEZE_ACCOUNT_SIGNATURE =
        bytes4(keccak256("unFreezeAccount(address)"));

    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");
    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // TODO add setter commands function
    uint256 public votingDelay; // second unit
    uint256 public votingPeriod; // second unit

    address public reservedWallet;
    address public commissionWallet;
    address public innTokenAddress;

    mapping(address => bool) private _validators;
    mapping(uint256 => ProposalVote) private _proposalVotes;
    mapping(uint256 => ProposalCore) private _proposals;

    string private _domainName;
    string private _domainVersion;
    uint32 public validatorCount;

    modifier onlyValidators() {
        require(_validators[msg.sender] == true, "Governor: only validator can vote");
        _;
    }

    // TODO ERC712 init
    function initialize(
        address innTokenERC20,
        address startValidator,
        address reservedEOA,
        address commissionEOA,
        string calldata domainName,
        string calldata domainVersion
    ) public initializer {
        commissionWallet = commissionEOA;
        reservedWallet = reservedEOA;
        _validators[startValidator] = true;
        validatorCount = 1;
        innTokenAddress = innTokenERC20;
        votingDelay = 1 seconds;
        votingPeriod = 7 days;
        _domainName = domainName;
        _domainVersion = domainVersion;

        __EIP712_init(_domainName, _domainVersion);

        _grantRole(ADMIN_ROLE, _msgSender());
        // _grantRole(CONSENSUS_ROLE, address(this));

        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        // _setRoleAdmin(CONSENSUS_ROLE, address(this));
    }

    function disableValidator(address validator) public onlyRole(ADMIN_ROLE) {
        require(_validators[validator] != false, "Validator: only exist validator can be disable");
        _validators[validator] = false;
        validatorCount -= 1;
    }

    // modifiers
    function isValidator(address addr) public view returns (bool) {
        return _validators[addr];
    }

    function hashProposal(
        bytes32 offchainID,
        bytes32 descriptionHash,
        uint256 startedAt,
        address proposer,
        ProposalType propsalType,
        ActionType actionType,
        bytes memory data
    ) public pure override returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        offchainID,
                        descriptionHash,
                        startedAt,
                        proposer,
                        propsalType,
                        actionType,
                        data
                    )
                )
            );
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        _checkRole(ADMIN_ROLE);
    }

    function propose(ProposalRequest memory request)
        public
        override
        onlyValidators
        returns (uint256)
    {
        require(request.proposalType != ProposalType.NONE, "proposal type should not be NONE");
        require(request.actionType != ActionType.NONE, "action type should not be NONE");
        require(request.data.length != 0, "data should not be empty");
        require(request.offchainID != 0, "data should not be empty");

        if (request.startAt == 0) {
            request.startAt = block.timestamp;
        }

        bytes32 descriptionHash = keccak256(bytes(request.description));

        uint256 proposalId = hashProposal(
            request.offchainID,
            descriptionHash,
            request.startAt,
            _msgSender(),
            request.proposalType,
            request.actionType,
            request.data
        );

        ProposalCore storage proposal = _proposals[proposalId];
        uint64 startTimeStamp = (uint64)(request.startAt) + (uint64)(votingDelay);
        uint64 endTimeStamp = (uint64)(request.startAt) + (uint64)(votingPeriod);
        proposal.votingStartAt.setDeadline(startTimeStamp);
        proposal.votingEndAt.setDeadline(endTimeStamp);
        proposal.descriptionHash = descriptionHash;
        proposal.offchainID = request.offchainID;
        proposal.proposer = msg.sender;
        proposal.proposalType = request.proposalType;
        proposal.actionType = request.actionType;
        proposal.data = request.data;

        _generateProposalCreationEvent(proposal);

        return proposalId;
    }

    function _generateProposalCreationEvent(ProposalCore storage proposal) private {
        if (proposal.proposalType == ProposalType.VALIDATOR) {
            if (proposal.actionType == ActionType.NEW) {
                NewValidatorProposal memory newValidator = abi.decode(
                    proposal.data,
                    (NewValidatorProposal)
                );

                require(
                    newValidator.validatorEOA != address(0),
                    "validator address should not be zero"
                );
                require(
                    bytes(newValidator.validatorName).length != 0,
                    "validator name should not be empty"
                );

                emit NewValidatorProposalCreated(
                    proposal.proposalID,
                    proposal.proposer,
                    newValidator.validatorEOA,
                    proposal.offchainID,
                    proposal.descriptionHash,
                    newValidator.validatorName
                );
            }
        } else if (proposal.proposalType == ProposalType.INVESTMENT) {
            if (proposal.actionType == ActionType.NEW) {
                NewInvestmentProposal memory newInvestment = abi.decode(
                    proposal.data,
                    (NewInvestmentProposal)
                );

                require(
                    bytes(newInvestment.startupName).length != 0,
                    "startup name should not be empty"
                );
                require(newInvestment.tokenOffer != 0, "startup token offer should not be zero");
                require(newInvestment.sharedStake != 0, "startup shared stake should not be zero");
                require(newInvestment.startupEOA != address(0), "startup EOA should not be zero");

                emit NewInvestmentProposalCreated(
                    proposal.proposalID,
                    proposal.proposer,
                    newInvestment.startupEOA,
                    newInvestment.tokenOffer,
                    proposal.offchainID,
                    proposal.descriptionHash,
                    newInvestment.startupName,
                    newInvestment.sharedStake
                );
            } else if (proposal.actionType == ActionType.EXIT) {
                ExitInvestmentProposal memory exitInvestment = abi.decode(
                    proposal.data,
                    (ExitInvestmentProposal)
                );

                require(
                    bytes(exitInvestment.startupName).length != 0,
                    "startup name should not be empty"
                );
                require(exitInvestment.tokenOffer != 0, "startup token offer should not be zero");
                require(exitInvestment.sharedStake != 0, "startup shared stake should not be zero");
                require(
                    exitInvestment.validatorEOA != address(0),
                    "validator EOA should not be zero"
                );

                emit ExitInvestmentProposalCreated(
                    proposal.proposalID,
                    proposal.proposer,
                    exitInvestment.validatorEOA,
                    exitInvestment.tokenOffer,
                    proposal.offchainID,
                    proposal.descriptionHash,
                    exitInvestment.startupName,
                    exitInvestment.sharedStake
                );
            } else if (proposal.actionType == ActionType.FREEZE) {
                FreezeInvestmentProposal memory freezeInvestment = abi.decode(
                    proposal.data,
                    (FreezeInvestmentProposal)
                );

                require(
                    freezeInvestment.account != address(0),
                    "Freeze: account should not be zero"
                );

                emit FreezeInvestmentProposalCreated(
                    proposal.proposalID,
                    proposal.proposer,
                    freezeInvestment.account,
                    proposal.offchainID,
                    proposal.descriptionHash
                );
            } else if (proposal.actionType == ActionType.UNFREEZE) {
                UnfreezeInvestmentProposal memory unfreezeInvestment = abi.decode(
                    proposal.data,
                    (UnfreezeInvestmentProposal)
                );

                require(
                    unfreezeInvestment.account != address(0),
                    "Unfreeze: account should not be zero"
                );

                emit UnfreezeInvestmentProposalCreated(
                    proposal.proposalID,
                    proposal.proposer,
                    unfreezeInvestment.account,
                    proposal.offchainID,
                    proposal.descriptionHash
                );
            }
        } else if (proposal.proposalType == ProposalType.GOVERNANCE) {
            // TODO will be implement
        }
    }

    /**
     * @dev Cast a vote
     * Emits a {VoteCast} event.
     */
    function castVote(
        string calldata reason,
        uint256 proposalId,
        VoteType vote
    ) external onlyValidators returns (bool) {
        return _castVote(proposalId, _msgSender(), vote, reason);
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address voter,
        VoteType vote,
        string memory reason
    ) internal returns (bool) {
        require(vote != VoteType.NONE, "Governor: vote invalid");
        require(state(proposalId) == ProposalState.ACTIVE, "Governor: proposal currently inactive");

        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        require(!proposalVote.hasVoted.contains(voter), "Governor: vote already cast");

        proposalVote.hasVoted.add(voter);

        if (vote == VoteType.AGAINST) {
            proposalVote.againstVotes += 1;
        } else if (vote == VoteType.FOR) {
            proposalVote.forVotes += 1;
        } else if (vote == VoteType.ABSTAIN) {
            proposalVote.abstainVotes += 1;
        }

        emit VoteCast(voter, proposalId, vote, reason);
        return true;
    }

    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        return proposalVote.forVotes >= validatorCount / 2 + 1;
    }

    function _fullQuorum(uint256 proposalId) internal view returns (bool) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return
            validatorCount ==
            (proposalvote.forVotes + proposalvote.againstVotes + proposalvote.abstainVotes);
    }

    /**
     * @dev See {IGovernor-state}.
     * need to change the state machine
     */
    function state(uint256 proposalId) public view override returns (ProposalState) {
        ProposalCore storage proposal = _proposals[proposalId];
        require(proposal.offchainID != 0, "proposalId is invalid");

        if (proposal.isExecuted) {
            return ProposalState.EXECUTED;
        } else if (proposal.isCanceled) {
            return ProposalState.CANCELED;
        } else if (proposal.votingStartAt.isPending()) {
            return ProposalState.PENDING;
        } else if (proposal.votingEndAt.isPending() && !_fullQuorum(proposalId)) {
            return ProposalState.ACTIVE;
        } else if (proposal.votingEndAt.isExpired() || _fullQuorum(proposalId)) {
            return _quorumReached(proposalId) ? ProposalState.SUCCEEDED : ProposalState.DEFEATED;
        }

        return ProposalState.NONE;
    }

    /**
     * @dev Returns weither `account` has cast a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account) external view override returns (bool) {
        return _proposalVotes[proposalId].hasVoted.contains(account);
    }

    /**
     * @dev Name of the governor instance (used in building the ERC712 domain separator).
     */
    function name() external view override returns (string memory) {
        return _domainName;
    }

    /**
     * @dev Version of the governor instance (used in building the ERC712 domain separator). Default: "1"
     */
    function version() external view override returns (string memory) {
        return _domainVersion;
    }

    function cancel(uint256 proposalId, string memory reason) external returns (bool) {
        require(
            msg.sender == _proposals[proposalId].proposer,
            "Governor : only proposer can cancel"
        );
        ProposalState status = state(proposalId);

        require(
            status != ProposalState.EXPIRED && status != ProposalState.EXECUTED,
            "Governor: proposal not active"
        );
        require(status != ProposalState.CANCELED, "Governor: proposal already canceled");
        _proposals[proposalId].isCanceled = true;

        emit ProposalCanceled(proposalId, reason);

        return true;
    }

    function execute(uint256 proposalId) external payable onlyRole(ADMIN_ROLE) returns (bool) {
        ProposalState status = state(proposalId);
        require(status == ProposalState.SUCCEEDED, "Governor: proposal not successful");
        ProposalCore storage proposal = _proposals[proposalId];
        proposal.isExecuted = true;

        bool succeeded = _execute(proposal);
        if (succeeded) emit ProposalExecuted(proposalId);

        return succeeded;
    }

    /**
     * @dev Internal execution mechanism. Can be overriden to implement different execution mechanism
     */
    function _execute(ProposalCore storage proposal) internal virtual returns (bool) {
        bool success = true;
        if (proposal.proposalType == ProposalType.VALIDATOR) {
            if (proposal.actionType == ActionType.NEW) {
                NewValidatorProposal memory newValidator = abi.decode(
                    proposal.data,
                    (NewValidatorProposal)
                );
                _validators[newValidator.validatorEOA] = true;
                validatorCount += 1;
                success = true;
            }
        } else if (proposal.proposalType == ProposalType.INVESTMENT) {
            if (proposal.actionType == ActionType.NEW) {
                NewInvestmentProposal memory newInvestment = abi.decode(
                    proposal.data,
                    (NewInvestmentProposal)
                );

                success = (success &&
                    _transferToken(newInvestment.startupEOA, newInvestment.tokenOffer));
                success = (success &&
                    _transferToken(commissionWallet, (5 * newInvestment.tokenOffer) / 100));
                success = (success &&
                    _transferToken(proposal.proposer, (newInvestment.tokenOffer) / 100));
                success = (success && _sendRewards(proposal.proposalID, newInvestment.tokenOffer));
            } else if (proposal.actionType == ActionType.EXIT) {
                ExitInvestmentProposal memory exitInvestment = abi.decode(
                    proposal.data,
                    (ExitInvestmentProposal)
                );

                success = (success &&
                    _transferToken(exitInvestment.validatorEOA, exitInvestment.tokenOffer));
                success = (success &&
                    _transferToken(commissionWallet, (5 * exitInvestment.tokenOffer) / 100));
                success = (success &&
                    _transferToken(proposal.proposer, (exitInvestment.tokenOffer) / 100));
                success = (success && _sendRewards(proposal.proposalID, exitInvestment.tokenOffer));
            } else if (proposal.actionType == ActionType.FREEZE) {
                FreezeInvestmentProposal memory freezeInvestment = abi.decode(
                    proposal.data,
                    (FreezeInvestmentProposal)
                );
                success = _freezeAccount(freezeInvestment.account);
            } else if (proposal.actionType == ActionType.UNFREEZE) {
                UnfreezeInvestmentProposal memory unfreezeInvestment = abi.decode(
                    proposal.data,
                    (UnfreezeInvestmentProposal)
                );
                success = _unfreezeAccount(unfreezeInvestment.account);
            }
        }

        return success;
    }

    function _sendRewards(uint256 proposalID, uint256 tokenOffer) internal returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalID];
        uint256 voterLength = proposalVote.hasVoted.length();
        uint256 reward = ((2 * tokenOffer) / 100) / voterLength;
        bool success;
        for (uint256 i = 0; i < voterLength; i++) {
            success = (success && _transferToken(proposalVote.hasVoted.at(i), reward));
        }
        return success;
    }

    function _transferToken(address receiver, uint256 amount) internal returns (bool) {
        bytes memory callData = abi.encodeWithSelector(
            TRANSFER_SIGNATURE,
            reservedWallet,
            receiver,
            amount
        );
        (bool success, ) = address(innTokenAddress).call(callData);
        require(success, "Execute: transfer failes! "); //TODO : get calldata outputs
        return success;
    }

    function _freezeAccount(address freezeAccount) internal returns (bool) {
        bytes memory callFreezeAccount = abi.encodeWithSelector(
            FREEZE_ACCOUNT_SIGNATURE,
            freezeAccount
        );
        (bool success, ) = address(innTokenAddress).call(callFreezeAccount);
        require(success, "Execute: freeze account failed");
        return success;
    }

    function _unfreezeAccount(address unfreezeAccount) internal returns (bool) {
        bytes memory callUnfreezeAccount = abi.encodeWithSelector(
            UNFREEZE_ACCOUNT_SIGNATURE,
            unfreezeAccount
        );
        (bool success, ) = address(innTokenAddress).call(callUnfreezeAccount);
        require(success, "Execute: Unfreeze account failed");
        return success;
    }

    function _transferCommission(address reciever, uint256 amount) internal returns (bool) {
        bytes memory callTransferFromCommissionWallet = abi.encodeWithSelector(
            TRANSFER_SIGNATURE,
            commissionWallet,
            reciever,
            amount
        );
        (bool success, ) = address(innTokenAddress).call(callTransferFromCommissionWallet);
        require(success, "Execute: transfer commission failed ");
        return success;
    }
}
