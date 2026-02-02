const { PublicKey } = require("@solana/web3.js");

// Program IDs and Mint from .env
const LENDING_PROGRAM_ID = "GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF";
const TEST_USDC_MINT = "BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc";

// Derive lending pool PDA
const [lendingPoolPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("lending_pool"), new PublicKey(TEST_USDC_MINT).toBuffer()],
  new PublicKey(LENDING_PROGRAM_ID)
);

console.log("Lending Pool PDA:", lendingPoolPDA.toString());
console.log("Bump:", bump);
