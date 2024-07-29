- [Payouts Prototype](#payouts-prototype)
  - [Quick start](#quick-start)
    - [Deploy contracts](#deploy-contracts)
    - [Generate signatures](#generate-signatures)
    - [Complete payout](#complete-payout)
    - [Get events](#get-events)
  - [Current setup on testnet](#current-setup-on-testnet)
  - [Known Issues](#known-issues)
  - [Future Improvements](#future-improvements)

# Payouts Prototype

## Quick start

```shell
pnpm install
pnpm hardhat node
```

Put `OWNER_KEY=...` to .env, then:

### Deploy contracts

```shell
$ pnpm hardhat deploy --network localhost
🆗 Current network: localhost
🆗 Using deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
🆗 Deployer balance: 9999.992231425813824533 ETH
🚀 Deploying Payout Manager...
✅ Payout Manager deployed: 0x70e0bA845a1A0F2DA3359C97E0285013525FFC49
🚀 Deploying Treasury...
✅ Treasury deployed: 0x4826533B4897376654Bb4d4AD88B7faFD0C98528
🆗 Payout Manager balance: 1000.0 TR1
```

Fill `.env` file, it should look similar to this:

```
OWNER_KEY= ... owner private key here ...
PAYOUT_CONTRACT=0x70e0bA845a1A0F2DA3359C97E0285013525FFC49
NETWORK_URL=http://localhost:8545
```

### Generate signatures

Then you can generate signatures:

```shell
$ pnpm ts-node cli/signature.ts --help
Usage: signature [options]

Options:
  -p, --payee <payee>    Payee address
  -a, --amount <amount>  Amount to be paid
  -h, --help             display help for command

$ pnpm ts-node cli/signature.ts --payee 0x019286ef6F49585af4A65667fC840b09C85e3907 --amount 1000000000000000
{
  "payee": "0x019286ef6F49585af4A65667fC840b09C85e3907",
  "amount": "1000000000000000",
  "v": 27,
  "r": "0xe066aa4da638ca243d46ebd4840be5c955f7b09418e4228a100706c051b45fd9",
  "s": "0x48e2341aca5bc6fd3ad49b9620dfe48655b5483908d33c22306af712bd73277a"
}
```

### Complete payout

Then you can complete payout. You shoul provide payee private key as argument. This is insecure, but ok for testing
purposes.

```shell
$ pnpm ts-node cli/payout.ts --help
Usage: payout [options]

Options:
  -k, --payee-key <payeeKey>  Payee private key
  -a, --amount <amount>       Amount to be paid
  -v, --v <v>                 Signature v
  -r, --r <r>                 Signature r
  -s, --s <s>                 Signature s
  -h, --help                  display help for command

$ pnpm ts-node cli/payout.ts --payee-key 0x... --amount 1000000000000000 -v 27 -r 0xe066aa4da638ca243d46ebd4840be5c955f7b09418e4228a100706c051b45fd9 -s 0x48e2341aca5bc6fd3ad49b9620dfe48655b5483908d33c22306af712bd73277a
Transaction hash: 0x371c168fdc5c87f8afcd61210d48af1a070ec1a52c827535e2479a59e295e836
Payout processed successfully
```

### Get events

After payout you can see it in logs. Search is limited by 1000 last blocks. In production, logs should be searched in
cycle by chunks. Events will be saved into file, if corresponding argument is provided.

```shell
$ pnpm ts-node cli/events.ts --help
Usage: events [options]

Options:
  -f, --file <name>  Output file name
  -h, --help         display help for command

$ pnpm ts-node cli/events.ts
Found 1 events in last 100 blocks.
[
  {
    "treasury": "0xC23649a034Fb3Cf095fB96fc4dFe13eD22F91852",
    "nonce": "1",
    "payee": "0x019286ef6F49585af4A65667fC840b09C85e3907",
    "amount": "1000000000000000",
    "v": "27",
    "r": "0xe066aa4da638ca243d46ebd4840be5c955f7b09418e4228a100706c051b45fd9",
    "s": "0x48e2341aca5bc6fd3ad49b9620dfe48655b5483908d33c22306af712bd73277a"
  }
]
```

## Current setup on testnet

```shell
$ pnpm hardhat deploy --network bnb_testnet
🆗 Current network: bnb_testnet
🆗 Using deployer address: 0x966e66282a6761da2Fd04D656E412DB9035ACBE2
🆗 Deployer balance: 0.28566849 ETH
🚀 Deploying Payout Manager...
✅ Payout Manager deployed: 0xED5215E2395DA28e4DFaE98849FE05068496d299
🚀 Deploying Treasury...
✅ Treasury deployed: 0xC23649a034Fb3Cf095fB96fc4dFe13eD22F91852
✅ Treasury name: Treasury1
🆗 Payout Manager balance: 1000.0 TR1
```

* [Payout Manager](https://testnet.bscscan.com/address/0xED5215E2395DA28e4DFaE98849FE05068496d299)
* [Treasury](https://testnet.bscscan.com/address/0xC23649a034Fb3Cf095fB96fc4dFe13eD22F91852)

.env file:

```
# Bnb testnet
OWNER_KEY=....
PAYOUT_CONTRACT=0xED5215E2395DA28e4DFaE98849FE05068496d299
# eth_logs disabled
# NETWORK_URL=https://bsc-testnet.bnbchain.org
# NETWORK_URL=https://bsc-dataseed.nariox.org
# eth_logs are working
NETWORK_URL=https://bsc-testnet-rpc.publicnode.com
```

## Known Issues

- Slither reports 1 high and 9 medium issues concerning OpenZeppelin's Math library. Math is used in the Strings and
  MessageHashUtils libraries. I need to investigate this situation by searching in OpenZeppelin issues and other
  sources, but this is out of the task's scope.
- The OpenZeppelin ERC20 implementation has an Approve race condition issue. Since we do not use Approve in our project,
  fixing this issue is out of the task's scope.

## Future Improvements

- Reentrancy is secured with the help of ReentrancyGuard, but it should be tested.
