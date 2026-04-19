# EtherFlow — Compliance Investigation Agent

**Date:** 2026-04-19
**Status:** Design (awaiting approval)
**Author:** Daniel Huber (with Claude)

## 1. Summary

Revive EtherFlow as an **AI-assisted blockchain investigation dashboard** aimed at compliance analysts, with the author as the first tester. The app traces suspicious fund flows across Ethereum and the top EVM L2s (Arbitrum, Optimism, Base, Polygon), screens addresses against sanctions and scam databases, detects cross-chain bridge hops, and produces auditable PDF investigation reports.

A Claude-powered agent runs inside the app as an analyst sidekick: it narrates findings, drives the existing visualizations, executes multi-hop traces, and drafts report sections. Every agent action is deterministic at the data layer (no LLM-invented numbers or addresses) and fully logged for auditability.

## 2. Scoping decisions (already made)

| Decision | Choice | Rationale |
|---|---|---|
| Strategy | **B** — pick a vertical and go deep | A horizontal "blockchain explorer" has no moat; a vertical tool can. |
| Vertical | **B1** — fraud investigation / compliance | Closest to existing feature set (graphs, anomalies, patterns). |
| Primary user | **U2** (compliance analyst at a firm) with **U4** (self) as tester | Aspirational target for product quality; practical target for testing. |
| Agent shape | **AI2** — AI-assisted dashboard (not chat-first, not autonomous) | Compliance work requires analyst judgment and auditability; agent amplifies, doesn't replace. |
| Chain scope v1 | **M2** — ETH + Arbitrum + Optimism + Base + Polygon | Covers ~90% of EVM-bridged fraud. Solana deferred to phase 2. |
| Approach | **A** — adopt the stalled 2026 TS+Vite modernization branch, build on top | Smallest step that unblocks everything; reuses existing visualizations. |

## 3. Architecture & stack

### 3.1 Foundation
Adopt the `claude/etherflow-modernization-plan-1QKwm` branch's modernization commit (`31c16c4`, ~3,700 LOC) as the starting codebase. First task of M0 is to merge/adapt it, validate it builds, and confirm the existing features still work. If the branch is too stale to recover within 1 day of effort, fall back to performing the migration freshly (adds ~3 days to M0).

### 3.2 Stack
- **Build:** Vite 5 + React 18 + TypeScript 5
- **State:** Zustand (chosen in modernization branch; good fit for agent-driven UI because agent tools mutate state via typed actions)
- **Styling:** Tailwind + shadcn/ui-inspired components (existing)
- **Routing:** None. Single-page tabbed layout.
- **Chain data:** `@alch/agents` CLI + Alchemy SDK, uniform across ETH/Arbitrum/Optimism/Base/Polygon
- **LLM / agent:** `@anthropic-ai/claude-agent-sdk` running **client-side**
  - Interactive agent: `claude-sonnet-4-6`
  - Report synthesis (one-shot per report): `claude-opus-4-7`
  - Prompt caching on system prompt + tool definitions
- **PDF export:** `@react-pdf/renderer` (client-side)
- **Testing:** Vitest + Playwright (1 smoke test)
- **Deployment:** Vercel static. BYO keys in `.env` (same model as today).

### 3.3 Pruned from existing app
- 3D graph (`TransferGraph3D.js`) — not useful for compliance work
- Demo mode UI (`DemoModePanel`) — marketing surface, not a tool
- Any dead components the M0 audit flags

### 3.4 Explicit non-goals for v1
- No backend, no database, no auth, no case persistence beyond `localStorage`
- No Solana (phase 2)
- No billing / team features / SOC2 pretense
- No realtime monitoring or webhooks (phase 2)
- No ML-based entity clustering (heuristic labels only)
- No mobile layout beyond "doesn't look broken"

## 4. Agent design

### 4.1 Principles
- **Deterministic floor.** The LLM orchestrates, interprets, and writes prose. Everything touching money, addresses, or risk goes through typed code. The LLM never eyeballs a number and decides whether it's suspicious — it calls `compute_stats` and deterministic services decide.
- **Tool-gated state mutation.** The agent cannot change dashboard state except via `update_graph`, `add_trace_note`, `flag_anomaly`. No back channels.
- **No invented addresses.** Hard-coded post-turn check: any hex address in an assistant message must already appear in either (a) a prior tool-call result in this session, or (b) a prior user message in this session. Otherwise the turn is rejected and retried with a corrective system message. This blocks LLM hallucination of addresses without blocking legitimate reference to user-provided input.
- **Observable.** All tool calls stream into the chat panel so the analyst sees what the agent is doing as it happens.

### 4.2 Tool surface

| Tool | Purpose |
|---|---|
| `get_address_info(chain, address)` | Balance, tx count, first/last seen, known label |
| `get_transfers(chain, address, direction, from_block?, to_block?, limit?)` | Paginated transfer list |
| `get_token_balances(chain, address)` | ERC-20 holdings |
| `label_lookup(address)` | Fan-out across label sources, returns `{label, source, confidence}[]` |
| `screen_sanctions(address)` | OFAC SDN check |
| `detect_bridge_outflow(chain, tx_hash)` | Resolve bridge deposit → destination chain + recipient |
| `update_graph(nodes[], edges[], focus_node?)` | Mutate Zustand graph state |
| `add_trace_note(address, note, evidence[])` | Append to case investigation log |
| `flag_anomaly(address, kind, severity, rationale)` | Push to risk sidebar |
| `compute_stats(...)` | Wraps existing `patternAnalysisService`, `gasAnalysisService`, `profitLossService` |
| `generate_report_draft()` | Hands off to the Opus synthesis call |

All tool inputs validated with Zod. All tool outputs typed.

### 4.3 Interaction modes
1. **Ambient narration** — on address load, preset investigation runs (`get_address_info` → `get_transfers` → `label_lookup` → `compute_stats`), produces 2–3 sentence summary.
2. **Chat panel** — persistent right-side panel. User asks follow-ups. Agent runs tools, updates visualizations, narrates.
3. **Inline actions** — buttons on nodes/edges ("Trace from here", "Explain this cluster", "Is this a bridge?") that prefill a user turn.
4. **Case report** — "Generate investigation report" triggers the Opus synthesis over accumulated trace + notes + flags.

### 4.4 Auditability
Every agent turn is logged to a structured trace:
```
{ turn_id, timestamp, user_message, tool_calls: [{tool, args, result}], assistant_message, model, tokens }
```
Persisted to `localStorage` per case. Verbatim appendix in every exported report. This log is the artifact that differentiates a "compliance tool" from a "chatbot" — an analyst must be able to show exactly what the agent did and why.

### 4.5 Constraints
- Max 20 tool calls per user turn. On hit, the agent is forced to emit a summary-and-stop message so the analyst can intervene.
- Agent can read graph state but only mutate via `update_graph`
- LLM errors never silently dropped — shown in chat, user retries

## 5. Compliance data sources

### 5.1 Label sources (v1, free only)

| Source | What | Integration |
|---|---|---|
| OFAC SDN list | Sanctioned addresses | Fetch weekly from Treasury, cache in `localStorage`, hard red-flag on hit |
| Chainabuse | Community-reported scams | Public API free tier, cached |
| Bundled known-entities JSON | Bridges, DEX routers, mixers, major CEX hot wallets | Static file in repo, hand-curated per chain |
| User-local annotations | Analyst's own labels | `localStorage`, per-case |
| *Phase 2* | Arkham, Nansen, Etherscan API labels | Paid — deferred |

`label_lookup` fans out across sources, dedupes, returns all matches with `{label, source, confidence}`.

### 5.2 Bridge detection (the moat)

Two-path strategy tried in order:

1. **Known-bridge path** — hardcoded registry of bridge contracts per chain, per-bridge parser. For each, parse deposit tx → `{dest_chain, dest_address, dest_token, estimated_dest_tx}`.
   - **v1 ships with 5 parsers** (highest-volume first hops from ETH): Arbitrum native, Optimism native, Base native, Polygon PoS native, Across.
   - **Phase 1.5 expansion** (not in v1): Hop, Stargate, LayerZero/OFT, Synapse, cBridge. The registry is designed so adding a parser is a single-file change.
2. **Heuristic path** — unknown target contract + sender doesn't receive tokens back within N blocks → return `{possible_bridge, confidence}`. Never guesses destinations.

Cross-chain continuation: when a known bridge resolves, agent calls `get_transfers(dest_chain, dest_address, ...)` with a time window around the deposit. This is what makes multi-hop tracing work across chains.

## 6. UX

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ EtherFlow  [Case: ...]    [Chain: ETH ▾]    [Export ▾]          │
├─────────┬──────────────────────────────────────────┬────────────┤
│ Cases   │  Graph | Timeline | Trace | Treemap      │ 🤖 Agent   │
│ • Open  │  ┌────────────────────────────────────┐  │ ─────────  │
│ • Saved │  │ (visualizations, agent-driven)     │  │ chat log   │
│ + New   │  │                                    │  │            │
│         │  │                                    │  │ tool calls │
│ Flags   │  │                                    │  │ streaming  │
│ ● OFAC  │  │                                    │  │            │
│ ● Mixer │  └────────────────────────────────────┘  │ input ▸    │
│ ● …     │  Trace log: hop-by-hop table below       │            │
└─────────┴──────────────────────────────────────────┴────────────┘
```

Rules:
- Agent panel always visible on desktop; collapsible on narrow viewports. Not a bolt-on.
- Every node/edge has "Explain" and "Trace from here" actions that prefill the agent.
- Flags persistent in sidebar; clicking one jumps to evidence.
- Single "Export" menu: JSON / PDF / shareable link.

### 6.2 PDF report structure
1. Cover (case name, analyst, date, addresses, chains covered)
2. Executive summary — Opus-synthesized prose, explicitly tagged as LLM-generated
3. Fund flow diagram — rendered PNG from the graph
4. Hop-by-hop trace table — deterministic from trace log
5. Flags list with evidence links
6. Analyst notes (user-written)
7. **Agent audit log appendix** — verbatim

Reproducibility: same case state → same report structure. Prose sections are tagged LLM-generated.

## 7. Error handling

- **Alchemy rate limits / 429** — exponential backoff in tool layer, persistent banner, surface to agent ("data source throttled, retrying").
- **Bad address input** — validate with viem before any tool call.
- **LLM errors** — surfaced inline in chat, user retries. Never silently dropped.
- **Agent runaway** — 20-tool-call cap per turn; if hit, agent must summarize and hand back.
- **Stale label data** — show "last refreshed" timestamp, explicit refresh action.
- **Bridge ambiguity** — `possible_bridge` result must be flagged explicitly; never guess destination.

## 8. Testing

- **Unit (Vitest):** every tool implementation, label resolution (dedup + confidence merge), bridge parsers (fixture-based: real tx hashes → expected decoded output), pattern services.
- **Agent integration:** mocked Alchemy + mocked Anthropic; assert tool call sequence for canned investigation scripts.
- **Playwright smoke (1):** address load → ambient narration completes → user requests trace → graph updates → PDF export → PDF is non-empty and contains audit log.
- **Golden-case fixtures (5):** Ronin bridge hack, Nomad exploit, a Tornado Cash path, a Lazarus-linked address, a mundane CEX deposit. Assertions are *behavioral* ("detects bridge", "flags OFAC"), not prose snapshots.
- **No LLM prose snapshot tests.** They rot and teach nothing.

## 9. Success criteria for v1

- Ronin bridge hacker's ETH address → trace ≥2 hops including a cross-chain jump → PDF report generated.
- OFAC hit on Tornado Cash router → red flag with evidence link within 5 seconds.
- Hard guardrail: agent cannot introduce hex addresses not sourced from a tool result (unit-tested).
- Report reproducibility: same case state → same structure; prose tagged.
- Ambient narration completes in <10s on warm cache.
- Full agent audit log exportable and human-readable.

## 10. Milestones

| M | Deliverable | Effort |
|---|---|---|
| M0 | Foundation: merge/adapt modernization branch, validate, prune 3D + demo UI, set up Vitest smoke | ~1 wk |
| M1 | Single-chain agent MVP: Claude Agent SDK, panel UI, core tools, ambient narration, chat streaming (ETH only) | ~1.5 wk |
| M2 | Compliance primitives: OFAC, Chainabuse, bundled entities, user annotations, flags sidebar | ~1 wk |
| M3 | Multi-chain + bridge detection: Arbitrum/Optimism/Base/Polygon data, top-5 bridge parsers (Arbitrum/Optimism/Base/Polygon native + Across), cross-chain continuation, chain switcher | ~2 wk |
| M4 | Report export + polish: `@react-pdf/renderer` with Opus executive summary, audit log appendix, sample cases library, Vercel deploy | ~1 wk |

Total: ~6–7 weeks focused work. Each milestone is independently shippable.

## 11. Risks

| Risk | Mitigation |
|---|---|
| 2026 modernization branch won't merge cleanly | Time-box merge attempt at 1 day; fresh migration fallback adds ~3 days |
| Bridge detection coverage gap | Ship with top 5 bridges; unknown bridges return `possible_bridge` (correct behavior, not a bug); expand over time |
| Alchemy Agents SDK is new, may have rough edges | Hide behind a thin adapter so provider can be swapped |
| LLM cost abuse | Per-turn tool-call cap, Sonnet for interactive, Opus only for reports, prompt caching |
| Client-side API keys limit real-world deployment | Acknowledged; MVP constraint. Server-side key proxy is a known phase-2 item. |

## 12. Phase 2+ backlog (not in v1)

- Solana support
- Server-side key proxy + optional hosted mode
- Case persistence to a real DB
- Realtime monitoring via Alchemy webhooks
- Arkham/Nansen/Etherscan paid label integrations
- Team/multi-user features
- ML-based entity clustering
- Mobile layout

## 13. Open questions for implementation

None blocking. Implementation-level questions (exact Zustand store shape, exact bridge parser code, exact shadcn/ui components) will be resolved during plan-writing and execution.
