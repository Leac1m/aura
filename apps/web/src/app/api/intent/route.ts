import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text')

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 })
  }

  // MOCK LOGIC: In the future, this will call OpenAI/Anthropic
  // For now, we return a mock response based on the intent.
  
  const mockResponse = {
    action: 'swap',
    amount: 1,
    asset: 'SOL',
    toAsset: 'USDC',
    raw_intent: text,
    confidence: 0.98,
    skill_id: 'lifi-bridge-swap'
  }

  return NextResponse.json(mockResponse)
}
