## ADDED Requirements

### Requirement: List Query Actions
The system SHALL allow authenticated users to list their query action configurations.

#### Scenario: List user's actions
- **WHEN** authenticated user calls GET /api/v1/config/actions
- **THEN** system returns user's custom actions combined with system default actions
- **AND** each action includes enabled flag

#### Scenario: Get system defaults
- **WHEN** user has no custom actions
- **THEN** system returns system default actions (knowledge-explain, exam-angle, common-traps)

---

### Requirement: Create Custom Action
The system SHALL allow authenticated users to create custom query action button.

#### Scenario: Create custom action
- **WHEN** user submits label, query_template, followup_template
- **THEN** system creates action with is_system=false
- **AND** returns created action

#### Scenario: Create action with sort order
- **WHEN** user specifies sort_order for new action
- **THEN** system stores the sort order

---

### Requirement: Update Custom Action
The system SHALL allow authenticated users to update their custom actions.

#### Scenario: Update action template
- **WHEN** user updates query_template for custom action
- **THEN** system saves new template

#### Scenario: Toggle action enabled
- **WHEN** user sets enabled=false for action
- **THEN** action hidden in UI but not deleted

---

### Requirement: Delete Custom Action
The system SHALL allow authenticated users to delete custom (non-system) actions.

#### Scenario: Delete custom action
- **WHEN** user deletes action with is_system=false
- **THEN** system deletes action record

#### Scenario: Cannot delete system action
- **WHEN** user tries to delete action with is_system=true
- **THEN** system returns 400 error "Cannot delete system action"

---

### Requirement: Reorder Actions
The system SHALL allow authenticated users to reorder query action buttons.

#### Scenario: Reorder actions
- **WHEN** user updates sort_order for multiple actions
- **THEN** system persists new order
- **AND** UI displays actions in new order

---

### Requirement: System Default Actions
The system SHALL provide three default query actions.

#### Scenario: Default actions exist
- **WHEN** new user is created
- **THEN** system creates default actions: knowledge-explain (解释), exam-angle (出题角度), common-traps (易错点)
- **AND** all have is_system=true and enabled=true