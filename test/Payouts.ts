import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

import { genSignature } from "../src/signature";
import { FixtureAll, deployAll } from "./_fixtures";

describe("Payouts", function () {
  let context: FixtureAll;
  const ONE_GWEI = 1_000_000_000n;
  const ONE_ETH = 1_000_000_000_000_000_000n;
  const MILLION_ETH = ONE_ETH * 1_000_000n;
  const NONCE_0 = 0n;
  const NONCE_1 = 1n;

  beforeEach(async function () {
    context = await loadFixture(deployAll);
  });

  describe("Golden Path", function () {
    it("pays out by valid cheque", async function () {
      const treasury = await context.payoutMgr.treasuryAddress();
      const treasuryInitialBalance = await context.token1.balanceOf(await context.payoutMgr.getAddress());
      const payee = await context.alice.getAddress();
      const payee2 = await context.bob.getAddress();
      const nonce = await context.payoutMgr.connect(context.owner).nonces(payee);
      const amount = ONE_ETH;
      const sig = await genSignature(context.owner, payee, amount, nonce);

      expect(await context.token1.balanceOf(payee)).to.equal(0n);

      // cheque payed out successfully
      await expect(context.payoutMgr.connect(context.alice).payout(amount, sig.v, sig.r, sig.s))
        .to.emit(context.payoutMgr, "PayedOut")
        .withArgs(treasury, nonce, payee, amount, sig.v, sig.r, sig.s);

      // token balance of payee increased
      expect(await context.token1.balanceOf(payee)).to.equal(amount);

      // it's impossible to payout cheque twice
      await expect(
        context.payoutMgr.connect(context.alice).payout(amount, sig.v, sig.r, sig.s),
      ).to.be.revertedWithCustomError(context.payoutMgr, "ChequeInvalid");

      // nonce increased for the user
      const newNonce = await context.payoutMgr.connect(context.owner).nonces(payee);
      expect(newNonce).to.be.equal(nonce + 1n);

      // nonce for other user didn't change
      const payee2Nonce = await context.payoutMgr.connect(context.owner).nonces(payee2);
      expect(payee2Nonce).to.be.equal(0n);

      // another payout is possible
      const sig2 = await genSignature(context.owner, payee, amount, newNonce);
      await expect(context.payoutMgr.connect(context.alice).payout(amount, sig2.v, sig2.r, sig2.s))
        .to.emit(context.payoutMgr, "PayedOut")
        .withArgs(treasury, newNonce, payee, amount, sig2.v, sig2.r, sig2.s);

      // token balance of payee increased
      expect(await context.token1.balanceOf(payee)).to.equal(amount + amount);

      // available token balance in treasury decreased correspondingly
      expect(await context.token1.balanceOf(await context.payoutMgr.getAddress())).to.equal(
        treasuryInitialBalance - amount - amount,
      );

      // change treasury
      await expect(context.payoutMgr.connect(context.owner).setTreasury(await context.token2.getAddress()))
        .to.emit(context.payoutMgr, "TreasuryChanged")
        .withArgs(context.token2);

      // payee2 has zero token balance
      expect(await context.token2.balanceOf(payee2)).to.equal(0n);

      // payout for another user goes from new treasury
      const sig3 = await genSignature(context.owner, payee2, amount, payee2Nonce);
      await expect(context.payoutMgr.connect(context.bob).payout(amount, sig3.v, sig3.r, sig3.s))
        .to.emit(context.payoutMgr, "PayedOut")
        .withArgs(await context.token2.getAddress(), payee2Nonce, payee2, amount, sig3.v, sig3.r, sig3.s);

      // token balance of payee2 increased
      expect(await context.token2.balanceOf(payee2)).to.equal(amount);
    });
  });

  describe("Edge cases", function () {
    it("rejects payout when paused", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);

      await expect(context.payoutMgr.connect(context.owner).pause()).to.emit(context.payoutMgr, "Paused");
      expect(await context.payoutMgr.paused()).to.be.true;

      await expect(
        context.payoutMgr.connect(context.alice).payout(ONE_GWEI, sig.v, sig.r, sig.s),
      ).to.be.revertedWithCustomError(context.payoutMgr, "EnforcedPause");
    });

    it("rejects if treasury balance isn't enough", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), MILLION_ETH, NONCE_0);
      const treasuryBalance = await context.token1.balanceOf(await context.payoutMgr.getAddress());
      await expect(context.payoutMgr.connect(context.alice).payout(MILLION_ETH, sig.v, sig.r, sig.s))
        .to.be.revertedWithCustomError(context.payoutMgr, "TreasuryBalanceNotEnough")
        .withArgs(treasuryBalance, await context.alice.getAddress(), MILLION_ETH);
    });
  });

  describe("Wrong cheques", function () {
    it("rejects payout with wrong amount", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);
      await expect(
        context.payoutMgr.connect(context.alice).payout(MILLION_ETH, sig.v, sig.r, sig.s),
      ).to.be.revertedWithCustomError(context.payoutMgr, "ChequeInvalid");
    });

    it("rejects payout from wrong sender", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);
      await expect(
        context.payoutMgr.connect(context.bob).payout(MILLION_ETH, sig.v, sig.r, sig.s),
      ).to.be.revertedWithCustomError(context.payoutMgr, "ChequeInvalid");
    });

    it("rejects payout with wrong nonce", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_1);
      await expect(
        context.payoutMgr.connect(context.alice).payout(MILLION_ETH, sig.v, sig.r, sig.s),
      ).to.be.revertedWithCustomError(context.payoutMgr, "ChequeInvalid");
    });
  });

  describe("Cheque verification (unit test)", function () {
    it("rejects signature with wrong amount", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);
      expect(
        await context.payoutMgr
          .connect(context.owner)
          .testVerifyCheque(
            NONCE_0,
            await context.alice.getAddress(),
            2n * ONE_GWEI,
            sig.v,
            sig.r,
            sig.s,
            await context.owner.getAddress(),
          ),
      ).to.be.false;
    });

    it("rejects signature from wrong sender", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);
      expect(
        await context.payoutMgr
          .connect(context.owner)
          .testVerifyCheque(
            NONCE_0,
            await context.bob.getAddress(),
            ONE_GWEI,
            sig.v,
            sig.r,
            sig.s,
            await context.owner.getAddress(),
          ),
      ).to.be.false;
    });

    it("rejects signature with wrong nonce", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_1);
      expect(
        await context.payoutMgr
          .connect(context.owner)
          .testVerifyCheque(
            NONCE_0,
            await context.alice.getAddress(),
            ONE_GWEI,
            sig.v,
            sig.r,
            sig.s,
            await context.owner.getAddress(),
          ),
      ).to.be.false;
    });

    it("verifies correct signature sucessfully", async function () {
      const sig = await genSignature(context.owner, await context.alice.getAddress(), ONE_GWEI, NONCE_0);
      expect(
        await context.payoutMgr
          .connect(context.owner)
          .testVerifyCheque(
            NONCE_0,
            await context.alice.getAddress(),
            ONE_GWEI,
            sig.v,
            sig.r,
            sig.s,
            await context.owner.getAddress(),
          ),
      ).to.be.true;
    });
  });
});
