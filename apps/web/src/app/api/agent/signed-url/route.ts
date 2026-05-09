import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const TIMEOUT_MS = 30000; // 30 seconds

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
  } catch (error: any) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch failed'))) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
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
    const response = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
        cache: 'no-store', // Ensure we don't cache signed URLs
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const signedUrl = data.signed_url;

    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    const isTimeout = error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT';
    return NextResponse.json(
      { error: isTimeout ? 'Connection to ElevenLabs timed out. Please check your network.' : (error.message || 'Failed to generate signed URL') },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
