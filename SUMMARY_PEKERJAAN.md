# Ringkasan Pekerjaan Pengembangan Mockup Dashboard Paydia Auto Reconcile

Dokumen ini berisi rangkuman komprehensif seluruh pekerjaan pengembangan, modifikasi, dan perbaikan bug yang telah diimplementasikan pada mockup dashboard **Paydia Auto Reconcile (QRIS Acquirer & Issuer)**. Penjelasan dibagi secara terperinci berdasarkan halaman dan per fitur dari halaman tersebut, ditinjau dari segi **Tampilan (UI/Visual)**, **Flow (Alur Pengguna)**, dan **Logic (Logika Kode/Sistem)**.

---

## 1. Desain Sistem & Estetika Visual (Global)

*   **Tampilan**: Dashboard ini dirancang dengan gaya **Premium Light-Mode (White Theme)** dengan latar belakang bersih (`#ffffff`), bayangan kartu yang halus (*subtle shadows*), dan aksen gradasi yang elegan di beberapa bagian. Seluruh navigasi menggunakan font modern **Inter** dan ikon dari **Font Awesome 6.5.1**.
*   **Watermark Disclaimer**: Di pojok kanan bawah seluruh halaman dashboard (termasuk halaman Login), terdapat box melayang (*fixed positioning*) bertuliskan:
    *   *Mockup - Final Result May Different*
    *   *Confidential | Do Not Share Without Permission*
    Ditampilkan dengan latar belakang putih semi-transparan, bayangan halus, teks berwarna hitam tajam berukuran `0.75rem` agar terbaca jelas namun tidak menutupi elemen interaktif.
*   **Perbaikan Cache-Busting (v7)**: Menggunakan mekanisme pembersihan `localStorage` sekali jalan jika mendeteksi perbedaan versi mockup (versi saat ini: `v7`). Ini memperbaiki masalah *database wipe loop* yang terjadi pada navigasi antar halaman, sehingga modifikasi data tersimpan persisten selama pengujian.

---

## 2. Rincian Pekerjaan Berdasarkan Halaman & Fitur

### A. Halaman Login (`login.html`)

*   **Tampilan**: 
    *   Mengusung tema **Dark-Mode Modern** yang premium dengan latar belakang gelap gulita (`#090d16`) berhiaskan efek gradasi radial bercahaya (*radial glow gradients*) berwarna indigo, ungu, dan biru.
    *   Kartu login menggunakan efek *glassmorphism* (`backdrop-filter: blur(20px)`) dengan border tipis semi-transparan yang memancarkan cahaya halus saat disorot kursor (*hover glow*).
    *   Input password dilengkapi ikon mata untuk melihat sandi, visual tombol panah masuk, dan efek bergetar (*shake animation*) pada kartu login jika terjadi kesalahan input.
*   **Flow**: 
    1.  Pengguna memasukkan kata sandi ke dalam form.
    2.  Pengguna menekan tombol panah masuk atau menekan Enter.
    3.  Jika kata sandi benar, sistem mengarahkan pengguna ke halaman dashboard utama (`index.html`). Jika salah, input akan diberi border merah, kartu bergetar, dan pengguna dapat mencoba kembali.
*   **Logic**:
    *   Menggunakan *event listener* pada form submit untuk mencegah reload bawaan (`e.preventDefault()`).
    *   Membuat pemanggilan asynchronous `fetch('/api/login', { method: 'POST', body: JSON.stringify({ password }) })`.
    *   Di sisi server-side middleware (`middleware.js` dan `app.js`), jika sandi valid, ia mengeset cookie sesi dan merespons dengan status OK.
    *   Menghilangkan kelas kesalahan (`error`) secara dinamis saat pengguna mulai mengetik ulang kata sandinya.

---

### B. Dashboard QRIS Acquirer (`index.html` & `app.js`)

Halaman utama kerja tim Operasional untuk memantau hasil rekonsiliasi harian sisi Acquirer.

#### 1. Summary Cards (Kartu Ringkasan)
*   **Tampilan**: Kartu informasi di bagian atas halaman yang menampilkan statistik penting seperti: *Total Transaksi*, *Total Match*, *Total Unmatch*, *Total On-Hold*, *Total Dispute*, dan *Nominal Settlement*.
*   **Flow**: Angka diperbarui secara otomatis setiap kali status transaksi berubah atau filter global diterapkan.
*   **Logic**: Fungsi `renderSummary()` melakukan agregasi nilai dari basis data lokal (`paydia_recon_trx`) dan menghitung jumlah serta nominal kumulatif secara real-time.

#### 2. Filter Global & Pencarian
*   **Tampilan**: Panel masukan berisi filter Tanggal, Switching (Rintis, Artajasa, Jalin, Alto), Status Rekon, Status Flagging, Tipe Unmatch, dan kolom input pencarian teks bebas.
*   **Flow**: Pengguna memilih nilai filter, lalu tabel di bawahnya otomatis memuat ulang data yang sesuai.
*   **Logic**: Menggunakan fungsi pencarian dan pemfilteran dinamis pada *state array* di JavaScript sebelum melemparkannya ke fungsi *rendering* baris tabel.

#### 3. Sub-Tab: Matched Table (Tabel Transaksi Match)
*   **Tampilan**: Tabel data bersih berisi data transaksi yang berhasil cocok 100%. Bersifat *read-only*.
*   **Flow**: Pengguna dapat melihat daftar transaksi sukses dan mengklik baris untuk melihat detail transaksi lengkap di dalam modal pop-up.
*   **Logic**: Menampilkan transaksi dengan status `Matched`. Fungsi `openDetailModal` mengambil detail data transaksi berdasarkan ID uniknya.

#### 4. Sub-Tab: Unmatched Table (Tabel Transaksi Mismatch)
*   **Tampilan**: Tabel interaktif untuk memproses transaksi yang tidak cocok dengan status rekon dan kolom tambahan "Tipe Unmatch". Kolom aksi berisi dropdown tombol pilihan.
*   **Flow**:
    *   Pada status `On-Hold`, pengguna memiliki 3 pilihan aksi: **Flag Recon**, **Tolak**, dan **Lihat Catatan**.
    *   Klik **Tolak** memicu modal konfirmasi dan mengubah status transaksi menjadi `Ditolak`. Setelah ditolak, baris terkunci (aksi hanya `Lihat Catatan`).
    *   Klik **Buat Transaksi** (hanya tersedia pada tipe unmatch `Switching-Only RC00`, `Switching-Only RC68`, dan `Double RRN` dengan status `Flag Recon`) akan mengirim request approval tipe **Ubah Transaksi Mismatch** ke manajer. Selama request pending, status data asli tidak berubah dan tombol dikunci. Jika diklik kembali, memicu pesan kesalahan: *"data sudah direquest approval, mohon tunggu"*. Setelah disetujui di halaman Approval, status berubah menjadi `Transaksi Terbuat`.
    *   Klik **Flag Settle** (tersedia pada data `Paydia-Only Success` & `Beda Status Transaksi` atau dari status `Transaksi Terbuat`) mengirim request approval tipe **Ubah Transaksi Mismatch**. Setelah disetujui, status berubah menjadi `Flag Settle` dan datanya diteruskan ke halaman Settlement.
*   **Logic**:
    *   *Dropdown Aksi Dinamis*: Berubah otomatis berdasarkan kombinasi dari `status` rekon dan `tipe unmatch`.
    *   *Approval Flow Lock*: Status request disimpan di `paydia_approvals`. Validasi ketat diterapkan di mana jika data ID memiliki entri di antrean persetujuan dengan status `Pending`, aksi lanjutan akan diblokir dengan *error toast*.
    *   *Bulk Action*: Menyediakan fungsionalitas centang massal (*checkboxes*) di sebelah kiri baris untuk memproses aksi **Release (Flag Recon)** atau **Gagal** secara sekaligus pada baris-baris terpilih.

#### 5. Sub-Tab: RC Decline Table
*   **Tampilan**: Tabel yang menyajikan transaksi-transaksi gagal (Response Code selain `00` dan `68`). Bersifat *read-only*.
*   **Flow & Logic**: Disediakan khusus bagi tim operasional untuk menganalisis kode kegagalan dari sisi Switching tanpa adanya manipulasi status rekon.

#### 6. Sub-Tab: Dispute Table (Tabel Dispute)
*   **Tampilan**: Tabel khusus untuk melacak klaim/dispute transaksi merchant.
*   **Flow**:
    *   **Tambah Dispute (Good Faith Bulk)**: Menekan tombol "Tambah Dispute Good Faith" membuka modal pencarian. Pengguna memasukkan RRN dan rentang tanggal untuk mencari transaksi di sistem, memilih transaksi yang ditemukan lewat checkbox, lalu mengirimnya secara massal ke daftar dispute.
    *   **Aksi Tolak Proses**: Pada status dispute `Open`, pengguna dapat menolak dispute yang akan mengunci statusnya menjadi `Ditolak`.
    *   **Aksi Buat Transaksi**: Mengubah status dispute langsung menjadi `Transaksi Terbuat` dan menyuntikkan data transaksi sukses baru ke database transaksi QRIS MPM.
    *   **Aksi Flag Settle**: Dari status `Transaksi Terbuat`, menekan Flag Settle akan mengirim pengajuan approval **Ubah Transaksi Mismatch**. Setelah diapprove, status dispute menjadi `Flag Settle` dan datanya masuk ke tabel Settlement utama.
*   **Logic**:
    *   Pencarian bulk didesain dengan memfilter data transaksi QRIS yang belum masuk dalam daftar dispute.
    *   Setiap pengajuan approval Flag Settle divalidasi agar tidak terjadi pengajuan ganda menggunakan status *lock mapping* di `paydia_approvals`.

#### 7. Fitur Kontrol Simulasi & Telegram Alert
*   **Tampilan**: 
    *   *Simulasi Recon Gagal*: Checklist toggle berwarna merah bertuliskan "Simulasi Recon Gagal" di pojok kiri bawah.
    *   *Telegram Alert Toast*: Card melayang berlogo Telegram berwarna biru cerah dengan visual animasi di kanan bawah.
*   **Flow & Logic**:
    *   **Simulasi Gagal**: Jika checklist dicentang, status engine rekon hari ini diatur menjadi `Gagal`, transaksi target diubah statusnya menjadi `Unmatched (Paydia-Only / RC 68)`. Jika di-uncheck, status engine sukses dan data menjadi `Matched`. Perubahan ini otomatis reload halaman setelah 1,5 detik.
    *   **Telegram Alert**: Aktif jika simulasi gagal dijalankan atau loading engine rekon memakan waktu > 3 menit. Ops dapat mengeklik tombol **Bypass & Selesaikan** untuk menormalkan kembali status engine rekon.

---

### C. Dashboard QRIS Issuer (`issuer.html` & `issuer.js`)

Halaman pemantauan rekonsiliasi transaksi sisi Issuer.

*   **Tampilan**: Konsisten dengan halaman Acquirer, namun hanya memuat 2 sub-tab utama: **Matched Table** dan **Unmatched Table**.
*   **Flow & Logic**:
    *   Mendukung penuh simulasi gagal rekon, pengajuan approval, rerun matching, dan integrasi catatan audit logs.
    *   Semua data disimpan dan dibaca secara terpisah menggunakan kunci data khusus untuk Issuer di dalam *state management*.

---

### D. Halaman Settle & Recon (`settle-recon.html` & `settle-recon.js`)

Halaman finalisasi keuangan untuk mencairkan dana settlement merchant.

*   **Tampilan**: 
    *   Menampilkan data rekap settlement per merchant dengan status **Pembayaran** (Sukses) dan **Mulai pembayaran** (Informasi).
    *   Card detail terpilih disusun secara vertikal dengan garis pembatas horizontal yang modern.
    *   Dropdown menu aksi berisi pilihan: *Lihat Transaksi*, *Settle*, dan *Batalkan Transaksi Settlement*.
*   **Flow**:
    *   Pengguna dapat membatalkan transaksi settlement merchant (menghapus baris) atau memproses pencairan dana (*Settle*).
    *   Klik **Lihat Transaksi** menampilkan detail seluruh transaksi yang menyusun total nominal settlement merchant tersebut.
    *   **Simulasi Progress Bar**: Mengklik tombol Export memicu loading bar berjalan 0% hingga 100% sebelum menampilkan pratinjau spreadsheet.
*   **Logic**:
    *   *Sum of Nominal*: Total Nominal Settle di baris utama sama persis dengan penjumlahan detail nominal transaksi di dalam modal detail.
    *   *Chargeback Integration*: Di dalam modal detail transaksi, disimulasikan adanya data **Chargeback (+)** dan **Chargeback (-)** lengkap dengan tanda `+`/`-` di kolom nominal.
    *   *Export Data per Bank (Segregasi)*:
        *   Pratinjau export bank hanya menampilkan tab segregasi per bank (BCA, Mandiri, BRI, Lainnya).
        *   Secara otomatis mengelompokkan (*grouping*) baris transaksi berdasarkan **Nomor Rekening** dan **Tanggal yang sama**.
        *   Setiap akhir kelompok rekening, sistem menambahkan baris total `TOTAL SETTLEMENT` dengan kalkulasi formula: `Settlement Regular + Chargeback (+) - Chargeback (-)`.
        *   Khusus pada tab **Bank Lainnya**, ditambahkan kolom **Biaya Admin** flat senilai `6.500`.
    *   *Export Data Utama*: Pratinjau export data utama hanya memuat tabel laporan utama (bukan segregasi bank).

---

### E. Halaman Approval (`approval.html` & `approval.js`)

Halaman otorisasi bagi level manajemen untuk menyetujui atau menolak request dari tim Ops.

*   **Tampilan**: Tabel list request dengan badge status dinamis (Pending, Approved, Rejected) dan detail request.
*   **Flow**:
    *   Manajer memilih item antrean pending dan mengeklik tombol **Approval**.
    *   Terbuka modal pop-up detail berisi ringkasan perubahan data transaksi lama dan data baru.
    *   Manajer mengeklik **Setujui** atau **Tolak** dengan mengisi catatan opsional.
*   **Logic**:
    *   Mendukung penuh request tipe **Ubah Transaksi Mismatch** (untuk hasil dari aksi *Buat Transaksi* dan *Flag Settle*).
    *   *Approve Action*: Memperbarui status item di antrean menjadi `Approved`, mengubah status flagging di tabel Unmatch/Dispute asal menjadi `Transaksi Terbuat` / `Flag Settle`, menyuntikkan data ke database transaksi utama jika transaksi baru dibuat, serta menduplikasi baris data tersebut ke tabel settlement utama di halaman `settle-recon.html`.
    *   *Reject Action*: Memperbarui status request menjadi `Rejected`. Kunci status pada transaksi asal dibuka kembali sehingga tim Ops dapat mengajukan ulang request jika diperlukan.

---

### F. Halaman Transaksi QRIS MPM (`qris-mpm.html` & `qris-mpm.js`)

Halaman monitoring transaksi QRIS Merchant Presented Mode.

*   **Tampilan**: Tabel transaksi detail lengkap dengan status pembayaran dan dropdown aksi.
*   **Flow**: Pengguna mencari transaksi, lalu dapat mengeklik aksi **Batalkan Transaksi** pada baris yang aktif.
*   **Logic**:
    *   *Keterkaitan Data*: Jika transaksi dibatalkan dari halaman ini, status rekon baris terkait di tabel Unmatch akan ikut terupdate menjadi `Cancelled` dengan catatan timestamp pembatalan.
    *   *Validasi Proteksi*: Jika di kemudian hari tim Ops mencoba memproses data yang sudah `Cancelled` tersebut di halaman rekonsiliasi, sistem akan menampilkan toast error berbunyi: `"Transaksi sudah dibatalkan pada [tanggal/jam] oleh [user]"`.

---

### G. Halaman App Users (`transaksi.html` & `transaksi.js`)

Halaman pengelolaan akun pengguna aplikasi dan transaksi Flazz.

*   **Tampilan**: Layout tabel data pengguna, status verifikasi, nominal transaksi, dan tombol aksi "Gagalkan".
*   **Flow**: Pengguna dapat membatalkan transaksi akun tertentu secara manual dengan mengisi formulir alasan pembatalan.
*   **Logic**: Mengubah status transaksi menjadi Gagal di database lokal dan memicu pencatatan aktivitas pembatalan tersebut ke Log Activity secara otomatis.

---

### H. Halaman Log Activity (`log.html` & `log.js`)

Halaman audit trail transaksi dan aksi pengguna di dalam sistem.

*   **Tampilan**: Tabel catatan log yang tersusun rapi berdasarkan urutan kronologis terbaru (*timestamp descending*), lengkap dengan filter kategori log (Export, Flagging, Approval, Dispute, Rerun, System).
*   **Flow**: Auditor dapat masuk ke halaman ini untuk memantau aktivitas sistem dan mendeteksi siapa yang melakukan tindakan tertentu pada jam berapa.
*   **Logic**: 
    *   Memuat data logs dari `paydia_logs`.
    *   Secara default memiliki 12 data seeded logs awal untuk keperluan presentasi mockup agar halaman tidak terlihat kosong.
    *   Terintegrasi dengan fungsi penulisan log otomatis (`writeLog()`) yang dipanggil di setiap halaman dashboard setiap kali ada aksi manipulasi data (seperti approval, rejection, pembatalan, ekspor, dll).
