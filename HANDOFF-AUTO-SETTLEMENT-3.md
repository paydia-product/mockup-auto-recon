# Handoff — Auto Settlement Sesi 3

> Lanjutan dari `HANDOFF-AUTO-SETTLEMENT-2.md`. Dokumen ini merangkum perubahan yang dikerjakan di sesi ini.

Tanggal handoff: 2026-07-01 · Branch: `main` · Commit terakhir: lihat `git log -1`
Prod: **https://ar-mockup.vercel.app** · GitHub: `scholus/auto-recon-mockup`

---

## Perubahan di Sesi Ini

### 1. Tab Checker — Field Metode Settlement di Modal Settle

File: `auto-settlement.js` — fungsi `openSettle()`, `metodeSettlementField()`

**Sebelumnya:** modal Settle Transaksi tidak ada field Metode Settlement.

**Sesudahnya:**
- Tambah field **Metode Settlement** (mandatory, `*`) sebagai field pertama di modal, di atas Channel Payment.
- Opsi: **Manual** / **Otomatis**.
- Note inline muncul saat opsi dipilih:
  - Manual → background kuning: "Sistem hanya mencatat settlement, tidak mengirim uang ke bank."
  - Otomatis → background hijau: "Sistem mencatat settlement dan mengirim uang ke bank secara otomatis."
- Nilai tersimpan di `s.request.metodeSettlement` dan diteruskan ke `s.metodeSettlement` saat Approver approve.
- Toast konfirmasi sesuai metode yang dipilih.

### 2. Tab Settle — Sistem Status + Sim Buttons

File: `auto-settlement.js` — `SETTLE_STATUS_LABEL`, `SETTLE_STATUS_COLOR`, `simMode`, `displaySettleStatus()`

**Kolom Status baru:**
- `columnsFor('settle')` sekarang append kolom `Status`.
- Nilai kolom diambil dari `displaySettleStatus(g)`, bukan langsung `s.settleStatus`.
- Badge warna: Pending (amber), Success (hijau), Fail (merah), Reject by Bank (ungu).

**Flow status item:**
```
Approver approve → s.settleStatus = 'pending', s.metodeSettlement = <dari request>
Sim Fail aktif → tampil sebagai Fail
Sim Reject by Bank aktif → tampil sebagai Reject by Bank
Tidak ada sim aktif → tampil sesuai s.settleStatus (defaultnya 'pending' / 'success' untuk seed)
```

**Sim Buttons (toolbar Settle):**
- **Simulasi Fail** dan **Simulasi Reject by Bank** — mutual-exclusive toggle.
- Klik salah satu → `simMode` = `'fail'` / `'rejectbybank'`, tabel re-render.
- Klik tombol aktif → `simMode = null`, kembali ke status asli.
- Implementasi: `renderToolbarActions()` untuk `activeTab === 'settle'`.

**Demo seed (`seedDemoSettle()`):**
- Berjalan hanya saat `localStorage` kosong (first load).
- Seed dua item: `STL-3847075823` (Otomatis, success) + `STL-7100099887766` (Manual, pending).

### 3. Tab Settle — Hapus Bulk Settle

- `hasCb` tidak lagi include `'settle'`.
- `renderBulkBar()`: `bulkTabs = ['checker', 'hold', 'reject']` (settle dihapus).
- `renderToolbarActions()` untuk settle: tidak render `bulkBtn`.

### 4. Tab Settle — Kebab Menu Baru

`actionMenuItems(g)` untuk settle:
- **Hanya** `['detail', 'Lihat Detail']` sebagai default.
- Jika `s.metodeSettlement === 'Manual'`: tambah `['rejectbybank_item', 'Reject by Bank']`.
- Hold dan Reject dihapus dari settle kebab.

### 5. Tab Settle — Reject by Bank Per-Row (Manual Only)

Fungsi `openRejectByBankItem(g)`:
- Muncul di kebab khusus item dengan `metodeSettlement = 'Manual'`.
- Konfirmasi → set `s.settleStatus = 'rejectbybank'` langsung (tidak perlu approval).
- Berbeda dari `openRejectByBank()` lama (toolbar, lewat approval) yang kini dead code.

### 6. Tab Settle — Filter Tambahan

File: `auto-settlement.html` (filter panel), `auto-settlement.js` (`tabGroups`, `syncFilterInputs`, `applyFilterPanel`, `defaultFilters`)

- Filter panel di kanan: tambah seksi **Status** (checkbox: Pending, Success, Fail, Reject by Bank) dan **Metode Settlement** (dropdown: Manual, Otomatis).
- Seksi ini hanya tampil saat `activeTab === 'settle'`.
- `defaultFilters()` sekarang include `settleStatuses: new Set()` dan `metodeSettle: ''`.
- `tabGroups('settle')` filter by `displaySettleStatus(g)` dan `s.metodeSettlement`.

### 7. Modal Lihat Detail (Tab Settle)

Fungsi `openDetailModal(g)` — baru, dipanggil dari `runAction('detail', g)`.

**Field yang ditampilkan (urut dari atas):**
1. Status (badge warna)
2. Metode Settlement
3. Catatan
4. Bukti (tombol Lihat saja, tanpa nama file)
5. Waktu Diajukan
6. Waktu Disetujui
7. **REQUEST DATA** — expandable (default collapsed), JSON request payload
8. **RESPONSE DATA** — expandable (default expanded), JSON response mock

**Yang dihapus:** ID Settlement, Tipe Request.

**Expandable sections** (`expandSection()`, `setupExpanders()`):
- ID unik per instance (`_expCnt` counter).
- Header klik toggle body + chevron icon.
- `setupExpanders(container)` dipanggil setelah `openModal()` untuk bind event.

**Mock JSON:**
- `mockReqJson(g)`: settlement_id, nominal, bank info, channel, metode.
- `mockResJson(g)`: berubah sesuai `displaySettleStatus(g)` — success/fail/rejectbybank/pending.

### 8. Modal Lihat Catatan (Hold / Reject)

Fungsi `openCatatanModal(g)` — diperbarui.

- Tambah field **Waktu Disetujui** di bawah Waktu Diajukan (dari `s.approvedTs`).
- Bukti: tidak tampilkan nama file, hanya tombol "Lihat" (atau "tidak ada").

### 9. Approver — Data Baru Saat Approve

Fungsi `approverDecide(g, approve)`:
- Saat approve type `'settle'`: set `s.settleStatus = 'pending'`, `s.metodeSettlement = rq.metodeSettlement`, `s.channel = rq.channel`.
- Semua type: set `s.approvedTs = todayProc()`.

---

## State Saat Ini (`auto-settlement.js` v20260701-v16)

### State item (per groupId)

```javascript
{
  status: 'checker' | 'pending' | 'hold' | 'reject' | 'settle',
  request: { type, metodeSettlement?, channel?, metode?, scope?, reason, bukti, ts, prevStatus },
  settleStatus: null | 'pending' | 'success' | 'fail' | 'rejectbybank',
  metodeSettlement: null | 'Manual' | 'Otomatis',
  approvedTs: null | string,  // todayProc() saat Approver approve
  channel: string,
  // ... adjPlus, adjMinus, note, bukti
}
```

### Toolbar per tab

| Tab | Toolbar Actions |
|-----|----------------|
| Checker | Bulk Settle |
| Approver | — |
| Hold | Bulk Settle |
| Reject | Bulk Settle |
| Settle | Simulasi Fail · Simulasi Reject by Bank |

### Kebab menu per tab

| Tab | Item Kebab |
|-----|-----------|
| Checker | Hold · Reject · Settle |
| Approver | (tombol Approval, bukan kebab) |
| Hold | Reject · Settle · Lihat Catatan |
| Reject | Hold · Settle · Lihat Catatan |
| Settle (Otomatis) | Lihat Detail |
| Settle (Manual) | Lihat Detail · Reject by Bank |

### Filter panel

| Seksi | Tampil di Tab |
|-------|--------------|
| Date Range | Semua |
| Nominal | Semua |
| Bank | Semua |
| Request | Approver saja |
| Status | Settle saja |
| Metode Settlement | Settle saja |

---

## File yang Dimodifikasi di Sesi Ini

| File | Perubahan |
|------|-----------|
| `auto-settlement.js` | Semua perubahan logika; bump cache version → `v20260701-v16` |
| `auto-settlement.html` | Tambah filter seksi Status + Metode Settlement di panel; bump JS cache version |

---

## Catatan Penting

- **`simMode`** adalah global var (`null | 'fail' | 'rejectbybank'`). Reset otomatis saat pindah tab (via `resetForTab()`).
- **`displaySettleStatus(g)`** selalu dipakai untuk menampilkan status — jangan langsung baca `s.settleStatus` di UI.
- **`_expCnt`** counter global untuk ID expandable section, terus naik per sesi — tidak perlu di-reset.
- **`seedDemoSettle()`** hanya jalan sekali (first load, `localStorage` kosong). Jika ingin ulang seed, clear localStorage dulu.
- **`openRejectByBank()`** lama (toolbar, per-bank, lewat approval) masih ada di kode sebagai dead code — belum dihapus.

---

## Referensi

- Handoff sesi sebelumnya: `HANDOFF-AUTO-SETTLEMENT-2.md`
- File utama logika: `auto-settlement.js`
- File HTML: `auto-settlement.html`
