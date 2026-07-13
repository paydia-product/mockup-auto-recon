/* ===================================================
   Paydia Bisnis – Page Guide (in-app help tooltips)
   One shared widget; content keyed per page below.
   Adds a "Panduan Halaman" button next to .page-title.
   Clicking it opens a panel of collapsible sub-feature
   sections (info only appears when each item is clicked).
   ponytail: single component, no deps, no build step.
   =================================================== */
(function () {
    // Pick guide content by filename (works regardless of query strings/hash).
    let path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!path.includes('.')) path += '.html'; // clean-URL hosts strip the extension

    const GUIDES = {
        'settle-recon.html': {
            title: 'Panduan Halaman Settle & Recon',
            items: [
                {
                    h: 'Tabel Settle & Recon (grouping per merchant)',
                    b: `Data settlement ditampilkan <b>digrouping per merchant</b> — satu baris = satu group, dan tiap group punya <b>ID Transaksi (Settlement ID)</b> sendiri.<br><br>Kolom: No, Tanggal, <b>ID Transaksi</b>, Merchant, Nominal QRIS (Rp), Nominal Settle (Rp), Bank, <b>Tipe Settlement</b>, Status, Aksi. Nominal QRIS/Settle adalah <b>total seluruh transaksi</b> dalam group.<br><br><b>Tipe Settlement</b>: <b>Reguler Matched</b> (data matched hasil auto recon) atau <b>Tambahan Matched</b> (hasil Flag Settle manual dari tabel Unmatch).`
                },
                {
                    h: 'Lihat Transaksi, Settle & Batalkan',
                    b: `Pada kolom <b>Aksi</b>, klik <b>Aksi → Lihat Transaksi</b> untuk membuka modal <b>List Transaksi</b> berisi rincian transaksi yang membentuk group settlement tersebut (Tanggal, ID Transaksi, Nominal QRIS, Nominal Settle, Bank, Status).<br><br>Aksi <b>Settle</b> / <b>Batalkan Settlement</b> berlaku ke <b>seluruh transaksi dalam group</b>. Bisa juga bulk: centang beberapa group lalu Settle/Batalkan sekaligus.`
                },
                {
                    h: 'Export Segregasi per Bank',
                    b: `Klik <b>Export Segregasi per Bank</b>. Wajib pilih <b>Tanggal</b> dan <b>Tipe Settlement</b> (Reguler / Tambahan Matched) — tombol Export baru aktif jika kedua field terisi.<br><br>Hasil dipisah per tab bank: <b>BCA, Mandiri, BRI, dan Lainnya</b> (di luar BCA/Mandiri/BRI kena <b>biaya admin flat Rp6.500</b> sekali per payout). Transaksi <b>merchant yang sama pada tanggal & rekening sama digabung jadi satu baris</b> dengan nominal ditotal.<br><br><b>Nominal Settlement = Nominal − Biaya Admin + Adj. Chargeback (+) − Adj. Chargeback (−)</b>.`
                },
                {
                    h: 'Export & Manual Recon',
                    b: `Tombol <b>Export</b> menghasilkan simulasi data utama (tanpa segregasi bank). Tombol <b>Manual Recon</b> (existing) untuk menjalankan ulang proses recon dengan memilih file switching yang ingin diproses ulang.`
                }
            ]
        },
        'auto-settlement.html': {
            title: 'Panduan Halaman Auto Settlement',
            items: [
                {
                    h: 'Unit data = settlement per Bank + Nomor Rekening',
                    b: `Satu baris = satu <b>settlement group per (Bank + Nomor Rekening)</b>. Transaksi dari <b>beberapa MID</b> dengan bank+norek tujuan sama digabung jadi satu entry (walau nama pemilik beda — nama yang ditampilkan = <b>input paling awal</b>). <b>Norek sama tapi bank beda = 2 rekening terpisah.</b> Rincian per MID ada di modal <b>Detail ID Settlement → List Settlement</b>.<br><br><b>Total Settle = Nominal Awal − Biaya Admin + Adj. Chargeback (+) − Adj. Chargeback (−)</b>. Bank tujuan <b>di luar BCA/Mandiri/BRI</b> dikenai <b>biaya admin flat Rp6.500</b> per payout. Header kolom nominal ditandai <b>(Rp)</b>.<br><br><b>Ringkasan Nominal per Bank Tujuan</b> (tab Checker, di atas tabel) merangkum per bank: Nominal Awal, Admin, Chargeback (+/−), <b>Nominal Ending</b>, plus baris Total. Panel ini <b>bisa dilipat (collapsible)</b>, ada <b>kolom No</b>, <b>pagination maks 10 bank/halaman</b>, dan <b>tetap tampil walau data kosong</b>.`
                },
                {
                    h: 'Alur Tab (Checker → Approver → hasil)',
                    b: `Settlement dipisah per tahap lewat <b>tab</b>: <b>Checker</b> mengajukan aksi → <b>Approver</b> menyetujui/menolak → hasil masuk ke tab <b>Hold</b>, <b>Reject</b>, atau <b>Settle</b>. Tiap tab punya <b>pagination (maks 50 baris/halaman)</b> dan <b>search (ID Settlement / Nama Pemilik Rekening / No. Rekening)</b>. <b>Export</b> tersedia di semua tab <b>kecuali Approver</b>.<br><br><b>Filter</b> (berlaku semua tab): Date Range (Tanggal Recon), <b>Bank Tujuan</b>, dan <b>Nominal berbasis Total Settle</b> — 3 opsi partisi: <b>&lt; Rp10.000</b> / <b>Rp10.000 – Rp250.000.000</b> / <b>&gt; Rp250.000.000</b>. Khusus <b>Settle</b>: filter Status, Metode Settlement, Channel Payment. Khusus <b>Approver</b>: filter <b>Tipe Request</b> (<b>checklist multi-select</b>, termasuk auto: Rilis ke Checker & Reject by Bank). Khusus <b>Hold</b>: filter <b>Alasan</b> & <b>Status Hold</b> (keduanya checklist multi-select). <b>Default filter: semua tanggal.</b><br><br><b>Tab Hold = ledger permanen</b>: semua settlement yang pernah di-hold tetap tampil walau sudah pindah tab. Kolom <b>Status Hold</b>: <b>Belum Diproses</b> · <b>Siap Release</b> · <b>Sudah Release Checker</b>.<br><br><b>Auto-hold</b>: settlement dengan Total Settle <b>&lt; Rp10.000</b> pada bank tujuan <b>selain BCA/Mandiri/BRI</b> otomatis masuk tab <b>Hold</b> (alasan Dibawah Min. Transaksi). Yang &lt; Rp10.000 di BCA/Mandiri/BRI <b>tetap di Checker</b>.`
                },
                {
                    h: 'Tab Checker — aksi',
                    b: `Aksi per baris (kebab): <b>Hold</b>, <b>Reject</b>, <b>Settle</b>.<br><br>• <b>Hold</b>: cakupan <b>Hold Semua</b> / <b>Hold Partial (pilih MID)</b> / <b>Hold Dibawah Min. Transaksi</b>. Catatan wajib; <b>bukti opsional untuk semua jenis hold</b> (boleh menyusul di tab Hold).<br>• <b>Reject</b>: catatan wajib, bukti opsional.<br>• <b>Settle</b>: pilih <b>Metode Settlement</b> (Manual → langsung <b>Success</b> setelah approval; <b>Otomatis masih di-disable = Fase 2</b>), <b>Channel Payment</b> (sumber dana), <b>Metode Transfer</b> (BI-Fast / On-Us·IFT / RTGS); lalu <b>modal konfirmasi</b> berisi channel, quantity, breakdown per bank tujuan & <b>Grand Total Disburse</b>.<br><br><b>Bulk Aksi</b> hanya di tab <b>Checker</b> (Bulk Hold / Reject / Settle) dan <b>Approver</b> (Bulk Approve / Reject). Tab <b>Hold</b> & <b>Reject</b> aksinya per-baris saja (tanpa bulk).`
                },
                {
                    h: 'Hold Partial — picker tabel, nominal per MID, kunci sampai approve',
                    b: `Picker MID berbentuk <b>tabel</b> (kolom No · Pilih · Merchant · MID · Dana · Hold Rp) dengan <b>pagination 10 MID/halaman</b> dan <b>search by MID / nama merchant</b>. Per MID bisa diisi <b>nominal yang dihold</b> — validasi <b>inline</b> min <b>Rp1</b>, maks <b>(dana MID − Rp1)</b>; <b>kosongkan = hold seluruh dana MID</b>.<br><br>Saat diajukan, <b>data settlement tetap utuh di Checker</b> (nominal tidak berubah) tapi <b>DIKUNCI</b>: klik aksi hold/reject/settle memunculkan <b>"Data di lock menunggu approval"</b>. Request tampil di tab Approver.<br><br><b>Setelah di-approve</b>: dana yang dihold menjadi <b>settlement Hold terpisah</b> (ID <code>…-P1</code>), dan <b>nominal settlement norek berkurang</b> sesuai porsi yang dihold (nama & MID asli tetap tampil). <b>Reject</b> membuka kunci — data kembali utuh di Checker. Transaksi <b>dispute/chargeback tidak bisa di-Hold-Partial</b>.`
                },
                {
                    h: 'Tab Approver (2FA + auto-approve)',
                    b: `Menampilkan <b>request manual</b> dari Checker (Hold / Hold Partial / Reject / Settle). Approver <b>Approve</b> / <b>Reject</b> — <b>wajib 2FA (PIN 6 digit)</b>; ada <b>Bulk Approve / Bulk Reject</b>. Approve memindahkan ke tab sesuai tipe; Reject balik ke status sebelumnya. Tab ini <b>tidak punya Export</b>.<br><br>Selain itu, Approver menampilkan <b>record auto-approve</b> (read-only, <b>tidak bisa dihapus</b>): <b>Rilis ke Checker</b> dan <b>Reject by Bank</b>. Untuk 2 jenis ini kolom <b>Aksi berisi teks</b> <code>Otomatis {tab asal} → {tab tujuan}</code> — tanpa tombol (hanya pemberitahuan perpindahan data).<br><br>Modal <b>Detail Request</b> menampilkan Tipe Request, Status Sebelumnya, Catatan, Bukti, <b>Waktu Diajukan</b>, dan <b>Diajukan Oleh</b>. Untuk settle yang norek-nya punya hold Dibawah Min terkait, muncul notice <b>"Akan digabung setelah approve"</b>.`
                },
                {
                    h: 'Notifikasi deteksi rekening (ikon lonceng)',
                    b: `Untuk <b>merchant tunggal</b> (1 MID/1 norek), sistem mendeteksi <b>merchant baru pertama kali transaksi</b> atau <b>perubahan data merchant</b> (nomor rekening / nama pemilik / bank). <b>Tidak ada auto-hold dan tidak ada badge di tabel</b> — notifikasi muncul di <b>ikon lonceng</b> di header (badge jumlah + dropdown). Contoh: <i>"Terdeteksi perubahan data merchant MID-X: dari nomor rekening A ke B…"</i>. Checker mereview manual, lalu bisa meng-hold sendiri bila perlu.`
                },
                {
                    h: 'Tab Hold & Reject + akumulasi Siap Release',
                    b: `Tab <b>Hold</b>: <b>Rilis ke Checker</b> (gabung ke settlement berjalan, <b>tanpa approval</b>; mengirim record auto-approve ke Approver), <b>Tambah/Lihat Bukti</b>, <b>Lihat Catatan</b>. Reject by Bank juga mendarat di tab Hold (status Reject by Bank).<br><br>Tab <b>Reject</b>: aksinya <b>Rilis ke Checker</b> + <b>Lihat Bukti</b> (sama seperti tab Hold).<br><br><b>Akumulasi "Siap Release"</b>: beberapa hold <b>Dibawah Min. Transaksi</b> pada <b>norek yang sama</b> dijumlahkan (hold-min + settlement Checker norek itu). Bila total <b>≥ Rp10.000</b>, semua hold-min tersebut berubah jadi <b>Siap Release</b> dan muncul <b>wording notifikasi di tab Checker</b>; jika masih &lt; Rp10.000 tetap <b>Belum Diproses</b>.`
                },
                {
                    h: 'Tab Settle — status, Lihat Detail & Log Callback',
                    b: `Kolom tambahan: <b>Channel Payment</b>, <b>Metode Settlement</b>, <b>Status</b>. Status: <b>Pending</b> (Otomatis, menunggu callback bank), <b>Success</b> (Otomatis berhasil, atau Manual langsung setelah approval), <b>Fail</b> (gagal sistem — timeout / server bank), <b>Reject by Bank</b> (norek tidak terdaftar / dibekukan). Dropdown <b>Simulasi Status</b> untuk mencoba tampilan tiap status.<br><br><b>Lihat Detail</b> menampilkan Channel Payment, Metode Transfer, Waktu Diajukan/Disetujui, <b>Disetujui Oleh</b>, lalu segmen <b>Request Data</b> dan <b>Log Callback</b> — <b>khusus Metode Otomatis</b> (Manual tidak mengirim apa pun ke luar). <b>Log Callback</b> menampilkan alur async bank (request tidak langsung transfer): <b>SUBMITTED → ACCOUNT_INQUIRY → QUEUED → FORWARDED → BANK_CALLBACK</b>, tiap proses ada <b>status (Sukses/Pending/Gagal)</b> + <b>timestamp</b> dan bisa di-<b>expand</b> ke JSON response.<br><br><b>Reject by Bank</b> per baris hanya untuk item Metode <b>Manual</b>: wajib catatan + bukti, lalu <b>langsung dipindah ke Hold tanpa approval</b> (Approver hanya menerima notifikasi perpindahan data).`
                },
                {
                    h: 'Retry Settlement',
                    b: `Tombol <b>Retry Settlement</b> (tab Settle) mengirim ulang ke bank data dengan <b>Metode Settlement Otomatis</b> yang berstatus <b>Gagal</b>. Wajib pilih <b>Tanggal</b> retry.`
                },
                {
                    h: 'Export & Export Segregasi',
                    b: `<b>Export</b> (per tab): kolom mengikuti tab aktif — tab Settle menyertakan Channel Payment, Metode Transfer, Metode Settlement, Waktu Diajukan/Disetujui, Disetujui Oleh, Catatan. Sheet lebar bisa di-scroll ke samping.<br><br><b>Export Segregasi</b> (khusus tab Settle): pilih <b>Tanggal</b>, hanya data <b>Metode Manual</b> — isinya <b>mengikuti data aktual</b> di tab Settle. Hasil dipisah <b>per bank tujuan</b> (tabel A–F) dalam satu sheet + segmen <b>Grand Total</b> (Adm / Hold / Released HOLD) setelah tabel terakhir.<br><br><b>Export Report Manajemen</b>: summary harian per metode (Manual/Otomatis) → channel → bank tujuan (nominal+qty), plus rekap <b>Total Sukses / Dirilis / Hold</b> (below Rp10.000 · request · reject by bank). Status Pending & Fail = 0 (khusus Otomatis, Fase 2).`
                }
            ]
        },
        'approval.html': {
            title: 'Panduan Halaman Approval',
            items: [
                {
                    h: 'Apa yang masuk ke halaman ini',
                    b: `Halaman Approval menampung <b>request persetujuan</b> yang dikirim dari tabel Unmatch dan Dispute, yaitu aksi <b>Flag Settle</b> dan <b>Buat Transaksi</b>. Aksi ini tidak langsung berjalan — harus disetujui Management dulu.`
                },
                {
                    h: 'View, Approve, Reject',
                    b: `Setiap request bisa di-<b>view</b> untuk melihat detailnya, lalu di-<b>Approve</b> atau <b>Reject</b>.<br><br>• <b>Approve Buat Transaksi</b> → transaksi dibuat, status di tabel asal jadi <b>Transaksi Terbuat</b>.<br>• <b>Approve Flag Settle</b> → data masuk ke halaman Settle & Recon, status jadi <b>Flag Settle</b>.<br>• <b>Reject</b> → request ditolak dan status tidak berubah.`
                },
                {
                    h: 'Selama menunggu approval',
                    b: `Selama request masih <b>Pending</b>, status data di tabel asal tidak berubah. Jika operator mencoba mengirim aksi yang sama lagi, muncul peringatan <b>"data sudah direquest approval, mohon tunggu"</b>.`
                },
                {
                    h: 'Grouping per merchant & detail request',
                    b: `Request <b>bulk</b> dari tabel Unmatch <b>digrouping per merchant</b> — satu request berisi semua transaksi merchant tersebut. Modal detail menampilkan <b>Nama Merchant, MID, MPAN</b>, <b>daftar transaksi</b> (No, Tanggal Proses, RRN, Nominal, RC, Switching, Tipe Unmatch), dan <b>Request Detail</b> (Requester, Tanggal Request, Aksi).`
                },
                {
                    h: 'Filter',
                    b: `Klik <b>Filter</b> (panel muncul tepat di bawah tombol) untuk menyaring berdasarkan <b>Tipe Request</b> (mis. Proses Transaksi Mismatch, Finalize Reconcile) dan <b>Admin</b>. Klik <b>Apply Filters</b> untuk menerapkan, <b>Clear All</b> untuk reset.`
                }
            ]
        },
        'index.html': {
            title: 'Panduan Halaman QRIS Acquirer Reconcile',
            items: [
                {
                    h: 'Statistic Card',
                    b: `Kartu ringkasan menampilkan total transaksi, matched, unmatched, on-hold, dispute, dan nominal settlement. Angka mengikuti <b>filter tanggal, switching, dan lokasi (Domestik/Crossborder)</b> yang aktif. Default filter: hari ini.`
                },
                {
                    h: 'Filter, Search, Pagination',
                    b: `<b>Filter</b> tersedia per tabel: tanggal, switching, lokasi (Domestik/Crossborder), dan checklist multi-select — untuk Unmatch: <b>Status / RC (00 / 68 / non-00-68) / Tipe Unmatch</b>; untuk Dispute: Status / Alasan Dispute.<br><br><b>Search</b> by <b>RRN / ID / MID / Nama Merchant</b>. <b>Pagination</b> default <b>50 baris/halaman</b>. Filter & search <b>otomatis kembali ke default saat pindah tab</b>. Jika hasil kosong → tampil <b>"No Data"</b>.`
                },
                {
                    h: 'Tabel Matched',
                    b: `Hasil rekonsiliasi otomatis (switching ↔ Paydia, kunci RRN + nominal). Data matched bersifat <b>read-only</b>. Klik kolom <b>RRN</b> untuk melihat <b>detail transaksi</b> (data Paydia vs data switching).`
                },
                {
                    h: 'Tabel Unmatch — Tipe',
                    b: `Tiap baris punya <b>Tipe Unmatch</b>: Switching-Only RC00, Switching-Only RC68, Paydia-Only Success, Double RRN, atau Beda Status Transaksi. Tipe ini menentukan alur aksi yang tersedia.`
                },
                {
                    h: 'Tabel Unmatch — Flow Status',
                    b: `Semua data masuk berstatus <b>On Hold</b>.<br><br>• <b>Paydia-Only / Beda Status</b> (transaksi sudah ada di DB): On Hold → <b>Flag Recon</b> → <b>Flag Settle</b>.<br>• <b>Switching-Only / Double RRN</b> (transaksi belum ada): On Hold → <b>Buat Transaksi</b> (perlu approval) → Transaksi Terbuat → <b>Flag Recon</b> → <b>Flag Settle</b>.<br>• Dari On Hold juga bisa <b>Tolak</b> (wajib isi catatan) → status <b>Ditolak</b>.<br><br><b>Buat Transaksi</b> & <b>Flag Settle</b> memerlukan <b>approval</b>. <b>Flag Recon</b> hanya bisa jika status transaksi di Paydia sudah <b>sukses</b> — jika belum, muncul peringatan untuk mengubah status dulu di halaman <b>Transaksi QRIS MPM</b>. Khusus Paydia-Only / Beda Status, <b>Tolak</b> baru bisa jika transaksi berstatus <b>gagal</b> (ubah status di QRIS MPM). Tiap status hanya menampilkan aksi yang relevan.`
                },
                {
                    h: 'Tabel Unmatch — Bulk Action & Catatan',
                    b: `<b>Bulk Action</b> bersifat <b>action-first</b>: klik tombol <b>Bulk Action</b> lalu pilih <b>satu</b> jenis aksi (Buat Transaksi / Flag Recon / Flag Settle / Tolak). Tabel <b>otomatis terfilter</b> hanya ke baris yang <b>eligible</b> untuk aksi itu, lalu muncul kotak checklist di kiri kolom No.<br><br>Pilih satu per satu atau <b>Select All</b> — maksimal <b>50 data</b> sekali waktu. Untuk <b>Flag Settle</b> & <b>Buat Transaksi</b>, request approval <b>digrouping per merchant</b> (1 request per merchant). <b>Lihat Catatan</b> tersedia di status apa pun untuk menambah/melihat catatan penanganan manual.`
                },
                {
                    h: 'Tabel Decline',
                    b: `Menampilkan transaksi RC decline untuk monitoring. Klik <b>RRN</b> untuk melihat detail transaksi. View & detail saja, tidak ada aksi flagging.`
                },
                {
                    h: 'Tabel Dispute — View & Status (Fase Berikutnya)',
                    b: `<i>Catatan: Tabel Dispute termasuk scope <b>Fase Berikutnya</b> — tampilan di sini masih pratinjau (ditandai ikon jam pasir).</i><br><br>Menampilkan data chargeback (1st/2nd chargeback, represent) dan good faith. Dispute otomatis diproses sistem dengan status <b>Done Deduct / Failed Deduct / Transaksi Tidak Ditemukan</b> — aksinya hanya <b>Lihat Catatan</b>.<br><br>Kode 30/50 (1st/2nd chargeback) mengurangi settlement (−), kode 40 (represent) menambah (+).`
                },
                {
                    h: 'Tabel Dispute — Good Faith Manual',
                    b: `Untuk dispute > 90 hari, klik <b>Tambah Dispute Good Faith</b>, input RRN dan/atau range tanggal, checklist transaksi, lalu bulk add (status <b>Open</b>).<br><br>Proses good faith: Open → <b>Buat Transaksi</b> (perlu approval) → Transaksi Terbuat → <b>Flag Settle</b> (perlu approval). Bisa juga <b>Tolak</b> sebelum dibuat transaksi (wajib catatan).`
                },
                {
                    h: 'Export Data per Tabel',
                    b: `Tombol <b>Export Data Tabel</b> meng-export data dari <b>tab yang sedang aktif</b> (Matched / Unmatch / Decline / Dispute), mengikuti filter & search yang sedang diterapkan.`
                }
            ]
        },
        'qris-mpm.html': {
            title: 'Panduan Halaman Transaction QRIS MPM',
            items: [
                {
                    h: 'Transaksi hasil Buat Transaksi',
                    b: `Halaman ini menampilkan transaksi QRIS MPM, <b>termasuk transaksi baru</b> yang dibuat lewat aksi <b>Buat Transaksi</b> dari tabel <b>Unmatch</b> (Switching-Only / Double RRN) dan tabel <b>Dispute</b> (good faith).<br><br>Transaksi tersebut muncul di sini setelah request Buat Transaksi <b>disetujui</b> di halaman Approval, sehingga jejak datanya jelas.`
                },
                {
                    h: 'Ubah Status Transaksi',
                    b: `Untuk transaksi tipe <b>Beda Status Transaksi</b> dan <b>Paydia-Only Success</b>, tersedia aksi <b>Ubah Status Transaksi</b> (Sukses / Pending / Gagal).<br><br>Berguna untuk memenuhi syarat aksi di tabel Unmatch: <b>Flag Recon</b> butuh status <b>sukses</b>, sedangkan <b>Tolak</b> (Paydia-Only / Beda Status) butuh status <b>gagal</b>.`
                }
            ]
        },
        'log.html': {
            title: 'Panduan Halaman Log',
            items: [
                {
                    h: 'Apa yang dicatat',
                    b: `Audit Log mencatat <b>setiap aktivitas yang mengubah state</b> atau menghasilkan sesuatu dari sistem. Log mencakup aktivitas dari beberapa modul — antara lain <b>Auto Recon</b> dan <b>Auto Settlement</b> — yang bisa dibedakan lewat kolom <b>Container</b> dan <b>Type</b>.`
                },
                {
                    h: 'Isi catatan log',
                    b: `Tiap entri mencatat <b>email pelaku</b>, <b>aksi</b> yang dilakukan, waktunya, dan <b>IP</b> — sehingga setiap perubahan data dapat ditelusuri.`
                },
                {
                    h: 'Aktivitas Auto Recon (Reconcile / Settle & Recon)',
                    b: `Container <b>paydia-reconcile</b>, <b>paydia-settle-recon</b>, <b>paydia-trx-mpm</b>. Type yang dicatat: <b>Flag Recon</b>, <b>Flag Settle</b>, <b>Buat Transaksi</b>, <b>Tolak</b>, <b>Edit Catatan</b>, <b>Ekspor Data Tabel</b>, <b>Ekspor Segregasi per Bank</b>, <b>Settle Settlement</b> / <b>Batalkan Settlement</b>, <b>Tambah Dispute Good Faith</b>, <b>Batalkan Transaksi MPM</b>, <b>Approval Flag Settle</b> / <b>Approval Buat Transaksi</b>.`
                },
                {
                    h: 'Aktivitas Auto Settlement',
                    b: `Container <b>paydia-auto-settlement</b>. Type yang dicatat: <b>Ajukan Hold</b> / <b>Ajukan Hold Partial</b> / <b>Ajukan Hold Min. Transaksi</b>, <b>Ajukan Reject</b>, <b>Ajukan Settle</b>, <b>Bulk Settle</b>, <b>Approve Request</b> / <b>Reject Request</b> (oleh Approver), <b>Reject by Bank</b>, <b>Retry Settlement</b>, <b>Ekspor Data Tabel</b>, dan <b>Ekspor Segregasi per Bank</b>.`
                },
                {
                    h: 'Filter Log',
                    b: `Klik <b>Filter</b> (panel muncul tepat di bawah tombol). Bentuknya <b>checklist multi-select</b>: <b>Container</b> (mis. paydia-reconcile vs paydia-auto-settlement) dan <b>Type</b>, plus <b>Tanggal</b>, <b>Detail</b>, dan <b>IP</b>. Klik <b>Apply Filters</b> untuk menerapkan, <b>Clear All</b> untuk reset.`
                }
            ]
        },
        'admin.html': {
            title: 'Panduan Halaman Admin',
            items: [
                {
                    h: 'Daftar Admin & Status',
                    b: `Menampilkan daftar admin dengan <b>email, nama, dan status</b> (Active / Suspend / Archive). Gunakan <b>Tambah Admin</b> untuk membuat admin baru, atau <b>Edit</b> per baris untuk mengubah data & permission.`
                },
                {
                    h: 'Manage Permissions (per segmen)',
                    b: `Di modal Add / Edit, permission dikelompokkan per <b>segmen</b>. Tiap segmen punya <b>Select All</b> dan pencarian di atas. Centang butir permission yang ingin diberikan, lalu <b>Simpan</b>. Segmen/permission <b>baru</b> ditandai badge <b>"Baru"</b>.`
                },
                {
                    h: 'Permission Auto Recon',
                    b: `Segmen terkait <b>Auto Recon</b>: <b>Reconcile QRIS Acquirer</b> (Card Statistic, View Match, View Unmatch, Action Unmatch, Export, View Decline), <b>Settlement Rekon</b> (Export, Inquiry, Read, Update, Export per Bank), serta <b>Approval → Process Unmatched Transaction</b> untuk persetujuan Flag Settle / Buat Transaksi.`
                },
                {
                    h: 'Permission Auto Settlement',
                    b: `Segmen khusus <b>Auto Settlement</b> (QRIS), dipisah per peran:<br><br>• <b>Auto Settlement QRIS Checker</b>: Read, Export, Hold, Reject, Settle.<br>• <b>Auto Settlement QRIS Approver</b>: Read, Approval.<br>• <b>Auto Settlement QRIS Result</b>: Read, Export, Export Segregasi, Hold, Settle, Reject, Retry Settle.`
                }
            ]
        }
    };

    const guide = GUIDES[path];
    if (!guide) return;

    function init() {
        const titleEl = document.querySelector('.page-title');
        if (!titleEl || document.getElementById('pageGuideBtn')) return;

        // Button next to the page title
        const btn = document.createElement('button');
        btn.id = 'pageGuideBtn';
        btn.className = 'page-guide-btn';
        btn.type = 'button';
        btn.innerHTML = '<i class="fas fa-circle-question"></i><i class="far fa-circle-question" style="display:none"></i> Panduan Halaman';
        // FontAwesome may only have one variant; keep text regardless.
        btn.innerHTML = '<i class="fas fa-question-circle"></i> Panduan Halaman';
        titleEl.insertAdjacentElement('afterend', btn);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'pageGuidePanel';
        panel.className = 'page-guide-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div class="page-guide-head">
                <span><i class="fas fa-book-open" style="margin-right:6px;"></i>${guide.title}</span>
                <button type="button" class="page-guide-close" aria-label="Tutup">&times;</button>
            </div>
            <div class="page-guide-hint">Klik tiap item untuk melihat penjelasannya.</div>
            <div class="page-guide-items">
                ${guide.items.map((it, i) => `
                    <div class="page-guide-item" data-i="${i}">
                        <button type="button" class="page-guide-item-head">
                            <span>${it.h}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="page-guide-item-body">${it.b}</div>
                    </div>
                `).join('')}
            </div>`;
        btn.insertAdjacentElement('afterend', panel);

        btn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        panel.querySelector('.page-guide-close').addEventListener('click', () => {
            panel.style.display = 'none';
        });
        panel.querySelectorAll('.page-guide-item-head').forEach(head => {
            head.addEventListener('click', () => {
                head.closest('.page-guide-item').classList.toggle('open');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
