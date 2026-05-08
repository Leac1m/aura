import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // MOCK LOGIC: In the future, this will call LI.FI API
    // For now, we return a mock route response.
    
    const mockRoute = {
      route_id: 'mock-lifi-route-123',
      steps: [
        {
          type: 'swap',
          tool: 'jupiter',
          action: {
            fromAsset: body.asset,
            toAsset: body.toAsset,
            amount: body.amount
          }
        }
      ],
      transaction_request: {
        to: 'AuraEscrowPDA123',
        data: '0xmockdata',
        value: '0'
      }
    }

    return NextResponse.json(mockRoute)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
