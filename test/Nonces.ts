import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { FixtureAll, deployAll } from "./_fixtures";

describe("Nonces", function () {
  let context: FixtureAll;

  beforeEach(async function () {
    context = await loadFixture(deployAll);
  });

  it("returns 0 as nonce for the new user", async function () {
    expect(await context.payoutMgr.connect(context.owner).nonces(await context.alice.getAddress())).to.be.equal(0);
  });
});
