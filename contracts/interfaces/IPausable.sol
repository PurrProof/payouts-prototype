// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

interface IPausable {
    function pause() external;

    function unpause() external;
}
