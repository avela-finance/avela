# Smart Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy AvelaVault (multi-asset collateral) and AvelaPaymentRouter (multi-stablecoin settlement) to X Layer mainnet using Foundry.

**Architecture:** Two standalone Solidity contracts — vault locks user xStocks as provable collateral, router settles payments from a pre-funded stablecoin reserve. Both linked by shared `paymentId` for on-chain traceability. No upgradeable proxies for MVP — immutable contracts.

**Tech Stack:** Solidity 0.8.24, Foundry (forge/cast/anvil), OpenZeppelin Contracts v5 (IERC20, SafeERC20, ReentrancyGuard, Ownable)

## Global Constraints

- **CEI pattern** (Checks-Effects-Interactions) — non-negotiable on every state-changing function
- **Custom errors** — no `require(condition, "string")`, use `revert ErrorName()`
- **ReentrancyGuard** on all functions that transfer tokens
- **SafeERC20** for all `transferFrom` / `transfer` calls
- **No mocks** — use Foundry's built-in test infrastructure (vm cheatcodes, MockERC20)
- **`forge test` must pass before every commit**
- **Exact Solidity version:** `pragma solidity 0.8.24;`
- Deploy target: X Layer mainnet, chain ID 196, RPC `https://rpc.xlayer.tech`

---

## File Structure

```
contracts/
├── src/
│   ├── AvelaVault.sol              — Multi-asset collateral vault
│   └── AvelaPaymentRouter.sol      — Multi-stablecoin settlement router
├── test/
│   ├── AvelaVault.t.sol            — Vault unit + fuzz tests
│   ├── AvelaPaymentRouter.t.sol    — Router unit + fuzz tests
│   ├── Integration.t.sol           — Cross-contract integration tests
│   └── mocks/
│       └── MockERC20.sol           — Minimal ERC20 for tests (not production mock)
├── script/
│   └── Deploy.s.sol                — Deploy script for X Layer
├── foundry.toml
├── remappings.txt
└── .env.example
```

---

### Task 1: Foundry Project Scaffold

**Files:**
- Create: `contracts/foundry.toml`
- Create: `contracts/remappings.txt`
- Create: `contracts/.env.example`
- Create: `contracts/.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: Foundry project structure ready for contract development

- [ ] **Step 1: Initialize Foundry project**

```bash
cd contracts
forge init --no-git --no-commit
```

- [ ] **Step 2: Install OpenZeppelin Contracts v5**

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git --no-commit
```

- [ ] **Step 3: Create foundry.toml**

File: `contracts/foundry.toml`

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = false

[profile.default.fuzz]
runs = 256

[rpc_endpoints]
xlayer = "${XLAYER_RPC_URL}"

[etherscan]
xlayer = { key = "${ETHERSCAN_API_KEY}", url = "https://www.okx.com/web3/explorer/xlayer/api" }
```

- [ ] **Step 4: Create remappings.txt**

File: `contracts/remappings.txt`

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
```

- [ ] **Step 5: Create .env.example**

File: `contracts/.env.example`

```
XLAYER_RPC_URL=https://rpc.xlayer.tech
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=
```

- [ ] **Step 6: Create .gitignore**

File: `contracts/.gitignore`

```
out/
cache/
.env
broadcast/
```

- [ ] **Step 7: Remove scaffold files and verify build**

```bash
cd contracts
rm -rf src/Counter.sol test/Counter.t.sol script/Counter.s.sol
forge build
```

Expected: Build succeeds with no source files yet.

- [ ] **Step 8: Commit**

```bash
git add contracts/
git commit -m "chore(contracts): scaffold Foundry project with OpenZeppelin v5"
```

---

### Task 2: Mock ERC20 for Tests

**Files:**
- Create: `contracts/test/mocks/MockERC20.sol`

**Interfaces:**
- Consumes: OpenZeppelin IERC20
- Produces: `MockERC20` — minimal ERC20 with public `mint()` for test setup

- [ ] **Step 1: Create MockERC20**

File: `contracts/test/mocks/MockERC20.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

- [ ] **Step 2: Verify build**

```bash
cd contracts
forge build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add contracts/test/mocks/MockERC20.sol
git commit -m "test(contracts): add MockERC20 for test token setup"
```

---

### Task 3: AvelaVault Implementation

**Files:**
- Create: `contracts/src/AvelaVault.sol`

**Interfaces:**
- Consumes: OpenZeppelin IERC20, SafeERC20, ReentrancyGuard, Ownable
- Produces: `AvelaVault` — multi-asset collateral vault with token whitelist

- [ ] **Step 1: Write the failing test**

File: `contracts/test/AvelaVault.t.sol`

```solidity
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd contracts
forge test --match-contract AvelaVaultTest
```

Expected: FAIL — `AvelaVault` not found.

- [ ] **Step 3: Write the implementation**

File: `contracts/src/AvelaVault.sol`

```solidity
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
```

- [ ] **Step 4: Run tests**

```bash
cd contracts
forge test --match-contract AvelaVaultTest -v
```

Expected: All tests PASS (13 tests including fuzz).

- [ ] **Step 5: Commit**

```bash
git add contracts/src/AvelaVault.sol contracts/test/AvelaVault.t.sol
git commit -m "feat(contracts): add AvelaVault multi-asset collateral vault"
```

---

### Task 4: AvelaPaymentRouter Implementation

**Files:**
- Create: `contracts/src/AvelaPaymentRouter.sol`
- Create: `contracts/test/AvelaPaymentRouter.t.sol`

**Interfaces:**
- Consumes: OpenZeppelin IERC20, SafeERC20, ReentrancyGuard, Ownable
- Produces: `AvelaPaymentRouter` — multi-stablecoin settlement with replay protection

- [ ] **Step 1: Write the failing test**

File: `contracts/test/AvelaPaymentRouter.t.sol`

```solidity
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd contracts
forge test --match-contract AvelaPaymentRouterTest
```

Expected: FAIL — `AvelaPaymentRouter` not found.

- [ ] **Step 3: Write the implementation**

File: `contracts/src/AvelaPaymentRouter.sol`

```solidity
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
        if (merchant == address(0) || collateralOwner == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (isExecuted[paymentId]) revert PaymentAlreadyExecuted(paymentId);

        uint256 available = IERC20(token).balanceOf(address(this));
        if (amount > available) revert InsufficientReserve(amount, available);

        isExecuted[paymentId] = true;

        IERC20(token).safeTransfer(merchant, amount);

        emit PaymentExecuted(paymentId, collateralOwner, merchant, token, amount, block.timestamp);
    }

    function fundReserve(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit ReserveFunded(msg.sender, token, amount);
    }

    function withdrawReserve(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
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
```

- [ ] **Step 4: Run tests**

```bash
cd contracts
forge test --match-contract AvelaPaymentRouterTest -v
```

Expected: All tests PASS (17 tests including fuzz).

- [ ] **Step 5: Commit**

```bash
git add contracts/src/AvelaPaymentRouter.sol contracts/test/AvelaPaymentRouter.t.sol
git commit -m "feat(contracts): add AvelaPaymentRouter multi-stablecoin settlement"
```

---

### Task 5: Integration Tests

**Files:**
- Create: `contracts/test/Integration.t.sol`

**Interfaces:**
- Consumes: `AvelaVault`, `AvelaPaymentRouter`, `MockERC20`
- Produces: Cross-contract tests proving the full deposit → payment flow

- [ ] **Step 1: Write integration test**

File: `contracts/test/Integration.t.sol`

```solidity
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
```

- [ ] **Step 2: Run all tests**

```bash
cd contracts
forge test -v
```

Expected: All tests pass — vault, router, and integration.

- [ ] **Step 3: Run gas report**

```bash
cd contracts
forge test --gas-report
```

- [ ] **Step 4: Commit**

```bash
git add contracts/test/Integration.t.sol
git commit -m "test(contracts): add integration tests for vault + router flow"
```

---

### Task 6: Deploy Script

**Files:**
- Create: `contracts/script/Deploy.s.sol`

**Interfaces:**
- Consumes: `AvelaVault`, `AvelaPaymentRouter`
- Produces: Deploy script targeting X Layer mainnet (chain 196)

- [ ] **Step 1: Write deploy script**

File: `contracts/script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AvelaVault} from "../src/AvelaVault.sol";
import {AvelaPaymentRouter} from "../src/AvelaPaymentRouter.sol";

contract DeployScript is Script {
    // MVP token whitelist (X Layer mainnet)
    address constant wSPYx = 0xe7e553Cd128f0011777323A0B44A7b96Ea1Cb540;
    address constant wQQQx = 0x4c1AE29C159838fc1B224636E28E086eB69101F7;
    address constant wNVDAx = 0xA8dDB5CD96B5222AFe198316E9a57CAa642850D5;
    address constant wGOOGLx = 0xf8c5308f80E459Bb53D9EBE689854d9cbB2CAa6F;
    address constant wAAPLx = 0x943bf64D566c32a2bcd41aC92FB63C111CC9De8F;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // Deploy Vault
        AvelaVault vault = new AvelaVault(deployer);
        console.log("AvelaVault deployed to:", address(vault));

        // Whitelist MVP tokens
        vault.setWhitelisted(wSPYx, true);
        vault.setWhitelisted(wQQQx, true);
        vault.setWhitelisted(wNVDAx, true);
        vault.setWhitelisted(wGOOGLx, true);
        vault.setWhitelisted(wAAPLx, true);
        console.log("Whitelisted 5 MVP tokens");

        // Deploy Router (deployer is both owner and initial signer)
        AvelaPaymentRouter router = new AvelaPaymentRouter(deployer, deployer);
        console.log("AvelaPaymentRouter deployed to:", address(router));

        vm.stopBroadcast();

        console.log("--- Deployment Summary ---");
        console.log("Vault:", address(vault));
        console.log("Router:", address(router));
        console.log("Owner:", deployer);
        console.log("Authorized Signer:", deployer);
    }
}
```

- [ ] **Step 2: Verify build**

```bash
cd contracts
forge build
```

Expected: Build succeeds.

- [ ] **Step 3: Dry-run deploy (simulation only)**

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.xlayer.tech
```

Expected: Simulation succeeds (does not broadcast).

- [ ] **Step 4: Commit**

```bash
git add contracts/script/Deploy.s.sol
git commit -m "feat(contracts): add deploy script for X Layer mainnet"
```

---

### Task 7: Full Test Suite Verification

**Files:**
- No new files

**Interfaces:**
- Consumes: All contracts and tests
- Produces: Verification that entire test suite passes with gas report

- [ ] **Step 1: Run full test suite with gas report**

```bash
cd contracts
forge test -vvv --gas-report
```

Expected: All tests pass (vault ~13, router ~17, integration ~4, total ~34+ tests).

- [ ] **Step 2: Run coverage**

```bash
cd contracts
forge coverage
```

Expected: High coverage on src/ files.

- [ ] **Step 3: Check for compiler warnings**

```bash
cd contracts
forge build --force 2>&1
```

Expected: No warnings.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add contracts/
git commit -m "chore(contracts): finalize test suite and verify coverage"
```

---
