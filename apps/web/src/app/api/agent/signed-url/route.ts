import { NextResponse } from 'next/server'
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json({ error: 'ElevenLabs configuration missing' }, { status: 500 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    
    // Using the conversationalAi service to get a signed URL
    const signedUrl = await client.conversationalAi.conversations.getSignedUrl({
      agentId: agentId
    });

    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate signed URL' }, { status: 500 });
  }
}
