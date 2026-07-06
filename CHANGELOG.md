# Changelog — Auto Settlement QRIS Mockup

Semua perubahan penting dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/), versioning [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Aturan: **setiap pengerjaan wajib menambah entri di sini + bump `VERSION` + commit + push + tag git** (`vX.Y.Z`).
- MAJOR: perubahan besar arah/scope. MINOR: fitur baru. PATCH: perbaikan kecil/bugfix/docs.

## [Unreleased]

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
