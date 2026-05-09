# Aura Architecture: Voice-to-Intent Pipeline

This architecture bridges the gap between high-latency AI reasoning and high-speed blockchain execution. By using ElevenLabs’ **Client Tools**, we move the "Intelligence" to the edge, while the "Control" remains in the business logic layer.

---

### 1. Data Flow Architecture (The Handoff)

With ElevenLabs metadata, the AI acts strictly as a "Goal Extractor."

*   **The Handoff:** The user speaks, ElevenLabs parses the speech using the `trigger_solana_action` tool, and returns a JSON payload to the Node.js/TypeScript backend (or React Native client acting as the BLL).
*   **The Payload:** The BLL receives a clean, risk-agnostic JSON: `{"action": "swap", "amount": 2, "asset": "SOL", "to_asset": "BONK"}`.
*   **The Boundary:** At this exact moment, the AI's job is done. The BLL takes over to construct the actual financial constraints.

---

### 2. Business Logic Layer (The Risk & Routing Engine)

Once the JSON reaches the BLL, it acts as the "Solver Orchestrator." It must enrich the bare intent with strict financial parameters before asking the user to sign anything.

1.  **Dynamic Risk Assessment (Slippage):** The BLL evaluates the requested pair to dynamically set slippage.
    *   *Stablecoin to Stablecoin (USDC to USDT):* BLL hardcodes slippage to `0.001` (0.1%).
    *   *High Liquidity (SOL to USDC):* BLL sets slippage to `0.005` (0.5%).
    *   *Low Liquidity/Meme Coins (SOL to BONK):* BLL queries an oracle or price API, detects volatility, and sets slippage to `0.01` to `0.03` (1% - 3%).
2.  **API Routing (LI.FI Integration):** The BLL calls the LI.FI API `/v1/advanced/routes` endpoint. It injects the parsed assets, amounts, AND its dynamically calculated `slippage` parameter.
3.  **Quote Validation:** The BLL receives the route data from LI.FI. It extracts the `estimate.amountOut` and `estimate.amountOutMin` (which factors in the slippage).
4.  **The X402 Gatekeeper:** If the intent requires a "Private Skill" (e.g., executing a complex arbitrage route), the BLL checks the `price_x402`. It prepares a micro-transaction to unlock the premium data from the Skill Server.

---

### 3. Smart Contract Integration (The Aura Escrow)

The BLL does not just pass the raw LI.FI calldata to the wallet; it wraps it in the custom **Aura Escrow Anchor Program** for delegated execution.

*   **Transaction Construction:** The BLL uses a **Transaction Builder** pattern. It wraps the LI.FI calldata into the Aura Escrow’s `execute_agent_task` instruction.
*   **On-Chain Parameter Validation:** The BLL passes the `minimum_amount_out` (calculated in step 2) directly into the Anchor program instruction arguments.
*   **Execution Guardrail:** When the Aura Escrow CPIs (Cross-Program Invokes) into the DEX (e.g., Jupiter via LI.FI), the final lines of the Rust smart contract explicitly check the user's token balance. If the post-swap balance is less than the `minimum_amount_out`, the smart contract **reverts the entire transaction**.

---

### 4. End-to-End Flow Verification (Concrete Example)

**User Voice:** *"Swap 2 SOL for BONK and send it to the address in my clipboard."*

| Step | Component | Action | Result |
| :--- | :--- | :--- | :--- |
| **1** | ElevenLabs | STT + Intent Extraction via Tool. | `action: "bridge", amount: 2, asset: "SOL", to_asset: "BONK"` |
| **2** | BLL | **Context Resolver** reads native Clipboard. | `destination_address: "0xABC...123"` |
| **3** | BLL | **Risk Module** evaluates pair volatility. | Sets `slippage_tolerance = 1.5%`. |
| **4** | BLL | **LI.FI API** queried with parameters. | Returns Route. `amountOutMin: 450,000 BONK`. |
| **5** | BLL | **Builder** creates Aura Escrow Instruction. | Serialized TX wrapped with `min_out: 450000`. |
| **6** | UI | **Guardrail Card** displays the Plan. | Shows: "Swap 2 SOL for min 450K BONK & Send to 0xABC" |
| **7** | Wallet | **MWA** triggers Phantom/Solflare. | User provides single biometric Signature. |
| **8** | Network | Transaction broadcast via RPC. | DEX Swap executed; Escrow forwards to 0xABC. |

---

### 5. Potential Issues & Failure Points

*   **Liquidity Crunches (No Route Found):** If the user asks to swap a massive amount of an illiquid token, the LI.FI API will return a 404 or an extreme price impact warning.
    *   **Handling:** The BLL catches this error and triggers a UI halt, instructing the TTS to say, *"I cannot find a safe route for that amount due to low liquidity."*
*   **Speech Ambiguity:** If ElevenLabs hears "Send 1 Soul" instead of "1 SOL," the tool call might fail.
    *   **Handling:** The BLL asset normalization dictionary catches the error. The UI "Guardrail Card" must *always* display the parsed asset for user confirmation before signing.
*   **RPC Congestion:** Solana can experience landrushes resulting in dropped transactions.
    *   **Handling:** Implement **Priority Fees** dynamically in the BLL. If the user sounds hurried, or if network base fees are spiking, the BLL adds a compute budget instruction to the payload.

---

### 6. Testing and Validation

Because the AI parsing is separated from the financial logic, testing becomes highly deterministic.

1.  **Risk Engine Unit Tests (Jest):** Feed the BLL mock token pairs (e.g., SOL/USDC vs. PEPE/WIF) and assert that it correctly assigns tight slippage to the former and wider slippage to the latter.
2.  **API Mocking (Supertest/Nock):** Simulate LI.FI returning an `amountOutMin` that implies a 10% price impact. Assert that the BLL correctly aborts the transaction build and returns an error to the UI.
3.  **On-Chain Revert Tests (Bankrun):** Use `solana-bankrun` to simulate the Anchor program's execution. Intentionally pass an `execute_agent_task` where the DEX swap yields *less* than the `minimum_amount_out` parameter. Assert that the Rust program successfully panics and reverts.