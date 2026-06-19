Product Requirements Document: Client Companion + Daily Brief
Current Situation
Today: Advisors at AAG/ASG manage 20–100+ clients each across insurance, succession, and wealth. Client knowledge lives in advisors' heads, scattered emails, ad-hoc notes, and spreadsheets — there is no single, shared client memory. Meeting prep is manual and inconsistent. Sensitive family and financial details (e.g. an estranged heir, an undisclosed asset) are easy to mishandle. Nothing proactively flags who needs attention, so clients quietly go cold and renewals, claim updates, and life-event moments get missed.
The book of business runs on attentive service and referrals — advisors cannot advertise. Consistent client attention is commercially critical rather than a nicety.
Why Now (Context Trigger):
Gen AI is now reliable and cheap for per-client memory, transcript ingestion, and daily synthesis.
The firm is scaling — more advisors, more clients per advisor — and the head-knowledge model neither scales nor survives advisor turnover, creating continuity and succession risk on the firm's own book.
Record-keeping expectations are rising; defensible, searchable client records are increasingly the baseline in a regulated practice.
The cost of a miss is asymmetric — a forgotten detail or dropped follow-up costs trust and can create compliance exposure.

Problem Statement
Advisors juggle dozens of clients with no shared, secure system that holds each client's history, financial picture, and sensitivities — and nothing that proactively tells them who needs attention today. The result is missed follow-ups, inconsistent prep, mishandled sensitive details, and knowledge that walks out the door when an advisor leaves. In a referral-driven, advertising-restricted industry, that directly erodes trust and growth.

Target Users
Primary: Advisors (insurance / succession / wealth), each managing ~20–100+ clients. They live in the daily brief and client records.
Secondary (guardrails, not separate v1 user type): Compliance teams (record-keeping defensibility), leadership (continuity on book reassignment). Their needs are covered as system constraints and risks below.

Objective
Give every advisor one secure "client companion" that remembers everything about each client, prepares them for every interaction, and proactively surfaces who needs attention — so attentive service scales consistently across the whole firm instead of depending on any one advisor's memory.

Success Metrics
Leading (Behavior)
% of due follow-ups actioned within SLA — target ≈ 90%.
% of meetings with a brief opened beforehand — target ≈ 80% (prep adoption).
% of clients with a populated record (memory + financials) — coverage metric.
WAU per advisor and morning-brief daily-open rate — stickiness.
Lagging (Outcome)
Reduction in "quiet" clients — no contact > N days.
Reduction in missed renewals / life-event touchpoints — vs. baseline.
Time to onboard a reassigned client — continuity proxy; target < 30 min to full context.
Advisor-reported prep-time reduction — survey; target ≈ 30% less manual time per meeting.
Guardrail
Zero guardrail breaches — sensitivities flagged or blocking generated text.
Audit trail completeness — 100% of client access logged and reviewed.

Milestones
M1 — Client Companion + Daily Brief (this PRD). Client record, calendar views, morning brief, proactive follow-up engine. Manual capture + upload.
M2 — Capture. Meeting transcription → structured notes + action items feeding memory automatically.
M3 — Referral & Partner Network (Deliverable #3) — later.
M4 — Advisor Development & CPD (Deliverable #2) — later.

Milestone 1: Client Companion + Daily Brief (with Proactive Follow-up)
Objective
Ship the advisor's daily operating surface: open the app → get a brief of who matters today → see the week → open any client to a complete, sensitivity-aware picture → and never let a client go quiet.
Scope
Client Record — Foundation per Client
Memory
Timeline of meetings, notes, and interactions.
Log-like structure; immutable, auditable.
Manual / Profile
Curated one-pager distinct from memory: preferences, communication style, household map, goals, known upcoming milestones.
Memory is the log; the manual is the advisor's highlights.
Sensitivities / Guardrails
Do-not-mention and handle-with-care flags (e.g. "don't mention Mr. Tan's children's properties").
Treated as hard constraints; block any system-generated text that violates them.
Surfaced prominently in the morning brief and single-client view.
Financials
Assets, policies/claims, tax position, incentives.
Expense data lives inside the client's timeline/history, not a separate module.
Manual entry + simple CSV/upload import in v1.
Core Features
Client-as-Character + Client Bot
Each client has a Stardew-style avatar (selected/customized by advisor).
Advisor can chat with the record in plain language ("when did we last discuss the trust?").
Advisor can upload transcripts and documents to enrich the record.
All responses grounded in the record; cite source memo/meeting; default to "I don't know" over hallucination.
Notion-Style Client Table
Rows = clients; columns = name, next action / due (overdue highlighted), last touch, status, tags.
Sortable by next action, last touch date, tag, value tier.
Filterable by status, tag, days-since-touch.
Calendar
Two integrated views: advisor week view (all meetings + prep notes) + per-client next/last-touch timeline.
Syncs with advisor's primary calendar (via iCal or native integrations, TBD).
Shows prep alerts (brief ready) before each meeting.
Morning Brief
Aggregates: today's meetings + relevant client sensitivities + follow-ups due + suggested talking points.
One-click to open any linked client.
Personalizable (e.g., which time range to show; can be scrolled down).
Two Separate Follow-up Features
1) Quiet-Client Re-engagement (Simple, No AI)
A plain threshold rule, run per client each day:
IF (today − last_contact_date) > N days THEN flag for outreach.
N is configurable globally and optionally tighter for higher-value client tiers.
Output: a sortable "gone quiet" list in the morning brief and table.
Deliberately dumb and reliable; no AI required.
2) Proactive Follow-up Engine ("Nudges") — Richer
Scans each client record + calendar + uploaded signals and produces a ranked daily list of who needs a touch and why, with one-click action.
Trigger Categories
Trigger Type
Examples
Source
Lifecycle / Calendar
Policy renewal approaching, premium due, claim status change, succession/contract review date, birthday/anniversary.
Advisor input + financials field.
Open Commitments
Unfinished action items from the last meeting ("send Mr. Tan the will draft by Fri").
Auto-extracted from notes/transcripts (M2 dependency); manual flag in M1.
Life Events / External Signals
New child, retirement, business sale, bereavement.
Advisor input, document upload, or transcript analysis (M2).
Financial Triggers
Holdings affected by market move, tax deadline, unused allowance/incentive about to expire.
Financials field + external signals (TBD integrations).
Relationship Risk
Client disengaged after a tense meeting.
Advisor flagging or sentiment analysis of notes (M2).

Where It Surfaces
In the morning brief: "3 follow-ups due today" + why + suggested action.
In the table: Next action / due column (overdue highlighted red).
On each client record: "Suggested next touch" card with reason + proposed message.
Levels of Automation (Advisor-in-the-Loop by Default)
Level
Behavior
Default in v1
When Used
L0
Surface the nudge only.
-
All trigger types.
L1
Pre-write the message/call-note for one-click review; respects sensitivities + tone.
Default
Most triggers.
L2
Propose a calendar slot / reminder.
Optional
Calendar-based triggers.
L3
Auto-send (no human review).
OFF for financial/advisory. Opt-in only for low-risk pre-approved templates (birthday, generic check-in).
Post-v1 or low-risk only.

Feedback Loop
Advisor can mark nudge: done / snooze / dismiss.
"Snooze" = defer this trigger; "dismiss" = tune ranking, flag as "not this trigger for this client."
Snoozed/dismissed feedback trains ranking model.
Every drafted message passes the client's do-not-mention guardrails before showing to advisor.
Compliance-relevant outreach (financial advice, claim actions) flagged for review.
Out of Scope
Meeting auto-transcription / capture — M2 deliverable. M1 assumes manual notes + uploaded transcripts.
Referral / commission tracking — Deliverable #3.
CPD / skills development — Deliverable #2.
Marketing / advertising features — out of scope entirely.
Deep, live integrations into policy-admin / custodian / CRM systems — M1 is manual entry + simple CSV/upload. Real integrations handled post-v1.
Auto-send of financial/advisory outreach — L3 limited to low-risk pre-approved templates only (birthday, generic check-in); default OFF for anything financial in v1.
Advisor/team hierarchy and delegation — M1 is single-advisor-centric. Team workflows and handoff are post-v1.
User Stories
Customer POV (Advisor)
Code
No
Scenario / Screen
Requirement
Notes
M1.1
0
Morning Brief [P0]
GIVEN advisor opens app WHEN between 6 AM–9 AM THEN show briefing of today's scheduled meetings, clients with follow-ups due, relevant sensitivities, and suggested talking points. Acceptance Criteria: (1) brief loads within 2 sec; (2) lists all calendar events for today; (3) flags any do-not-mention topics for clients in today's meetings; (4) shows "follow-ups due" section with reason (renewal, quiet, open commitment, etc.); (5) one-click to open linked client.
-
M1.1
1
Single Client Record [P0]
GIVEN advisor opens any client WHEN viewing the record THEN show memory (timeline of meetings/notes), profile (household, preferences, goals), sensitivities (do-not-mention flags), financials (assets, policies, tax position), and next/last-touch dates. Acceptance Criteria: (1) memory is chronological, searchable, and audit-logged; (2) sensitivities are highlighted in red and block any system-generated text mentioning them; (3) financials are up-to-date as of last manual entry/import; (4) next-touch field shows either the scheduled meeting or the nudge; (5) layout is mobile-friendly.
Expense data lives inline in the timeline (e.g., a note says "discussed $X annual spend"). No separate expense module.
M1.1
2
Client Sensitivities Flag [P0]
GIVEN advisor is viewing a client record or draft brief WHEN client has sensitivities (do-not-mention, handle-with-care) THEN display them prominently, block system-generated text that violates them, and require explicit override (with audit trail) to bypass. Acceptance Criteria: (1) sensitivities are a dedicated section at the top of the record; (2) every draft message or brief paragraph is scanned against sensitivities before showing to advisor; (3) if violation detected, show warning + block, don't just flag; (4) any override is logged with advisor ID, timestamp, and reason.
Critical for regulated practice. Sensitivities are hard constraints, not suggestions.
M1.1
3
Client Chat / Q&A [P1]
GIVEN advisor opens a client record WHEN advisor types a plain-language question (e.g. "when did we last discuss the trust?") THEN search the client's memory and return the answer with a citation to the source memo/meeting. Acceptance Criteria: (1) search covers memory (timeline) and uploaded documents; (2) answer includes source (date, meeting title, or document name); (3) if no answer found, say "I don't know" not a guess; (4) query logs are retained for audit.
Grounding answers in the record avoids hallucination.
M1.1
4
Upload Transcript / Document [P1]
GIVEN advisor has a meeting transcript or document WHEN advisor uploads it to a client record THEN add it to the client's memory timeline and make it searchable. Acceptance Criteria: (1) accept PDF, DOCX, TXT, audio transcripts (text); (2) file is stored encrypted and audit-logged; (3) appears in the timeline with upload date; (4) searchable via client chat and table filters; (5) shows upload size and format.
M1 uses manual upload. M2 will auto-capture from meetings.
M1.1
5
Client Table / List View [P0]
GIVEN advisor opens the clients table WHEN viewing all clients THEN show rows (one per client) with columns: name, next action / due (overdue highlighted), last touch, status, tags. Acceptance Criteria: (1) sortable by next action, last touch, tag, value tier; (2) filterable by status, tag, days-since-last-touch; (3) next-action column shows reason (renewal, quiet, open commitment, etc.) in a tooltip; (4) overdue actions in red; (5) avatar + initials for quick scan; (6) mobile-responsive (stack columns or use horizontal scroll).
Anchor view for daily workflow.
M1.1
6
Calendar / Week View [P1]
GIVEN advisor opens the calendar WHEN viewing a week THEN show all scheduled meetings + prep alerts. Per-client view shows next/last-touch timeline. Acceptance Criteria: (1) sync with advisor's primary calendar (iCal or native integration, TBD); (2) show "brief ready" badge before each meeting; (3) per-client modal shows next and last meeting dates; (4) one-click to open brief or client record.
Integrates scheduling with client context.
M1.1
7
Quiet-Client Re-engagement Flag [P0]
GIVEN a client has not been contacted for N+ days WHEN the rule runs daily THEN flag in the morning brief and table. Acceptance Criteria: (1) configurable N per advisor (global default + per-tier tighter defaults); (2) appears as a separate "gone quiet" section in the brief; (3) in the table, sorts by days-since-last-touch; (4) no AI; plain threshold rule (today − last_contact_date) > N.
Simple, reliable, auditable.
M1.1
8
Nudge / Follow-up Surfacing [P0]
GIVEN a client has a renewal, open commitment, life event, or financial trigger WHEN the nudge engine runs (daily) THEN surface in the morning brief, next-action column, and client record. Acceptance Criteria: (1) show trigger reason (renewal, quiet, open commitment, etc.); (2) show one-click "draft message" option (L1); (3) show "snooze" and "dismiss" buttons; (4) logged for tuning; (5) ranked by priority (overdue > today > this week).
Nudges are the core re-engagement tool. Ranking tunes over time.
M1.1
9
Draft Follow-up Message [P1]
GIVEN advisor clicks "draft" on a nudge WHEN system generates a message (call script, email, SMS template) THEN show for advisor review before send, respecting sensitivities and tone. Acceptance Criteria: (1) pre-populate client name, context (renewal


The agent builder is now a first-class scope item — advisors compose Trigger → Condition → Action flows, and the proactive nudge is reframed as one preset agent (your "simple if days >" rule, with the threshold exposed as a dial) rather than a fixed feature. I added three starter presets (quiet-client, renewal reminder, high-value check-in), new user stories about building and tuning agents, a runaway-agent risk with mitigations (preset constraints, frequency caps, dry-run before activation), and a builder-adoption metric.
