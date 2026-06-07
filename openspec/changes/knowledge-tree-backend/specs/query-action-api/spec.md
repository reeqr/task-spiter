## ADDED Requirements

### Requirement: Query Term Knowledge
The system SHALL allow authenticated users to query term knowledge (explanation).

#### Scenario: Query term explanation
- **WHEN** user calls POST /api/v1/terms/query with action_id="knowledge-explain" and term_name
- **THEN** system loads user's query template for that action
- **AND** calls AI with rendered prompt
- **AND** returns answer text

#### Scenario: Query with term definition
- **WHEN** user calls POST /api/v1/terms/query with term_definition
- **THEN** template includes {{termDefinition}} variable in rendering

#### Scenario: Query with context
- **WHEN** user calls POST /api/v1/terms/query with concept and existing tree data
- **THEN** template includes {{concept}}, {{existingTerminology}} variables

---

### Requirement: Query Exam Angle
The system SHALL allow authenticated users to query exam angles for a term.

#### Scenario: Query exam angle
- **WHEN** user calls POST /api/v1/terms/query with action_id="exam-angle"
- **THEN** system uses exam angle prompt template
- **AND** returns exam angle analysis

---

### Requirement: Query Common Traps
The system SHALL allow authenticated users to query common traps for a term.

#### Scenario: Query common traps
- **WHEN** user calls POST /api/v1/terms/query with action_id="common-traps"
- **THEN** system uses common traps prompt template
- **AND** returns common mistakes analysis

---

### Requirement: Web Search Integration
The system SHALL support web search when querying terms if enabled.

#### Scenario: Web search enabled
- **WHEN** user has web search enabled and queries term
- **THEN** AI request includes search tool invocation
- **AND** response includes source citations

#### Scenario: Web search disabled
- **WHEN** user has web search disabled
- **THEN** AI request proceeds without search tool