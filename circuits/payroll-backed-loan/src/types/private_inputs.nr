// @dev - PrivateInput Note struct: Since a visibility issue, the "pub" keyword cannot be applied to this struct. 
// @dev - Visibility issue: https://noir-lang.org/docs/noir/concepts/data_types/structs#visibility )
pub struct PrivateInputs {
    payroll_proof: [Field; 64],
    payroll_amount: u64,
    employment_status: bool,
    hire_date: u32,
    current_date: u32,
    min_payroll_amount: u64,
    min_tenure_months: u32,
    payroll_history: [Field; 32],
    repayment_ratio: u64,
    loan_amount: u64,
    jurisdiction_code: Field,
    allowed_jurisdiction_root: Field,
    jurisdiction_merkle_proof: [Field; 32],
}


    // // PRIVATE - Parameters from zkTLS Proof of payroll
    // payroll_proof: [Field; 64], // @dev - zkTLS Proof of payroll, which is retrieved via Reclaim zkTLS Proof
    // payroll_amount: u64,        // @dev - The amount of employee's (borrower's) payroll, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    // employment_status: bool,    // @dev - The employment status of the borrower, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    // hire_date: u32,             // @dev - The hire date of the borrower, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    // current_date: u32,          // @dev - The current date, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    
    // // PRIVATE - Parameters for loan eligibility
    // min_payroll_amount: u64,        // @dev - The minimum payroll amount required for the loan
    // min_tenure_months: u32,         // @dev - The minimum tenure in months required for the loan
    // payroll_history: [Field; 32],   // @dev - The payroll history of the borrower
    // repayment_ratio: u64,           // @dev - The repayment ratio for the loan
    // loan_amount: u64,               // @dev - The amount of the loan requested

    // // PRIVATE - Parameters for jurisdiction allowlist (OFAC check)
    // jurisdiction_code: Field,   // @dev - The jurisdiction code of the borrower, which will be verifiy the ZK circuit for OFAC check using zkPassport libraries that is intriduced in the SunSpot example repo
    // allowed_jurisdiction_root: Field,
    // jurisdiction_merkle_proof: [Field; 32],