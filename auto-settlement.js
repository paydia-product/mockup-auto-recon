/* ===================================================
   Paydia Bisnis – Auto Settlement (tabbed workflow)
   Modul TERPISAH dari Auto Recon.
   Tabs: Checker → Approver → (Hold | Reject | Settle).
   Unit data = ENTRY per NOMOR REKENING (transaksi dgn norek
   sama digrouping jadi 1 entry; rincian per merchant ada di
   modal Detail ID Settlement → List Settlement).
   Mock front-end only: upload bukti = nama file saja, no backend.
   =================================================== */

var CORE_BANKS = ['BCA', 'BRI', 'MANDIRI'];
var ADMIN_FEE_OTHER = 6500;
// Channel payment = bank yang dipakai sebagai metode transfer (bukan BI-FAST/SKN/RTGS).
var CHANNELS = ['BCA', 'BRI', 'Mandiri', 'NOBU', 'AGI', 'OCBC'];
var PER_PAGE = 10;

// Base columns shared by every tab (in order). Unit = settlement group (per norek).
var BASE_COLS = ['No', 'Tanggal Proses', 'ID Settlement', 'Nominal Awal', 'Admin',
    'Adjustment Chargeback (+)', 'Adjustment Chargeback (−)', 'Total Settle', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

var STATUS_LABEL = { checker: 'Checker', pending: 'Approver', hold: 'Hold', reject: 'Reject', settle: 'Settle' };

var pool = [];        // per-transaction facts
var groups = [];      // per-rekening settlement entries (the row unit)
var items = {};       // per-groupId mutable state
var activeTab = 'checker';
var page = 1;
var selected = new Set();
var searchTerm = '';
var filters = null;
var BIG_THRESHOLD = 250000000;
var bulkMode = false;

// ── helpers ──
var rupiah = function (n) { return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }); };
var num = function (n) { return (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }); }; // tanpa "Rp" untuk sel tabel
var AUTO_HOLD_MIN = 10000;
var SCOPE_LABEL = { all: 'Hold Semua', partial: 'Hold Partial', min: 'Hold Dibawah Min. Transaksi' };
var esc = function (v) { v = String(v == null ? '' : v); return v.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
var isOther = function (b) { return CORE_BANKS.indexOf(String(b).toUpperCase()) === -1; };
var bankGroup = function (b) { return isOther(b) ? 'Lainnya' : String(b).toUpperCase().replace('MANDIRI', 'Mandiri'); };
var todayProc = function () { var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
var todayISO = function () { var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
function defaultFilters() { return { start: todayISO(), end: todayISO(), banks: new Set(), big: false, req: '' }; }

function loadItems() { try { items = JSON.parse(localStorage.getItem('paydia_as_items')) || {}; } catch (e) { items = {}; } }
function saveItems() { localStorage.setItem('paydia_as_items', JSON.stringify(items)); }

function st(id) {
    if (!items[id]) items[id] = { status: 'checker', adjPlus: 0, adjMinus: 0, note: '', request: null, channel: '', bukti: '' };
    return items[id];
}

function loadPool() {
    var db = [];
    try { db = JSON.parse(localStorage.getItem('paydia_settlements')) || []; } catch (e) { db = []; }
    var iso = todayISO();
    var disp = iso.split('-').reverse().join('-');
    var pad = function (x) { return String(x).padStart(2, '0'); };
    var src = db.map(function (r) {
        return { txId: r.txId, tanggal: r.tanggal, merchantName: r.merchantName, mid: r.merchantCode,
            bankCode: r.bankCode, bankAccount: r.bankAccount, bankAccountName: r.bankAccountName,
            nominalSettle: Number(r.nominalSettle) || 0, tipeSettlement: r.tipeSettlement || 'Reguler Matched',
            adjPlus: 0, adjMinus: 0 };
    });
    // Demo: 3 merchant berbeda dgn NOREK sama → tergroup jadi 1 entry; ada adj chargeback +/-.
    src.push({ txId: 'TX-ACQ-30001', tanggal: '24-06-2026 09:40:00', merchantName: 'Kopi Kenangan', mid: 'MID-77001', bankCode: 'BCA', bankAccount: '8800123456789', bankAccountName: 'PT Mitra Bersama', nominalSettle: 220000, tipeSettlement: 'Reguler Matched', adjPlus: 25000, adjMinus: 0 });
    src.push({ txId: 'TX-ACQ-30002', tanggal: '24-06-2026 09:41:00', merchantName: 'Janji Jiwa', mid: 'MID-77002', bankCode: 'BCA', bankAccount: '8800123456789', bankAccountName: 'PT Mitra Bersama', nominalSettle: 185000, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 15000 });
    src.push({ txId: 'TX-ACQ-30003', tanggal: '24-06-2026 09:42:00', merchantName: 'Roti Bakar 88', mid: 'MID-77003', bankCode: 'BCA', bankAccount: '8800123456789', bankAccountName: 'PT Mitra Bersama', nominalSettle: 97500, tipeSettlement: 'Tambahan Matched', adjPlus: 10000, adjMinus: 5000 });
    // Demo: entry dengan total settle > Rp250 juta (uji filter Nominal > 250jt).
    src.push({ txId: 'TX-ACQ-30010', tanggal: '24-06-2026 10:00:00', merchantName: 'PT Sumber Rejeki', mid: 'MID-88001', bankCode: 'BCA', bankAccount: '7100099887766', bankAccountName: 'PT Sumber Rejeki Abadi', nominalSettle: 280000000, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0 });
    src.push({ txId: 'TX-ACQ-30011', tanggal: '24-06-2026 10:05:00', merchantName: 'PT Sumber Rejeki', mid: 'MID-88001', bankCode: 'BCA', bankAccount: '7100099887766', bankAccountName: 'PT Sumber Rejeki Abadi', nominalSettle: 12500000, tipeSettlement: 'Tambahan Matched', adjPlus: 1500000, adjMinus: 750000 });
    // Demo: bank tujuan non-core (OCBC = Lainnya) dgn total settle < Rp10.000 → auto-hold.
    src.push({ txId: 'TX-ACQ-30020', tanggal: '24-06-2026 10:10:00', merchantName: 'Kios Pulsa Andi', mid: 'MID-99001', bankCode: 'OCBC', bankAccount: '6600055554444', bankAccountName: 'Andi Saputra', nominalSettle: 8500, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0 });
    pool = src.map(function (r, i) {
        r.procISO = iso;
        r.procDisplay = disp + ' ' + pad(8 + Math.floor(i / 6)) + ':' + pad((i * 7) % 60) + ':00';
        return r;
    });
    buildGroups();
}

// Group transaksi per NOMOR REKENING → 1 entry settlement.
function buildGroups() {
    var map = {};
    pool.forEach(function (t) {
        var key = t.bankAccount;
        if (!map[key]) {
            map[key] = { groupId: 'STL-' + key, norek: key, bank: t.bankCode, namaRek: t.bankAccountName,
                procISO: t.procISO, procDisplay: t.procDisplay, txns: [], nominalAwal: 0, adjPlus: 0, adjMinus: 0,
                admin: isOther(t.bankCode) ? ADMIN_FEE_OTHER : 0 };
        }
        map[key].txns.push(t);
        map[key].nominalAwal += t.nominalSettle;
        map[key].adjPlus += (t.adjPlus || 0);
        map[key].adjMinus += (t.adjMinus || 0);
    });
    groups = Object.keys(map).map(function (k) { return map[k]; });
    groups.forEach(function (g) {
        var s = st(g.groupId);
        // Auto-hold: total settle < Rp10.000 untuk bank tujuan bukan BCA/Mandiri/BRI.
        if (s.status === 'checker' && !s.request && isOther(g.bank) && totalOf(g) < AUTO_HOLD_MIN) {
            s.status = 'hold';
            s.request = { type: 'hold', scope: 'min', reason: 'Auto hold: total settle < Rp10.000 (bank tujuan non-BCA/Mandiri/BRI)', bukti: '', ts: todayProc(), auto: true };
        }
    });
    saveItems();
}

function totalOf(g) { return g.nominalAwal - g.admin + (g.adjPlus || 0) - (g.adjMinus || 0); }
function groupById(id) { return groups.find(function (g) { return g.groupId === id; }); }

// ── filtering ──
function tabGroups(tab) {
    var f = filters || defaultFilters();
    return groups.filter(function (g) {
        var s = st(g.groupId);
        if (s.status !== tab) return false;
        if (f.start && g.procISO < f.start) return false;
        if (f.end && g.procISO > f.end) return false;
        if (f.banks && f.banks.size > 0 && !f.banks.has(bankGroup(g.bank))) return false;
        if (f.big && g.nominalAwal <= BIG_THRESHOLD) return false;
        if (tab === 'pending' && f.req) {
            var rq = s.request || {};
            if (f.req === 'hold' && !(rq.type === 'hold' && rq.scope !== 'partial')) return false;
            if (f.req === 'holdpartial' && !(rq.type === 'hold' && rq.scope === 'partial')) return false;
            if (f.req === 'reject' && rq.type !== 'reject') return false;
            if (f.req === 'settle' && rq.type !== 'settle') return false;
        }
        if (searchTerm) {
            // hanya by ID Settlement / Nama Pemilik Rekening
            var hay = (g.groupId + ' ' + g.namaRek).toLowerCase();
            if (hay.indexOf(searchTerm.toLowerCase()) === -1) return false;
        }
        return true;
    });
}

// ── render ──
function render() {
    renderCounts();
    renderTabsActive();
    renderToolbarActions();
    renderTable();
    renderBulkBar();
}

function renderCounts() {
    ['checker', 'pending', 'hold', 'reject', 'settle'].forEach(function (tab) {
        var id = tab === 'pending' ? 'cnt-approver' : 'cnt-' + tab;
        var el = document.getElementById(id);
        if (el) el.textContent = groups.filter(function (g) { return st(g.groupId).status === tab; }).length;
    });
}

function renderTabsActive() {
    document.querySelectorAll('.as-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === uiTab()); });
}
function uiTab() { return activeTab === 'pending' ? 'approver' : activeTab; }

function columnsFor(tab) { var cols = BASE_COLS.slice(); if (tab === 'pending') cols.push('Request'); if (tab === 'hold') cols.push('Alasan'); return cols; }

function renderTable() {
    var thead = document.getElementById('asThead');
    var tbody = document.getElementById('asTableBody');
    var cols = columnsFor(activeTab);
    var hasCb = activeTab === 'checker' && bulkMode;
    var headHtml = '<tr>';
    if (hasCb) headHtml += '<th style="width:38px;text-align:center;"><input type="checkbox" id="asSelectAll"></th>';
    cols.forEach(function (c) {
        var align = (c.indexOf('Nominal') >= 0 || c.indexOf('Admin') >= 0 || c.indexOf('Adj') >= 0 || c.indexOf('Total') >= 0) ? ' style="text-align:right;"' : '';
        headHtml += '<th' + align + '>' + c + '</th>';
    });
    headHtml += '<th style="text-align:center;width:120px;">Aksi</th></tr>';
    thead.innerHTML = headHtml;

    var rows = tabGroups(activeTab);
    var totalSpan = cols.length + 1 + (hasCb ? 1 : 0);
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="' + totalSpan + '" style="text-align:center;padding:36px;color:var(--text-muted);">Tidak ada data</td></tr>';
        renderPager(0);
        return;
    }
    var pages = Math.ceil(rows.length / PER_PAGE);
    if (page > pages) page = pages;
    var slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    tbody.innerHTML = slice.map(function (g, idx) {
        var s = st(g.groupId);
        var no = (page - 1) * PER_PAGE + idx + 1;
        var c = '<tr>';
        if (hasCb) c += '<td style="text-align:center;"><input type="checkbox" class="as-cb" data-id="' + g.groupId + '" ' + (selected.has(g.groupId) ? 'checked' : '') + '></td>';
        c += '<td>' + no + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(g.procDisplay) + '</td>';
        c += '<td style="min-width:150px;"><a class="as-link" data-detail="settle" data-id="' + g.groupId + '" style="font-family:monospace;font-size:0.78rem;white-space:normal;word-break:break-all;">' + esc(g.groupId) + '</a><div style="font-size:0.7rem;color:var(--text-muted);">' + g.txns.length + ' transaksi</div></td>';
        c += '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(g.nominalAwal) + '</td>';
        c += '<td style="text-align:right;">' + (g.admin ? num(g.admin) : '-') + '</td>';
        c += '<td style="text-align:right;color:#16a34a;">' + (g.adjPlus ? '+' + num(g.adjPlus) : '-') + '</td>';
        c += '<td style="text-align:right;color:#dc2626;">' + (g.adjMinus ? '−' + num(g.adjMinus) : '-') + '</td>';
        c += '<td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">' + num(totalOf(g)) + '</td>';
        c += '<td>' + esc(g.bank) + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(g.norek) + '</td>';
        c += '<td>' + esc(g.namaRek) + '</td>';
        if (activeTab === 'pending') {
            var rq = s.request || {};
            var col = rq.type === 'settle' ? '#16a34a' : (rq.type === 'reject' ? '#dc2626' : '#b45309');
            c += '<td><span class="as-req-badge" style="background:' + col + '22;color:' + col + ';">' + (rq.type ? rq.type.toUpperCase() : '-') + '</span></td>';
        }
        if (activeTab === 'hold') {
            var hr = s.request || {};
            c += '<td>' + esc(SCOPE_LABEL[hr.scope] || '-') + '</td>';
        }
        c += '<td style="text-align:center;white-space:nowrap;">' + actionButtons(g) + '</td>';
        c += '</tr>';
        return c;
    }).join('');

    if (hasCb) {
        var all = document.getElementById('asSelectAll');
        var syncHeader = function () { if (all) all.checked = slice.length > 0 && slice.every(function (g) { return selected.has(g.groupId); }); };
        syncHeader();
        if (all) all.addEventListener('change', function () {
            var on = all.checked;
            slice.forEach(function (g) { on ? selected.add(g.groupId) : selected.delete(g.groupId); });
            render();
        });
        tbody.querySelectorAll('.as-cb').forEach(function (cb) {
            cb.addEventListener('change', function () { cb.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id); syncHeader(); renderBulkBar(); });
        });
    }
    renderPager(rows.length);
}

function actionMenuItems() {
    if (activeTab === 'checker') return [['hold', 'Hold'], ['reject', 'Reject'], ['settle', 'Settle']];
    if (activeTab === 'pending') return [['approve', 'Approve'], ['areject', 'Reject'], ['view', 'Lihat Detail Request']];
    if (activeTab === 'settle') return [['toreject', 'Ganti Status → Reject']];
    return [];
}
function actionButtons(g) {
    if (actionMenuItems().length === 0) return '<span style="color:var(--text-muted);">—</span>';
    return '<button class="as-kebab" data-id="' + g.groupId + '" title="Aksi" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:1.1rem;padding:4px 10px;"><i class="fas fa-ellipsis-vertical"></i></button>';
}

function renderPager(total) {
    var el = document.getElementById('asPager');
    if (!total) { el.innerHTML = ''; return; }
    var pages = Math.ceil(total / PER_PAGE);
    var from = (page - 1) * PER_PAGE + 1, to = Math.min(page * PER_PAGE, total);
    var h = '<span class="as-pager-info">Menampilkan ' + from + '–' + to + ' dari ' + total + '</span>';
    h += '<button ' + (page <= 1 ? 'disabled' : '') + ' data-pg="' + (page - 1) + '">&lt;</button>';
    for (var i = 1; i <= pages; i++) h += '<button class="' + (i === page ? 'active' : '') + '" data-pg="' + i + '">' + i + '</button>';
    h += '<button ' + (page >= pages ? 'disabled' : '') + ' data-pg="' + (page + 1) + '">&gt;</button>';
    el.innerHTML = h;
    el.querySelectorAll('button[data-pg]').forEach(function (b) { b.addEventListener('click', function () { page = +b.dataset.pg; renderTable(); }); });
}

function renderToolbarActions() {
    var box = document.getElementById('asTabActions');
    box.innerHTML = '';
    if (activeTab === 'checker') {
        box.innerHTML = '<button class="btn" id="asBulkBtn" style="margin:0;background:' + (bulkMode ? 'var(--primary)' : '#1e293b') + ';color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-check-double"></i> ' + (bulkMode ? 'Tutup Bulk Action' : 'Bulk Action') + '</button>';
        document.getElementById('asBulkBtn').addEventListener('click', function () { bulkMode = !bulkMode; if (!bulkMode) selected.clear(); render(); });
    } else if (activeTab === 'settle') {
        box.innerHTML = '<button class="btn" id="asRejectByBank" style="margin:0;background:#dc2626;color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-building-columns"></i> Reject by Bank</button>';
        document.getElementById('asRejectByBank').addEventListener('click', openRejectByBank);
    }
}

function renderBulkBar() {
    var bar = document.getElementById('asBulkBar');
    if (activeTab !== 'checker' || !bulkMode) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    document.getElementById('asBulkCount').textContent = selected.size;
    // Bulk Settle & Unselect All hanya tampil kalau ada yang dichecklist.
    var show = selected.size > 0 ? 'inline-flex' : 'none';
    document.getElementById('asBulkSettle').style.display = show;
    document.getElementById('asUnselectAll').style.display = show;
}

// ── generic modal ──
function openModal(title, bodyHTML, footer, width) {
    document.getElementById('asModalTitle').innerHTML = title;
    document.getElementById('asModalBody').innerHTML = bodyHTML;
    document.querySelector('#asModal .modal').style.maxWidth = width || '560px';
    var f = document.getElementById('asModalFooter');
    f.innerHTML = '';
    (footer || []).forEach(function (b) {
        var el = document.createElement('button');
        el.className = 'btn ' + (b.cls || '');
        el.textContent = b.label;
        if (b.style) el.style.cssText = b.style;
        el.addEventListener('click', b.onClick);
        f.appendChild(el);
    });
    document.getElementById('asModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeModal() { document.getElementById('asModal').classList.remove('show'); document.body.style.overflow = 'auto'; }

// ── detail modal: ID Settlement ──
function showSettlementDetail(g) {
    var s = st(g.groupId);
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var fields = kv('ID Settlement', '<span style="font-family:monospace;">' + esc(g.groupId) + '</span>') +
        kv('Tanggal Proses', esc(g.procDisplay)) + kv('Bank', esc(g.bank)) +
        kv('Nomor Rekening', esc(g.norek)) + kv('Nama Pemilik Rekening', esc(g.namaRek)) +
        kv('Status', STATUS_LABEL[s.status] || s.status);
    var colg = '<colgroup>' + ['5%', '10%', '14%', '13%', '10%', '13%', '13%', '7%', '15%'].map(function (w) { return '<col style="width:' + w + ';">'; }).join('') + '</colgroup>';
    var tipeChip = function (t) { var cls = t === 'Tambahan Matched' ? 'status-dikembalikan' : 'status-sukses'; return '<span class="status-badge ' + cls + '" style="font-size:0.62rem;white-space:normal;display:inline-block;line-height:1.25;">' + esc(t) + '</span>'; };
    var thS = 'padding:8px 6px;word-break:keep-all;white-space:normal;';
    var thR = thS + 'text-align:right;';
    var listHead = '<tr><th style="' + thS + '">No</th><th style="' + thS + '">Tanggal</th><th style="' + thS + '">ID Transaksi</th><th style="' + thS + '">Merchant</th>' +
        '<th style="' + thR + '">Nominal Settle (Rp)</th><th style="' + thR + '">Adjustment Chargeback (+)</th><th style="' + thR + '">Adjustment Chargeback (−)</th>' +
        '<th style="' + thS + '">Bank</th><th style="' + thS + '">Tipe Settlement</th></tr>';
    var wb = ' style="word-break:break-word;overflow-wrap:anywhere;"';
    var listBody = g.txns.map(function (t, i) {
        return '<tr><td' + wb + '>' + (i + 1) + '</td><td' + wb + '>' + esc(t.tanggal) + '</td>' +
            '<td style="font-family:monospace;font-size:0.7rem;word-break:break-all;">' + esc(t.txId) + '</td>' +
            '<td' + wb + '>' + esc(t.merchantName) + '<div style="font-size:0.7rem;color:var(--text-muted);">' + esc(t.mid) + '</div></td>' +
            '<td style="text-align:right;font-variant-numeric:tabular-nums;word-break:break-word;">' + num(t.nominalSettle) + '</td>' +
            '<td style="text-align:right;color:#16a34a;word-break:break-word;">' + (t.adjPlus ? '+' + num(t.adjPlus) : '-') + '</td>' +
            '<td style="text-align:right;color:#dc2626;word-break:break-word;">' + (t.adjMinus ? '−' + num(t.adjMinus) : '-') + '</td>' +
            '<td' + wb + '>' + esc(t.bankCode) + '</td><td' + wb + '>' + tipeChip(t.tipeSettlement) + '</td></tr>';
    }).join('');
    var ringkas = '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:6px;">Ringkasan Settlement</div>' +
        kv('Nominal Awal', rupiah(g.nominalAwal)) + kv('Biaya Admin', g.admin ? '− ' + rupiah(g.admin) : '-') +
        kv('Adjustment Chargeback (+)', g.adjPlus ? '<span style="color:#16a34a;">+ ' + rupiah(g.adjPlus) + '</span>' : '-') +
        kv('Adjustment Chargeback (−)', g.adjMinus ? '<span style="color:#dc2626;">− ' + rupiah(g.adjMinus) + '</span>' : '-') +
        kv('Total Settle', '<b>' + rupiah(totalOf(g)) + '</b>');
    var body = fields + ringkas +
        '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:8px;">List Settlement <span style="font-weight:400;color:var(--text-muted);font-size:0.78rem;">(' + g.txns.length + ' transaksi)</span></div>' +
        '<div style="overflow-y:auto;overflow-x:hidden;max-height:300px;"><table class="data-table" style="table-layout:fixed;width:100%;font-size:0.74rem;">' + colg + '<thead>' + listHead + '</thead><tbody>' + listBody + '</tbody></table></div>';
    openModal('Detail ID Settlement', body, [{ label: 'Tutup', onClick: closeModal }], '880px');
}

// ── action modal helpers ──
function fileField(hint) {
    return '<div class="as-fld"><label>Upload Bukti <span style="font-weight:400;color:var(--text-muted);">' + (hint || '(opsional)') + '</span></label>' +
        '<input type="file" id="asBukti" accept=".pdf,.jpg,.jpeg,.png" style="font-size:0.82rem;"></div>';
}
function noteField(required) {
    return '<div class="as-fld"><label>Catatan' + (required ? ' <span style="color:#ef4444;">*</span>' : ' (opsional)') + '</label><textarea id="asReason" rows="3" placeholder="Tulis catatan…"></textarea></div>';
}
function validateBukti(requiredMsg) {
    var f = document.getElementById('asBukti');
    var file = f && f.files && f.files[0];
    if (!file) { if (requiredMsg) { showToast('Bukti Wajib', requiredMsg); return null; } return { name: '' }; }
    var ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'jpg', 'jpeg', 'png'].indexOf(ext) === -1) { showToast('Format Salah', 'Format bukti harus PDF, JPG, JPEG, atau PNG.'); return null; }
    if (file.size > 25 * 1024 * 1024) { showToast('File Terlalu Besar', 'Ukuran bukti maksimal 25 MB.'); return null; }
    return { name: file.name };
}
function channelField() {
    return '<div class="as-fld"><label>Channel Payment</label><select id="asChannel">' + CHANNELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>';
}

// ── checker actions (operate on the settlement GROUP) ──
function openHold(g) {
    var body = '<div class="as-fld"><label>Cakupan Hold</label>' +
        '<label style="font-weight:500;display:block;"><input type="radio" name="asHoldScope" value="all" checked> Hold Semua</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="partial"> Hold Partial (pilih MID)</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="min"> Hold Dibawah Min. Transaksi <span style="font-weight:400;color:var(--text-muted);">(hold seluruh settlement norek ini)</span></label></div>' +
        '<div class="as-fld" id="asPartialWrap" style="display:none;"><label>Pilih transaksi yang dihold</label><div class="as-partial-list" id="asPartialList">' +
        g.txns.map(function (t, i) { return '<label><input type="checkbox" class="as-pp" value="' + t.txId + '" ' + (i === 0 ? 'checked' : '') + '> ' + esc(t.merchantName) + ' · ' + esc(t.mid) + ' · ' + rupiah(t.nominalSettle) + '</label>'; }).join('') +
        '</div></div>' + noteField(true) + fileField('— maks 25 MB, format PDF/JPG/JPEG/PNG, wajib jika Hold Partial');
    openModal('Hold Settlement', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Hold', style: 'background:#b45309;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { submitHold(g); } }
    ]);
    document.querySelectorAll('input[name=asHoldScope]').forEach(function (rb) {
        rb.addEventListener('change', function () { document.getElementById('asPartialWrap').style.display = (this.value === 'partial') ? 'block' : 'none'; });
    });
}
function submitHold(g) {
    var scope = document.querySelector('input[name=asHoldScope]:checked').value;
    var reason = document.getElementById('asReason').value.trim();
    if (!reason) { showToast('Catatan Wajib', 'Isi catatan hold.'); return; }
    var picked = null;
    if (scope === 'partial') {
        picked = Array.from(document.querySelectorAll('.as-pp:checked')).map(function (c) { return c.value; });
        if (!picked.length) { showToast('Pilih MID', 'Pilih minimal satu transaksi untuk hold partial.'); return; }
    }
    var bk = validateBukti(scope === 'partial' ? 'Upload bukti wajib untuk Hold Partial.' : null);
    if (!bk) return;
    var s = st(g.groupId); s.status = 'pending';
    s.request = { type: 'hold', scope: scope, partialTxns: picked, reason: reason, bukti: bk.name, ts: todayProc() };
    saveItems(); closeModal(); render();
    showToast('Hold Diajukan', g.groupId + ' menunggu approval Approver.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Hold (' + scope + ') ' + g.groupId);
}

function openReject(g) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Reject settlement <b>' + esc(g.groupId) + '</b> (' + esc(g.namaRek) + ').</p>' + noteField(true) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Reject Settlement', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan reject.'); return; }
            var bk = validateBukti(null); if (!bk) return;
            var s = st(g.groupId); s.status = 'pending'; s.request = { type: 'reject', reason: reason, bukti: bk.name, ts: todayProc() };
            saveItems(); closeModal(); render(); showToast('Reject Diajukan', 'Menunggu approval Approver.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Reject ' + g.groupId);
        } }
    ]);
}

function openSettle(g) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Settle <b>' + esc(g.groupId) + '</b> — ' + rupiah(totalOf(g)) + '.</p>' + channelField() + noteField(false) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Settle Transaksi', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ch = document.getElementById('asChannel').value;
            var bk = validateBukti(null); if (!bk) return;
            var s = st(g.groupId); s.status = 'pending'; s.request = { type: 'settle', channel: ch, reason: document.getElementById('asReason').value.trim(), bukti: bk.name, ts: todayProc() };
            saveItems(); closeModal(); render(); showToast('Settle Diajukan', 'Menunggu approval Approver.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Settle ' + g.groupId + ' via ' + ch);
        } }
    ]);
}

function openBulkSettle() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk settle <b>' + selected.size + '</b> entry terpilih.</p>' + channelField();
    openModal('Bulk Settle', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ch = document.getElementById('asChannel').value;
            var ids = Array.from(selected);
            ids.forEach(function (id) { var s = st(id); s.status = 'pending'; s.request = { type: 'settle', channel: ch, reason: '', bukti: '', ts: todayProc() }; });
            selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Settle Diajukan', ids.length + ' entry menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Settle ' + ids.length + ' entry via ' + ch);
        } }
    ]);
}

// ── approver ──
function openApproverView(g) {
    var s = st(g.groupId); var rq = s.request || {};
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var body = kv('ID Settlement', esc(g.groupId)) + kv('Nama Pemilik Rekening', esc(g.namaRek)) +
        kv('Tipe Request', (rq.type || '-').toUpperCase()) +
        (rq.scope ? kv('Cakupan', rq.scope) : '') + (rq.scope === 'partial' && rq.partialTxns ? kv('MID Dihold', rq.partialTxns.length + ' transaksi') : '') +
        (rq.channel ? kv('Channel', rq.channel) : '') +
        kv('Catatan', esc(rq.reason || '-')) + kv('Bukti', rq.bukti ? esc(rq.bukti) : '<span style="color:var(--text-muted);">tidak ada</span>') + kv('Diajukan', esc(rq.ts || '-'));
    openModal('Detail Request', body, [{ label: 'Tutup', onClick: closeModal }]);
}
function approverDecide(g, approve) {
    var s = st(g.groupId); var rq = s.request || {};
    if (approve) {
        s.status = rq.type;
        if (rq.type === 'settle') s.channel = rq.channel || '';
        showToast('Request Disetujui', g.groupId + ' → ' + (rq.type || '').toUpperCase() + '.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Approve ' + (rq.type || '') + ' ' + g.groupId);
    } else {
        s.status = 'checker'; s.request = null;
        showToast('Request Ditolak', g.groupId + ' dikembalikan ke Checker.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject request ' + g.groupId);
    }
    saveItems(); render();
}

// ── settle tab: reject by bank ──
function openRejectByBank() {
    var banks = ['BCA', 'Mandiri', 'BRI', 'Lainnya'];
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Pindahkan seluruh entry <b>Settle</b> pada bank terpilih ke status <b>Reject</b>.</p>' +
        '<div class="as-fld"><label>Bank</label><select id="asRbbBank">' + banks.map(function (b) {
            var n = groups.filter(function (g) { return st(g.groupId).status === 'settle' && bankGroup(g.bank) === b; }).length;
            return '<option value="' + b + '">' + b + ' (' + n + ' entry)</option>';
        }).join('') + '</select></div>';
    openModal('Reject by Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var b = document.getElementById('asRbbBank').value;
            var targets = groups.filter(function (g) { return st(g.groupId).status === 'settle' && bankGroup(g.bank) === b; });
            if (!targets.length) { showToast('Kosong', 'Tidak ada entry settle untuk bank ' + b + '.'); return; }
            targets.forEach(function (g) { st(g.groupId).status = 'reject'; });
            saveItems(); closeModal(); render(); showToast('Status Diubah', targets.length + ' entry ' + b + ' → Reject.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject by Bank ' + b + ' (' + targets.length + ' entry)');
        } }
    ]);
}

// ── export current tab ──
var EXPORT_COLS = ['No', 'Tanggal Proses', 'ID Settlement', 'Nominal Awal', 'Admin', 'Adjustment Chargeback (+)', 'Adjustment Chargeback (-)', 'Total Settle', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening', 'Status'];

function exportRowData(rows) {
    return rows.map(function (g, i) {
        var s = st(g.groupId);
        return [i + 1, g.procDisplay, g.groupId, g.nominalAwal, g.admin, g.adjPlus || 0, g.adjMinus || 0, totalOf(g), g.bank, g.norek, g.namaRek, STATUS_LABEL[s.status]];
    });
}
function downloadCsv(data) {
    var e = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['Auto Settlement — Tab ' + STATUS_LABEL[activeTab], 'Generated By:,dion@paydia.id', '', EXPORT_COLS.join(',')];
    data.forEach(function (row) { lines.push(row.map(e).join(',')); });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'AutoSettlement_' + STATUS_LABEL[activeTab] + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export Berhasil', 'Tab ' + STATUS_LABEL[activeTab] + ' di-export.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Export tab ' + STATUS_LABEL[activeTab]);
}
function showExportPreview(data) {
    var fmt = function (c, v) { return (typeof v === 'number' && c >= 3 && c <= 7) ? num(v) : esc(v); };
    document.getElementById('asExportSub').innerHTML = 'Simulasi hasil ekspor tab <b>' + STATUS_LABEL[activeTab] + '</b> — ' + data.length + ' baris.';
    document.getElementById('asExportHead').innerHTML = '<tr>' + EXPORT_COLS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    document.getElementById('asExportBody').innerHTML = data.map(function (row) {
        return '<tr>' + row.map(function (v, c) { return '<td>' + fmt(c, v) + '</td>'; }).join('') + '</tr>';
    }).join('');
    document.getElementById('asExportDownload').onclick = function () { downloadCsv(data); };
    document.getElementById('asExportModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function exportTab() {
    var rows = tabGroups(activeTab);
    if (!rows.length) { showToast('Kosong', 'Tidak ada data untuk diexport.'); return; }
    var data = exportRowData(rows);
    var wrap = document.getElementById('asExportProgress');
    var bar = document.getElementById('asProgressBar');
    var txt = document.getElementById('asProgressText');
    bar.style.width = '0%'; txt.textContent = 'Memproses… 0%';
    wrap.style.display = 'flex';
    var pct = 0;
    var iv = setInterval(function () {
        pct += Math.floor(Math.random() * 14) + 6; if (pct > 100) pct = 100;
        bar.style.width = pct + '%'; txt.textContent = 'Memproses… ' + pct + '%';
        if (pct >= 100) { clearInterval(iv); setTimeout(function () { wrap.style.display = 'none'; showExportPreview(data); }, 350); }
    }, 180);
}

// ── toast + log ──
function showToast(title, msg) {
    var c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = '<i class="fas fa-info-circle toast-icon" style="color:var(--primary);"></i><div class="toast-body"><div class="toast-title">' + title + '</div><div class="toast-msg">' + msg + '</div></div><button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function () { t.remove(); });
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3500);
}
function writeLog(type, detail) {
    var logs = [];
    try { logs = JSON.parse(localStorage.getItem('paydia_logs')) || []; } catch (e) { logs = []; }
    var maxId = 9138; logs.forEach(function (l) { var n = parseInt(l.id); if (!isNaN(n) && n > maxId) maxId = n; });
    var now = new Date(), p = function (x) { return String(x).padStart(2, '0'); };
    var ds = p(now.getDate()) + '-' + p(now.getMonth() + 1) + '-' + now.getFullYear() + ' ' + p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
    logs.unshift({ id: maxId + 1, tanggal: ds, container: 'paydia-auto-settlement', type: type, detail: detail, ip: '125.161.77.69' });
    localStorage.setItem('paydia_logs', JSON.stringify(logs));
}

function runAction(act, g) {
    if (act === 'hold') openHold(g);
    else if (act === 'reject') openReject(g);
    else if (act === 'settle') openSettle(g);
    else if (act === 'view') openApproverView(g);
    else if (act === 'approve') approverDecide(g, true);
    else if (act === 'areject') approverDecide(g, false);
    else if (act === 'toreject') { st(g.groupId).status = 'reject'; saveItems(); render(); showToast('Status Diubah', g.groupId + ' → Reject.'); writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ganti status ke Reject ' + g.groupId); }
}

function closeKebab() { var m = document.getElementById('asKebabMenu'); m.classList.remove('show'); m.style.display = 'none'; m.innerHTML = ''; }
function openKebab(btn, g) {
    var m = document.getElementById('asKebabMenu');
    m.innerHTML = actionMenuItems().map(function (it) { return '<button class="dropdown-item" data-act="' + it[0] + '" style="width:100%;text-align:left;">' + it[1] + '</button>'; }).join('');
    m.style.display = 'block'; m.classList.add('show');
    var rect = btn.getBoundingClientRect();
    var mw = 200;
    m.style.left = Math.max(8, Math.min(rect.right - mw, window.innerWidth - mw - 8)) + 'px';
    m.style.top = (rect.bottom + 4) + 'px';
    m.querySelectorAll('.dropdown-item').forEach(function (b) { b.addEventListener('click', function () { closeKebab(); runAction(b.dataset.act, g); }); });
}

function onTableClick(e) {
    var d = e.target.closest('[data-detail]');
    if (d) { var g = groupById(d.dataset.id); if (g) showSettlementDetail(g); return; }
    var k = e.target.closest('.as-kebab');
    if (k) { var g2 = groupById(k.dataset.id); if (g2) openKebab(k, g2); return; }
}

// ── filter panel + init ──
function syncFilterInputs() {
    document.getElementById('asFilterStart').value = filters.start || '';
    document.getElementById('asFilterEnd').value = filters.end || '';
    document.getElementById('asFilterBig').checked = !!filters.big;
    document.querySelectorAll('.as-fbank').forEach(function (cb) { cb.checked = filters.banks.has(cb.value); });
    document.getElementById('asFilterReq').value = filters.req || '';
    document.getElementById('asFilterReqSection').style.display = (activeTab === 'pending') ? 'block' : 'none';
}
function applyFilterPanel() {
    filters.start = document.getElementById('asFilterStart').value;
    filters.end = document.getElementById('asFilterEnd').value;
    filters.big = document.getElementById('asFilterBig').checked;
    filters.banks = new Set(Array.from(document.querySelectorAll('.as-fbank:checked')).map(function (c) { return c.value; }));
    filters.req = (activeTab === 'pending') ? document.getElementById('asFilterReq').value : '';
    page = 1; render();
    document.getElementById('asFilterPanel').style.display = 'none';
}
function clearFilterPanel() { filters = defaultFilters(); syncFilterInputs(); page = 1; render(); }
function resetForTab() {
    filters = defaultFilters(); searchTerm = ''; bulkMode = false;
    var s = document.getElementById('asSearch'); if (s) s.value = '';
    syncFilterInputs();
    document.getElementById('asFilterPanel').style.display = 'none';
}

function bind() {
    document.querySelectorAll('.as-tab').forEach(function (t) {
        t.addEventListener('click', function () {
            activeTab = t.dataset.tab === 'approver' ? 'pending' : t.dataset.tab;
            page = 1; selected.clear(); resetForTab(); render();
        });
    });
    function doSearch() { searchTerm = document.getElementById('asSearch').value.trim(); page = 1; renderTable(); }
    document.getElementById('asSearchBtn').addEventListener('click', doSearch);
    document.getElementById('asSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    document.getElementById('asExportBtn').addEventListener('click', exportTab);
    document.getElementById('asBulkSettle').addEventListener('click', openBulkSettle);
    document.getElementById('asUnselectAll').addEventListener('click', function () { selected.clear(); render(); });
    document.getElementById('asTableBody').addEventListener('click', onTableClick);
    document.getElementById('asModalClose').addEventListener('click', closeModal);
    document.getElementById('asModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    document.getElementById('asExportClose').addEventListener('click', function () { document.getElementById('asExportModal').classList.remove('show'); document.body.style.overflow = 'auto'; });
    document.getElementById('asExportModal').addEventListener('click', function (e) { if (e.target === this) { this.classList.remove('show'); document.body.style.overflow = 'auto'; } });

    document.getElementById('asFilterBtn').addEventListener('click', function (e) {
        e.stopPropagation();
        var p = document.getElementById('asFilterPanel');
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('asFilterApply').addEventListener('click', applyFilterPanel);
    document.getElementById('asFilterClear').addEventListener('click', clearFilterPanel);
    document.getElementById('asFilterPanel').addEventListener('click', function (e) { e.stopPropagation(); });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.as-kebab') && !e.target.closest('#asKebabMenu')) closeKebab();
        if (!e.target.closest('#asFilterBtn') && !e.target.closest('#asFilterPanel')) document.getElementById('asFilterPanel').style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadItems();
    loadPool();
    filters = defaultFilters();
    bind();
    syncFilterInputs();
    render();
});
