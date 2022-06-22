// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";

const RESERVED_WALLET = "0x7eDAa5Bec0C1C3c40C473f1247d0b755214cC3ae";
const COMMISSION_WALLET = "0xfa9ff88ed5d2E9bD2D33A02362d69dcE861A0c2E";
const INN_TOKEN_ERC20 = "0x850F31C33a1bAcF46a67009050459A078E47Cd17";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const IGovernorFactory = await ethers.getContractFactory("IGovernorINNImpl");
  const governance = await upgrades.deployProxy(IGovernorFactory, [
    INN_TOKEN_ERC20,
    RESERVED_WALLET,
    COMMISSION_WALLET,
    "INN_GOVERNANCE",
    "v0.0.1",
  ]);

  await governance.deployed();

  console.log("Governance deployed to:", governance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
