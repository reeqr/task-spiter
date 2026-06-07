## ADDED Requirements

### Requirement: List Models
The system SHALL allow authenticated users to list models for a specific provider.

#### Scenario: List provider's models
- **WHEN** user calls GET /api/v1/providers/{provider_id}/models
- **THEN** system returns list of models belonging to that provider

#### Scenario: Provider has no models
- **WHEN** user calls GET /api/v1/providers/{provider_id}/models
- **AND** provider has no models
- **THEN** system returns empty array

---

### Requirement: Add Model
The system SHALL allow authenticated users to add model to a provider.

#### Scenario: Add model with valid config
- **WHEN** user submits model_code, name, display_name for a provider
- **THEN** system creates model record linked to provider
- **AND** returns created model object

#### Scenario: Add model with optional settings
- **WHEN** user submits model with max_tokens, temperature, supports_thinking
- **THEN** system stores all configuration

---

### Requirement: Update Model
The system SHALL allow authenticated users to update model configuration.

#### Scenario: Update model settings
- **WHEN** user updates temperature for a model
- **THEN** system saves new temperature value

---

### Requirement: Delete Model
The system SHALL allow authenticated users to delete model.

#### Scenario: Delete model
- **WHEN** user deletes model with ID
- **THEN** system deletes model record
- **AND** returns success

---

### Requirement: Set Current Model
The system SHALL allow authenticated users to set their current active model.

#### Scenario: Set current model
- **WHEN** user calls PUT /api/v1/models/current/{model_id}
- **THEN** system updates user's current_model_id
- **AND** subsequent AI requests use this model

#### Scenario: Set current model from different provider
- **WHEN** user sets model from provider A while current provider is B
- **THEN** system updates current_model_id to new model
- **AND** next AI request uses new model's provider config