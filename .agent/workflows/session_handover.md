---
description: Generates a session handover report including completed tasks, next steps, and initialization instructions.
---

1. **Review Session Status**:
   - Check `git status` to ensure work is saved (or note if it isn't).
   - specific command: `git status`

2. **Summarize Completed Work**:
   - List features implemented in the current session (e.g., Phase 4, 5, 6).
   - Note any major architectural changes (e.g., New Table `Appointment`).

3. **Identify Pending Tasks & Next Steps**:
   - Summarize the immediate goals for the next session (e.g., "Link Appointment to Record", "Staff Assignment").
   - specific command: `grep -r "TODO" src/` (optional, to find code notes)

4. **Document Technical Context**:
   - Note any environment specific requirements (e.g., "Needs `prisma generate`", "Server restart required").
   - Mention any temporary fixes used (e.g., `@ts-ignore`).

5. **Generate Handover Message**:
   - Output a structured Markdown message.
   - **Mandatory**: Include an instruction to read the Initialization Router (`docs/ai-host/INIT_ROUTER_TEAM_HARU.md`).
   - Format usage:
     ```markdown
     # 🔄 Session Handover: [Team Name/Topic]

     ## ✅ Accomplished in this Session
     - [Feature 1]
     - [Feature 2]

     ## 🚧 Next Actions (Phase X)
     - [Task 1]
     - [Task 2]

     ## ⚠️ Technical Notes
     - [Note about DB, Env, or Restarts]

     ## 🚀 Initialization for Next Session
     Please read the following document to resume work:
     `docs/ai-host/INIT_ROUTER_TEAM_HARU.md`
     ```
