mod types;
mod libs;
mod tests;

use types::{
    public_inputs::{PublicInputs},
    public_outputs::{PublicOutputs},
    //private_inputs::{PrivateInputs}
};


//use std::hash::pedersen_hash;
//use dep::poseidon::poseidon::bn254::hash_2 as poseidon_hash;
use libs::{
    poseidon::poseidon_hash::poseidon_hash_2,
    payroll::months_calculator::months_between
};

// @dev - PrivateInput Note struct: Since a visibility issue, the "pub" keyword cannot be applied to this struct. 
// @dev - Visibility issue: https://noir-lang.org/docs/noir/concepts/data_types/structs#visibility )
struct PrivateInputs {
    payroll_proof: [Field; 64],
    payroll_amount: u64,
    employment_status: bool,
    hire_date: u32,
    current_date: u32,
    min_payroll_amount: u64,
    //min_tenure_months: u32,
    payroll_history: [Field; 32],
    repayment_ratio: u64,
    loan_amount: u64,
    jurisdiction_code: Field,
    allowed_jurisdiction_root: Field,
    jurisdiction_merkle_proof: [Field; 32],
}

global MIN_TENURE_MONTHS: u32 = 12; // @dev - Minimum tenure in months (12 months)

/**
 * @notice - ZK circuit in Noir for the Payroll-Backed Loan
 * @dev - zkTLS Proof of payroll + publicInputs (amount of payroll), which is retrieved via Reclaim zkTLS, may be stored into here - To create a merkle tree.
 * @dev - The jurisdiction of the borrower, which will be verifiy the ZK circuit for OFAC check using zkPassport libraries that is intriduced in the SunSpot example repo
 */
fn main(
    public_inputs: PublicInputs,   // @dev - Public Inputs
    private_inputs: PrivateInputs  // @dev - Private Inputs
) -> pub PublicOutputs {
    // @dev - PUBLIC INPUTS
    let nullifier = public_inputs.nullifier;

    // @dev - PRIVATE INPUTS - Parameters from zkTLS Proof of payroll
    let payroll_proof = private_inputs.payroll_proof;
    let payroll_amount = private_inputs.payroll_amount;
    let employment_status = private_inputs.employment_status;
    let hire_date = private_inputs.hire_date;
    let current_date = private_inputs.current_date;

    // @dev - PRIVATE INPUTS - Parameters for loan eligibility
    let min_payroll_amount = private_inputs.min_payroll_amount;
    //let min_tenure_months = private_inputs.min_tenure_months;
    let payroll_history = private_inputs.payroll_history;
    let repayment_ratio = private_inputs.repayment_ratio;
    let loan_amount = private_inputs.loan_amount;
    let jurisdiction_code = private_inputs.jurisdiction_code;
    let allowed_jurisdiction_root = private_inputs.allowed_jurisdiction_root;
    let jurisdiction_merkle_proof = private_inputs.jurisdiction_merkle_proof;

    // @dev - OTHERS (Besides Public/Private Inputs)
    let min_tenure_months = MIN_TENURE_MONTHS;

    //------------ ZK Circuit Logic for Payroll-Backed Loan Eligibility ------------//

    // 1. Employment must be active
    assert(employment_status == true);

    // 2. Payroll/Salary threshold
    assert(payroll_amount >= min_payroll_amount);

    // 3. Tenure requirement
    // Safety: months_between is now a constrained function
    let tenure_months = months_between(hire_date, current_date);
    assert(tenure_months >= min_tenure_months);

    // 4. Payroll continuity
    let min_tenure_u32 = min_tenure_months;
    for i in 0..min_tenure_u32 {
        assert(payroll_history[i] as u32 > 0);
    }

    // 5. Loan affordability
    let max_allowed = payroll_amount * repayment_ratio;
    assert(loan_amount <= max_allowed);

    // 6. Optional employer whitelist
    //assert(merkle_verify(employer_id, employer_root));

    // 7. Prevent double factoring (= @dev - Merkle Tree of nuillifiers may be needed + The Merkle Root of nullifiers should be stored into on-chain and passed as public input of this ZK circuit)
    let expected_nullifier = poseidon_hash_2(
        jurisdiction_code,
        allowed_jurisdiction_root
    );
    assert(nullifier == expected_nullifier);

    // @dev - Return values
    let public_outputs = PublicOutputs {
        nullifier: nullifier,
        // loan_approved: true,
        // max_loan_amount: max_allowed,
    };

    public_outputs
}
