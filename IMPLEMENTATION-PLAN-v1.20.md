# IMPLEMENTATION-PLAN v1.20.0 — 6 perubahan

Basis: v1.19.0 (working tree bersih). File utama: `auto-settlement.js` (~2160 baris), `auto-settlement.html`.
Semua nomor baris merujuk snapshot v1.19.0 (terverifikasi ke source). Gaya ES5 (`var`, string concat, komentar ID singkat). Surgical — sentuh hanya yang perlu, hapus orphan yang perubahanmu sendiri buat.

Konvensi persist: localStorage `paydia_as_items`, `paydia_as_splits`, `paydia_as_seedver`. Tambah key baru `paydia_as_feeexempt` (Item 1).

---

## Item 1 — Bebas Admin lewat MODAL (bukan label statis)

**Maksud user:** hapus badge "BEBAS ADMIN" di baris tabel. Ganti dengan tombol → modal untuk menandai merchant (norek dari data seed) jadi bebas biaya admin. Modal ini yang memutasi daftar bebas-admin (persist), dan langsung mempengaruhi perhitungan admin di semua tab.

**State (baris 471-473):** ubah `FEE_EXEMPT_NOREKS` dari const statis jadi mutable+persist.
```js
// §Bebas Admin: daftar norek bebas admin — mutable via modal, persist di localStorage.
var FEE_EXEMPT_NOREKS = {};
var FEE_EXEMPT_DEFAULT = { '8840000000001': 'Yayasan' };
function loadFeeExempt() { try { FEE_EXEMPT_NOREKS = JSON.parse(localStorage.getItem('paydia_as_feeexempt')); } catch (e) { FEE_EXEMPT_NOREKS = null; } if (!FEE_EXEMPT_NOREKS) { FEE_EXEMPT_NOREKS = {}; Object.keys(FEE_EXEMPT_DEFAULT).forEach(function (k) { FEE_EXEMPT_NOREKS[k] = FEE_EXEMPT_DEFAULT[k]; }); } }
function saveFeeExempt() { localStorage.setItem('paydia_as_feeexempt', JSON.stringify(FEE_EXEMPT_NOREKS)); }
```
`isFeeExempt(g)` (474) tetap. `adminOf(g)` (478) tetap.

**Hapus badge tabel:** baris 749 `c += '<td>' + esc(g.namaRek) + feeExemptBadge(g) + '</td>';` → `c += '<td>' + esc(g.namaRek) + '</td>';`
Fungsi `feeExemptBadge` (483-486) jadi orphan → HAPUS fungsinya.

**KEEP:** detail-view "Bebas Admin (Rp 0)" (baris 942) — itu nilai Biaya Admin (informasi), bukan badge label. Tetap, karena digerakkan `isFeeExempt` langsung.

**Tombol toolbar (HTML ~baris 210):** tambah setelah `asExportMgmtBtn`:
```html
<button class="btn" id="asFeeExemptBtn" style="margin:0;background:#0f766e;color:#fff;border:none;"><i class="fas fa-hand-holding-dollar"></i> Kelola Bebas Admin</button>
```
Bind di `bind()` (~baris 2114, dekat mgmtBtn): `var feBtn = document.getElementById('asFeeExemptBtn'); if (feBtn) feBtn.addEventListener('click', openFeeExemptModal);`

**Modal `openFeeExemptModal()` (fungsi baru, taruh dekat area modal aksi):**
- Daftar exempt saat ini: tiap entri `norek · label` + tombol "Hapus" (`data-fe-del="<norek>"`).
- Form tambah: `<input id="asFeNorek" placeholder="Nomor rekening merchant">` + `<select id="asFeKat"><option>UMKM</option><option>Yayasan</option><option>Lainnya</option></select>` + tombol "Tambah".
- Validasi Tambah: norek harus ADA di `pool` (data seed merchant) — inilah kaitan "mempengaruhi data seed merchant". Jika tidak ada → toast "Merchant tidak ditemukan". Jika sudah exempt → toast. Sukses → `FEE_EXEMPT_NOREKS[norek] = kategori; saveFeeExempt();` lalu re-render modal + `render()` + toast.
- Hapus: `delete FEE_EXEMPT_NOREKS[norek]; saveFeeExempt();` re-render modal + `render()`.
- Cek keberadaan norek di pool: `pool.some(function (t) { return t.bankAccount === norek; })`.
- Pakai `openModal(...)`; re-render isi modal via helper `renderFeExemptBody()` yang set innerHTML `#asModalBody` bagian daftar, atau tutup+buka ulang modal (simpler). Bind tombol Hapus + Tambah setelah openModal (delegasi klik pada `#asModalBody`).

**Init (DOMContentLoaded ~baris 2154):** panggil `loadFeeExempt()` sebelum `buildGroups()`/render pertama.

**Ripple:** admin dihitung ulang otomatis (adminOf baca isFeeExempt). computeReleasable (166) baca isFeeExempt → tetap benar. Summary/export/detail ikut update saat `render()`.

**Verify browser:** klik "Kelola Bebas Admin" → tambah norek seed yang tadinya kena admin (mis. dari tab Checker, ambil satu norek non-core) → admin baris itu jadi 0 di tabel + Summary. Hapus lagi → admin balik. Reload → daftar persist. Tidak ada lagi badge "BEBAS ADMIN" di kolom Nama Pemilik Rekening.

**Risk:** norek exempt yang bank-nya core (BCA/Mandiri/BRI) memang admin 0 juga secara aturan → efek tak kelihatan; validasi pool mencegah norek ngawur. Pastikan `pool` sudah terisi saat modal dibuka (init urutan benar).

---

## Item 2 — Filter Hold: "Sudah Ada Bukti" / "Belum Ada Bukti"

**HTML (auto-settlement.html, setelah section Status Hold, baris 272):** tambah section baru:
```html
<div class="filter-section" id="asFilterHoldBuktiSection" style="margin-top:16px; display:none;">
    <span class="filter-section-title">Bukti</span>
    <div style="display:flex; flex-direction:column; gap:8px;">
        <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer;"><input type="checkbox" class="as-fbukti" value="ada"> Sudah Ada Bukti</label>
        <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer;"><input type="checkbox" class="as-fbukti" value="belum"> Belum Ada Bukti</label>
    </div>
</div>
```

**JS:**
- `defaultFilters()` (180): tambah `holdBukti: new Set()`.
- Helper: `function hasBukti(g) { var s = st(g.groupId); return !!(s.request && s.request.bukti); }` (samakan dgn reminder baris 99).
- Filter (blok hold, baris 543-546): tambah
  ```js
  if (f.holdBukti && f.holdBukti.size > 0 && !f.holdBukti.has(hasBukti(g) ? 'ada' : 'belum')) return false;
  ```
- `syncFilterInputs` (setelah baris 2070): toggle visibility section (`isHold`) + centang dari filters.holdBukti:
  ```js
  var hbEl = document.getElementById('asFilterHoldBuktiSection'); if (hbEl) hbEl.style.display = isHold ? 'block' : 'none';
  document.querySelectorAll('.as-fbukti').forEach(function (cb) { cb.checked = (filters.holdBukti || new Set()).has(cb.value); });
  ```
- `applyFilterPanel` (setelah baris 2088):
  ```js
  filters.holdBukti = (activeTab === 'hold') ? new Set(Array.from(document.querySelectorAll('.as-fbukti:checked')).map(function (c) { return c.value; })) : new Set();
  ```

**Verify browser:** tab Hold → Filter → centang "Belum Ada Bukti" → hanya baris tanpa bukti muncul; "Sudah Ada Bukti" → hanya yang ada bukti. Keduanya dicentang = semua. Pindah tab lain → section Bukti tersembunyi.

**Risk:** bukti presence pakai `s.request.bukti` — untuk ledger hold yang sudah rilis (`everHeld` tapi status bukan hold) `request` bisa null → `hasBukti` false ('belum'). Konsisten dgn definisi. OK.

---

## Item 3 — Timestamp tanggal+waktu di notifikasi lonceng

**buildAcctNotifs (71-90):** tambah `ts` ke tiap objek notif = `g.procDisplay` (waktu transaksi/deteksi). Dua tempat push (baris 78 & 86): tambah `ts: g.procDisplay`.

**buildReminderNotifs (94-105):** reminder agregat → `ts: todayProc()` (waktu generate). Tambah `ts: todayProc()` ke kedua objek push (baris 103 & 104).

**renderNotifBell (114-118):** render ts sebagai baris kecil muted di bawah body:
```js
return '<div class="notif-item"><span class="ni-ico" style="background:' + col + '22;color:' + col + ';"><i class="fas ' + ico + '"></i></span><span class="ni-body">' + esc(nt.text) +
    (nt.ts ? '<span style="display:block;margin-top:4px;font-size:0.68rem;color:var(--text-muted);"><i class="far fa-clock"></i> ' + esc(nt.ts) + '</span>' : '') + '</span></div>';
```

**Verify browser:** klik lonceng → tiap item punya baris waktu (dd-mm-yyyy hh:mm:ss untuk acct notif; dd-mm-yyyy hh:mm untuk reminder via todayProc). Badge count tetap.

**Risk:** `todayProc()` format `dd-mm-yyyy hh:mm`; `procDisplay` format `dd-mm-yyyy hh:mm:ss`. Beda detik — dapat diterima (dua sumber waktu berbeda). Tidak perlu diseragamkan.

---

## Item 4 — Export tab Settle: grouping per norek + subtotal

**Sekarang (exportRowData settle, 1652-1664):** 1 baris per MID per group (breakdown per norek sudah ada). **Tambah:** kelompokkan baris per norek + sisipkan baris SUBTOTAL per norek.

**Rework exportRowData settle branch:**
```js
if (activeTab === 'settle') {
    var byNorek = {}, order = [];
    rows.forEach(function (g) {
        var s = st(g.groupId); var rq = s.request || {};
        midTipeSummary(g).forEach(function (m) {
            if (!byNorek[g.norek]) { byNorek[g.norek] = []; order.push(g.norek); }
            byNorek[g.norek].push([g, s, rq, m]);
        });
    });
    var out = [], no = 0;
    order.forEach(function (nr) {
        var sub = { count: 0, nominal: 0, adjP: 0, adjM: 0 };
        byNorek[nr].forEach(function (t) {
            var g = t[0], s = t[1], rq = t[2], m = t[3];
            out.push([++no, g.groupId, g.procDisplay, g.bank, g.norek, g.namaRek,
                m.merchant, m.mid, m.count, m.total, m.adjPlus || 0, m.adjMinus || 0, m.tipe,
                s.channel || rq.channel || '-', s.metodeSettlement || '-',
                SETTLE_STATUS_LABEL[displaySettleStatus(g)] || '-', s.approvedTs || '-', s.approvedBy || '-']);
            sub.count += m.count; sub.nominal += m.total; sub.adjP += (m.adjPlus || 0); sub.adjM += (m.adjMinus || 0);
        });
        var subRow = ['', 'SUBTOTAL', '', '', nr, '', '', '', sub.count, sub.nominal, sub.adjP, sub.adjM, '', '', '', '', '', ''];
        subRow._sub = true;   // marker untuk styling preview
        out.push(subRow);
    });
    return out;
}
```
(kolom persis 18 = exportCols() settle.)

**showExportPreview (1694-1696):** style baris subtotal:
```js
document.getElementById('asExportBody').innerHTML = data.map(function (row) {
    var tr = row._sub ? '<tr style="background:#f1f5f9;font-weight:700;">' : '<tr>';
    return tr + row.map(function (v, c) { return '<td>' + fmt(c, v) + '</td>'; }).join('') + '</tr>';
}).join('');
```
`fmt` sudah format angka di kolom (Rp) → sel subtotal nominal/adj ikut terformat. Sel non-angka subtotal = '' (kosong) → tampil rapi.

**downloadCsv:** tanpa perubahan — baris subtotal ikut ter-emit (label "SUBTOTAL" di kolom ID Settlement, norek di kolom Nomor Rekening, sums di kolom uang). `_sub` (prop non-enumerable via assignment) tidak mengganggu `row.map`.

**Verify browser:** tab Settle → Export → preview: baris MID terkelompok per norek, tiap grup diakhiri baris SUBTOTAL abu-abu dgn total Jumlah Transaksi/Nominal/Adj. Download CSV → baris subtotal ada. Multi-MID group tetap breakdown per MID.

**Risk:** `_sub` sebagai properti array — pastikan tidak di-`JSON.stringify` sebelum dipakai (data dipassing langsung, bukan via localStorage) → aman. No numbering pada subtotal (No kosong).

---

## Item 5 — Warning catatan di settle (hapus hint Fase API)

**Const baru (dekat noteField ~959):**
```js
var SETTLE_NOTE_WARNING = '<div style="margin-top:8px;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;font-size:0.76rem;color:#92400e;"><i class="fas fa-triangle-exclamation"></i> <b>Perhatian!</b> Catatan yang ditulis akan menjadi deskripsi transfer ke bank pada settlement otomatis.</div>';
```

**openSettle (1189-1190):** hapus hint Fase API, tambah warning:
```js
metodeSettlementField() + channelField() + metodeField() + noteField(false) + SETTLE_NOTE_WARNING + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG/ZIP/RAR)');
```

**openBulkSettle (1308):** bulk modal pertama tak punya note field — tambahkan warning sebagai notice informatif setelah metode/channel:
```js
var body = '<p ...>Bulk settle <b>' + selected.size + '</b> entry terpilih.</p>' + metodeSettlementField() + channelField() + metodeField() + SETTLE_NOTE_WARNING;
```
> Asumsi: warning muncul di single settle + bulk settle (dua entry point yang user sebut). Tidak menambah input catatan ke bulk (bulk memang tak berkatatan) — warning bersifat pemberitahuan. Jangan tambahkan warning ke noteField generik (hold/reject/bulk-hold tetap tanpa warning).

**JANGAN sentuh** baris 1624 (label detail-view "tertaut deskripsi transaksi bank — Fase API") — string berbeda, konteks berbeda (view request tersubmit), tidak disebut user. Biarkan.

**Verify browser:** Checker → aksi Settle single → modal tampil banner "Perhatian! …" (bukan hint Fase API). Bulk Settle → modal pertama tampil banner sama. Aksi Hold/Reject → TIDAK ada banner.

---

## Item 6 — Konfirmasi Bulk Settle: breakdown per bank jadi TABEL (5/hal, searchable)

**Sekarang:** `settleGroupedHTML(arr)` (1135-1156) render kartu per bank. Dipakai di (a) settleSummaryHTML→konfirmasi bulk settle (1161), (b) bulk approve (1238). **Item ini hanya untuk konfirmasi bulk settle** → ganti pemakaian di settleSummaryHTML saja; bulk approve (1238) TETAP pakai settleGroupedHTML lama.

**Fungsi baru `settleBankTable(arr)`:** precompute breakdown per bank, render search input + container tabel (5 bank/halaman). Kolom: No · Bank Tujuan · Jumlah Rekening · Total (Rp). Grand total footer.

State module (dekat var lain di atas, mis. dekat holdPicker state):
```js
var _sbtPage = 1, _sbtSearch = '', _sbtData = [];
```
Builder:
```js
function settleBankTable(arr) {
    var byBank = {};
    arr.forEach(function (g) { var b = byBank[g.bank] = byBank[g.bank] || { bank: g.bank, noreks: [], total: 0 }; b.noreks.push(g.norek); b.total += totalOf(g); });
    _sbtData = Object.keys(byBank).sort().map(function (b) { return byBank[b]; });
    _sbtPage = 1; _sbtSearch = '';
    var grand = arr.reduce(function (a, g) { return a + totalOf(g); }, 0);
    return '<div style="font-weight:700;font-size:0.85rem;margin:12px 0 8px;">Breakdown per Bank Tujuan</div>' +
        '<input type="text" id="asSbtSearch" placeholder="Cari nama bank / nomor rekening…" style="width:100%;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:0.82rem;margin-bottom:8px;">' +
        '<div id="asSbtBody"></div>' +
        '<div class="as-kv" style="margin-top:6px;border-top:2px solid #cbd5e1;padding-top:10px;"><span style="font-weight:700;">Grand Total Settlement</span><span style="font-weight:800;">' + rupiah(grand) + '</span></div>';
}
function _sbtFiltered() {
    var q = _sbtSearch.trim().toLowerCase();
    if (!q) return _sbtData;
    return _sbtData.filter(function (d) { return d.bank.toLowerCase().indexOf(q) !== -1 || d.noreks.some(function (n) { return String(n).indexOf(q) !== -1; }); });
}
function renderSbtBody() {
    var box = document.getElementById('asSbtBody'); if (!box) return;
    var list = _sbtFiltered(), PER = 5, pages = Math.max(1, Math.ceil(list.length / PER));
    if (_sbtPage > pages) _sbtPage = pages;
    var slice = list.slice((_sbtPage - 1) * PER, _sbtPage * PER);
    var rowsHtml = slice.length ? slice.map(function (d, i) {
        return '<tr><td style="padding:6px 10px;">' + ((_sbtPage - 1) * PER + i + 1) + '</td><td style="padding:6px 10px;font-weight:600;">' + esc(d.bank) + '</td>' +
            '<td style="padding:6px 10px;text-align:right;">' + d.noreks.length + '</td><td style="padding:6px 10px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;">' + rupiah(d.total) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" style="padding:10px;text-align:center;color:var(--text-muted);">Tidak ada bank cocok.</td></tr>';
    var nav = pages > 1 ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:0.78rem;">' +
        '<button type="button" class="btn" data-sbt="prev" style="padding:4px 10px;"' + (_sbtPage <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button>' +
        '<span>Hal ' + _sbtPage + '/' + pages + ' · ' + list.length + ' bank</span>' +
        '<button type="button" class="btn" data-sbt="next" style="padding:4px 10px;"' + (_sbtPage >= pages ? ' disabled' : '') + '>Berikutnya ›</button></div>' : '';
    box.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;"><thead><tr style="background:#f8fafc;text-align:left;">' +
        '<th style="padding:6px 10px;">No</th><th style="padding:6px 10px;">Bank Tujuan</th><th style="padding:6px 10px;text-align:right;">Jumlah Rekening</th><th style="padding:6px 10px;text-align:right;">Total (Rp)</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' + nav;
}
function bindSbt() {
    var s = document.getElementById('asSbtSearch'); if (!s) return;
    s.addEventListener('input', function () { _sbtSearch = this.value; _sbtPage = 1; renderSbtBody(); });
    var box = document.getElementById('asSbtBody');
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-sbt]'); if (!b) return; if (b.dataset.sbt === 'prev' && _sbtPage > 1) _sbtPage--; if (b.dataset.sbt === 'next') _sbtPage++; renderSbtBody(); });
    renderSbtBody();
}
```

**settleSummaryHTML (1158-1161):** ganti `settleGroupedHTML(arr)` → `settleBankTable(arr)`.

**openBulkSettle konfirmasi (1321):** setelah `openModal('Konfirmasi Bulk Settle', settleSummaryHTML(...), [...])`, panggil `bindSbt();` (elemen sudah ada di DOM setelah openModal). Sisipkan tepat setelah pemanggilan openModal konfirmasi tersebut, sebelum penutup onClick.

**Verify browser:** pilih >5 bank berbeda via Bulk Settle → modal konfirmasi tampil tabel 5 baris/halaman, tombol pagination jalan, search "BCA" filter ke bank, search norek → bank pemilik norek itu tampil. Grand total benar. Bulk Approve (breakdown) TETAP kartu lama (tak berubah).

**Risk:**
- Binding setelah openModal: pastikan openModal tidak async / mengganti innerHTML setelah bind. Cek `openModal` men-set body sekali lalu selesai.
- Fokus search input hilang saat renderSbtBody? Kita hanya re-render `#asSbtBody`, input `#asSbtSearch` di luar container → fokus tetap. OK.
- `settleBankTable` reset `_sbtPage/_sbtSearch` tiap dibangun → state bersih tiap buka modal.

---

## Versi & sinkronisasi (Step akhir)

- `VERSION`: 1.19.0 → **1.20.0**.
- `versions.js`: entri baru 1.20.0 paling atas `deployed:true`; 1.19.0 → `deployed:false`.
- `CHANGELOG.md`: entri 1.20.0 (Added/Changed/Removed, Bahasa Indonesia).
- **SEED_VER:** hanya bump bila baris seed berubah. Rencana ini TIDAK mengubah baris seed (Item 1 pakai key persist baru `paydia_as_feeexempt`, seed row OCBC tetap). → **tidak perlu bump SEED_VER** kecuali implementer terpaksa mengubah seed. (Tetap aman: key feeexempt diinisialisasi dari default saat load pertama.)
- HTML cache-buster (`?v=` pada `<script>/<link>` auto-settlement) — bump.
- `page-guide.js` `GUIDES['auto-settlement.html']`: sync — tombol Kelola Bebas Admin, filter Hold Bukti, timestamp notifikasi, export Settle subtotal per norek, warning catatan settle, tabel breakdown bulk settle.
- `SETTLEMENT-REFERENCE.md`: sync bagian terkait (bebas admin jadi mutable via modal, filter hold, export settle subtotal, breakdown table).

## Cek wajib sebelum lapor
- `node -c auto-settlement.js`, `node -c versions.js`, `node -c page-guide.js` lolos.
- `rtk proxy grep -n "feeExemptBadge" auto-settlement.js` → 0 sisa (orphan terhapus).
- Tidak ada `addEventListener` ke elemen null di `bind()` (Item 1 tombol pakai guard `if (feBtn)`).
- JANGAN commit/tag/push/deploy — itu tugas orchestrator.
