/* ===================================================
   Auto Reconcile — Version Picker
   Sumber tunggal daftar versi + changelog. Dropdown di
   topbar untuk pilih versi & lihat perubahan tiap versi.
   Mock front-end: "muat versi" bersifat tampilan saja —
   build aktif tetap Latest (tidak load bundle lama).
   =================================================== */
(function () {
    // Terbaru di atas. deployed=true → badge Deployed. Versi pertama = Latest.
    var VERSIONS = [
        { v: '1.4.0', date: '2026-07-22', deployed: true, title: 'Version picker recon · konfirmasi bulk action · catatan wajib Tolak · +600 seed', changes: [
            'Version picker in-app di halaman Auto Reconcile (dropdown changelog, pola Auto Settlement)',
            'Modal konfirmasi untuk semua bulk action — menampilkan jumlah data + wording sesuai jenis aksi',
            'Tolak (bulk & single): modal catatan wajib diisi; catatan diterapkan ke seluruh data yang ditolak',
            'Seed +600 data unmatched (200 Buat Transaksi · 200 Flag Recon · 200 Tolak) untuk demo bulk action'
        ] },
        { v: '1.3.0', date: '2026-07-01', deployed: false, title: 'Sidebar satu sumber + panduan halaman sinkron PRD', changes: [
            'Sidebar Auto Reconcile jadi satu sumber kebenaran (sidebar.js) di semua halaman',
            'Panduan Halaman auto-recon disinkronkan dengan PRD + perubahan terkini'
        ] },
        { v: '1.2.0', date: '2026-06-24', deployed: false, title: 'Halaman Admin, grouped Settle & Recon, export gating', changes: [
            'Halaman Admin (permission per segmen) + boot.js bersama antar halaman',
            'Kolom Settle & Recon dikelompokkan; urutan kolom dirapikan',
            'Export di-gate per tipe; baris total di export dihapus; Log filter redesign',
            'Bugfix: pagination nyata, seed match/decline, persistensi approval, modal + sidebar'
        ] },
        { v: '1.1.0', date: '2026-06-23', deployed: false, title: 'Unmatch page + guard Tolak sesuai PRD', changes: [
            'Logika halaman Unmatch + seed data disesuaikan PRD',
            'Reset filter saat pindah tab; gate aksi Tolak pada status gagal; seed validasi'
        ] },
        { v: '1.0.0', date: '2026-06-23', deployed: false, title: 'Baseline Auto Reconcile', changes: [
            'Dashboard QRIS Acquirer Reconcile: summary cards Total / Matched / Unmatched',
            'Tabel rekonsiliasi transaksi, filter tanggal, pencarian, struktur multi-tab + seed awal'
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
