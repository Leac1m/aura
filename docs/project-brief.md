This revised **Product Requirements Document (PRD)** emphasizes a modular, API-first approach. By offloading heavy natural language processing and complex decision-making to specialized APIs, the mobile client remains lightweight and performant while ensuring the architecture is feasible for a hackathon or rapid deployment.

---

# Product Requirements Document (PRD): Aura (v2.0)

## **Agentic Utility & Routing Assistant**

### 1. Project Overview

**Project Name:** Aura

**Short Description:** A mobile-native, voice-controlled Solana smart wallet interface. Aura utilizes off-chain AI "brains" (via APIs) and an on-chain "skill" repository to autonomously execute complex DeFi routing, payments, and blockchain tasks based on natural language user intents.

**Tech Stack:** React Native (Expo), Solana Mobile Stack (SMS), Anchor/Rust, **OpenAI/Anthropic API** (Intent), **ElevenLabs API** (Voice), **LI.FI API** (Execution), **X402 Protocol** (Payments).

---

### 2. Product Vision & Problem Statement

Mobile Web3 is currently hindered by "click-fatigue"—the need to navigate multiple tabs and sign several transactions for a single goal. Aura solves this by using **API-driven Agentic Intelligence**. Users speak a goal; Aura’s backend interprets the logic, fetches the necessary programmatic skills, and presents a single execution path on Solana.

---

### 3. Core App Flow & User Experience

To maintain feasibility, the "Intelligence" is centralized in API calls, while "Control" remains with the user’s local wallet.

1. **Voice Capture:** User triggers the mic; **ElevenLabs STT** converts audio to text.
2. **Intent Orchestration (The API Brain):**
* The text is sent to a **Core Logic API** (OpenAI/Anthropic).
* The AI parses the intent into a structured JSON: `action`, `asset`, `amount`, and `constraints`.


3. **Skill Discovery & Acquisition:**
* **Local/Public:** The app matches the intent against a library of "Skills" (instruction sets).
* **Private (X402):** If the required logic is proprietary (e.g., an advanced MEV-protected swap), the app uses the **X402 protocol** to pay a micro-fee via Solana to unlock the skill's API endpoint.


4. **Transaction Preparation:** The app combines the Skill logic with real-time data from the **LI.FI API** to find the optimal route.
5. **Secure Execution:** The user signs a single "Delegation" transaction via **MWA**. The Aura Anchor program then executes the multi-step process autonomously.

---

### 4. Technical Architecture & Integrations

Aura relies on a "Thin Client, Thick API" model to ensure mobile performance.

#### **A. AI & Intelligence Layer (Off-Chain APIs)**

* **Intent API (OpenAI GPT-4o/Claude 3.5):** Acts as the reasoning engine. It maps "Save my SOL" to "Deposit SOL into JitoSOL for liquid staking."
* **Speech API (ElevenLabs):** Provides high-fidelity STT for input and TTS for status updates (e.g., "I've found a 7% yield path for your USDC; should I proceed?").
* **Routing API (LI.FI):** The "Heavy Lifter" for DeFi. It handles all cross-dex pathfinding, removing the need for Aura to maintain custom integrations with Orca, Raydium, or Jupiter.

#### **B. On-Chain Layer (Solana/Anchor)**

* **Aura Delegation Escrow:** A custom Anchor program that creates a **Program Derived Address (PDA)** for the user.
* **Guardrails:** The PDA only allows transactions that meet the "Skill Manifest" criteria (e.g., "Only send to [Address X]" or "Slippage must be < 0.5%").

#### **C. Mobile Layer (React Native & SMS)**

* **Mobile Wallet Adapter (MWA):** The bridge to Phantom/Solflare.
* **X402 Client:** A lightweight TS implementation to handle `402 Payment Required` headers when calling premium skill APIs.

---

### 5. Data Model: The "Skill" Manifest

Skills are served via API as JSON objects to ensure the app doesn't need to be updated to learn new tricks.

```json
{
  "skill_id": "lifi-bridge-swap",
  "version": "1.0.2",
  "api_endpoint": "https://api.aura.bot/v1/skills/lifi",
  "parameters": {
    "fromChain": "solana",
    "toAsset": "USDC",
    "maxSlippage": 0.005
  },
  "constraints": {
    "min_auth_level": "user_signed",
    "max_sol_allowance": 10.0
  }
}

```

---

### 6. Implementation Roadmap (Feasibility Focused)

| Phase | Focus | Key Deliverable |
| --- | --- | --- |
| **Phase 1** | **Connectivity** | Scaffold Expo app + MWA connection to Phantom. |
| **Phase 2** | **The Brain** | Set up API routes for ElevenLabs and OpenAI intent parsing. |
| **Phase 3** | **The Escrow** | Deploy the Anchor program to Devnet to handle "Allowance" logic. |
| **Phase 4** | **DeFi Integration** | Plug in LI.FI API to execute real swaps via the AI's parsed JSON. |
| **Phase 5** | **X402 & Polish** | Implement the micro-payment flow for "Premium Skills" and final UI. |

---

### 7. Hackathon Qualification Summary

* **Solana Specific:** Uses MWA, SMS, and a custom Anchor Program (Aura Escrow).
* **Feasibility:** Uses battle-tested APIs (**LI.FI, OpenAI, ElevenLabs**) to ensure the core "Agent" logic is stable and fast.
* **UX Innovation:** Shifts the paradigm from "Manual Trading" to "Intent-Based Execution" via voice.

---

> **Technical Note:** By utilizing the **X402 protocol**, Aura creates a monetization layer for developers. If a dev writes a "Skill" that yields 1% better than standard routes, they can gate that Skill’s API behind a 0.001 SOL fee, which Aura handles automatically in the background.
