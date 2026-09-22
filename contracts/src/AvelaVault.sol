// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AvelaVault
/// @notice Multi-asset collateral vault. Locks wrapped xStocks as provable collateral.
///         Non-custodial: only the original depositor can withdraw their own balance.
///         No admin or backend key can move user funds.
contract AvelaVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(address token => bool) public whitelisted;
    mapping(address depositor => mapping(address token => uint256)) public lockedBalance;
    mapping(address token => uint256) public totalLocked;

    event PositionLocked(address indexed depositor, address indexed token, uint256 amount, uint256 newBalance);
    event PositionReleased(address indexed depositor, address indexed token, uint256 amount, uint256 newBalance);
    event TokenWhitelistUpdated(address indexed token, bool status);

    error ZeroAmount();
    error ZeroAddress();
    error TokenNotWhitelisted(address token);
    error InsufficientLockedBalance(uint256 requested, uint256 available);

    constructor(address _owner) Ownable(_owner) {}

    function deposit(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!whitelisted[token]) revert TokenNotWhitelisted(token);

        lockedBalance[msg.sender][token] += amount;
        totalLocked[token] += amount;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit PositionLocked(msg.sender, token, amount, lockedBalance[msg.sender][token]);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 balance = lockedBalance[msg.sender][token];
        if (amount > balance) revert InsufficientLockedBalance(amount, balance);

        lockedBalance[msg.sender][token] = balance - amount;
        totalLocked[token] -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit PositionReleased(msg.sender, token, amount, lockedBalance[msg.sender][token]);
    }

    function setWhitelisted(address token, bool status) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        whitelisted[token] = status;
        emit TokenWhitelistUpdated(token, status);
    }

    function getLockedBalance(address depositor, address token) external view returns (uint256) {
        return lockedBalance[depositor][token];
    }
}
