import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from './src/circuits/circuit-artifacts/payroll-backed-loan-0.0.1/payroll-backed-loan.json';

async function testCircuit() {
  console.log('Initializing backend...');
  const backend = new BarretenbergBackend(circuit as any);
  const noir = new Noir(circuit as any);

  // Create test inputs matching Prover.toml exactly
  const inputs = {
    public_inputs: {
      nullifier: "18102318029033832595063152698149422719479452802847709811413815928880887603966"
    },
    private_inputs: {
      payroll_proof: Array(64).fill("0"),
      payroll_amount: "5000",
      employment_status: true,
      hire_date: "20000",
      current_date: "20360",
      min_payroll_amount: "3000",
      payroll_history: [
        "5000", "5000", "5000", "5000", "5000", "5000", "5000", "5000", "5000", "5000",
        "5000", "5000", "0", "0", "0", "0", "0", "0", "0", "0",
        "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
        "0", "0"
      ],
      repayment_ratio: "2",
      loan_amount: "10000",
      jurisdiction_code: "1",
      allowed_jurisdiction_root: "12345",
      jurisdiction_merkle_proof: Array(32).fill("0")
    }
  };

  console.log('Test inputs:', JSON.stringify(inputs, null, 2));
  
  try {
    console.log('Executing circuit...');
    const { witness } = await noir.execute(inputs);
    console.log('Circuit executed successfully!');
    
    console.log('Generating proof...');
    const proof = await backend.generateProof(witness);
    console.log('Proof generated successfully!');
    console.log('Proof length:', proof.proof.length);
    
    await backend.destroy();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

testCircuit().catch(console.error);
