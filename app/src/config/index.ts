import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'


// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [solana, solanaTestnet, solanaDevnet] as [AppKitNetwork, ...AppKitNetwork[]]

// Set up Solana Adapter
export const solanaWeb3JsAdapter = new SolanaAdapter()

// Solana Program IDs (Devnet)
export const PROGRAM_IDS = {
  zkCredentialManager: process.env.NEXT_PUBLIC_ZK_CREDENTIAL_PROGRAM_ID || "HskmoEBbJFB9LYssgyy1AwUthUMEbUPNwsF9YMPELHcR",
  lending: process.env.NEXT_PUBLIC_LENDING_PROGRAM_ID || "GGmcpKrSS1MsNv9LLvzcpEGRGr3BqBasky9tX6DVw8AF",
  borrowing: process.env.NEXT_PUBLIC_BORROWING_PROGRAM_ID || "HBY7P5xzgxhmaSXFiGE3HeWrmhNScYh3r6amyp4q7e4x",
  testUsdc: process.env.NEXT_PUBLIC_TEST_USDC_PROGRAM_ID || "41NBEbnBWvQTLs6TRKCDWH88rJTpdFUvq5WA3zpQGYfY"
} as const

// Token Mints (Devnet)
export const TOKEN_MINTS = {
  testUsdc: process.env.NEXT_PUBLIC_TEST_USDC_MINT || "BNpFU4gF1HLBghg262GxthuMUhy8bbe966atA8yyTuVc"
} as const

// SPL Token Program ID
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
export const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"