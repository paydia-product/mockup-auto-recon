# Gap Analysis — Build Brief Auto Settlement QRIS Fase 1 vs Mockup

Sumber: `mockup-build-brief.md` (2026-07-06). Status mockup dinilai per v1.0.0.
Legend status: ✅ sudah sesuai · ⚠️ ada tapi perlu ubah · ❌ belum ada.

| § | Item | Status | Aksi yang diperlukan | Prioritas |
|---|------|--------|----------------------|-----------|
| 1.1 | Grouping 1 row = 1 rekening, drill-down per-MID | ⚠️ | Kunci grouping saat ini = norek saja; brief = **BANK + NOREK** (nama beda tetap 1 entitas, nama = input paling awal; norek sama bank beda = 2 rekening). Ubah `buildGroups` key jadi bank+norek. | Tinggi |
| 1.2 | Kolom tabel | ✅ | Tanggal Proses = tanggal Ops submit (bukan hari ini) — perlu dipastikan pakai tanggal data. | Rendah |
| 1.3 | **Panel Summary per bank tujuan** | ❌ | Tambah panel ringkasan dinamis di atas tabel: per bank → nominal awal, −admin, ±chargeback, **nominal ending**, + total admin & total chargeback. | Tinggi |
| 1.4 | Filter bank tujuan **per bank terpisah** | ⚠️ | Sekarang dikelompok "Bank Lainnya". Brief: list tiap bank merchant terpisah (BRI, Mandiri, NOBU, Jago, Permata…), jangan pakai "lainnya". | **Sedang — batch ini** |
| 1.5 | Badge akumulasi hold <Rp10.000 | ❌ | Badge "ada transaksi lain / bisa memenuhi 10rb" bila norek ter-hold <10rb muncul lagi. | Sedang |
| 1.6 | Bulk + Single untuk **ketiga** aksi | ⚠️ | Sekarang bulk hanya Settle. Tambah Bulk Hold & Bulk Reject (max 50/hal, catatan/bukti sama untuk semua). | Tinggi |
| 2.1 | Modal Settle: metode Manual/Otomatis (Otomatis disabled Fase 2), channel, **On-Us/IFT** | ⚠️ | Otomatis harus disabled+tooltip "Fase 2"; tambah opsi On-Us/IFT (intra-bank). | Tinggi |
| 2.2 | **Modal konfirmasi summary** | ❌ | Setelah pilih: channel sumber, bank tujuan, quantity, total nominal akhir; multi-tujuan → breakdown + grand total. | Tinggi |
| 2.3 | Settle → Approver (satu-satunya wajib approval) | ✅ | — | — |
| 3.1 | 3 jenis hold; parsial realtime + input manual nominal; pecah release+hold | ⚠️ | Hold parsial sudah pecah; tambah nominal realtime saat ceklis + field input manual nominal sub-MID. | Sedang |
| 3.2 | Catatan wajib, bukti **tidak** mandatory saat aksi | ⚠️ | Sekarang Hold Partial mewajibkan bukti. Ubah: bukti opsional semua jenis (nyusul di tab Hold). | Sedang |
| 3.3 | Settle di tab Hold **tanpa approval**, approver ter-notice | ❌ | Ubah logic: rilis/settle dari Hold langsung, approver hanya ter-notice (beda warna + kolom status/tanggal). | Sedang |
| 3.4 | Rilis semua jenis hold balik ke **Checker** | ⚠️ | Tab Hold: aksi "gabung ke settlement berjalan" / "tetap hold"; yang rilis = checker pembuat. | Sedang |
| 3.5 | Koreksi hold → balik ke checker tanpa approval | ⚠️ | Pastikan Hold→Checker langsung. | Rendah |
| 4 | Hold <Rp10.000 patokan **bank tujuan** (BCA/BRI/Mandiri boleh) + penyatuan baris di approver | ⚠️ | Logic auto-hold sudah ada; tambah penyatuan baris hold+reguler di approver (kecuali >Rp50jt). Kompleks. | Sedang |
| 5.1 | Preview/detail approval per request | ✅ | — | — |
| 5.2 | **2FA saat approve & reject** | ❌ | Tambah modal 2FA (PIN/authenticator) sebelum approve/reject. | Tinggi |
| 5.3 | **Bulk approve** + preview | ❌ | Tambah bulk approve di tab Approver. | Tinggi |
| 5.4 | Approver read-only, notice beda warna | ⚠️ | Pastikan tidak ada edit; tambah warna notice (release hold = hijau). | Rendah |
| 5.5 | Bulk settle → modal konfirmasi **summary** | ❌ | Sama seperti 2.2 untuk bulk. | Tinggi |
| 6.1 | Reject (jarang) catatan wajib, bukti opsional → Approver | ✅ | — | — |
| 6.2 | Reject by Bank (manual) → Approver → masuk **Hold** | ⚠️ | Sekarang approve → balik ke Settle (rejectbybank). Brief: masuk **Hold** (untuk besok). Ubah. | Sedang |
| 6.3 | Status sistem = status terakhir; riwayat tak dihapus | ⚠️ | Pastikan filter by status/tanggal + riwayat. | Rendah |
| 7 | **Anti-tamper** field master read-only total | ⚠️ | Sebagian read-only; audit semua layar, pastikan tak ada input untuk norek/nama/bank/nominal/relasi MID↔norek. | Tinggi |
| 8 | **Deteksi perubahan rekening** (badge baru / anomali auto-hold) | ❌ | Merchant tunggal by MID vs settlement terakhir: badge "baru", "perubahan dgn pemberitahuan", "anomali → auto-hold" merah. | Sedang |
| 9.1 | Export segregasi per bank (Manual) | ✅ | Ada; pastikan template per-via-bank + sudah include dispute. | Rendah |
| 9.2 | **Export report ke Manajemen** | ❌ | Summary harian: pisah Otomatis/Manual → channel → bank tujuan → nominal+qty; total sukses/rilis/hold (breakdown). | Tinggi |
| 10 | **Guard split >Rp250jt BI-FAST** (blok + warning), Indonusa selalu BI-FAST | ❌ | Blok pilih BI-FAST bila >Rp250jt + peringatan; RTGS untuk >Rp500jt; hardcode pengecualian Indonusa. | **Sedang — batch ini** |
| 11 | Out of scope (API bank, retry, auto-split, sharing fee Indonusa, log request/response) | ✅ | Jangan dibangun. Otomatis = placeholder/disabled. | — |

## Rencana batch implementasi

- **Batch 1 (v1.1.0) ✅ SELESAI:** §1.4 filter bank terpisah · §10 guard >250jt BI-FAST.
- **Batch 2 (v1.2.0) ✅ SELESAI:** §1.1 grouping bank+norek · §1.3 Panel Summary · §1.6 Bulk Hold/Reject.
- **Batch 3–7 (v1.3.0) ✅ SELESAI:** §2.1 On-Us/IFT + Otomatis disabled · §2.2/§5.5 modal konfirmasi summary · §5.2 2FA · §5.3 Bulk approve · §3.2/§3.3/§3.4/§3.5 logic Hold & rilis · §6.2 reject-by-bank → Hold · §8 deteksi perubahan rekening · §9.2 export manajemen · §1.5 badge akumulasi · §4 notice include-hold.
- §7 anti-tamper: field master (norek/nama/bank/nominal/relasi MID↔norek) di-render read-only tanpa input edit di semua layar — sudah sesuai, tidak ada aksi edit master.

Catatan §4: penyatuan baris <Rp10.000 diimplementasi sebagai **notice "include hold"** di preview Approver (auto-merge penuh lintas-batch bersifat minimal per brief). §10 auto-split & retry Otomatis = Fase 2 (out of scope).

Setiap perubahan = bump versi + entri CHANGELOG + tag + deploy.
