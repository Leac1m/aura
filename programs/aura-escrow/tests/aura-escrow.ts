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
    console.log("Program ID:", program.programId.toBase58());
    console.log("User Public Key:", user.publicKey.toBase58());

    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), user.publicKey.toBuffer()],
      program.programId
    );
    console.log("Escrow PDA:", escrowPda.toBase58());

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
    expect(escrowAccount.maxSlippage).to.equal(maxSlippage);
    expect(escrowAccount.maxAllowance.toString()).to.equal(maxAllowance.toString());
  });

  it("Updates guardrails", async () => {
    const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), user.publicKey.toBuffer()],
      program.programId
    );

    const newSlippage = 100;
    const newAllowance = new anchor.BN(2000000000);

    await program.methods
      .updateGuardrails(newSlippage, newAllowance)
      .accounts({
        escrow: escrowPda,
        owner: user.publicKey,
        user: user.publicKey,
      })
      .rpc();

    const escrowAccount: any = await program.account.escrowState.fetch(escrowPda);
    expect(escrowAccount.maxSlippage).to.equal(newSlippage);
    expect(escrowAccount.maxAllowance.toString()).to.equal(newAllowance.toString());
  });
});
