import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkVerifiableCredentialManager } from "../target/types/zk_verifiable_credential_manager";
import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("ZK Verifiable Credential Manager", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZkVerifiableCredentialManager as Program<ZkVerifiableCredentialManager>;
  
  let owner: Keypair;
  let credentialPDA: PublicKey;
  let proofHash: number[];

  beforeEach(async () => {
    owner = Keypair.generate();
    
    // Airdrop SOL to owner
    const signature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Generate proof hash
    proofHash = Array.from(Buffer.alloc(32, 1));
    
    // Derive credential PDA
    [credentialPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        owner.publicKey.toBuffer(),
        Buffer.from(proofHash),
      ],
      program.programId
    );
  });

  it("Stores ZK-TLS proof and public output", async () => {
    const proofData = Buffer.from("test-proof-data-" + Math.random());
    const publicOutput = Buffer.from("test-public-output");

    const tx = await program.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch and verify the credential
    const credential = await program.account.zkCredential.fetch(credentialPDA);
    
    expect(credential.owner.toString()).to.equal(owner.publicKey.toString());
    expect(Buffer.from(credential.proofData)).to.deep.equal(proofData);
    expect(Buffer.from(credential.publicOutput)).to.deep.equal(publicOutput);
    expect(credential.proofHash).to.deep.equal(proofHash);
    expect(credential.isVerified).to.be.false;
  });

  it("Retrieves stored ZK-TLS proof and public output", async () => {
    // First store a credential
    const proofData = Buffer.from("test-proof-data");
    const publicOutput = Buffer.from("test-public-output");

    await program.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Then retrieve it
    await program.methods
      .getZkTlsProofAndPublicOutput()
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
      })
      .rpc();

    // Verify by fetching the account
    const credential = await program.account.zkCredential.fetch(credentialPDA);
    expect(Buffer.from(credential.proofData)).to.deep.equal(proofData);
    expect(Buffer.from(credential.publicOutput)).to.deep.equal(publicOutput);
  });

  it("Fails to store proof data that is too large", async () => {
    const largeProofData = Buffer.alloc(15000); // Exceeds MAX_PROOF_SIZE
    const publicOutput = Buffer.from("test");

    try {
      await program.methods
        .storeZkTlsProofAndPublicOutput(
          Array.from(largeProofData),
          Array.from(publicOutput),
          proofHash
        )
        .accounts({
          credential: credentialPDA,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("ProofTooLarge");
    }
  });

  it("Revokes a credential", async () => {
    // First store a credential
    const proofData = Buffer.from("test-proof-data");
    const publicOutput = Buffer.from("test-public-output");

    await program.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Revoke it
    await program.methods
      .revokeCredential()
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    // Verify it's revoked
    const credential = await program.account.zkCredential.fetch(credentialPDA);
    expect(credential.isVerified).to.be.false;
  });

  it("Emits event when storing proof", async () => {
    const proofData = Buffer.from("test-proof-data");
    const publicOutput = Buffer.from("test-public-output");

    const listener = program.addEventListener("ZkTlsProofStored", (event) => {
      expect(event.owner.toString()).to.equal(owner.publicKey.toString());
      expect(event.proofHash).to.deep.equal(proofHash);
    });

    await program.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    await program.removeEventListener(listener);
  });
});
