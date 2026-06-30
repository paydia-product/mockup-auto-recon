# Handoff — Auto Settlement (Paydia Auto Reconcile Mockup)

> Sesi pengembangan modul **Auto Settlement**. Dokumen ini merangkum apa yang dibangun, arsitektur, konvensi, cara jalanin/deploy, dan langkah berikutnya.

Tanggal handoff: 2026-06-30 · Branch: `main` · Commit terakhir: `a674cfd`
Prod: **https://ar-mockup.vercel.app** · GitHub: `scholus/auto-recon-mockup`

---

## 1. Konteks proyek

Mockup dashboard **Paydia Auto Reconcile** (QRIS Acquirer & Issuer). Stack sengaja minimalis: **vanilla multi-page HTML + JS murni, tanpa build step / framework**, state di `localStorage`. Auth lewat middleware Vercel + `/api/login`.

Modul **Auto Settlement** adalah turunan langsung dari CR `context/CR - Auto Settlement_Christian Handoko.pdf` (FM-010-IT-PAY v3.0, approved Deni Koesmanto 30/12/2025). Rencana awal di `RENCANA_AUTO_SETTLEMENT.md`.

---

## 2. File yang relevan

| File | Peran |
|------|-------|
| `auto-settlement.html` | Halaman Auto Settlement (markup tab, toolbar, modal generik, export modal, bukti viewer, progress bar). Load `auto-settlement.js?v=20260629-v12`. |
| `auto-settlement.js` | **Seluruh logika modul** (≈700 baris). Edit di sini untuk perubahan fungsional. |
| `page-guide.js` | Panduan halaman (ada entri `auto-settlement.html`). |
| `sidebar.js` | **Sidebar bersama** — sumber tunggal nav di semua halaman. Tambah menu di sini, JANGAN per-file. |
| `log.js` | Halaman Log; berisi `seedLogs` (ada 7 contoh aktivitas auto-settlement id 95001–95007). |
| `settle-recon.js` | Halaman Settle & Recon (sumber konsep tipe settlement & segregasi bank). |

**Cache-busting**: tiap perubahan JS, bump query `?v=...` di `<script>` tag halaman terkait.

---

## 3. Arsitektur Auto Settlement (`auto-settlement.js`)

### Model data
- **`pool`** — daftar transaksi (dari `localStorage.paydia_settlements` + beberapa seed demo di `loadPool()`). Tiap txn: `txId, tanggal, merchantName, mid, bankCode, bankAccount, bankAccountName, nominalSettle, tipeSettlement, adjPlus, adjMinus, procISO, procDisplay`.
- **`groups`** — unit baris tabel = **entry per nomor rekening** (`buildGroups()` group `pool` by `bankAccount`). Tiap group: `groupId('STL-'+norek), norek, bank, namaRek, txns[], nominalAwal(Σ nominalSettle), adjPlus/adjMinus(Σ), admin(6500 jika bank non-core), procDisplay`.
- **`items`** — state mutable per `groupId` di `localStorage.paydia_as_items`: `{ status, request, ... }`. `st(groupId)` getter.
- **`midSummary(g)`** — group txns per MID (untuk picker Hold Partial).
- **`midTipeSummary(g)`** — group per **MID + Tipe Settlement** (untuk tabel List Settlement; chargeback/Dispute terpisah dari Matched).

### Aturan data penting (jangan dilanggar)
- **Matched** (Reguler/Tambahan Matched): hanya `nominalSettle`, `adjPlus=adjMinus=0`.
- **Dispute** (Reguler/Tambahan Dispute): entry terpisah; `nominalSettle=0`, value-nya ada di `adjPlus`/`adjMinus`.
- `totalOf(g) = nominalAwal − admin + adjPlus − adjMinus`.
- **Bank non-core** = selain BCA/BRI/Mandiri (= "Lainnya"), kena admin flat **Rp6.500**.
- **Auto-hold**: group bank non-core dengan `totalOf < Rp10.000` otomatis ke status `hold` (scope `min`) saat load.

### State machine (status di `items[groupId].status`)
```
checker → (Hold/Reject/Settle request) → pending → Approver approve → hold | reject | settle
                                                  → Approver reject  → kembali ke request.prevStatus
hold/reject/settle → (Pindahkan →) → pending → ... (semua move WAJIB lewat approver)
```
- Tab UI: **Checker, Approver(=pending), Hold, Reject, Settle**.
- `request` objek: `{ type:'hold'|'reject'|'settle', scope:'all'|'partial'|'min'(hold), partialMids[], prevStatus, channel, metode, reason, bukti, ts }`.

### UI utama
- **Tab bar** + count per tab.
- **Toolbar**: tombol Filter (popover: date range, bank multi, Nominal>250jt, Nominal<10k, Request filter di tab Approver), Export, Bulk Action (checker), search (by ID Settlement / Nama Pemilik Rekening — hanya saat klik "Cari"), Reject by Bank (settle).
- **Tabel**: kolom No, Tanggal Proses, ID Settlement (klik → detail), Nominal Awal, Admin, Adjustment Chargeback (+/−), Total Settle, Bank, Nomor Rekening, Nama Pemilik Rekening, [Request (approver)], [Alasan (hold)], Aksi. **Tanpa "Rp" di sel.** Kebab menu (Checker/Hold/Reject/Settle); tombol "Approval" (Approver).
- **Modal Detail ID Settlement** (`detailBodyHTML`): fields (tanpa Status) + Ringkasan Settlement (admin/adj "-" jika 0) + List Settlement (group by MID+tipe, Bank = "bank - norek - pemilik", fit tanpa scroll samping).
- **Modal Approval** (Approver): isi = detail body + section "Detail Request" (Tipe Request, Status Sebelumnya, Channel Payment, Metode Transfer, Catatan, Bukti+tombol Lihat, Waktu Diajukan). Tombol Approve(hijau)/Reject(merah)/Cancel → modal konfirmasi.
- **Bukti viewer**: popup `#asBuktiOverlay` menampilkan `sample-bukti.png` (mock).
- **Export**: progress bar inline → modal "Excel Export Simulation" (header hijau, tabel fit, **tanpa kolom Status**) + Download CSV (export asli dipertahankan).

### Konstanta
- `CHANNELS = [BCA, BRI, Mandiri, NOBU, AGI, OCBC]` (Channel Payment = bank tujuan, wajib).
- `METODE_TRANSFER = [BI-Fast, RTGS, Realtime Online, LLG]` (wajib di Settle/Bulk Settle).
- `REQ_HOLD_LABEL`, `SCOPE_LABEL`, `STATUS_LABEL`, `AUTO_HOLD_MIN=10000`, `BIG_THRESHOLD=250000000`.

---

## 4. Cara jalanin & QA (lokal)

```bash
# preview lokal (bypass middleware auth karena static serve)
# .claude/launch.json sudah ada config "ar-mockup" (npx serve :3000)
```
- Preview pakai static server (`npx serve`) — **bypass middleware** (prod auth-gated). Lihat memory `preview-deploy-setup`.
- **Gotcha**: `serve` pakai clean URLs (strip `.html`) → `location.pathname` beda dari Vercel. `page-guide.js` & `sidebar.js` sudah tangani.
- QA fungsional dilakukan via DOM eval di preview (browser preview tersandbox ke localhost, TIDAK bisa buka domain eksternal).

## 5. Deploy

```bash
git add <files> && git commit -m "..." && git push origin main
vercel --prod --yes
```
Aliased ke `ar-mockup.vercel.app`. Konvensi commit: trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## 6. Limitasi yang diketahui

- **QA live tidak bisa via tooling**: browser preview tersandbox localhost + aset prod di balik login cookie (password tidak dipegang). Verifikasi fungsional dilakukan atas **kode byte-identik di lokal**; deploy live dikonfirmasi serving (login 200, aset 302). User perlu klik manual di live untuk QA visual.
- **Mock-only**: upload bukti = nama file saja (viewer tampilkan `sample-bukti.png`); 2FA/OTP, master lookup, disbursement = simulasi front-end; tidak ada backend.
- **Log id**: seed auto-settlement pakai id 95001–95007 supaya tidak bentrok dengan id log runtime (`writeLog` mulai dari 9138, increment).
- `localStorage.paydia_as_items` keyed by `groupId` — beda dari versi lama (keyed txId); aman karena boot.js tidak wipe key ini, state baru dibuat fresh.

---

## 7. Status & langkah berikutnya

**Sudah selesai (semua di prod):** modul Auto Settlement penuh — grouping per norek, tab workflow Checker→Approver→Hold/Reject/Settle, hold semua/partial(MID)/min, auto-hold <10k, adjustment chargeback (matched vs dispute terpisah), channel+metode transfer, filter (date/bank/>250jt/<10k/request), export simulasi, detail modal + approval modal + bukti viewer, move antar status via approval, seed log aktivitas.

**Kandidat lanjutan (belum dikerjakan, lihat CR/RENCANA):**
- Maker→Checker→Approver 3 PIC berbeda + device whitelist + 2FA nyata (CR risk #4) — saat ini Approver 1 layer.
- Disbursement per channel/bank dengan status Pending→Diproses→Selesai (sempat ada, kini disederhanakan ke status `settle`).
- Cut-off 14.00 + fallback manual (CR poin 9) — pernah ada, dihapus atas permintaan; pertimbangkan kembali untuk fase PRD.
- Gate "Auto Settlement hanya jalan jika Auto Recon selesai" (RENCANA) — dihapus atas permintaan; cek apakah perlu di PRD.
- Sub-menu Adjustment manual + verifikasi Finance (CR poin 3) — adjustment kini hanya dari seed dispute.
- Persistensi server / auth nyata (subject PRD per CR).

---

## 8. Referensi

- CR: `context/CR - Auto Settlement_Christian Handoko.pdf`
- Rencana awal: `RENCANA_AUTO_SETTLEMENT.md`
- Ringkasan modul lain: `SUMMARY_PEKERJAAN.md`
- Memory (auto-loaded): unmatch-type-definitions, good-faith-dispute-flow, tolak-gagal-rule-pending, preview-deploy-setup, shared-sidebar
