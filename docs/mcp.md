# Avela MCP — agent skill exposure

> MCP (Model Context Protocol) is how AI agents operate an Avela account: query balances, check their permission scope, create payment intents, and track status — all permission-checked server-side. Agents get tools, not keys.

Agent model: [`docs/agents.md`](agents.md) · Package: `packages/mcp/`

## Server

- Package: `@avela/mcp` (`packages/mcp/`, private, v0.1.0).
- Transport: **stdio** (`@modelcontextprotocol/sdk` `StdioServerTransport`) — run as a subprocess of the agent host.
- Entry: `packages/mcp/src/index.ts`. Tool handlers: `packages/mcp/src/tools/*.ts`. Tests: `packages/mcp/src/__tests__/tools.test.ts`.
- Requires `DATABASE_URL` (fails fast without it). Reuses `@avela/core` domain (same permission evaluation + spending-power logic as the API — no forked rules).

```bash
cd packages/mcp
bun install
bun run test          # vitest run
bun run dev           # node --watch src/index.ts (stdio server)
bun run build         # tsc -p tsconfig.build.json
```

> Price-feed injection is config-driven: `createUniswapTwapAdapter` needs a viem `PublicClient` + pool map (addresses in the verified asset table in `README.md`). Do not hardcode prices — the checked-in stub throws `priceFeed not configured` until wired.

## Tools

### `avela.getBalance`

Get account balance and spending power.

```jsonc
// input
{ "accountId": "01J…" }
// output → SpendingPower { perAsset[{ assetSymbol, positionValue, haircut, spendingPower }],
//                          stablecoinBalance, totalSpendingPower }
```

### `avela.getPermissions`

Get the calling agent's current permission scope.

```jsonc
// input
{ "agentId": "01J…" }
// output → AgentPermission { maxPerTransaction, maxPerDay, allowedAssets,
//                            allowedRecipients, requiresApproval, approvalThreshold }
```

### `avela.createPaymentIntent`

Create a payment intent **within the agent's permissions**. Evaluated synchronously — over-scope requests are rejected with violations; over-threshold requests park in `awaiting_approval` (user approves via web/WhatsApp).

```jsonc
// input
{ "agentId": "01J…", "amount": 12.0, "recipient": "0x1234…5678" }
// output → PaymentIntent { id, status, fundingDecision?, settlement? }
```

### `avela.getPaymentStatus`

Check status of a payment the agent initiated (poll this after `createPaymentIntent` — no WebSockets in MVP).

```jsonc
// input
{ "paymentId": "01J…" }
// output → PaymentIntent (with status + receipt when settled)
```

## Agent wiring

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "avela": {
      "command": "node",
      "args": ["/absolute/path/to/avela/packages/mcp/dist/index.js"],
      "env": { "DATABASE_URL": "postgresql://…" }
    }
  }
}
```

Then: *"Check my Avela spending power"* → agent calls `avela.getBalance` → *"Pay $12 to 0x… for API credits"* → `avela.getPermissions` → `avela.createPaymentIntent` → (approval if needed) → `avela.getPaymentStatus` until `settled`.

Any MCP-compatible host (Claude, Cursor, custom harnesses) works the same way — stdio + the four tools above.

## Safety properties

- Agents authenticate as an **agent id**, never as the user. Every tool call resolves scope server-side.
- `createPaymentIntent` cannot exceed scope — violations return as data, not exceptions to catch.
- Approval-required intents never auto-settle; a human approves via web or WhatsApp.
- Every agent payment lands in `AgentSpendingLog` with a `permissionSnapshot` — auditors see exactly which rules applied.
- The MCP server shares domain code with the API, so permission semantics cannot drift between surfaces.
