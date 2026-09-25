# Spec: Watcher

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §7.2. Demonstrates the WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE loop.

## Objective

One watcher for MVP: "alert when spending power drops below threshold." This demonstrates that Avela's intelligence layer is real — the account monitors its own state and acts. The watcher loop (WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE) is the architectural pattern that all future automation builds on.

## Scope

**In:**
- Spending power threshold watcher: user sets a USD threshold, gets alerted when spending power drops below it
- Watcher registration: create, update, delete, list
- Evaluation loop: periodic check of spending power against threshold
- Notification dispatch: triggers WhatsApp alert when condition met
- Watcher state: `active`, `triggered`, `paused`, `disabled`
- Cooldown: don't re-alert for the same trigger within a time window

**Out:**
- Complex condition watchers (multi-variable, compound conditions) — Phase 3
- Auto-execution watchers (auto-rebalance, auto-deposit) — Phase 3
- Portfolio rebalance triggers
- Custom watcher scripting/DSL

## Domain Model

```ts
type Watcher = {
  id: string
  accountId: string
  type: 'spending_power_threshold'   // Only type for MVP
  config: SpendingPowerThresholdConfig
  status: 'active' | 'triggered' | 'paused' | 'disabled'
  lastEvaluatedAt: Date | null
  lastTriggeredAt: Date | null
  cooldownMinutes: number           // Don't re-alert within this window
  createdAt: Date
  updatedAt: Date
}

type SpendingPowerThresholdConfig = {
  threshold: number     // USD value — alert when spending power drops below
  direction: 'below'    // MVP only supports "drops below"
}

type WatcherEvaluation = {
  watcherId: string
  currentValue: number    // Current spending power
  threshold: number
  triggered: boolean
  evaluatedAt: Date
}

// The operating loop (one iteration)
type WatcherCycle = {
  phase: 'watch' | 'evaluate' | 'decide' | 'authorize' | 'execute'
  watcherId: string
  // WATCH:     Read current spending power
  // EVALUATE:  Compare against threshold
  // DECIDE:    Determine action (send alert, or no-op if in cooldown)
  // AUTHORIZE: No human approval needed for alerts (auto-authorized)
  // EXECUTE:   Send WhatsApp notification
}
```

## Interfaces

### Core Functions (packages/core)

```ts
// Watcher CRUD
createWatcher(params: {
  accountId: string
  threshold: number
  cooldownMinutes?: number   // Default: 60
}): Promise<Watcher>

getWatcher(watcherId: string): Promise<Watcher>
getWatchersByAccount(accountId: string): Promise<Watcher[]>
updateWatcher(watcherId: string, updates: Partial<Watcher>): Promise<Watcher>
deleteWatcher(watcherId: string): Promise<void>

// Evaluation loop
evaluateWatcher(watcherId: string): Promise<WatcherEvaluation>
evaluateAllActiveWatchers(): Promise<WatcherEvaluation[]>

// Trigger handling
handleWatcherTrigger(watcherId: string, evaluation: WatcherEvaluation): Promise<void>
```

### API Endpoints

```
POST /accounts/:id/watchers        — Create watcher
GET  /accounts/:id/watchers        — List watchers
PUT  /watchers/:id                 — Update watcher
DELETE /watchers/:id               — Delete watcher
POST /watchers/evaluate            — Trigger evaluation cycle (admin/cron)
```

## Dependencies

- **core-account** — spending power calculation (the value being watched)
- **whatsapp-access** — notification delivery when watcher triggers
- **Drizzle ORM** — watchers table, evaluation log

## Project Structure

```
packages/core/src/
├── domain/
│   ├── watcher.ts             — Watcher entity, CRUD, evaluation loop
│   ├── watcher-evaluator.ts   — The WATCH→EVALUATE→DECIDE→AUTHORIZE→EXECUTE cycle
│   └── types.ts               — (extended with watcher types)
```

## Success Criteria

1. User creates a watcher: "alert me when spending power drops below $500"
2. Evaluation loop reads current spending power and compares against threshold
3. When threshold breached: WhatsApp notification sent with current value and change context
4. Cooldown respected: no re-alert within the cooldown window
5. Watcher status transitions: `active` → `triggered` (on breach) → `active` (after cooldown or reset)
6. Watcher can be paused and resumed
7. Evaluation cycle completes the full WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE loop
8. Unit tests for threshold comparison, cooldown logic
9. Integration test: set threshold → simulate price drop → verify notification triggered

## Open Questions

- Evaluation frequency: cron job every N minutes, or event-driven (on price update)?
- For the hackathon demo: manual trigger button in dashboard vs automated background loop?
- Notification message: include suggested actions ("deposit more" / "adjust policy")?
