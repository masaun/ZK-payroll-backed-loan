# Generate a dedicated deployer keypair
solana-keygen new -o ~/.config/solana/deployer-keypair.json

# Check if keypair exists
ls -la ~/.config/solana/deployer-keypair.json

# Fund it on devnet
solana airdrop 2 --keypair ~/.config/solana/deployer-keypair.json