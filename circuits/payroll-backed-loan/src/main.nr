//mod tests;
use std::hash::pedersen_hash;

/**
 * @notice - ZK circuit in Noir for the Payroll-Backed Loan
 * @dev - zkTLS Proof of payroll + publicInputs (amount of payroll), which is retrieved via Reclaim zkTLS, may be stored into here - To create a merkle tree.
 * @dev - The jurisdiction of the borrower, which will be verifiy the ZK circuit for OFAC check using zkPassport libraries that is intriduced in the SunSpot example repo
 */
fn main(
    // PUBLIC
    nullifier: pub Field,

    // PRIVATE - Parameters from zkTLS Proof of payroll
    payroll_proof: [Field; 64], // @dev - zkTLS Proof of payroll, which is retrieved via Reclaim zkTLS Proof
    payroll_amount: u64,        // @dev - The amount of payroll, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    employment_status: bool,    // @dev - The employment status of the borrower, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    hire_date: u32,             // @dev - The hire date of the borrower, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    current_date: u32,          // @dev - The current date, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    
    // PRIVATE - Parameters for loan eligibility
    min_payroll_amount: u64,        // @dev - The minimum payroll amount required for the loan
    min_tenure_months: u32,         // @dev - The minimum tenure in months required for the loan
    payroll_history: [Field; 32],   // @dev - The payroll history of the borrower
    salary: u64,                    // @dev - The salary of the borrower
    repayment_ratio: u64,           // @dev - The repayment ratio for the loan
    loan_amount: u64,               // @dev - The amount of the loan requested

    // PRIVATE - Parameters for jurisdiction allowlist (OFAC check)
    jurisdiction_code: Field,   // @dev - The jurisdiction code of the borrower, which will be verifiy the ZK circuit for OFAC check using zkPassport libraries that is intriduced in the SunSpot example repo
    allowed_jurisdiction_root: Field,
    jurisdiction_merkle_proof: [Field; 32],
) {
    // 1. Employment must be active
    assert(employment_status == true);

    // 2. Payroll/Salary threshold
    assert(payroll_amount >= min_payroll_amount);

    // 3. Tenure requirement
    let tenure_months = unsafe { months_between(hire_date, current_date) };
    assert(tenure_months >= min_tenure_months);

    // 4. Payroll continuity
    let min_tenure_u32 = min_tenure_months;
    for i in 0..min_tenure_u32 {
        assert(payroll_history[i] as u32 > 0);
    }

    // 5. Loan affordability
    let max_allowed = salary * repayment_ratio;
    assert(loan_amount <= max_allowed);

    // 6. Optional employer whitelist
    //assert(merkle_verify(employer_id, employer_root));

    // 7. Prevent double factoring (= @dev - Merkle Tree of nuillifiers may be needed + The Merkle Root of nullifiers should be stored into on-chain and passed as public input of this ZK circuit)
    let expected_nullifier = pedersen_hash(
        [
            jurisdiction_code,
            allowed_jurisdiction_root,
        ]
    );
    assert(nullifier != expected_nullifier);
}


unconstrained fn months_between(start_date: u32, end_date: u32) -> u32 {
    // @dev - Placeholder function to calculate the number of months between two dates
    // In a real implementation, this would involve date arithmetic
    (end_date - start_date) / 30 // Assuming each month has 30 days for simplicity
}