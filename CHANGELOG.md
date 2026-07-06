# Changelog — Auto Settlement QRIS Mockup

Semua perubahan penting dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/), versioning [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Aturan: **setiap pengerjaan wajib menambah entri di sini + bump `VERSION` + commit + push + tag git** (`vX.Y.Z`).
- MAJOR: perubahan besar arah/scope. MINOR: fitur baru. PATCH: perbaikan kecil/bugfix/docs.

## [Unreleased]

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
