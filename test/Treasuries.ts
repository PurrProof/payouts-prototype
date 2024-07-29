import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

import { FixtureAll, deployAll } from "./_fixtures";

describe("Treasuries", function () {
  let context: FixtureAll;

  beforeEach(async function () {
    context = await loadFixture(deployAll);
  });

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      expect(await context.token0.owner()).to.equal(context.info.token0.owner);
      expect(await context.token1.owner()).to.equal(context.info.token1.owner);
      expect(await context.token2.owner()).to.equal(context.info.token2.owner);
    });

    it("should set the right token names, symbols, total supplies", async function () {
      expect(await context.token0.name()).to.equal(context.info.token0.name);
      expect(await context.token0.symbol()).to.equal(context.info.token0.symbol);
      expect(await context.token0.totalSupply()).to.equal(
        context.info.token0.balance * 10n ** (await context.token0.decimals()),
      );
      expect(await context.token1.name()).to.equal(context.info.token1.name);
      expect(await context.token1.symbol()).to.equal(context.info.token1.symbol);
      expect(await context.token1.totalSupply()).to.equal(
        context.info.token1.balance * 10n ** (await context.token1.decimals()),
      );
      expect(await context.token2.name()).to.equal(context.info.token2.name);
      expect(await context.token2.symbol()).to.equal(context.info.token2.symbol);
      expect(await context.token2.totalSupply()).to.equal(
        context.info.token2.balance * 10n ** (await context.token2.decimals()),
      );
    });
  });

  describe("Management via PayoutMgr", function () {
    it("rejects treasury change not by owner", async function () {
      await expect(context.payoutMgr.connect(context.alice).setTreasury(hre.ethers.ZeroAddress))
        .to.be.revertedWithCustomError(context.payoutMgr, "OwnableUnauthorizedAccount")
        .withArgs(context.alice);
    });

    it("rejects change to non-contract address", async function () {
      await expect(context.payoutMgr.connect(context.owner).setTreasury(hre.ethers.ZeroAddress))
        .to.be.revertedWithCustomError(context.payoutMgr, "TreasuryInvalid")
        .withArgs(hre.ethers.ZeroAddress);
    });

    it("rejects change to treasury with no balance", async function () {
      await expect(context.payoutMgr.connect(context.owner).setTreasury(context.token0))
        .to.be.revertedWithCustomError(context.payoutMgr, "TreasuryEmpty")
        .withArgs(await context.token0.getAddress());
    });

    it("rejects change to same token", async function () {
      const curTreasury = await context.payoutMgr.treasuryAddress();
      await expect(context.payoutMgr.connect(context.owner).setTreasury(curTreasury))
        .to.be.revertedWithCustomError(context.payoutMgr, "TreasuryAlreadyInUse")
        .withArgs(curTreasury);
    });

    it("sets another treasury", async function () {
      const newToken = await context.token2.getAddress();
      await expect(context.payoutMgr.connect(context.owner).setTreasury(newToken))
        .to.emit(context.payoutMgr, "TreasuryChanged")
        .withArgs(context.token2);
      expect(await context.payoutMgr.treasuryAddress()).to.equal(newToken);
    });
  });
});
