import { NextResponse } from 'next/server'
import axios from 'axios'

const SOLANA_CHAIN_ID = '1151111081099710';
const TOKEN_MAP: Record<string, string> = {
  'SOL': '11111111111111111111111111111111',
  'USDC': 'EPjFW3F2KV2qx89G9A7Qg6Lp763r3fWfVG9RBRLDJja',
  'JITOSOL': 'J1toso9baSu2neeDY2N6XtM3EaQpT3G6Xh6m9z91P',
};

export async function POST(request: Request) {
  const lifiApiKey = process.env.LIFI_API_KEY;

  try {
    const body = await request.json()
    const { action, amount, asset, to_asset, from_address } = body;

    if (!action || !amount || !asset || !from_address) {
      return NextResponse.json({ error: 'Missing required parameters: action, amount, asset, from_address' }, { status: 400 })
    }

    // Map asset symbols to addresses
    const fromToken = TOKEN_MAP[asset.toUpperCase()] || asset;
    const toToken = to_asset ? (TOKEN_MAP[to_asset.toUpperCase()] || to_asset) : null;

    if (action === 'swap') {
      if (!toToken) {
        return NextResponse.json({ error: 'Swap requires to_asset' }, { status: 400 })
      }

      // Convert amount to lamports (assuming 9 decimals for SOL/tokens for now, 
      // in real world should fetch token decimals)
      // USDC has 6 decimals on Solana. SOL has 9.
      const decimals = asset.toUpperCase() === 'USDC' ? 6 : 9;
      const amountInBase = Math.floor(amount * Math.pow(10, decimals)).toString();

      const response = await axios.get('https://li.quest/v1/quote', {
        params: {
          fromChain: SOLANA_CHAIN_ID,
          toChain: SOLANA_CHAIN_ID,
          fromToken: fromToken,
          toToken: toToken,
          fromAmount: amountInBase,
          fromAddress: from_address,
        },
        headers: lifiApiKey ? { 'x-lifi-api-key': lifiApiKey } : {}
      });

      return NextResponse.json(response.data);
    }

    // Fallback for other actions
    return NextResponse.json({ 
      message: `Action '${action}' is recognized but not yet fully implemented with real LI.FI routing.`,
      intent: body
    });

  } catch (error: any) {
    console.error('LI.FI Error:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: 'Failed to fetch route from LI.FI', 
      details: error.response?.data || error.message 
    }, { status: 500 });
  }
}
