# Changelog — Auto Settlement QRIS Mockup

Semua perubahan penting dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/), versioning [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Aturan: **setiap pengerjaan wajib menambah entri di sini + bump `VERSION` + commit + push + tag git** (`vX.Y.Z`).
- MAJOR: perubahan besar arah/scope. MINOR: fitur baru. PATCH: perbaikan kecil/bugfix/docs.

## [Unreleased]

## [1.5.0] — 2026-07-06
### Changed
- **Export Report Manajemen** kini hanya muncul di tab **Settle** (sebelumnya di semua tab kecuali Approver).
- **Summary per Bank Tujuan** kini hanya di tab **Checker**; nominal selalu dinamis dari data yang sedang ada di Checker (respek filter/search).
- **Konfirmasi settle single** disederhanakan jadi kalimat: "Konfirmasi Pengajuan Settle ke {norek} dari bank {bank} dengan nama pemilik {pemilik} sebesar {nominal}".
- **Konfirmasi bulk settle**: breakdown per rekening (kolom No. Rekening + Nama Pemilik), label "Quantity" → "Jumlah Baris (entry settlement)", "Grand Total Disburse" → "Grand Total Settlement".
- **Hold & Reject**: fungsi tambah/lihat bukti disatukan ke modal catatan, dinamai ulang **"Lihat Bukti"** (upload/ganti bukti + lihat catatan dalam satu modal).
### Added
- **Pecah Manual BI-FAST** (§10): nominal > Rp250 juta via BI-FAST otomatis dipecah jadi beberapa transfer ≤ Rp250 juta; breakdown transfer ditampilkan di konfirmasi settle. Alternatif RTGS (> Rp500 juta) tetap disebut.
- **Search by No. Rekening** di semua tab (selain ID Settlement & Nama Pemilik).
- **Approver — Simulasi 2FA Salah**: toggle di toolbar; saat aktif, PIN 2FA yang dimasukkan selalu dianggap salah dan memunculkan pesan error (uji error path).

## [1.4.0] — 2026-07-06
### Added
- **Version picker UI** (`versions.js`): dropdown di topbar Auto Settlement QRIS untuk pilih versi & lihat changelog tiap versi (badge Latest/Deployed, pencarian, link ke CHANGELOG). Catatan: "muat versi" bersifat tampilan (mock) — build aktif tetap Latest.

## [1.3.0] — 2026-07-06
Build-brief Fase 1 — Batch 3–7 (sisa brief) sekaligus. Ref: `BRIEF-GAP-ANALYSIS.md`.

### Added
- §2.2/§5.5 Modal konfirmasi summary sebelum settle (single & bulk): channel sumber, metode, quantity, breakdown per bank tujuan + Grand Total Disburse.
- §5.2 2FA (PIN 6 digit) wajib saat approve & reject (single & bulk).
- §5.3 Bulk Approve & Bulk Reject di tab Approver (2FA sekali untuk semua).
- §8 Deteksi perubahan rekening (merchant tunggal): badge Baru / Norek berubah (ada pemberitahuan) / Anomali Rekening; anomali tanpa pemberitahuan → auto-hold. + seed demo (Fathurroji).
- §9.2 Export Report Manajemen: per metode (Manual/Otomatis) → channel → bank tujuan (nominal+qty) + rekap Sukses/Dirilis/Hold (below 10rb, request, reject by bank); Pending/Fail = 0 (Otomatis, Fase 2).
- §1.5 Badge "Akumulasi <Rp10.000" pada hold di bawah minimum.
- §3.3/§3.4/§3.5 Tab Hold: aksi "Rilis ke Checker" (tanpa approval) + "Tambah/Lihat Bukti".
- §4 Notice "include hold" di preview Approver (penyatuan baris <Rp10.000).

### Changed
- §2.1 Metode Transfer: BI-Fast · On-Us / IFT · RTGS. Metode Settlement Otomatis di-disable (tooltip Fase 2).
- §3.2 Bukti hold tidak lagi wajib (semua jenis termasuk Hold Partial) — boleh menyusul via tab Hold.
- §6.2 Reject by Bank yang di-approve → masuk tab Hold (kategori HOLD), bukan balik ke Settle.

## [1.2.1] — 2026-07-06
Docs untuk Batch 2.

### Changed
- Panduan Halaman: grouping Bank+Norek, Panel Summary per bank, Bulk Aksi (Hold/Reject/Settle).
- BRIEF-GAP-ANALYSIS.md: tandai Batch 1 & 2 selesai.


## [1.2.0] — 2026-07-06
Build-brief Fase 1 — Batch 2. Ref: `BRIEF-GAP-ANALYSIS.md`.

### Added
- §1.3 Panel Summary per bank tujuan (dinamis atas tabel): Nominal Awal, Admin, Chargeback (+/−), Nominal Ending per bank + baris Total.
- §1.6 Bulk Hold & Bulk Reject (selain Bulk Settle); catatan sama untuk semua baris, bukti opsional. Tombol bulk per tab mengikuti aksi single (checker: Hold/Reject/Settle · hold: Reject/Settle · reject: Hold/Settle).
- Seed demo §1.1: bank+norek sama nama beda (1 entitas, nama input paling awal) & norek sama bank beda (2 rekening).

### Changed
- §1.1 Grouping kunci = BANK + NOREK (bukan norek saja). Norek sama + bank beda = 2 rekening terpisah (groupId di-encode bank saat norek dipakai >1 bank). Split hold-partial ikut bank-aware.
- Tombol bulk-mode di-rename "Bulk Settle" → "Bulk Aksi".

## [1.1.0] — 2026-07-06
Build-brief Fase 1 — Batch 1. Ref: `BRIEF-GAP-ANALYSIS.md`.

### Added
- §10 Guard split BI-FAST: nominal > Rp250 juta tidak bisa via BI-FAST — peringatan inline di modal Settle + blok saat submit (single & bulk). Pengecualian merchant Indonusa (selalu BI-FAST).
- `BRIEF-GAP-ANALYSIS.md`: pemetaan brief → status mockup + rencana batch.

### Changed
- §1.4 Filter bank tujuan kini melistkan tiap bank merchant terpisah (BCA, BRI, Mandiri, NOBU, Permata, Jago, dst) secara dinamis; tidak lagi dikelompok "Bank Lainnya".

## [1.0.0] — 2026-07-06
Baseline: kondisi mockup Auto Settlement QRIS sebelum eksekusi build-brief Fase 1. Merangkum seluruh pengerjaan sesi 1–3.

### Added
- Struktur 5 tab: Checker · Approver · Hold · Reject · Settle, dengan pagination, search (ID Settlement / Nama Pemilik), filter per-tab.
- Grouping settlement per nomor rekening; detail per-MID (List Settlement) read-only.
- Kolom lengkap: No, Tanggal Proses, ID Settlement, Nominal Awal, Admin, Adj. Chargeback (+/−), Total Settle, Bank, Nomor Rekening, Nama Pemilik.
- Aksi Checker: Hold (Semua / Partial / Dibawah Min.), Reject, Settle; Bulk Settle.
- Hold Partial memecah MID jadi settlement baru terpisah; sisa MID tetap di Checker.
- Auto-hold: Total Settle < Rp10.000 untuk bank tujuan non-BCA/Mandiri/BRI.
- Settle: Metode Settlement (Manual → Success, Otomatis → Pending), Channel Payment, Metode Transfer.
- Tab Settle: kolom Channel Payment/Metode Settlement/Status, Simulasi Status, Retry Settlement, Lihat Detail (Request/Response hanya Otomatis).
- Reject by Bank (item Manual) via approval Approver + guard "menunggu approval".
- Export per tab (kolom tab-specific) + Export Segregasi per Bank (tabel A–K + Grand Total, khusus Manual).
- Seed 20 settlement deterministik untuk full-flow testing.
- Admin: 3 segmen permission (Checker/Approver/Result). Log: contoh entri semua aksi. Panduan Halaman.
- Dokumentasi flow: `FLOW-AUTO-SETTLEMENT.md` (10 diagram mermaid).

### Notes
- Rename "Auto Settlement" → "Auto Settlement QRIS" (judul, breadcrumb, sidebar).
