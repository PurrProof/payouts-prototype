import { Command } from "commander";
import "dotenv/config";
import { ethers } from "ethers";

const program = new Command();

program
  .option("-k, --payee-key <payeeKey>", "Payee private key")
  .option("-a, --amount <amount>", "Amount to be paid")
  .option("-v, --v <v>", "Signature v")
  .option("-r, --r <r>", "Signature r")
  .option("-s, --s <s>", "Signature s")
  .parse(process.argv);

interface IOptions {
  payeeKey: string;
  amount: string;
  v: string;
  r: string;
  s: string;
}
const options: IOptions = program.opts();

if (!options.payeeKey || !options.amount || !options.v || !options.r || !options.s) {
  console.error("Payee key, amount, v, r, and s are required.");
  process.exit(1);
}

const amount = BigInt(options.amount);
const v = Number(options.v);
const r = ethers.hexlify(options.r);
const s = ethers.hexlify(options.s);

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NETWORK_URL ?? "");
    const wallet = new ethers.Wallet(options.payeeKey, provider);

    const payoutContract = new ethers.Contract(
      process.env.PAYOUT_CONTRACT ?? "",
      ["function payout(uint256 amount, uint8 v, bytes32 r, bytes32 s) external"] as const,
      wallet,
    );

    const tx = (await payoutContract.payout(amount, v, r, s)) as ethers.Transaction;
    console.log(`Transaction hash: ${tx.hash ?? ""}`);
    console.log("Payout processed successfully");
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
