# Setup environment
echo "Setting up environment for Circuit One (incl. sunspot command)..."
source ~/.zshrc && sunspot help

# Compile and execute
echo "Building Circuit One..."
nargo compile
nargo execute

# Sunspot pipeline
echo "Running Sunspot pipeline for Circuit One..."
sunspot compile target/one.json
sunspot setup target/one.ccs
sunspot prove target/one.json target/one.gz target/one.ccs target/one.pk

# Build and deploy verifier on Solana
echo "Building and deploying verifier for Circuit One..."
sunspot deploy target/one.vk
solana program deploy target/one.so

# Test client
echo "Testing client for Circuit One..."
cd client && npm install
npm run verify -- 42 100
npm run verify -- 42 100 --corrupt  # Test rejection