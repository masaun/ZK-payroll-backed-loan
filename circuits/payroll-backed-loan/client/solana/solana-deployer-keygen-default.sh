echo "Generate a new Solana keypair for deployer in this directory"
solana-keygen new -o deployer-keypair.json

# Set the config to use this keypair (if not automatically set)
solana config set --keypair deployer-keypair.json

# Verify the configuration
solana config get

# Check if keypair exists
ls -la ~/.config/solana/deployer-keypair.json

# Fund it on devnet
solana airdrop 2 --keypair deployer-keypair.json