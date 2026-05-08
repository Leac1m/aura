import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("aura-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const user = (provider as anchor.AnchorProvider).wallet;
  
  const idl: any = {
    "address": "EWtCKe8i6PcCAu933mZSYkWGzPDyhAwKAQyzvTNgP15w",
    "metadata": { "name": "aura_escrow" },
    "instructions": [
      {
        "name": "initializeEscrow",
        "discriminator": [243, 160, 77, 153, 11, 92, 48, 209],
        "accounts": [
          { "name": "escrow", "writable": true, "signer": false },
          { "name": "user", "writable": true, "signer": true },
          { "name": "systemProgram", "writable": false, "signer": false }
        ],
        "args": [
          { "name": "maxSlippage", "type": "u16" },
          { "name": "maxAllowance", "type": "u64" }
        ]
      },
      {
        "name": "updateGuardrails",
        "discriminator": [67, 193, 237, 32, 162, 194, 185, 53],
        "accounts": [
          { "name": "escrow", "writable": true, "signer": false },
          { "name": "owner", "writable": false, "signer": true },
          { "name": "user", "writable": false, "signer": false }
        ],
        "args": [
          { "name": "maxSlippage", "type": "u16" },
          { "name": "maxAllowance", "type": "u64" }
        ]
      }
    ],
    "accounts": [
      {
        "name": "EscrowState",
        "discriminator": [19, 90, 148, 111, 55, 130, 229, 108]
      }
    ],
    "types": [
      {
        "name": "EscrowState",
        "type": {
          "kind": "struct",
          "fields": [
            { "name": "owner", "type": "pubkey" },
            { "name": "maxSlippage", "type": "u16" },
            { "name": "maxAllowance", "type": "u64" },
            { "name": "bump", "type": "u8" }
          ]
        }
      }
    ]
  };

  const program = new anchor.Program(idl, provider);

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
