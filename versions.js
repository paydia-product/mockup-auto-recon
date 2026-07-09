/* ===================================================
   Auto Settlement QRIS — Version Picker (UI dropdown)
   Sumber tunggal daftar versi + changelog. Dropdown di
   topbar untuk pilih versi & lihat perubahan tiap versi.
   Mock front-end: "muat versi" bersifat tampilan saja —
   build aktif tetap Latest (tidak load bundle lama).
   =================================================== */
(function () {
    // Terbaru di atas. deployed=true → badge Deployed. Versi pertama = Latest.
    var VERSIONS = [
        { v: '1.18.0', date: '2026-07-08', deployed: true, title: 'Log Callback bank (settle Otomatis) + picker Hold Partial jadi tabel', changes: [
            'Detail settlement Otomatis: tambah segmen Log Callback (alur async bank: submit → account inquiry → antri → diteruskan → callback), tiap proses ada status (Sukses/Pending/Gagal) + timestamp, expandable ke JSON',
            'Modal Hold Partial: picker MID diubah jadi tabel proper (kolom No, pagination maks 10/halaman, search by MID & nama merchant); pilihan & nominal konsisten lintas halaman/search'
        ] },
        { v: '1.17.2', date: '2026-07-08', deployed: false, title: 'Revert v1.17.1 (chargeback base) — kembali ke logic v1.17.0', changes: [
            'Revert perubahan v1.17.1: hold partial tidak mengubah dispute (dispute hanya bisa tidak-di-settle lewat Hold Semua / Hold Dibawah Min / Reject, bukan Hold Partial)',
            'Logic Hold Partial kembali persis ke kondisi v1.17.0'
        ] },
        { v: '1.17.1', date: '2026-07-08', deployed: false, title: 'Hold Partial: transaksi dispute/chargeback tetap di base (di-revert v1.17.2)', changes: [
            'Transaksi dispute/chargeback tidak bisa dihold — chargeback tetap tinggal di settlement Checker (base)',
            'Yang dihold hanya dana settle; sisa dana + seluruh chargeback tetap di base (rekonsiliasi benar)'
        ] },
        { v: '1.17.0', date: '2026-07-08', deployed: false, title: 'Hold Partial: kunci data menunggu approval + rekonsiliasi setelah approve', changes: [
            'Settlement yang diajukan Hold Partial DIKUNCI di Checker (aksi hold/reject/settle → "Data di lock menunggu approval")',
            'Sebelum approve: detail & nominal settlement tetap utuh; hanya setelah approve nominal norek berkurang sesuai hold partial',
            'Detail settlement tidak lagi menampilkan "Sisa dana (partial hold)/(sisa)" — nama & MID asli tetap tampil (nominal berkurang)',
            'Reject Hold Partial membuka kunci; data kembali utuh di Checker'
        ] },
        { v: '1.16.1', date: '2026-07-08', deployed: false, title: 'Hold Partial: rapikan label MID + validasi nominal inline', changes: [
            'Baris MID di Hold Partial tidak lagi menampilkan jumlah transaksi',
            'Validasi nominal hold per MID jadi inline/real-time (muncul saat mengetik, tanpa harus klik Ajukan)'
        ] },
        { v: '1.16.0', date: '2026-07-08', deployed: false, title: 'Hold Partial: input nominal hold per MID', changes: [
            'Hold Partial kini bisa input nominal yang dihold per MID (bukan hanya pilih MID)',
            'Validasi: min Rp1, maks (dana MID − 1); kosongkan input = hold seluruh dana MID',
            'Dana yang dihold masuk settlement baru; sisa dana MID tetap di Checker (rekonsiliasi)'
        ] },
        { v: '1.15.2', date: '2026-07-08', deployed: false, title: 'Tabel Ringkasan per Bank: tambah kolom No', changes: [
            'Kolom No ditambahkan di tabel Ringkasan Nominal per Bank Tujuan (nomor urut lanjut antar-halaman)'
        ] },
        { v: '1.15.1', date: '2026-07-08', deployed: false, title: 'Bugfix filter nominal (berbasis Total Settle + range Rp10.000–Rp250jt)', changes: [
            'Semua filter nominal kini berbasis Total Settle (Rp), termasuk filter > Rp250jt (dulu keliru pakai Nominal Awal)',
            'Range menengah diperbaiki jadi Rp10.000 – Rp250.000.000 (dulu keliru Rp10jt) — kini menampilkan ribuan data yang sebelumnya tersembunyi',
            'Ketiga filter nominal jadi partisi bersih: <Rp10.000 / Rp10.000–Rp250jt / >Rp250jt'
        ] },
        { v: '1.15.0', date: '2026-07-08', deployed: false, title: 'Filter nominal 10jt–250jt + seed skenario dibawah min transaksi', changes: [
            'Filter Nominal ditambah opsi "Rp10.000.000 – Rp250.000.000" (berlaku di semua tab)',
            'Seed data <Rp10.000 ke bank BCA/Mandiri/BRI: tetap di Checker (tidak auto-hold)',
            'Seed 10+ data skenario dibawah min: akumulasi hold-min per norek ≥Rp10rb → Siap Release + notif Checker',
            'Skenario B: hold-min + settlement Checker >Rp10rb pada norek sama → hold jadi Siap Release, base tetap Checker'
        ] },
        { v: '1.14.0', date: '2026-07-08', deployed: false, title: 'Ringkasan collapsible + pagination, notifikasi deteksi rekening di lonceng', changes: [
            'Tabel Ringkasan Nominal per Bank Tujuan kini bisa dilipat (collapsible) + pagination maks 10 bank per halaman',
            'Ringkasan tetap tampil di tab Checker walau data kosong (isi "Tidak ada data")',
            'Anomali rekening: auto-hold DIHAPUS — data anomali tetap di Checker untuk direview manual',
            'Notifikasi deteksi rekening pindah ke ikon lonceng header (badge + dropdown); badge di tabel dihapus',
            'Notifikasi: (1) merchant baru pertama kali transaksi, (2) perubahan data merchant (norek/nama/bank) dari nilai lama ke baru',
            'Wording sticky Checker: "filter status Siap Release"'
        ] },
        { v: '1.13.1', date: '2026-07-08', deployed: false, title: 'Tambah label "(Rp)" pada header kolom nominal', changes: [
            'Header kolom uang diberi "(Rp)": Nominal Awal, Admin, Adjustment Chargeback (+)/(−), Total Settle di tabel utama semua tab',
            'Juga di tabel Ringkasan per Bank (termasuk Nominal Ending), tabel detail settlement, dan header ekspor'
        ] },
        { v: '1.13.0', date: '2026-07-08', deployed: false, title: 'Filter multi-pilih (Tipe Request & Alasan) + rapikan lebar tabel', changes: [
            'Filter "Tipe Request" (tab Approver) & "Alasan" (tab Hold) diubah dari dropdown jadi checklist — bisa pilih lebih dari satu (OR)',
            'Wording "Request" diganti jadi "Tipe Request"',
            'Kolom Aksi (teks Otomatis ... → ...) kini membungkus rapi sehingga tabel Approver muat tanpa scroll ke samping'
        ] },
        { v: '1.12.0', date: '2026-07-08', deployed: false, title: 'Auto-approval request (Rilis ke Checker & Reject by Bank) di Approver — persisten', changes: [
            'FIX FATAL: notifikasi "Tandai Dibaca" dihapus — dulu klik itu membuat baris hilang dari Approver. Sekarang data tidak bisa hilang',
            'Tambah 2 jenis request auto-approve di tab Approver: "Rilis ke Checker" & "Reject by Bank" — muncul di kolom Request dan bisa difilter',
            'Khusus 2 jenis ini, kolom Aksi berisi teks "Otomatis {tab asal} → {tab tujuan}" (mis. Otomatis Hold → Checker) — tanpa tombol',
            'Rilis ke Checker & Reject by Bank bersifat auto-approval (tidak perlu approve manual); record-nya tetap tercatat permanen di Approver'
        ] },
        { v: '1.11.0', date: '2026-07-08', deployed: false, title: 'Notifikasi perpindahan data ke Approver (read-only)', changes: [
            'Tab Approver kini menerima notifikasi perpindahan data (read-only) untuk 3 kasus: hold→Checker (rilis), reject→Checker (rilis), dan settle→Hold (Reject by Bank)',
            'Baris notifikasi hanya bisa "Tandai Dibaca" — tidak ada aksi Approve/Reject (sifatnya pemberitahuan)',
            'Tab Reject aksinya jadi hanya "Rilis ke Checker" + "Lihat Bukti" (sama seperti tab Hold), bulk dimatikan',
            'Rilis dari Hold/Reject ke Checker kini mengirim notifikasi ke Approver',
            'Label badge notifikasi jadi dinamis (arah from→to + jenis)',
            'Seed data: ditambah 5 contoh tiap kasus notifikasi agar tampil di tab Approver',
            'Sticky message tab Checker dipersingkat'
        ] },
        { v: '1.10.1', date: '2026-07-07', deployed: false, title: 'Sticky message pindah ke tab Checker', changes: [
            'Pesan "Beberapa Settlement Hold Dibawah Min. Transaksi sudah bisa dirilis" dipindah ke tab Checker, di bawah tombol filter'
        ] },
        { v: '1.10.0', date: '2026-07-07', deployed: false, title: 'Filter hold, pecah & gabung saat approve, search versi', changes: [
            'Tab Hold: filter by Alasan (Reject by Bank / Dibawah Min / Semua / Partial) & by Status (Belum Diproses / Siap Release / Sudah Release Checker)',
            'Perbaikan seed: kolom Alasan hold tidak ada yang kosong; status hold sesuai filter',
            'Reject by Bank pindah ke Hold — dihapus dari filter status Settle',
            'Pecah transaksi besar (BI-FAST) & gabung transaksi dibawah min baru dijalankan SETELAH approve settle',
            'Sticky message hold hanya di tab Hold',
            'Search versi kini mencakup deskripsi, bukan hanya judul'
        ] },
        { v: '1.9.0', date: '2026-07-07', deployed: false, title: 'Sticky message, hold Bisa Rilis, summary list, layout checker', changes: [
            'Pesan akumulasi jadi sticky non-closable di atas tabel (hilang saat tak ada yang bisa dirilis)',
            'Hold hanya bisa Rilis ke Checker (tanpa reject/settle & tanpa bulk); status "Bisa Rilis" untuk hold dibawah min',
            'Ringkasan nominal per bank + total diubah dari card ke bentuk list',
            'Bulk Aksi aktif → tombol aksi single dinonaktifkan di semua baris',
            'Checker: filter/export/bulk/search dipindah ke bawah ringkasan total, tepat di atas tabel'
        ] },
        { v: '1.8.0', date: '2026-07-07', deployed: false, title: 'Stress-test seed 1000+/tab, hold ledger, pesan floating, segregasi aktual', changes: [
            'Seed 1000+ data per tab (variasi bank, multi-MID, dispute, 3 jenis hold, semua status settle)',
            'Tab Hold jadi ledger permanen + kolom Status Hold (Aktif / Selesai)',
            'Status akumulasi min. transaksi jadi pesan floating (kolom Keterangan dihapus)',
            'Ringkasan nominal per bank + total pindah ke dalam tab Checker, mengikuti filter',
            'Segregasi: urut tabel A–F; isi export tabel & segregasi mengikuti data aktual',
            'Tanggal Perubahan Terakhir hanya terisi bila ada perubahan & selalu > Tanggal Recon',
            'Default filter: semua tanggal'
        ] },
        { v: '1.7.0', date: '2026-07-07', deployed: false, title: 'Segregasi ringkas, total terpisah, akumulasi min, konfirmasi grouped', changes: [
            'Modal segregasi: hapus tabel A-C, J, K, Crossborder, Bug, Fee Faspay',
            'Kartu Total Semua Bank jadi segmen terpisah; kartu per bank dinamis mengikuti data',
            'Status akumulasi min. transaksi di kolom Keterangan (Checker & Hold); "Nominal sudah memenuhi minimum transaksi"',
            'Pagination semua tab: 50 data per halaman',
            'Konfirmasi bulk settle & bulk approve: grouping per bank tujuan (list norek, qty transaksi, nominal akhir per bank)',
            'Logic: settlement yang pernah di-hold ditandai; hold→checker→hold me-replace data lama',
            'Kolom Tanggal Perubahan Terakhir dipindah ke kanan Tanggal Recon'
        ] },
        { v: '1.6.1', date: '2026-07-06', deployed: false, title: 'Fix posisi summary, hold anomali, reject-by-bank ke hold', changes: [
            'Kartu ringkasan dipindah ke luar card tabel (di bawah judul halaman)',
            'Tab Hold: tulisan "Anomali Rekening" (badge & Alasan) disembunyikan',
            'Reject by Bank kini langsung pindah ke Hold tanpa approval; Approver hanya menerima notifikasi ("Tandai Dibaca")'
        ] },
        { v: '1.6.0', date: '2026-07-06', deployed: false, title: 'Pecah otomatis, summary cards, kolom tanggal', changes: [
            'BI-FAST >Rp250 juta: Pecah Otomatis (greedy 250 juta + sisa), teks & simbol dirapikan',
            'Ringkasan nominal per bank jadi kartu (di luar tabel), pakai data semua tanggal',
            'Konfirmasi bulk settle: breakdown per rekening + search (norek/nama pemilik rekening) + pagination 10/hal',
            'Kolom "Tanggal Perubahan Terakhir" (updated_at) di semua tabel + export',
            'Kolom "Tanggal Proses" → "Tanggal Recon" di semua tabel + export'
        ] },
        { v: '1.5.0', date: '2026-07-06', deployed: false, title: 'Batch UX — settle, search, 2FA sim', changes: [
            'Export Report Manajemen hanya di tab Settle',
            'BI-FAST >Rp250 juta: mekanisme Pecah Manual (auto-split ≤Rp250 juta/transfer) di konfirmasi settle',
            'Search by No. Rekening di semua tab',
            'Summary per bank hanya di tab Checker (nominal dinamis dari data checker)',
            'Konfirmasi settle single = kalimat ringkas (norek/bank/pemilik/nominal)',
            'Konfirmasi bulk settle: breakdown per rekening (norek + nama pemilik), "Jumlah Baris", "Grand Total Settlement"',
            'Hold/Reject: fungsi bukti + catatan disatukan jadi "Lihat Bukti"',
            'Approver: toggle Simulasi 2FA Salah untuk uji error path'
        ] },
        { v: '1.4.0', date: '2026-07-06', deployed: false, title: 'Version picker UI', changes: [
            'Dropdown pilih versi di topbar + changelog per versi',
            'Badge Latest / Deployed, pencarian versi, link ke CHANGELOG'
        ] },
        { v: '1.3.0', date: '2026-07-06', deployed: false, title: 'Fase 1 lengkap (batch 3–7)', changes: [
            'Metode Transfer BI-Fast / On-Us·IFT / RTGS; Otomatis di-disable (Fase 2)',
            'Modal konfirmasi summary sebelum settle (channel, qty, breakdown per bank, grand total)',
            '2FA (PIN) saat approve & reject; Bulk Approve/Reject di Approver',
            'Deteksi perubahan rekening: badge Baru / Norek berubah / Anomali (auto-hold)',
            'Export Report Manajemen; badge Akumulasi <Rp10.000; notice include-hold',
            'Reject by Bank di-approve → masuk Hold; Rilis Hold ke Checker tanpa approval'
        ] },
        { v: '1.2.1', date: '2026-07-06', deployed: false, title: 'Docs batch 2', changes: [
            'Panduan Halaman & gap-analysis diperbarui untuk batch 2'
        ] },
        { v: '1.2.0', date: '2026-07-06', deployed: true, title: 'Batch 2', changes: [
            'Grouping kunci = Bank + Nomor Rekening (norek sama beda bank = 2 rekening)',
            'Panel Summary per bank tujuan (Nominal Awal/Admin/Chargeback/Ending)',
            'Bulk Hold & Bulk Reject (selain Bulk Settle)'
        ] },
        { v: '1.1.0', date: '2026-07-06', deployed: false, title: 'Batch 1', changes: [
            'Filter bank tujuan per bank terpisah (tanpa "Bank Lainnya")',
            'Guard BI-FAST > Rp250 juta (peringatan + blok; pengecualian Indonusa)'
        ] },
        { v: '1.0.0', date: '2026-07-06', deployed: false, title: 'Baseline', changes: [
            'Struktur 5 tab, grouping per norek, aksi Hold/Reject/Settle, Export Segregasi',
            'Kondisi mockup sebelum eksekusi build-brief Fase 1'
        ] }
    ];

    function relTime(dateStr) {
        var d = new Date(dateStr + 'T00:00:00'), now = new Date();
        var days = Math.floor((now - d) / 86400000);
        if (days <= 0) return 'hari ini';
        if (days === 1) return 'kemarin';
        return days + ' hari lalu';
    }
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
    var selected = VERSIONS[0].v;

    function badge(txt, color) {
        return '<span style="font-size:0.62rem;font-weight:700;border-radius:999px;padding:1px 8px;background:' + color + '22;color:' + color + ';margin-left:6px;vertical-align:middle;">' + txt + '</span>';
    }

    function renderList(filter) {
        var f = (filter || '').toLowerCase();
        return VERSIONS.filter(function (x) { return !f || ('v' + x.v + ' ' + x.title + ' ' + (x.changes || []).join(' ')).toLowerCase().indexOf(f) >= 0; }).map(function (x, i) {
            var isLatest = x.v === VERSIONS[0].v;
            var isSel = x.v === selected;
            return '<div class="ver-item" data-v="' + x.v + '" style="padding:11px 14px;border-radius:10px;cursor:pointer;' + (isSel ? 'background:#eef2ff;' : '') + '">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                '<div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">v' + esc(x.v) +
                (isLatest ? badge('Latest', '#16a34a') : '') + (x.deployed ? badge('🌐 Deployed', '#2563eb') : '') + '</div>' +
                (isSel ? '<i class="fas fa-check" style="color:#4f46e5;font-size:0.8rem;"></i>' : '') +
                '</div>' +
                '<div style="font-size:0.74rem;color:var(--text-muted);margin-top:2px;">' + esc(x.title) + ' · ' + relTime(x.date) + '</div>' +
                '<ul style="margin:8px 0 0 0;padding-left:16px;">' + x.changes.map(function (c) { return '<li style="font-size:0.74rem;color:var(--text-secondary);line-height:1.5;">' + esc(c) + '</li>'; }).join('') + '</ul>' +
                '</div>';
        }).join('');
    }

    function mount() {
        var host = document.getElementById('versionPicker');
        if (!host) return;
        host.style.position = 'relative';
        host.innerHTML =
            '<button id="verBtn" style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid var(--border-color);border-radius:10px;padding:8px 12px;font-size:0.82rem;font-weight:600;color:var(--text-primary);cursor:pointer;">' +
            '<i class="fas fa-code-branch" style="color:#4f46e5;"></i><span id="verLabel">v' + VERSIONS[0].v + '</span><span style="font-size:0.68rem;font-weight:700;color:#16a34a;">Latest</span><i class="fas fa-chevron-down" style="font-size:0.7rem;color:var(--text-muted);"></i></button>' +
            '<div id="verPanel" style="display:none;position:absolute;right:0;top:46px;width:380px;max-height:70vh;overflow:auto;background:var(--card-bg);border:1px solid var(--border-color);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);z-index:5000;padding:8px;">' +
            '<div style="padding:8px;"><div style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid var(--border-color);border-radius:9px;padding:8px 10px;">' +
            '<i class="fas fa-search" style="color:var(--text-muted);font-size:0.8rem;"></i><input id="verSearch" placeholder="Cari versi…" style="border:none;background:none;outline:none;flex:1;font-size:0.82rem;color:var(--text-primary);"></div></div>' +
            '<div id="verList">' + renderList('') + '</div>' +
            '<div style="padding:8px 10px;border-top:1px solid var(--border-color);margin-top:6px;display:flex;justify-content:space-between;align-items:center;">' +
            '<a href="CHANGELOG.md" target="_blank" style="font-size:0.74rem;color:#4f46e5;text-decoration:none;">Lihat CHANGELOG lengkap</a>' +
            '<button id="verLoad" style="background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:0.76rem;font-weight:600;cursor:pointer;">Muat versi ini</button>' +
            '</div></div>';

        var btn = document.getElementById('verBtn');
        var panel = document.getElementById('verPanel');
        var list = document.getElementById('verList');
        btn.addEventListener('click', function (e) { e.stopPropagation(); panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });
        document.addEventListener('click', function (e) { if (!e.target.closest('#versionPicker')) panel.style.display = 'none'; });
        panel.addEventListener('click', function (e) { e.stopPropagation(); });
        document.getElementById('verSearch').addEventListener('input', function () { list.innerHTML = renderList(this.value); });
        list.addEventListener('click', function (e) {
            var it = e.target.closest('.ver-item'); if (!it) return;
            selected = it.dataset.v; list.innerHTML = renderList(document.getElementById('verSearch').value);
        });
        document.getElementById('verLoad').addEventListener('click', function () {
            var isLatest = selected === VERSIONS[0].v;
            document.getElementById('verLabel').textContent = 'v' + selected;
            document.querySelector('#verBtn span:nth-child(3)').textContent = isLatest ? 'Latest' : 'dipilih';
            panel.style.display = 'none';
            if (window.showToast) window.showToast('Versi ' + (isLatest ? 'Latest' : 'v' + selected), isLatest ? 'Menampilkan build terbaru.' : 'Mock: changelog v' + selected + ' ditampilkan. Build aktif tetap Latest.');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
