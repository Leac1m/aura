import { NextResponse } from 'next/server'
import axios from 'axios'

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const TIMEOUT_MS = 30000; // 30 seconds

async function fetchWithRetry(url: string, apiKey: string, retries = MAX_RETRIES): Promise<any> {
  try {
    const response = await axios.get(url, {
      headers: { 'xi-api-key': apiKey },
      timeout: TIMEOUT_MS,
      // Force IPv4 to avoid potential IPv6/DNS issues
      family: 4 
    });
    return response.data;
  } catch (error: any) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout');
    const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || error.message.includes('Network Error');
    
    if (retries > 0 && (isTimeout || isNetworkError)) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      console.warn(`ElevenLabs connection failed (${error.code || error.message}), retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, apiKey, retries - 1);
    }
    throw error;
  }
}

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json({ error: 'ElevenLabs configuration missing' }, { status: 500 });
  }

  try {
    // WebRTC token endpoint for ElevenLabs Conversational AI
    const data = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      apiKey
    );

    // Return the token as conversationToken to match the startSession parameter
    return NextResponse.json({ conversationToken: data.token });
  } catch (error: any) {
    console.error('Error fetching conversation token:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });

    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout');
    return NextResponse.json(
      { error: isTimeout ? 'Connection to ElevenLabs timed out. Please check your network.' : (error.message || 'Failed to fetch conversation token') },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
