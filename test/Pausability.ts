import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { FixtureAll, deployAll } from "./_fixtures";

describe("Pausability", function () {
  let context: FixtureAll;

  beforeEach(async function () {
    context = await loadFixture(deployAll);
  });
  it("should not be paused initially", async function () {
    expect(await context.payoutMgr.paused()).to.be.false;
  });

  it("rejects pause not by owner", async function () {
    await expect(context.payoutMgr.connect(context.alice).pause())
      .to.be.revertedWithCustomError(context.payoutMgr, "OwnableUnauthorizedAccount")
      .withArgs(context.alice);
  });

  it("pauses contract if called by owner", async function () {
    await expect(context.payoutMgr.connect(context.owner).pause()).to.emit(context.payoutMgr, "Paused");
    expect(await context.payoutMgr.paused()).to.be.true;
  });

  it("rejects unpause not by owner", async function () {
    await expect(context.payoutMgr.connect(context.owner).pause()).to.emit(context.payoutMgr, "Paused");
    await expect(context.payoutMgr.connect(context.alice).unpause())
      .to.be.revertedWithCustomError(context.payoutMgr, "OwnableUnauthorizedAccount")
      .withArgs(context.alice);
  });

  it("unpauses contract if called by owner", async function () {
    await expect(context.payoutMgr.connect(context.owner).pause()).to.emit(context.payoutMgr, "Paused");
    expect(await context.payoutMgr.paused()).to.be.true;
    await expect(context.payoutMgr.connect(context.owner).unpause()).to.emit(context.payoutMgr, "Unpaused");
    expect(await context.payoutMgr.paused()).to.be.false;
  });
});
