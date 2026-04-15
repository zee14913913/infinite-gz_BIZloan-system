// ─────────────────────────────────────────────────────────────────────────────
// Policy config domain model placeholders.
// Full definitions will be implemented in Phase 3 (Matching Engine).
// The matching engine references these types but must not depend on their
// internals until the config layer is fully specified and seeded.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GlobalEngineDefaults {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BankPolicyConfig {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProductPolicyConfig {}
