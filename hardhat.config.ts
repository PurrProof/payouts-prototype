import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-contract-sizer";
import { HardhatUserConfig } from "hardhat/config";

import "./tasks/deploy";

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    bnb_testnet: {
      url: process.env.NETWORK_URL ?? "",
      accounts: process.env.OWNER_KEY !== undefined ? [process.env.OWNER_KEY] : [],
      chainId: 97,
      gas: 2_000_000,
    },
  },
};

export default config;
