// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.26;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is ERC20, Ownable {
    constructor(
        address initialOwner,
        string memory tname,
        string memory tsymbol,
        uint256 premintAmount
    ) ERC20(tname, tsymbol) Ownable(initialOwner) {
        _mint(msg.sender, premintAmount * 10 ** decimals());
    }
}
