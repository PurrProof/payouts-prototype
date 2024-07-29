import { task } from "hardhat/config";

task("deploy", "Deploy PayoutMgr and Treasury").setAction(async (taskArgs, hre) => {
  console.log(`🆗 Current network: ${hre.network.name}`);

  // load deployer key from environment or .env file
  const OWNER_KEY = process.env.OWNER_KEY;
  if (!OWNER_KEY) {
    throw new Error("OWNER_KEY not set in environment or .env file");
  }

  // set up the deployer account
  const deployerWallet = new hre.ethers.Wallet(OWNER_KEY, hre.ethers.provider);
  const deployerBalance = hre.ethers.formatUnits(await hre.ethers.provider.getBalance(deployerWallet), "ether");
  console.log(`🆗 Using deployer address: ${deployerWallet.address}`);
  console.log(`🆗 Deployer balance: ${deployerBalance} ETH`);

  // deploy payout manager contract
  console.log("🚀 Deploying Payout Manager...");
  const PayoutMgr = await hre.ethers.getContractFactory("PayoutMgr");
  const payoutMgr = await PayoutMgr.deploy(deployerWallet.address);
  await payoutMgr.waitForDeployment();
  const payoutMgrAddress = await payoutMgr.getAddress();
  console.log(`✅ Payout Manager deployed: ${payoutMgrAddress}`);

  // deploy Treasury contract
  console.log("🚀 Deploying Treasury...");
  const initialTreasuryBalanceEth = 1000n;
  const name = "Treasury1";
  const symbol = "TR1";
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const token1 = await Treasury.deploy(deployerWallet.address, name, symbol, initialTreasuryBalanceEth);
  await token1.waitForDeployment();
  console.log(`✅ Treasury deployed: ${await token1.getAddress()}`);
  console.log(`✅ Treasury name: ${await token1.name()}`);

  // fullfill PayoutMgr balance
  const decimals = await token1.decimals();
  await token1.transfer(await payoutMgr.getAddress(), initialTreasuryBalanceEth * 10n ** decimals, {
    gasLimit: 2_000_000,
  });

  // register Treasury in PayoutMgr
  await payoutMgr.setTreasury(await token1.getAddress(), {
    gasLimit: 2_000_000,
  });
  const balance = hre.ethers.formatUnits(await token1.balanceOf(payoutMgrAddress), "ether");
  console.log(`🆗 Payout Manager balance: ${balance} ${symbol}`);
});
