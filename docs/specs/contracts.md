# Spec: Smart Contracts

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4 (Smart contracts), §4.9 (Custody Disclosure). Avela-owned contracts deployed on X Layer.

## Objective

Two Solidity contracts that make Avela's "positions stay intact" claim provable on-chain. AvelaVault locks user collateral. AvelaPaymentRouter settles payments from a pre-funded stablecoin reserve. Both emit events linked by a shared `paymentId` — any payment is traceable across both contracts on the explorer.

## Scope

**In:**
- AvelaVault — multi-asset collateral vault (one contract, one address, 5 whitelisted tokens)
- AvelaPaymentRouter — multi-stablecoin settlement (token parameter, not per-stablecoin contracts)
- Foundry project setup (forge, tests, deploy script)
- Deploy to X Layer mainnet (chain ID 196)
- OpenZeppelin v5 dependencies (IERC20, SafeERC20, ReentrancyGuard, Ownable)

**Out:**
- On-chain spending power calculation (done off-chain via TWAP)
- On-chain policy enforcement (done off-chain in backend)
- Multisig or timelock (Phase 2)
- Self-replenishing reserve / automated rebalancing (Phase 2)
- Upgradeable proxies (MVP uses immutable contracts)

## AvelaVault

Multi-asset collateral vault. Accepts all 5 whitelisted wrapped xStocks. One contract, one address — user approves per-token, deposits into one vault.

### Interface

```solidity
// State
mapping(address token => bool) public whitelisted;
mapping(address depositor => mapping(address token => uint256)) public lockedBalance;
mapping(address token => uint256) public totalLocked;

// Write
function deposit(address token, uint256 amount) external nonReentrant;
function withdraw(address token, uint256 amount) external nonReentrant;
function setWhitelisted(address token, bool status) external onlyOwner;

// Read
function getLockedBalance(address depositor, address token) external view returns (uint256);
function isWhitelisted(address token) external view returns (bool);
```

### Events

```solidity
event PositionLocked(address indexed depositor, address indexed token, uint256 amount, uint256 newBalance);
event PositionReleased(address indexed depositor, address indexed token, uint256 amount, uint256 newBalance);
event TokenWhitelistUpdated(address indexed token, bool status);
```

### Errors

```solidity
error ZeroAmount();
error TokenNotWhitelisted(address token);
error InsufficientLockedBalance(uint256 requested, uint256 available);
```

### Rules

- **Non-custodial.** Only the original depositor can withdraw their own balance. No owner, admin, or backend key can move user funds. This is what makes the vault non-custodial in practice, not just in name.
- Owner role is limited to whitelist management (`setWhitelisted`). Owner cannot deposit, withdraw, or transfer on behalf of users.
- `deposit` requires the token to be whitelisted. Reverts with `TokenNotWhitelisted` otherwise.
- `withdraw` is permissionless — no approval, no admin gate. Caller withdraws their own balance only.
- Uses `SafeERC20.safeTransferFrom` / `safeTransfer` for all token movements.
- `ReentrancyGuard` on both `deposit` and `withdraw`.

### MVP Token Whitelist

| Symbol | Address | Verified |
|--------|---------|----------|
| wSPYx | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | Yes |
| wQQQx | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | Yes |
| wNVDAx | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | Yes |
| wGOOGLx | `0xf8c5308f80e459bb53d9ebe689854d9cbb2caa6f` | Yes |
| wAAPLx | `0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f` | Yes |

## AvelaPaymentRouter

Multi-stablecoin settlement. Pays merchants from a pre-funded reserve. The router never touches a user's locked collateral — it settles from Avela's own treasury.

### Interface

```solidity
// State
address public authorizedSigner;
mapping(bytes32 paymentId => bool) public isExecuted;

// Write
function executePayment(address token, address merchant, uint256 amount, bytes32 paymentId, address collateralOwner) external onlyAuthorizedSigner nonReentrant;
function fundReserve(address token, uint256 amount) external nonReentrant;
function withdrawReserve(address token, address to, uint256 amount) external onlyOwner nonReentrant;
function setAuthorizedSigner(address newSigner) external onlyOwner;

// Read
function getReserveBalance(address token) external view returns (uint256);
```

### Events

```solidity
event PaymentExecuted(bytes32 indexed paymentId, address indexed collateralOwner, address indexed merchant, address token, uint256 amount, uint256 timestamp);
event ReserveFunded(address indexed funder, address indexed token, uint256 amount);
event ReserveWithdrawn(address indexed to, address indexed token, uint256 amount);
event AuthorizedSignerUpdated(address indexed previousSigner, address indexed newSigner);
```

### Errors

```solidity
error NotAuthorizedSigner();
error PaymentAlreadyExecuted(bytes32 paymentId);
error ZeroAmount();
error ZeroAddress();
error InsufficientReserve(uint256 requested, uint256 available);
```

### Rules

- **Custodial (stated MVP limitation).** The router holds Avela's pre-funded stablecoin reserve. A single backend EOA calls `executePayment`. This is an honest, stated trust boundary — not a hidden gap. Phase 2: multisig authorization or claim-based release.
- `executePayment` callable only by `authorizedSigner`. Replay protection via `paymentId` — each ID executes at most once.
- `collateralOwner` is recorded in the event for the audit trail — it is not read on-chain from the vault. The backend verifies collateral off-chain before calling.
- `fundReserve` callable by anyone (typically the owner). This is Avela's own treasury, not user funds.
- `withdrawReserve` restricted to owner — recovers unused reserve.
- `setAuthorizedSigner` allows key rotation without redeployment.
- Reserve pre-funded with ~$10 USDG + USDC for demo payments ($0.50–$1 each).

### Settlement Stablecoins

| Stablecoin | Address | Verified |
|------------|---------|----------|
| USDG | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` | Yes |
| USDC | `0xb6ceceab302e2e4948951ee7843fc24e92933061` | Yes |

## Custody Disclosure

| Component | Custody Model | Who Controls |
|-----------|---------------|--------------|
| AvelaVault | Non-custodial | User (permissionless withdrawal of own balance) |
| AvelaPaymentRouter | Custodial | Backend EOA (stated MVP limitation) |

**Phase 2 improvements:**
- Multisig authorization on router (2-of-3 or similar)
- Claim-based settlement (merchant claims payment, removing backend from critical path)
- Timelock on owner operations

## Dependencies

- **OpenZeppelin Contracts v5** — IERC20, SafeERC20, ReentrancyGuard, Ownable
- **Foundry** — forge (build/test), cast (interact), anvil (local node)
- **viem** — backend reads vault balances, submits router transactions
- No dependency on `packages/core` — contracts are standalone on-chain

## Project Structure

```
contracts/
├── src/
│   ├── AvelaVault.sol
│   └── AvelaPaymentRouter.sol
├── test/
│   ├── AvelaVault.t.sol
│   └── AvelaPaymentRouter.t.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
├── remappings.txt
└── .env.example              — PRIVATE_KEY, XLAYER_RPC_URL, ETHERSCAN_API_KEY
```

## Deploy

- **Chain:** X Layer mainnet (chain ID 196)
- **RPC:** `https://rpc.xlayer.tech`
- **Method:** `forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast`
- **Constructor args:**
  - Vault: `owner` address, then call `setWhitelisted` for each of the 5 MVP tokens
  - Router: `owner` address, `authorizedSigner` address (backend EOA)
- **Verification:** `forge verify-contract` against OKX Explorer if supported, otherwise verify source manually

## Success Criteria

1. Vault accepts deposits of all 5 whitelisted tokens, emits `PositionLocked` with correct balances
2. Vault rejects deposits of non-whitelisted tokens
3. Only the original depositor can withdraw — another address calling `withdraw` gets `InsufficientLockedBalance`
4. Owner cannot withdraw user funds — no function path exists
5. `executePayment` settles from reserve, emits `PaymentExecuted` with correct `paymentId`
6. Replay protection: same `paymentId` reverts with `PaymentAlreadyExecuted`
7. Only `authorizedSigner` can call `executePayment` — other addresses revert
8. Reserve management: `fundReserve` and `withdrawReserve` work correctly
9. Signer rotation via `setAuthorizedSigner` works without redeployment
10. Deploy script successfully deploys both contracts to X Layer
11. All Foundry tests pass (`forge test`)
12. Gas usage reasonable for X Layer (report gas in test output)

## Resolved Questions

- **Batch deposit/withdraw:** No for MVP. Single-token operations only. Batch adds gas complexity without clear user demand yet.
- **Batch payments:** No for MVP. Single-payment execution only.
- **OKX Explorer contract verification:** Try `forge verify-contract` with OKX Explorer's API first. If unsupported, fall back to manual standard JSON input upload.
