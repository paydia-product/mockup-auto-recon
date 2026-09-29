# Topup Authorization QA

Audit date: 29 September 2026.
Status: complete for the local mockup. All 28 planned cases have recorded evidence below.
This report distinguishes direct auditor observations, lead-agent browser observations, domain assertions, and source review.

## Scope

- Source authority: latest supplied Word PRD, including six flowcharts, plus the detailed implementation prompt.
- Source audit: `topup-state.js`, `topup-state.test.js`, `topup-ui.js`, scoped styles, and shared-page integration diffs.
- Independent browser: native Microsoft Edge, new localhost tab at `http://127.0.0.1:8766/payin.html`.
- Lead-agent browser: Codex in-app browser at a separate localhost origin, including the complete decision flows and exact viewport checks.
- No production action, Telegram send, commit, or deployment occurred during this audit.

The audit agent had no browser provider. CUA reported an empty browser inventory.
Native Edge supplied independent human-flow checks. The audit stopped Edge interactions when the user resumed using Edge.
Existing user tabs remain intact. The topup audit tab remains available.

## Confirmed findings

| Finding | Evidence | Status |
|---|---|---|
| Reset deleted evidence before a failing metadata write | Independent Node reproduction: retained old request, zero evidence Blobs, `File bukti tidak tersedia`. | Fixed by Sol. Metadata now saves first. Updated assertion suite passed. |
| Seeded TOPUP-007 L2 request preceded its L3 decision | Original L2 timestamp 10:00, L3 decision 11:00 on the same date. | Fixed by Sol: L2 timestamp 12:00. Browser Approval showed the corrected timestamp. |
| Accepted decimal proposal displayed a different amount | `1.0001` remained in request data but formatted as `Rp1` in the Telegram message. | Fixed by Sol. Independent retest confirmed `Rp1,0001`. Core suite passed, and UI formatter matches. |
| Seeded Reject Edit message was inaccessible in demo preview | UI rendered only the latest ten of sixteen seeded notifications. The seeded rejection fell outside that range. | Fixed by Sol. Source now renders all saved messages in the scroll container. All six notification event types were exercised in browser QA. |
| L2 message omitted rejected adjustment history | TOPUP-005 has a rejected adjustment. A later L2 approve message omitted original/proposed values. | Fixed by Sol. Independent retest confirmed original/proposed values and `Status Adjustment: Ditolak`, with effective amount unchanged. |

Root confirmed the Action dropdown issue during browser QA. Sol changed it to a native popover.
Root then opened TOPUP-002 Request Approve with a real mouse click. Final checks also passed for the bottom row, a single search result, and page two. The bottom-row popover stayed inside the viewport.

No confirmed finding remains open in the local mockup scope.

## Independent domain verification

`node topup-state.test.js` passed during this audit.
The script checks the following behaviors:

- Seed counts, amounts, evidence, balances, and corrected approval chronology.
- Invalid evidence count/type/size and the exact 15 MB boundary.
- L3 permission checks, permission revocation, and approve/reject self-approval denial.
- L3 changes amount while topup status and dealer balance remain unchanged.
- Repeated decisions fail without applying the amount twice.
- Empty/nonnumeric/zero/negative amounts and 256-character reasons fail without creating requests.
- A failing metadata write leaves the request, evidence binding, log, and notification unchanged.
- A fresh L2 upload is required after adjustment.
- L2 permission checks, final credit once, and failed Telegram delivery without rollback.
- Snapshot callers cannot mutate persisted transactions or audit records.
- Demo reset preserves legacy storage and restores seeds.

Independent targeted retests passed for decimal display and rejected-adjustment history in later L2 decisions.
The regression assertion suite also passed after both fixes.

Additional independent assertions passed for all six Telegram failure events:
Request Edit, Approve Edit, Reject Edit, Request Approve, Approve Topup, and Reject Topup.
All six retained their correct business effects and failure records.
The resulting balances were Rp11.600.000 and Rp5.900.000.
Reset preserved sentinel values for `paydia_approvals`, `paydia_logs`, `paydia_settlements`, and `paydia_mock_perms`.

Final lead-agent checks also passed: `node topup-state.test.js`, `node --check` for all six affected JavaScript files, and `git diff --check`.
The final comparison against `/tmp/paydia-topup-qa/baseline-sha256.json` covered 66 existing files with zero missing files.
Only the seven authorized shared files changed: `admin.html`, `admin.js`, `approval.html`, `approval.js`, `log.html`, `log.js`, and `sidebar.js`.
Protected Auto Recon, Auto Settlement, shared styles, boot code, and pre-existing user edits retained their baseline hashes.

## Independent human-flow browser observations

These actions used CUA native controls and real file-picker uploads. No page state was injected.

1. Opened a new Edge tab at localhost port 8766.
2. Opened TOPUP-001 Action → Detail. Effective amount showed Rp1.000.000 read-only, Proses, and no request.
3. Opened Request Approve. The amount remained read-only, and the evidence field started empty.
4. Submitted without evidence. The form showed `Unggah tepat satu file JPG, JPEG, PNG, atau PDF.`
5. Used the native file picker to select `/tmp/paydia-topup-qa/mutasi-tepat-15mb.pdf`.
6. The form displayed `15.00 MB`. The embedded PDF viewer loaded the one-page dummy evidence.
7. Submitted the request. Confirmation identified TOPUP-001 and stated that status and balance had not changed.
8. Opened the demo panel. Dealer balances remained Rp10.600.000 and Rp5.900.000.
9. Selected `izarlvl2 · izar@gmail.com`. The panel showed Topup Manual enabled and Request Adjustment disabled.
10. Navigated to the shared Approval page. Topup data and selected account persisted across navigation.
11. Filtered by `Ubah Status Top Up Pengguna`. Seven rows included the new request and the legacy seed.
12. Opened new TOPUP-REQ-012. Detail showed TOPUP-001, Dion as requester, Rp1.000.000, Proses, and Approve/Reject.
13. Its 15 MB PDF reopened from a fresh Blob URL after navigation.
14. The attempted L2 Approve click was interrupted when the user switched Edge tabs. Its outcome was not verified.

## Root CUA results received

Root reported these observations from its isolated in-app browser:

- Blank, `abc`, `0`, and `-1` proposals displayed errors and blocked submission.
- The 255-character reason passed validation. A 256-character reason displayed an error and blocked submission.
- An empty reason successfully created a Request Edit.
- Missing files, wrong `.txt` format, multiple files, and 15 MB plus one byte were rejected.
- Exactly 15 MB was accepted. PNG/JPG/JPEG/PDF filenames and sizes displayed correctly.
- Image preview natural width was 840 pixels. Independent native Edge verified rendered PDF content.
- TOPUP-002 Request Edit created TOPUP-REQ-012 with an empty reason and PDF evidence.
- Its effective amount remained Rp1.000.123 while pending. Dealer balances stayed unchanged.
- L3 approval changed the amount to Rp1.000.000. Status remained Proses, and dealer balance remained Rp5.900.000.
- L1 opened a fresh L2 form. Submitting without another upload failed.
- L1 uploaded separate `mutasi-demo-2.png` and created TOPUP-REQ-013.


Additional root CUA results:

- L2 approved TOPUP-002 Request013 with simulated Telegram failure. Topup became Sukses and Sentosa balance rose Rp5.900.000 → Rp6.900.000.
- Reload retained Rp6.900.000. The L3 PDF and separate L2 PNG remained previewable.
- Izar without permission saw neither decision button on pending Request003.
- BlackVolk saw neither decision button on their own pending Request010 despite L3 permission.
- Kenny rejected Request003. L2 rejected Request006. Both retained Proses and their prior dealer balances.
- Admin granted Izar Request Adjustment. The checked draft survived filtering by Approval, then saving and navigation enabled decision buttons.
- A second tab revoked Izar permission while Request010 remained open. Both stale Approve and Reject returned `Permission Request Adjustment diperlukan`.
- The denied request remained pending, proving handler checks beyond button visibility.
- Log search for TOPUP-002 displayed four business events and one Telegram Failure.
- Log97019 showed before Rp1.000.123, after Rp1.000.000, actor identities, dealer email, timestamp, and the PDF reference.
- Escape closed the Log dialog and restored focus to its Detail button.


Further root CUA results:

- Opened pending TOPUP-007 in two tabs. First L2 approval credited Rp1.200.000 once.
- The second stale Approve returned `Request ini sudah diputuskan`. Reload retained Nusantara balance Rp11.800.000.
- Completed the normal TOPUP-001 path without adjustment. Request014 approval made it Sukses and raised Nusantara to Rp12.800.000.
- Uploaded JPEG to TOPUP-005, then cancelled. Notification count, Rp1.000.123 effective amount, and Proses status remained unchanged.
- Submitted TOPUP-005 proposal `1.0001` with a 255-character reason starting `<b>QA & nominal</b>`.
- Approval detail rendered that markup as literal text and showed `Rp1,0001`. Rejection retained the old effective amount.
- Browser failures covered Request Edit015, Reject Edit015, Approve Edit010, Request Approve014, and Approve Topup014.
- Those failed notifications preserved committed request/decision effects.

Final root CUA results:

- Reject Topup016 with Telegram failure left the request Ditolak and topup Proses at Rp750.000. Balances remained Rp12.800.000 and Rp6.900.000. This completed browser checks for all six failure events.
- Checked an Admin permission, chose Batal, and reopened the account. The permission remained unchecked.
- Payin search, status filter, and empty-result state passed.
- Payin Export produced `/Users/dionscholus/Downloads/paydia-payin-topup-demo.csv` at 11:19:38. File inspection found eight columns and the five filtered Sukses rows: TOPUP-001, 002, 007, 008, and 011. The browser download-event wait timed out; the fresh downloaded file independently confirmed the result.
- Two-step demo reset from Log restored eleven seeded topups, balances Rp10.600.000 and Rp5.900.000, and active account Dion. Existing Flag Recon and Flag Settle log rows 9501/9502 were identical before and after reset.
- Existing Approval Campaign Promo still used its original `APR-SEED-002` toast handler.
- Auto Recon retained its baseline counts: total 674, matched 11, unmatched 658, and disputes 20. Auto Settlement retained Checker 1356, Approver 1010, Hold 1361, and Settle 1000.
- No console errors were reported during the final browser checks.
- At 1440 × 1000, the final table fit all nine columns within its 1128-pixel content width.
- At 1280 × 800, the edit dialog was centered at x257, y52 with width760 and height695. Tab moved from amount to reason; Escape closed the dialog and returned focus.
- At 1280 pixels, the table intentionally scrolled horizontally by 132 pixels to reveal Status while Action remained sticky and usable. Last-row, single-result, and page-two actions passed.
- The final artifact at `http://127.0.0.1:8765/payin.html` was reset through the UI to eleven seeds, balances Rp10.600.000/Rp5.900.000, and account Dion. A final seeded TOPUP-004 detail showed the L3-approved Rp1.000.000 against original Rp1.000.123, Proses, no L2 request, and unchanged Sentosa balance Rp5.900.000.

Screenshots of the checked states and viewports were emitted inline by CUA in this task's tool history. They were not saved as separate image files. The independent auditor did not re-inspect those inline screenshots; these layout results are attributed to the lead agent.

Root and native Edge used separate browser storage. Their request IDs can therefore overlap.

## Requirement matrix

`Domain pass` means the domain assertion passed. It does not claim browser completion.
`Source pass` means source review found the expected implementation. It does not replace a browser check.

| ID | Requirement | Evidence and current result |
|---|---|---|
| V01 | Four pages and persistent navigation | Root CUA visited Payin, Approval, Admin, and Log. Requests, evidence, account rights, and balances persisted. |
| V02 | Normal L1 → L2 final topup | Root CUA TOPUP001 Request014 approved without adjustment. Sukses and balance +Rp1.000.000. |
| V03 | Request Edit → L3 approval | Root CUA pass: TOPUP-002 amount changes only after L3. Proses and balance remain unchanged. |
| V04 | Adjusted read-only amount and empty L2 upload | Root CUA pass: adjusted amount shown, fresh L2 upload empty and required. |
| V05 | New L2 evidence and final approval | Root CUA pass: separate PNG Request013 approved, Sukses, balance +Rp1.000.000. L3 PDF and L2 PNG retained. |
| V06 | Cancel Edit without effects | Root CUA uploaded JPEG then cancelled TOPUP005. Nominal/status/notification count unchanged. |
| V07 | Invalid amount and minimum Rp1 | Root CUA blank/abc/0/-1 blocked. Domain minimum Rp1 accepted. |
| V08 | Optional/255/256-character reason | Root CUA empty and 255-character reasons successfully submitted. 256 blocked. Domain passed. |
| V09 | Empty/wrong/multiple evidence | Root CUA and domain pass. Independent native L2 empty-file check passed. |
| V10 | JPG/JPEG/PNG/PDF preview | Root CUA all four formats pass. Native PDF rendered before submit and after navigation. |
| V11 | 15 MB accepted, larger rejected | Root CUA accepted exact boundary and rejected +1 byte. Native 15 MB persisted PDF preview passed. |
| V12 | L3 rejection keeps prior values | Root CUA rejected Request003. Proses and balance unchanged. Domain amount invariants passed. |
| V13 | L2 rejection keeps Proses/balance | Root CUA rejected Request006. Proses and balance unchanged. Domain passed. |
| V14 | Missing permission denied | Root CUA hid both buttons. Stale open modal also rejected both decisions after cross-tab revocation. |
| V15 | Self-approval denied | Root CUA hid both buttons for BlackVolk Request010. Domain denied both actions. |
| V16 | Permission grant/revoke takes effect | Root CUA granted Izar access, then cross-tab revocation blocked stale Approve and Reject. Request stayed pending. |
| V17 | Permission draft survives search/save/cancel | Root CUA draft/search/save passed. Check → Batal → reopen retained the original unchecked permission. |
| V18 | Repeated decisions/reload do not duplicate credit | Root CUA dual-tab TOPUP007: first +Rp1.200.000, stale repeat denied, balance unchanged after reload. |
| V19 | All six Telegram failure paths | Independent domain and root CUA both passed all six event types. Each retained the correct request/decision and balance effects. |
| V20 | Upload alone creates no request/message | Root CUA JPEG upload then cancel left notification count unchanged. Source confirms no business event on upload. |
| V21 | Filter/search/export/empty result | Native Approval filter passed. Root CUA Payin search/status/empty state passed. Export created a current CSV with eight columns and the five filtered Sukses rows. |
| V22 | Audit details and evidence | Root CUA TOPUP002 search/detail97019 passed: before/after, actor/dealer/time, separate evidence and failure record. |
| V23 | Demo reset leaves old modules intact | Domain legacy-key sentinels passed. Root CUA reset restored eleven seeds, baseline balances/account, and preserved legacy log rows 9501/9502 exactly. |
| V24 | 1440/1280 layout and keyboard | Root CUA checked actual 1440 × 1000 and 1280 × 800 viewports, table fit/scroll/sticky Action, dialog position, Tab, Escape, and focus return. Screenshots are inline in task tool history. |
| V25 | Special characters render safely | Root CUA literal `<b>QA & nominal</b>` reason rendered as text. Source escapes filenames and new dynamic content. |
| V26 | Pending requests stay pending without expiry | Source pass. Native submitted request remained pending across navigation. |
| V27 | Protected hashes and old-page regression | Independent hash pass: 66 files, only seven authorized shared files changed, none missing. Root CUA Auto Recon and Auto Settlement totals matched the pre-change browser baseline. |
| V28 | Existing shared Approval/Log behavior | Native topup filter retained the legacy seed. Root CUA confirmed the legacy Campaign Promo handler and unchanged legacy Flag Recon/Flag Settle log rows after reset. |

## Source integration assessment

- Topup metadata uses one separate localStorage key. Evidence uses a separate IndexedDB database.
- Every action rereads persisted state and validates the current account permission.
- L3 self-approval compares stable account IDs inside the action handler.
- Decided requests cannot be decided again. Successful transactions cannot receive another credit.
- L2 compares the submitted amount with the current effective amount before finalization.
- Submitted evidence becomes bound to one request. Reusing that evidence ID fails for L2.
- Request and audit actors are snapshots. Later Admin edits do not change recorded history.
- Topup logs enter the shared Log page as read-only projections. Legacy storage receives no topup records.
- Topup approval rows route to a dedicated handler before legacy reconciliation or settlement decisions.
- New CSS selectors use the topup namespace. The only shared sidebar change links Payin to its new page.
- Product handlers expose no individual log deletion. Reset remains an explicit simulator control.

## Limits and source assumptions

- The supplied reference screenshot covers only an empty Payin table. Modal details follow existing repository styling.
- The demo uses existing L2 label `Ubah Status Top Up Pengguna` and existing permission `Topup Manual`.
- The Word contains one stale mandatory-reason scenario. Explicit Acceptance Criteria and flowchart make reason optional.
- Concurrent adjustment policy, maximum amount, duplicate evidence content, and Risk review remain production questions.
- The legacy Log Export button only displays a toast. This pre-existing behavior was not changed or verified as a CSV download.
- No source or test result establishes production readiness.

## Pertanyaan untuk Dion

Tidak ada.

## Asumsi yang gue pakai

1. Simulated roles on existing named Admin accounts apply only to this topup demo.
2. Requests run sequentially for demonstration. No production concurrency policy is inferred.
3. Browser smoke checks cover the named legacy totals and handlers. They do not claim exhaustive regression coverage of every existing Auto Recon or Auto Settlement workflow.
