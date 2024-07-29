import { Command } from "commander";
import "dotenv/config";
import { ethers } from "ethers";

import { genSignature } from "../src/signature";

const program = new Command();

program
  .option("-p, --payee <payee>", "Payee address")
  .option("-a, --amount <amount>", "Amount to be paid")
  .parse(process.argv);

interface IOptions {
  payee: string;
  amount: string;
}
const options: IOptions = program.opts();

if (!options.payee || !options.amount) {
  console.error("Payee address and amount are required.");
  process.exit(1);
} else if (!ethers.isAddress(options.payee)) {
  console.error("Invalid payee address.");
  process.exit(1);
}

const PAYOUT_CONTRACT = process.env.PAYOUT_CONTRACT ?? "";
const OWNER_KEY = process.env.OWNER_KEY ?? "";
const NETWORK_URL = process.env.NETWORK_URL ?? "";

if (!PAYOUT_CONTRACT || !OWNER_KEY || !NETWORK_URL) {
  console.error("PAYOUT_CONTRACT, OWNER_KEY, and NETWORK_URL must be set in environment variables.");
  process.exit(1);
}

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(NETWORK_URL);
    const signer = new ethers.Wallet(OWNER_KEY, provider);

    const payoutContract = new ethers.Contract(
      PAYOUT_CONTRACT,
      ["function nonces(address) view returns (uint256)"] as const,
      provider,
    );

    const nonce: bigint = (await payoutContract.nonces(options.payee)) as bigint;
    const amount = BigInt(options.amount);

    const signature = await genSignature(signer, options.payee, amount, nonce);

    console.log(
      JSON.stringify(
        {
          payee: options.payee,
          amount: options.amount,
          v: signature.v,
          r: signature.r,
          s: signature.s,
        },
        null,
        2,
      ),
    );
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
