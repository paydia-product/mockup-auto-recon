# Mockup kontrol nominal topup dealer

Target produksi: [Payin di ar-mockup.vercel.app](https://ar-mockup.vercel.app/payin.html), memerlukan login. URL ini perlu diverifikasi setelah deployment. Untuk lokal, buka [Payin lokal](http://127.0.0.1:8765/payin.html); jika server belum aktif, jalankan `python3 -m http.server 8765` dari folder ini. Navigasi Payin, Approval, Admin, dan Log memakai data simulasi yang sama selama browser menyimpan data situs lokal.

## Akun demo

Pemilih akun berada di panel **Simulasi Topup Dealer** di bawah konten setiap halaman. Nama di bawah adalah identitas Admin contoh yang sudah ada; perannya hanya konfigurasi demo.

| Akun | Kegunaan |
|---|---|
| Dion | L1: ajukan Request Edit atau Request Approve |
| izarlvl2 | L2: permission Topup Manual untuk memutuskan topup |
| King Kenny 1 | L3: permission Request Adjustment |
| Izar | Tanpa hak pengajuan atau approval topup |
| BlackVolk | L1 dan L3: coba larangan memutuskan Request Adjustment sendiri (TOPUP-010) |

Permission **Request Adjustment** dan **Topup Manual** dapat diubah di Admin → Edit → segmen Approval → Simpan. Perubahan izin berlaku saat aksi approval dijalankan.

## Jalur yang bisa dicoba

1. **Nominal sesuai:** TOPUP-001 → Detail / Request Approve → unggah bukti → pindah akun izarlvl2 di Approval → Approve. Saldo dealer baru naik pada keputusan L2.
2. **Nominal berbeda:** TOPUP-002 → Edit → isi nominal usulan, alasan opsional, unggah bukti → Request Edit → pindah King Kenny 1 di Approval → Approve. Balik ke Payin: nominal baru read-only dan status masih Proses. Unggah bukti baru untuk Request Approve, lalu izarlvl2 memutuskan approval L2.
3. **Status contoh:** TOPUP-003 menunggu L3, TOPUP-004 disetujui L3, TOPUP-005 ditolak L3, TOPUP-006/007 menunggu L2, TOPUP-008 sukses, TOPUP-009 ditolak L2, TOPUP-010 menunggu L3 dari BlackVolk, TOPUP-011 sukses dengan notifikasi gagal.
4. **Audit dan notifikasi:** buka Log, filter `paydia-topup`, lalu Detail. Panel demo menampilkan preview Telegram dan sakelar simulasi kegagalan. Gagal kirim tidak membatalkan keputusan. Reset simulasi topup berada di panel demo dan tidak menghapus data Auto Recon.

Contoh bukti ada di `topup-fixtures/`: dua set PDF/PNG/JPG/JPEG berbeda. Untuk batas ukuran, gunakan `/tmp/paydia-topup-qa/mutasi-tepat-15mb.pdf` dan `/tmp/paydia-topup-qa/mutasi-lebih-15mb.pdf`. File bukti disimpan di IndexedDB browser; metadata request, saldo, log, dan preview notifikasi disimpan pada key lokal khusus topup.

## Pemeriksaan

Jalankan `node topup-state.test.js` untuk guard permission, self-approval, penolakan, kredit sekali, bukti baru, dan kegagalan Telegram. Jalankan `node --check` pada `topup-state.js`, `topup-ui.js`, `approval.js`, `admin.js`, dan `log.js` setelah perubahan.

## Batas demo dan asumsi

Tidak ada transaksi uang, backend produksi, atau pengiriman Telegram sungguhan. Label approval L2 mengikuti tipe existing **Ubah Status Top Up Pengguna** dan permission existing **Topup Manual** untuk simulasi dealer. Screenshot yang tersedia hanya daftar Payin kosong; detail, form, serta penyesuaian visual mengikuti komponen repo dan belum diverifikasi sebagai replika UI produksi. Request demo berjalan berurutan. Kebijakan adjustment bersamaan, nominal maksimum, unggah ulang isi dokumen yang sama, dan review Risk Management tetap terbuka.

## Inventaris file pekerjaan ini

**Halaman, modul, tes, dan dokumen baru**

- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/payin.html`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-state.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-state.test.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-ui.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup.css`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/IMPLEMENTATION-PLAN-topup-authorization.md`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/TOPUP-QA-REPORT.md`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/TOPUP-MOCKUP.md`

**Integrasi kecil pada file existing**

- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/VERSION`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/CHANGELOG.md`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/vercel.json` (konfigurasi CSP deployment; perubahan dikerjakan terpisah oleh root)
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/sidebar.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/approval.html`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/approval.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/admin.html`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/admin.js`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/log.html`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/log.js`

**Bukti demo baru**

- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-1.png`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-1.jpg`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-1.jpeg`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-1.pdf`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-2.png`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-2.jpg`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-2.jpeg`
- `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/topup-fixtures/mutasi-demo-2.pdf`

**Perubahan pengguna yang sudah ada sebelum pekerjaan ini dan tidak disentuh:** `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/app.js`, `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/index.html`, `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/page-guide.js`, `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/settle-recon.html`, dan `/Users/dionscholus/Documents/claude/Paydia/paydia auto recon mockup/settle-recon.js`.
