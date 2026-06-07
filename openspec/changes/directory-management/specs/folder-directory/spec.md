## ADDED Requirements

### Requirement: Folder tree structure
The system SHALL support hierarchical folder structure with unlimited nesting depth through parent_id self-reference.

### Requirement: Create folder
The system SHALL allow users to create a folder under a specified parent folder or at root level.

#### Scenario: Create folder at root level
- **WHEN** user selects no parent folder and creates a new folder with name "Mathematics"
- **THEN** system creates a folder with parent_id = NULL and name = "Mathematics"

#### Scenario: Create folder under parent
- **WHEN** user selects folder "Mathematics" and creates a subfolder with name "Calculus"
- **THEN** system creates a folder with parent_id pointing to "Mathematics" folder

### Requirement: Rename folder
The system SHALL allow users to rename an existing folder.

#### Scenario: Rename folder
- **WHEN** user right-clicks folder "Mathematics" and selects "Rename", then enters "Math"
- **THEN** system updates folder name to "Math"

### Requirement: Delete folder
The system SHALL allow users to delete a folder and all its contents (subfolders and knowledge trees) with confirmation.

#### Scenario: Delete empty folder
- **WHEN** user right-clicks empty folder "Temp" and selects "Delete"
- **THEN** system prompts for confirmation and removes the folder

#### Scenario: Delete folder with children
- **WHEN** user right-clicks folder "Math" containing subfolder "Calculus" and knowledge tree "Limits"
- **THEN** system prompts for confirmation and cascades deletion to all children

### Requirement: Move folder
The system SHALL allow users to move a folder to a different parent folder via drag-and-drop.

#### Scenario: Move folder to different parent
- **WHEN** user drags folder "Calculus" from "Math" to "Physics"
- **THEN** system updates "Calculus" parent_id to point to "Physics"

### Requirement: Sort folders
The system SHALL allow users to reorder folders within the same parent level via drag-and-drop sorting.

#### Scenario: Sort folder order
- **WHEN** user drags folder "Algebra" above folder "Calculus" within same parent
- **THEN** system updates sort_order of both folders to reflect new order

### Requirement: List folder tree
The system SHALL provide an API to retrieve the full folder tree structure for a user, including nested subfolders and knowledge trees at each level.

#### Scenario: Get folder tree
- **WHEN** user requests folder tree
- **THEN** system returns nested JSON with folders, subfolders, and knowledge trees at each level
