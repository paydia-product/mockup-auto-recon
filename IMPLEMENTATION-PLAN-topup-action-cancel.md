# Perbaikan Action dan Batal Topup

Tanggal: 29 September 2026. Baseline rilis: `42c9574`.
Status: siap untuk implementasi Sol, lalu audit Astra Ultra.

## Hasil yang diminta

1. Membuka Action hanya membuka menu baris yang diklik. Menutup atau memindahkan menu juga memperbarui status tombol baris sebelumnya.
2. Batal pada Request Edit atau Request Approve kembali ke tampilan asal. Form dari daftar kembali ke daftar yang sama. Form dari Detail kembali ke Detail transaksi yang sama.
3. Pembatalan sebelum submit membuang isian dan preview sementara tanpa membuat request, menyimpan bukti, menambah log/notifikasi, mengubah nominal/status, atau mengubah saldo.

## Bukti dan penyebab

Graph diperiksa lebih dulu. Seluruh `topup-ui.js` dan `topup.css` dibaca, berikut pemanggil di Approval/Log dan penyimpanan bukti dalam `topup-state.js`.

### Temuan terkonfirmasi

- `setupPayin()` hanya mengubah `aria-expanded` tombol yang sedang diklik. Native auto popover menutup menu lama tanpa memperbarui tombol lamanya. Tidak ada satu pemilik menu aktif atau sinkronisasi penutupan native.
- Reproduksi CUA root: setelah Detail004 → Request Approve → Batal, kemudian Action002 dan Action001, tombol 001/002/004 sama-sama memiliki `aria-expanded="true"`, sementara hanya satu `:popover-open`.
- `txDetail()` membuka `editForm()` atau `topupForm()` dengan mengganti isi dialog yang sama. Tidak ada konteks asal. Semua Batal/Tutup langsung memanggil `closeDialog()`, sehingga Detail asal hilang.
- Reproduksi CUA root: Detail004 → Request Approve → Batal menutup seluruh dialog. Seharusnya kembali ke Detail004.
- Reproduksi tambahan: Detail002 → Edit nominal → X juga menutup seluruh Detail. Escape dari form yang dibuka langsung dari daftar sudah membuang draft dan mempertahankan tabel.
- `dialogOpener` dapat menunjuk item dalam popover yang sudah tertutup. Setelah render ulang tabel, elemen itu juga dapat terlepas dari DOM. Pemulihan fokus perlu mengarah ke tombol Action yang masih ada.

### Batas kepastian

- Tampilan semua menu terbuka belum berhasil direproduksi pada browser root. Membuka Edit002 dari daftar lalu Batal mengembalikan tabel yang sama di browser tersebut.
- CSS saat ini hanya menyembunyikan menu melalui `:not(:popover-open)`. Browser yang tidak mengenali selector tersebut akan mengabaikan aturan, sedangkan elemen menu sendiri tidak memiliki `hidden`. Ini merupakan celah kompatibilitas sumber yang sesuai dengan gejala, bukan bukti browser pengguna.
- `liveEvidence()` hanya membuat Blob URL sementara. Penyimpanan IndexedDB baru terjadi saat submit. Perilaku ini harus dipertahankan.

## Batas perubahan

- Implementasi utama: `topup-ui.js`, `topup.css`.
- Bila cache perlu diperbarui: hanya nilai versi referensi topup pada `payin.html`, `approval.html`, `admin.html`, dan `log.html`.
- Tambahkan tes kecil hanya bila memeriksa perilaku nyata dan tidak memerlukan framework baru. Interaksi popover, CSS, fokus, dan kembali ke Detail harus diuji melalui CUA.
- `topup-state.js` dan aturan bisnis tetap sama. Tidak diperlukan API penyimpanan atau mekanisme rollback baru.
- Pertahankan perubahan lama di `app.js`, `index.html`, `page-guide.js`, `settle-recon.html`, dan `settle-recon.js`. Jangan menyertakannya dalam commit atau deployment perbaikan ini.
- Jangan mengubah CSP, autentikasi, Auto Recon, Auto Settlement, atau data legacy.

## Peta pemanggil

| Pintu masuk | Tampilan berikutnya | Tujuan Batal/Tutup |
|---|---|---|
| Action baris → Detail | Detail transaksi | Daftar asal, fokus Action baris asal |
| Action baris → Edit | Request Edit | Daftar asal, fokus Action baris asal |
| Action baris → Request Approve | Request Approve | Daftar asal, fokus Action baris asal |
| Detail → Edit nominal | Request Edit | Detail transaksi yang sama, posisi gulir dan fokus tombol Edit |
| Detail → Request Approve | Request Approve | Detail transaksi yang sama, posisi gulir dan fokus tombol Request Approve |
| Submit berhasil | Konfirmasi hasil | Tutup ke daftar; jangan menghidupkan kembali form/draft sebelumnya |
| Approval → `openRequest()` | Detail request | Tutup seperti sebelumnya |
| Keputusan Approval → `openRequest()` lagi | Detail hasil keputusan | Tetap mengikuti perilaku Approval sebelumnya |
| Log → `openLog()` | Detail audit | Tutup seperti sebelumnya |
| Reset simulator | Penutupan paksa | Tutup seluruh dialog, jangan kembali ke Detail lama |

## Implementasi yang dipilih

### 1. Satu pemilik Action aktif

Pertahankan popover per baris agar perubahan kecil. Tambahkan satu referensi aktif berisi transaksi, tombol, dan panel. Semua buka/tutup melewati helper yang sama.

- Render setiap panel dalam keadaan `hidden`. Tambahkan aturan khusus topup `[hidden] { display: none !important; }` untuk panel menu. Visibilitas tertutup tidak boleh bergantung pada dukungan `:popover-open`.
- Saat membuka sebuah menu: tutup pemilik lama, set semua tombol lain `aria-expanded="false"`, buka hanya panel transaksi yang diklik, dan set tombol itu `true`.
- Saat tombol yang sama diklik lagi: tutup menu dan kosongkan pemilik aktif.
- Sinkronkan penutupan native (`toggle` atau `beforetoggle` dengan pemeriksaan keadaan terkini), klik luar, dan Escape. Penutupan otomatis tidak boleh meninggalkan `aria-expanded="true"`.
- Tutup menu sebelum membuka dialog apa pun, sebelum mengganti `tbody`, dan pada perubahan halaman/filter/akun/reset. Fokus tujuan dialog diambil dari tombol Action pemilik, bukan item popover.
- Hindari `matches(':popover-open')` sebagai sumber keadaan utama. Jika Popover API tidak tersedia, gunakan panel fixed yang sama dengan `hidden`, satu pemilik aktif, penutupan klik luar/Escape, dan penutupan saat scroll/resize. Jangan menampilkan semua panel sebagai fallback.
- Pertahankan perhitungan posisi dalam viewport dan Action sticky pada tabel yang digulir horizontal.
- Tidak ada perubahan label/status/request baris lain saat menu dibuka. Semua handler form tetap menerima ID dari tombol yang dipilih.

### 2. Konteks kembali untuk form

Gunakan descriptor kecil atau callback terarah, tanpa router atau stack dialog umum.

- Form menerima konteks asal secara eksplisit dari pemanggil: `list` atau `transaction-detail`, ID transaksi, target fokus, dan posisi gulir Detail bila relevan.
- Untuk asal daftar, simpan referensi/selector tombol Action beserta posisi scroll halaman dan pembungkus tabel. Biarkan filter, teks pencarian, halaman pagination, urutan/isi tabel, dan keadaan panel filter tetap utuh.
- Untuk asal Detail, simpan konteks sebelum mengganti isi dialog. Batal merender kembali `txDetail(id)`, memulihkan posisi gulir Detail, lalu fokus tombol yang membuka form dengan `preventScroll`.
- Batal dari daftar menutup dialog dan mengembalikan fokus ke Action baris asal. Menu tetap tertutup. Jangan merender ulang atau mereset daftar hanya karena Batal.
- Tombol X dan Escape mengikuti semantik pembatalan yang sama saat form aktif. Gunakan event native `cancel` dengan `preventDefault()` untuk mencegah Escape melewati handler kembali.
- `openRequest()`, `openLog()`, hasil sukses, dan penutupan paksa reset harus membersihkan konteks form agar tidak kembali ke Detail transaksi yang tidak terkait.
- Saat keluar dari form, cabut Blob URL preview, buang elemen/isian form, dan naikkan serial dialog agar pekerjaan preview lama tidak menyentuh tampilan yang sudah kembali.
- Jika opener lama telah terlepas karena perubahan state sah, cari tombol Action berdasarkan ID transaksi. Jika baris tidak tersedia lagi, fokus kontrol daftar yang masih ada tanpa mengubah filter.

### 3. Submit yang sedang berjalan

Hindari kondisi di mana Batal terlihat berhasil tetapi callback submit kemudian membuat request dan membuka dialog sukses kembali.

- Sebelum submit, Batal/X/Escape selalu membuang draft tanpa penulisan domain atau bukti.
- Setelah submit valid dimulai, tampilkan keadaan mengirim dan nonaktifkan Batal/X sementara; event Escape juga tidak menutup form selama operasi tersebut. Submit merupakan tindakan yang telah dikirim, bukan draft yang dibatalkan.
- Setelah gagal, aktifkan kembali kontrol dan pertahankan form agar pengguna dapat mencoba lagi atau Batal. Setelah berhasil, bersihkan konteks kembali dan tampilkan hasil seperti sebelumnya.
- Jangan menambahkan rollback request atau menghapus bukti yang sudah terikat. Perbaikan ini tidak mengubah semantik domain.

## Acceptance tests

Semua uji browser menggunakan CUA dan data demo. Rekam bukti sebelum/sesudah. Hasil source/unit tidak boleh disebut sebagai hasil browser.

| ID | Langkah | Hasil wajib |
|---|---|---|
| AC01 | Action001 → Action002 → Action001 | Maksimal satu panel terlihat dan satu tombol expanded. Pemilik selalu sama dengan baris yang diklik. |
| AC02 | Tutup menu melalui tombol sama, klik luar, Escape | Tidak ada panel terbuka; seluruh tombol expanded=false. |
| AC03 | Menu terbuka → Detail/Edit/Request Approve | Menu tertutup sebelum modal; kode transaksi/dealer modal cocok dengan baris pilihan. |
| AC04 | Edit dari daftar → isi nominal/alasan/file → Batal | Daftar, filter, search, pagination, scroll, dan isi semua baris sama. Fokus kembali ke Action asal. |
| AC05 | Request Approve dari daftar → pilih file → Batal | Hasil sama dengan AC04; tidak ada bukti baru tersimpan. |
| AC06 | Detail004 → Edit → isi draft/file → Batal | Kembali ke Detail004 dengan nominal/status/saldo yang sama, scroll Detail pulih, fokus Edit. |
| AC07 | Detail004 → Request Approve → pilih file → Batal | Kembali ke Detail004, fokus Request Approve; jumlah request tetap. |
| AC08 | Ulangi asal daftar dan Detail dengan X serta Escape | Tujuan kembali dan pembuangan draft konsisten dengan Batal. |
| AC09 | Batal lalu buka form yang sama dan form baris lain | Nominal usulan/alasan/file/preview draft lama tidak terbawa. Context kembali tidak tertukar. |
| AC10 | Snapshot metadata, request, log, notifikasi, saldo, dan bukti sebelum/sesudah AC04–AC09 | Semua data persisten sama; pemilihan file saja tidak menulis IndexedDB. |
| AC11 | Buka menu lalu ubah halaman/filter/akun/reset | Pemilik lama dibersihkan; tidak ada panel yatim atau expanded=true pada baris lain. |
| AC12 | Menu baris terakhir, hasil search tunggal, halaman 2, viewport 1440 dan 1280 | Menu hanya satu, dapat diklik, tidak terpotong; Action tetap usable setelah horizontal scroll. |
| AC13 | Submit valid pada satu transaksi | Hanya transaksi/request terkait berubah. Baris lain tetap sama; hasil sukses ditutup secara normal. |
| AC14 | Submit berjalan atau gagal | Tidak ada pembatalan semu yang kemudian membuka sukses; setelah gagal Batal kembali berfungsi. |
| AC15 | Approval detail/decision dan Log detail → X/Escape/Tutup | Perilaku lama tetap bekerja; tidak kembali ke Detail Payin yang sebelumnya pernah dibuka. |
| AC16 | Cabang tanpa Popover API | Closed state tetap tersembunyi; satu owner; klik luar/Escape menutup. Catat sebagai source/logic-only jika browser tanpa API tidak tersedia. |

Untuk AC10, bandingkan data sebelum pembukaan form dan setelah pembatalan. Jangan memanggil preview bukti seed yang dapat membuat cache IndexedDB selama pengukuran tersebut.

## Urutan kerja dan verifikasi

1. Sol menerapkan kepemilikan menu dan konteks kembali dalam file topup yang ditentukan.
2. Jalankan `node --check topup-ui.js`, `node topup-state.test.js`, dan `git diff --check`.
3. Astra Ultra membaca diff akhir dan benar-benar menjalankan pemeriksaan yang tersedia. Audit harus memisahkan CUA yang dilakukan sendiri dari bukti root.
4. Jalankan acceptance browser di atas. Prioritas penutupan: AC01–AC10, lalu transaksi sukses, kasus layout, dan smoke shared page.
5. Pastikan hash file legacy yang dilindungi sama dengan baseline awal tugas ini. Setelah perubahan cache/metadata, ulangi hanya pemeriksaan yang terdampak.

## Asumsi

1. “Kembali seperti sebelum action” berarti daftar asal tanpa dropdown terbuka untuk pintu masuk daftar, atau Detail asal untuk pintu masuk Detail.
2. Nilai domain yang berubah sah dari tab lain tetap menjadi sumber kebenaran; Batal tidak memutar balik transaksi atau permission tab lain.
3. Bug visual semua menu belum terkonfirmasi di browser root. Perbaikan satu pemilik dan closed state eksplisit menangani celah yang terbukti tanpa mengklaim reproduksi visual tersebut.
