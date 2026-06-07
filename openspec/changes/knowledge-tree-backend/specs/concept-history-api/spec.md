## ADDED Requirements

### Requirement: List Concept History
The system SHALL allow authenticated users to list their concept breakdown history.

#### Scenario: List history
- **WHEN** authenticated user calls GET /api/v1/concepts/history
- **THEN** system returns list of concept history items sorted by created_at DESC

#### Scenario: Empty history
- **WHEN** user has no concept history
- **THEN** system returns empty array

#### Scenario: Pagination
- **WHEN** user calls GET /api/v1/concepts/history?page=1&page_size=20
- **THEN** system returns paginated results with total count

---

### Requirement: Get Concept History Detail
The system SHALL allow authenticated users to get detailed breakdown result.

#### Scenario: Get history detail
- **WHEN** user calls GET /api/v1/concepts/history/{history_id}
- **THEN** system returns history item with full breakdown tree (terms + knowledge points)

#### Scenario: History not found
- **WHEN** user calls GET /api/v1/concepts/history/{non_existent_id}
- **THEN** system returns 404 error

---

### Requirement: Delete Concept History
The system SHALL allow authenticated users to delete concept history.

#### Scenario: Delete history
- **WHEN** user deletes history with ID
- **THEN** system deletes history and associated breakdown data
- **AND** returns success

---

### Requirement: Unique Concept Per User
The system SHALL enforce uniqueness of concept name per user.

#### Scenario: Create duplicate concept
- **WHEN** user tries to create concept with same name that already exists
- **THEN** system updates existing record instead of creating duplicate
- **AND** returns existing history_id