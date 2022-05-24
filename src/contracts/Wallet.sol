// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

// import "./AccessControl.sol";

abstract contract Wallet {
    // address public constant RESERVES_WALLET_ADDRESS =
    //     address(0x3A528Ca83A9D4e167Dc9c14690349E3b6FC02054);
    address public COMMISSION_WALLET_ADDRESS;
    address public RESERVES_WALLET_ADDRESS;

    mapping(address => bytes32) internal _wallets;

    /**
     * @dev Modifier that checks that an account must not be any wallet addresses. Reverts
     * with a ForbiddenError(address account).
     */
    // modifier validateSenderAccount() {
    //     if (_wallets[msg.sender] != 0) revert ForbiddenError(msg.sender);
    //     _;
    // }

    constructor(address RESERVE, address COMMISSION) {
        COMMISSION_WALLET_ADDRESS = COMMISSION;
        RESERVES_WALLET_ADDRESS = RESERVE;

        _wallets[COMMISSION_WALLET_ADDRESS] = keccak256("COMMISSION_WALLET");

        _wallets[RESERVES_WALLET_ADDRESS] = keccak256("RESERVES_WALLET");
    }
}
