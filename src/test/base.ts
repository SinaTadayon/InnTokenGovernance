import { ethers } from "ethers";

/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
export const DOMAIN_HASH: string = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
export const MESSAGE_TYPE_HASH: string = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal(bytes32 offchainID,bytes32 descriptionHash,address proposer,uint8 proposalType,uint8 actionType,bytes data)"));
export const ADMIN_ROLE: string = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
export enum VoteType {
  NONE,
  AGAINST,
  FOR,
  ABSTAIN,
}

export enum ProposalType {
  NONE,
  VALIDATOR,
  INVESTMENT,
  GOVERNANCE,
}

export enum ActionType {
  NONE,
  NEW,
  EXIT,
  FREEZE,
  UNFREEZE,
}

export enum ProposalState {
  NONE,
  PENDING, //
  ACTIVE,
  CANCELED,
  DEFEATED, // < 51
  SUCCEEDED, // 51 >
  EXPIRED,
  EXECUTED,
}

export interface NewValidatorProposal {
  validatorName: string;
  validatorEOA: string;
}

export interface NewInvestmentProposal {
  startupName: string;
  tokenOffer: ethers.BigNumber;
  startupEOA: string;
  sharedStake: number;
}

export interface ExitInvestmentProposal {
  startupName: string;
  tokenOffer: ethers.BigNumber;
  validatorEOA: string;
  sharedStake: number;
}

export interface FreezeInvestmentProposal {
  account: string;
}

export interface UnfreezeInvestmentProposal {
  account: string;
}
