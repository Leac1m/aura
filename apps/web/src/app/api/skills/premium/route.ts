import { NextResponse } from 'next/server'
import { createX402Response, verifyX402Payment } from '@/lib/x402'

export async function GET(request: Request) {
  const signature = request.headers.get('X-402-Payment-Signature')

  if (!verifyX402Payment(signature)) {
    return createX402Response({
      payment_address: 'AuraFeeRecipient123',
      amount_lamports: 1000000, // 0.001 SOL
      label: 'Aura Premium Skill: MEV-Protected Routing'
    })
  }

  return NextResponse.json({
    premium_data: 'This is protected content unlocked by X402 payment.',
    skill_config: {
      use_jito: true,
      protection_level: 'max'
    }
  })
}
