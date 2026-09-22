// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AvelaVault} from "../src/AvelaVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AvelaVaultTest is Test {
    AvelaVault public vault;
    MockERC20 public wSPYx;
    MockERC20 public wQQQx;
    MockERC20 public notWhitelisted;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        wSPYx = new MockERC20("Wrapped SPY", "wSPYx", 18);
        wQQQx = new MockERC20("Wrapped QQQ", "wQQQx", 18);
        notWhitelisted = new MockERC20("Not Listed", "NOPE", 18);

        vm.startPrank(owner);
        vault = new AvelaVault(owner);
        vault.setWhitelisted(address(wSPYx), true);
        vault.setWhitelisted(address(wQQQx), true);
        vm.stopPrank();

        wSPYx.mint(alice, 100 ether);
        wQQQx.mint(alice, 50 ether);
        wSPYx.mint(bob, 200 ether);
    }

    function test_deposit_locksTokens() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(alice, address(wSPYx)), 10 ether);
        assertEq(vault.totalLocked(address(wSPYx)), 10 ether);
        assertEq(wSPYx.balanceOf(address(vault)), 10 ether);
    }

    function test_deposit_emitsPositionLocked() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);

        vm.expectEmit(true, true, false, true);
        emit AvelaVault.PositionLocked(alice, address(wSPYx), 10 ether, 10 ether);

        vault.deposit(address(wSPYx), 10 ether);
        vm.stopPrank();
    }

    function test_deposit_multipleAssets() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        wQQQx.approve(address(vault), 5 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vault.deposit(address(wQQQx), 5 ether);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(alice, address(wSPYx)), 10 ether);
        assertEq(vault.getLockedBalance(alice, address(wQQQx)), 5 ether);
    }

    function test_deposit_revertsIfNotWhitelisted() public {
        notWhitelisted.mint(alice, 100 ether);
        vm.startPrank(alice);
        notWhitelisted.approve(address(vault), 10 ether);
        vm.expectRevert(abi.encodeWithSelector(AvelaVault.TokenNotWhitelisted.selector, address(notWhitelisted)));
        vault.deposit(address(notWhitelisted), 10 ether);
        vm.stopPrank();
    }

    function test_deposit_revertsOnZeroAmount() public {
        vm.startPrank(alice);
        vm.expectRevert(AvelaVault.ZeroAmount.selector);
        vault.deposit(address(wSPYx), 0);
        vm.stopPrank();
    }

    function test_withdraw_releasesTokens() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vault.withdraw(address(wSPYx), 4 ether);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(alice, address(wSPYx)), 6 ether);
        assertEq(vault.totalLocked(address(wSPYx)), 6 ether);
        assertEq(wSPYx.balanceOf(alice), 94 ether);
    }

    function test_withdraw_emitsPositionReleased() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);

        vm.expectEmit(true, true, false, true);
        emit AvelaVault.PositionReleased(alice, address(wSPYx), 4 ether, 6 ether);

        vault.withdraw(address(wSPYx), 4 ether);
        vm.stopPrank();
    }

    function test_withdraw_revertsIfInsufficientBalance() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vm.expectRevert(abi.encodeWithSelector(AvelaVault.InsufficientLockedBalance.selector, 15 ether, 10 ether));
        vault.withdraw(address(wSPYx), 15 ether);
        vm.stopPrank();
    }

    function test_withdraw_revertsOnZeroAmount() public {
        vm.startPrank(alice);
        vm.expectRevert(AvelaVault.ZeroAmount.selector);
        vault.withdraw(address(wSPYx), 0);
        vm.stopPrank();
    }

    function test_withdraw_onlyOwnBalance() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        vm.expectRevert(abi.encodeWithSelector(AvelaVault.InsufficientLockedBalance.selector, 10 ether, 0));
        vault.withdraw(address(wSPYx), 10 ether);
        vm.stopPrank();
    }

    function test_ownerCannotWithdrawUserFunds() public {
        vm.startPrank(alice);
        wSPYx.approve(address(vault), 10 ether);
        vault.deposit(address(wSPYx), 10 ether);
        vm.stopPrank();

        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(AvelaVault.InsufficientLockedBalance.selector, 10 ether, 0));
        vault.withdraw(address(wSPYx), 10 ether);
        vm.stopPrank();
    }

    function test_setWhitelisted_onlyOwner() public {
        vm.startPrank(alice);
        vm.expectRevert();
        vault.setWhitelisted(address(notWhitelisted), true);
        vm.stopPrank();
    }

    function test_setWhitelisted_emitsEvent() public {
        vm.startPrank(owner);
        vm.expectEmit(true, false, false, true);
        emit AvelaVault.TokenWhitelistUpdated(address(notWhitelisted), true);
        vault.setWhitelisted(address(notWhitelisted), true);
        vm.stopPrank();
    }

    function testFuzz_deposit_withdraw(uint256 depositAmount, uint256 withdrawAmount) public {
        depositAmount = bound(depositAmount, 1, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount);

        wSPYx.mint(alice, depositAmount);

        vm.startPrank(alice);
        wSPYx.approve(address(vault), depositAmount);
        vault.deposit(address(wSPYx), depositAmount);
        vault.withdraw(address(wSPYx), withdrawAmount);
        vm.stopPrank();

        assertEq(vault.getLockedBalance(alice, address(wSPYx)), depositAmount - withdrawAmount);
    }
}
