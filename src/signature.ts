import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "ethers";

export async function genSignature(
  signer: SignerWithAddress | ethers.Wallet,
  payee: string,
  amount: bigint,
  nonce: bigint,
): Promise<ethers.Signature> {
  const message = payee.toLowerCase() + amount.toString() + nonce.toString();
  const rawSig = await signer.signMessage(message);
  return ethers.Signature.from(rawSig);
}
