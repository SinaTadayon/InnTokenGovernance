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
  BigNumberish, Wallet
} from "ethers";
import { MockContract } from "ethereum-waffle";
import * as IGovernor from "../../export/types/src/contracts/IGovernorINNImpl";
import { IGovernorINNImpl__factory } from "../../export/types";
import * as Base from "./base";
import { Address } from "hardhat-deploy/dist/types";

/* eslint-disable no-unused-vars */
const { provider, deployMockContract, deployContract } = waffle;

describe("Governor INN Token Test", function () {
  let admin: Wallet;
  let innovationHouseValidator: Signer;
  let commissionWallet: Signer;
  let reservedWallet: Signer;
  let innTokenMock: MockContract;
  let governor: Contract;
  let abiCoder: utils.AbiCoder;
  let iGovernor: IGovernor.IGovernorINNImpl

  this.beforeAll(function() {
    abiCoder = ethers.utils.defaultAbiCoder
  })

  this.beforeAll(async function () {
    [admin] = provider.getWallets();
    [innovationHouseValidator, commissionWallet, reservedWallet] = await ethers.getSigners();
    // [admin, innovationHouseValidator, commissionWallet, reservedWallet] = waffle.provider.getWallets();
    // [admin, innovationHouseValidator, commissionWallet, reservedWallet] = await ethers.getSigners();

    // console.log(`named accounts: ${JSON.stringify(await hre.getNamedAccounts())}`);
    // console.log(`unnamed accounts: ${JSON.stringify(await hre.getUnnamedAccounts())}`);
    const erc20TestArtifact = await deployments.getArtifact("ERC20Test");
    innTokenMock = await deployMockContract(admin, erc20TestArtifact.abi);
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
        innTokenMock.address,
        await commissionWallet.getAddress(),
        await reservedWallet.getAddress(),
        await innovationHouseValidator.getAddress(),
        "InnovationHouse",
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
      innTokenMock.address,
      await commissionWallet.getAddress(),
      await reservedWallet.getAddress(),
      await innovationHouseValidator.getAddress(),
      "InnovationHouse",
      "Governor",
      "v0.0.1",
    ]);

    // when
    await governor.deployed();

    // then
    // console.log(`governor address: ${governor.address}`);
    expect(governor.address).to.be.not.null;
    expect(await governor.name()).to.be.equal("Governor");
    expect(await governor.version()).to.be.equal("v0.0.1");

    const result = await governor.hasRole(Base.ADMIN_ROLE, await admin.getAddress())
    expect(result).to.be.true;
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

  it("Should create new investor proposal by firstInvestor", async function () {
    // given
    const networkChainId = await provider.send("eth_chainId", []);
    const innHouseAddress = await innovationHouseValidator.getAddress();
    const adminAddress = await admin.getAddress();
    const newInvestorProposal: Base.NewValidatorProposal = {
      validatorName: "InnovationHouse",
      validatorEOA: innHouseAddress,
    };

    // let test: Bytes = ethers.utils.toUtf8Bytes(abiCoder.encode(["tuples(string validatorName, string validatorEOA)"], [newInvestorProposal]))
    // console.log(`encode data: ${test}`)
    // console.log(`encode bytes32 data: ${ethers.utils.formatBytes32String("1")}`)
    // utils.solidityPack(["string validatorName","string validatorEOA"], [newInvestorProposal])

    const proposalReq: IGovernor.IGovernorINN.ProposalRequestStruct = {
      offchainID: ethers.utils.formatBytes32String("1"),
      proposalType: Base.ProposalType.VALIDATOR,
      actionType: Base.ActionType.NEW,
      description: "New Investment",
      data: abiCoder.encode(["tuples(string validatorName, address validatorEOA)"], [newInvestorProposal])
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

    const signature2 = await signDataManually(innHouseAddress, governor.address, admin, networkChainId, proposalReq);

    // when
    // const tx1 = await iGovernor.connect(innovationHouseValidator).propose(proposalReq);
    const tx: ContractTransaction = await governor.connect(innovationHouseValidator).propose(proposalReq, signature2);

    // then
    // const blockNumber = await provider.getBlockNumber();
    // console.log(`last block number: ${blockNumber}, block mined number: ${blockMined.number}, block mined timestamp: ${blockMined.timestamp}`);
    const txReceipt: providers.TransactionReceipt = await provider.getTransactionReceipt(tx.hash);
    const blockMined: providers.Block = await provider.getBlock(txReceipt.blockNumber);

    const encoded = abiCoder.encode(["bytes32","bytes32","address","uint8","uint8", "bytes"],
      [proposalReq.offchainID, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalReq.description)),
              innHouseAddress, proposalReq.proposalType, proposalReq.actionType, proposalReq.data])
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

    expect(newInvestorProposal.validatorName).to.be.equal(event.validatorName);
    expect(newInvestorProposal.validatorEOA).to.be.equal(event.validatorEOA);
    expect(proposalId).to.be.equal(event.proposalID)


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
