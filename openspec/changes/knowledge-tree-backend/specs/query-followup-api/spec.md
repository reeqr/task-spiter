## ADDED Requirements

### Requirement: Followup Question
The system SHALL allow authenticated users to ask followup questions in query dialog.

#### Scenario: Submit followup
- **WHEN** user calls POST /api/v1/concepts/query/followup with followup_question
- **THEN** system loads conversation history
- **AND** calls AI with followup template including {{chatHistory}} variable
- **AND** returns answer

#### Scenario: Multi-turn conversation
- **WHEN** user asks 3rd followup question
- **THEN** system maintains previous 2 Q&A in chatHistory
- **AND** sends all context to AI

---

### Requirement: Conversation History Storage
The system SHALL store query conversation history for followup continuity.

#### Scenario: Store conversation
- **WHEN** user completes a query session
- **THEN** system stores Q&A pairs in session context

#### Scenario: Conversation expires
- **WHEN** user starts new concept query after 30 minutes of inactivity
- **THEN** previous conversation context cleared
- **AND** new query starts fresh