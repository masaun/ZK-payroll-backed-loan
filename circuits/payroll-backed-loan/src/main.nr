//mod tests;
use std::hash::pedersen_hash;


/**
 * @notice - ZK circuit in Noir for the Payroll-Backed Loan
 * @dev - zkTLS Proof of payroll + publicInputs (amount of payroll), which is retrieved via Reclaim zkTLS, may be stored into here - To create a merkle tree.
 */
fn main(
    // PUBLIC
    nullifier: pub Field,

    // PRIVATE
    payroll_proof: [Field; 64], // @dev - zkTLS Proof of payroll, which is retrieved via Reclaim zkTLS Proof
    payroll_amount: Field,      // @dev - The amount of payroll, which is retrieved via Reclaim zkTLS Proof and provided to here as privateInput
    jurisdiction_code: Field,
    allowed_jurisdiction_root: Field,
    jurisdiction_merkle_proof: [Field; 32],
) {
    
    // 5. Prevent double factoring (= @dev - Merkle Tree of nuillifiers may be needed + The Merkle Root of nullifiers should be stored into on-chain and passed as public input of this ZK circuit)
    let expected_nullifier = pedersen_hash(
        [
            jurisdiction_code,
            allowed_jurisdiction_root,
        ]
    );
    assert(nullifier != expected_nullifier);
}

