// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AvelaVault} from "../src/AvelaVault.sol";
import {AvelaPaymentRouter} from "../src/AvelaPaymentRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract IntegrationTest is Test {
    AvelaVault public vault;
    AvelaPaymentRouter public router;

    MockERC20 public wSPYx;
    MockERC20 public usdg;

    address public owner = makeAddr("owner");
    address public signer = makeAddr("signer");
    address public user = makeAddr("user");
    address public merchant = makeAddr("merchant");

    function setUp() public {
        wSPYx = new MockERC20("Wrapped SPY", "wSPYx", 18);
        usdg = new MockERC20("USDG", "USDG", 18);

        vm.startPrank(owner);
        vault = new AvelaVault(owner);
        vault.setWhitelisted(address(wSPYx), true);
        router = new AvelaPaymentRouter(owner, signer);
        vm.stopPrank();

        wSPYx.mint(user, 100 ether);

        usdg.mint(owner, 100 ether);
        vm.startPrank(owner);
        usdg.approve(address(router), 100 ether);
        router.fundReserve(address(usdg), 100 ether);
        vm.stopPrank();
    }

    function test_fullFlow_depositAndPayment() public {
        vm.startPrank(user);
        wSPYx.approve(address(vault), 50 ether);
        vault.deposit(address(wSPYx), 50 ether);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(user, address(wSPYx)), 50 ether);

        bytes32 paymentId = keccak256("payment-001");
        vm.prank(signer);
        router.executePayment(address(usdg), merchant, 10 ether, paymentId, user);

        assertEq(usdg.balanceOf(merchant), 10 ether);
        assertTrue(router.isExecuted(paymentId));
        assertEq(vault.getLockedBalance(user, address(wSPYx)), 50 ether, "Position must stay intact after payment");
    }

    function test_fullFlow_positionStaysIntactAcrossMultiplePayments() public {
        vm.startPrank(user);
        wSPYx.approve(address(vault), 50 ether);
        vault.deposit(address(wSPYx), 50 ether);
        vm.stopPrank();

        vm.startPrank(signer);
        router.executePayment(address(usdg), merchant, 5 ether, keccak256("pay-1"), user);
        router.executePayment(address(usdg), merchant, 3 ether, keccak256("pay-2"), user);
        router.executePayment(address(usdg), merchant, 2 ether, keccak256("pay-3"), user);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(user, address(wSPYx)), 50 ether, "Position must stay intact across all payments");
        assertEq(usdg.balanceOf(merchant), 10 ether);
    }

    function test_fullFlow_userCanWithdrawAfterPayments() public {
        vm.startPrank(user);
        wSPYx.approve(address(vault), 50 ether);
        vault.deposit(address(wSPYx), 50 ether);
        vm.stopPrank();

        bytes32 paymentId = keccak256("payment-before-withdraw");
        vm.prank(signer);
        router.executePayment(address(usdg), merchant, 5 ether, paymentId, user);

        vm.prank(user);
        vault.withdraw(address(wSPYx), 50 ether);

        assertEq(wSPYx.balanceOf(user), 100 ether, "User gets full position back after withdrawal");
        assertEq(vault.getLockedBalance(user, address(wSPYx)), 0);
    }

    function test_eventsCarrySharedPaymentId() public {
        vm.startPrank(user);
        wSPYx.approve(address(vault), 50 ether);
        vault.deposit(address(wSPYx), 50 ether);
        vm.stopPrank();

        bytes32 paymentId = keccak256("traceable-payment");

        vm.expectEmit(true, true, true, true);
        emit AvelaPaymentRouter.PaymentExecuted(paymentId, user, merchant, address(usdg), 10 ether, block.timestamp);

        vm.prank(signer);
        router.executePayment(address(usdg), merchant, 10 ether, paymentId, user);
    }
}
