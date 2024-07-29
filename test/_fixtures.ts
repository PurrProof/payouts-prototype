import { SignerWithAddress as HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import hre from "hardhat";

import { TestPayoutMgr, Treasury } from "../typechain-types";

export interface TokenInfo {
  owner: string;
  name: string;
  symbol: string;
  balance: bigint;
}

export interface FixtureAll {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  payoutMgr: TestPayoutMgr;
  token0: Treasury;
  token1: Treasury;
  token2: Treasury;
  info: {
    token0: TokenInfo;
    token1: TokenInfo;
    token2: TokenInfo;
  };
}

export async function deployAll(): Promise<FixtureAll> {
  const [owner, alice, bob] = await hre.ethers.getSigners();

  const info = {
    token0: {
      owner: await owner.getAddress(),
      name: "Treasury0",
      symbol: "T0",
      balance: 0n,
    },
    token1: {
      owner: await owner.getAddress(),
      name: "Treasury1",
      symbol: "T1",
      balance: 1000n,
    },
    token2: {
      owner: await owner.getAddress(),
      name: "Treasury2",
      symbol: "T2",
      balance: 1000n,
    },
  };

  const payoutMgr = await hre.ethers.deployContract("TestPayoutMgr", [await owner.getAddress()]);

  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const token0 = await Treasury.deploy(info.token0.owner, info.token0.name, info.token0.symbol, info.token0.balance);
  const token1 = await Treasury.deploy(info.token1.owner, info.token1.name, info.token1.symbol, info.token1.balance);
  const token2 = await Treasury.deploy(info.token2.owner, info.token2.name, info.token2.symbol, info.token2.balance);
  await token1.transfer(await payoutMgr.getAddress(), info.token1.balance * 10n ** (await token1.decimals()));
  await token2.transfer(await payoutMgr.getAddress(), info.token1.balance * 10n ** (await token2.decimals()));

  await payoutMgr.setTreasury(await token1.getAddress());

  return { owner, alice, bob, payoutMgr, token0, token1, token2, info };
}
