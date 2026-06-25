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
                    h: 'Gate dari Auto Recon (wajib)',
                    b: `Auto Settlement <b>hanya bisa berjalan jika Auto Recon untuk tanggal terpilih sudah selesai</b>. Jika belum, banner merah muncul dan seluruh aksi <b>disabled</b> — jalankan <b>Manual Recon</b> dulu di halaman <b>Settle &amp; Recon</b>. Setelah recon selesai, banner berubah hijau dan aksi aktif.`
                },
                {
                    h: 'Segregasi otomatis per Bank',
                    b: `Batch settlement dipisah otomatis per bank: <b>BCA, Mandiri, BRI, dan Lainnya</b>. Bank di luar BCA/Mandiri/BRI dikenakan <b>biaya admin flat Rp6.500</b>. Kartu ringkasan per bank menampilkan jumlah transaksi, total nominal, total admin, dan settlement bersih.`
                },
                {
                    h: 'Adjustment Chargeback (+/−)',
                    b: `Pilih satu baris lalu klik <b>Adjustment</b> untuk menambah chargeback (+) atau (−). <b>Total Settlement = Nominal Awal − Biaya Admin + Adj.(+) − Adj.(−)</b>. Adjustment ditandai <b>menunggu verifikasi Finance</b>.`
                },
                {
                    h: 'Maker → Checker → Approver (no-skip)',
                    b: `Alur persetujuan 3 lapis tanpa skip: <b>Submit (Maker)</b> → <b>Check (Checker)</b> → <b>Approve (Approver)</b>. Tombol Approve hanya aktif saat status <b>Checked</b>. Sebelum Approve wajib lolos <b>2FA/OTP</b> (simulasi device whitelist).`
                },
                {
                    h: 'Master lookup No. Rekening',
                    b: `Nomor rekening diverifikasi terhadap <b>master whitelist</b>. Baris dengan rekening di luar whitelist ditandai <b>merah</b> dan <b>tidak bisa di-Submit</b>.`
                },
                {
                    h: 'Hold / Release, Disbursement & Cut-off',
                    b: `Batch bisa di-<b>Hold</b> lalu <b>Release</b> kembali ke tahap sebelumnya. Setelah Approved, <b>Status Disbursement</b> berjalan Pending → Diproses → Selesai. Indikator <b>cut-off 14.00</b> menandakan jika lewat batas waktu → fallback manual. Tombol <b>Export Excel</b> menghasilkan file tersegregasi per bank.`
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
                    b: `Audit Log mencatat <b>setiap aktivitas yang mengubah state</b> atau menghasilkan sesuatu dari sistem: Flag Recon, Flag Settle, Buat Transaksi, Tolak, edit catatan, settle/batalkan settlement, export, approve/reject, dan lainnya.`
                },
                {
                    h: 'Isi catatan log',
                    b: `Tiap entri mencatat <b>email pelaku</b>, <b>aksi</b> yang dilakukan, dan waktunya — sehingga setiap perubahan data dapat ditelusuri.`
                },
                {
                    h: 'Filter Log',
                    b: `Klik <b>Filter</b> (panel muncul tepat di bawah tombol) untuk menyaring log. Bentuknya <b>checklist multi-select</b>: <b>Container</b> dan <b>Type</b> (jenis aktivitas recon: Flag Recon, Buat Transaksi, Flag Settle, Tolak, Edit Catatan, Ekspor Data Tabel, Ekspor Segregasi per Bank, Settle/Batalkan Settlement, Approval Flag Settle/Buat Transaksi, dll), plus <b>Tanggal</b>, <b>Detail</b>, dan <b>IP</b>. Klik <b>Apply Filters</b> untuk menerapkan, <b>Clear All</b> untuk reset.`
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
