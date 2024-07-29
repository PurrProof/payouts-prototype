// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Nonces } from "@openzeppelin/contracts/utils/Nonces.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IPayoutMgr } from "./interfaces/IPayoutMgr.sol";
import { IPausable } from "./interfaces/IPausable.sol";

contract PayoutMgr is Ownable, Pausable, Nonces, ReentrancyGuard, IPayoutMgr, IPausable {
    using Strings for uint256;

    address public treasuryAddress;
    IERC20 private _treasury;

    event PayedOut(
        address indexed treasury,
        uint256 indexed nonce,
        address indexed payee,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s
    );
    event TreasuryChanged(address indexed treasury);

    error TreasuryAlreadyInUse(address);
    error TreasuryBalanceNotEnough(uint256 balance, address payee, uint256 amount);
    error TreasuryEmpty(address);
    error TreasuryInvalid(address);
    error TreasuryNotSet();

    error ChequeInvalid();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function payout(uint256 amount, uint8 v, bytes32 r, bytes32 s) external override whenNotPaused nonReentrant {
        if (treasuryAddress == address(0)) {
            revert TreasuryNotSet();
        }

        uint256 nonce = _useNonce(msg.sender);
        if (
            !_verifyCheque({
                nonce: nonce,
                payee: msg.sender,
                amount: amount,
                v: v,
                r: r,
                s: s,
                initialSigner: owner()
            })
        ) {
            revert ChequeInvalid();
        }

        uint256 balance = _treasury.balanceOf(address(this));
        if (amount > balance) {
            revert TreasuryBalanceNotEnough(balance, msg.sender, amount);
        }

        SafeERC20.safeTransfer(_treasury, msg.sender, amount);
        emit PayedOut({ treasury: treasuryAddress, nonce: nonce, payee: msg.sender, amount: amount, v: v, r: r, s: s });
    }

    function setTreasury(address newToken) external override onlyOwner {
        if (newToken.code.length == 0) {
            revert TreasuryInvalid(newToken);
        } else if (treasuryAddress == newToken) {
            revert TreasuryAlreadyInUse(newToken);
        } else if (!(IERC20(newToken).balanceOf(address(this)) > 0)) {
            revert TreasuryEmpty(newToken);
        }

        treasuryAddress = newToken;
        _treasury = IERC20(treasuryAddress);
        emit TreasuryChanged(treasuryAddress);
    }

    function _verifyCheque(
        uint256 nonce,
        address payee,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address initialSigner
    ) internal pure returns (bool correct) {
        bytes memory message = bytes(string.concat(_addressToString(payee), amount.toString(), nonce.toString()));
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(message);

        (address recoveredSigner, ECDSA.RecoverError error, ) = ECDSA.tryRecover(messageHash, v, r, s);

        if (error != ECDSA.RecoverError.NoError) {
            return false;
        }
        return (recoveredSigner == initialSigner);
    }

    function _addressToString(address _addr) private pure returns (string memory res) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; ++i) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
