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
                    h: 'Export Data per Bank',
                    b: `Klik tombol <b>Export Data per Bank</b> untuk membuat file segregasi settlement per bank. Sistem akan meminta <b>satu tanggal export</b> (praktiknya data di-export per hari), menampilkan progress, lalu membuka modal simulasi hasil export.<br><br>Modal simulasi memisahkan data per tab bank: <b>BCA, Mandiri, BRI, dan Lainnya</b>. Untuk bank di luar BCA/Mandiri/BRI dikenakan <b>biaya admin flat Rp6.500</b>. Setiap nomor rekening punya baris <b>TOTAL SETTLEMENT</b> = Nominal Awal − Biaya Admin + Adjustment Chargeback (+) − Adjustment Chargeback (−).`
                },
                {
                    h: 'Lihat Transaksi (modal List Transaksi)',
                    b: `Pada kolom <b>Aksi</b> tiap baris, klik <b>Action → Lihat Transaksi</b> untuk membuka modal <b>List Transaksi</b> berisi rincian transaksi yang membentuk nominal settle merchant tersebut.<br><br>Total nominal settle pada tabel = jumlah seluruh nominal di modal, termasuk entri <b>chargeback</b> yang ditandai dengan <b>kategori sesuai tipe dispute</b> (Represent menambah; 1st/2nd Chargeback & Good Faith mengurangi settlement).`
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
                }
            ]
        },
        'index.html': {
            title: 'Panduan Halaman QRIS Acquirer Reconcile',
            items: [
                {
                    h: 'Statistic Card',
                    b: `Kartu ringkasan menampilkan total transaksi, matched, unmatched, on-hold, dispute, dan nominal settlement. Angka mengikuti <b>filter tanggal & switching</b> yang aktif. Default filter: hari ini.`
                },
                {
                    h: 'Filter, Search, Pagination',
                    b: `<b>Filter</b> tersedia per tabel (tanggal, switching, dan checklist multi-select: Status / RC / Tipe Unmatch untuk Unmatch; Status / Alasan Dispute untuk Dispute). <b>Search</b> by RRN / MID. <b>Pagination</b> default 10 baris/halaman. Jika hasil filter/search kosong → tampil <b>"No Data"</b>.`
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
                    b: `Semua data masuk berstatus <b>On Hold</b>.<br><br>• <b>Paydia-Only / Beda Status</b> (transaksi sudah ada di DB): On Hold → <b>Flag Recon</b> → <b>Flag Settle</b>.<br>• <b>Switching-Only / Double RRN</b> (transaksi belum ada): On Hold → <b>Buat Transaksi</b> (perlu approval) → Transaksi Terbuat → <b>Flag Recon</b> → <b>Flag Settle</b>.<br>• Dari On Hold juga bisa <b>Tolak</b> (wajib isi catatan) → status <b>Ditolak</b>.<br><br>Flag Settle & Buat Transaksi memerlukan <b>approval</b>. Tiap status hanya menampilkan aksi yang relevan.`
                },
                {
                    h: 'Tabel Unmatch — Bulk Action & Catatan',
                    b: `<b>Bulk action</b> via checklist: pilih banyak baris (hanya yang berstatus sama) lalu terapkan aksi sekaligus. <b>Lihat Catatan</b> tersedia di status apa pun untuk menambah/melihat catatan penanganan manual.`
                },
                {
                    h: 'Tabel Decline',
                    b: `Menampilkan transaksi RC decline untuk monitoring. Klik <b>RRN</b> untuk melihat detail transaksi. View & detail saja, tidak ada aksi flagging.`
                },
                {
                    h: 'Tabel Dispute — View & Status',
                    b: `Menampilkan data chargeback (1st/2nd chargeback, represent) dan good faith. Dispute otomatis diproses sistem dengan status <b>Done Deduct / Failed Deduct / Transaksi Tidak Ditemukan</b> — aksinya hanya <b>Lihat Catatan</b>.<br><br>Kode 30/50 (1st/2nd chargeback) mengurangi settlement (−), kode 40 (represent) menambah (+).`
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
