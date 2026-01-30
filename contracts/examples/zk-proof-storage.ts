import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkVerifiableCredentialManager } from "../target/types/zk_verifiable_credential_manager";
import { PublicKey, Keypair, Connection, clusterApiUrl } from "@solana/web3.js";

/**
 * Example: Storing and retrieving ZK-TLS proofs
 */

async function storeProof() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new anchor.Wallet(Keypair.generate());
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.ZkVerifiableCredentialManager as Program<ZkVerifiableCredentialManager>;

  // Request airdrop
  const airdropSig = await connection.requestAirdrop(
    wallet.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);

  // Example: Store payroll verification proof
  const payrollProofData = {
    employer: "Tech Corp Inc.",
    salary: 120000,
    employmentStatus: "active",
    verificationDate: Date.now(),
  };

  const proofData = Buffer.from(JSON.stringify(payrollProofData));
  const publicOutput = Buffer.from(JSON.stringify({
    verified: true,
    salaryBracket: "100k-150k",
  }));
  
  // Generate a unique proof hash
  const proofHash = Array.from(
    anchor.web3.Keypair.generate().publicKey.toBuffer().slice(0, 32)
  );

  // Derive credential PDA
  const [credentialPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("credential"),
      wallet.publicKey.toBuffer(),
      Buffer.from(proofHash),
    ],
    program.programId
  );

  console.log("Storing ZK-TLS proof...");
  console.log("Credential PDA:", credentialPDA.toString());

  try {
    const tx = await program.methods
      .storeZkTlsProofAndPublicOutput(
        Array.from(proofData),
        Array.from(publicOutput),
        proofHash
      )
      .accounts({
        credential: credentialPDA,
        owner: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Proof stored successfully!");
    console.log("Transaction:", tx);

    // Retrieve the stored credential
    const credential = await program.account.zkCredential.fetch(credentialPDA);
    console.log("\nStored Credential Details:");
    console.log("Owner:", credential.owner.toString());
    console.log("Proof Data:", Buffer.from(credential.proofData).toString());
    console.log("Public Output:", Buffer.from(credential.publicOutput).toString());
    console.log("Verified:", credential.isVerified);
    console.log("Timestamp:", new Date(credential.timestamp.toNumber() * 1000).toISOString());

    return {
      credentialPDA,
      proofHash,
      owner: wallet.publicKey,
    };
  } catch (error) {
    console.error("Error storing proof:", error);
    throw error;
  }
}

async function retrieveProof(credentialPDA: PublicKey, owner: PublicKey) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const program = anchor.workspace.ZkVerifiableCredentialManager as Program<ZkVerifiableCredentialManager>;

  console.log("\nRetrieving proof from PDA:", credentialPDA.toString());

  try {
    const credential = await program.account.zkCredential.fetch(credentialPDA);
    
    console.log("✅ Proof retrieved successfully!");
    console.log("\nCredential Information:");
    console.log("Owner:", credential.owner.toString());
    console.log("Verified:", credential.isVerified);
    console.log("Stored at:", new Date(credential.timestamp.toNumber() * 1000).toISOString());
    
    // Parse the proof data
    const proofData = JSON.parse(Buffer.from(credential.proofData).toString());
    console.log("\nPayroll Data:");
    console.log(JSON.stringify(proofData, null, 2));
    
    const publicOutput = JSON.parse(Buffer.from(credential.publicOutput).toString());
    console.log("\nPublic Output:");
    console.log(JSON.stringify(publicOutput, null, 2));

    return credential;
  } catch (error) {
    console.error("Error retrieving proof:", error);
    throw error;
  }
}

// Run the example
async function main() {
  console.log("=== ZK-TLS Proof Storage Example ===\n");
  
  const { credentialPDA, proofHash, owner } = await storeProof();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await retrieveProof(credentialPDA, owner);
  
  console.log("\n=== Example completed ===");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { storeProof, retrieveProof };
