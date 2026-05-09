# Aura Project Roadmap

## Vision
Aura: Your Intent, Solana's Execution. Bridging voice to on-chain action with agentic intelligence and secure escrow delegation.

---

## Phase 1: Foundational API & Non-UI Core (Current)
**Goal:** Establish the test-driven backend architecture and smart contract foundations.
- [ ] Initialize `docs/context.json` for state persistence.
- [x] Scaffold Next.js backend for API routes.
- [x] Implement .env.example for API key management.
- [x] TDD: Implement Mocked Intent Orchestration (`/api/intent`).
- [x] TDD: Implement Mocked Routing/Pathfinding (`/api/route`).
- [x] Scaffold Anchor Workspace and `aura-escrow` program.
- [x] Write initial Anchor tests for PDA delegation and guardrails.

## Phase 2: On-Chain Logic & Logic Refinement (Current)
**Goal:** Finalize the Solana program and integrate real API behavior.
- [x] Implement Guardrail logic in Anchor (Slippage, Allowance, Destination checks).
- [ ] Deploy Anchor program to Localhost/Devnet for integration testing.
- [x] Refine Next.js API logic to handle X402 payment headers.

## Phase 3: Mobile Client & SMS Integration (Current)
**Goal:** Build the user-facing mobile experience.
- [x] Scaffold Expo application with Solana Mobile Stack.
- [x] Implement Mobile Wallet Adapter (MWA) for transaction signing.
- [x] Connect Voice/ElevenLabs STT capture to the Next.js API.
- [x] Implement X402 client-side payment logic for premium skills.

## Phase 4: Integration & Polish (Completed)
**Goal:** End-to-end testing and production readiness.
- [x] End-to-end testing of Voice -> Intent -> Routing -> Execution flow.
- [x] UI/UX Polishing and error handling.
- [x] Documentation for deployment and environment setup.

---

## Status Updates
- **2026-05-08**: Resolved Android build failure by downgrading dependencies and cleaning prebuild. Gradle build is now successful.
*See `docs/context.json` for granular state tracking.*