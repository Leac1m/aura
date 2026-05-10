# Aura Project Roadmap

## Vision
Aura: Your Intent, Solana's Execution. Bridging voice to on-chain action with agentic intelligence and secure escrow delegation.

---

## Phase 1: Foundational API & Non-UI Core (Completed)
**Goal:** Establish the test-driven backend architecture and smart contract foundations.
- [x] Initialize `docs/context.json` for state persistence.
- [x] Scaffold Next.js backend for API routes.
- [x] Implement .env.example for API key management.
- [x] TDD: Implement Mocked Intent Orchestration (`/api/intent`).
- [x] TDD: Implement Mocked Routing/Pathfinding (`/api/route`).
- [x] Scaffold Anchor Workspace and `aura-escrow` program.
- [x] Write initial Anchor tests for PDA delegation and guardrails.

## Phase 2: On-Chain Logic & Logic Refinement (Completed)
**Goal:** Finalize the Solana program and integrate real API behavior.
- [x] Implement Guardrail logic in Anchor (Slippage, Allowance, Destination checks).
- [x] Deploy Anchor program to Localhost/Devnet for integration testing.
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

## Phase 5: Web Client Implementation (Completed)
**Goal:** Build a dashboard-style web interface with wallet connection and voice interaction.
- [x] Scaffold Solana Framework Kit integration in `apps/web`.
- [x] Implement full-screen Landing Page with Wallet Connect.
- [x] Implement Demo Dashboard inspired by voice-agent dashboard design.
- [x] Integrate ElevenLabs Web SDK for voice sessions.
- [x] Polish UI with Tailwind CSS and Framer Motion.

## Phase 6: Action Execution & Full Orchestration (Completed)
**Goal:** Implement real on-chain execution for all orchestrated intents.
- [x] Implement Solana "Send" feature for SOL and SPL tokens.
- [x] Implement manual test UI for direct action execution.
- [x] Implement LI.FI integration for "Swap" action.
- [x] End-to-end validation of Voice -> Intent -> Signature -> On-Chain.

## Phase 7: Monetization & Subscription (Active)
**Goal:** Implement X402 Payment Gateway for premium voice agent access.
- [x] Update Anchor program with `pay_subscription` (0.1 SOL for 30 days).
- [x] Implement on-chain time-bound proof logic.
- [x] Build Backend Subscription Guard (checks on-chain state before issuing session tokens).
- [x] Implement X402 "Payment Required" (402) protocol flow.
- [x] Design and build "Upgrade to Premium" Modal UI.
- [ ] End-to-end TDD verification of Subscription workflow.

---

## Status Updates
- **2026-05-10**: Implemented X402 Subscription Gateway. Voice agent service now requires a 0.1 SOL on-chain payment for 30 days of access.
- **2026-05-10**: Completed real on-chain execution for Send and Swap (via LI.FI) in the web client.
- **2026-05-08**: Resolved Android build failure by downgrading dependencies and cleaning prebuild. Gradle build is now successful.
*See `docs/context.json` for granular state tracking.*
