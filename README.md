# Aura: Agentic Utility & Routing Assistant

Aura is a mobile-native, voice-controlled Solana smart wallet interface that utilizes off-chain AI "brains" and an on-chain "skill" repository to autonomously execute complex DeFi tasks based on natural language user intents.

## 🚀 Architecture

- **Mobile Client**: Expo (React Native) + Solana Mobile Stack (SMS) + Mobile Wallet Adapter (MWA).
- **Agentic Backend**: Next.js App Router (TypeScript) serving as the orchestration engine.
- **On-Chain Escrow**: Anchor (Rust) program providing secure PDA-based delegation with guardrails (slippage, allowance).
- **Intelligence Layer**: OpenAI (Intent), ElevenLabs (Speech), LI.FI (DeFi Routing), X402 (Micro-payments).

## 🛠️ Project Structure

```text
aura/
├── apps/
│   ├── mobile/         # Expo React Native App
│   └── web/            # Next.js API Backend
├── programs/
│   └── aura-escrow/    # Anchor/Solana Program
├── docs/               # Roadmap, Context, and Brief
└── package.json
```

## 🚥 Getting Started

### 1. Backend (Next.js)
```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```
*Note: The backend runs on `http://localhost:3000` by default. Update `apps/mobile/src/lib/api.ts` with your local IP if testing on a physical Android device.*

### 2. Mobile (Expo)
```bash
cd apps/mobile
npm install
npx expo start
```
*Note: Requires an Android device/emulator with a Solana wallet (Phantom/Solflare) installed for MWA.*

### 3. On-Chain (Anchor)
```bash
cd programs/aura-escrow
anchor build
anchor test --skip-build
```

## 🔑 Environment Variables

To transition from the current TDD/Mocked state to production, provide the following keys in `apps/web/.env`:

| Variable | Source | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI | Intent parsing and reasoning |
| `ELEVENLABS_API_KEY` | ElevenLabs | High-fidelity STT/TTS |
| `LIFI_API_KEY` | LI.FI | DeFi routing and pathfinding |
| `SOLANA_PRIVATE_KEY` | Solana CLI | Fee payer for automated execution |

## 🛡️ Security & Guardrails

Aura uses a custom Anchor program to ensure agentic safety:
- **Max Slippage**: Defined at initialization; transactions exceeding this are rejected on-chain.
- **Max Allowance**: Caps the amount the agent can move in a single session.
- **PDA Delegation**: Funds remain in a user-controlled PDA, not a centralized hot wallet.

## 🏆 Hackathon Notes

Aura demonstrates a "Thin Client, Thick API" model, allowing for rapid skill deployment without requiring app store updates. It pioneers the **X402 Protocol** for monetizing specialized agentic skills on Solana.
