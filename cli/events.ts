import { Command } from "commander";
import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

const program = new Command();

program.option("-f, --file <name>", "Output file name").parse(process.argv);

interface IOptions {
  file: string;
}
const options: IOptions = program.opts();

const NETWORK_URL = process.env.NETWORK_URL ?? "";
const PAYOUT_CONTRACT = process.env.PAYOUT_CONTRACT ?? "";

if (!NETWORK_URL || !PAYOUT_CONTRACT) {
  console.error("NETWORK_URL and PAYOUT_CONTRACT must be set in environment variables.");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(NETWORK_URL);

  const contractABI = [
    "event PayedOut(address indexed treasury, uint256 indexed nonce, address indexed payee, uint256 amount, uint8 v, bytes32 r, bytes32 s)",
  ];

  const contract = new ethers.Contract(PAYOUT_CONTRACT, contractABI, provider);

  const filter = contract.filters.PayedOut();

  const curBlock = await provider.getBlockNumber();
  const logs = await contract.queryFilter(filter, curBlock - 1000, curBlock);
  console.log(`Found ${logs.length.toString()} events in last 1000 blocks.`);

  const processedEvents = logs.map((log) => {
    const event = contract.interface.parseLog(log);
    if (!event) {
      return;
    }
    const { treasury, nonce, payee, amount, v, r, s } = event.args;
    return {
      treasury: treasury as string,
      nonce: (nonce as bigint).toString(),
      payee: payee as string,
      amount: (amount as bigint).toString(),
      v: v as number,
      r: r as string,
      s: s as string,
    };
  });

  const json = JSON.stringify(
    processedEvents,
    (key: string, value: unknown): unknown => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    },
    2,
  );
  if (options.file) {
    fs.writeFileSync(options.file, json);
    console.log(`Events have been written to ${options.file}`);
  } else {
    console.log(json);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
