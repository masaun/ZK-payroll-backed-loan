# Set the config to use this keypair (if not automatically set)
solana config set --keypair ~/.config/solana/id.json

# Verify the configuration
solana config get

# Check if keypair exists
ls -la ~/.config/solana/id.json

# If testing locally, ensure you're on the correct network
solana config set --url localhost  # or devnet/testnet/mainnet-beta