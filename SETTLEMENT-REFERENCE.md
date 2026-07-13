# Auto Settlement QRIS — Reference for AI Agents

> Single source of truth for the **Auto Settlement QRIS** module (page `auto-settlement.html` / `auto-settlement.js`).
> Written so another AI agent can understand every flow, feature, and page-level behavior without re-reading the whole codebase.
> Reflects code at **VERSION 1.18.2** (see `CHANGELOG.md` for the version-by-version history).

---

## 1. What this is

A **front-end mockup** (vanilla JS, no framework, no backend) of Paydia's QRIS acquirer **settlement/disbursement** back-office. It simulates the checker → approver → result workflow for paying merchants their settled QRIS funds. All data is seeded client-side and persisted to `localStorage`; "sending to bank" is mocked.

- **Repo:** https://github.com/scholus/auto-recon-mockup
- **Prod:** https://ar-mockup.vercel.app (Vercel project `ar-mockup`; behind an app login gate at `middleware.js` → `/login.html`)
- **Deploy:** push to `main` does **not** auto-deploy — deploy manually with `vercel --prod --yes` (aliased to `ar-mockup.vercel.app`). Every change bumps `VERSION` + adds an entry to `versions.js` (in-app version picker) and `CHANGELOG.md`, commits, tags `vX.Y.Z`, pushes, deploys.

---

## 2. File map (settlement-relevant)

| File | Role |
|---|---|
| `auto-settlement.html` | Page shell: topbar (bell + version picker + logout), tabs, toolbar, table, modals, filter panel. Page-scoped `<style>` block near top holds table + notif-dropdown CSS. |
| `auto-settlement.js` | **All logic** (~2100 lines): seed, group building, rendering, actions, modals, filters, export. |
| `page-guide.js` | "Panduan Halaman" content per page (object `GUIDES['auto-settlement.html']`). Keep in sync with logic. |
| `versions.js` | In-app version dropdown + changelog (topbar). Newest first; first entry = "Latest", `deployed:true`. |
| `sidebar.js` | Shared left nav. |
| `middleware.js` | Vercel edge auth gate (signed cookie); redirects unauth to `/login.html`. Gates all routes except `_next/static`. |
| `VERSION`, `CHANGELOG.md` | Version string + human changelog. |

The Auto Settlement page is one of several in the app (`index.html` reconcile, `approval.html`, `qris-mpm.html`, `dispute.html`, `settle-recon.html`, `log.html`, `admin.html`) — this doc covers **only Auto Settlement**.

---

## 3. Domain constants (top of `auto-settlement.js`)

```
CORE_BANKS      = ['BCA','BRI','MANDIRI']         // isOther(bank) = NOT in this list
ADMIN_FEE_OTHER = 6500                            // flat admin per payout for non-core banks
AUTO_HOLD_MIN   = 10000                           // "dibawah min transaksi" threshold (on Total Settle)
BIG_THRESHOLD   = 250000000                        // Rp250jt (BI-FAST cap / "big" nominal)
PER_PAGE        = 50                               // main table rows/page
SUMMARY_PER_PAGE= 10                               // Ringkasan per Bank rows/page
HOLD_PICKER_PER_PAGE = 10                          // Hold Partial MID picker rows/page
CHANNELS         = ['BCA','BRI','Mandiri','NOBU','AGI','OCBC']
METODE_TRANSFER  = ['BI-Fast','On-Us / IFT','RTGS']
STATUS_LABEL     = { checker:'Checker', pending:'Approver', hold:'Hold', reject:'Reject', settle:'Settle' }
SETTLE_STATUS_LABEL = { pending:'Pending', success:'Success', fail:'Fail', rejectbybank:'Reject by Bank' }
HOLD_STATUS_LABEL   = { belum:'Belum Diproses', siap:'Siap Release', released:'Sudah Release Checker' }
```

Note the internal status key `pending` is displayed as **"Approver"** (the pending-approval tab). `totalOf(g) = nominalAwal − admin + adjPlus − adjMinus`. Admin = `ADMIN_FEE_OTHER` only if `isOther(bank)`, else 0.

---

## 4. Data model

Three layers, all in `auto-settlement.js`:

1. **`pool`** — flat array of raw transactions (`txId, mid, bankCode, bankAccount, bankAccountName, nominalSettle, tipeSettlement, adjPlus, adjMinus, procISO, procDisplay`, optional `seedState`). Built by `buildSeedPool()`.
2. **`groups`** — settlement entries, one per **(bank + norek)** (plus split groups). Built by `buildGroups()` via `makeGroup(id, norek, txns)`. `groupId` = `STL-<norek>` (or `STL-<norek>-<bank>` if the norek exists under multiple banks); split groups = `STL-<norek>-P<n>`.
3. **`items[groupId]`** — mutable per-group **state** (`status, request, settleStatus, metodeSettlement, channel, approvedTs, approvedBy, everHeld, released, autoReq, holdScope, holdReason, updatedTs, partialLock, mergedInto, mergeInfo`). Accessed via `st(groupId)` (lazy-creates `{status:'checker',...}`). Persisted to `localStorage` (`paydia_as_items`).
4. **`splits`** — array describing Hold-Partial carve-outs (`{id, norek, bank, mids:[...], holdAmounts:{mid:amount}|null}`). Persisted (`paydia_as_splits`). `buildGroups()` reads these to carve MIDs into separate groups.

**Grouping rule:** entity key = **BANK + NOREK**. Same norek + different bank = 2 entities. Multiple MIDs on the same bank+norek = 1 settlement group. Displayed owner name = the earliest input.

**Seed** (`buildSeedPool`, applied once per `SEED_VER`): ~1000 checker, ~1000 approver/pending (settle/hold/reject requests), ~1000 hold, ~300 hold-ledger (released), ~1000 reject, ~1000 settle, ~40 merge cases, plus targeted demo rows (min-transaksi scenarios, account-detection examples with MIDs `MID-W001/W002/W003`, and 2 multi-MID noreks `883...021`/`883...022` with 15 & 23 MIDs for the Hold-Partial picker). Bumping `SEED_VER` (near bottom of file) forces a clean reseed and clears stale `localStorage`.

---

## 5. Tabs & overall flow

Tab keys (`activeTab`): `checker`, `pending` (shown as **Approver**), `hold`, `reject`, `settle`.

```
                 Checker ──(Hold / Reject / Settle request)──▶ Approver (pending)
                    │                                              │ approve → Hold / Reject / Settle
                    │                                              │ reject  → back to previous status
                    │
   auto-hold <10rb (non-core)  ─────────────────────────────────▶ Hold
   Hold Partial (locked, pending) ── approve ──▶ Hold (split) + Checker (reduced base)
                    │
   Rilis ke Checker (from Hold/Reject) ─── no approval ──▶ Checker  (+ auto-approve record shown in Approver)
   Reject by Bank (Manual, from Settle) ── no approval ──▶ Hold     (+ auto-approve record shown in Approver)
```

Every tab: **pagination 50 rows/page** (`PER_PAGE`), **search** by ID Settlement / Nama Pemilik / No. Rekening. **Export** on all tabs **except Approver**. **Bulk Aksi** only on **Checker** (Hold/Reject/Settle) and **Approver** (Approve/Reject) — Hold & Reject are per-row only.

Rendering entry points: `render()` → `computeReleasable`, `renderCounts`, `renderTabsActive`, `renderToolbarActions`, `renderTable`, `renderSummary`, `renderBulkBar`, `renderAccumSticky`. The header bell (`renderNotifBell`) is rendered once at init (`DOMContentLoaded`), not inside `render()`. Filtering: `tabGroups(tab)`.

---

## 6. Tab-by-tab behavior

### 6.1 Checker
- Actions per row (kebab): **Hold**, **Reject**, **Settle** (`actionMenuItems`, `runAction`).
- **Ringkasan Nominal per Bank Tujuan** panel (above the table, checker only): collapsible, **No column**, **pagination 10 banks/page**, stays visible even when empty. Money headers labeled `(Rp)`. `renderSummary()`.
- A locked partial-hold row (`partialLock`) blocks Hold/Reject/Settle with toast **"Data di lock menunggu approval"**.

### 6.2 Approver (`pending`)
- Shows: manual requests (`status==='pending'`) **plus** persistent **auto-approve records** (`s.autoReq`) **plus** locked pending Hold-Partial (`s.request.partialPending`). Filter at `tabGroups` pending branch.
- Manual requests → **Approval** button → `openApproverModal` → 2FA (`require2FA`, PIN 6 digits) → `approverDecide`. Also **Bulk Approve / Bulk Reject** (`bulkApproverDecide`).
- Auto-approve records → **no button**; the Aksi cell shows text `Otomatis {from} → {to}` (`autoReqText`). These are read-only notifications and **cannot be dismissed** (this replaced an earlier dismissible "Tandai Dibaca" that wrongly hid data).
- **Detail Request modal** fields: Tipe Request, (MID Dihold for partial, with per-MID amounts), Status Sebelumnya, Metode/Channel/Metode Transfer (for settle), Catatan, Bukti, **Waktu Diajukan**, **Diajukan Oleh**. Settle-with-hold-min shows notice "Akan digabung setelah approve".

### 6.3 Hold (ledger — permanent)
- Every group that was ever held (`everHeld`) stays here even after moving on.
- Status Hold column (`holdStatusKey` → `HOLD_STATUS_LABEL`): **Belum Diproses** / **Siap Release** / **Sudah Release Checker**.
- Actions: **Rilis ke Checker** (`openRilis`, no approval), **Lihat Bukti** (add/view proof), **Lihat Catatan**.

### 6.4 Reject
- Actions: **Rilis ke Checker** + **Lihat Bukti** (same as Hold — changed from the old Hold/Settle actions).

### 6.5 Settle
- Extra columns: Channel Payment, Metode Settlement, Status (`SETTLE_STATUS_LABEL`).
- Status semantics: **Pending** (Otomatis, awaiting bank callback), **Success** (Otomatis done, or Manual instant after approval), **Fail** (system/timeout), **Reject by Bank** (account invalid/frozen — lands in Hold).
- **Simulasi Status** dropdown overlays a status for preview (`simMode` / `displaySettleStatus`).
- **Retry Settlement** button: re-sends Otomatis + Fail rows (requires a date).
- **Lihat Detail** modal (`openDetailModal`) — see §8.

---

## 7. Core logic (the important flows)

### 7.1 Auto-hold below minimum
In `buildGroups()`: a `checker` group with **no request**, on a **non-core bank** (`isOther`), with `totalOf < AUTO_HOLD_MIN` → auto-moved to **Hold** with `scope:'min'`. **Core-bank (BCA/Mandiri/BRI) <Rp10.000 stays in Checker** (not auto-held).

### 7.2 Accumulation → "Siap Release"
`computeReleasable()` sums `totalOf` per norek across **checker groups + hold-min groups**. If a norek's sum **≥ Rp10.000**, all its hold-min groups become **Siap Release** (`isReleasableMinHold`). Drives the green **sticky notification** on the Checker tab (`renderAccumSticky`) — wording: *"Beberapa Settlement Hold Dibawah Min. Transaksi sudah bisa dirilis — buka tab Hold, lalu filter status Siap Release."*
- **Scenario A:** several hold-min on one norek; once their sum ≥10rb, all become Siap Release; below that, Belum Diproses.
- **Scenario B:** one hold-min (<10rb) + one Checker settlement (>10rb) on the same norek → the hold-min becomes Siap Release (checker sibling counts toward the sum).

### 7.3 Hold Partial (lifecycle — the trickiest flow)
Picker (`openHold` → `renderHoldPicker`): a **table** (No · Pilih · Merchant · MID · Dana · Hold Rp) with **10 rows/page pagination** and **search by MID / merchant name**. Selection + per-MID amounts are held in state (`holdPickerChecked`, `holdPickerAmt`) so they persist across pages/search.
- Per MID you may enter a **hold amount**: inline-validated min **Rp1**, max **(dana MID − Rp1)**; **empty = hold the whole MID's funds**. `validatePartialAmt`.
- **On submit** (`submitHold`, scope `partial`): the base settlement **stays whole in Checker** (nominal unchanged) but is **locked** (`s.partialLock=true`) and carries a pending request (`s.request.partialPending=true`). No split is created yet. It appears in **both** Checker (locked) and Approver (pending). Bukti optional (like all holds).
- **On approve** (`approverDecide`, partialPending branch): a **split** is materialized (`STL-…-P<n>`, status `hold`, `holdAmounts`), the base's nominal **reduces** by the held amounts, lock cleared. `buildGroups` rebuilds the held portion (held amount per MID) and the reduced base — **using real merchant names & MIDs** (no synthetic "sisa" row). Fully-held MIDs drop from base; partially-held MIDs stay with a reduced amount.
- **On reject:** lock cleared, request removed — base returns fully intact.
- **Dispute/chargeback cannot be Hold-Partial'd.** (An earlier attempt to specially keep chargeback in base during partial hold was reverted in v1.17.2 — dispute exclusion from settle is handled via Hold Semua / Hold Dibawah Min / Reject, not Hold Partial.)

### 7.4 Reject by Bank (per-item, Settle tab)
`openRejectByBankItem` — only for **Metode Manual** rows. Requires note + proof, then **moves directly to Hold** (`settleStatus:'rejectbybank'`) **without approval**, and writes an `autoReq` record so the Approver is notified (read-only). *No approval step.*

### 7.5 Rilis ke Checker (from Hold or Reject)
`openRilis` — moves the group back to `checker` (`released:true`), **no approval**, and writes an `autoReq` record (`{type:'rilis', from, to:'checker'}`) shown in Approver as a read-only "Otomatis … → Checker" notification.

### 7.6 Account-change detection → bell notifications
For **single-MID** groups, `accountStatus(g)` compares norek/nama/bank vs `REF_ACCOUNTS`/`NEW_MIDS` → `baru` / `notified` / `anomaly`. **No auto-hold, no table badge** (both removed). Instead `buildAcctNotifs()` + `renderNotifBell()` surface them in the **header bell** (badge count + dropdown). Two message templates: *"Merchant {MID} … terdeteksi baru pertama kali melakukan transaksi"* and *"Terdeteksi perubahan data merchant {MID}: dari nomor rekening A ke B, dari nama pemilik rekening C ke D"*. Checker reviews manually and may hold.

### 7.7 Settle merge & split at approve
On approving a **settle** request (`approverDecide`, settle branch): if BI-FAST > Rp250jt it splits (`splitBifast`, greedy 250jt + remainder); hold-min siblings on the same norek get absorbed (merged) into the settle (`mergeInfo` badge). These happen **at approve**, not at request time.

---

## 8. Detail modals

- **Detail ID Settlement** (`showSettlementDetail`): header KV (Bank, Norek, Nama, dates) + **Ringkasan Settlement** (Nominal Awal, Biaya Admin, Chargeback +/−, Total Settle) + **List Settlement** table (per-MID: No, Merchant, Jumlah Transaksi, Nominal Settle (Rp), Chargeback (+/−) (Rp), Tipe Settlement).
- **Lihat Detail** (Settle tab, `openDetailModal`): status + method KVs + **Waktu Diajukan/Disetujui + Disetujui Oleh**, then (Metode Otomatis only) expandable **REQUEST DATA** and **LOG CALLBACK**. **RESPONSE DATA was removed** (v1.18.1). Manual has no request/callback segments.
- **LOG CALLBACK** (`callbackSegment` / `callbackEvents`): models the async bank disbursement lifecycle — `DISBURSEMENT.SUBMITTED → ACCOUNT_INQUIRY → QUEUED → FORWARDED → BANK_CALLBACK` — each row = process name (left) · status badge Sukses/Pending/Gagal (middle) · timestamp (right), expandable to the process's JSON. Final `BANK_CALLBACK` status follows the settlement's `settleStatus` (success=COMPLETED, fail=FAILED, pending=PENDING, rejectbybank=REJECTED).

---

## 9. Filters, search, pagination

`defaultFilters()` → `{ start, end, banks:Set, big, mid, small, reqs:Set, settleStatuses:Set, metodeSettle, channel, holdAlasans:Set, holdStatuses:Set }`. Applied in `tabGroups`, wired via `syncFilterInputs` / `applyFilterPanel`.

- **Nominal** (all tabs, based on **Total Settle** `totalOf`): a clean partition — `small` (< Rp10.000) / `mid` (Rp10.000 – Rp250.000.000) / `big` (> Rp250.000.000). All three use `totalOf`.
- **Bank Tujuan** — multi-select checkboxes.
- **Approver only — "Tipe Request"**: multi-select checklist (Hold, Hold Partial, Hold Dibawah Min, Reject, Settle, Rilis ke Checker (Otomatis), Reject by Bank (Otomatis)). `reqMatchesValue`.
- **Hold only — "Alasan"** (Reject by Bank / Dibawah Min / Semua / Partial) & **"Status"** (Belum Diproses / Siap Release / Sudah Release Checker) — both multi-select checklists.
- **Settle only** — Status / Metode Settlement / Channel.
- **Search** (main table): ID Settlement / Nama Pemilik / No. Rekening. **Hold-Partial picker** has its own search (MID / merchant).
- Default filter = **all dates** (by Tanggal Recon).

---

## 10. Export

- **Export** (per tab, `exportTab` / `exportCols`): CSV-style columns follow the active tab; money headers carry `(Rp)`. Settle adds Channel/Metode/dates/Disetujui Oleh/Catatan.
- **Export Segregasi** (Settle only): pick a date; **Manual** data only, split **per bank tujuan** (tables A–F) + Grand Total (Adm / Hold / Released HOLD). `SEG_COLS` intentionally has **no `(Rp)`** suffix — it mirrors the bank-consumed file format.
- **Export Report Manajemen**: daily summary per method → channel → bank + recap (Total Sukses / Dirilis / Hold breakdown). Pending & Fail counts are 0 (Otomatis = Phase 2).

---

## 11. State, persistence, versioning

- `localStorage` keys: `paydia_as_items`, `paydia_as_splits`, `paydia_as_seedver`. On load, if `SEED_VER` changed, items+splits are cleared and reseeded (`DOMContentLoaded` handler).
- **Metode Otomatis submit is disabled** in the Settle form (`Otomatis (Fase 2)` option is `disabled`). Otomatis data exists only from seed (pending/fail) so the callback log has something to show; a checker cannot newly submit an Otomatis settle.
- Version picker (`versions.js`) + `VERSION` + `CHANGELOG.md` are updated together on every change; git tag `vX.Y.Z`.

---

## 12. Known simplifications / residual notes

- **Bulk actions are not partial-lock-guarded** — the "Data di lock menunggu approval" guard is in `runAction` (single kebab actions). A locked group selected via Bulk Aksi could bypass it. (Single-action path is what the flows exercise.)
- Synthetic split/base rows built during Hold-Partial approve zero out `adjPlus/adjMinus` on the reduced/held rows (mockup simplification); untouched MIDs keep their chargeback.
- No real backend: all "sent to bank" is mocked; JSON payloads in Request Data / Log Callback are generated deterministically from group state.
- One dead export-guard branch remains (`rq.scope === 'anomaly' ? '-'`) after anomaly auto-hold was removed — harmless (unreachable) and left in place deliberately.

---

*Keep this file and `page-guide.js` in sync with `auto-settlement.js` whenever settlement logic changes.*
