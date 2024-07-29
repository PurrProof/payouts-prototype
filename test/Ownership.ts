import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

import { FixtureAll, deployAll } from "./_fixtures";

// adapted from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/659f3063f82422cef820de746444e6f6cba6ca7c/test/access/Ownable.test.js

describe("Ownership", function () {
  let context: FixtureAll;

  beforeEach(async function () {
    context = await loadFixture(deployAll);
  });

  it("emits ownership transfer events during construction", async function () {
    await expect(context.payoutMgr.deploymentTransaction())
      .to.emit(context.payoutMgr, "OwnershipTransferred")
      .withArgs(hre.ethers.ZeroAddress, context.owner);
  });

  it("rejects zero address for initialOwner", async function () {
    await expect(hre.ethers.deployContract("PayoutMgr", [hre.ethers.ZeroAddress]))
      .to.be.revertedWithCustomError({ interface: context.payoutMgr.interface }, "OwnableInvalidOwner")
      .withArgs(hre.ethers.ZeroAddress);
  });

  it("has an owner", async function () {
    expect(await context.payoutMgr.owner()).to.equal(context.owner);
  });

  describe("Transfer ownership", function () {
    it("changes owner after transfer", async function () {
      await expect(context.payoutMgr.connect(context.owner).transferOwnership(context.alice))
        .to.emit(context.payoutMgr, "OwnershipTransferred")
        .withArgs(context.owner, context.alice);

      expect(await context.payoutMgr.owner()).to.equal(context.alice);
    });

    it("prevents non-owners from transferring", async function () {
      await expect(context.payoutMgr.connect(context.alice).transferOwnership(context.alice))
        .to.be.revertedWithCustomError(context.payoutMgr, "OwnableUnauthorizedAccount")
        .withArgs(context.alice);
    });

    it("guards ownership against stuck state", async function () {
      await expect(context.payoutMgr.connect(context.owner).transferOwnership(hre.ethers.ZeroAddress))
        .to.be.revertedWithCustomError(context.payoutMgr, "OwnableInvalidOwner")
        .withArgs(hre.ethers.ZeroAddress);
    });
  });

  describe("Renounce ownership", function () {
    it("loses ownership after renouncement", async function () {
      await expect(context.payoutMgr.connect(context.owner).renounceOwnership())
        .to.emit(context.payoutMgr, "OwnershipTransferred")
        .withArgs(context.owner, hre.ethers.ZeroAddress);

      expect(await context.payoutMgr.owner()).to.equal(hre.ethers.ZeroAddress);
    });

    it("prevents non-owners from renouncement", async function () {
      await expect(context.payoutMgr.connect(context.alice).renounceOwnership())
        .to.be.revertedWithCustomError(context.payoutMgr, "OwnableUnauthorizedAccount")
        .withArgs(context.alice);
    });
  });
});
