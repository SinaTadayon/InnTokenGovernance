import { expect } from "chai";
import { ethers, waffle, deployments, upgrades } from "hardhat";
import hre from "hardhat";
import {
  Contract,
  Signer,
  ContractTransaction,
  utils,
  providers,
  Bytes,
  BigNumber,
  BytesLike,
  BigNumberish,
  Wallet
} from "ethers";
import { MockContract } from "ethereum-waffle";
import * as IGovernor from "../../export/types/src/contracts/IGovernorINNImpl";
import { IGovernorINNImpl__factory } from "../../export/types";
import * as Base from "./base";
import { Address } from "hardhat-deploy/dist/types";
import { ADMIN_ROLE, ProposalState, VoteType } from "./base";
import { NewInvestmentProposalCreatedEventObject } from "../../export/types/src/contracts/IGovernorINNImpl";

/* eslint-disable no-unused-vars */
const { provider, deployMockContract, deployContract } = waffle;

describe("Governor INN Token Test", function () {
  let admin: Wallet;
  let innovationHouseValidator: Signer;
  let secondValidator: Signer;
  let thirdValidator: Signer;
  let commissionWallet: Signer;
  let reservedWallet: Signer;
  let innTokenERC20: Contract;
  let governor: Contract;
  let governor2: Contract;
  let abiCoder: utils.AbiCoder;
  let firstStartup: Signer
  let secondStartup: Signer
  let oracle: Signer
  let iGovernor: IGovernor.IGovernorINNImpl
  let firstValidatorProposalId: string
  let secondValidatorProposalId: string
  let thirdValidatorProposalId: string
  let firstInvestmentProposalId: string
  let secondInvestmentProposalId: string

  this.beforeAll(async function () {
    abiCoder = ethers.utils.defaultAbiCoder;
    // [admin] = provider.getWallets();
    [admin, innovationHouseValidator, commissionWallet, reservedWallet,
      secondValidator, thirdValidator, firstStartup, secondStartup, oracle] = provider.getWallets();
    // [admin, innovationHouseValidator, commissionWallet, reservedWallet] = waffle.provider.getWallets();
    // [admin, innovationHouseValidator, commissionWallet, reservedWallet] = await ethers.getSigners();

    // console.log(`named accounts: ${JSON.stringify(await hre.getNamedAccounts())}`);
    // console.log(`unnamed accounts: ${JSON.stringify(await hre.getUnnamedAccounts())}`);
    const erc20 = await deployments.getArtifact("InnToken");
    innTokenERC20 = await deployContract(admin, erc20, [await reservedWallet.getAddress(), await commissionWallet.getAddress()]);
  });

  it("Should create a new IGovernorINNImpl contract without proxy", async function () {
    // given
    const iGovernorFactory = new IGovernorINNImpl__factory(admin);

    // when
    iGovernor =
      await iGovernorFactory.deploy();
    await iGovernor
      .connect(admin)
      .initialize(
        innTokenERC20.address,
        await commissionWallet.getAddress(),
        await reservedWallet.getAddress(),
        // await innovationHouseValidator.getAddress(),
        // "InnovationHouse",
        "Governor",
        "v0.0.1"
      );

    // then  
    expect(iGovernor.address).to.be.not.null;
    expect(await iGovernor.name()).to.be.equal("Governor");
    expect(await iGovernor.version()).to.be.equal("v0.0.1");
  });

  it("Should deploy governor with uups proxy", async function () {
    // given
    const GovernorFactory = await ethers.getContractFactory("IGovernorINNImpl");
    governor = await upgrades.deployProxy(GovernorFactory, [
      innTokenERC20.address,
      await reservedWallet.getAddress(),
      await commissionWallet.getAddress(),
      // await innovationHouseValidator.getAddress(),
      // "InnovationHouse",
      "Governor",
      "v0.0.1",
    ]);

    // when
    await governor.deployed();
    await governor.connect(admin).setMigration(false)


    // then
    // console.log(`governor address: ${governor.address}`);
    expect(governor.address).to.be.not.null;
    expect(await governor.name()).to.be.equal("Governor");
    expect(await governor.version()).to.be.equal("v0.0.1");
    expect(await governor.hasRole(Base.ADMIN_ROLE, await admin.getAddress())).to.be.true;
    expect(await governor.isMigrationEnabled()).to.be.false;
  });

  it("Should admin grant role to consensus", async function () {

    // when
    expect(await innTokenERC20.connect(admin).grantRole(Base.CONSENSUS_ROLE, governor.address))
      .to.emit(innTokenERC20, "RoleGranted")
      .withArgs(Base.CONSENSUS_ROLE, governor.address, admin.address)

    // then
    expect(await innTokenERC20.hasRole(Base.CONSENSUS_ROLE, governor.address)).to.be.true
  });

  it("Should approve reserved wallet to consensus role", async function () {
    // given
    const reservedWalletAddress = await reservedWallet.getAddress();
    const amount = ethers.BigNumber.from(2000000000).mul(BigNumber.from(10).pow(7));

    // when
    expect(await innTokenERC20.connect(reservedWallet).approve(governor.address, amount))
      .to.emit(innTokenERC20, "Approval")
      .withArgs(reservedWalletAddress, governor.address, amount)

    // then
    const allowance = await innTokenERC20.allowance(reservedWalletAddress, governor.address);
    expect(allowance.toString()).to.be.equal(amount.toString())
  });

  // it("Recovered address according to messageHash", async function() {
  //
  //   // Get the ContractFactory and Signers here.
  //   const TestSign= await ethers.getContractFactory("TestSign");
  //   const [signer] = await ethers.getSigners();
  //   const hardhatTestSign = await TestSign.deploy();
  //
  //   const test = 0x512345673440;
  //   const testBytes = ethers.utils.arrayify(test);
  //   const messageHash = ethers.utils.hashMessage(testBytes);
  //
  //   //Sign the messageHash
  //   const messageHashBytes = ethers.utils.arrayify(messageHash);
  //   const signature = await signer.signMessage(messageHashBytes);
  //   //Recover the address from signature
  //   const recoveredAddress = ethers.utils.verifyMessage(messageHashBytes, signature);
  //
  //   //Expect the recovered address is equal to the address of signer
  //   expect(recoveredAddress).to.equal(signer.address);
  //   console.log("singerAddress                   :", signer.address);
  //   console.log("recovered address from ethers   :", recoveredAddress);
  //
  //   //Recover the address from contract TestSign
  //   const split = ethers.utils.splitSignature(signature);
  //   const actualSigner = await hardhatTestSign.recover(messageHash, split.v, split.r, split.s);
  //   console.log("recovered address from ecrecover:", actualSigner);
  //   expect(actualSigner).to.equal(signer.address);
  // });

  it("Should create new validator proposal by admin", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const adminAddress = await admin.getAddress();
    const newValidatorProposal: Base.NewValidatorProposal = {
      validatorName: "InnovationHouse",
      validatorEOA: innHouseAddress,
    };

    // let test: Bytes = ethers.utils.toUtf8Bytes(abiCoder.encode(["tuples(string validatorName, string validatorEOA)"], [newValidatorProposal]))
    // console.log(`encode data: ${test}`)
    // console.log(`encode bytes32 data: ${ethers.utils.formatBytes32String("1")}`)
    // utils.solidityPack(["string validatorName","string validatorEOA"], [newValidatorProposal])

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("1"),
      proposalType: Base.ProposalType.VALIDATOR,
      actionType: Base.ActionType.NEW,
      description: "New Validator",
      data: abiCoder.encode(["tuples(string validatorName, address validatorEOA)"], [newValidatorProposal])
    };

    // const domainType = {
    //   EIP712Domain: [
    //     { name: "name", type: "string" },
    //     { name: "version", type: "string" },
    //     { name: "chainId", type: "uint256" },
    //     { name: "verifyingContract", type: "address" },
    //   ],
    // };
    //
    // const proposalType = {
    //   Proposal: [
    //     { name: "offchainID", type: "bytes32" },
    //     { name: "descriptionHash", type: "bytes32" },
    //     { name: "proposer", type: "address" },
    //     { name: "proposalType", type: "uint8" },
    //     { name: "actionType", type: "uint8" },
    //     { name: "data", type: "bytes" },
    //   ],
    // }
    //
    // // All properties on a domain are optional
    // const domainValue = {
    //   name: 'Governor',
    //   version: 'v0.0.1',
    //   chainId: networkChainId,
    //   verifyingContract: governor.address
    // };
    //
    // // The named list of all type definitions
    // const proposalValue = {
    //   Proposal: {
    //     offchainID: proposalReq.offchainID,
    //     descriptionHash: ethers.utils.keccak256(utils.toUtf8Bytes(proposalReq.description)),
    //     proposer: innHouseAddress,
    //     proposalType: proposalReq.proposalType,
    //     actionType: proposalReq.actionType,
    //     data: proposalReq.data
    //   }
    // }
    //
    // const signature = await admin._signTypedData(domainValue, proposalType, proposalValue);

    // const signature1 = await signDataByHardhat(innHouseAddress, governor.address, adminAddress, networkChainId, proposalReq);
    // console.log(`signature1: ${signature1}`)

    const signature2 = await signDataManually(adminAddress, governor.address, admin, networkChainId, proposalReq);

    // when
    // const tx1 = await iGovernor.connect(innovationHouseValidator).propose(proposalReq);
    const tx: ContractTransaction = await governor.connect(admin).propose(proposalReq, signature2);

    // then
    // const blockNumber = await provider.getBlockNumber();
    // console.log(`last block number: ${blockNumber}, block mined number: ${blockMined.number}, block mined timestamp: ${blockMined.timestamp}`);
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);
    const blockMined: providers.Block = await provider.getBlock(txReceipt.blockNumber);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
        adminAddress, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
    const proposalId = ethers.utils.keccak256(encoded);

    // let dataId: Uint8Array[] = [ethers.utils.toUtf8Bytes("1")];
    // dataId.push(ethers.utils.toUtf8Bytes((ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)))))
    // dataId.push(ethers.utils.arrayify(blockMined.timestamp))
    // dataId.push(ethers.utils.arrayify(innHouseAddress))
    // dataId.push(ethers.utils.arrayify(<number>proposalReq.proposalType))
    // dataId.push(ethers.utils.arrayify(<number>proposalReq.actionType))
    // dataId.push(ethers.Uint8Array.from(<Bytes>proposalReq.data))
    //
    // // @ts-ignore
    // const array: Uint8Array = dataId.reduce<Uint8Array>((a, b) => [...a, ...b], []);
    //
    // const proposalId = ethers.utils.keccak256(array)
    // console.log(`proposal keccak256: ${proposalId}`)
    //
    // console.log(`tx: ${JSON.stringify(tx)}`);
    // console.log(`txReceipt: ${JSON.stringify(txReceipt)}`);
    let logDesc: utils.LogDescription = governor.interface.parseLog(txReceipt.logs[0]);
    const event: IGovernor.NewValidatorProposalCreatedEventObject = <IGovernor.NewValidatorProposalCreatedEventObject><unknown>logDesc.args;

    expect(newValidatorProposal.validatorName).to.be.equal(event.validatorName);
    expect(newValidatorProposal.validatorEOA).to.be.equal(event.validatorEOA);
    expect(proposalId).to.be.equal(event.proposalID)
    firstValidatorProposalId = proposalId

    // txReceipt.logs.forEach((log) => {
    //   let logDesc: utils.LogDescription = governor.interface.parseLog(log);
    //   console.log(`event name: ${logDesc.name}, topic: ${logDesc.topic}, signature: ${logDesc.signature}`);
    //   console.log(`event args: ${logDesc.args}`);
    //   console.log(`event fragment: ${JSON.stringify(logDesc.eventFragment)}`);
    //
    //   // let newValidatorEvent: IGovernor.NewValidatorProposalCreatedEventObject
    //   const result: IGovernor.NewValidatorProposalCreatedEventObject = <IGovernor.NewValidatorProposalCreatedEventObject><unknown>governor.interface.decodeEventLog(logDesc.eventFragment, log.data, log.topics);
    //   console.log(`event result validator name: ${result.validatorName}`);
    // });
  });

  it("Should admin can vote to new validator proposal", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    expect(await governor.connect(admin).castVoteAdmin(firstValidatorProposalId))
      .to.emit(governor, "VoteCast")
         .withArgs(admin.address, VoteType.FOR, firstValidatorProposalId, "")
      .to.emit(governor, "ProposalExecuted")
         .withArgs(firstValidatorProposalId)

    // then
    expect(await governor.isValidator(innHouseValidatorAddress)).to.be.true
  });

  it("Should not admin cast vote to new validator proposal again", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    await expect(governor.connect(admin).castVoteAdmin(firstValidatorProposalId))
      .to.be.revertedWith("admin already cast vote")

    // then
    expect(await governor.isValidator(innHouseValidatorAddress)).to.be.true
  });

  it("Should create second validator proposal by admin", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const secondValidatorAddress = await secondValidator.getAddress();
    const secondValidatorProposal: Base.NewValidatorProposal = {
      validatorName: "Trigap",
      validatorEOA: secondValidatorAddress,
    };

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("2"),
      proposalType: Base.ProposalType.VALIDATOR,
      actionType: Base.ActionType.NEW,
      description: "Second Validator",
      data: abiCoder.encode(["tuples(string validatorName, address validatorEOA)"], [secondValidatorProposal])
    };

    const signature1 = await signDataByHardhat(admin.address, governor.address, admin.address, networkChainId, proposalReq);

    // when
    const tx: ContractTransaction = await governor.connect(admin).propose(proposalReq, signature1);

    // then
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
        admin.address, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
    const proposalId = ethers.utils.keccak256(encoded);

    let logDesc: utils.LogDescription = governor.interface.parseLog(txReceipt.logs[0]);
    const event: IGovernor.NewValidatorProposalCreatedEventObject = <IGovernor.NewValidatorProposalCreatedEventObject><unknown>logDesc.args;

    expect(secondValidatorProposal.validatorName).to.be.equal(event.validatorName);
    expect(secondValidatorProposal.validatorEOA).to.be.equal(event.validatorEOA);
    expect(proposalId).to.be.equal(event.proposalID)
    secondValidatorProposalId = proposalId
  });

  it("Should first validator can vote to second validator proposal", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    expect(await governor.connect(innovationHouseValidator).castVote("", secondValidatorProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(innHouseValidatorAddress, VoteType.FOR, secondValidatorProposalId, "")

    // then
    expect(await governor.state(secondValidatorProposalId)).to.be.equal(ProposalState.SUCCEEDED)

  });

  it("Should admin execute second validator proposal", async function () {
    // given
    const secondValidatorAddress = await secondValidator.getAddress();

    // when
    expect(await governor.connect(admin).execute(secondValidatorProposalId))
      .to.emit(governor, "ProposalExecuted")
      .withArgs(secondValidatorProposalId)

    // then
    expect(await governor.isValidator(secondValidatorAddress)).to.be.true

  });

  it("Should create third validator proposal by admin", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const thirdValidatorAddress = await thirdValidator.getAddress();
    const thirdValidatorProposal: Base.NewValidatorProposal = {
      validatorName: "Investment House",
      validatorEOA: thirdValidatorAddress,
    };

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("3"),
      proposalType: Base.ProposalType.VALIDATOR,
      actionType: Base.ActionType.NEW,
      description: "Third Validator",
      data: abiCoder.encode(["tuples(string validatorName, address validatorEOA)"], [thirdValidatorProposal])
    };

    const signature1 = await signDataByHardhat(admin.address, governor.address, admin.address, networkChainId, proposalReq);

    // when
    const tx: ContractTransaction = await governor.connect(admin).propose(proposalReq, signature1);

    // then
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
        admin.address, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
    const proposalId = ethers.utils.keccak256(encoded);

    let logDesc: utils.LogDescription = governor.interface.parseLog(txReceipt.logs[0]);
    const event: IGovernor.NewValidatorProposalCreatedEventObject = <IGovernor.NewValidatorProposalCreatedEventObject><unknown>logDesc.args;

    expect(thirdValidatorProposal.validatorName).to.be.equal(event.validatorName);
    expect(thirdValidatorProposal.validatorEOA).to.be.equal(event.validatorEOA);
    expect(proposalId).to.be.equal(event.proposalID)
    thirdValidatorProposalId = proposalId
  });

  it("Should first validator can vote to third validator proposal", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    expect(await governor.connect(innovationHouseValidator).castVote("", thirdValidatorProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(innHouseValidatorAddress, VoteType.FOR, thirdValidatorProposalId, "")

    // then
    expect(await governor.state(thirdValidatorProposalId)).to.be.equal(ProposalState.ACTIVE)
  });

  it("Should second validator can vote to third validator proposal", async function () {
    // given
    const secondValidatorAddress = await secondValidator.getAddress();

    // when
    expect(await governor.connect(secondValidator).castVote("", thirdValidatorProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(secondValidatorAddress, VoteType.FOR, thirdValidatorProposalId, "")

    // then
    expect(await governor.state(thirdValidatorProposalId)).to.be.equal(ProposalState.SUCCEEDED)
  });

  it("Should admin execute third validator proposal", async function () {
    // given
    const thirdValidatorAddress = await thirdValidator.getAddress();

    // when
    expect(await governor.connect(admin).execute(thirdValidatorProposalId))
      .to.emit(governor, "ProposalExecuted")
      .withArgs(thirdValidatorProposalId)

    // then
    expect(await governor.isValidator(thirdValidatorAddress)).to.be.true
  });

  it("Should any validator create first investment proposal", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const firstStartupAddress = await firstStartup.getAddress();
    const firstStartupProposal: Base.NewInvestmentProposal = {
      startupName: "Dr.Motori",
      startupEOA:firstStartupAddress,
      sharedStake: 30,
      tokenOffer: ethers.BigNumber.from(20000000).mul(BigNumber.from(10).pow(7))
    };

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("3"),
      proposalType: Base.ProposalType.INVESTMENT,
      actionType: Base.ActionType.NEW,
      description: "First Startup",
      data: abiCoder.encode(["tuples(string startupName,uint256 tokenOffer,address startupEOA,uint16 sharedStake)"], [firstStartupProposal])
    };

    const signature1 = await signDataByHardhat(innHouseAddress, governor.address, admin.address, networkChainId, proposalReq);

    // when
    const tx: ContractTransaction = await governor.connect(innovationHouseValidator).propose(proposalReq, signature1);

    // then
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
        innHouseAddress, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
    const proposalId = ethers.utils.keccak256(encoded);

    let logDesc: utils.LogDescription = governor.interface.parseLog(txReceipt.logs[0]);
    const event: IGovernor.NewInvestmentProposalCreatedEventObject = <IGovernor.NewInvestmentProposalCreatedEventObject><unknown>logDesc.args;

    expect(firstStartupProposal.startupName).to.be.equal(event.startupName);
    expect(firstStartupProposal.startupEOA).to.be.equal(event.startupEOA);
    expect(firstStartupProposal.tokenOffer).to.be.equal(event.tokenOffer);
    expect(firstStartupProposal.sharedStake).to.be.equal(event.sharedStake);
    expect(proposalId).to.be.equal(event.proposalID)
    firstInvestmentProposalId = proposalId
  });

  it("Should first validator can vote new investment proposal", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    expect(await governor.connect(innovationHouseValidator).castVote("", firstInvestmentProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(innHouseValidatorAddress, VoteType.FOR, firstInvestmentProposalId, "")

    // then
    expect(await governor.state(firstInvestmentProposalId)).to.be.equal(ProposalState.ACTIVE)
  });

  it("Should second validator can vote new investment proposal", async function () {
    // given
    const secondValidatorAddress = await secondValidator.getAddress();

    // when
    expect(await governor.connect(secondValidator).castVote("", firstInvestmentProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(secondValidatorAddress, VoteType.FOR, firstInvestmentProposalId, "")

    // then
    expect(await governor.state(firstInvestmentProposalId)).to.be.equal(ProposalState.ACTIVE)
  });

  it("Should third validator can vote new investment proposal", async function () {
    // given
    const thirdValidatorAddress = await thirdValidator.getAddress();

    // when
    expect(await governor.connect(thirdValidator).castVote("", firstInvestmentProposalId, VoteType.FOR))
      .to.emit(governor, "VoteCast")
      .withArgs(thirdValidatorAddress, VoteType.FOR, firstInvestmentProposalId, "")

    // then
    expect(await governor.state(firstInvestmentProposalId)).to.be.equal(ProposalState.SUCCEEDED)
  });

  it("Should admin execute new investment proposal", async function () {
    // given
    const firstStartupAddress = await firstStartup.getAddress();
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const secondValidatorAddress = await secondValidator.getAddress();
    const thirdValidatorAddress = await thirdValidator.getAddress();
    const commissionWalletAddress = await commissionWallet.getAddress();

    // when
    expect(await governor.connect(admin).execute(firstInvestmentProposalId))
      .to.emit(governor, "ProposalExecuted")
      .withArgs(firstInvestmentProposalId)

    // then
    const firstStartupBalance = await innTokenERC20.balanceOf(firstStartupAddress);
    const innHouseBalance = await innTokenERC20.balanceOf(innHouseAddress);
    const secondValidatorBalance = await innTokenERC20.balanceOf(secondValidatorAddress);
    const thirdValidatorBalance = await innTokenERC20.balanceOf(thirdValidatorAddress);
    const commissionWalletBalance = await innTokenERC20.balanceOf(commissionWalletAddress);

    expect(await governor.isStartup(firstStartupAddress)).to.be.true;
    expect(firstStartupBalance.toString()).to.be.equal(BigNumber.from("200000000000000").toString());
    expect(innHouseBalance.toString()).to.be.equal(BigNumber.from("2000000000000").add(BigNumber.from("1333333333333")).toString());
    expect(secondValidatorBalance.toString()).to.be.equal(BigNumber.from("1333333333333").toString());
    expect(thirdValidatorBalance.toString()).to.be.equal(BigNumber.from("1333333333333").toString());
    expect(commissionWalletBalance.toString()).to.be.equal(BigNumber.from("10000000000000").toString());

  });

  it("Should admin upgrade contract", async function () {
    // given
    const oracleAddress = await oracle.getAddress();
    const GovernorV2Factory = await ethers.getContractFactory("IGovernorINNImplV2");
    const thirdValidatorAddress = await thirdValidator.getAddress();
    // governor2 = await upgrades.upgradeProxy(governor, GovernorV2Factory);
    governor2 = await upgrades.upgradeProxy(governor, GovernorV2Factory, {
      call: {
        fn: "initialize",
        args: ["Governor2", "v0.0.2", oracleAddress]
      }
    });

    // when
    await governor2.deployed();

    // then

    expect(governor2.address).to.be.not.null;
    expect(governor2.address).to.be.equal(governor.address);
    expect(await governor2.name()).to.be.equal("Governor2");
    expect(await governor2.version()).to.be.equal("v0.0.2");
    expect(await governor2.oracle()).to.be.equal(oracleAddress);
    // expect(await governor2.oldVersion()).to.be.equal(governor.address);
    expect(await governor2.isValidator(thirdValidatorAddress)).to.be.true;
    expect(await governor2.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
  });

  it("Should any validator create exist investment proposal", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const firstStartupProposal: Base.ExitInvestmentProposal = {
      startupName: "Dr.Motori",
      validatorEOA:innHouseAddress,
      sharedStake: 50,
      tokenOffer: ethers.BigNumber.from(10000000).mul(ethers.BigNumber.from(10).pow(7)),
    };

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("4"),
      proposalType: Base.ProposalType.INVESTMENT,
      actionType: Base.ActionType.EXIT,
      description: "First Startup Exit Investment",
      data: abiCoder.encode(["tuples(string startupName,uint256 tokenOffer,address validatorEOA,uint16 sharedStake)"], [firstStartupProposal])
    };

    const signature1 = await signDataByHardhat2(innHouseAddress, governor2.address, admin.address, networkChainId, proposalReq);

    // when
    const tx: ContractTransaction = await governor2.connect(innovationHouseValidator).propose(proposalReq, signature1);

    // then
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
        innHouseAddress, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
    const proposalId = ethers.utils.keccak256(encoded);

    let logDesc: utils.LogDescription = governor2.interface.parseLog(txReceipt.logs[0]);
    const event: IGovernor.ExitInvestmentProposalCreatedEventObject = <IGovernor.ExitInvestmentProposalCreatedEventObject><unknown>logDesc.args;

    expect(firstStartupProposal.startupName).to.be.equal(event.startupName);
    expect(firstStartupProposal.validatorEOA).to.be.equal(event.validatorEOA);
    expect(firstStartupProposal.tokenOffer).to.be.equal(event.tokenOffer);
    expect(firstStartupProposal.sharedStake).to.be.equal(event.sharedStake);
    expect(proposalId).to.be.equal(event.proposalId)
    secondInvestmentProposalId = proposalId
  });

  it("Should first validator can vote exit investment proposal", async function () {
    // given
    const innHouseValidatorAddress = await innovationHouseValidator.getAddress();

    // when
    expect(await governor2.connect(innovationHouseValidator).castVote("", secondInvestmentProposalId, VoteType.FOR))
      .to.emit(governor2, "VoteCast")
      .withArgs(innHouseValidatorAddress, VoteType.FOR, secondInvestmentProposalId, "")

    // then
    expect(await governor2.state(secondInvestmentProposalId)).to.be.equal(ProposalState.ACTIVE)
  });

  it("Should second validator can vote exit investment proposal", async function () {
    // given
    const secondValidatorAddress = await secondValidator.getAddress();

    // when
    expect(await governor2.connect(secondValidator).castVote("", secondInvestmentProposalId, VoteType.FOR))
      .to.emit(governor2, "VoteCast")
      .withArgs(secondValidatorAddress, VoteType.FOR, secondInvestmentProposalId, "")

    // then
    expect(await governor2.state(secondInvestmentProposalId)).to.be.equal(ProposalState.ACTIVE)
  });

  it("Should third validator can vote exit investment proposal", async function () {
    // given
    const thirdValidatorAddress = await thirdValidator.getAddress();

    // when
    expect(await governor2.connect(thirdValidator).castVote("", secondInvestmentProposalId, VoteType.FOR))
      .to.emit(governor2, "VoteCast")
      .withArgs(thirdValidatorAddress, VoteType.FOR, secondInvestmentProposalId, "")

    // then
    expect(await governor2.state(secondInvestmentProposalId)).to.be.equal(ProposalState.SUCCEEDED)
  });

  it("Should admin execute exit investment proposal", async function () {
    // given
    // const firstStartupAddress = await firstStartup.getAddress();
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const secondValidatorAddress = await secondValidator.getAddress();
    const thirdValidatorAddress = await thirdValidator.getAddress();
    const commissionWalletAddress = await commissionWallet.getAddress();

    // when
    expect(await governor2.connect(admin).execute(secondInvestmentProposalId))
      .to.emit(governor2, "ProposalExecuted")
      .withArgs(secondInvestmentProposalId)

    // then
    // const firstStartupBalance = await innTokenERC20.balanceOf(secondInvestmentProposalId);
    const innHouseBalance = await innTokenERC20.balanceOf(innHouseAddress);
    const secondValidatorBalance = await innTokenERC20.balanceOf(secondValidatorAddress);
    const thirdValidatorBalance = await innTokenERC20.balanceOf(thirdValidatorAddress);
    const commissionWalletBalance = await innTokenERC20.balanceOf(commissionWalletAddress);

    // expect(await governor.isStartup(firstStartupAddress)).to.be.true;
    // expect(firstStartupBalance.toString()).to.be.equal(BigNumber.from("200000000000000").toString());
    expect(innHouseBalance.toString()).to.be.equal(BigNumber.from("2000000000000").add(BigNumber.from("1333333333333")).add(BigNumber.from("100000000000000")).add(BigNumber.from("666666666666")).add(BigNumber.from("1000000000000")).toString());
    expect(secondValidatorBalance.toString()).to.be.equal(BigNumber.from("1333333333333").add(BigNumber.from("666666666666")).toString());
    expect(thirdValidatorBalance.toString()).to.be.equal(BigNumber.from("1333333333333").add(BigNumber.from("666666666666")).toString());
    expect(commissionWalletBalance.toString()).to.be.equal(BigNumber.from("10000000000000").add(BigNumber.from("5000000000000")).toString());

  });
});

async function signDataByHardhat(
  proposerAddress: Address,
  verifyingContract: Address,
  signerAddress: Address,
  chainId: BigNumber,
  proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<string> {
  const messageParams = JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Proposal: [
        { name: "offchainID", type: "bytes32" },
        { name: "descriptionHash", type: "bytes32" },
        { name: "proposer", type: "address" },
        { name: "proposalType", type: "uint8" },
        { name: "actionType", type: "uint8" },
        { name: "data", type: "bytes" },
      ],
    },
    primaryType: "Proposal",
    domain: {
      name: 'Governor',
      version: 'v0.0.1',
      chainId: chainId,
      verifyingContract: verifyingContract
    },
    message: {
        offchainID: proposalReq.offchainID,
        descriptionHash: ethers.utils.keccak256(ethers.utils.solidityPack(["string"], [proposalReq.description])),
        proposer: proposerAddress,
        proposalType: proposalReq.proposalType,
        actionType: proposalReq.actionType,
        data: proposalReq.data
    },
  });

  const signature = await provider.send("eth_signTypedData_v4", [
    signerAddress,
    messageParams,
  ]);

  return signature;
}

async function signDataByHardhat2(
  proposerAddress: Address,
  verifyingContract: Address,
  signerAddress: Address,
  chainId: BigNumber,
  proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<string> {
  const messageParams = JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Proposal: [
        { name: "offchainID", type: "bytes32" },
        { name: "descriptionHash", type: "bytes32" },
        { name: "proposer", type: "address" },
        { name: "proposalType", type: "uint8" },
        { name: "actionType", type: "uint8" },
        { name: "data", type: "bytes" },
      ],
    },
    primaryType: "Proposal",
    domain: {
      name: 'Governor2',
      version: 'v0.0.2',
      chainId: chainId,
      verifyingContract: verifyingContract
    },
    message: {
      offchainID: proposalReq.offchainID,
      descriptionHash: ethers.utils.keccak256(ethers.utils.solidityPack(["string"], [proposalReq.description])),
      proposer: proposerAddress,
      proposalType: proposalReq.proposalType,
      actionType: proposalReq.actionType,
      data: proposalReq.data
    },
  });

  const signature = await provider.send("eth_signTypedData_v4", [
    signerAddress,
    messageParams,
  ]);

  return signature;
}


async function signDataManually(
    proposerAddress: Address,
    verifyingContract: Address,
    signerAddress: Wallet,
    chainId: BigNumber,
    proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct
): Promise<string> {
  let abiCoder = ethers.utils.defaultAbiCoder;
  const domainAbiEncode = abiCoder.encode(
      ["bytes32","bytes32","bytes32","uint256","address"],
      [Base.DOMAIN_HASH, ethers.utils.keccak256(ethers.utils.solidityPack(["string"],["Governor"])),
      ethers.utils.keccak256(ethers.utils.solidityPack(["string"],["v0.0.1"])), chainId, verifyingContract]
  );
  const domainEncode = ethers.utils.keccak256(domainAbiEncode);

  const messageAbiEncode = abiCoder.encode(
      ["bytes32","bytes32","bytes32","address","uint8","uint8","bytes32"],
      [Base.MESSAGE_TYPE_HASH, proposalReq.offchainID,
      ethers.utils.keccak256(ethers.utils.solidityPack(["string"], [proposalReq.description])),
      proposerAddress, proposalReq.proposalType, proposalReq.actionType, ethers.utils.keccak256(ethers.utils.solidityPack(["bytes"],[proposalReq.data]))]
  );
  const msgEncode = ethers.utils.keccak256(messageAbiEncode);

  const domainMessageHash = ethers.utils.keccak256(ethers.utils.solidityPack(["string","bytes32","bytes32"],["\x19\x01",domainEncode,msgEncode]));

  const signature = signerAddress._signingKey().signDigest(domainMessageHash)

  // console.log(`\ndomainEncode: ${domainEncode}\nmessageEnode: ${msgEncode}\ndomainMessageHash: ${domainMessageHash}\n`);
  // console.log(`signature: r: ${signature.r}, s: ${signature.s}, v: ${signature.v}, compact: ${signature.compact}\n`);
  //Recover the address from signature
  const recoveredAddress = ethers.utils.verifyMessage(domainMessageHash, signature);
  // console.log(`recoveredAddress: ${recoveredAddress}`);
  return signature.compact;
}
