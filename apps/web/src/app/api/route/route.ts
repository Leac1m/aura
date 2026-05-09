import { NextResponse } from 'next/server'
import axios from 'axios'

const SOLANA_CHAIN_ID = '1151111081099710';
const TOKEN_MAP: Record<string, string> = {
  'SOL': '11111111111111111111111111111111',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'JITOSOL': 'J1toso9baSu2neeDY2N6XtM3EaQpT3G6Xh6m9z91P',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

const STABLES = ['USDC', 'USDT'];
const MAJORS = ['SOL', 'JITOSOL'];

function calculateSlippage(fromAsset: string, toAsset: string): number {
  const from = fromAsset.toUpperCase();
  const to = toAsset.toUpperCase();

  // Stable to Stable: 0.1%
  if (STABLES.includes(from) && STABLES.includes(to)) {
    return 0.001;
  }

  // Major to Stable or Major: 0.5%
  if (MAJORS.includes(from) && (STABLES.includes(to) || MAJORS.includes(to))) {
    return 0.005;
  }

  // Fallback for everything else (Memes, low liquidity): 2.0%
  return 0.02;
}

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

    if (action === 'swap' || action === 'bridge') {
      if (!toToken) {
        return NextResponse.json({ error: 'Swap/Bridge requires to_asset' }, { status: 400 })
      }

      // Calculate dynamic slippage based on BLL Risk Module
      const slippage = calculateSlippage(asset, to_asset as string);

      // Convert amount to base units
      const decimals = asset.toUpperCase() === 'USDC' || asset.toUpperCase() === 'USDT' ? 6 : 9;
      const amountInBase = Math.floor(amount * Math.pow(10, decimals)).toString();

      console.log(`BLL: Requesting route for ${amount} ${asset} -> ${to_asset} with ${slippage * 100}% slippage`);

      const response = await axios.get('https://li.quest/v1/quote', {
        params: {
          fromChain: SOLANA_CHAIN_ID,
          toChain: SOLANA_CHAIN_ID,
          fromToken: fromToken,
          toToken: toToken,
          fromAmount: amountInBase,
          fromAddress: from_address,
          slippage: slippage,
        },
        headers: lifiApiKey ? { 'x-lifi-api-key': lifiApiKey } : {}
      });

      // Enrich response with BLL metadata
      const enrichedData = {
        ...response.data,
        bll_metadata: {
          slippage_applied: slippage,
          risk_tier: slippage === 0.001 ? 'stable' : slippage === 0.005 ? 'major' : 'volatile',
          min_amount_out: response.data.estimate?.toAmountMin,
        }
      };

      return NextResponse.json(enrichedData);
    }

    return NextResponse.json({ 
      message: `Action '${action}' recognized but not yet fully routed via BLL Risk Engine.`,
      intent: body
    });

  } catch (error: any) {
    console.error('BLL Routing Error:', error.response?.data || error.message);
    const errorDetails = error.response?.data || error.message;
    
    // Handle specific LI.FI errors as defined in architecture (e.g., no route)
    if (error.response?.status === 404 || errorDetails?.message?.includes('No route')) {
      return NextResponse.json({ 
        error: 'Liquidity Crunch: No safe route found for this amount.',
        details: errorDetails
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'BLL Routing Engine failed to find a valid quote.', 
      details: errorDetails
    }, { status: 500 });
  }
}
