# Kontrol Otorisasi Adjustment Nominal Topup Dealer

## Outcome and scope

Build an interactive local Payin flow in the existing Paydia Dashboard Admin.
L3 decides the amount adjustment. L2 separately decides topup success and dealer credit.
Use existing Approval, Admin, and Log pages. Preserve existing reconciliation and settlement behavior.

The demo needs no production backend, Telegram send, deployment, commit, or new package.

## Sources checked

- `/Users/dionscholus/Downloads/PRD Kontrol Otorisasi Adjusment Nominal Topup.docx`: all body text and six embedded flowcharts.
- `/Users/dionscholus/.codex/attachments/6263a56d-5da0-4e18-bee5-78a1d4baaced/pasted-text-1.txt`: detailed implementation and QA requirements.
- `/Users/dionscholus/.codex/attachments/6263a56d-5da0-4e18-bee5-78a1d4baaced/image-1.png`: empty Payin list reference.
- Current `sidebar.js`, `boot.js`, `approval.js` / `.html`, `admin.js` / `.html`, and `log.js` / `.html`.
- Code graph architecture and file summary consulted before source searches. No graph node matched the Payin query.

### Source decisions

| Issue | Implementation decision |
|---|---|
| One Word Gherkin clause treats blank reason as invalid | Follow explicit Acceptance Criteria and flowchart: reason is optional, maximum 255 characters. |
| Word Objective mentions an adjustment reason | Optional reason still gets recorded when supplied. |
| Word Open Questions contains placeholder rows | Preserve the four unresolved topics in the supplied prompt as production boundaries. |
| Only the empty Payin list screenshot is supplied | Follow its toolbar/table treatment. Derive missing form/detail layouts from this repository. |
| No dealer-specific L2 request reference exists | Reuse existing `Ubah Status Top Up Pengguna` request label, with explicit dealer/topup context. Mark this as a demo assumption. |
| Existing Admin Approval segment contains `Topup Manual` | Use that existing permission for L2 in the demo. Do not reuse the reconciliation `approve` flag. |
| Word L3 log AC says biller | Apply the supplied product-owner correction: this means the dealer, identified by name and email. |

No screenshot establishes additional required Request Approve fields. Require fresh evidence and show transaction context.
Keep concurrent adjustment policy, maximum amount, duplicate evidence content, and Risk Management review undecided.
Demo requests run sequentially. A pending-request guard is a demo sequencing constraint, not a production concurrency policy.
Do not compare evidence content or add an amount business maximum.

## Existing integration points

| File | Verified behavior | Minimal addition |
|---|---|---|
| `sidebar.js` | Canonical sidebar renders at DOM ready and window load. Payin is `href="#"`. | Change only Payin href to `payin.html`. Existing active-link logic handles the file. |
| `approval.js` | `getAllApprovals()` merges stored approvals and seeds. Shared request filter and pagination use it. | Merge topup projections into that returned list, before filters. Route marked topup rows to their own detail handler. |
| `approval.js` | Legacy approve/reject handlers write reconciliation and settlement keys. | Never send topup requests into these handlers. Keep those functions unchanged. |
| `admin.js` | `permSegments` has an Approval segment. Permission inputs currently have no persistent account state. | Add Request Adjustment. Persist only topup Request Adjustment and existing Topup Manual rights in the new namespace. |
| `log.js` | `initDatabase()` reads and rewrites `paydia_logs`. `renderTableData()` filters `logs`. | Merge topup log projections only into the render/filter input. Never add topup records to `paydia_logs`. |
| `boot.js` | Version mismatch removes existing module storage keys. | Do not change boot.js or MOCK_VERSION. New storage is independent. |

The old mock-data reset/populate buttons must never mutate topup data.
The topup reset must never touch old data. Avoid `localStorage.clear()` and storage-prefix deletion.

## File ownership and parallel implementation

### Core implementer owns

- New `topup-state.js`: domain state, seeds, transitions, permission checks, logs, messages, native IndexedDB evidence storage.
- New `topup-state.test.js`: one runnable Node assertion script for consequential domain logic.

### UI implementer owns

- New `payin.html`, `topup-ui.js`, and `topup.css`.
- Additive edits only to `sidebar.js`, `approval.html`, `approval.js`, `admin.html`, `admin.js`, `log.html`, and `log.js`.

### Explicitly protected

Do not edit `app.js`, `index.html`, `page-guide.js`, `settle-recon.html`, `settle-recon.js`, `auto-settlement.html`, `auto-settlement.js`, `styles.css`, `boot.js`, or version files.
Do not revert existing modified or untracked files. Root baseline hashes cover 66 existing files.

Load `topup-state.js` before page-specific scripts. Load `topup-ui.js` afterward.
Existing page DOM-ready callbacks execute after both scripts become available.
Use one global namespace, `window.PaydiaTopup`, for state and `window.PaydiaTopupUI` for UI.
Namespace new IDs/classes with `topup-`. scope all new CSS to those selectors.

## Core/UI contract

Core exports the following names. Coordinate any change before editing dependent UI.
All methods return copies, not mutable internal references.
Domain mutations throw a readable `Error` on failure. They leave persisted state unchanged.

| Method | Contract |
|---|---|
| `getState()` | Snapshot `{ accounts, activeAccountId, transactions, requests, logs, notifications, telegramFail }`. Seeds immediately when the namespaced key is absent. |
| `setActiveAccount(id)` | Persist selected demo account. |
| `setAccountPermissions(account, patch)` | Upsert account identity and topup rights. Patch keys: `requestAdjustment`, `topupManual`. |
| `setTelegramFail(boolean)` | Controls simulated notification outcome. |
| `submitAdjustment({ transactionId, proposedAmount, reason, evidenceId })` | Validates active requester and fields. makes a pending L3 request. |
| `submitTopup({ transactionId, evidenceId })` | Makes a separate pending L2 request using the current effective amount. |
| `decide(requestId, decision)` | `decision` is `approved` or `rejected`. Recheck current account, current permission, request status, and L3 self-approval before committing. |
| `validateEvidence(files)` | Accept FileList/array. Return field error or empty string. Exactly one supported file, at most `15 * 1024 * 1024` bytes. |
| `saveEvidence(file)` | Async validation + IndexedDB Blob save. Return `{ id, name, size, type }`. No business event or notification. |
| `getEvidence(id)` | Async return `{ id, name, size, type, blob }`, including seeded examples. |
| `resetDemo()` | Async reset only namespaced state and evidence DB, then emit update. |
| `approvalRows()` | Return rows compatible with existing approval list, each with `topupRequestId`. |
| `logRows()` | Return rows compatible with existing log renderer, each with `topupLogId`. |

After every successful metadata change dispatch `window.dispatchEvent(new Event('paydia-topup-change'))`.
UI refreshes the relevant table and demo panel on that event.
If Node is used, expose the same API via `module.exports` and inject tiny storage/clock/Blob adapters in the assertion script.
Avoid a general repository-wide state framework.

### Data shape

- Account: `{ id, name, email, canRequest, requestAdjustment, topupManual }`.
- Transaction: `{ id, dealerId, dealerName, dealerEmail, createdAt, originalAmount, effectiveAmount, status, credited, creditedAmount }`.
- Dealer balances: include a `dealers` map in state, with opening and current demo balances.
- Request: `{ id, transactionId, kind, status, originalAmount, proposedAmount, amount, reason, evidenceId, requester, createdAt, reviewer, decidedAt }`.
- `kind`: `adjustment` or `topup`. request `status`: `pending`, `approved`, or `rejected`.
- Transaction status: existing `Proses` and `Sukses`. Rejection retains `Proses`, with rejected request status shown separately.
- Log snapshots include all dealer/request/actor/evidence fields plus `beforeAmount`, `afterAmount`, and timestamp.
- Store actor name/email snapshots so permission changes cannot rewrite audit history.
- Notifications retain event, complete preview text, request/transaction IDs, delivery status, and failure detail.

Use numeric existing Admin identities for the five initial demo accounts: Dion (3/L1), izarlvl2 (6/L2), King Kenny 1 (4/L3), Izar (7/no approval rights), BlackVolk (8/L1 + L3 permission).
Their identities and labels remain the existing Admin data. Roles are demo configuration, not claims about the real people.
Allow assigning Request Adjustment to any saved Admin account. Add that account to the demo selector when permission is saved.
Do not hardcode approval authorization against an email or the L3 demo label.

### Persistence and evidence

Use one localStorage key such as `paydia_topup_authorization_v1` for metadata.
Use one separate IndexedDB database such as `paydia_topup_evidence_v1`, with an evidence store for Blobs.
Base64 localStorage evidence cannot satisfy the accepted 15 MB boundary and cross-page preview.
Save evidence first. if its write fails, keep the form open and do not create the request.
Commit transaction/request/log/notification changes with one metadata write. Surface write failures before showing success.
Do not rely on Blob URLs surviving navigation. Create a fresh preview URL from IndexedDB, then revoke it when closed.
Seed evidence can be small generated PNG/PDF Blobs or small static dummy files. No external download dependency.

Track evidence metadata and its request binding in the namespaced state. Each submitted request owns a distinct evidence ID.
Fresh L2 evidence means a separate explicit upload for that L2 request. Never prefill it from the adjustment.
The same file contents may be uploaded again. this unresolved business policy must stay unimplemented.

## Seed coverage

Seed actionable and decided examples on first load, with matching request history, evidence, logs, messages, and balances.

| Transaction | State | Purpose |
|---|---|---|
| TOPUP-001 | Proses. no adjustment. matching nominal | Normal L1 → L2 flow. |
| TOPUP-002 | Proses. Rp1.000.123 initial | Fresh mismatch → Request Edit → L3 → new evidence → L2. |
| TOPUP-003 | Pending L3 | Approve or reject immediately. |
| TOPUP-004 | L3 approved. effective Rp1.000.000. Proses | Read-only amount and unchanged dealer balance after L3. |
| TOPUP-005 | L3 rejected. original amount retained | Correct rejected history and before/after log. |
| TOPUP-006 | Pending L2. normal flow | L2 approval or rejection without adjustment. |
| TOPUP-007 | Pending L2. prior L3 approval | Final amount and both distinct evidence references. |
| TOPUP-008 | L2 approved. Sukses. credited once | Final read-only details and idempotency. |
| TOPUP-009 | L2 rejected. Proses. no credit | Rejection audit and Telegram preview. |
| TOPUP-010 | Pending L3. BlackVolk requester | Self-approval denial despite permission. |
| TOPUP-011 | Existing successful action with failed notification | Failure record without rolled-back business state. |

Include pending/approved/rejected request rows in Approval so every state is reviewable immediately.
Decided rows open read-only detail and show reviewer/time, with no operative decision buttons.
Seed balances must equal opening balance plus credited successful transactions, with no hidden credits.
Use deterministic IDs. Reset restores the same examples.

## UI behavior

### Payin

- Match screenshot hierarchy: breadcrumb, Payin title, white card, Filter/Export, Search/Reset, wide table, Action at right.
- Keep source columns where legible: No, Id Referensi, Vendor, Tanggal, Kategori, Merchant, Nominal, Status, Action.
- Render vendor as Biller Gateway and merchant/dealer name with email. Do not invent a separate biller entity.
- Filters, search, reset, pagination, CSV export, Action dropdown, and transaction detail must work.
- Detail shows the effective amount read-only and independent adjustment/topup request statuses.
- Action/Edit opens a proposal form with original amount read-only, proposed amount, optional reason/counter, and one file.
- Only `Request Edit` submits the edit form. `Request Approve` is absent during edit.
- Detail/Request Approve opens an evidence form with the current read-only effective amount.
- Cancel produces no amount, status, balance, log, or notification change.
- Pending adjustment blocks the demo's L2 submission until decided. explain the pending request, without expiry/timer.
- Block editing or another credit after successful topup.

### Approval

- Keep the existing shared list, filter, and pagination. Add `Request Adjustment` to the type options.
- Include the existing L2 label in the filter if absent. Topup row status can appear within its type/action cell.
- Topup rows use their own namespaced modal and handler, with independent L2/L3 permission checks.
- Use a native `<dialog>` for new modals if compatible with styling. This provides focus containment and Escape behavior.
- Render all uploaded/user-entered values as text or escape them before any HTML template insertion.
- L3 detail shows original/proposed amounts side by side, reason or `-`, dealer, evidence preview, requester/time, status, reviewer/time.
- L2 detail shows the submitted effective amount and L2 evidence. No editable amount.
- Successful decision closes or refreshes detail and refreshes the shared list without deleting history.

### Admin

- Add Request Adjustment to Approval permission segment.
- Hydrate only the two topup-related checkbox values from the selected account topup state.
- Preserve draft topup checkbox changes while category search rerenders the modal.
- Save those draft values only on valid `Simpan`. Cancel discards them.
- Existing unrelated checkboxes and old mock permissions keep their existing behavior.
- Account switching/revoking permission while a request is open must affect the next action.

### Log

- Preserve current table/filter structure. Add topup container and six event types plus Telegram failure.
- Project namespaced logs into list/filter/export reads without storing them in the old log array.
- Add a topup-only detail button inside its Detail cell. show snapshots and request-specific evidence preview.
- Before/after amounts must be equal for submission and rejected decisions. Only L3 approval changes amount.
- Product UI exposes no log deletion. New handlers expose no individual log removal operation.

### Demo panel

Place a collapsible panel outside product navigation on Payin, Approval, Admin, and Log.
Include active account selector, rights summary, demo dealer balances, Telegram previews, fail-send toggle, and reset.
Label controls as simulation. Keep panel clear of table actions and modal buttons at 1280/1440 widths.
Reset is a simulator control, never a Log deletion command.

## Domain invariants and notification templates

| Event | Amount | Topup status | Dealer balance | Required output |
|---|---|---|---|---|
| Request Edit | Unchanged | Unchanged | Unchanged | Pending adjustment, audit, Request Edit preview. |
| L3 approve | Proposed amount applied | Unchanged | Unchanged | Approved request, reviewer/time, Approve Edit preview. |
| L3 reject | Unchanged | Unchanged | Unchanged | Rejected request, unchanged afterAmount, Reject Edit preview. |
| Request Approve | Unchanged | Unchanged | Unchanged | Separate pending topup request/evidence, Request Approve preview. |
| L2 approve | Unchanged | Sukses | Add submitted amount once | Approved request, audit, Approve Topup preview. |
| L2 reject | Unchanged | Unchanged | Unchanged | Rejected request, audit, Reject Topup preview. |
| Upload only | Unchanged | Unchanged | Unchanged | Preview only. no business audit/Telegram event. |
| Telegram failure | Keep committed action | Keep committed action | Keep committed action | Failed delivery plus failure log. no automatic retry. |

Every Telegram preview uses activity, dealer name/email, requestor, and `YYYY-MM-DD HH:mm:ss`.
Decision messages also include reviewer.
Request Edit/L3 messages include original and proposed amounts.
Request Approve includes its transaction amount.
L2 decisions include transaction amount plus original/proposed values when adjustment history exists.
Do not derive historical messages from the later transaction amount.

## Verification matrix

Root runs the browser already at `http://127.0.0.1:8765`. Use CUA for interactive browser QA.
Do not substitute shell Playwright for the required UI audit.
Use real UI events for account changes, submissions, approvals, permission changes, and navigation.

| ID | Action | Expected evidence |
|---|---|---|
| V01 | Open all four pages from sidebar | Correct active menu. topup data persists across navigation and reload. |
| V02 | Fresh normal topup, upload L2 evidence, submit, approve | No adjustment. Sukses. balance delta equals amount exactly once. |
| V03 | Edit mismatch, submit, approve L3 | Effective amount changes only at L3 decision. Proses and balance unchanged. |
| V04 | Return to V03 Payin. open L2 form | New amount read-only. upload empty. submit without new evidence rejected. |
| V05 | Upload fresh L2 evidence, submit, approve | Sukses. credit once. distinct evidence records remain previewable. |
| V06 | Edit and cancel | Original amount/status/balance unchanged. no log/message added. |
| V07 | Amount empty, nonnumeric, zero, negative | Field errors. no request. minimum Rp1 accepted. |
| V08 | Reason empty, exactly 255, 256 characters | Empty/255 accepted. 256 rejected or prevented with explicit limit. counter accurate. |
| V09 | Evidence empty, wrong type, two files | Field error. no request. no notification. |
| V10 | JPG, JPEG, PNG, PDF | Accepted. filename/size and image/PDF preview work before/after navigation. |
| V11 | Exactly 15 MB and 15 MB + 1 byte | First accepted and previewable across pages. second rejected. |
| V12 | Reject L3 | Old amount/status/balance preserved. rejected request/log/message visible. |
| V13 | Reject L2 | Proses and balance unchanged. rejected request/log/message visible. |
| V14 | No-permission account attempts L3 approve/reject | Controls unavailable. action handler also denies. |
| V15 | Requestor with Request Adjustment permission attempts own decision | Both approve/reject denied. no mutation. |
| V16 | Grant/revoke permission from Admin, including another account | Subsequent action checks current permission. old modules unaffected. |
| V17 | Permission draft, search category, save/cancel | Search preserves draft. save persists. cancel discards. |
| V18 | Repeated decision, stale open modal, rerender/reload | No second credit, second amount change, audit duplication, or decision rewrite. |
| V19 | Fail Telegram for each of the six events | Business action persists. failed preview and failure log retained. |
| V20 | Upload without submit | No Telegram event. no approval or amount change. |
| V21 | Filter/search/export and empty results on new data | Correct rows/counts, reset works, CSV quotes handled. |
| V22 | Log detail for rejected/approved and normal/adjusted topups | Correct before/after, actors, dealer, evidence references, timestamps. |
| V23 | New simulator reset | Restores every seed. old reconciliation/settlement storage unchanged. |
| V24 | Desktop 1440 and 1280. keyboard Tab/Escape | Readable tables/modal, visible errors/actions, labels, focus containment/restoration. |
| V25 | Special characters in reason/file names | Render as plain text. no HTML execution or broken markup. |
| V26 | Pending requests, reload/navigation | Remain pending. no timer, expiry, or automatic finalization. |
| V27 | Protected file hash comparison plus old page smoke | Protected files unchanged. baseline Auto Recon and Auto Settlement figures unchanged. |
| V28 | Shared legacy approval and Log filters | Existing row detail/routes still function. topup requests never reach legacy decision handlers. |

Leave one runnable core check: `node topup-state.test.js`.
It must cover permission-at-action, self-approval, rejected unchanged amount, exact-once credit, fresh evidence, and Telegram failure persistence.
Record browser results separately, including failed or untested cases. Syntax-check every modified/new JavaScript file.

## Acceptance and delivery

Finish only after core checks and independent Astra UI audit pass, with Sol fixing confirmed defects.
Capture screenshots for initial read-only amount, Edit without Request Approve, L3-approved Proses, final L2 credit, permissions, Log, and Telegram failure.
Compare root baseline hashes. Review the diff for unintended changes and namespace leaks.
Report local URL, changed absolute paths, account/scenario guide, actual test results, and remaining visual assumptions.
Do not claim production readiness or deployment.

## Pertanyaan untuk Dion

Tidak ada. Available sources are sufficient to implement the demo.

## Asumsi yang gue pakai

1. Existing L2 label `Ubah Status Top Up Pengguna` and `Topup Manual` permission represent the dealer topup demo path.
2. Missing detail/modal layouts follow current repository components. they are not verified screenshot replicas.
3. The demo runs requests sequentially and uses separate uploaded evidence records, without setting unresolved production policy.
4. Existing named Admin accounts have simulated roles only within the new topup feature.
