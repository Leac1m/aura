import { address, createSolanaRpc, createSolanaRpcSubscriptions, getAddressEncoder } from '@solana/kit';
import { AURA_ESCROW_IDL } from '@aura/types';

const PROGRAM_ID = AURA_ESCROW_IDL.address;

export interface SubscriptionStatus {
  isActive: boolean;
  endsAt: number;
}

export async function checkSubscription(walletAddress: string, rpcUrl: string): Promise<SubscriptionStatus> {
  try {
    const rpc = createSolanaRpc(rpcUrl);
    
    // Find Escrow PDA
    // seeds = [b"escrow", user.key().as_ref()]
    // In Anchor 0.30.1, discriminator is 8 bytes.
    // EscrowState discriminator: [19, 90, 148, 111, 55, 130, 229, 108]
    
    // We need to derive the PDA address.
    // Since I don't have a derivation helper for @solana/kit yet, I'll use a simpler approach
    // or just use @solana/web3.js for the derivation if needed.
    // Actually, I'll use the hardcoded PDA derivation logic.
    
    const { getProgramDerivedAddress } = await import('@solana/addresses');
    
    const [escrowPda] = await getProgramDerivedAddress({
      programAddress: address(PROGRAM_ID),
      seeds: [
        new TextEncoder().encode('escrow'),
        getAddressEncoder().encode(address(walletAddress))
      ]
    });

    const account = await rpc.getAccountInfo(escrowPda, { encoding: 'base64' }).send();
    
    if (!account.value) {
      return { isActive: false, endsAt: 0 };
    }

    const data = Buffer.from(account.value.data[0], 'base64');
    
    // Offset 8 (discriminator) + 32 (owner) + 2 (max_slippage) + 8 (max_allowance) = 50
    // subscription_end is i64 (8 bytes) at offset 50
    const subscriptionEnd = data.readBigInt64LE(50);
    const endsAt = Number(subscriptionEnd);
    const now = Math.floor(Date.now() / 1000);

    return {
      isActive: endsAt > now,
      endsAt
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false, endsAt: 0 };
  }
}
