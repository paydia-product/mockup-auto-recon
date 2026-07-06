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
                    b: `Satu baris = satu <b>settlement group per (Bank + Nomor Rekening)</b>. Transaksi dari <b>beberapa MID</b> dengan bank+norek tujuan sama digabung jadi satu entry (walau nama pemilik beda — nama yang ditampilkan = <b>input paling awal</b>). <b>Norek sama tapi bank beda = 2 rekening terpisah.</b> Rincian per MID ada di modal <b>Detail ID Settlement → List Settlement</b>.<br><br><b>Total Settle = Nominal Awal − Biaya Admin + Adj. Chargeback (+) − Adj. Chargeback (−)</b>. Bank tujuan <b>di luar BCA/Mandiri/BRI</b> dikenai <b>biaya admin flat Rp6.500</b> per payout.<br><br><b>Panel Summary per Bank Tujuan</b> (di atas tabel) merangkum per bank: Nominal Awal, Admin, Chargeback (+/−), dan <b>Nominal Ending</b>, plus baris Total.`
                },
                {
                    h: 'Alur Tab (Checker → Approver → hasil)',
                    b: `Settlement dipisah per tahap lewat <b>tab</b>: <b>Checker</b> mengajukan aksi → <b>Approver</b> menyetujui/menolak → hasil masuk ke tab <b>Hold</b>, <b>Reject</b>, atau <b>Settle</b>. Tiap tab punya <b>pagination</b> dan <b>search (ID Settlement / Nama Pemilik Rekening)</b>. <b>Export</b> tersedia di semua tab <b>kecuali Approver</b>.<br><br><b>Filter</b> mencakup Date Range, Nominal (&gt; Rp250 juta / &lt; Rp10.000), dan <b>Bank Tujuan</b>; khusus <b>Settle</b> ada filter <b>Status</b>, <b>Metode Settlement</b>, dan <b>Channel Payment</b>; khusus <b>Approver</b> ada filter <b>Request</b>.<br><br><b>Auto-hold</b>: settlement dengan Total Settle <b>&lt; Rp10.000</b> pada bank tujuan <b>Lainnya</b> otomatis masuk tab <b>Hold</b> tanpa perlu diajukan.`
                },
                {
                    h: 'Tab Checker — aksi',
                    b: `Aksi per baris (kebab): <b>Hold</b>, <b>Reject</b>, <b>Settle</b>.<br><br>• <b>Hold</b>: cakupan <b>Hold Semua</b> / <b>Hold Partial (pilih MID)</b> / <b>Hold Dibawah Min. Transaksi</b>. Catatan wajib; bukti wajib untuk Hold Partial.<br>• <b>Reject</b>: catatan wajib, bukti opsional.<br>• <b>Settle</b>: pilih <b>Metode Settlement</b> (Manual = hanya catat, tidak kirim uang, setelah approval langsung <b>Success</b> / Otomatis = catat + kirim uang ke bank, status awal <b>Pending</b>), <b>Channel Payment</b>, <b>Metode Transfer</b>; catatan & bukti opsional.<br><br><b>Bulk Aksi</b>: aktifkan mode bulk, centang baris → tersedia <b>Bulk Hold / Bulk Reject / Bulk Settle</b> (catatan/bukti sama untuk semua baris; bukti opsional). Tombol bulk mengikuti aksi yang tersedia di tab aktif.`
                },
                {
                    h: 'Hold Partial memecah settlement',
                    b: `Saat <b>Hold Partial</b>, MID yang dipilih <b>dipecah menjadi settlement baru terpisah</b> (ID <code>…-P1</code>, <code>-P2</code>, dst) yang diajukan ke Approver, sedangkan <b>MID sisanya tetap di Checker</b> sebagai settlement tersendiri.<br><br>Contoh: 1 norek berisi 4 MID, Hold Partial 2 MID → terbentuk 1 settlement baru berisi 2 MID (menunggu approval), dan settlement lama menyisakan 2 MID di Checker.`
                },
                {
                    h: 'Tab Approver',
                    b: `Menampilkan request dari Checker (Hold / Hold Partial / Hold Min. / Reject / Settle). Approver bisa <b>Approve</b> atau <b>Reject</b> request, dan <b>Lihat</b> catatan + bukti. Approve memindahkan settlement ke tab sesuai tipe; Reject mengembalikannya ke status sebelumnya. Tab Approver <b>tidak punya Export</b>.`
                },
                {
                    h: 'Tab Hold & Reject — aksi',
                    b: `Daftar hasil <b>Hold</b> / <b>Reject</b>. Aksi per baris (kebab): dari <b>Hold</b> bisa ajukan <b>Reject</b> atau <b>Settle</b>; dari <b>Reject</b> bisa ajukan <b>Hold</b> atau <b>Settle</b> — semuanya lewat Approver lagi. Plus <b>Lihat Catatan</b> (catatan, bukti, Waktu Diajukan/Disetujui, <b>Disetujui Oleh</b>).<br><br>Di modal Catatan & Bukti: tab <b>Hold</b> menampilkan field <b>Alasan</b>; tab <b>Reject</b> tanpa field tipe request.`
                },
                {
                    h: 'Tab Settle — status & simulasi',
                    b: `Kolom tambahan: <b>Channel Payment</b>, <b>Metode Settlement</b>, <b>Status</b>. Status: <b>Pending</b> (Otomatis, response bank masih kosong), <b>Success</b> (Otomatis berhasil, atau Manual langsung setelah approval), <b>Fail</b> (gagal sistem — timeout / server bank), <b>Reject by Bank</b> (norek tidak terdaftar / dibekukan).<br><br>Dropdown <b>Simulasi Status</b> untuk mencoba tampilan tiap status. <b>Lihat Detail</b> menampilkan Channel Payment, Metode Transfer, Waktu Diajukan/Disetujui, dan <b>Disetujui Oleh</b>; segmen Request/Response data hanya untuk Metode <b>Otomatis</b> (Manual tidak mengirim apa pun ke luar). <b>Reject by Bank</b> per baris hanya untuk item Metode <b>Manual</b>, wajib isi catatan + bukti, dan <b>perlu approval Approver</b> — request masuk ke tab Approver, status settle tidak berubah sampai di-approve; mengajukan ulang data yang sama saat masih menunggu approval akan ditolak dengan pesan error.`
                },
                {
                    h: 'Retry Settlement',
                    b: `Tombol <b>Retry Settlement</b> (tab Settle) mengirim ulang ke bank data dengan <b>Metode Settlement Otomatis</b> yang berstatus <b>Gagal</b>. Wajib pilih <b>Tanggal</b> retry.`
                },
                {
                    h: 'Export & Export Segregasi',
                    b: `<b>Export</b> (per tab): kolom mengikuti tab aktif — tab Settle menyertakan Channel Payment, Metode Transfer, Metode Settlement, Waktu Diajukan/Disetujui, Disetujui Oleh, Catatan. Sheet lebar bisa di-scroll ke samping.<br><br><b>Export Segregasi</b> (khusus tab Settle): pilih <b>Tanggal</b>, hanya memuat data <b>Metode Settlement Manual</b>. Hasil dipisah <b>per channel payment</b> (tabel A–K) dalam satu sheet, plus segmen <b>Grand Total</b> (Adm / Hold / Released HOLD) setelah tabel K.`
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
