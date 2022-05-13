import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "solidity-coverage";

dotenv.config();

const mnemonic = process.env.MNEMONIC;
const privateKey = process.env.PRIVATE_KEY;
// const etherscanKeyPolygonMain = process.env.ETHERSCAN_KEY_POLYGON_MAIN;

const netAccounts = mnemonic
  ? { mnemonic }
  : privateKey
  ? [{ privateKey: `0x${privateKey}`, balance: "1000" }]
  : undefined;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.13",
  networks: {
    hardhat: netAccounts ? { accounts: netAccounts } : {},

    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    polygon_main: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: netAccounts,
    },

    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      chainId: 80001,
      accounts: netAccounts,
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },

  etherscan: {
    apiKey: {
      // polygon
      polygon: process.env.ETHERSCAN_KEY_POLYGON_MAIN,
      polygonMumbai: process.env.ETHERSCAN_KEY_POLYGON_MUMBAI,
    },
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [],
  },

  abiExporter: {
    path: "./build/export/abi",
    runOnCompile: false,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: false,
  },

  typechain: {
    outDir: "./build/export/types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },

  paths: {
    cache: "build/cache",
    sources: "src/contracts",
    tests: "src/test",
    artifacts: "build/artifacts",
    deploy: "src/deploy",
    deployments: "deployments",
    root: ".",
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

export default config;
