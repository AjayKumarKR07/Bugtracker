# INFOSYS SPRINGBOARD VIRTUAL INTERNSHIP
# TECHNICAL PROJECT REPORT: TRACEPILOT
## Milestone 2 (Weeks 3–4): Workflow Automation & Collaboration

---

### Document Control & Metadata
- **Project Title**: TracePilot – Automated Defect Tracking and Resolution Assistance System
- **Milestone Designation**: Milestone 2 (Weeks 3–4) – Workflow Automation & Collaboration
- **Internship Program**: Infosys Springboard Virtual Internship (Batch 3)
- **Primary Technology Stack**:
  - **Backend Architecture**: FastAPI, Python 3.11, SQLAlchemy 2.0 (AsyncIO), PostgreSQL, Pydantic v2, WebSockets
  - **Frontend Architecture**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, Lucide Icons, Plotly.js
  - **Verification Framework**: Pytest 8.x, AsyncIO Test Harness, FastAPI TestClient, Starlette WebSockets
- **Document Scope**: Exhaustive technical documentation of issue prioritization, multi-user collaboration primitives, agile sprint governance, and lifecycle state-machine validations implemented during Milestone 2.
- **System Classification**: Complete collaborative defect tracking and Agile project management platform.

---

## 1. Milestone 2 Overview & System Architecture

**Milestone 2 (Weeks 3–4): Workflow Automation & Collaboration** advances the TracePilot platform from a foundational CRUD defect registry into a complete collaborative defect tracking and Agile project management platform.

While foundational entities (user accounts, projects, basic defect records) were registered in initial iterations, software engineering in team environments requires structured coordination: objective prioritization rather than subjective triage, granular auditability, segregated role permissions, agile sprint iteration grouping, and automated lifecycle state machines. Milestone 2 engineers these exact capabilities.

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                              TRACEPILOT SYSTEM ARCHITECTURE                                           |
|                                                                                                                       |
|   +--------------------------+       +------------------------------+       +-------------------------------------+   |
|   |      USER WORKSPACE      |       |       TESTER WORKSPACE       |       |           ADMIN WORKSPACE           |   |
|   |      Route: /dashboard   |       |   Route: /tester-dashboard   |       |      Route: /admin-dashboard        |   |
|   |  • Report New Defects    |       |  • My Sprints (Assigned)     |       |  • Project Defect Backlog Triage    |   |
|   |  • Track Submitted Issues|       |  • My Assigned Issues Queue  |       |  • Agile Sprint Iteration Authoring |   |
|   |  • Review Resolved Fixes |       |  • Begin Work / Advance State|       |  • Sprint Approval Governance Queue |   |
|   |  • Confirm Close / Reopen|       |  • Submit Sprint for Approval|       |  • User Activation & Role Promotion |   |
|   +------------+-------------+       +--------------+---------------+       +------------------+------------------+   |
|                |                                    |                                          |                      |
|                +------------------------------------+------------------------------------------+                      |
|                                                     |                                                                 |
|                                                     v HTTP REST APIs & Push WebSockets                                |
|   +---------------------------------------------------------------------------------------------------------------+   |
|   |                                         FASTAPI APPLICATION CORE                                              |   |
|   |                                                                                                               |   |
|   |   +------------------------------------+  +---------------------------------+  +--------------------------+   |   |
|   |   |     SMART PRIORITY CALCULATOR      |  |     SMART ASSIGNEE MATCHER      |  |   COLLABORATION ENGINE   |   |   |
|   |   |  Formula: Severity x Cat Urgency   |  |  • Domain Keyword Extraction    |  |  • Threaded Comments     |   |   |
|   |   |  Maps to: URGENT, HIGH, MED, LOW   |  |  • Developer Workload Weighting |  |  • Magic-Byte Attachment |   |   |
|   |   +------------------------------------+  +---------------------------------+  +--------------------------+   |   |
|   |   +------------------------------------+  +---------------------------------+  +--------------------------+   |   |
|   |   |       IMMUTABLE AUDIT ENGINE       |  |      AGILE SPRINT LIFECYCLE     |  |  ASYNCHRONOUS WEBSOCKET  |   |   |
|   |   |  • Point-in-time JSONB Snapshots   |  |  • Planned -> Active -> InProg  |  |  • Route: /ws/notif...   |   |   |
|   |   |  • Actor Attribution, Client IP    |  |  • ReadyForApproval -> Completed|  |  • Push Event Dispatcher |   |   |
|   |   +------------------------------------+  +---------------------------------+  +--------------------------+   |   |
|   +-------------------------------------------------+-------------------------------------------------------------+   |
|                                                     | SQLAlchemy 2.0 AsyncIO ORM                                      |
|                                                     v                                                                 |
|   +---------------------------------------------------------------------------------------------------------------+   |
|   |                                          POSTGRESQL RELATIONAL DATABASE                                       |   |
|   |                                                                                                               |   |
|   |   • users (RBAC credentials)               • projects (Project scope)          • sprints (Agile iterations)   |   |
|   |   • issues (Defect state machine)          • issue_comments (Discussion trail) • issue_attachments (Files)    |   |
|   |   • audit_logs (Immutable activity JSONB)  • notifications (Push event log)                                   |   |
|   +---------------------------------------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------------------------------------+
```

### 1.1. Core Technical Tenets of Milestone 2
1. **Mathematical Defect Prioritization**: Completely eliminated arbitrary priority labeling. Defect priority is computed deterministically using the mentor-specified algorithm: $\text{Priority Score} = \text{Severity Weight} \times \text{Category Urgency Weight}$.
2. **Contextual Team Collaboration**: Defect records serve as active hubs with threaded comment streams, magic-byte validated file uploads (supporting PNG, JPEG, PDF), and immutable audit logs capturing every state change with actor metadata and JSONB before/after state diffs.
3. **Agile Sprint Iteration & Governance**: Sprints group defects into deliverable milestones. Iterations follow a governed review lifecycle requiring explicit tester submission and administrative evaluation, preventing unauthorized self-approval.
4. **Enforced State Machines**: Defects and sprints follow strict, non-bypassable state machines implemented at the service layer, preventing invalid or out-of-order transitions.

### 1.2. Milestone 2 Relational Data Dictionary
To deliver collaborative workflow management and agile governance, the PostgreSQL schema was augmented with specialized entities:

#### Table: `issues` (Lifecycle & Classification Augmentations)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Unique defect surrogate identifier. |
| `key` | `VARCHAR(32)` | No | Unique, Indexed | Human-readable defect ticket key (e.g., `BUG-101`). |
| `title` | `VARCHAR(255)` | No | Non-empty | Summary description of the reported defect. |
| `description` | `TEXT` | Yes | Default: `NULL` | Detailed reproduction steps, environment context, and stack traces. |
| `status` | `VARCHAR(32)` | No | Default: `REPORTED` | Lifecycle enum state (`REPORTED`, `ASSIGNED`, `IN_DEVELOPMENT`, `IN_REVIEW`, `IN_TESTING`, `RESOLVED`, `CLOSED`, `REOPENED`). |
| `severity` | `VARCHAR(32)` | No | Default: `MINOR` | Technical severity enum (`CRITICAL`, `MAJOR`, `MINOR`, `TRIVIAL`). |
| `priority` | `VARCHAR(32)` | No | Default: `MEDIUM` | Operational priority tier (`URGENT`, `HIGH`, `MEDIUM`, `LOW`). |
| `category` | `VARCHAR(64)` | Yes | Default: `NULL` | Architectural category classification (`Security`, `Database`, `API`, `Backend`, `UI`, `Colors`, `Typo`, `Frontend`). |
| `project_id` | `INTEGER` | No | ForeignKey: `projects.id` | Project isolation scope. |
| `reporter_id` | `INTEGER` | No | ForeignKey: `users.id` | User who submitted the defect ticket. |
| `assignee_id` | `INTEGER` | Yes | ForeignKey: `users.id` | QA specialist / tester assigned to investigate and resolve. |
| `sprint_id` | `INTEGER` | Yes | ForeignKey: `sprints.id`, `ON DELETE SET NULL` | Agile iteration binding; `NULL` denotes unallocated backlog items. |
| `resolution_summary` | `TEXT` | Yes | Default: `NULL` | Technical documentation of the fix (mandatory for `RESOLVED` status). |
| `resolved_at` | `TIMESTAMPTZ` | Yes | Default: `NULL` | Timestamp of fix verification. |
| `reopen_count` | `INTEGER` | No | Default: `0` | Cumulative count of times the defect was rejected during verification. |
| `reopen_reason` | `TEXT` | Yes | Default: `NULL` | Mandatory justification entered by reporter when reopening a defect. |
| `source` | `VARCHAR(50)` | No | Default: `MANUAL` | Tag denoting defect origin (`MANUAL` vs `KAGGLE_ISEC`). |

#### Table: `issue_comments` (Threaded Collaboration)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Unique comment identifier. |
| `issue_id` | `INTEGER` | No | ForeignKey: `issues.id`, `ON DELETE CASCADE` | Defect ticket to which this comment belongs. |
| `author_id` | `INTEGER` | No | ForeignKey: `users.id`, `ON DELETE CASCADE` | Author identity extracted strictly from authenticated JWT token. |
| `body` | `TEXT` | No | Non-empty | Markdown-supported discussion content. |
| `created_at` | `TIMESTAMPTZ` | No | `func.now()` | Creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `func.now()` | Last modification timestamp. |

#### Table: `issue_attachments` (Binary Asset Tracking)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Unique attachment record identifier. |
| `issue_id` | `INTEGER` | No | ForeignKey: `issues.id`, `ON DELETE CASCADE` | Target defect binding. |
| `uploader_id` | `INTEGER` | No | ForeignKey: `users.id`, `ON DELETE SET NULL` | Identity of user submitting the binary payload. |
| `original_name` | `VARCHAR(255)` | No | Non-empty | Original filename provided by client. |
| `stored_name` | `VARCHAR(255)` | No | Unique | Sanitized UUID v4 identifier under local server storage. |
| `file_path` | `VARCHAR(512)` | No | Non-empty | Relative filesystem path (`storage/attachments/...`). |
| `mime_type` | `VARCHAR(100)` | No | Validated allowlist | Validated MIME type (`image/png`, `image/jpeg`, `application/pdf`, etc.). |
| `file_size_bytes` | `INTEGER` | No | Cap: $\le 10,485,760$ bytes | Physical byte length verified server-side. |
| `created_at` | `TIMESTAMPTZ` | No | `func.now()` | Upload timestamp. |

#### Table: `audit_logs` (Forensic Activity Trail)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Immutable audit event sequence identifier. |
| `user_id` | `INTEGER` | Yes | ForeignKey: `users.id`, `ON DELETE SET NULL` | Actor initiating the operation; `NULL` for background/system actions. |
| `action` | `VARCHAR(64)` | No | Enum: `AuditAction` | Audited action key (`ISSUE_STATUS_CHANGED`, `SPRINT_APPROVED`, etc.). |
| `entity_type` | `VARCHAR(32)` | No | Indexed | Target entity category (`ISSUE`, `SPRINT`, `PROJECT`, `COMMENT`). |
| `entity_id` | `INTEGER` | No | Indexed | Surrogate identifier of modified entity. |
| `old_values` | `JSONB` | Yes | Default: `NULL` | Point-in-time entity state snapshot prior to mutation. |
| `new_values` | `JSONB` | Yes | Default: `NULL` | Point-in-time entity state snapshot following mutation. |
| `ip_address` | `VARCHAR(45)` | Yes | Default: `NULL` | Client IPv4 or IPv6 network address. |
| `user_agent` | `VARCHAR(255)` | Yes | Default: `NULL` | Client browser / environment identifier string. |
| `created_at` | `TIMESTAMPTZ` | No | `func.now()`, Indexed | Exact UTC timestamp of audit event commit. |

#### Table: `sprints` (Agile Iterations & Capacity)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Unique sprint iteration identifier. |
| `name` | `VARCHAR(200)` | No | Non-empty | Iteration label (e.g., `Sprint 1 - Core Auth & Bugfix`). |
| `goal` | `TEXT` | Yes | Default: `NULL` | Functional objective of the iteration. |
| `goal_status` | `VARCHAR(50)` | No | Default: `NOT_STARTED` | Progress status (`NOT_STARTED`, `IN_PROGRESS`, `MET`, `MISSED`). |
| `start_date` | `TIMESTAMPTZ` | No | Non-null | Scheduled start date. |
| `end_date` | `TIMESTAMPTZ` | No | Non-null | Scheduled completion date ($\ge start\_date$). |
| `status` | `VARCHAR(32)` | No | Default: `PLANNED` | Governed status enum (`PLANNED`, `ACTIVE`, `IN_PROGRESS`, `READY_FOR_APPROVAL`, `COMPLETED`, `ARCHIVED`). |
| `project_id` | `INTEGER` | No | ForeignKey: `projects.id` | Project iteration boundary. |
| `assigned_tester_id`| `INTEGER` | Yes | ForeignKey: `users.id`, `ON DELETE SET NULL` | Dedicated QA specialist responsible for iteration execution. |
| `review_comment` | `TEXT` | Yes | Default: `NULL` | Feedback commentary entered by administrator when requesting changes. |
| `submitted_at` | `TIMESTAMPTZ` | Yes | Default: `NULL` | Timestamp when tester submitted sprint for approval. |
| `reviewed_at` | `TIMESTAMPTZ` | Yes | Default: `NULL` | Timestamp when administrator reviewed and approved/rejected sprint. |

#### Table: `notifications` (Real-Time Push & Alert Logs)
| Column | Type | Nullable | Constraints & Defaults | Technical Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INTEGER` | No | Primary Key, Auto-increment | Unique notification sequence identifier. |
| `user_id` | `INTEGER` | No | ForeignKey: `users.id`, `ON DELETE CASCADE` | Recipient user identity. |
| `notification_type` | `VARCHAR(64)` | No | Enum: `NotificationType` | Notification category (`ISSUE_ASSIGNED`, `SPRINT_APPROVED`, etc.). |
| `title` | `VARCHAR(200)` | No | Non-empty | Alert headline. |
| `message` | `TEXT` | No | Non-empty | Detailed notification payload text. |
| `entity_type` | `VARCHAR(32)` | Yes | Default: `NULL` | Referenced entity category (`ISSUE`, `SPRINT`). |
| `entity_id` | `INTEGER` | Yes | Default: `NULL` | Referenced entity ID for client routing. |
| `is_read` | `BOOLEAN` | No | Default: `FALSE` | Read receipt tracking. |
| `created_at` | `TIMESTAMPTZ` | No | `func.now()` | Dispatch timestamp. |

---

## 2. Milestone 2 Objectives & Requirements Traceability

Milestone 2 addresses the four core mentor requirements specified by the Infosys Springboard program:

```
+----------------------------------------------------------------------------------------------------+
|                                    REQUIREMENT TRACEABILITY MATRIX                                 |
+--------------------------------+-----------------------------------+-------------------------------+
| Mentor Requirement             | Core Deliverables Implemented     | Verifying Test Suites         |
+--------------------------------+-----------------------------------+-------------------------------+
| 1. Implement issue             | • Smart Priority Calculator       | • tests/test_issues.py        |
|    prioritization and          | • Severity & Category Taxonomy    | • tests/test_kaggle_import.py |
|    classification mechanisms   | • Smart Assignee Matcher          | • tests/test_analytics.py     |
+--------------------------------+-----------------------------------+-------------------------------+
| 2. Develop collaboration       | • Threaded Issue Comments         | • tests/test_comments.py      |
|    features (comments,         | • Magic-Byte File Attachments     | • tests/test_attachments.py   |
|    attachments, activity)      | • Immutable Audit Records (JSONB) | • tests/test_audit.py         |
|                                | • Real-Time WebSocket Alerts      | • tests/test_websocket.py     |
+--------------------------------+-----------------------------------+-------------------------------+
| 3. Integrate sprint planning   | • Sprint Authoring & Capacity     | • tests/test_sprint_approval.py
|    and backlog management      | • Backlog Allocation Module       | • tests/test_sprint_persist...|
|    modules                     | • Sprint Approval Governance      | • tests/test_sprint_realti... |
+--------------------------------+-----------------------------------+-------------------------------+
| 4. Validate workflow           | • Issue State Machine Enforcer    | • tests/test_e2e_workflow.py  |
|    transitions and issue       | • Sprint State Machine Enforcer   | • tests/test_users.py         |
|    lifecycle management        | • Role-Based Workspaces (RBAC)    | • tests/test_admin_dashboa... |
+--------------------------------+-----------------------------------+-------------------------------+
```

### Requirement 1: Issue Prioritization and Classification Mechanisms
- Standardized taxonomy for defect classification across severity, priority, issue types, and architectural categories.
- Implemented the exact mentor-specified **Smart Priority Formula** to compute deterministic priority scores.
- Automated developer triage recommendation engines to analyze issue semantics and workload distribution.

### Requirement 2: Develop Collaboration Features
- Threaded discussion comments bound to defect instances with signed JWT user identity resolution.
- Multi-tier file attachment pipeline enforcing strict file size caps, executable blacklisting, and stream magic-byte inspection.
- Immutable audit records protected from modification through the API to capture historical audit events with actor attribution and client metadata.
- Asynchronous WebSocket push gateway delivering immediate notification alerts without polling.

### Requirement 3: Integrate Sprint Planning and Backlog Management Modules
- Dedicated sprint authoring infrastructure with dates, sprint goals, and team capacity calculations.
- Defect backlog views allowing unassigned defects (including imported benchmark datasets) to be triaged into active iterations.
- A formal sprint approval workflow requiring explicit tester submission and administrative evaluation.

### Requirement 4: Validate Workflow Transitions and Issue Lifecycle Management Processes
- Strict backend service-level state machine validators preventing illegal, out-of-order transitions.
- Segregated user interfaces into distinct role-scoped workspaces (`USER`, `TESTER`, `ADMIN`).
- Verified all operational workflows, database mutations, and security boundaries using end-to-end regression test suites.

---

## 3. Implemented Features Deep-Dive

FastAPI routers are mounted directly in `backend/app/main.py`. The table below documents the production routes, payload specifications, and architectural scopes implemented for Milestone 2:

| Endpoint Route | HTTP Verb | Access Control | Request Body / Query Parameters | Response Schema & Architectural Description |
| :--- | :---: | :---: | :--- | :--- |
| `/issues/calculate-priority` | `POST` | Authenticated | `{"severity": str, "category": str}` | Returns `{"priority_score": int, "recommended_priority": str, "formula": str}` evaluating the mentor formula. |
| `/issues/triage-recommendation`| `POST` | Authenticated | `{"title": str, "description": str}` | NLP keyword extractor parsing semantics to recommend severity, category, and priority tier. |
| `/issues/{id}/suggest-assignee`| `GET` | Admin / Tester | Path: `id: int` | Analyzes historical resolution velocity and current active WIP count to return top 3 ranked developers. |
| `/issues/{id}/comments` | `GET` | Authenticated | Path: `id: int`, Query: `limit, offset` | Retrieves chronological threaded discussion items with author profile metadata. |
| `/issues/{id}/comments` | `POST` | Authenticated | `{"body": str}` (Min length: 1) | Appends a comment, registers an `AuditLog` entry, and pushes real-time WebSocket alerts to stakeholders. |
| `/issues/{id}/comments/{cid}` | `DELETE`| Author / Admin | Path: `id: int, cid: int` | Deletes comment if caller is author or system admin (`ON DELETE CASCADE` enforced). |
| `/issues/{id}/attachments` | `POST` | Authenticated | Form: `file: UploadFile` (Multipart) | Validates MIME type, extension, magic bytes, and 10MB limit; saves to UUID storage; creates DB record. |
| `/attachments/{id}/download` | `GET` | Authenticated | Path: `id: int` | Serves file stream with `Content-Disposition: attachment; filename="{orig_name}"` header. |
| `/attachments/{id}` | `DELETE`| Uploader/Admin | Path: `id: int` | Unlinks disk file and deletes PostgreSQL metadata record. |
| `/activity` | `GET` | Authenticated | Query: `entity_type, entity_id, limit` | Returns forensic audit history containing before/after JSONB state snapshots. |
| `/notifications` | `GET` | Authenticated | Query: `unread_only: bool, limit: int` | Returns user notification queue with direct entity navigation metadata. |
| `/notifications/{id}/read` | `PATCH`| Authenticated | Path: `id: int` | Marks notification as read, updating badge count across client headers. |
| `/ws/notifications/{user_id}`| `WS` | Authenticated | Path: `user_id: int`, Query: `token={jwt}`| WebSocket push channel dispatching real-time notifications directly to active client sessions. |
| `/sprints` | `POST` | Admin Only | `{"name": str, "goal": str, ...}` | Authors new agile iteration in `PLANNED` state with capacity modeling. |
| `/sprints/project/{project_id}`| `GET` | Authenticated | Path: `project_id: int` | Returns all sprint cycles with defect metrics, velocity, and completion percentages. |
| `/sprints/{id}/issues` | `PATCH`| Admin Only | `{"issue_ids": list[int]}` | Allocates unassigned backlog defects into the target sprint iteration. |
| `/sprints/{id}/assign-tester`| `POST` | Admin Only | `{"tester_id": int}` | Binds dedicated QA specialist; transitions sprint status from `PLANNED` to `ACTIVE`. |
| `/sprints/{id}/begin-work` | `POST` | Assigned Tester| Path: `id: int` | Tester confirms assignment; transitions sprint status from `ACTIVE` to `IN_PROGRESS`. |
| `/sprints/{id}/submit-approval`| `POST`| Assigned Tester| Path: `id: int` | Submits completed test cycle; transitions sprint status to `READY_FOR_APPROVAL`. |
| `/sprints/{id}/approve` | `POST` | Admin Only | Path: `id: int` | Management evaluation sign-off; transitions sprint to final `COMPLETED` state. |
| `/sprints/{id}/request-changes`| `POST` | Admin Only | `{"review_comment": str}` (Min: 5) | Rejects submission; transitions sprint back to `IN_PROGRESS` with feedback commentary. |
| `/issues/{id}/status` | `PATCH`| Tester / Admin | `{"status": str}` | Advances issue through development pipeline (`IN_DEVELOPMENT`, `IN_REVIEW`, `IN_TESTING`). |
| `/issues/{id}/resolve` | `PATCH`| Tester / Admin | `{"resolution_summary": str}` (Min: 10)| Marks defect as resolved with technical remediation documentation; transitions to `RESOLVED`. |
| `/issues/{id}/close` | `PATCH`| User / Admin | Path: `id: int` | Original reporter confirms fix; transitions defect to terminal `CLOSED` state. |
| `/issues/{id}/reopen` | `PATCH`| User / Admin | `{"reason": str}` (Min: 5) | Reporter rejects fix with justification; transitions defect to `REOPENED` (returns to active queue). |

---

## 4. Issue Prioritization & Classification Engine

A recurring challenge in defect tracking is subjective triage: reporters frequently categorize non-critical discrepancies as urgent, leading to engineer alert fatigue. Milestone 2 eliminates subjective triage by implementing a mathematical prioritization engine backed by standardized database enums.

```
+-------------------------------------------------------------------------------------------------------+
|                                    THE SMART PRIORITY ENGINE WORKFLOW                                 |
|                                                                                                       |
|    +------------------------------------+             +-------------------------------------------+   |
|    |      SEVERITY WEIGHT (1 to 4)      |             |     CATEGORY URGENCY WEIGHT (1 to 3)      |   |
|    |                                    |             |                                           |   |
|    |   • CRITICAL = 4                   |             |   • High Urgency (Weight = 3):            |   |
|    |   • MAJOR    = 3                   |             |       Security, Database                  |   |
|    |   • MINOR    = 2                   |             |   • Medium Urgency (Weight = 2):          |   |
|    |   • TRIVIAL  = 1                   |             |       API, Backend                        |   |
|    |                                    |             |   • Low Urgency (Weight = 1):             |   |
|    |                                    |             |       UI, Colors, Typo, Frontend          |   |
|    +-----------------+------------------+             +---------------------+---------------------+   |
|                      |                                                      |                         |
|                      +--------------------------+---------------------------+                         |
|                                                 |                                                     |
|                                                 v Multiplied at Evaluation Time                       |
|                               +-----------------------------------+                                   |
|                               |   PRIORITY SCORE = SEV x CAT      |                                   |
|                               |      (Continuous Range: 1 - 12)   |                                   |
|                               +-----------------+-----------------+                                   |
|                                                 |                                                     |
|                 +-------------------------------+-------------------------------+                     |
|                 |                               |                               |                     |
|                 v                               v                               v                     |
|         Score >= 10                         Score 7 to 9                    Score 4 to 6              |
|        +-------------+                     +-------------+                 +-------------+            |
|        |   URGENT    |                     |    HIGH     |                 |   MEDIUM    |            |
|        +-------------+                     +-------------+                 +-------------+            |
|                                                                                 |                     |
|                                                                                 v Score < 4           |
|                                                                            +-------------+            |
|                                                                            |     LOW     |            |
|                                                                            +-------------+            |
+-------------------------------------------------------------------------------------------------------+
```

### 4.1. Mathematical Formula Formalization
Implemented in `backend/app/services/smart_service.py`, the engine evaluates defect priority using the exact formula:

$$\text{Priority Score} = \text{Severity Weight} \times \text{Category Urgency Weight}$$

### 4.2. Supported Severity Levels
Severity represents the objective technical impact of the failure on system execution, defined in `backend/app/models/issue.py` as `Severity`:

| Severity Enum | Weight | Technical Criteria | Typical Manifestation | Remediation Strategy |
| :--- | :---: | :--- | :--- | :--- |
| `CRITICAL` | **4** | Catastrophic failure causing crash, data corruption, or total system compromise. | Database deadlock, thread pool starvation, authentication bypass. | Immediate hotfix; triage interruption. |
| `MAJOR` | **3** | Core business logic breakdown without complete crash; primary user workflow blocked. | Inability to compute financial balances, broken CSV export routine. | Scheduled for immediate sprint inclusion. |
| `MINOR` | **2** | Non-critical functionality defect with an available operational workaround. | Secondary search filter failing, edge-case table sorting bug. | Scheduled in standard backlog queue. |
| `TRIVIAL` | **1** | Cosmetic, typographical, or visual alignment inconsistency. | Label misspelling, button padding misalignment. | Addressed during routine maintenance. |

### 4.3. Technical Category Urgency Multipliers
Categories represent the architectural subsystem impacted by the defect (`backend/app/services/smart_service.py`):

| Urgency Multiplier | Classification | Supported Categories | Architectural Rationale |
| :---: | :--- | :--- | :--- |
| **3** | **High Urgency** | `Security`, `Database` | Directly threatens data confidentiality, system integrity, or ACID persistence guarantees. |
| **2** | **Medium Urgency** | `API`, `Backend` | Impacts middleware, background tasks, or server integration endpoints. |
| **1** | **Low Urgency** | `UI`, `Colors`, `Typo`, `Frontend` | Presentation-layer discrepancies without risk to data storage or core business logic. |

### 4.4. Complete Priority Truth Matrix
The multiplication of 4 severity levels against 3 category urgency weights yields 16 distinct combinations, mapped into 4 operational priority bands:

| Combination # | Selected Severity | Severity Weight | Architectural Category | Category Weight | Computed Score | Operational Priority Tier | Target Remediation SLA |
| :---: | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | `CRITICAL` | 4 | `Security` | 3 | **12** | `URGENT` | Immediate hotfix / $\le 4$ hours |
| **2** | `CRITICAL` | 4 | `Database` | 3 | **12** | `URGENT` | Immediate hotfix / $\le 4$ hours |
| **3** | `CRITICAL` | 4 | `API` | 2 | **8** | `HIGH` | Remediate in active sprint / $\le 24$ hours |
| **4** | `CRITICAL` | 4 | `Backend` | 2 | **8** | `HIGH` | Remediate in active sprint / $\le 24$ hours |
| **5** | `CRITICAL` | 4 | `UI` | 1 | **4** | `MEDIUM` | Remediate in upcoming sprint |
| **6** | `CRITICAL` | 4 | `Frontend` | 1 | **4** | `MEDIUM` | Remediate in upcoming sprint |
| **7** | `MAJOR` | 3 | `Security` | 3 | **9** | `HIGH` | Remediate in active sprint / $\le 24$ hours |
| **8** | `MAJOR` | 3 | `Database` | 3 | **9** | `HIGH` | Remediate in active sprint / $\le 24$ hours |
| **9** | `MAJOR` | 3 | `API` | 2 | **6** | `MEDIUM` | Remediate in upcoming sprint |
| **10** | `MAJOR` | 3 | `Backend` | 2 | **6** | `MEDIUM` | Remediate in upcoming sprint |
| **11** | `MAJOR` | 3 | `UI` | 1 | **3** | `LOW` | Address during technical debt cycles |
| **12** | `MINOR` | 2 | `Security` | 3 | **6** | `MEDIUM` | Remediate in upcoming sprint |
| **13** | `MINOR` | 2 | `API` | 2 | **4** | `MEDIUM` | Remediate in upcoming sprint |
| **14** | `MINOR` | 2 | `UI` | 1 | **2** | `LOW` | Address during technical debt cycles |
| **15** | `TRIVIAL` | 1 | `Backend` | 2 | **2** | `LOW` | Address during technical debt cycles |
| **16** | `TRIVIAL` | 1 | `Typo` | 1 | **1** | `LOW` | Address during technical debt cycles |

### 4.5. Smart Developer Assignee Recommendation Engine
Located at `GET /issues/{id}/suggest-assignee`, this service analyzes the text of a defect and matches it against development team members:
1. **Keyword Extraction**: Parses title and description using regex tokenizers to extract domain competencies (`auth`, `database`, `api`, `ui`, `frontend`, `query`).
2. **Historical Competency Analysis**: Evaluates previously resolved defect records in PostgreSQL to determine developer domain specializations.
3. **Workload Balancing**: Evaluates developers currently carrying open `ASSIGNED` or `IN_DEVELOPMENT` defects. Developers with high work-in-progress (WIP) counts receive score penalties to prevent team bottlenecks.
4. **Ranked Output**: Returns the top three candidate assignees with match percentages and explicit rationales.

```python
# Production Code Implementation (backend/app/services/smart_service.py)
_SEVERITY_WEIGHTS: dict[str, int] = {
    "CRITICAL": 4,
    "MAJOR":    3,
    "MINOR":    2,
    "TRIVIAL":  1,
}

_CATEGORY_WEIGHTS: dict[str, int] = {
    "security":  3,
    "database":  3,
    "api":       2,
    "backend":   2,
    "ui":        1,
    "colors":    1,
    "colour":    1,
    "typo":      1,
    "typos":     1,
    "frontend":  1,
}

def calculate_priority(request: PriorityCalcRequest) -> PriorityCalcResponse:
    severity_key = request.severity.strip().upper()
    severity_weight = _SEVERITY_WEIGHTS.get(severity_key, 2)

    category_urgency_weight, resolved_category = _resolve_category_weight(request.category)
    priority_score = severity_weight * category_urgency_weight

    if priority_score >= 10:
        recommended_priority = "URGENT"
    elif priority_score >= 7:
        recommended_priority = "HIGH"
    elif priority_score >= 4:
        recommended_priority = "MEDIUM"
    else:
        recommended_priority = "LOW"

    return PriorityCalcResponse(
        severity=request.severity,
        category=resolved_category,
        severity_weight=severity_weight,
        category_urgency_weight=category_urgency_weight,
        priority_score=priority_score,
        recommended_priority=recommended_priority,
        formula=f"Priority Score = severity_weight ({severity_weight}) x category_urgency_weight ({category_urgency_weight}) = {priority_score}",
    )
```

---

## 5. Defect Reporting & Complete Issue Lifecycle Management

Milestone 2 formalizes the complete defect management lifecycle: defects are reported by end users, triaged and assigned by administrators, remediated by testers, and validated by the original user before terminal closure.

```
+-------------------------------------------------------------------------------------------------------+
|                                    DEFECT ISSUE LIFECYCLE WORKFLOW                                    |
|                                                                                                       |
|         END USER                          ADMINISTRATOR                          QA TESTER            |
|            │                                    │                                    │                |
|     [ Report Defect ]                           │                                    │                |
|     (POST /issues)                              │                                    │                |
|            │                                    │                                    │                |
|            v                                    │                                    │                |
|      [ REPORTED ]                               │                                    │                |
|            │                                    │                                    │                |
|            │                              [ Triage & Assign ]                        │                |
|            │                              (PATCH .../assign)                         │                |
|            │                                    │                                    │                |
|            │                                    v                                    │                |
|            │                               [ ASSIGNED ]                              │                |
|            │                                    │                                    │                |
|            │                                    │                              [ Begin Work ]         |
|            │                                    │                              (PATCH .../status)     |
|            │                                    │                                    │                |
|            │                                    │                                    v                |
|            │                                    │                           [ IN_DEVELOPMENT ]        |
|            │                                    │                                    │                |
|            │                                    │                              [ Peer Review ]        |
|            │                                    │                              (PATCH .../status)     |
|            │                                    │                                    │                |
|            │                                    │                                    v                |
|            │                                    │                             [ IN_REVIEW ]           |
|            │                                    │                                    │                |
|            │                                    │                              [ Verification ]       |
|            │                                    │                              (PATCH .../status)     |
|            │                                    │                                    │                |
|            │                                    │                                    v                |
|            │                                    │                             [ IN_TESTING ]          |
|            │                                    │                                    │                |
|            │                                    │                            [ Mark Resolved ]        |
|            │                                    │                            (PATCH .../resolve)      |
|            │                                    │                                    │                |
|            │                                    v                                    v                |
|            │◄──────────────────────────── [ RESOLVED ] ◄─────────────────────────────┘                |
|            │                                                                                          |
|            +────────────────────────────────────+                                                     |
|            |                                    |                                                     |
|            v                                    v                                                     |
|    [ Confirm Fix ]                      [ Reopen Defect ]                                             |
|    (PATCH .../close)                    (PATCH .../reopen + mandatory reason)                         |
|            |                                    |                                                     |
|            v                                    v                                                     |
|        [ CLOSED ]                          [ REOPENED ] ──► Returns to active queue                   |
+-------------------------------------------------------------------------------------------------------+
```

### 5.1. Defect Reporting Workflow & Invariants
Users report defects through the `/dashboard` interface via the dedicated **Create Defect** modal. The form incorporates client-side validation for title, description, technical severity, and architectural category, immediately executing priority calculations.

### 5.2. State Machine Transition Rules
Defined in `backend/app/models/issue.py` (`DEVELOPER_TRANSITIONS`) and enforced in `backend/app/services/issue_service.py`:

| Sequence | Initial State | Permitted Role | Target State | Service Validation Criteria |
| :---: | :--- | :--- | :--- | :--- |
| **1** | *(None)* | USER | `REPORTED` | `reporter_id` assigned from JWT; `assignee_id` set to `NULL`. |
| **2** | `REPORTED` | ADMIN | `ASSIGNED` | Target user must hold `TESTER` or `DEVELOPER` role. |
| **3** | `ASSIGNED` | TESTER | `IN_DEVELOPMENT` | Requester must be the assigned user. |
| **4** | `IN_DEVELOPMENT` | TESTER | `IN_REVIEW` | Functional fix complete; documentation and peer review pending. |
| **5** | `IN_REVIEW` | TESTER | `IN_TESTING` | Deployed to verification environment for test execution. |
| **6** | `IN_TESTING` | TESTER | `RESOLVED` | Requires non-empty `resolution_summary` ($\ge 10$ characters). |
| **7a**| `RESOLVED` | USER | `CLOSED` | Original reporter confirms resolution; final state. |
| **7b**| `RESOLVED` | USER / ADMIN | `REOPENED` | **Requires non-empty reopen justification.** Clears resolution and returns issue to active queue. |

---

## 6. Collaboration Subsystem: Comments, Attachments & Audit Logging

Effective defect remediation requires collaborative tools co-located with defect records. Milestone 2 introduces four core collaborative primitives: threaded discussions, secure file attachments, immutable audit logging, and real-time WebSocket push notifications.

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                              COLLABORATION ARCHITECTURE                                               |
|                                                                                                                       |
|   +-----------------------------+  +-------------------------------+  +-------------------------------------------+   |
|   |      THREADED COMMENTS      |  |      SECURE ATTACHMENTS       |  |          IMMUTABLE AUDIT LOGGING          |   |
|   |  • Author: JWT resolved     |  |  • 10 MB payload limit        |  |  • Actions: AuditAction enum              |   |
|   |  • Cascade deletion         |  |  • Magic-byte validation      |  |  • JSONB Old/New State Snapshots          |   |
|   |  • Audit record created     |  |  • Blocked executables        |  |  • Actor ID, IP & User-Agent capture      |   |
|   |  • Real-time notification   |  |  • UUID filesystem storage    |  |  • Protected: No update/delete APIs       |   |
|   +--------------+--------------+  +---------------+---------------+  +---------------------+---------------------+   |
|                  |                                 |                                        |                         |
|                  +---------------------------------+----------------------------------------+                         |
|                                                    |                                                                  |
|                                                    v Handled within Database Transactions                             |
|                                  +------------------------------------+                                               |
|                                  |   POSTGRESQL DATA PERSISTENCE      |                                               |
|                                  |   (issue_comments, attachments)    |                                               |
|                                  +------------------------------------+                                               |
+-----------------------------------------------------------------------------------------------------------------------+
```

### 6.1. Threaded Issue Comments
- **Database Model**: `backend/app/models/issue_comment.py` (`IssueComment`)
- **Key Columns**: `id`, `issue_id` (ForeignKey to `issues.id`), `author_id` (ForeignKey to `users.id`), `body` (Text), `created_at`, `updated_at`.
- **Integrity & Security**:
  - `author_id` is extracted directly from the verified JWT bearer token, preventing user impersonation.
  - Foreign key constraint `ON DELETE CASCADE` ensures clean deletion when a parent issue is removed.
  - Creating a comment registers an `AuditLog` entry and issues real-time notification alerts to the issue reporter and assignee.

### 6.2. Secure Binary Attachment Architecture
- **Database Model**: `backend/app/models/issue_attachment.py` (`IssueAttachment`)
- **Storage Subsystem**: Files are stored in a dedicated server directory (`storage/attachments`), with metadata tracked in PostgreSQL.
- **Multi-Tiered Security Validation**:
  1. **Payload Limit**: Enforces a strict 10 MB limit (`HTTP 413 Content Too Large`).
  2. **Extension Blacklisting**: Blocks executable extensions regardless of declared MIME type (`.exe`, `.bat`, `.cmd`, `.sh`, `.bin`, `.dll`, `.vbs`, `.js`, `.msi`).
  3. **Magic-Byte Header Verification**: Inspects leading stream bytes to verify file identity:
     - `image/png`: `\x89PNG\r\n\x1a\n`
     - `image/jpeg`: `\xff\xd8\xff`
     - `application/pdf`: `%PDF`
  4. **Filesystem Isolation**: Converts filenames into random UUID v4 identifiers, preventing path traversal attacks (`../../etc/passwd`).

### 6.3. Immutable Audit Tracking Engine
- **Database Model**: `backend/app/models/audit_log.py` (`AuditLog`)
- **Audit Action Enumeration (`AuditAction`)**: Tracks lifecycle milestones (`ISSUE_CREATED`, `ISSUE_UPDATED`, `ISSUE_ASSIGNED`, `ISSUE_STATUS_CHANGED`, `ISSUE_RESOLVED`, `ISSUE_REOPENED`, `SPRINT_CREATED`, `SPRINT_STARTED`, `SPRINT_SUBMITTED_FOR_APPROVAL`, `SPRINT_APPROVED`, `SPRINT_CHANGES_REQUESTED`, `COMMENT_CREATED`, `ATTACHMENT_UPLOADED`).
- **Forensic State Capture**:
  - `old_values`: PostgreSQL `JSONB` structure recording the entity state prior to mutation.
  - `new_values`: PostgreSQL `JSONB` structure recording the entity state following mutation.
  - Network metadata: Records client IPv4/IPv6 address and HTTP `User-Agent`.
  - **API Protection**: The backend exposes no `PUT`, `PATCH`, or `DELETE` endpoints for audit logs, preserving audit record immutability.

---

## 7. Sprint Planning & Backlog Management Modules

Milestone 2 integrates Agile iteration planning to bundle individual defect fixes into manageable delivery cycles.

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                           AGILE SPRINT PLANNING ARCHITECTURE                                          |
|                                                                                                                       |
|   +---------------------------------------------------------------------------------------------------------------+   |
|   |                                               PROJECT BACKLOG                                                 |   |
|   |                                                                                                               |   |
|   |   • Kaggle ISEC Benchmark Defect Dataset (source = "KAGGLE_ISEC", sprint_id = NULL)                           |   |
|   |   • Newly Reported User Defects (status = "REPORTED", sprint_id = NULL)                                       |   |
|   +-------------------------------------------------------+-------------------------------------------------------+   |
|                                                           |                                                           |
|                                                           | Triage & Batch Allocation (PATCH /sprints/{id}/issues)    |
|                                                           v                                                           |
|   +---------------------------------------------------------------------------------------------------------------+   |
|   |                                            ACTIVE SPRINT ITERATION                                            |   |
|   |                                                                                                               |   |
|   |   • Iteration Metadata: Name, Date Range, Goal Description                                                    |   |
|   |   • Capacity Formula: Team Members x Working Days x Hours/Day = Available Hours                               |   |
|   |   • Assigned QA Specialist: Direct user binding (assigned_tester_id)                                          |   |
|   +---------------------------------------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------------------------------------+
```

### 7.1. Sprint Model & Capacity Planning
Managed via `backend/app/models/sprint.py` (`Sprint`):
- **Attributes**: `id`, `name`, `goal`, `start_date`, `end_date`, `status`, `project_id`, `assigned_tester_id`.
- **Capacity Formula**: Evaluates team bandwidth to prevent sprint over-commitment:

$$\text{Total Available Hours} = \text{Estimated Team Members} \times \text{Working Days} \times \text{Hours Per Day}$$

![Figure 1: Admin – Sprint Creation & Capacity Planning](imagesmilestone2/create%20new%20sprints.png)

**Figure 1 – Admin – Sprint Creation & Capacity Planning**  
*Admin Sprint Creation modal showing project selection, sprint naming, sprint goal, and agile capacity calculation inputs (team size: 3 members, duration: 10 working days, effort: 6 hrs/day).*

### 7.2. Backlog Defect Allocation & Sprint Console
- Unassigned defects are identified where `sprint_id IS NULL`.
- Benchmark defect datasets (e.g., imported Kaggle ISEC defects tagged `source="KAGGLE_ISEC"`) remain in the backlog by default.
- Administrators select backlog defects and assign them to sprints using `PATCH /sprints/{id}/issues`.

![Figure 2: Admin – Sprints & Planning Console](imagesmilestone2/Sprints%20and%20planning.png)

**Figure 2 – Admin – Sprints & Planning Console**  
*Admin Sprints & Planning workspace (`/admin/sprints`) displaying active sprint cards, project filtering, 6-step planning workflow indicator, backlog defect allocation controls, and assigned QA tester status.*

---

## 8. Sprint Approval Governance & State Machine Specification

To maintain release quality, testers cannot approve their own work, and administrators cannot bypass verification stages:

```
+-------------------------------------------------------------------------------------------------------+
|                                SPRINT APPROVAL SEQUENCE & GOVERNANCE                                  |
|                                                                                                       |
|    ADMINISTRATOR                         QA TESTER                             FASTAPI BACKEND        |
|          │                                   │                                        │               |
|          ├─ 1. POST /sprints ────────────────┼───────────────────────────────────────►│ (PLANNED)     |
|          │                                   │                                        │               |
|          ├─ 2. POST .../assign-tester ───────┼───────────────────────────────────────►│ (ACTIVE)      |
|          │                                   │◄── WebSocket Push: Sprint Assigned ────┤               |
|          │                                   │                                        │               |
|          │                                   ├─ 3. POST .../begin-work ──────────────►│ (IN_PROGRESS) |
|          │◄── WebSocket Push: Work Begun ────┼────────────────────────────────────────┤               |
|          │                                   │                                        │               |
|          │                                   │ [QA executes defect verification]      │               |
|          │                                   │                                        │               |
|          │                                   ├─ 4. POST .../submit-approval ─────────►│ (READY_FOR_APP)
|          │◄── WebSocket Push: Submitted ─────┼────────────────────────────────────────┤               |
|          │                                   │                                        │               |
|          │ [Evaluates in Approval Queue]     │                                        │               |
|          │                                   │                                        │               |
|          ├── Alternative A: Approve ─────────┼───────────────────────────────────────►│ (COMPLETED)   |
|          │                                   │◄── WebSocket Push: Sprint Approved ────┤               |
|          │                                   │                                        │               |
|          └── Alternative B: Request Changes ─┼───────────────────────────────────────►│ (IN_PROGRESS) |
|                                              │◄── WebSocket: Changes Requested ───────┤ (With review  |
|                                              │    (Tester addresses & resubmits)      │  comment)     |
+-------------------------------------------------------------------------------------------------------+
```

### 8.1. Step-by-Step Governance Flow
1. **Sprint Creation (`POST /sprints`)**: Initializes iteration in `PLANNED` state.
2. **Tester Assignment (`POST /sprints/{id}/assign-tester`)**: Assigns tester and updates status to `ACTIVE`.
3. **Begin Work (`POST /sprints/{id}/begin-work`)**: Tester acknowledges assignment, transitioning status to `IN_PROGRESS`. Direct submission from `ACTIVE` without beginning work is blocked (`HTTP 400 Bad Request`).
4. **Submit for Approval (`POST /sprints/{id}/submit-approval`)**: Tester finishes defect verification and submits the sprint, transitioning status to `READY_FOR_APPROVAL`.
5. **Managerial Review**:
   - **Approval (`POST /sprints/{id}/approve`)**: Admin signs off; status transitions to `COMPLETED`.
   - **Request Changes (`POST /sprints/{id}/request-changes`)**: Admin identifies omissions and returns sprint to `IN_PROGRESS` with a `review_comment`. The tester addresses feedback and resubmits.

![Figure 3: Admin – Sprint Approval Queue](imagesmilestone2/Sprints%20approvals.png)

**Figure 3 – Admin – Sprint Approval Queue**  
*Admin Sprint Approval Gateway (`/admin/sprint-approvals`) displaying pending sprint review queue (`READY_FOR_APPROVAL`), Action Required status badges, Approve Sprint action, and Request Changes workflow.*

### 8.2. Sprint State Machine Invariants
1. **Assignment Boundary**: Only administrators can transition a sprint from `PLANNED` to `ACTIVE` by binding a tester.
2. **Execution Boundary**: Only the assigned tester can advance a sprint from `ACTIVE` to `IN_PROGRESS` via `POST /sprints/{id}/begin-work`.
3. **Submission Boundary**: Moving to `READY_FOR_APPROVAL` requires that the sprint be in `IN_PROGRESS`. Direct transitions from `ACTIVE` are rejected (`HTTP 400`).
4. **Approval Boundary**: Testers are forbidden from self-approving sprints (`HTTP 403 Forbidden`). Only administrators may trigger `POST /sprints/{id}/approve` or `POST /sprints/{id}/request-changes`.

---

## 9. Role Responsibilities & Access Control (RBAC) Architecture

The platform enforces strict role separation across four distinct user roles, implemented via FastAPI's `require_role` dependency injection:

```
+-------------------------------------------------------------------------------------------------------+
|                                       ROLE AUTHORIZATION MATRIX                                       |
+----------------------------------------+---------+-----------+---------------+------------------------+
| Operational Capability                 |  USER   |  TESTER   |  DEVELOPER    |         ADMIN          |
+----------------------------------------+---------+-----------+---------------+------------------------+
| Create / Report Defects                |   Yes   |    Yes    |      Yes      |          Yes           |
| View Own Reported Defects              |   Yes   |    Yes    |      Yes      |          Yes           |
| Confirm Resolution (Close)             |   Yes   |     No    |       No      |          Yes           |
| Reopen Resolved Defect (with reason)   |   Yes   |    Yes*   |       No      |          Yes           |
| Update Assigned Defect Status          |    No   |    Yes    |      Yes      |           No           |
| Submit Defect Resolution Summary       |    No   |    Yes    |      Yes      |           No           |
| Access Tester Workspaces & Sprints     |    No   |    Yes    |      Yes      |           No           |
| Execute Sprint "Begin Work"           |    No   |    Yes    |      Yes      |           No           |
| Submit Sprint for Approval             |    No   |    Yes    |      Yes      |           No           |
| Create Projects and Sprints            |    No   |     No    |       No      |          Yes           |
| Assign Testers to Sprints/Defects      |    No   |     No    |       No      |          Yes           |
| Approve or Request Sprint Changes      |    No   |     No    |       No      |          Yes           |
| Manage User Accounts & Roles           |    No   |     No    |       No      |          Yes           |
| Access System-Wide Analytics           |    No   |     No    |       No      |          Yes           |
+----------------------------------------+---------+-----------+---------------+------------------------+
* Testers may reopen defects assigned to or originally reported by them.
```

### 9.1. Role Workspace Segregation
1. **USER (Defect Reporter / Client End-User)**:
   - Operates on `/dashboard` and `/issues`.
   - Action Required panel shows resolved issues awaiting confirmation.
   - Confirmation transitions issue to `CLOSED`; reopen requires mandatory reason.
2. **TESTER (Quality Assurance Specialist)**:
   - Operates within `/tester-dashboard`, `/tester-sprints`, and `/tester-issues`.
   - Two primary work streams: **My Sprints** and **My Assigned Issues**.
   - Directly executes lifecycle transitions (`IN_DEVELOPMENT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `IN_TESTING` $\rightarrow$ `RESOLVED`).
3. **ADMIN (Project & Quality Manager)**:
   - System-wide visibility on `/admin-dashboard`, `/admin/sprints`, and `/admin/sprint-approvals`.
   - Oversees sprint approvals and user account management.

![Figure 4: Tester – My Sprints Dashboard](imagesmilestone2/Tester%20Sprints.png)

**Figure 4 – Tester – My Sprints Dashboard**  
*Tester Sprints workspace (`/tester-sprints`) for user `ram (TESTER)`, tracking assigned sprint cycles, status counters (Total Assigned: 8, Active: 2, In Progress: 1, Awaiting Approval: 3, Completed: 2), and sprint submission status.*

---

## 10. Real-Time Notifications, Quality Analytics & Automated Verification

Milestone 2 pairs asynchronous push notification delivery with quality analytics and comprehensive automated test validation.

### 10.1. Real-Time Push Gateway & WebSocket Architecture
- **WebSocket Endpoint**: `/ws/notifications/{user_id}?token={jwt}`
- **Connection Management**:
  - `ConnectionManager` authenticates incoming WebSocket connections via JWT query tokens.
  - Inactive user accounts are rejected immediately (`Code 4003 Forbidden`).
  - Connections are registered in an in-memory connection registry indexed by `user_id`.
- **Push Broadcasting Pipeline**:
  1. Service actions register notifications via FastAPI `BackgroundTasks`.
  2. The background worker writes a persistent row to the `notifications` table.
  3. The active WebSocket channel transmits a JSON payload to the user:

```json
{
  "type": "notification",
  "data": {
    "id": 104,
    "notification_type": "ISSUE_ASSIGNED",
    "title": "Defect Assigned",
    "message": "You have been assigned to defect BUG-204.",
    "entity_type": "ISSUE",
    "entity_id": 204,
    "entity_key": "BUG-204",
    "created_at": "2026-09-08T18:30:00Z"
  }
}
```

### 10.2. Agile Sprint Velocity & Performance Analytics
The analytics subsystem calculates defect resolution velocity, status distribution shares, and iteration completion percentages.

![Figure 5: Admin – Agile Sprint Velocity & Defect Status Report](imagesmilestone2/Report%20of%20Sprints.png)

**Figure 5 – Admin – Agile Sprint Velocity & Defect Status Report**  
*Agile Sprint Execution & Velocity Performance Report for administrator (`raj`), detailing iteration timeline, status (`COMPLETED`), sprint health (`ON TRACK`), key metrics, and resolution breakdown.*

![Figure 6: Tester – Agile Sprint Execution & Capacity Report](imagesmilestone2/Report%20of%20Tester%20Sprint.png)

**Figure 6 – Tester – Agile Sprint Execution & Capacity Report**  
*Agile Sprint Execution & Capacity Report for tester (`ram`), showing `READY_FOR_APPROVAL` status, planned team capacity (400 hrs), sprint goal tracking, and defect status distribution.*

### 10.3. Backend Automated Test Results
- **Framework**: Pytest 8.x with `pytest-asyncio`
- **Execution Command**: `python -m pytest -v`
- **Total Test Count**: **413 Passed**, 11 Skipped, 0 Failed (Execution Duration: 36.66s)

```
================================== TEST RESULTS ==================================
tests/test_admin_dashboard.py ........                                  [  2%]
tests/test_analytics.py .........................                       [  8%]
tests/test_attachments.py .......................                       [ 14%]
tests/test_audit.py ............................................        [ 25%]
tests/test_auth.py .................................................    [ 37%]
tests/test_comments.py ........................                         [ 43%]
tests/test_database.py .................                                [ 47%]
tests/test_e2e_workflow.py .                                            [ 47%]
tests/test_health.py ......                                             [ 49%]
tests/test_issues.py .................................................  [ 61%]
tests/test_kaggle_import.py .....................                       [ 66%]
tests/test_notification_navigation.py ............                      [ 69%]
tests/test_notifications.py ............................                [ 76%]
tests/test_projects.py ..........................                       [ 82%]
tests/test_sprint_approval.py ....................                      [ 87%]
tests/test_sprint_persistence.py .                                      [ 87%]
tests/test_sprint_realtime.py ..                                        [ 88%]
tests/test_users.py ..................................................   [100%]
tests/test_websocket.py .....                                           [100%]
================ 413 passed, 11 skipped, 3 warnings in 36.66s =================
```

### 10.4. Key Integration Test Suites
1. **End-to-End Issue Lifecycle (`tests/test_e2e_workflow.py`)**:
   - Executes full flow: User reports bug $\rightarrow$ Admin assigns tester $\rightarrow$ Tester advances status to `RESOLVED` $\rightarrow$ User confirms to `CLOSED` $\rightarrow$ User reopens with justification.
   - Verifies raw PostgreSQL state using an independent database session and validates `AuditLog` history.
2. **Sprint Approval Governance (`tests/test_sprint_approval.py`)**:
   - Asserts `HTTP 403 Forbidden` on unauthorized self-approval attempts by testers.
   - Asserts `HTTP 400 Bad Request` on invalid state progressions.
   - Validates rework cycles: `request-changes` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ resubmit $\rightarrow$ approve $\rightarrow$ `COMPLETED`.
3. **Database Durability Verification (`tests/test_sprint_persistence.py`)**:
   - Executes raw SQL queries against PostgreSQL to confirm physical row commits and constraint integrity.
4. **WebSocket Delivery (`tests/test_sprint_realtime.py`)**:
   - Connects live test client to `/ws/notifications` and confirms delivery of push notification events.

### 10.5. Frontend Build Verification
- **Framework**: Vite 5.4 + TypeScript 5.5 Compiler (`tsc -b && vite build`)
- **Compilation Result**: **0 Errors**, 2,936 modules transformed cleanly in 20.46s.

---

## 11. Milestone 2 Deliverables & Outcome Matrix

The technical deliverables completed in Milestone 2 satisfy all four mentor requirements:

1. **Issue Prioritization & Classification Mechanisms**:
   - **Satisfied**: Implemented mathematical formula scoring ($\text{Severity} \times \text{Category}$) with four priority bands (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), supplemented by automated triage developer recommendation.

2. **Collaboration Features (Comments, Attachments, Activity Tracking)**:
   - **Satisfied**: Delivered threaded comments with JWT author attribution, magic-byte validated file attachments with executable blacklisting, immutable audit records capturing JSONB state diffs, and real-time WebSocket push notifications.

3. **Sprint Planning & Backlog Management Modules**:
   - **Satisfied**: Implemented sprint authoring, capacity planning, backlog defect triage, and a governed sprint review and approval workflow.

4. **Validation of Workflow Transitions & Lifecycle Processes**:
   - **Satisfied**: Formalized defect and sprint state machines enforced through backend route dependencies, validated by **413 automated backend tests** and verified through physical PostgreSQL persistence tests.

---

## 12. Architectural Conclusions & Future Roadmap

Milestone 2 establishes TracePilot as a complete collaborative defect tracking and Agile project management platform. By implementing role-governed workflows—enabling users to report and verify, testers to investigate and resolve, and administrators to orchestrate and approve—the application eliminates ambiguity across defect management cycles. The integration of algorithmic prioritization, immutable audit trails, secure file management, and real-time WebSocket messaging ensures transparency, accountability, and operational predictability across the software development lifecycle.

---

## Screenshot Checklist

| Figure | Screenshot / Artifact | Milestone | File Path |
|---|---|---|---|
| Figure 1 | Admin – Sprint Creation & Capacity Planning | Milestone 2 | `imagesmilestone2/create new sprints.png` |
| Figure 2 | Admin – Sprints & Planning Console | Milestone 2 | `imagesmilestone2/Sprints and planning.png` |
| Figure 3 | Admin – Sprint Approval Queue | Milestone 2 | `imagesmilestone2/Sprints approvals.png` |
| Figure 4 | Tester – My Sprints Dashboard | Milestone 2 | `imagesmilestone2/Tester Sprints.png` |
| Figure 5 | Admin – Agile Sprint Velocity & Defect Status Report | Milestone 2 | `imagesmilestone2/Report of Sprints.png` |
| Figure 6 | Tester – Agile Sprint Execution & Capacity Report | Milestone 2 | `imagesmilestone2/Report of Tester Sprint.png` |

---

<br/>

---

# [SINGLE-PAGE SUMMARY / PPT SLIDE VERSION]

```
====================================================================================================
               INFOSYS SPRINGBOARD VIRTUAL INTERNSHIP | TRACEPILOT
                 Milestone 2 (Weeks 3–4) – Workflow Automation & Collaboration
====================================================================================================

1. KEY OBJECTIVES
   • Implement formulaic issue prioritization and multi-dimensional defect classification.
   • Build secure collaboration features: threaded comments, attachments, and audit tracking.
   • Deliver agile sprint planning, backlog triage, and capacity estimation modules.
   • Formulate and validate rigid, role-governed defect and sprint lifecycle state machines.

2. MAJOR IMPLEMENTED CAPABILITIES
   • Smart Priority Engine: Priority Score = Severity (1–4) × Category Urgency (1–3) [URGENT/HIGH/MED/LOW].
   • Secure Attachments: 10MB limit, magic-byte inspection (PNG/JPG/PDF), executable blocking, UUID storage.
   • Immutable Audit Trail: PostgreSQL JSONB diff snapshots capturing actor, IP, timestamp, and actions.
   • Real-Time Push Gateway: Asynchronous WebSocket broadcast (/ws/notifications) with zero polling.
   • Agile Sprint Governance: Sprint authoring, capacity planning, and bi-directional approval pipeline.
   • Role Separation: Tailored workspaces for USER (/dashboard), TESTER (/tester-dashboard), and ADMIN.

3. ISSUE LIFECYCLE WORKFLOW
   USER (Report) ──► [REPORTED]
                          │
   ADMIN (Triage) ──► [ASSIGNED] ── (Tester bound, Realtime Push)
                          │
   TESTER (Work)  ──► [IN_DEVELOPMENT] ──► [IN_REVIEW] ──► [IN_TESTING] ──► [RESOLVED]
                          │                                                    │
   USER (Verify)  ◄───────┴────────────────────────────────────────────────────┘
                          ├──► Confirm Fix  ────────► [CLOSED]
                          └──► Reopen (Mandatory) ──► [REOPENED] (Returns to active queue)

4. SPRINT APPROVAL LIFECYCLE WORKFLOW
   ADMIN Creates   ──► [PLANNED]
   ADMIN Assigns   ──► [ACTIVE]        ──► Tester Notified in Real-Time
   TESTER Starts   ──► [IN_PROGRESS]   ──► Admin Notified; Active testing commences
   TESTER Submits  ──► [READY_FOR_APPROVAL] ──► Enters Admin Approval Queue
   ADMIN Decision  ──► ┌─► Approve ────────► [COMPLETED] (Locked & Archived)
                       └─► Request Changes ─► [IN_PROGRESS] (With review feedback comment)

5. VERIFICATION & TEST RESULTS
   • Backend Pytest Suite : 413 PASSED, 11 skipped, 0 failed (36.66s execution).
   • Frontend Production  : TypeScript & Vite build successful (0 errors, 2936 modules transformed).
   • Data Integrity       : Direct raw PostgreSQL transaction inspection confirms durable persistence.
====================================================================================================
```
