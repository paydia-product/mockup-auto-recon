# IMPLEMENTATION PLAN — Auto Settlement QRIS v1.19.0

> Rencana eksekusi 11 perubahan user. Ditulis oleh planner (Fable 5) setelah verifikasi langsung ke source per v1.18.3.
> **Semua nomor baris merujuk file SEBELUM diedit** (anchor = nama fungsi; nomor baris akan bergeser saat mengedit — kerjakan sesuai URUTAN di bawah, dan cari via nama fungsi, bukan nomor baris mentah).
> File utama: `auto-settlement.js` (2130 baris), `auto-settlement.html` (435 baris), `page-guide.js` (GUIDES['auto-settlement.html'] baris 36–80), `versions.js`, `CHANGELOG.md`, `VERSION`, `SETTLEMENT-REFERENCE.md`.

## Temuan verifikasi (REFERENCE vs kode)

- REFERENCE akurat kecuali hal kecil: `openRejectByBank()` (js:1446, toolbar-level "kept for programmatic use") **tidak di-bind ke tombol mana pun** — dead code yang membuat request type `'reject'`. Akan dihapus di Item 2.
- `renderNotifBell()` hanya dipanggil sekali di `DOMContentLoaded` (js:2129) — untuk Item 5 harus ikut dipanggil dari `render()` agar reminder mengikuti perubahan state.
- `showExportPreview` (js:1655) memformat angka hard-coded kolom index 4–8 — relevan untuk Item 6.
- `fileField` hint strings tersebar di 7 call-site (openHold, openReject, openSettle, openBulkHold, openBulkReject, openRejectByBankItem, openCatatanModal) — relevan Item 10.

## Urutan eksekusi (WAJIB ikuti — dependensi ditandai)

| Step | Item | Alasan urutan |
|---|---|---|
| 1 | Item 2 — hapus aksi & tab Reject | Ripple terbesar; menyentuh seed, HTML, banyak fungsi. Kerjakan dulu supaya item lain tidak perlu di-rebase. |
| 2 | Item 3 — default view hari berjalan | Mengubah seed (tanggal). Harus sebelum Item 1/4 yang juga menyentuh seed. |
| 3 | Item 1 — fix admin dobel (adminOf) | Mengubah `totalOf` path + seed skenario min. Item 4 bergantung pada `adminOf()`. |
| 4 | Item 4 — flag bebas admin | **Bergantung Item 1** (pakai `adminOf`). Tambah seed. |
| 5 | Item 11 — checklist rilis-gabung di Hold | Bergantung Item 1 (nilai totalOf hold) & Item 2 (bulk bar sudah bersih dari Reject). |
| 6 | Item 5 — 2 reminder bell | Independen. |
| 7 | Item 6 — export Settle per MID | Independen. |
| 8 | Item 7 — Retry ganti channel | Independen. |
| 9 | Item 8 — hint Catatan settle (fase API) | Independen. |
| 10 | Item 9 — hapus "jumlah transaksi" di breakdown | Independen (1 fungsi). |
| 11 | Item 10 — bukti ZIP/RAR + Download | Independen. |
| 12 | Versioning + dokumentasi | Terakhir: `VERSION`, `versions.js`, `CHANGELOG.md`, `SEED_VER`, `page-guide.js`, `SETTLEMENT-REFERENCE.md`. |

Setelah tiap step: `node -c auto-settlement.js` (bila `grep --include` error di Bash, pakai `rtk proxy grep ...`).

**SEED berubah di Item 1, 2, 3, 4 → WAJIB bump `SEED_VER`** (js:2115, sekarang `'2026-07-08-callback-picker-table'`) → ganti mis. `'2026-07-17-v1.19.0-no-reject-today-admin'`. Cukup sekali di akhir.

---

## ITEM 2 — Hapus aksi & tab Reject (tab jadi 4: Checker, Approver, Hold, Settle)

**Keputusan desain:**
- **Seed reject dihapus total, bukan dikonversi.** Section 5 (~1000 baris status `reject`) dihapus; distribusi request `reject` di section 2 direalokasikan ke settle/hold. Konversi tidak berguna — data mockup lain sudah ribuan.
- **Approver tetap punya tombol "Reject" (menolak request)** — itu keputusan approval, bukan aksi/tab Reject settlement. `approverDecide(g, false)` (balik ke `prevStatus`) tetap.
- **Reject by Bank tetap ada** (per-row di tab Settle → langsung Hold, auto, `openRejectByBankItem` js:1467) — tidak disentuh, termasuk scope `rejectbybank`, filter Alasan hold, `AUTOREQ_LABEL.rejectbybank`.
- `STATUS_LABEL.reject` **dihapus**; `AUTOREQ_TAB.reject` dihapus.

### Perubahan `auto-settlement.js`

1. **Konstanta:**
   - js:27 `STATUS_LABEL` → `{ checker: 'Checker', pending: 'Approver', hold: 'Hold', settle: 'Settle' }`.
   - js:123 `AUTOREQ_TAB` → hapus `reject: 'Reject'`.
2. **Seed `buildSeedPool()`:**
   - js:253–259 section 2 (APPROVER): hapus cabang `else req = { type: 'reject', ... }`; ganti distribusi: `if (t < 0.5) req = settle...; else req = hold...` (hold scope tetap `_pick(['all','partial','min'])`).
   - js:276–277 section 5 (REJECT ~1000): **hapus seluruh loop**.
   - js:294–296 section 8(b) (`autoReq from:'reject'`): **hapus blok (b)**; (a) dan (c) tetap. Update komentar section 8 ("2 kasus: hold→checker, settle→hold").
3. **Filter:** js:166 `reqMatchesValue` → hapus baris `if (v === 'reject') ...`.
4. **Render:**
   - js:630 `renderCounts` → array jadi `['checker','pending','hold','settle']`.
   - js:717–720 badge Request di tab pending: hapus cabang warna/label `reject` → `var col = rq.type === 'settle' ? '#16a34a' : (rq.type === 'rejectbybank' ? '#7c3aed' : '#b45309');` dan label tanpa cabang `'Reject'`.
5. **Aksi:**
   - js:756 `actionMenuItems` checker → `[['hold','Hold'],['settle','Settle']]`.
   - js:760 hapus cabang `if (activeTab === 'reject') ...`.
   - js:835 `renderBulkBar` avail → `{ checker: ['hold', 'settle'], pending: ['approve', 'rejectreq'] }`.
   - js:840 hapus `setBtn('asBulkReject', 'reject');`.
   - js:1091–1104 **hapus fungsi `openReject`**.
   - js:1245–1261 **hapus fungsi `openBulkReject`**.
   - js:1446–1464 **hapus fungsi `openRejectByBank`** (dead code, membuat request `reject`).
   - js:1909 `runAction` guard partialLock → `if ((act === 'hold' || act === 'settle') && ...)`.
   - js:1913 hapus `else if (act === 'reject') openReject(g);`.
   - js:1977 `openCatatanModal` fallback → `type: 'hold'` (hapus ternary `activeTab === 'reject'`).
6. **Export:**
   - js:1621 hapus cabang `if (activeTab === 'reject') return EXPORT_COLS.concat([...])` di `exportCols`.
   - js:1636–1637 hapus cabang `else if (activeTab === 'reject')` di `exportRowData`.
   - js:1634 `hStat` di cabang hold: hapus ternary `s.status === 'reject' ? 'Reject' : ` (tak terjangkau lagi).
7. **Bind:** js:2084 hapus `document.getElementById('asBulkReject').addEventListener(...)` (elemen HTML-nya juga dihapus — kalau listener dibiarkan, JS error null).
8. **`openRilis`** (js:1922): komentar `// 'hold' atau 'reject'` → `// 'hold'`. Logika tetap (from = s.status = 'hold').

### Perubahan `auto-settlement.html`
- html:199 hapus `<button class="as-tab" data-tab="reject">Reject <span id="cnt-reject">…</span></button>`.
- html:252 hapus checkbox filter Tipe Request `value="reject"` (baris `<label>…class="as-freq" value="reject"> Reject</label>`).
- html:338 hapus tombol `<button ... id="asBulkReject">…Bulk Reject</button>` (JANGAN tertukar dengan `asBulkRejectReq` html:336 — itu Bulk Reject request di Approver, TETAP ada).

### Ripple lain (verifikasi saat implement)
- `tabGroups` tidak butuh perubahan (cabang generic `s.status !== tab`).
- `approverDecide` js:1410 `s.status = rq.type` — aman: rq.type tinggal `settle`/`hold` (+`rejectbybank` khusus). `prevStatus` display js:1330 pakai `STATUS_LABEL[rq.prevStatus] || 'Checker'` — fallback aman.
- `writeLog` string bebas — tidak perlu diubah kecuali di fungsi yang dihapus.
- localStorage lama berisi status `reject` → dibersihkan oleh bump `SEED_VER`.
- `page-guide.js` & `SETTLEMENT-REFERENCE.md` — lihat Step 12.

### Verifikasi browser
1. Buka `auto-settlement.html` (clear localStorage / seed baru). Tab hanya 4: Checker, Approver, Hold, Settle.
2. Checker → kebab baris → hanya **Hold, Settle** (tidak ada Reject). Bulk Aksi → hanya Bulk Hold & Bulk Settle.
3. Approver → filter Tipe Request tidak ada opsi "Reject"; badge Request tidak pernah "Reject"; tombol Approval → modal tetap punya tombol **Reject** (menolak request) → reject sebuah hold request → data balik ke Checker.
4. Settle → kebab baris Manual → **Reject by Bank** masih ada → isi catatan+bukti → masuk Hold dgn alasan Reject by Bank; Approver mencatat "Otomatis Settle → Hold".
5. Console tanpa error (cek listener `asBulkReject` sudah dicabut).

### Risiko
- Lupa mencabut listener `asBulkReject` di `bind()` → `TypeError: null` mematikan seluruh init. Ini kegagalan paling mungkin — cek pertama.
- Salah hapus `asBulkRejectReq` (Approver) alih-alih `asBulkReject` (Checker).

---

## ITEM 3 — Default view = hari berjalan (semua tab)

**Verifikasi:** `defaultFilters()` js:159 start/end kosong. Seed `add()` js:211 memakai `_isoDaysAgo(_int(_gi++, 3, 120))` → **tidak ada satu pun data hari ini** → default hari-ini = semua tab kosong.

**Keputusan desain:** default filter jadi hari ini **dan** seed diubah agar ±20% tiap section + semua demo-row jatuh hari ini. Trade-off: alternatifnya (default tetap semua-tanggal) menolak permintaan user; tab kosong membuat mockup tak berguna → solusi = seed sebagian data hari ini. Data historis tetap ada untuk menguji filter tanggal.

### Perubahan `auto-settlement.js`

1. js:159 `defaultFilters()` → `return { start: todayISO(), end: todayISO(), banks: new Set(), ... }` (sisanya tetap). Komentar baris 158 di-update: "default filter = HARI BERJALAN".
2. Seed — di `buildSeedPool()`:
   - Ubah signature helper tidak perlu; manfaatkan parameter `forceISO` yang sudah ada di `add()`.
   - Section 1 (checker, js:251): `add(_pick(GEN_BANKS,_gi++), n, dc(n), big?280000000:0, {status:'checker'}, null, (i % 5 === 0) ? _isoDaysAgo(0) : null)`.
   - Section 2 (approver, js:258): tambahkan arg yang sama `(i % 5 === 0) ? _isoDaysAgo(0) : null`.
   - Section 3 (hold, js:269): idem.
   - Section 4 (hold ledger, js:274): idem.
   - Section 6 (settle, js:283): idem.
   - Section 7 `addMergeCase()` js:239: ubah `var iso = _isoDaysAgo(_int(_gi++, 3, 120))` → `(i akses tidak ada — beri parameter)`: paling sederhana ubah jadi `_isoDaysAgo(_r(_gi++) < 0.5 ? 0 : _int(_gi++, 3, 120))`.
   - Section 9 `addDetect` js:305 & Section 10 `addMinScenario` js:315 & `addCoreSmall` js:336: ganti `_isoDaysAgo(_int(_gi++, 2, 20))` / `(2, 18)` → `_isoDaysAgo(0)` (semua demo-row = hari ini, agar skenario Siap Release / deteksi rekening / core-small terlihat di default view).
   - Multi-MID picker demo js:343–344 (`add('BCA', 15, ...)` / `add('MANDIRI', 23, ...)`): tambah `forceISO: _isoDaysAgo(0)` → `add('BCA', 15, 0, 0, { status: 'checker' }, '8830000000021', _isoDaysAgo(0))`.
   - **`updatedTs` untuk baris hari-ini**: di `add()` js:214 `_isoAdd(iso, _int(_gi++, 1, 20))` menghasilkan tanggal MASA DEPAN untuk iso=hari ini. Fix: `var updOff = (iso === _isoDaysAgo(0)) ? 0 : _int(_gi++, 1, 20); var uts = _disp(_isoAdd(iso, updOff), _gi++);` (konsumsi `_gi` tetap deterministik — hati-hati: cabang membuat jumlah pemanggilan `_int` beda per-baris, itu OK karena determinismenya per-run tetap sama, seed murni fungsi urutan `_gi`).
3. Bump `SEED_VER` (Step 12).

### Ripple
- `computeReleasable`, notif bell, counts — tidak tergantung filter tanggal (pakai `groups` penuh) → tidak berubah.
- Tab counts (`renderCounts`) menghitung SEMUA group tanpa filter tanggal — angka badge akan lebih besar daripada isi tabel default. Ini perilaku lama yang sudah ada untuk filter apa pun; biarkan (catat di changelog tidak perlu).
- `resetForTab()` memanggil `defaultFilters()` → tiap pindah tab kembali ke hari ini. Sesuai permintaan "default view = hari berjalan semua tab".

### Verifikasi browser
1. Hard reload + localStorage bersih. Panel Filter → Date Range terisi tanggal hari ini di start & end.
2. Tiap tab (Checker/Approver/Hold/Settle) menampilkan data (≥ ~150 baris per tab, bukan "Tidak ada data").
3. Skenario demo terlihat hari ini: cari `8830000000001` di Hold → 3 baris Siap Release; sticky hijau muncul di Checker.
4. Clear All di filter → start/end kembali terisi hari ini (bukan kosong).
5. Set Date Range manual ke rentang 120 hari → data historis muncul (filter tanggal tetap berfungsi).

### Risiko
- Salah paham `forceISO` param order: `add(bank, midCount, disputeCount, amtEach, state, forceNorek, forceISO)` — forceISO argumen ke-7, forceNorek ke-6 harus diisi `null`/`undefined`.
- `updatedTs` masa depan bila lupa fix langkah 2 terakhir (kolom "Tanggal Perubahan Terakhir" > hari ini terlihat janggal).

---

## ITEM 1 — Fix admin dobel: tanpa Biaya Admin di Hold; admin sekali saat kembali/merge ke Checker

**Verifikasi bug:** `makeGroup` js:375 → `admin: isOther(bank) ? ADMIN_FEE_OTHER : 0` berlaku ke SEMUA group termasuk split hold. `totalOf` js:449 = `nominalAwal - admin + adjPlus - adjMinus`. Akibat: 1 norek dengan base + split hold non-core terpotong admin 2×; tab Hold menampilkan Admin Rp6.500 padahal hold bukan payout.

**Keputusan desain:** admin dihitung **dinamis berdasarkan status group saat dibaca** — fungsi baru `adminOf(g)`:

```js
// Admin flat Rp6.500 (bank non-core) hanya untuk group yang menuju payout.
// Group ber-status 'hold' TIDAK kena admin — admin dikenakan sekali saat
// dana kembali/tergabung ke settlement berjalan di Checker.
function adminOf(g) {
    if (st(g.groupId).status === 'hold') return 0;
    return isOther(g.bank) ? ADMIN_FEE_OTHER : 0;
}
```

- `makeGroup` **tetap** mengisi `g.admin` (dipakai sebagai basis; tapi semua PEMBACA beralih ke `adminOf`). Alternatif menghapus `g.admin` lebih bersih → **putuskan: hapus field `admin` dari makeGroup TIDAK dilakukan**; biarkan (dipakai `segRecap` js:1712 untuk adm settle Manual — di sana group berstatus settle, `adminOf` = `g.admin`, tapi demi konsistensi ganti juga ke `adminOf(g)`).
- Chargeback (adjPlus/adjMinus) TETAP dihitung di semua status — tidak disentuh.
- **Konsistensi "Siap Release"**: `computeReleasable` menjumlah `totalOf` checker + hold-min per norek. Dengan `adminOf`, totalOf hold-min = nominal penuh (tanpa −6.500). Seed skenario js:327–333 dibuat dgn asumsi lama (10.500 − 6.500 = 4.000). **Seed HARUS disesuaikan** agar demo tetap benar:
  - `addMinScenario('8830000000001','OCBC',[4000,4000,4000])` → 12.000 ≥ 10rb → Siap Release. (nominal split diganti dari 10500 → 4000)
  - `'8830000000002','NOBU',[4000,4000,4000,4000]` → 16.000 → Siap Release.
  - `'8830000000003','MEGA',[4000,4000]` → 8.000 < 10rb → Belum Diproses.
  - `'8830000000004','OCBC',[4000], 60000` → 4.000 + (60.000−6.500 base checker) → Siap Release.
  - `'8830000000005','BSI',[4000], 35000` → idem.
  - Update komentar blok js:311–333 (angka 10.500/4.000 → 4.000 tanpa admin; catatan "hold tanpa admin").
  - Section 3 hold scope 'min' `amtEach: 11000` js:269: nominal 11rb×(0.6–1.4) bisa >10rb tanpa admin → tak lagi auto-terlihat "dibawah min". Auto-hold di `buildGroups` hanya berlaku status checker (seed ini langsung status hold, tak lewat auto-hold) — tapi supaya masuk akal ("dibawah min" berarti totalnya <10rb) ganti `amtEach` dari `11000` → `6000` (range 3.600–8.400, semua <10rb).

### Perubahan `auto-settlement.js` (semua pembaca `g.admin` → `adminOf(g)`)

Verified via grep — daftar lengkap pembaca:
1. js:449 `totalOf` → `return g.nominalAwal - adminOf(g) + (g.adjPlus||0) - (g.adjMinus||0);`
2. js:535 `renderSummary` → `b.admin += adminOf(g);`
3. js:704 `renderTable` sel Admin → `(adminOf(g) ? num(adminOf(g)) : '-')`
4. js:901 `detailBodyHTML` Ringkasan → `g.admin` 2× → `adminOf(g)`.
5. js:1628 `exportRowData` kolom Admin → `adminOf(g)`.
6. js:1712 `segRecap` → `adm += adminOf(g);`
7. `buildGroups` auto-hold check js:439 `totalOf(g) < AUTO_HOLD_MIN` — saat dicek status masih 'checker' → adminOf termasuk admin → perilaku auto-hold TIDAK berubah (nominal 10.500 non-core: total 4.000 <10rb → hold). Setelah jadi hold, tampilan totalnya 10.500 tanpa admin. Ini benar sesuai definisi user. Tambahkan komentar di situ.
8. Definisikan `adminOf` tepat di atas `totalOf` (dekat js:449).

### Ripple
- Filter nominal (js:497–499) memakai `totalOf` → di tab Hold nilai berubah (tanpa admin) — konsisten dengan yang ditampilkan. OK.
- `mergeInfo.total` (js:1425) menjumlah `totalOf(x)` sibling hold-min saat approve settle → kini tanpa admin per sibling → **tidak ada admin dobel saat merge**; admin parent tetap 1× lewat `totalOf(parent)`. Inilah inti fix.
- Hold ledger (status sudah pindah, mis. released → checker): `adminOf` kembali mengenakan admin → baris ledger di tab Hold menampilkan Admin lagi setelah rilis. Konsisten: dana itu sekarang menuju payout.
- `splitBifast`/settleParts memakai `totalOf` parent — tak terpengaruh.

### Verifikasi browser
1. Tab Hold → kolom Admin (Rp) = `-` untuk SEMUA baris berstatus hold aktif; Total Settle = Nominal Awal + chargeback (tanpa −6.500). Baris chargeback tetap tampil di kolom Adjustment.
2. Buka Detail ID Settlement dari baris Hold → Biaya Admin `-`.
3. Rilis satu baris hold non-core ke Checker → di Checker baris itu Admin = 6.500 kembali.
4. Skenario merge: cari norek `addMergeCase` (bank OCBC, split `-P1`) → settle base → approve → badge "⊕ Gabung 1" → total gabungan hanya terpotong admin 1×.
5. Hold tab filter Status = Belum Diproses → norek `8830000000003` (2×4.000=8.000) masih Belum Diproses; `8830000000001` Siap Release.

### Risiko
- `adminOf` dipanggil sangat sering (dalam loop render/filter) dan memanggil `st()` — `st()` lazy-create item baru untuk id yang belum ada; aman (idempotent) tapi pastikan tidak dipanggil sebelum `items` dimuat (urutan init sudah benar: loadItems → loadPool).
- Terlewat satu pembaca `g.admin` → tampilan tak konsisten. Grep final: `grep -n "\.admin" auto-settlement.js` harus tinggal `makeGroup` (writer) dan `adminOf` saja.

---

## ITEM 4 — Flag akun bebas admin (UMKM/yayasan) + 1 contoh merchant

**Keputusan desain (minimal tapi jelas):**
- Disimpan **per norek** (unit group = bank+norek; payout per norek — flag per MID akan ambigu saat multi-MID). Konstanta top-file:

```js
// §Bebas Admin: norek merchant kategori UMKM/yayasan — tidak dikenai admin Rp6.500 walau bank non-core.
var FEE_EXEMPT_NOREKS = { '8840000000001': 'Yayasan (bebas biaya admin)' };
function isFeeExempt(g) { return !!FEE_EXEMPT_NOREKS[g.norek]; }
```

- `adminOf(g)` (Item 1) → tambah guard: `if (isFeeExempt(g)) return 0;` di baris pertama.
- **Indikator visual**: badge kecil di sel Nama Pemilik Rekening (renderTable js:711) dan di Detail modal:
  - renderTable: `c += '<td>' + esc(g.namaRek) + feeExemptBadge(g) + '</td>';` dengan

```js
function feeExemptBadge(g) {
    if (!isFeeExempt(g)) return '';
    return ' <span title="' + esc(FEE_EXEMPT_NOREKS[g.norek]) + '" style="font-size:0.6rem;font-weight:700;border-radius:4px;padding:1px 6px;background:#16a34a22;color:#15803d;white-space:nowrap;">BEBAS ADMIN</span>';
}
```

  - `detailBodyHTML` js:901: `kv('Biaya Admin', isFeeExempt(g) ? '<span style="color:#15803d;font-weight:700;">Bebas Admin (Rp 0)</span>' : (adminOf(g) ? '− ' + rupiah(adminOf(g)) : '-'))`.
- **Seed 1 contoh** — di `buildSeedPool()` setelah `addCoreSmall` (dekat js:341):

```js
// §Bebas Admin: yayasan di bank non-core, nominal normal — admin Rp6.500 TIDAK dikenakan.
add('OCBC', 2, 0, 45000, { status: 'checker' }, '8840000000001', _isoDaysAgo(0));
```

  Catatan: `add()` menamai owner via `_pick(GEN_NAMES)+suffix`; supaya jelas ini yayasan, setelah call di atas TIDAK perlu utak-atik nama (badge sudah cukup). Bila ingin nama eksplisit, ubah `add()` menerima `forceOwner` — **putuskan: tidak, badge cukup** (diff terkecil).

### Ripple
- Auto-hold: norek exempt non-core dgn total <10rb → tanpa admin totalnya lebih besar; guard exempt di `adminOf` otomatis dipakai `totalOf` di cek auto-hold. Konsisten.
- Export/summary/segregasi memakai `adminOf` (Item 1) → otomatis benar.

### Verifikasi browser
1. Checker → cari `8840000000001` → baris OCBC, Admin `-`, badge hijau "BEBAS ADMIN" di nama, Total Settle = Nominal Awal.
2. Klik ID → Detail → Biaya Admin = "Bebas Admin (Rp 0)".
3. Bandingkan baris OCBC lain (non-exempt) → Admin 6.500 tetap.

### Risiko
- Norek seed `8840000000001` bentrok dgn generator `nextNorek()` (mulai `88`+11 digit dari uid 4000000000 → `884000000xx…`)? `nextNorek` menghasilkan `'88' + slice(-11)` dari uid ~4jt-an → `88400000xxxx` — **CEK saat implement**: jalankan cepat di console `uid=4000000000+7 → '88'+String(uid).slice(-11)` = `88004000000007`? String(4000000007).length=10 → slice(-11) = '4000000007' → norek `884000000007` (12 digit). Seed exempt pakai 13 digit `8840000000001` → TIDAK bentrok (panjang beda). Aman, tapi verifikasi visual.

---

## ITEM 11 — Checklist "Siap Release" di tab Hold → Rilis & Gabung jadi 1 baris di Checker

**Keputusan desain (paling sederhana yang benar):**
- Tab Hold mendapat tombol **"Rilis & Gabung"** (toggle mode pilih, memakai mekanisme `bulkMode` yang sudah ada). Checkbox hanya muncul pada baris `holdStatusKey(g) === 'siap'` (Siap Release).
- **Mekanisme gabung**: baris siap-release adalah (a) split hold-min (`STL-…-Pn`, ada di array `splits`) atau (b) group hold-min utuh (bukan split). Aksi per norek+bank terpilih:
  - (a) **Hapus entri `splits`-nya + hapus `items[splitId]`** → `buildGroups()` otomatis melebur transaksi MID itu kembali ke base group (`STL-<norek>`) = **1 baris di Checker**. Tidak perlu struktur merge baru — grouping bank+norek sudah menjamin 1 baris.
  - (b) group utuh: cukup set status `checker` (rilis biasa) — sudah 1 baris.
  - Set state base group: `status:'checker'` (bila item base belum ada, `st(baseId)` membuatnya), `everHeld:true, released:true, holdScope:'min'`, `updatedTs: todayProc()`, `autoReq:{type:'rilis',from:'hold',to:'checker',ts:todayProc()}` → Approver ter-notifikasi (perilaku konsisten dgn `openRilis`), dan Hold ledger tetap punya jejak 1 baris "Sudah Release Checker".
- **"Tanggal terbaru"**: `procISO/procDisplay` group berasal dari `txns[0]` pool (pool di-rebuild dari seed tiap load — tidak bisa dipersist). Interpretasi: **Tanggal Perubahan Terakhir = sekarang** (`updatedTs`), Tanggal Recon tetap tanggal transaksi. Plus: di `makeGroup` tidak diubah. Catat keputusan ini di changelog. (Alternatif memutasi pool = hilang saat reload → salah.)
- `mergedInto`/`mergeInfo` TIDAK dipakai di sini (itu untuk merge saat approve settle); menghapus split adalah representasi gabung yang lebih sederhana dan konsisten dgn data model.

### Perubahan `auto-settlement.js`

1. `renderToolbarActions` (js:797): tambah cabang `else if (activeTab === 'hold')` → render tombol `asHoldBulkBtn` label `bulkMode ? 'Tutup Pilih Siap Release' : 'Rilis & Gabung (Siap Release)'`; click → `bulkMode = !bulkMode; if (!bulkMode) selected.clear(); render();`.
2. `renderTable` (js:655): `var hasCb = (activeTab === 'checker' || activeTab === 'pending' || activeTab === 'hold') && bulkMode;` dan js:691 `rowCb`:
   `var rowCb = hasCb && (activeTab !== 'hold' || holdStatusKey(g) === 'siap');`
   (kondisi lama `!(activeTab==='hold' && s.status!=='hold')` tercakup — 'siap' hanya mungkin bila status masih 'hold').
   `asSelectAll` header di hold: sinkron/all-toggle hanya baris siap → di handler `all.addEventListener` ganti `slice.forEach` menjadi skip baris non-eligible: `slice.forEach(function (v) { if (activeTab==='hold' && holdStatusKey(v.g)!=='siap') return; on ? selected.add(...) : selected.delete(...); });` — dan `syncHeader` menghitung hanya baris eligible.
3. `renderBulkBar` (js:827): `var bulkTabs = ['checker','pending','hold'];` dan `avail` tambah `hold: ['rilisgabung']`. Tambah tombol baru di HTML bulk bar (lihat bawah) + `setBtn('asBulkRilisGabung','rilisgabung')`.
4. Fungsi baru `openBulkRilisGabung()`:

```js
// §Rilis & Gabung: baris Siap Release terpilih dirilis ke Checker; split hold-min
// pada norek+bank sama dilebur kembali ke base → tampil 1 baris (grouping bank+norek).
function openBulkRilisGabung() {
    var arr = Array.from(selected).map(groupById).filter(function (g) { return g && holdStatusKey(g) === 'siap'; });
    if (!arr.length) { showToast('Tidak Ada Pilihan', 'Pilih baris berstatus Siap Release.'); return; }
    var body = '<p style="font-size:0.85rem;">Rilis <b>' + arr.length + '</b> hold Dibawah Min. Transaksi ke Checker. Baris pada bank+norek sama akan <b>digabung jadi 1 settlement</b> (tanggal perubahan = hari ini).</p>';
    openModal('Rilis & Gabung ke Checker', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Rilis & Gabung', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var norekBanks = {};
            pool.forEach(function (t) { (norekBanks[t.bankAccount] = norekBanks[t.bankAccount] || {})[t.bankCode] = 1; });
            arr.forEach(function (g) {
                var isSplit = splits.some(function (sp) { return sp.id === g.groupId; });
                if (isSplit) {
                    splits = splits.filter(function (sp) { return sp.id !== g.groupId; });
                    delete items[g.groupId];
                    var baseId = 'STL-' + g.norek + (Object.keys(norekBanks[g.norek] || {}).length > 1 ? '-' + g.bank : '');
                    var b = st(baseId);
                    b.status = 'checker'; b.everHeld = true; b.released = true; b.holdScope = 'min';
                    b.updatedTs = todayProc(); b.autoReq = { type: 'rilis', from: 'hold', to: 'checker', ts: todayProc() };
                } else {
                    var s = st(g.groupId);
                    s.status = 'checker'; s.request = null; s.released = true; s.updatedTs = todayProc();
                    s.autoReq = { type: 'rilis', from: 'hold', to: 'checker', ts: todayProc() };
                }
            });
            selected.clear(); bulkMode = false;
            saveSplits(); saveItems(); buildGroups(); closeModal(); render();
            showToast('Rilis & Gabung', arr.length + ' hold dirilis & digabung ke Checker.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Rilis & Gabung ' + arr.length + ' hold Siap Release ke Checker');
        } }
    ]);
}
```

   **PENTING**: `baseId` harus meniru `baseIdFor` di `buildGroups` (js:390) — logika multi-bank di atas sudah menyalinnya; jangan hardcode `'STL-'+norek` saja.
5. `bind()`: `document.getElementById('asBulkRilisGabung').addEventListener('click', openBulkRilisGabung);`
6. Reset `bulkMode` saat pindah tab sudah ada (`resetForTab`).

### Perubahan `auto-settlement.html`
- Bulk bar (html:334–341): tambah `<button class="btn" id="asBulkRilisGabung" style="background:#16a34a;color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:6px 14px;"><i class="fas fa-object-group"></i> Rilis &amp; Gabung</button>` (display dikontrol `renderBulkBar`).
- Komentar html:328 "(Checker only)" → "(Checker/Approver/Hold)".

### Ripple
- `computeReleasable` dipanggil awal `render()` → status siap ter-update setelah gabung (split hilang → tidak lagi releasable). OK.
- Hold ledger: baris split yang dihapus hilang dari ledger; jejak digantikan base ber-`everHeld` (1 baris "Sudah Release Checker"). Simplification — catat di changelog.
- Base yang sebelumnya tidak ada item (norek yang semua MID-nya split, mis. `8830000000001`): `st(baseId)` membuat item baru → setelah `buildGroups`, base muncul di Checker dgn seluruh nominal. Auto-hold guard js:439 TIDAK menendang balik ke hold karena `s.released`… **CEK**: guard = `s.status==='checker' && !s.request && isOther && totalOf<10rb`. Base gabungan `8830000000001` = 12.000 ≥10rb → aman. Tapi teori: gabungan yang tetap <10rb akan di-auto-hold lagi → itu justru perilaku benar (belum memenuhi min). Namun `s.request` di-set auto-hold — dan kita sudah set autoReq rilis; tidak konflik. Terima.
- Persistensi: `splits` tersimpan → reload tetap tergabung. ✓

### Verifikasi browser
1. Tab Hold → filter Status = Siap Release → tombol "Rilis & Gabung (Siap Release)" tampak → klik → checkbox muncul HANYA di baris Siap Release (baris Belum Diproses / Sudah Release tanpa checkbox).
2. Pilih 3 baris norek `8830000000001` (OCBC) → tombol bulk "Rilis & Gabung" → konfirmasi → toast.
3. Tab Checker → cari `8830000000001` → **1 baris** `STL-8830000000001`, Nominal Awal = 12.000 (3×4.000), Tanggal Perubahan Terakhir = hari ini.
4. Tab Hold → cari norek yang sama → 1 baris ledger "Sudah Release Checker".
5. Tab Approver → ada record "Otomatis Hold → Checker" untuk base tsb.
6. Reload halaman → gabungan bertahan.

### Risiko
- Salah `baseId` saat norek multi-bank → item state nyasar ke group yang tak ada (baris hilang). Mitigasi: salin persis logika `baseIdFor`.
- Header select-all di hold memilih baris non-siap bila lupa guard di handler.
- Baris `settleParts` tidak relevan (hanya settle tab).

---

## ITEM 5 — 2 reminder di bell (hold tanpa bukti; belum settle lewat batas waktu)

**Keputusan desain:**
- **Agregat, bukan per-baris** (seed punya ratusan kasus; dropdown per-item tak terbaca). 2 item reminder maksimum:
  1. **Hold tanpa bukti**: hitung group `st.status==='hold'` dengan `!(s.request && s.request.bukti)` → 1 item: "X settlement Hold belum memiliki bukti — lengkapi via aksi Lihat Bukti di tab Hold." Ikon `fa-file-circle-exclamation`, warna amber `#b45309`.
  2. **Belum ter-settle sampai batas waktu**: **ambang = H+3** — group `status==='checker'` dgn `g.procISO <= _isoDaysAgo(3)` → "Y settlement belum di-settle > 3 hari sejak Tanggal Recon — segera proses di tab Checker." Ikon `fa-clock`, warna merah `#dc2626`. (Ambang 3 hari dipilih karena seed historis 3–120 hari → selalu ada contoh; definisi bisnis riil menyusul.)
- **Catatan mock di UI**: footer kecil di dropdown: "Reminder ini mock — implementasi riil dikirim di luar dashboard (mis. Telegram)." → ya, perlu, satu baris muted.
- Judul dropdown "Notifikasi Deteksi Rekening" → "Notifikasi" (isinya kini campur).
- `renderNotifBell()` dipanggil juga di akhir `render()` supaya reminder mengikuti aksi user (upload bukti / settle) — murah (O(n) sekali).

### Perubahan `auto-settlement.js`

1. Fungsi baru (dekat `buildAcctNotifs` js:71):

```js
// §Reminder bell (mock — riil via Telegram): hold tanpa bukti & belum settle > H+3.
var SETTLE_DEADLINE_DAYS = 3;
function buildReminderNotifs() {
    var noBukti = 0, late = 0, cutoff = _isoDaysAgo(SETTLE_DEADLINE_DAYS);
    groups.forEach(function (g) {
        var s = st(g.groupId);
        if (s.mergedInto) return;
        if (s.status === 'hold' && !(s.request && s.request.bukti)) noBukti++;
        if (s.status === 'checker' && g.procISO <= cutoff) late++;
    });
    var out = [];
    if (noBukti) out.push({ kind: 'nobukti', text: noBukti + ' settlement Hold belum memiliki bukti — lengkapi via aksi "Lihat Bukti" di tab Hold.' });
    if (late) out.push({ kind: 'late', text: late + ' settlement belum di-settle > ' + SETTLE_DEADLINE_DAYS + ' hari sejak Tanggal Recon — proses di tab Checker.' });
    return out;
}
```

   Catatan: `_isoDaysAgo` didefinisikan sebelum pemakaian (js:197, dipanggil saat runtime — hoisting function declaration aman).
2. `renderNotifBell` (js:93): `var notifs = buildAcctNotifs().concat(buildReminderNotifs());` — mapping ikon/warna tambah cabang: `nobukti → ['#b45309','fa-file-circle-exclamation']`, `late → ['#dc2626','fa-clock']`. Head label → 'Notifikasi'. Setelah `body`, append footer: `'<div style="padding:8px 14px;font-size:0.68rem;color:var(--text-muted);border-top:1px solid #f1f5f9;">Reminder bersifat mock — implementasi riil dikirim di luar dashboard (mis. Telegram).</div>'`.
3. `render()` (js:610): tambah `renderNotifBell();` di akhir.

### Ripple
- Badge count naik (2 reminder + deteksi rekening) — ok.
- Tidak ada persistensi dismissal (konsisten dgn notif deteksi yang read-only).

### Verifikasi browser
1. Klik lonceng → dropdown berisi: 3 notif deteksi rekening (MID-W001/2/3) + item amber "…Hold belum memiliki bukti…" + item merah "…belum di-settle > 3 hari…", footer catatan Telegram.
2. Badge = 5 (3+2) di seed default.
3. Tab Hold → tambah bukti ke salah satu baris tanpa bukti → angka reminder berkurang 1 tanpa reload (karena renderNotifBell di render()).

### Risiko
- Hitung `late` termasuk baris partialLock/checker apa pun — fine untuk mock.
- Jangan lupa `s.mergedInto` guard agar tidak menghitung baris tersembunyi.

---

## ITEM 6 — Export tab Settle: detail per MID per norek

**Keputusan desain:** hanya cabang `settle` di `exportCols`/`exportRowData` yang berubah — 1 baris CSV per **MID per group (per norek)**, meniru struktur List Settlement di Detail ID Settlement (`midSummary`), plus kolom identitas norek/bank/ID/settle-meta. Tab lain tidak berubah.

Kolom (urutan final):
`No, ID Settlement, Tanggal Recon, Bank, Nomor Rekening, Nama Pemilik Rekening, Merchant, MID, Jumlah Transaksi, Nominal Settle (Rp), Adjustment Chargeback (+) (Rp), Adjustment Chargeback (−) (Rp), Tipe Settlement, Channel Payment, Metode Settlement, Status, Waktu Disetujui, Disetujui Oleh`

### Perubahan `auto-settlement.js`

1. `exportCols()` js:1618: cabang settle → return array kolom di atas (bukan `EXPORT_COLS.concat`).
2. `exportRowData(rows)` js:1626: cabang settle di-refactor — karena bentuk per-MID berbeda total, pisahkan:

```js
function exportRowData(rows) {
    if (activeTab === 'settle') {
        var out = [], no = 0;
        rows.forEach(function (g) {
            var s = st(g.groupId); var rq = s.request || {};
            midTipeSummary(g).forEach(function (m) {
                out.push([++no, g.groupId, g.procDisplay, g.bank, g.norek, g.namaRek,
                    m.merchant, m.mid, m.count, m.total, m.adjPlus || 0, m.adjMinus || 0, m.tipe,
                    s.channel || rq.channel || '-', s.metodeSettlement || '-',
                    SETTLE_STATUS_LABEL[displaySettleStatus(g)] || '-', s.approvedTs || '-', s.approvedBy || '-']);
            });
        });
        return out;
    }
    // …cabang lama untuk tab lain (tanpa reject — sudah dihapus Item 2)…
}
```

   Gunakan `midTipeSummary` (bukan `midSummary`) agar baris dispute terpisah — sama seperti List Settlement modal.
3. `showExportPreview` js:1656: `fmt` hard-code kolom numerik 4..8 → salah untuk layout settle (numerik di index 9–11). Ganti generik:

```js
var colsNow = exportCols();
var fmt = function (c, v) { return (typeof v === 'number' && /\(Rp\)$/.test(colsNow[c] || '')) ? num(v) : esc(v); };
```

   (Kolom `Jumlah Transaksi` number tapi bukan (Rp) → tampil polos — benar.)

### Ripple
- `downloadCsv` generik (map kolom) → otomatis ikut. Judul file/`STATUS_LABEL[activeTab]` tetap.
- Export tab checker/pending/hold TIDAK berubah (regresi dicek).
- Baris `settleParts` (pecahan BI-FAST) tidak dipecah di export — export per MID, bukan per transfer. Terima (dicatat).

### Verifikasi browser
1. Tab Settle → Export → preview: tiap ID Settlement multi-MID muncul >1 baris; kolom Merchant/MID/Jumlah Transaksi/Nominal Settle terisi; ID & norek berulang per baris.
2. Bandingkan satu group: buka Detail ID Settlement → List Settlement → angka per MID = angka export.
3. Download CSV → kolom header sesuai; angka polos (tanpa pemisah ribuan) di CSV.
4. Tab Checker → Export → format lama tetap (regression).

---

## ITEM 7 — Retry bisa ganti channel payment

**Lokasi:** `openRetry()` js:1301–1317.

**Perubahan:** tambah select Channel opsional di modal:

```js
var body = '<div class="as-fld"><label>Tanggal Retry …(existing)…</div>' +
    '<div class="as-fld"><label>Ganti Channel Payment <span style="font-weight:400;color:var(--text-muted);">(opsional — kosongkan = channel semula)</span></label>' +
    '<select id="asRetryChannel"><option value="">Tanpa perubahan channel</option>' + CHANNELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
    '…info existing…';
```

Di handler Retry (js:1310): `var ch = document.getElementById('asRetryChannel').value;` lalu di `targets.forEach`: `var s = st(g.groupId); s.settleStatus = 'pending'; if (ch) { s.channel = ch; if (s.request) s.request.channel = ch; } s.updatedTs = todayProc();` — dan tambahkan info channel ke toast/writeLog (`(ch ? ' — channel diganti ke ' + ch : '')`).

**Ripple:** kolom Channel Payment tab Settle (js:728 `s.channel || rq.channel`) — `s.channel` menang → tampil channel baru. Detail modal js:1597 idem. `mockReqJson` pakai `rq.channel` → sudah ikut karena `s.request.channel` juga di-update. Filter channel (js:514) pakai `s.channel` → ikut.

**Verifikasi browser:** Tab Settle → Simulasi tanpa simulasi → pastikan ada baris Otomatis+Fail (seed ada). Klik Retry Settlement → pilih channel baru (mis. NOBU) → Retry → baris tsb jadi Pending dengan kolom Channel = NOBU; buka Lihat Detail → Channel Payment = NOBU, REQUEST DATA JSON `channel_payment` ikut.

**Risiko:** minimal. Bila tak ada target (0 baris), toast tetap "0 transaksi…" — perilaku lama, biarkan.

---

## ITEM 8 — Field Catatan saat settle disiapkan link ke deskripsi transaksi bank (fase API)

**Keputusan desain:** ini penanda persiapan, bukan fitur berfungsi. Tambah hint di bawah textarea Catatan **hanya pada form settle** (single `openSettle` js:1162; bulk settle tidak punya noteField — biarkan), plus label kecil di tampilan Catatan pada `openDetailModal`.

**Perubahan:**
1. `noteField(required)` js:918: tambah parameter kedua `hint`:

```js
function noteField(required, hint) {
    return '<div class="as-fld"><label>Catatan' + (required ? ' <span style="color:#ef4444;">*</span>' : ' (opsional)') + '</label><textarea id="asReason" rows="3" placeholder="Tulis catatan…"></textarea>' +
        (hint ? '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:5px;"><i class="fas fa-link"></i> ' + hint + '</div>' : '') + '</div>';
}
```

   Call-site lain (`openHold`, `openRejectByBankItem`, dst.) tak berubah (arg kedua undefined).
2. `openSettle` js:1162: `noteField(false, 'Catatan ini disiapkan untuk tertaut ke deskripsi transaksi bank (Fase API).')`.
3. `openDetailModal` js:1599: ganti label kv Catatan → `kv('Catatan <span style="font-weight:400;font-size:0.68rem;color:var(--text-muted);">(tertaut deskripsi transaksi bank — Fase API)</span>', …existing value…)`.

**Verifikasi browser:** Checker → kebab → Settle → di bawah textarea Catatan ada hint ikon link "…Fase API". Tab Settle → Lihat Detail → label Catatan bersufiks "(tertaut deskripsi transaksi bank — Fase API)".

---

## ITEM 9 — Konfirmasi bulk settle: hapus "jumlah transaksi" di tiap Breakdown per Bank Tujuan

**Lokasi:** `settleGroupedHTML(arr)` js:1107–1129 — header per bank js:1124: `d.rows.length + ' rekening · ' + d.tx + ' transaksi · <b>…total…</b>'`.

**Perubahan:** hapus segmen `d.tx + ' transaksi · '` → `d.rows.length + ' rekening · <b style="color:var(--text-primary);">' + rupiah(d.total) + '</b>'`. Sekalian hapus akumulasi `b.tx += …` js:1111 dan field `tx: 0` js:1110 (dead).

**Ripple:** `settleGroupedHTML` juga dipakai `bulkApproverDecide` (Bulk Approve breakdown, js:1210) — jumlah transaksi ikut hilang di sana. Konsisten; terima.

**Verifikasi browser:** Checker → Bulk Aksi → pilih ≥2 baris beda bank → Bulk Settle → isi form → Lanjut → modal Konfirmasi Bulk Settle: header tiap bank hanya "N rekening · Rp total" (tanpa "· X transaksi"). Approver → Bulk Approve dgn request settle terpilih → breakdown sama.

---

## ITEM 10 — Bukti: tambah ZIP/RAR, maks 25 MB, 1 file; tombol "Lihat" → "Download" di modal Lihat Bukti

**Verifikasi kondisi sekarang:** `fileField` js:914 `accept=".pdf,.jpg,.jpeg,.png"` single input (sudah 1 file); `validateBukti` js:921 ext whitelist `['pdf','jpg','jpeg','png']`, size sudah 25 MB. Tombol "Lihat" (`asBuktiBtn` → `openBukti`) ada di 3 tempat: `openApproverModal` js:1324/1352, `openDetailModal` js:1591/1611, `openCatatanModal` js:1957/1983. Overlay viewer `asBuktiOverlay` html:402–413 menampilkan `sample-bukti.png`.

**Keputusan desain:** karena ZIP/RAR tak bisa dipreview, **semua tombol "Lihat" diganti "Download"** yang mengunduh `sample-bukti.png` dengan nama file bukti (mock). Overlay viewer `openBukti`/`closeBukti`/`asBuktiOverlay` **dihapus** (tak ada lagi pemanggil).

### Perubahan `auto-settlement.js`
1. `fileField` js:916: `accept=".pdf,.jpg,.jpeg,.png,.zip,.rar"`; teks label upload tambah keterangan via hint call-site.
2. `validateBukti` js:926: whitelist → `['pdf','jpg','jpeg','png','zip','rar']`; pesan → `'Format bukti harus PDF, JPG, JPEG, PNG, ZIP, atau RAR.'`. Tambah guard 1 file: `if (f.files.length > 1) { showToast('Terlalu Banyak File', 'Maksimal 1 file bukti.'); return null; }` (input single-select sudah menjamin; guard murah, tambahkan).
3. Semua hint string `'(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG…'` (7 call-site: openHold js:978, openSettle js:1162, openBulkHold js:1229, openRejectByBankItem js:1471, openCatatanModal js:1972; openReject/openBulkReject sudah terhapus di Item 2) → ganti `PDF/JPG/JPEG/PNG/ZIP/RAR`.
4. Fungsi baru menggantikan `openBukti`:

```js
// Mock download bukti: unduh sample-bukti.png dengan nama file bukti.
function downloadBukti(name) {
    var a = document.createElement('a');
    a.href = 'sample-bukti.png'; a.download = name || 'bukti.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Download Bukti', (name || 'bukti') + ' diunduh (mock).');
}
```

   Hapus `openBukti`/`closeBukti` (js:866–870).
5. 3 tombol: label `Lihat` → `Download` + ikon `<i class="fas fa-download"></i> `; listener `openBukti(rq.bukti)` → `downloadBukti(rq.bukti)` (js:1325+1353, 1592+1612, 1958+1984).
6. `bind()` js:2090–2091: hapus listener `asBuktiClose` & `asBuktiOverlay` (elemennya dihapus — kalau dibiarkan, `TypeError: null` mematikan init).

### Perubahan `auto-settlement.html`
- Hapus blok `<!-- Bukti viewer popup -->` html:401–413 (`asBuktiOverlay`).

### Verifikasi browser
1. Hold → kebab → Lihat Bukti → baris "Bukti" ber-tombol **Download** (bukan Lihat) → klik → file terunduh bernama sesuai bukti + toast.
2. Modal sama → Tambah/Ganti Bukti → pilih file `.zip` → Simpan → sukses; file `.txt` → toast "Format Salah" menyebut ZIP/RAR.
3. Approver → Detail Request dgn bukti → tombol Download bekerja. Settle → Lihat Detail → idem.
4. Console tanpa error saat load (listener overlay sudah dicabut).

### Risiko
- Sama pola Item 2: lupa cabut listener overlay di `bind()` → init mati. Cek pertama.

---

## STEP 12 — Versioning & dokumentasi

1. **`VERSION`**: `1.18.3` → `1.19.0`.
2. **`SEED_VER`** js:2115 → `'2026-07-17-v1.19.0-no-reject-today-admin'` (satu bump untuk Item 1/2/3/4).
3. **`versions.js`**: entri baru PALING ATAS:

```js
{ v: '1.19.0', date: '2026-07-17', deployed: true, title: 'Hapus tab Reject · admin sekali (fix dobel) · default hari berjalan · bebas admin · reminder bell · export per-MID · rilis & gabung', changes: [
    'Tab & aksi Reject dihapus (tab jadi 4: Checker, Approver, Hold, Settle); Reject by Bank (→ Hold) tetap ada',
    'Fix admin dobel: biaya admin Rp6.500 tidak dikenakan pada settlement Hold — dikenakan sekali saat dana kembali/tergabung ke Checker (chargeback tetap dihitung)',
    'Default view semua tab = hari berjalan (filter tanggal terisi hari ini); seed ditambah data hari ini',
    'Flag akun bebas admin (UMKM/yayasan) per norek + badge BEBAS ADMIN + 1 contoh merchant seed',
    '2 reminder baru di lonceng: hold tanpa bukti & settlement belum di-settle > 3 hari (mock — riil via Telegram)',
    'Export tab Settle jadi detail per MID per norek (mirip List Settlement di Detail ID Settlement)',
    'Retry Settlement bisa ganti Channel Payment (opsional)',
    'Field Catatan form Settle disiapkan tertaut ke deskripsi transaksi bank (Fase API) — hint di form & detail',
    'Konfirmasi Bulk Settle: jumlah transaksi dihapus dari tiap Breakdown per Bank Tujuan',
    'Bukti: terima ZIP/RAR (maks 25 MB, 1 file); tombol Lihat diganti Download (viewer dihapus)',
    'Tab Hold: checklist baris Siap Release + tombol Rilis & Gabung — split hold-min norek sama dilebur jadi 1 baris di Checker (tanggal perubahan terbaru)'
] },
```

   dan ubah entri `1.18.3` menjadi `deployed: false`.
4. **`CHANGELOG.md`**: tambah `## [1.19.0] — 2026-07-17` di atas 1.18.3, section `### Added / Changed / Fixed / Removed` merangkum poin yang sama (Removed: tab & aksi Reject, viewer bukti; Fixed: admin dobel; Added: sisanya).
5. **`page-guide.js`** (GUIDES['auto-settlement.html'], baris 36–80) — sinkronkan:
   - Item "Alur Tab": hapus penyebutan tab/hasil Reject ("hasil masuk ke tab Hold atau Settle"), tulis default filter = hari berjalan (ganti kalimat "Default filter: semua tanggal."), sebut admin tidak berlaku di Hold + bebas admin.
   - Item "Tab Checker — aksi": hapus aksi Reject & Bulk Reject; sebutkan hint Catatan Fase API di Settle.
   - Item "Tab Hold & Reject + akumulasi Siap Release" → ganti judul "Tab Hold + akumulasi Siap Release & Rilis & Gabung"; hapus paragraf tab Reject; tambah paragraf checklist Siap Release + Rilis & Gabung (gabung 1 baris per bank+norek).
   - Item "Notifikasi …lonceng": tambah 2 reminder (hold tanpa bukti, belum settle > 3 hari) + catatan mock/Telegram.
   - Item "Tab Settle …": tambah Retry bisa ganti channel; bukti Download.
   - Item "Export …": export Settle per MID per norek; format bukti ZIP/RAR tidak relevan di sini.
   - Item pertama (Unit data): tambah kalimat admin tidak dikenakan saat Hold; bebas admin.
6. **`SETTLEMENT-REFERENCE.md`**: update §3 (STATUS_LABEL tanpa reject; totalOf pakai adminOf; FEE_EXEMPT), §5 (tab jadi 4, diagram tanpa Reject), §6 (hapus 6.4 Reject; Hold tambah Rilis & Gabung; Settle retry channel), §7.2 (nilai contoh 4.000 tanpa admin), §9 (default filter hari ini; hapus opsi filter reject), §10 (export settle per-MID), §11 (SEED_VER baru), header "Reflects code at VERSION 1.19.0". Hapus catatan §12 tentang dead branch `scope==='anomaly'` bila ikut terhapus (exportRowData hold masih punya `rq.scope === 'anomaly' ? '-'` js:1635 — biarkan atau hapus sekalian; putuskan: hapus sekalian, catat).
7. **`auto-settlement.html` cache-buster**: naikkan query `auto-settlement.js?v=…` (html:426) mis. `?v=20260717-v28`, dan `page-guide.js?v=…` (html:428) bila diubah.
8. Cek akhir: `node -c auto-settlement.js`; `rtk proxy grep -n "reject" auto-settlement.js` → sisa hanya `rejectbybank`/`rejectreq`/`Reject by Bank`/approver-reject; `grep -n "openBukti\|asBuktiOverlay" auto-settlement.js` → kosong.

### Smoke test menyeluruh (setelah semua step)
1. Clear localStorage → load halaman → console bersih, 4 tab, semua tab berisi data hari ini.
2. Alur penuh: Checker → Settle (Manual) → Approver approve (2FA) → tab Settle Success → Reject by Bank → Hold → Rilis ke Checker.
3. Hold: Rilis & Gabung skenario `8830000000001` (Item 11 verif).
4. Export semua tab + Export Segregasi + Report Manajemen tidak error.
5. Bell: 5 notif + footer Telegram.

---

## Ringkasan risiko tertinggi

1. **Listener null di `bind()`** setelah menghapus elemen HTML (`asBulkReject`, `asBuktiClose`, `asBuktiOverlay`) — satu yang terlewat mematikan seluruh halaman.
2. **Item 11 baseId** salah replikasi `baseIdFor` untuk norek multi-bank.
3. **Item 1** — pembaca `g.admin` terlewat → angka tak konsisten antara tabel, summary, detail, export. Grep final wajib.
4. **Item 3** — determinisme seed: perubahan pola konsumsi `_gi` mengubah SEMUA data seed (norek/nominal bergeser). Tidak masalah (SEED_VER di-bump), tapi jangan kaget angka demo berubah; skenario ber-norek fix (883…/884…) tetap stabil karena forceNorek/forceISO.
