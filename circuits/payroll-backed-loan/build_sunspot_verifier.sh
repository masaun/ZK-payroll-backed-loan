echo "Compile and execute"
nargo compile
nargo execute

echo "Sunspot pipeline"
sunspot compile target/payroll_backed_loan.json
sunspot setup target/payroll_backed_loan.ccs
sunspot prove target/payroll_backed_loan.json target/payroll_backed_loan.gz \
  target/payroll_backed_loan.ccs target/payroll_backed_loan.pk

echo "Build and deploy verifier"
sunspot deploy target/payroll_backed_loan.vk
solana program deploy target/payroll_backed_loan.so

echo "Test client"
cd client && npm install
npm run verify -- --program <PROGRAM_ID>
npm run test-transfer  # Integration test with SOL transfers