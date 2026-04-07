---
name: openspec-sync-specs
description: Sync delta specs from a change to main specs. Use when synchronizing specification changes from delta specs in changes/ directory to the main specs/ directory.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Sync delta specs from a change to main specs.

**Input**: Change name (required). Optionally include delta spec analysis summary if available.

**Steps**

1. **Locate delta specs**

   Check for delta specs at `openspec/changes/<name>/specs/`.

   If no delta specs exist, report: "No delta specs found for change <name>" and exit.

2. **Analyze delta specs**

   For each delta spec directory:
   - Read the spec.md file
   - Identify the capability name (directory name)
   - Determine if this is a new spec, modification to existing, or other operation

3. **Check main specs status**

   For each delta spec:
   - Check if corresponding main spec exists at `openspec/specs/<capability>/spec.md`
   - If exists: Read current content to prepare for merge
   - If not exists: Note this will be a new spec addition

4. **Perform the sync**

   For each delta spec:

   **If main spec doesn't exist (new capability):**
   ```bash
   mkdir -p openspec/specs/<capability>
   cp openspec/changes/<name>/specs/<capability>/spec.md openspec/specs/<capability>/spec.md
   ```

   **If main spec exists (update existing):**
   - Open both files (delta and main)
   - Merge delta content into main spec following OpenSpec merge conventions:
     - Append new requirements not in main spec
     - Update modified requirements to reflect delta spec state
     - Preserve existing requirements that aren't modified
   - Write merged content to main spec

5. **Verification**

   After syncing all delta specs:
   - Count total specs synced
   - Verify each target file exists
   - Report sync summary

6. **Display results**

   Show detailed summary including:
   - Change name
   - Total delta specs processed
   - New specs added (with names)
   - Existing specs updated (with names)
   - Files created/modified

**Output On Success**

```
## Delta Specs Synced

**Change:** <change-name>
**Delta specs processed:** N

### New Specs Added (N)
- <capability-1>
- <capability-2>
...

### Existing Specs Updated (N)
- <capability-3>: Updated with delta changes
- <capability-4>: Updated with delta changes
...

All delta specs successfully synced to main specs.
```

**Output When No Delta Specs**

```
## No Delta Specs Found

**Change:** <change-name>

No delta specs directory found at openspec/changes/<name>/specs/

Nothing to sync.
```

**Guardrails**
- Always verify delta specs directory exists before proceeding
- Never overwrite main specs without reading current content first
- Follow OpenSpec merge conventions for updating existing specs
- Create directory structure if it doesn't exist
- Report clear summary of what was synced
- Handle errors gracefully (e.g., read errors, write failures)
- Don't proceed if delta spec files are malformed or empty
