import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { AURA_ESCROW_IDL } from "@aura/types";

describe("aura-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const user = (provider as anchor.AnchorProvider).wallet;
  
  // Using shared IDL from @aura/types
  const program = new anchor.Program(AURA_ESCROW_IDL as any, provider);

  it("Initializes a Delegation Escrow PDA", async () => {
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), user.publicKey.toBuffer()],
      program.programId
    );

    const maxSlippage = 50;
    const maxAllowance = new anchor.BN(1000000000);

    await program.methods
      .initializeEscrow(maxSlippage, maxAllowance)
      .accounts({
        escrow: escrowPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const escrowAccount: any = await program.account.escrowState.fetch(escrowPda);
    expect(escrowAccount.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(escrowAccount.subscriptionEnd.toNumber()).to.equal(0);
  });

  it("Pays for a 30-day subscription", async () => {
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), user.publicKey.toBuffer()],
      program.programId
    );

    const treasury = anchor.web3.Keypair.generate();
    const initialTreasuryBalance = await provider.connection.getBalance(treasury.publicKey);

    await program.methods
      .paySubscription()
      .accounts({
        escrow: escrowPda,
        user: user.publicKey,
        treasury: treasury.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const finalTreasuryBalance = await provider.connection.getBalance(treasury.publicKey);
    expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(100_000_000); // 0.1 SOL

    const escrowAccount: any = await program.account.escrowState.fetch(escrowPda);
    const now = Math.floor(Date.now() / 1000);
    // Subscription should end in approximately 30 days
    expect(escrowAccount.subscriptionEnd.toNumber()).to.be.greaterThan(now + 29 * 24 * 60 * 60);
  });
});
