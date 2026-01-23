use crate::{
    main, 
    types, 
    PrivateInputs,
    libs 
};
use types::{
    public_inputs::{PublicInputs},
    public_outputs::{PublicOutputs},
    //private_inputs::{PrivateInputs}
};
use libs::{
    poseidon::poseidon_hash::poseidon_hash_2,
    payroll::months_calculator::months_between
};

#[test]
fn test_payroll_backed_loan() {
    // [Test scenario]:
    //
    // - Payroll: $5,000/month
    // - Loan request: $10,000
    // - Employment: Active for 12 months
    // - Minimum requirements: $3,000/month salary, 12 months tenure
    // - Repayment ratio: 2x (can borrow up to 2x monthly salary)
    // - Payroll history: 12 months of consistent $5,000 payments
    // 
    //
    // [The test values satisfy all the constraints in the main circuit]:
    //
    // - Employment is active
    // - Payroll ($5,000) >= min required ($3,000)
    // - Tenure (12 months) >= min required (12 months)
    // - Payroll history shows consistent payments
    // - Loan amount ($10,000) <= max allowed ($5,000 * 2)

    // PRIVATE - Parameters for jurisdiction allowlist (OFAC check)
    let jurisdiction_code: Field = 1;                      // @dev - Example jurisdiction code (e.g., USA)
    let allowed_jurisdiction_root: Field = 12345;          // @dev - Merkle root of allowed jurisdictions
    let jurisdiction_merkle_proof: [Field; 32] = [0; 32];  // @dev - Merkle proof for jurisdiction verification

    // PUBLIC
    let nullifier: Field = poseidon_hash_2(
        jurisdiction_code,
        allowed_jurisdiction_root
    );

    // PRIVATE - Parameters from zkTLS Proof of payroll
    let payroll_proof: [Field; 64] = [0; 64];   // @dev - zkTLS Proof of payroll, which is retrieved via Reclaim zkTLS Proof
    let payroll_amount: u64 = 5000;             // @dev - The amount of employee's (borrower's) payroll ($5000/month)
    let employment_status: bool = true;         // @dev - The employment status of the borrower (active)
    let hire_date: u32 = 20000;                 // @dev - The hire date of the borrower (timestamp in days)
    let current_date: u32 = 20360;              // @dev - The current date (timestamp in days, ~12 months later)
    
    // PRIVATE - Parameters for loan eligibility
    let min_payroll_amount: u64 = 3000;              // @dev - The minimum payroll amount required ($3000/month)
    let min_tenure_months: u32 = 12;                 // @dev - The minimum tenure in months required (12 months)
    let mut payroll_history: [Field; 32] = [0; 32];  // @dev - The payroll history of the borrower

    // Fill first 12 months with payroll amounts
    for i in 0..12 {
        payroll_history[i] = 5000;
    }
    let repayment_ratio: u64 = 2;  // @dev - The repayment ratio for the loan (can borrow up to 2x monthly salary)
    let loan_amount: u64 = 10000;  // @dev - The amount of the loan requested ($10,000)

    // @dev - Create PublicInputs and PrivateInputs structs
    let public_inputs = PublicInputs {
        nullifier
    };

    let private_inputs = PrivateInputs {
        payroll_proof,
        payroll_amount,
        employment_status,
        hire_date,
        current_date,
        min_payroll_amount,
        min_tenure_months,
        payroll_history,
        repayment_ratio,
        loan_amount,
        jurisdiction_code,
        allowed_jurisdiction_root,
        jurisdiction_merkle_proof,
    };

    // @dev - Run the main circuit
    let _public_outputs = main(
        public_inputs,
        private_inputs,
    );

    // @dev - Verify outputs
    assert(public_inputs.nullifier == _public_outputs.nullifier);
}