## ADDED Requirements

### Requirement: Breakdown Term
The system SHALL allow authenticated users to recursively breakdown a term.

#### Scenario: Breakdown existing term
- **WHEN** user calls POST /api/v1/terms/{term_id}/breakdown
- **THEN** system retrieves term info and existing tree context
- **AND** calls AI to breakdown the term
- **AND** returns new child terms and knowledge points

#### Scenario: Term breakdown merges to existing
- **WHEN** user breakdowns a term that already has children
- **THEN** new breakdown results merge into existing children
- **AND** tree structure maintained

---

### Requirement: Track Tree Path
The system SHALL maintain tree path for each term node.

#### Scenario: Path maintained on breakdown
- **WHEN** term at path "高等数学 > 极限" is broken down
- **THEN** child terms get path "高等数学 > 极限 > {child_name}"
- **AND** path stored in database for tree navigation