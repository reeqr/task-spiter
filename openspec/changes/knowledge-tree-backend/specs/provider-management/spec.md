## ADDED Requirements

### Requirement: List Providers
The system SHALL allow authenticated users to list their AI providers.

#### Scenario: List user's providers
- **WHEN** authenticated user calls GET /api/v1/providers
- **THEN** system returns list of user's providers (without API keys)

#### Scenario: Empty provider list
- **WHEN** user has no providers configured
- **THEN** system returns empty array

---

### Requirement: Add Provider
The system SHALL allow authenticated users to add new AI provider configuration.

#### Scenario: Add provider with valid config
- **WHEN** user submits provider name, type, base_url, and api_key
- **THEN** system creates provider record with encrypted api_key
- **AND** returns provider object (without api_key)

#### Scenario: Add duplicate provider type
- **WHEN** user adds provider with same type (e.g., two zhipu accounts)
- **THEN** system allows multiple providers of same type

---

### Requirement: Update Provider
The system SHALL allow authenticated users to update provider configuration.

#### Scenario: Update API key
- **WHEN** user updates api_key for existing provider
- **THEN** system encrypts and stores new api_key

#### Scenario: Update provider name
- **WHEN** user updates display name for provider
- **THEN** system saves new name

---

### Requirement: Delete Provider
The system SHALL allow authenticated users to delete provider configuration.

#### Scenario: Delete provider
- **WHEN** user deletes provider with ID
- **THEN** system deletes provider and associated models
- **AND** returns success

#### Scenario: Delete non-existent provider
- **WHEN** user tries to delete provider that doesn't exist
- **THEN** system returns 404 error

---

### Requirement: Predefined Providers
The system SHALL provide predefined provider templates for common AI services.

#### Scenario: Get predefined providers
- **WHEN** user calls GET /api/v1/config/predefined
- **THEN** system returns list of predefined providers (zhipu, openai, anthropic, deepseek, aihubmix, minimax)
- **AND** each includes base_url template and required fields