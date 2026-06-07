## ADDED Requirements

### Requirement: Breakdown Concept
The system SHALL allow authenticated users to breakdown a concept into terminology and knowledge points.

#### Scenario: Successful concept breakdown
- **WHEN** authenticated user calls POST /api/v1/concepts/breakdown with concept name
- **THEN** system loads user's prompt template
- **THEN** system calls AI API using provider's api_key
- **AND** returns breakdown result with terminology and knowledge points

#### Scenario: Breakdown with existing terms
- **WHEN** user calls POST /api/v1/concepts/breakdown with existingTerminology
- **THEN** system includes them in prompt to avoid duplicate terms

#### Scenario: Breakdown recursive node
- **WHEN** user calls POST /api/v1/concepts/breakdown with nodePath
- **THEN** system includes tree position in prompt (e.g., "根概念 > 术语1 > 术语2")

#### Scenario: AI request failure
- **WHEN** AI API returns error
- **THEN** system returns 502 error with message "AI service unavailable"

---

### Requirement: Stream Breakdown Response
The system SHALL support streaming response for concept breakdown.

#### Scenario: Stream enabled
- **WHEN** user requests streaming breakdown
- **THEN** system returns Server-Sent Events with chunks

#### Scenario: Stream fallback
- **WHEN** model does not support streaming
- **THEN** system returns complete response as JSON