// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

interface IPayoutMgr {
    function payout(uint256 amount, uint8 v, bytes32 r, bytes32 s) external;
    function setTreasury(address treasuryAddress) external;
}
