## ADDED Requirements

### Requirement: Get Web Search Config
The system SHALL allow authenticated users to get their web search configuration.

#### Scenario: Get config
- **WHEN** authenticated user calls GET /api/v1/config/web-search
- **THEN** system returns user's web search config
- **AND** includes enabled, search_engine, count, domain filters

#### Scenario: No config exists
- **WHEN** user has no web search config
- **THEN** system returns default config with all defaults

---

### Requirement: Update Web Search Config
The system SHALL allow authenticated users to update their web search configuration.

#### Scenario: Enable web search
- **WHEN** user sets enabled=true
- **THEN** system saves config
- **AND** subsequent AI queries include search tool

#### Scenario: Update search parameters
- **WHEN** user updates count, search_domain_filter, search_recency_filter
- **THEN** system saves all parameters

#### Scenario: Disable web search
- **WHEN** user sets enabled=false
- **THEN** system saves config
- **AND** subsequent AI queries do not use search

---

### Requirement: Web Search Config Options
The system SHALL support configurable web search parameters.

#### Scenario: Configure search count
- **WHEN** user sets count between 1-50
- **THEN** system validates range

#### Scenario: Configure search domain
- **WHEN** user sets domain filter (e.g., wikipedia.org, github.com)
- **THEN** system stores filter string

#### Scenario: Configure recency filter
- **WHEN** user sets recency_filter (noLimit, day, week, month, year)
- **THEN** system stores filter value