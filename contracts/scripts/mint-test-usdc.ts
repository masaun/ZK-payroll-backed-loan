import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from "@solana/spl-token";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the IDL
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/test_usdc.json", "utf-8")
  ) as Idl;
  
  const programId = new anchor.web3.PublicKey(process.env.TEST_USDC_PROGRAM_ID!);
  const program = new Program(idl, programId, provider);
  
  // Get admin public key from .env
  const adminPubkey = new anchor.web3.PublicKey(process.env.ADMIN!);
  
  console.log("Program ID:", program.programId.toString());
  console.log("Admin Address:", adminPubkey.toString());
  console.log("Payer:", provider.wallet.publicKey.toString());

  // Generate a new keypair for the mint (or use existing one)
  const mintKeypairFile = "./test-usdc-mint-keypair.json";
  let mintKeypair: anchor.web3.Keypair;
  
  if (fs.existsSync(mintKeypairFile)) {
    console.log("Loading existing mint keypair...");
    const mintKeypairData = JSON.parse(fs.readFileSync(mintKeypairFile, "utf-8"));
    mintKeypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(mintKeypairData));
  } else {
    console.log("Generating new mint keypair...");
    mintKeypair = anchor.web3.Keypair.generate();
    fs.writeFileSync(mintKeypairFile, JSON.stringify(Array.from(mintKeypair.secretKey)));
  }

  console.log("Mint Address:", mintKeypair.publicKey.toString());

  // Check if mint is already initialized
  try {
    const mintInfo = await provider.connection.getAccountInfo(mintKeypair.publicKey);
    
    if (!mintInfo) {
      console.log("\nInitializing Test USDC mint with 6 decimals...");
      
      const tx = await program.methods
        .initialize(6) // USDC has 6 decimals
        .accountsStrict({
          mint: mintKeypair.publicKey,
          authority: provider.wallet.publicKey,
          token_program: anchor.utils.token.TOKEN_PROGRAM_ID,
          system_program: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();

      console.log("Mint initialized! Transaction signature:", tx);
    } else {
      console.log("Mint already initialized!");
    }
  } catch (error) {
    console.error("Error checking/initializing mint:", error);
    throw error;
  }

  // Get or create associated token account for admin
  const adminTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    adminPubkey
  );

  console.log("\nAdmin Token Account:", adminTokenAccount.toString());

  // Check if token account exists, if not create it
  const tokenAccountInfo = await provider.connection.getAccountInfo(adminTokenAccount);
  
  if (!tokenAccountInfo) {
    console.log("Creating associated token account for admin...");
    
    const createAtaIx = createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      adminTokenAccount,
      adminPubkey,
      mintKeypair.publicKey
    );

    const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
    const createAtaSignature = await provider.sendAndConfirm(createAtaTx);
    
    console.log("Token account created! Transaction signature:", createAtaSignature);
  } else {
    console.log("Token account already exists!");
  }

  // Mint 1,000,000 tokens (with 6 decimals = 1,000,000,000,000)
  const amount = new anchor.BN(1_000_000_000_000);
  
  console.log("\nMinting 1,000,000 Test USDC tokens to admin...");
  
  try {
    const tx = await program.methods
      .mintTo(amount)
      .accounts({
        mint: mintKeypair.publicKey,
        to: adminTokenAccount,
        authority: provider.wallet.publicKey,
        token_program: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Tokens minted successfully! Transaction signature:", tx);
    
    // Check balance
    const balance = await provider.connection.getTokenAccountBalance(adminTokenAccount);
    console.log("\nAdmin Token Balance:", balance.value.uiAmount, "Test USDC");
    
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }

  console.log("\n✅ All operations completed successfully!");
  console.log("\nSummary:");
  console.log("- Mint Address:", mintKeypair.publicKey.toString());
  console.log("- Admin Address:", adminPubkey.toString());
  console.log("- Admin Token Account:", adminTokenAccount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
