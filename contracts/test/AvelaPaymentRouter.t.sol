// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AvelaPaymentRouter} from "../src/AvelaPaymentRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AvelaPaymentRouterTest is Test {
    AvelaPaymentRouter public router;
    MockERC20 public usdg;
    MockERC20 public usdc;

    address public owner = makeAddr("owner");
    address public signer = makeAddr("signer");
    address public merchant = makeAddr("merchant");
    address public collateralOwner = makeAddr("collateralOwner");
    address public alice = makeAddr("alice");

    function setUp() public {
        usdg = new MockERC20("USDG", "USDG", 18);
        usdc = new MockERC20("USDC", "USDC", 6);

        vm.prank(owner);
        router = new AvelaPaymentRouter(owner, signer);

        usdg.mint(address(this), 1000 ether);
        usdg.approve(address(router), 1000 ether);
        router.fundReserve(address(usdg), 100 ether);

        usdc.mint(address(this), 1000e6);
        usdc.approve(address(router), 1000e6);
        router.fundReserve(address(usdc), 100e6);
    }

    function test_executePayment_settlesFromReserve() public {
        bytes32 paymentId = keccak256("payment-1");

        vm.prank(signer);
        router.executePayment(address(usdg), merchant, 5 ether, paymentId, collateralOwner);

        assertEq(usdg.balanceOf(merchant), 5 ether);
        assertTrue(router.isExecuted(paymentId));
    }

    function test_executePayment_emitsEvent() public {
        bytes32 paymentId = keccak256("payment-2");

        vm.expectEmit(true, true, true, true);
        emit AvelaPaymentRouter.PaymentExecuted(paymentId, collateralOwner, merchant, address(usdg), 5 ether, block.timestamp);

        vm.prank(signer);
        router.executePayment(address(usdg), merchant, 5 ether, paymentId, collateralOwner);
    }

    function test_executePayment_multiStablecoin() public {
        bytes32 paymentId1 = keccak256("payment-usdg");
        bytes32 paymentId2 = keccak256("payment-usdc");

        vm.startPrank(signer);
        router.executePayment(address(usdg), merchant, 5 ether, paymentId1, collateralOwner);
        router.executePayment(address(usdc), merchant, 5e6, paymentId2, collateralOwner);
        vm.stopPrank();

        assertEq(usdg.balanceOf(merchant), 5 ether);
        assertEq(usdc.balanceOf(merchant), 5e6);
    }

    function test_executePayment_revertsIfNotSigner() public {
        bytes32 paymentId = keccak256("payment-3");

        vm.prank(alice);
        vm.expectRevert(AvelaPaymentRouter.NotAuthorizedSigner.selector);
        router.executePayment(address(usdg), merchant, 5 ether, paymentId, collateralOwner);
    }

    function test_executePayment_revertsOnReplay() public {
        bytes32 paymentId = keccak256("payment-4");

        vm.startPrank(signer);
        router.executePayment(address(usdg), merchant, 1 ether, paymentId, collateralOwner);
        vm.expectRevert(abi.encodeWithSelector(AvelaPaymentRouter.PaymentAlreadyExecuted.selector, paymentId));
        router.executePayment(address(usdg), merchant, 1 ether, paymentId, collateralOwner);
        vm.stopPrank();
    }

    function test_executePayment_revertsOnZeroAmount() public {
        bytes32 paymentId = keccak256("payment-5");
        vm.prank(signer);
        vm.expectRevert(AvelaPaymentRouter.ZeroAmount.selector);
        router.executePayment(address(usdg), merchant, 0, paymentId, collateralOwner);
    }

    function test_executePayment_revertsOnZeroAddress() public {
        bytes32 paymentId = keccak256("payment-6");
        vm.prank(signer);
        vm.expectRevert(AvelaPaymentRouter.ZeroAddress.selector);
        router.executePayment(address(usdg), address(0), 1 ether, paymentId, collateralOwner);
    }

    function test_executePayment_revertsOnInsufficientReserve() public {
        bytes32 paymentId = keccak256("payment-7");
        vm.prank(signer);
        vm.expectRevert(abi.encodeWithSelector(AvelaPaymentRouter.InsufficientReserve.selector, 200 ether, 100 ether));
        router.executePayment(address(usdg), merchant, 200 ether, paymentId, collateralOwner);
    }

    function test_fundReserve_anyoneCanFund() public {
        usdg.mint(alice, 50 ether);
        vm.startPrank(alice);
        usdg.approve(address(router), 50 ether);
        router.fundReserve(address(usdg), 50 ether);
        vm.stopPrank();

        assertEq(router.getReserveBalance(address(usdg)), 150 ether);
    }

    function test_fundReserve_emitsEvent() public {
        usdg.mint(alice, 10 ether);
        vm.startPrank(alice);
        usdg.approve(address(router), 10 ether);

        vm.expectEmit(true, true, false, true);
        emit AvelaPaymentRouter.ReserveFunded(alice, address(usdg), 10 ether);

        router.fundReserve(address(usdg), 10 ether);
        vm.stopPrank();
    }

    function test_withdrawReserve_onlyOwner() public {
        vm.prank(owner);
        router.withdrawReserve(address(usdg), owner, 10 ether);
        assertEq(usdg.balanceOf(owner), 10 ether);
        assertEq(router.getReserveBalance(address(usdg)), 90 ether);
    }

    function test_withdrawReserve_revertsIfNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        router.withdrawReserve(address(usdg), alice, 10 ether);
    }

    function test_setAuthorizedSigner_rotatesKey() public {
        address newSigner = makeAddr("newSigner");
        vm.prank(owner);
        router.setAuthorizedSigner(newSigner);

        bytes32 paymentId = keccak256("payment-new-signer");
        vm.prank(newSigner);
        router.executePayment(address(usdg), merchant, 1 ether, paymentId, collateralOwner);

        assertEq(usdg.balanceOf(merchant), 1 ether);
    }

    function test_setAuthorizedSigner_emitsEvent() public {
        address newSigner = makeAddr("newSigner");
        vm.expectEmit(true, true, false, false);
        emit AvelaPaymentRouter.AuthorizedSignerUpdated(signer, newSigner);
        vm.prank(owner);
        router.setAuthorizedSigner(newSigner);
    }

    function test_setAuthorizedSigner_revertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AvelaPaymentRouter.ZeroAddress.selector);
        router.setAuthorizedSigner(address(0));
    }

    function test_setAuthorizedSigner_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        router.setAuthorizedSigner(alice);
    }

    function testFuzz_executePayment_respectsReserve(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        bytes32 paymentId = keccak256(abi.encodePacked("fuzz-", amount));

        vm.prank(signer);
        router.executePayment(address(usdg), merchant, amount, paymentId, collateralOwner);

        assertEq(usdg.balanceOf(merchant), amount);
        assertEq(router.getReserveBalance(address(usdg)), 100 ether - amount);
    }
}
