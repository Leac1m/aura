export interface IntentResponse {
  action: string;
  amount: number;
  asset: string;
  toAsset?: string;
  raw_intent: string;
  confidence: number;
  skill_id: string;
}

export interface RouteStep {
  type: string;
  tool: string;
  action: any;
}

export interface RouteResponse {
  route_id: string;
  steps: RouteStep[];
  transaction_request: {
    to: string;
    data: string;
    value: string;
  };
}

export const AURA_ESCROW_IDL = {
  "address": "EWtCKe8i6PcCAu933mZSYkWGzPDyhAwKAQyzvTNgP15w",
  "metadata": { "name": "aura_escrow" },
  "instructions": [
    {
      "name": "initializeEscrow",
      "discriminator": [243, 160, 77, 153, 11, 92, 48, 209],
      "accounts": [
        { "name": "escrow", "writable": true, "signer": false },
        { "name": "user", "writable": true, "signer": true },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "maxSlippage", "type": "u16" },
        { "name": "maxAllowance", "type": "u64" }
      ]
    },
    {
      "name": "updateGuardrails",
      "discriminator": [67, 193, 237, 32, 162, 194, 185, 53],
      "accounts": [
        { "name": "escrow", "writable": true, "signer": false },
        { "name": "owner", "writable": false, "signer": true },
        { "name": "user", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "maxSlippage", "type": "u16" },
        { "name": "maxAllowance", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "EscrowState",
      "discriminator": [19, 90, 148, 111, 55, 130, 229, 108]
    }
  ],
  "types": [
    {
      "name": "EscrowState",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "owner", "type": "pubkey" },
          { "name": "maxSlippage", "type": "u16" },
          { "name": "maxAllowance", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
};
