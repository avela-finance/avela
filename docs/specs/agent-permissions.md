# Spec: Agent Permissions

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §6.1, §7.2. The differentiator — AI agents operate the account within bounded permissions.

## Objective

Enable AI agents to spend from a user's portfolio within scoped permissions. The user defines what the agent can do (amount caps, asset restrictions, recipient allowlists, approval requirements). The agent operates within those bounds — it never owns the money, only scoped authority. This is what separates Avela from every card product.

## Scope

**In:**
- Agent registration (linked to Privy agent wallet)
- Permission scope: max per-transaction, max per-day, allowed assets, allowed recipients, approval requirement, expiry
- Agent permission dashboard data (for web-dashboard to render)
- Agent spending log (every action recorded with permission used)
- Permission evaluation: given agent + payment intent, check scope
- MCP skill exposure: agents query balances, create payment intents, check their permissions via MCP protocol
- One demo agent for MVP: an agent that pays for a service from the user's portfolio

**Out:**
- Multi-agent orchestration (Phase 3)
- Agent-to-agent commerce (Phase 4)
- Agent discovery marketplace
- Dynamic permission negotiation

## Domain Model

```ts
type Agent = {
  id: string                    // ULID
  accountId: string             // Which user account this agent operates on
  name: string                  // Human-readable name
  walletAddress: string         // Privy agent wallet address
  permissions: AgentPermission
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  createdAt: Date
  expiresAt: Date | null
}

type AgentPermission = {
  maxPerTransaction: number     // Max USD per single payment
  maxPerDay: number             // Max USD per rolling 24h
  allowedAssets: string[]       // Asset symbols agent can use (empty = all)
  allowedRecipients: string[]   // Wallet addresses (empty = any)
  requiresApproval: boolean     // Always require human sign-off?
  approvalThreshold: number     // Auto-approve below this, require approval above
}

type AgentSpendingLog = {
  id: string
  agentId: string
  paymentIntentId: string
  amount: number
  asset: string
  recipient: string
  permissionSnapshot: AgentPermission  // Permission state at time of spend
  status: 'approved' | 'rejected' | 'auto_approved' | 'pending_approval'
  decidedAt: Date
}

// Example MVP agent permission
const DEMO_AGENT_PERMISSION: AgentPermission = {
  maxPerTransaction: 50,       // $50 max per payment
  maxPerDay: 200,              // $200 daily cap
  allowedAssets: ['wSPYx'],    // Only spend from S&P 500
  allowedRecipients: [],       // Any recipient
  requiresApproval: false,     // Auto-approve under threshold
  approvalThreshold: 25,       // Require approval above $25
}
```

## Interfaces

### Core Functions (packages/core)

```ts
// Agent lifecycle
registerAgent(params: {
  accountId: string
  name: string
  walletAddress: string
  permissions: AgentPermission
  expiresAt?: Date
}): Promise<Agent>

getAgent(agentId: string): Promise<Agent>
getAgentsByAccount(accountId: string): Promise<Agent[]>
updateAgentPermissions(agentId: string, permissions: Partial<AgentPermission>): Promise<Agent>
revokeAgent(agentId: string): Promise<Agent>

// Permission evaluation
evaluateAgentPermission(params: {
  agentId: string
  amount: number
  asset?: string
  recipient: string
}): Promise<{
  allowed: boolean
  requiresApproval: boolean
  violations: string[]
  dailySpent: number
  dailyRemaining: number
}>

// Spending log
logAgentSpending(entry: Omit<AgentSpendingLog, 'id'>): Promise<AgentSpendingLog>
getAgentSpendingLog(agentId: string, limit?: number): Promise<AgentSpendingLog[]>
```

### MCP Skills (exposed via MCP protocol)

```ts
// Tools available to agents via MCP
mcp_tools = {
  'avela.getBalance': {
    description: 'Get account balance and spending power',
    input: { accountId: string },
    output: SpendingPower
  },
  'avela.getPermissions': {
    description: 'Get my current permission scope',
    input: { agentId: string },
    output: AgentPermission
  },
  'avela.createPaymentIntent': {
    description: 'Create a payment intent within my permissions',
    input: { agentId: string, amount: number, recipient: string },
    output: PaymentIntent
  },
  'avela.getPaymentStatus': {
    description: 'Check status of a payment I initiated',
    input: { paymentId: string },
    output: PaymentIntent
  }
}
```

## Dependencies

- **core-account** — account verification, spending power
- **spending-policy** — policy evaluation integrates with agent permission checks
- **funding-engine** — agent-initiated payments use the same funding pipeline
- **Privy** — agent wallet verification (`@privy-io/server-auth`)
- **MCP SDK** — for skill exposure

## Project Structure

```
packages/core/src/
├── domain/
│   ├── agent.ts               — Agent entity, registration, revocation
│   ├── agent-permission.ts    — Permission evaluation logic
│   └── types.ts               — (extended with agent types)

apps/api/src/
├── routes/
│   └── agents.ts              — Agent CRUD + spending log endpoints

packages/mcp/                  — MCP skill server (new package)
├── src/
│   ├── index.ts               — MCP server entry
│   └── tools/
│       ├── get-balance.ts
│       ├── get-permissions.ts
│       ├── create-payment.ts
│       └── get-payment-status.ts
├── package.json
└── tsconfig.json
```

## Success Criteria

1. Register an agent with scoped permissions (amount cap, asset restriction, recipient allowlist)
2. Agent can create a payment intent that passes permission evaluation
3. Agent blocked when exceeding per-transaction limit
4. Agent blocked when exceeding daily limit
5. Agent blocked when using disallowed asset
6. Payments above approval threshold route to human approval (pending state)
7. Every agent action logged with permission snapshot
8. Agent expiry: expired agent cannot create new payments
9. Agent revocation: revoked agent immediately loses access
10. MCP tools work: agent can query balance, check permissions, create payment intent
11. Demo agent completes a real payment from user's wSPYx position

## Open Questions

- MCP server: separate package (`packages/mcp`) or colocated with API?
- Demo agent: build a simple autonomous agent, or just expose MCP tools for external agents?
- Agent wallet: Privy agent wallet or any wallet that the user authorizes?
