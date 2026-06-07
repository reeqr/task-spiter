## ADDED Requirements

### Requirement: List Tasks
The system SHALL allow authenticated users to list their tasks.

#### Scenario: List all tasks
- **WHEN** authenticated user calls GET /api/v1/tasks
- **THEN** system returns all tasks for user (flat list with parent_id)

#### Scenario: Filter completed tasks
- **WHEN** user calls GET /api/v1/tasks?completed=true
- **THEN** system returns only completed tasks

#### Scenario: Filter incomplete tasks
- **WHEN** user calls GET /api/v1/tasks?completed=false
- **THEN** system returns only incomplete tasks

---

### Requirement: Create Task
The system SHALL allow authenticated users to create new task.

#### Scenario: Create root task
- **WHEN** user submits task title (no parent_id)
- **THEN** system creates task with parent_id=null
- **AND** returns created task

#### Scenario: Create subtask
- **WHEN** user submits task title with parent_id
- **THEN** system creates subtask linked to parent
- **AND** parent task's subtasks array updated

---

### Requirement: Update Task
The system SHALL allow authenticated users to update task properties.

#### Scenario: Update title
- **WHEN** user updates task title
- **THEN** system saves new title

#### Scenario: Update description
- **WHEN** user updates task description
- **THEN** system saves new description

#### Scenario: Update spicy level
- **WHEN** user updates task spicy_level (1-5)
- **THEN** system saves new spicy level

---

### Requirement: Delete Task
The system SHALL allow authenticated users to delete task and its subtasks.

#### Scenario: Delete task with subtasks
- **WHEN** user deletes task that has subtasks
- **THEN** system deletes task and all descendant subtasks (cascading)

---

### Requirement: Toggle Task Completion
The system SHALL allow authenticated users to toggle task completion status.

#### Scenario: Mark task complete
- **WHEN** user calls PUT /api/v1/tasks/{task_id}/toggle
- **THEN** system toggles completed from false to true

#### Scenario: Mark task incomplete
- **WHEN** user calls PUT /api/v1/tasks/{task_id}/toggle again
- **THEN** system toggles completed from true to false

---

### Requirement: AI Breakdown Task
The system SHALL allow authenticated users to use AI to breakdown task into subtasks.

#### Scenario: AI breakdown task
- **WHEN** user calls POST /api/v1/tasks/breakdown with task_id
- **THEN** system calls AI to generate subtasks
- **AND** creates subtask records for user
- **AND** returns created subtasks