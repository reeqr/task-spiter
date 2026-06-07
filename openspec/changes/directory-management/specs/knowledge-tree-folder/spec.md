## ADDED Requirements

### Requirement: Knowledge tree folder assignment
The system SHALL store a folder_id on each knowledge tree (concept_history) to indicate its containing folder. NULL indicates root level.

### Requirement: Create knowledge tree in folder
The system SHALL allow users to create a knowledge tree within a specified folder.

#### Scenario: Create knowledge tree in folder
- **WHEN** user selects folder "Math" and creates a new knowledge tree "Limits"
- **THEN** system creates concept_history with folder_id pointing to "Math"

#### Scenario: Create knowledge tree at root
- **WHEN** user selects no folder and creates a new knowledge tree "Physics Basics"
- **THEN** system creates concept_history with folder_id = NULL

### Requirement: Move knowledge tree to folder
The system SHALL allow users to move a knowledge tree to a different folder via drag-and-drop.

#### Scenario: Move knowledge tree to folder
- **WHEN** user drags knowledge tree "Limits" from "Math" to "Physics"
- **THEN** system updates concept_history.folder_id to point to "Physics"

### Requirement: Sort knowledge trees within folder
The system SHALL allow users to reorder knowledge trees within the same folder level via drag-and-drop sorting.

#### Scenario: Sort knowledge tree order
- **WHEN** user drags knowledge tree "Integration" above "Differentiation" within same folder
- **THEN** system updates sort_order of both knowledge trees to reflect new order

### Requirement: Delete knowledge tree
The system SHALL allow users to delete a knowledge tree, which SHALL cascade delete all its terms and knowledge points.

#### Scenario: Delete knowledge tree
- **WHEN** user right-clicks knowledge tree "Limits" and selects "Delete"
- **THEN** system prompts for confirmation and removes the knowledge tree and all associated data
