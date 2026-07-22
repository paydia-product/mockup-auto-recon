# Plan — Versioning untuk Auto Reconcile (samakan dgn Auto Settlement)

Planned by Opus 4.8. Implement by Sonnet 5. Audit by Opus 4.8. Fix by Sonnet 5.

## Goal
Auto Reconcile page (`index.html`, "QRIS Acquirer Reconcile") mendapat **in-app version
picker** persis pola Auto Settlement (`versions.js` + `#versionPicker` di topbar).
Recon punya changelog sendiri (independen dari Auto Settlement).

## Pola sumber (Auto Settlement — jangan diubah)
- `auto-settlement.html:169` → `<div id="versionPicker" style="margin-right:12px;"></div>` di `.topbar-right`
- `auto-settlement.html:418` → `<script src="versions.js?v=..."></script>`
- `versions.js` = self-contained IIFE: array `VERSIONS` (newest-first, `deployed:true` → badge, `VERSIONS[0]` = Latest) + `mount()` ke `#versionPicker`, pakai `window.showToast`.

## Perubahan (surgical)

### 1. Buat `versions-recon.js` (clone UI dari `versions.js`, data recon sendiri)
Salin **seluruh** kode UI `versions.js` (fn `relTime`, `esc`, `badge`, `renderList`,
`mount`, boot) apa adanya. Ganti hanya:
- Header comment → "Auto Reconcile — Version Picker".
- Array `VERSIONS` diganti data recon (newest-first) berikut:

```js
var VERSIONS = [
    { v: '1.3.0', date: '2026-07-01', deployed: true, title: 'Sidebar satu sumber + panduan halaman sinkron PRD', changes: [
        'Sidebar Auto Reconcile jadi satu sumber kebenaran (sidebar.js) di semua halaman',
        'Panduan Halaman auto-recon disinkronkan dengan PRD + perubahan terkini'
    ] },
    { v: '1.2.0', date: '2026-06-24', deployed: false, title: 'Halaman Admin, grouped Settle & Recon, export gating', changes: [
        'Halaman Admin (permission per segmen) + boot.js bersama antar halaman',
        'Kolom Settle & Recon dikelompokkan; urutan kolom dirapikan',
        'Export di-gate per tipe; baris total di export dihapus; Log filter redesign',
        'Bugfix: pagination nyata, seed match/decline, persistensi approval, modal + sidebar'
    ] },
    { v: '1.1.0', date: '2026-06-23', deployed: false, title: 'Unmatch page + guard Tolak sesuai PRD', changes: [
        'Logika halaman Unmatch + seed data disesuaikan PRD',
        'Reset filter saat pindah tab; gate aksi Tolak pada status gagal; seed validasi'
    ] },
    { v: '1.0.0', date: '2026-06-23', deployed: false, title: 'Baseline Auto Reconcile', changes: [
        'Dashboard QRIS Acquirer Reconcile: summary cards Total / Matched / Unmatched',
        'Tabel rekonsiliasi transaksi, filter tanggal, pencarian, struktur multi-tab + seed awal'
    ] }
];
```

### 2. Edit `index.html`
- Di `.topbar-right` (sekitar baris 251), **sebelum** `#notificationBtn`, tambah:
  `<div id="versionPicker" style="margin-right:12px;"></div>`
- **Setelah** `<script src="app.js?...">` (baris 902), tambah:
  `<script src="versions-recon.js?v=20260722-v1"></script>`
  (harus setelah app.js supaya `window.showToast` sudah ada — sama seperti settlement).

## Batasan / non-goals
- Hanya `index.html` yang dapat picker (Auto Settlement pun single-page). Halaman recon
  lain (settle-recon, transaksi, dst) tidak — bisa diperluas nanti kalau diminta.
- `versions.js` (Auto Settlement) TIDAK disentuh. `VERSION` file & `CHANGELOG.md` global TIDAK diubah.
- "Muat versi" bersifat mock (tampilan) — sama seperti Auto Settlement.

## Success criteria (verifiable di browser)
1. Buka `index.html` → tombol `v1.3.0 Latest` muncul di topbar kanan (kiri lonceng).
2. Klik → panel dropdown terbuka: 4 versi, badge Latest di 1.3.0, badge 🌐 Deployed di 1.3.0, search box, link CHANGELOG, tombol "Muat versi ini".
3. Ketik di search → list ter-filter.
4. Pilih versi lain → klik "Muat versi ini" → toast muncul, label berubah, panel tutup.
5. Auto Settlement page tetap berfungsi (picker-nya tidak berubah).
6. Tidak ada error console.
