// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AvelaPaymentRouter
/// @notice Multi-stablecoin settlement from a pre-funded reserve. Each payment carries
///         a paymentId linking it to the collateral in AvelaVault for on-chain traceability.
///         Custodial for MVP: single backend EOA calls executePayment. Stated limitation.
contract AvelaPaymentRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public authorizedSigner;
    mapping(bytes32 paymentId => bool) public isExecuted;

    event PaymentExecuted(
        bytes32 indexed paymentId,
        address indexed collateralOwner,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 timestamp
    );
    event ReserveFunded(address indexed funder, address indexed token, uint256 amount);
    event ReserveWithdrawn(address indexed to, address indexed token, uint256 amount);
    event AuthorizedSignerUpdated(address indexed previousSigner, address indexed newSigner);

    error NotAuthorizedSigner();
    error PaymentAlreadyExecuted(bytes32 paymentId);
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientReserve(uint256 requested, uint256 available);

    modifier onlyAuthorizedSigner() {
        if (msg.sender != authorizedSigner) revert NotAuthorizedSigner();
        _;
    }

    constructor(address _owner, address _authorizedSigner) Ownable(_owner) {
        authorizedSigner = _authorizedSigner;
    }

    function executePayment(
        address token,
        address merchant,
        uint256 amount,
        bytes32 paymentId,
        address collateralOwner
    ) external onlyAuthorizedSigner nonReentrant {
        if (token == address(0) || merchant == address(0) || collateralOwner == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (isExecuted[paymentId]) revert PaymentAlreadyExecuted(paymentId);

        uint256 available = IERC20(token).balanceOf(address(this));
        if (amount > available) revert InsufficientReserve(amount, available);

        isExecuted[paymentId] = true;

        IERC20(token).safeTransfer(merchant, amount);

        emit PaymentExecuted(paymentId, collateralOwner, merchant, token, amount, block.timestamp);
    }

    function fundReserve(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit ReserveFunded(msg.sender, token, amount);
    }

    function withdrawReserve(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (amount > balance) revert InsufficientReserve(amount, balance);
        IERC20(token).safeTransfer(to, amount);
        emit ReserveWithdrawn(to, token, amount);
    }

    function setAuthorizedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit AuthorizedSignerUpdated(authorizedSigner, newSigner);
        authorizedSigner = newSigner;
    }

    function getReserveBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
