import { NextResponse } from 'next/server'

export interface X402Requirement {
  payment_address: string;
  amount_lamports: number;
  label: string;
}

export function createX402Response(requirement: X402Requirement) {
  const headerValue = `solana:${requirement.payment_address}?amount=${requirement.amount_lamports}&label=${encodeURIComponent(requirement.label)}`;
  
  return new NextResponse(
    JSON.stringify({
      error: 'Payment Required',
      message: 'This skill requires a micro-payment via X402 protocol.',
      requirement
    }),
    {
      status: 402,
      headers: {
        'X-402-Payment-Required': headerValue,
        'Content-Type': 'application/json'
      }
    }
  )
}

export function verifyX402Payment(payment_signature: string | null): boolean {
  if (!payment_signature) return false;
  // In a real implementation, we would verify the transaction signature on-chain
  // to ensure the payment was made to our address.
  return payment_signature.length > 0; 
}
