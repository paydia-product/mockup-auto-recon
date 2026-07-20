# IMPLEMENTATION-PLAN v1.21.0 — 3 perubahan

Basis: v1.20.0 (working tree bersih). File: `auto-settlement.js` (~2240 baris), `auto-settlement.html`.
Baris merujuk snapshot v1.20.0. Gaya ES5. Surgical — sentuh hanya yang perlu, hapus orphan yang perubahanmu sendiri buat. TIDAK ada perubahan seed → SEED_VER tidak di-bump.

---

## Item 1 — Pindah "Kelola Bebas Admin" ke sidebar + tanda MOCKUP

**Sekarang:** tombol toolbar `#asFeeExemptBtn` (HTML baris 211), bind di JS baris 2224.

**HTML — hapus tombol toolbar (baris 211):** hapus seluruh baris `<button ... id="asFeeExemptBtn" ...>Kelola Bebas Admin</button>`.

**HTML — tambah submenu-item di grup Settlement**, setelah link Auto Settlement QRIS (setelah baris 119, di dalam `<div class="submenu open">`):
```html
<a href="#" class="submenu-item" id="nav-fee-exempt">
    <i class="fas fa-hand-holding-dollar"></i><span>Kelola Bebas Admin <span style="font-size:0.58rem;font-weight:700;background:#f59e0b22;color:#b45309;border-radius:4px;padding:1px 5px;margin-left:4px;vertical-align:middle;">MOCKUP</span></span>
</a>
```
(Tanda "MOCKUP" = pemenuhan "kasih tanda ini mockup aja".)

**JS bind (baris 2224-2225):** ganti id + preventDefault (karena `href="#"`):
```js
var feBtn = document.getElementById('nav-fee-exempt');
if (feBtn) feBtn.addEventListener('click', function (e) { e.preventDefault(); openFeeExemptModal(); });
```

**Ripple:** `openFeeExemptModal` tak berubah. Sidebar per-halaman (inline di auto-settlement.html) → hanya halaman ini yang dapat menu. Pola `href="#"` sama dgn nav-item lain (Merchant/Vendor) yang tak navigasi → aman; preventDefault mencegah lompat `#`.

**Verify browser:** toolbar tak lagi punya tombol Kelola Bebas Admin. Sidebar grup Settlement punya item "Kelola Bebas Admin" + badge MOCKUP → klik = modal terbuka (tanpa reload/scroll ke atas). Tambah/hapus norek tetap jalan.

**Risk:** sidebar.js mungkin punya handler global nav-item. Cek tidak ada dobel-trigger / navigasi. preventDefault menahan default anchor.

---

## Item 2 — Bulk Settle: field Catatan di bawah Metode Transfer

**openBulkSettle body (baris 1354):** tambah `noteField(false)` setelah `metodeField()` (di bawah Metode Transfer), sebelum warning:
```js
var body = '<p ...>Bulk settle <b>' + selected.size + '</b> entry terpilih.</p>' + metodeSettlementField() + channelField() + metodeField() + noteField(false) + SETTLE_NOTE_WARNING;
```

**Thread nilai catatan ke request.** Modal kedua (Konfirmasi) meng-`openModal` → mengganti body → `#asReason` hilang. Jadi CAPTURE nilai di onClick "Lanjut" SEBELUM buka konfirmasi.
- Di onClick "Lanjut" (baris 1357, setelah `var arr = ...` baris 1366): tambah
  ```js
  var reason = (document.getElementById('asReason') || {}).value || '';
  ```
- Confirm onClick (baris 1370): `reason: ''` → `reason: reason.trim()`.
- (Opsional log: boleh biarkan writeLog apa adanya.)

**Verify browser:** Bulk Settle → modal aksi tampil field Catatan tepat di bawah Metode Transfer (di atas banner Perhatian). Isi catatan → Lanjut → Konfirmasi & Ajukan → buka detail salah satu entry di tab Approver → field Catatan = teks yang diisi.

**Risk:** id `asReason` tidak bentrok (field lain pakai asMetodeSettle/asChannel/asMetode). Catatan opsional (`noteField(false)`) → kosong = reason '' (perilaku lama). OK.

---

## Item 3 — Tabel breakdown konfirmasi Bulk Settle

### 3a — Tambah kolom Nomor Rekening (selain Jumlah Rekening)

**renderSbtBody (baris 1181-1196):** tambah kolom "Nomor Rekening" (daftar norek per bank) sebelum/berdampingan Jumlah Rekening.
- Header (baris 1194-1195): jadi 5 kolom:
  `No · Bank Tujuan · Nomor Rekening · Jumlah Rekening · Total (Rp)`.
- Row (baris 1186-1188): tambah sel norek:
  ```js
  '<td style="padding:6px 10px;font-variant-numeric:tabular-nums;word-break:break-all;max-width:220px;">' + esc(d.noreks.join(', ')) + '</td>' +
  ```
  taruh setelah sel Bank Tujuan, sebelum sel Jumlah Rekening.
- Empty state colspan: `4` → `5` (baris 1189).

### 3b — Tombol Cari; pencarian hanya jalan saat tombol diklik

**settleBankTable (baris 1172):** bungkus input + tombol Cari dalam flex row (ganti input tunggal):
```js
'<div style="display:flex;gap:8px;margin-bottom:8px;">' +
'<input type="text" id="asSbtSearch" placeholder="Cari nama bank / nomor rekening…" style="flex:1;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:0.82rem;">' +
'<button type="button" id="asSbtCari" class="btn" style="background:var(--primary);color:#fff;border:none;padding:8px 16px;font-weight:600;">Cari</button></div>' +
```

**bindSbt (baris 1197-1203):** hapus listener `input` (live search). Ganti dgn klik tombol Cari:
```js
function bindSbt() {
    var s = document.getElementById('asSbtSearch'); if (!s) return;
    var cari = document.getElementById('asSbtCari');
    if (cari) cari.addEventListener('click', function () { _sbtSearch = s.value; _sbtPage = 1; renderSbtBody(); });
    var box = document.getElementById('asSbtBody');
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-sbt]'); if (!b) return; if (b.dataset.sbt === 'prev' && _sbtPage > 1) _sbtPage--; if (b.dataset.sbt === 'next') _sbtPage++; renderSbtBody(); });
    renderSbtBody();
}
```
(_sbtFiltered tak berubah — sudah cocokkan bank name OR norek.)

**Verify browser:** Bulk Settle >5 bank → Konfirmasi: tabel punya kolom Nomor Rekening (daftar norek per bank) + Jumlah Rekening. Ketik "BCA" di search TANPA klik → tabel TIDAK berubah. Klik Cari → baru terfilter. Kosongkan + Cari → semua kembali. Search norek → bank pemiliknya muncul. Pagination tetap jalan.

**Risk:** setelah filter via Cari, `_sbtPage` reset ke 1 (benar). Fokus input terjaga (hanya #asSbtBody re-render). Kolom norek panjang → `word-break` + `max-width` cegah tabel melebar berlebihan.

---

## Versi & sinkronisasi
- `VERSION`: 1.20.0 → **1.21.0**.
- `versions.js`: entri 1.21.0 paling atas `deployed:true`; 1.20.0 → `deployed:false`.
- `CHANGELOG.md`: entri 1.21.0 (Changed/Added, Bahasa Indonesia).
- HTML cache-buster (`?v=`) — bump (mis. `20260720-v2`).
- **SEED_VER: JANGAN bump** (tak ada perubahan seed).
- `page-guide.js` `GUIDES['auto-settlement.html']`: sync — Kelola Bebas Admin pindah ke sidebar (MOCKUP), Bulk Settle punya field Catatan, tabel breakdown punya kolom Nomor Rekening + tombol Cari (search manual).
- `SETTLEMENT-REFERENCE.md`: sync bagian bulk settle & bebas admin.

## Cek wajib sebelum lapor
- `node -c auto-settlement.js`, `node -c versions.js`, `node -c page-guide.js` lolos.
- `rtk proxy grep -n "asFeeExemptBtn" auto-settlement.js auto-settlement.html` → 0 sisa (id lama terganti).
- Tidak ada `addEventListener` ke elemen null di `bind()` (guard `if (feBtn)`, `if (cari)`).
- JANGAN commit/tag/push/deploy — tugas orchestrator.
