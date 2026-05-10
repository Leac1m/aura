import { NextResponse } from 'next/server'
import axios from 'axios'
import { checkSubscription } from '@/lib/subscription'
import { createX402Response } from '@/lib/x402'

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;
const TIMEOUT_MS = 30000;

async function fetchWithRetry(url: string, apiKey: string, retries = MAX_RETRIES): Promise<{ signed_url: string }> {
  try {
    const response = await axios.get(url, {
      headers: { 'xi-api-key': apiKey },
      timeout: TIMEOUT_MS,
      family: 4 
    });
    return response.data;
  } catch (error: unknown) {
    const isAxiosError = axios.isAxiosError(error);
    const errorCode = isAxiosError ? error.code : undefined;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const isTimeout = errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout');
    const isNetworkError = errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN' || errorMessage.includes('Network Error');
    
    if (retries > 0 && (isTimeout || isNetworkError)) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, apiKey, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  if (!userAddress) {
    return NextResponse.json({ error: 'User wallet address required' }, { status: 400 });
  }

  // 1. Check On-Chain Subscription (DISABLED FOR TESTING)
  /*
  const subscription = await checkSubscription(userAddress, rpcUrl);

  if (!subscription.isActive) {
    return createX402Response({
      payment_address: 'AuraTreasuryAddress123', // This would be the treasury PDA in production
      amount_lamports: 100_000_000, // 0.1 SOL
      label: 'Aura 30-Day Premium Voice Subscription'
    });
  }
  */

  // 2. Fetch ElevenLabs Token
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json({ error: 'ElevenLabs configuration missing' }, { status: 500 });
  }

  try {
    const [signedUrlData, tokenData] = await Promise.all([
      fetchWithRetry(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, apiKey),
      fetchWithRetry(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`, apiKey)
    ]);

    return NextResponse.json({ 
      signedUrl: signedUrlData.signed_url,
      conversationToken: tokenData.token,
      subscription_expires: 0 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAxiosError = axios.isAxiosError(error);
    const isTimeout = isAxiosError && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
    
    console.error('Error fetching conversation token:', errorMessage);
    
    return NextResponse.json(
      { error: isTimeout ? 'Connection to ElevenLabs timed out.' : (errorMessage || 'Failed to fetch conversation token') },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
