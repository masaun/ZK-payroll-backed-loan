use dep::poseidon::poseidon::bn254::hash_2 as poseidon_hash;


// ============================================================================
// Hash Functions
// ============================================================================

/// Poseidon hash of two Field elements (Circom-compatible, used for merkle tree nodes)
pub fn poseidon_hash_2(left: Field, right: Field) -> Field {
    poseidon_hash([left, right])
}