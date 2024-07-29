// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import { PayoutMgr } from "../../contracts/PayoutMgr.sol";

//import "hardhat/console.sol";

interface ITestPayoutMgr {
    function testVerifyCheque(
        uint256 nonce,
        address payee,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address initialSigner
    ) external view returns (bool correct);
}

contract TestPayoutMgr is PayoutMgr, ITestPayoutMgr {
    constructor(address initialOwner) PayoutMgr(initialOwner) {}

    function testVerifyCheque(
        uint256 nonce,
        address payee,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address initialSigner
    ) external pure override returns (bool correct) {
        return
            super._verifyCheque({
                nonce: nonce,
                payee: payee,
                amount: amount,
                v: v,
                r: r,
                s: s,
                initialSigner: initialSigner
            });
    }
}
