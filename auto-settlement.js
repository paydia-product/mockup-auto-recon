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
// Channel payment = bank tujuan transfer. Metode Transfer = mekanisme transfer.
var CHANNELS = ['BCA', 'BRI', 'Mandiri', 'NOBU', 'AGI', 'OCBC'];
var METODE_TRANSFER = ['BI-Fast', 'RTGS', 'Realtime Online', 'LLG'];
// Label request hold di tab Approver per cakupan.
var REQ_HOLD_LABEL = { all: 'Hold', partial: 'Hold Partial', min: 'Hold Dibawah Min. Transaksi' };
// Settle tab status system
var SETTLE_STATUS_LABEL = { pending: 'Pending', success: 'Success', fail: 'Fail', rejectbybank: 'Reject by Bank' };
var SETTLE_STATUS_COLOR = { pending: '#b45309', success: '#16a34a', fail: '#dc2626', rejectbybank: '#7c3aed' };
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
var simMode = null; // null | 'success' | 'pending' | 'fail' | 'rejectbybank' (settle tab simulation)

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
function defaultFilters() { return { start: todayISO(), end: todayISO(), banks: new Set(), big: false, small: false, req: '', settleStatuses: new Set(), metodeSettle: '', channel: '' }; }

function loadItems() { try { items = JSON.parse(localStorage.getItem('paydia_as_items')) || {}; } catch (e) { items = {}; } }
function saveItems() { localStorage.setItem('paydia_as_items', JSON.stringify(items)); }

// Splits = settlement pecahan hasil Hold Partial. Tiap split = subset MID dari 1 norek
// yang dicarve-out jadi settlement terpisah. Base group berisi sisa MID.
var splits = [];
function loadSplits() { try { splits = JSON.parse(localStorage.getItem('paydia_as_splits')) || []; } catch (e) { splits = []; } }
function saveSplits() { localStorage.setItem('paydia_as_splits', JSON.stringify(splits)); }

function st(id) {
    if (!items[id]) items[id] = { status: 'checker', adjPlus: 0, adjMinus: 0, note: '', request: null, channel: '', bukti: '', settleStatus: null, approvedTs: null, approvedBy: null, metodeSettlement: null };
    return items[id];
}

// 20 settlement seed — kondisi beragam untuk uji full flow.
// MID: [mid, merchant, [ [nominalSettle, tipeSettlement, adjPlus, adjMinus], ... ] ]
function seedRows() {
    var S = [
        // Single MID — bank core
        { norek: '8810000000001', bank: 'BCA', owner: 'PT Andalan Retail', mids: [['MID-A001', 'Toko Andalan', [[220000, 'Reguler Matched', 0, 0]]]] },
        { norek: '8810000000003', bank: 'MANDIRI', owner: 'CV Maju Jaya', mids: [['MID-C001', 'Warung Maju', [[340000, 'Reguler Matched', 0, 0]]]] },
        { norek: '8810000000005', bank: 'BRI', owner: 'Warung Bu Sri', mids: [['MID-E001', 'Warung Bu Sri', [[125000, 'Reguler Matched', 0, 0]]]] },
        { norek: '8810000000015', bank: 'MANDIRI', owner: 'Warteg Murah', mids: [['MID-O001', 'Warteg Murah', [[5000, 'Reguler Matched', 0, 0]]]] }, // core kecil → tetap Checker
        // Multi MID — bank core
        { norek: '8810000000002', bank: 'BCA', owner: 'PT Kopi Nusantara', mids: [
            ['MID-B001', 'Kopi Kenangan', [[180000, 'Reguler Matched', 0, 0]]],
            ['MID-B002', 'Janji Jiwa', [[155000, 'Reguler Matched', 0, 0]]],
            ['MID-B003', 'Roti Bakar 88', [[95000, 'Tambahan Matched', 0, 0]]]] },
        { norek: '8810000000006', bank: 'BRI', owner: 'PT Empat Outlet', mids: [
            ['MID-F001', 'Outlet Kota', [[210000, 'Reguler Matched', 0, 0]]],
            ['MID-F002', 'Outlet Barat', [[175000, 'Reguler Matched', 0, 0]]],
            ['MID-F003', 'Outlet Timur', [[130000, 'Tambahan Matched', 0, 0]]],
            ['MID-F004', 'Outlet Selatan', [[90000, 'Reguler Matched', 0, 0]]]] }, // 4 MID → uji Hold Partial
        { norek: '8810000000016', bank: 'BRI', owner: 'PT Dua Gerai', mids: [
            ['MID-P001', 'Gerai Utara', [[230000, 'Reguler Matched', 0, 0]]],
            ['MID-P002', 'Gerai Selatan', [[160000, 'Reguler Matched', 0, 0]]]] },
        { norek: '8810000000019', bank: 'BCA', owner: 'PT Empat Toko', mids: [
            ['MID-S001', 'Toko A', [[145000, 'Reguler Matched', 0, 0]]],
            ['MID-S002', 'Toko B', [[132000, 'Reguler Matched', 0, 0]]],
            ['MID-S003', 'Toko C', [[118000, 'Tambahan Matched', 0, 0]]],
            ['MID-S004', 'Toko D', [[99000, 'Reguler Matched', 0, 0]]]] },
        // Dispute (adjustment chargeback)
        { norek: '8810000000004', bank: 'MANDIRI', owner: 'PT Dua Merchant', mids: [
            ['MID-D001', 'Merchant Alpha', [[500000, 'Reguler Matched', 0, 0]]],
            ['MID-D002', 'Merchant Beta', [[0, 'Reguler Dispute', 0, 30000]]]] },
        { norek: '8810000000014', bank: 'BCA', owner: 'PT Dispute Ganda', mids: [
            ['MID-N001', 'Toko X', [[265000, 'Reguler Matched', 0, 0]]],
            ['MID-N002', 'Toko Y', [[0, 'Tambahan Dispute', 0, 12000], [0, 'Reguler Dispute', 9000, 0]]]] },
        { norek: '8810000000020', bank: 'MANDIRI', owner: 'PT Campur Dispute', mids: [
            ['MID-T001', 'Gerai Pusat', [[280000, 'Reguler Matched', 0, 0]]],
            ['MID-T002', 'Gerai Cabang', [[190000, 'Tambahan Matched', 0, 0]]],
            ['MID-T003', 'Gerai Online', [[0, 'Reguler Dispute', 0, 25000]]]] },
        // Bank Lainnya (non-core, admin Rp6.500)
        { norek: '6600000000008', bank: 'OCBC', owner: 'PT Cahaya Digital', mids: [['MID-H001', 'Cahaya Digital', [[520000, 'Reguler Matched', 0, 0]]]] },
        { norek: '6600000000009', bank: 'NOBU', owner: 'Sumber Rezeki', mids: [
            ['MID-I001', 'Gerai A', [[260000, 'Reguler Matched', 0, 0]]],
            ['MID-I002', 'Gerai B', [[140000, 'Tambahan Matched', 0, 0]]]] },
        { norek: '6600000000011', bank: 'BNI', owner: 'Apotek Sehat', mids: [['MID-K001', 'Apotek Sehat', [[175000, 'Reguler Matched', 0, 0]]]] },
        { norek: '6600000000012', bank: 'PERMATA', owner: 'PT Tiga Cabang', mids: [
            ['MID-L001', 'Cabang 1', [[320000, 'Reguler Matched', 0, 0]]],
            ['MID-L002', 'Cabang 2', [[210000, 'Reguler Matched', 0, 0]]],
            ['MID-L003', 'Cabang 3', [[0, 'Reguler Dispute', 18000, 0]]]] },
        { norek: '6600000000018', bank: 'JAGO', owner: 'Freelance Design', mids: [['MID-R001', 'Studio Kreatif', [[430000, 'Reguler Matched', 0, 0]]]] },
        // Auto-hold: non-core & total < Rp10.000
        { norek: '6600000000007', bank: 'OCBC', owner: 'Kios Pulsa Andi', mids: [['MID-G001', 'Kios Pulsa Andi', [[8500, 'Reguler Matched', 0, 0]]]] },
        { norek: '6600000000017', bank: 'CIMB', owner: 'Laundry Bersih', mids: [['MID-Q001', 'Laundry Bersih', [[9000, 'Reguler Matched', 0, 0]]]] },
        // Nominal besar (> Rp250 juta) untuk uji filter
        { norek: '6600000000010', bank: 'AGI', owner: 'PT Besar Sekali', mids: [['MID-J001', 'Distributor Besar', [[285000000, 'Reguler Matched', 0, 0]]]] },
        { norek: '8810000000013', bank: 'BCA', owner: 'PT Nominal Besar', mids: [['MID-M001', 'Grosir Nasional', [[300000000, 'Reguler Matched', 0, 0]]]] }
    ];
    var rows = [], seq = 40000;
    S.forEach(function (s) {
        s.mids.forEach(function (md) {
            md[2].forEach(function (t) {
                rows.push({ txId: 'TX-ACQ-' + (seq++), tanggal: '24-06-2026 09:40:00', merchantName: md[1], mid: md[0], bankCode: s.bank, bankAccount: s.norek, bankAccountName: s.owner, nominalSettle: t[0], tipeSettlement: t[1], adjPlus: t[2] || 0, adjMinus: t[3] || 0 });
            });
        });
    });
    return rows;
}

function loadPool() {
    var iso = todayISO();
    var disp = iso.split('-').reverse().join('-');
    var pad = function (x) { return String(x).padStart(2, '0'); };
    // Auto Settlement pakai 20 seed bersih (bukan data settle-recon) agar full-flow
    // testing tidak tertutup data lain; semua mengikuti aturan grouping per norek,
    // biaya admin bank Lainnya, auto-hold < Rp10.000, dan adjustment dispute.
    var src = seedRows();
    pool = src.map(function (r, i) {
        r.procISO = iso;
        r.procDisplay = disp + ' ' + pad(8 + Math.floor(i / 6)) + ':' + pad((i * 7) % 60) + ':00';
        return r;
    });
    buildGroups();
}

// Bangun 1 group settlement dari sekumpulan transaksi.
function makeGroup(id, norek, txns) {
    var g = { groupId: id, norek: norek, bank: txns[0].bankCode, namaRek: txns[0].bankAccountName,
        procISO: txns[0].procISO, procDisplay: txns[0].procDisplay, txns: txns, nominalAwal: 0, adjPlus: 0, adjMinus: 0,
        admin: isOther(txns[0].bankCode) ? ADMIN_FEE_OTHER : 0 };
    txns.forEach(function (t) { g.nominalAwal += t.nominalSettle; g.adjPlus += (t.adjPlus || 0); g.adjMinus += (t.adjMinus || 0); });
    return g;
}

// Group transaksi per NOMOR REKENING → 1 entry settlement.
// Hold Partial memecah sebagian MID jadi settlement terpisah (splits).
function buildGroups() {
    var byNorek = {};
    pool.forEach(function (t) { (byNorek[t.bankAccount] = byNorek[t.bankAccount] || []).push(t); });
    groups = [];
    Object.keys(byNorek).forEach(function (norek) {
        var txns = byNorek[norek];
        var mySplits = splits.filter(function (s) { return s.norek === norek; });
        var heldMids = {};
        mySplits.forEach(function (sp) {
            var stx = txns.filter(function (t) { return sp.mids.indexOf(t.mid) >= 0; });
            if (stx.length) { groups.push(makeGroup(sp.id, norek, stx)); }
            sp.mids.forEach(function (m) { heldMids[m] = true; });
        });
        var baseTx = txns.filter(function (t) { return !heldMids[t.mid]; });
        if (baseTx.length) { groups.push(makeGroup('STL-' + norek, norek, baseTx)); }
    });
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

// Ringkas transaksi dalam satu group settlement per MID (untuk List Settlement & picker Hold Partial).
function midSummary(g) {
    var map = {};
    g.txns.forEach(function (t) {
        if (!map[t.mid]) map[t.mid] = { mid: t.mid, merchant: t.merchantName, count: 0, total: 0, adjPlus: 0, adjMinus: 0, bankCode: t.bankCode, tipe: t.tipeSettlement };
        var m = map[t.mid];
        m.count++; m.total += t.nominalSettle; m.adjPlus += (t.adjPlus || 0); m.adjMinus += (t.adjMinus || 0);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
}

// Ringkas per MID + Tipe Settlement — transaksi dispute/chargeback dipisah dari yang normal.
function midTipeSummary(g) {
    var map = {};
    g.txns.forEach(function (t) {
        var key = t.mid + '||' + t.tipeSettlement;
        if (!map[key]) map[key] = { mid: t.mid, merchant: t.merchantName, tipe: t.tipeSettlement, count: 0, total: 0, adjPlus: 0, adjMinus: 0 };
        var m = map[key];
        m.count++; m.total += t.nominalSettle; m.adjPlus += (t.adjPlus || 0); m.adjMinus += (t.adjMinus || 0);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
}

// Displayed settle status, factoring in simMode overlay.
function displaySettleStatus(g) {
    if (simMode) return simMode;
    return st(g.groupId).settleStatus || 'pending';
}

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
        if (f.small && totalOf(g) >= AUTO_HOLD_MIN) return false;
        if (tab === 'pending' && f.req) {
            var rq = s.request || {};
            if (f.req === 'hold' && !(rq.type === 'hold' && rq.scope === 'all')) return false;
            if (f.req === 'holdpartial' && !(rq.type === 'hold' && rq.scope === 'partial')) return false;
            if (f.req === 'holdmin' && !(rq.type === 'hold' && rq.scope === 'min')) return false;
            if (f.req === 'reject' && rq.type !== 'reject') return false;
            if (f.req === 'settle' && rq.type !== 'settle') return false;
        }
        if (tab === 'settle') {
            var ds = displaySettleStatus(g);
            if (f.settleStatuses && f.settleStatuses.size > 0 && !f.settleStatuses.has(ds)) return false;
            if (f.metodeSettle && s.metodeSettlement !== f.metodeSettle) return false;
            if (f.channel && (s.channel || (s.request && s.request.channel) || '') !== f.channel) return false;
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
    // Export dihapus di tab Approver. Export Segregasi hanya di tab Settle.
    var exBtn = document.getElementById('asExportBtn');
    if (exBtn) exBtn.style.display = (activeTab === 'pending') ? 'none' : '';
    var segBtn = document.getElementById('asExportSegBtn');
    if (segBtn) segBtn.style.display = (activeTab === 'settle') ? '' : 'none';
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

function columnsFor(tab) {
    var cols = BASE_COLS.slice();
    if (tab === 'pending') cols.push('Request');
    if (tab === 'hold') cols.push('Alasan');
    if (tab === 'settle') cols.push('Channel Payment', 'Metode Settlement', 'Status');
    return cols;
}

function renderTable() {
    var thead = document.getElementById('asThead');
    var tbody = document.getElementById('asTableBody');
    var cols = columnsFor(activeTab);
    // Bulk mode only for checker/hold/reject — settle no longer has bulk.
    var hasCb = (activeTab === 'checker' || activeTab === 'hold' || activeTab === 'reject') && bulkMode;
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
        c += '<td style="min-width:150px;"><a class="as-link" data-detail="settle" data-id="' + g.groupId + '" style="font-family:monospace;font-size:0.78rem;white-space:normal;word-break:break-all;">' + esc(g.groupId) + '</a></td>';
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
            var lbl = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type === 'settle' ? 'Settle' : (rq.type === 'reject' ? 'Reject' : '-'));
            c += '<td><span class="as-req-badge" style="background:' + col + '22;color:' + col + ';white-space:normal;display:inline-block;line-height:1.3;">' + esc(lbl) + '</span></td>';
        }
        if (activeTab === 'hold') {
            var hr = s.request || {};
            c += '<td>' + esc(SCOPE_LABEL[hr.scope] || '-') + '</td>';
        }
        if (activeTab === 'settle') {
            c += '<td>' + esc(s.channel || (s.request && s.request.channel) || '-') + '</td>';
            c += '<td>' + esc(s.metodeSettlement || '-') + '</td>';
            var ds = displaySettleStatus(g);
            var ssColor = SETTLE_STATUS_COLOR[ds] || '#475569';
            c += '<td><span style="font-size:0.72rem;font-weight:700;border-radius:4px;padding:2px 8px;white-space:nowrap;display:inline-block;background:' + ssColor + '22;color:' + ssColor + ';">' + esc(SETTLE_STATUS_LABEL[ds] || ds) + '</span></td>';
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

function actionMenuItems(g) {
    if (activeTab === 'checker') return [['hold', 'Hold'], ['reject', 'Reject'], ['settle', 'Settle']];
    if (activeTab === 'hold') return [['reject', 'Reject'], ['settle', 'Settle'], ['catatan', 'Lihat Catatan']];
    if (activeTab === 'reject') return [['hold', 'Hold'], ['settle', 'Settle'], ['catatan', 'Lihat Catatan']];
    if (activeTab === 'settle') {
        var acts = [['detail', 'Lihat Detail']];
        // Reject by Bank hanya tersedia untuk item dengan Metode Settlement = Manual.
        if (g && st(g.groupId).metodeSettlement === 'Manual') acts.push(['rejectbybank_item', 'Reject by Bank']);
        return acts;
    }
    return [];
}
function actionButtons(g) {
    if (activeTab === 'pending') {
        return '<button class="as-approval-btn btn" data-id="' + g.groupId + '" style="margin:0;background:var(--primary);color:#fff;border:none;font-size:0.78rem;font-weight:600;padding:6px 14px;">Approval</button>';
    }
    if (actionMenuItems(g).length === 0) return '<span style="color:var(--text-muted);">—</span>';
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
    var bulkBtn = '<button class="btn" id="asBulkBtn" style="margin:0;background:' + (bulkMode ? 'var(--primary)' : '#1e293b') + ';color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-check-double"></i> ' + (bulkMode ? 'Tutup Bulk Settle' : 'Bulk Settle') + '</button>';
    if (activeTab === 'checker' || activeTab === 'hold' || activeTab === 'reject') {
        box.innerHTML = bulkBtn;
        document.getElementById('asBulkBtn').addEventListener('click', function () { bulkMode = !bulkMode; if (!bulkMode) selected.clear(); render(); });
    } else if (activeTab === 'settle') {
        // Settle tab: satu dropdown simulasi status (menggantikan banyak tombol).
        var simOpts = [['', 'Tanpa Simulasi'], ['success', 'Simulasi Sukses'], ['pending', 'Simulasi Pending'], ['fail', 'Simulasi Fail'], ['rejectbybank', 'Simulasi Reject by Bank']];
        box.innerHTML = '<label style="display:inline-flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:600;color:var(--text-secondary);">Simulasi Status:' +
            '<select id="asSimSelect" style="padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:0.8rem;font-weight:600;background:var(--card-bg);color:var(--text-primary);">' +
            simOpts.map(function (o) { return '<option value="' + o[0] + '"' + (simMode === (o[0] || null) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
            '</select></label>' +
            '<button class="btn" id="asRetryBtn" title="Retry Settlement dengan Metode Settlement Otomatis dan berstatus Gagal" style="margin:0 0 0 8px;background:#0ea5e9;color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-rotate-right"></i> Retry Settlement</button>';
        document.getElementById('asSimSelect').addEventListener('change', function () {
            simMode = this.value || null;
            render();
        });
        document.getElementById('asRetryBtn').addEventListener('click', openRetry);
    }
}

function renderBulkBar() {
    var bar = document.getElementById('asBulkBar');
    var bulkTabs = ['checker', 'hold', 'reject'];
    if (bulkTabs.indexOf(activeTab) === -1 || !bulkMode) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    document.getElementById('asBulkCount').textContent = selected.size;
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

// Bukti viewer popup (layer di atas modal). Mock: tampilkan sample-bukti.png.
function openBukti(name) {
    document.getElementById('asBuktiName').textContent = name || '';
    document.getElementById('asBuktiOverlay').classList.add('show');
}
function closeBukti() { document.getElementById('asBuktiOverlay').classList.remove('show'); }

// ── detail modal: ID Settlement ──
function tipeChip(t) {
    var cls = t.indexOf('Dispute') >= 0 ? (t.indexOf('Tambahan') >= 0 ? 'status-notes' : 'status-proses') : (t.indexOf('Tambahan') >= 0 ? 'status-dikembalikan' : 'status-sukses');
    return '<span class="status-badge ' + cls + '" style="font-size:0.62rem;white-space:normal;display:inline-block;line-height:1.25;">' + esc(t) + '</span>';
}
function detailBodyHTML(g) {
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var fields = kv('ID Settlement', '<span style="font-family:monospace;">' + esc(g.groupId) + '</span>') +
        kv('Tanggal Proses', esc(g.procDisplay)) + kv('Bank', esc(g.bank)) +
        kv('Nomor Rekening', esc(g.norek)) + kv('Nama Pemilik Rekening', esc(g.namaRek));
    var colg = '<colgroup>' + ['6%', '26%', '12%', '16%', '16%', '14%', '10%'].map(function (w) { return '<col style="width:' + w + ';">'; }).join('') + '</colgroup>';
    var thS = 'padding:8px 6px;word-break:keep-all;white-space:normal;';
    var thR = thS + 'text-align:right;';
    var thC = thS + 'text-align:center;';
    var listHead = '<tr><th style="' + thS + '">No</th><th style="' + thS + '">Merchant</th><th style="' + thC + '">Jumlah Transaksi</th>' +
        '<th style="' + thR + '">Nominal Settle (Rp)</th><th style="' + thR + '">Adjustment Chargeback (+)</th><th style="' + thR + '">Adjustment Chargeback (−)</th>' +
        '<th style="' + thS + '">Tipe Settlement</th></tr>';
    var wb = ' style="word-break:break-word;overflow-wrap:anywhere;"';
    var lines = midTipeSummary(g);
    var listBody = lines.map(function (m, i) {
        return '<tr><td' + wb + '>' + (i + 1) + '</td>' +
            '<td' + wb + '>' + esc(m.merchant) + '<div style="font-size:0.7rem;color:var(--text-muted);">' + esc(m.mid) + '</div></td>' +
            '<td style="text-align:center;">' + m.count + '</td>' +
            '<td style="text-align:right;font-variant-numeric:tabular-nums;word-break:break-word;">' + (m.total ? num(m.total) : '-') + '</td>' +
            '<td style="text-align:right;color:#16a34a;word-break:break-word;">' + (m.adjPlus ? '+' + num(m.adjPlus) : '-') + '</td>' +
            '<td style="text-align:right;color:#dc2626;word-break:break-word;">' + (m.adjMinus ? '−' + num(m.adjMinus) : '-') + '</td>' +
            '<td' + wb + '>' + tipeChip(m.tipe) + '</td></tr>';
    }).join('');
    var ringkas = '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:6px;">Ringkasan Settlement</div>' +
        kv('Nominal Awal', rupiah(g.nominalAwal)) + kv('Biaya Admin', g.admin ? '− ' + rupiah(g.admin) : '-') +
        kv('Adjustment Chargeback (+)', g.adjPlus ? '<span style="color:#16a34a;">+ ' + rupiah(g.adjPlus) + '</span>' : '-') +
        kv('Adjustment Chargeback (−)', g.adjMinus ? '<span style="color:#dc2626;">− ' + rupiah(g.adjMinus) + '</span>' : '-') +
        kv('Total Settle', '<b>' + rupiah(totalOf(g)) + '</b>');
    return fields + ringkas +
        '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:8px;">List Settlement <span style="font-weight:400;color:var(--text-muted);font-size:0.78rem;">(' + lines.length + ' entry · ' + g.txns.length + ' transaksi)</span></div>' +
        '<div style="overflow-y:auto;overflow-x:hidden;max-height:300px;"><table class="data-table" style="table-layout:fixed;width:100%;font-size:0.74rem;">' + colg + '<thead>' + listHead + '</thead><tbody>' + listBody + '</tbody></table></div>';
}
function showSettlementDetail(g) {
    openModal('Detail ID Settlement', detailBodyHTML(g), [{ label: 'Tutup', onClick: closeModal }], '880px');
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
    return '<div class="as-fld"><label>Channel Payment <span style="color:#ef4444;">*</span></label><select id="asChannel"><option value="">Pilih channel payment…</option>' + CHANNELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>';
}
function metodeField() {
    return '<div class="as-fld"><label>Metode Transfer <span style="color:#ef4444;">*</span></label><select id="asMetode"><option value="">Pilih metode transfer…</option>' + METODE_TRANSFER.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>';
}
function metodeSettlementField() {
    return '<div class="as-fld"><label>Metode Settlement <span style="color:#ef4444;">*</span></label>' +
        '<select id="asMetodeSettle"><option value="">Pilih metode settlement…</option><option value="Manual">Manual</option><option value="Otomatis">Otomatis</option></select>' +
        '<div id="asMetodeSettleNote" style="font-size:0.78rem;margin-top:6px;padding:6px 8px;border-radius:4px;display:none;"></div></div>';
}
// Validate channel + metode (keduanya wajib). Returns {channel, metode} or null.
function validateTransfer() {
    var ch = document.getElementById('asChannel').value;
    var mt = document.getElementById('asMetode').value;
    if (!ch) { showToast('Channel Wajib', 'Pilih Channel Payment.'); return null; }
    if (!mt) { showToast('Metode Wajib', 'Pilih Metode Transfer.'); return null; }
    return { channel: ch, metode: mt };
}

// ── checker actions (operate on the settlement GROUP) ──
function openHold(g) {
    var body = '<div class="as-fld"><label>Cakupan Hold</label>' +
        '<label style="font-weight:500;display:block;"><input type="radio" name="asHoldScope" value="all" checked> Hold Semua</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="partial"> Hold Partial (pilih MID)</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="min"> Hold Dibawah Min. Transaksi <span style="font-weight:400;color:var(--text-muted);">(hold seluruh settlement norek ini)</span></label></div>' +
        '<div class="as-fld" id="asPartialWrap" style="display:none;"><label>Pilih MID yang dihold <span style="font-weight:400;color:var(--text-muted);">(seluruh transaksi MID terpilih akan dihold)</span></label><div class="as-partial-list" id="asPartialList">' +
        midSummary(g).map(function (m, i) { return '<label><input type="checkbox" class="as-pp" value="' + esc(m.mid) + '" ' + (i === 0 ? 'checked' : '') + '> ' + esc(m.merchant) + ' · ' + esc(m.mid) + ' · ' + m.count + ' transaksi · ' + rupiah(m.total) + '</label>'; }).join('') +
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
        if (!picked.length) { showToast('Pilih MID', 'Pilih minimal satu MID untuk hold partial.'); return; }
    }
    var bk = validateBukti(scope === 'partial' ? 'Upload bukti wajib untuk Hold Partial.' : null);
    if (!bk) return;
    if (scope === 'partial') {
        // Pecah: MID yang dihold jadi settlement baru terpisah; sisa MID tetap di Checker.
        var seq = splits.filter(function (x) { return x.norek === g.norek; }).length + 1;
        var splitId = 'STL-' + g.norek + '-P' + seq;
        splits.push({ id: splitId, norek: g.norek, mids: picked, createdTs: todayProc() });
        items[splitId] = { status: 'pending', adjPlus: 0, adjMinus: 0, note: '', channel: '', bukti: '', settleStatus: null, approvedTs: null, approvedBy: null, metodeSettlement: null,
            request: { type: 'hold', scope: 'partial', partialMids: picked, prevStatus: 'checker', reason: reason, bukti: bk.name, ts: todayProc() } };
        saveSplits(); buildGroups(); closeModal(); render();
        showToast('Hold Partial Diajukan', 'Dibuat settlement baru ' + splitId + ' (' + picked.length + ' MID) menunggu approval. Sisa MID tetap di Checker.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Hold Partial (' + picked.join(', ') + ') dari ' + g.groupId + ' → settlement baru ' + splitId);
        return;
    }
    var s = st(g.groupId); var prev = s.status; s.status = 'pending';
    s.request = { type: 'hold', scope: scope, partialMids: picked, prevStatus: prev, reason: reason, bukti: bk.name, ts: todayProc() };
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
            var s = st(g.groupId); var prev = s.status; s.status = 'pending'; s.request = { type: 'reject', prevStatus: prev, reason: reason, bukti: bk.name, ts: todayProc() };
            saveItems(); closeModal(); render(); showToast('Reject Diajukan', 'Menunggu approval Approver.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Reject ' + g.groupId);
        } }
    ]);
}

function openSettle(g) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Settle <b>' + esc(g.groupId) + '</b> — ' + rupiah(totalOf(g)) + '.</p>' +
        metodeSettlementField() + channelField() + metodeField() + noteField(false) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Settle Transaksi', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ms = document.getElementById('asMetodeSettle').value;
            if (!ms) { showToast('Metode Wajib', 'Pilih Metode Settlement.'); return; }
            var tf = validateTransfer(); if (!tf) return;
            var bk = validateBukti(null); if (!bk) return;
            var s = st(g.groupId); var prev = s.status; s.status = 'pending';
            s.request = { type: 'settle', metodeSettlement: ms, channel: tf.channel, metode: tf.metode, prevStatus: prev, reason: document.getElementById('asReason').value.trim(), bukti: bk.name, ts: todayProc() };
            saveItems(); closeModal(); render();
            var msg = ms === 'Manual' ? 'Sistem hanya mencatat settlement (tidak kirim uang ke bank).' : 'Sistem mencatat settlement dan mengirim uang ke bank.';
            showToast('Settle Diajukan', msg);
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Settle ' + g.groupId + ' [' + ms + '] via ' + tf.channel + ' / ' + tf.metode);
        } }
    ]);
    // Note inline setelah modal terbuka
    var sel = document.getElementById('asMetodeSettle');
    var note = document.getElementById('asMetodeSettleNote');
    if (sel && note) {
        sel.addEventListener('change', function () {
            if (this.value === 'Manual') { note.textContent = 'Sistem hanya mencatat settlement, tidak mengirim uang ke bank.'; note.style.cssText += 'display:block;background:#fef3c7;color:#92400e;'; }
            else if (this.value === 'Otomatis') { note.textContent = 'Sistem mencatat settlement dan mengirim uang ke bank secara otomatis.'; note.style.cssText += 'display:block;background:#d1fae5;color:#065f46;'; }
            else { note.style.display = 'none'; }
        });
    }
}

function openBulkSettle() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk settle <b>' + selected.size + '</b> entry terpilih.</p>' + metodeSettlementField() + channelField() + metodeField();
    openModal('Bulk Settle', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ms = document.getElementById('asMetodeSettle').value;
            if (!ms) { showToast('Metode Wajib', 'Pilih Metode Settlement.'); return; }
            var tf = validateTransfer(); if (!tf) return;
            var ids = Array.from(selected);
            ids.forEach(function (id) { var s = st(id); var prev = s.status; s.status = 'pending'; s.request = { type: 'settle', metodeSettlement: ms, channel: tf.channel, metode: tf.metode, prevStatus: prev, reason: '', bukti: '', ts: todayProc() }; });
            selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Settle Diajukan', ids.length + ' entry menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Settle ' + ids.length + ' entry [' + ms + '] via ' + tf.channel + ' / ' + tf.metode);
        } }
    ]);
    // Note inline metode settlement (sama seperti settle single).
    var sel = document.getElementById('asMetodeSettle');
    var note = document.getElementById('asMetodeSettleNote');
    if (sel && note) {
        sel.addEventListener('change', function () {
            if (this.value === 'Manual') { note.textContent = 'Sistem hanya mencatat settlement, tidak mengirim uang ke bank.'; note.style.cssText += 'display:block;background:#fef3c7;color:#92400e;'; }
            else if (this.value === 'Otomatis') { note.textContent = 'Sistem mencatat settlement dan mengirim uang ke bank secara otomatis.'; note.style.cssText += 'display:block;background:#d1fae5;color:#065f46;'; }
            else { note.style.display = 'none'; }
        });
    }
}

// ── settle tab: Retry Settlement (Otomatis + Gagal) ──
function openRetry() {
    var body = '<div class="as-fld"><label>Tanggal Retry <span style="color:#ef4444;">*</span></label>' +
        '<input type="date" id="asRetryDate" value="' + todayISO() + '" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.85rem;"></div>' +
        '<p style="font-size:0.8rem;padding:8px 12px;background:#e0f2fe;color:#075985;border-radius:6px;margin:0;"><i class="fas fa-info-circle"></i> Retry Settlement untuk data dengan Metode Settlement <b>Otomatis</b> dan berstatus <b>Gagal</b> — mengirim ulang data ke bank.</p>';
    openModal('Retry Settlement', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Retry', style: 'background:#0ea5e9;color:#fff;border:none;padding:8px 20px;font-weight:600;', onClick: function () {
            var d = document.getElementById('asRetryDate').value;
            if (!d) { showToast('Tanggal Wajib', 'Pilih Tanggal Retry.'); return; }
            var targets = groups.filter(function (g) { var s = st(g.groupId); return s.status === 'settle' && s.metodeSettlement === 'Otomatis' && s.settleStatus === 'fail'; });
            targets.forEach(function (g) { st(g.groupId).settleStatus = 'pending'; });
            saveItems(); closeModal(); render();
            showToast('Retry Settlement', targets.length + ' transaksi gagal dikirim ulang ke bank.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Retry Settlement (Metode Otomatis, status Gagal) tanggal ' + d.split('-').reverse().join('-') + ' — ' + targets.length + ' transaksi dikirim ulang ke bank');
        } }
    ]);
}

// ── approver ──
function openApproverModal(g) {
    var s = st(g.groupId); var rq = s.request || {};
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var reqLabel = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type ? rq.type.charAt(0).toUpperCase() + rq.type.slice(1) : '-');
    var buktiVal = rq.bukti
        ? esc(rq.bukti) + ' <button type="button" id="asBuktiBtn" class="btn" style="margin-left:8px;padding:3px 12px;font-size:0.74rem;background:var(--primary);color:#fff;border:none;font-weight:600;">Lihat</button>'
        : '<span style="color:var(--text-muted);">tidak ada</span>';
    var reqSection = '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:6px;">Detail Request</div>' +
        kv('Tipe Request', esc(reqLabel)) +
        (rq.type === 'hold' && rq.scope === 'partial' && rq.partialMids ? kv('MID Dihold', esc(rq.partialMids.join(', '))) : '') +
        kv('Status Sebelumnya', esc(STATUS_LABEL[rq.prevStatus] || 'Checker')) +
        (rq.metodeSettlement ? kv('Metode Settlement', esc(rq.metodeSettlement)) : '') +
        kv('Channel Payment', esc(rq.channel || '-')) + kv('Metode Transfer', esc(rq.metode || '-')) +
        kv('Catatan', esc(rq.reason || '-')) + kv('Bukti', buktiVal) + kv('Waktu Diajukan', esc(rq.ts || '-'));
    openModal('Detail Request', detailBodyHTML(g) + reqSection, [
        { label: 'Cancel', onClick: closeModal },
        { label: 'Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { confirmApprover(g, false); } },
        { label: 'Approve', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { confirmApprover(g, true); } }
    ], '880px');
    var bb = document.getElementById('asBuktiBtn');
    if (bb) bb.addEventListener('click', function () { openBukti(rq.bukti); });
}
function confirmApprover(g, approve) {
    var verb = approve ? 'menyetujui' : 'menolak';
    var body = '<p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">Yakin ingin <b>' + verb + '</b> request untuk <b>' + esc(g.groupId) + '</b>?</p>';
    openModal(approve ? 'Konfirmasi Approve' : 'Konfirmasi Reject', body, [
        { label: 'Batal', onClick: function () { openApproverModal(g); } },
        { label: approve ? 'Ya, Approve' : 'Ya, Reject', style: 'background:' + (approve ? '#16a34a' : '#dc2626') + ';color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { approverDecide(g, approve); closeModal(); } }
    ]);
}
function approverDecide(g, approve) {
    var s = st(g.groupId); var rq = s.request || {};
    if (approve) {
        s.status = rq.type;
        if (rq.type === 'settle') {
            s.metodeSettlement = rq.metodeSettlement || 'Otomatis';
            s.channel = rq.channel || '';
            // Manual = tidak kirim ke bank, langsung Sukses. Otomatis = Pending (menunggu respons bank).
            s.settleStatus = (s.metodeSettlement === 'Manual') ? 'success' : 'pending';
        }
        s.approvedTs = todayProc();
        s.approvedBy = 'dion@paydia.id';
        showToast('Request Disetujui', g.groupId + ' → ' + (rq.type || '').toUpperCase() + '.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Approve ' + (rq.type || '') + ' ' + g.groupId);
    } else {
        var back = rq.prevStatus || 'checker';
        s.status = back; s.request = null;
        showToast('Request Ditolak', g.groupId + ' dikembalikan ke ' + (STATUS_LABEL[back] || back) + '.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject request ' + g.groupId);
    }
    saveItems(); render();
}

// ── settle tab: reject by bank (toolbar, kept for programmatic use) ──
function openRejectByBank() {
    var banks = ['BCA', 'Mandiri', 'BRI', 'Lainnya'];
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Ajukan reject seluruh entry <b>Settle</b> pada bank terpilih (perlu approval Approver).</p>' +
        '<div class="as-fld"><label>Bank</label><select id="asRbbBank">' + banks.map(function (b) {
            var n = groups.filter(function (g) { return st(g.groupId).status === 'settle' && bankGroup(g.bank) === b; }).length;
            return '<option value="' + b + '">' + b + ' (' + n + ' entry)</option>';
        }).join('') + '</select></div>';
    openModal('Reject by Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var b = document.getElementById('asRbbBank').value;
            var targets = groups.filter(function (g) { return st(g.groupId).status === 'settle' && bankGroup(g.bank) === b; });
            if (!targets.length) { showToast('Kosong', 'Tidak ada entry settle untuk bank ' + b + '.'); return; }
            targets.forEach(function (g) { var s = st(g.groupId); var prev = s.status; s.status = 'pending'; s.request = { type: 'reject', prevStatus: prev, reason: 'Reject by Bank ' + b, bukti: '', ts: todayProc() }; });
            saveItems(); closeModal(); render(); showToast('Reject Diajukan', targets.length + ' entry ' + b + ' menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Reject by Bank ' + b + ' (' + targets.length + ' entry)');
        } }
    ]);
}

// ── settle tab: per-row Reject by Bank (Manual only) ──
function openRejectByBankItem(g) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Tandai settlement <b>' + esc(g.groupId) + '</b> (' + esc(g.namaRek) + ') sebagai Reject by Bank.</p>' +
        '<p style="font-size:0.82rem;padding:8px 12px;background:#fef2f2;color:#dc2626;border-radius:6px;margin-bottom:14px;"><i class="fas fa-info-circle"></i> Metode Manual — settlement ditandai Reject by Bank tanpa pengiriman uang.</p>' +
        noteField(true) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Reject by Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Konfirmasi', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan Reject by Bank.'); return; }
            var bk = validateBukti(null); if (!bk) return;
            var s = st(g.groupId);
            s.settleStatus = 'rejectbybank';
            if (s.request) { s.request.reason = reason; if (bk.name) s.request.bukti = bk.name; }
            saveItems(); closeModal(); render();
            showToast('Reject by Bank', g.groupId + ' ditandai Reject by Bank.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject by Bank item ' + g.groupId + '\ncatatan : ' + reason + (bk.name ? '\nbukti : ' + bk.name : ''));
        } }
    ]);
}

// ── settle tab: Lihat Detail modal ──
var _expCnt = 0;
function expandSection(title, iconHtml, jsonContent, defaultExpanded) {
    var uid = 'asexp' + (++_expCnt);
    var bdr = defaultExpanded ? '1px solid #e2e8f0' : 'none';
    return '<div style="border:1px solid #e2e8f0;border-radius:8px;margin-top:12px;overflow:hidden;">' +
        '<div data-expid="' + uid + '" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:' + bdr + ';user-select:none;">' +
        '<span style="display:flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:700;color:#4f46e5;">' + iconHtml + title + '</span>' +
        '<i class="fas fa-chevron-' + (defaultExpanded ? 'up' : 'down') + '" id="ici_' + uid + '" style="font-size:0.75rem;color:var(--text-muted);"></i>' +
        '</div>' +
        '<div id="' + uid + '" style="display:' + (defaultExpanded ? 'block' : 'none') + ';padding:16px;background:#f8fafc;">' +
        '<pre style="margin:0;font-size:0.78rem;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:var(--text-primary);">' + esc(jsonContent) + '</pre>' +
        '</div></div>';
}
function setupExpanders(container) {
    (container || document).querySelectorAll('[data-expid]').forEach(function (h) {
        h.addEventListener('click', function () {
            var id = h.dataset.expid;
            var body = document.getElementById(id);
            var icon = document.getElementById('ici_' + id);
            if (!body) return;
            var wasOpen = body.style.display !== 'none';
            body.style.display = wasOpen ? 'none' : 'block';
            h.style.borderBottom = wasOpen ? 'none' : '1px solid #e2e8f0';
            if (icon) { icon.classList.toggle('fa-chevron-up', !wasOpen); icon.classList.toggle('fa-chevron-down', wasOpen); }
        });
    });
}
function mockReqJson(g) {
    var s = st(g.groupId); var rq = s.request || {};
    return JSON.stringify({
        settlement_id: g.groupId,
        nominal: totalOf(g),
        bank_code: g.bank,
        account_number: g.norek,
        account_name: g.namaRek,
        channel_payment: rq.channel || '-',
        transfer_method: rq.metode || '-',
        metode_settlement: s.metodeSettlement || '-'
    }, null, 2);
}
function mockResJson(g) {
    var ds = displaySettleStatus(g);
    if (ds === 'success') return JSON.stringify({ status: true, data: { transaction_id: 'TRX-' + g.groupId.replace('STL-', ''), status: 'success', message: 'Transfer berhasil diproses.' } }, null, 2);
    // Fail = gagal by sistem (timeout / server bank bermasalah). Request bisa timeout, atau sudah kekirim ke bank tapi dapat respon gagal.
    if (ds === 'fail') return JSON.stringify({ status: false, error: { type: 'error.system', code: 'GATEWAY_TIMEOUT', message: 'Gagal oleh sistem: request timeout / server bank tujuan bermasalah.' } }, null, 2);
    // Reject by Bank = request sudah kekirim ke bank tapi dapat balikan ditolak (norek tidak terdaftar / dibekukan).
    if (ds === 'rejectbybank') return JSON.stringify({ status: false, error: { type: 'error.bank', code: 'REJECTED_BY_BANK', message: 'Ditolak oleh bank: nomor rekening tidak terdaftar / rekening dibekukan.' } }, null, 2);
    // Pending: belum ada respons dari bank → response data kosong.
    return '';
}
function openDetailModal(g) {
    var s = st(g.groupId); var rq = s.request || {};
    var ds = displaySettleStatus(g);
    var ssColor = SETTLE_STATUS_COLOR[ds] || '#475569';
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var buktiVal = rq.bukti
        ? '<button type="button" id="asBuktiBtn" class="btn" style="padding:3px 12px;font-size:0.74rem;background:var(--primary);color:#fff;border:none;font-weight:600;">Lihat</button>'
        : '<span style="color:var(--text-muted);">tidak ada</span>';
    var body =
        kv('Status', '<span style="font-weight:700;color:' + ssColor + ';">' + esc(SETTLE_STATUS_LABEL[ds] || ds) + '</span>') +
        kv('Metode Settlement', esc(s.metodeSettlement || '-')) +
        kv('Channel Payment', esc(s.channel || rq.channel || '-')) +
        kv('Metode Transfer', esc(rq.metode || '-')) +
        kv('Catatan', rq.reason ? '<span style="white-space:pre-wrap;">' + esc(rq.reason) + '</span>' : '<span style="color:var(--text-muted);">-</span>') +
        kv('Bukti', buktiVal) +
        kv('Waktu Diajukan', esc(rq.ts || '-')) +
        kv('Waktu Disetujui', esc(s.approvedTs || '-')) +
        kv('Disetujui Oleh', esc(s.approvedBy || '-')) +
        // Metode Manual tidak mengirim apa pun ke luar → tanpa segmen Request/Response.
        (s.metodeSettlement === 'Manual' ? '' :
            expandSection('REQUEST DATA', '<span style="font-family:monospace;font-size:0.9rem;">&lt;&gt;</span> ', mockReqJson(g), false) +
            expandSection('RESPONSE DATA', '<span style="font-family:monospace;font-size:0.9rem;">{}</span> ', mockResJson(g), true));
    openModal('Lihat Detail', body, [{ label: 'Tutup', onClick: closeModal }]);
    setupExpanders(document.getElementById('asModalBody'));
    var bb = document.getElementById('asBuktiBtn');
    if (bb) bb.addEventListener('click', function () { openBukti(rq.bukti); });
}

// ── export current tab ──
var EXPORT_COLS = ['No', 'Tanggal Proses', 'ID Settlement', 'Nominal Awal', 'Admin', 'Adjustment Chargeback (+)', 'Adjustment Chargeback (-)', 'Total Settle', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

function exportCols() {
    if (activeTab === 'pending') return EXPORT_COLS.concat(['Request']);
    if (activeTab === 'hold') return EXPORT_COLS.concat(['Alasan', 'Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    if (activeTab === 'reject') return EXPORT_COLS.concat(['Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    if (activeTab === 'settle') return EXPORT_COLS.concat(['Channel Payment', 'Metode Transfer', 'Metode Settlement', 'Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    return EXPORT_COLS;
}

function exportRowData(rows) {
    return rows.map(function (g, i) {
        var row = [i + 1, g.procDisplay, g.groupId, g.nominalAwal, g.admin, g.adjPlus || 0, g.adjMinus || 0, totalOf(g), g.bank, g.norek, g.namaRek];
        var s = st(g.groupId); var rq = s.request || {};
        if (activeTab === 'pending') {
            var lbl = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type ? rq.type.charAt(0).toUpperCase() + rq.type.slice(1) : '-');
            row.push(lbl);
        } else if (activeTab === 'hold') {
            row.push(SCOPE_LABEL[rq.scope] || '-', rq.ts || '-', s.approvedTs || '-', s.approvedBy || '-', rq.reason || '-');
        } else if (activeTab === 'reject') {
            row.push(rq.ts || '-', s.approvedTs || '-', s.approvedBy || '-', rq.reason || '-');
        } else if (activeTab === 'settle') {
            row.push(s.channel || rq.channel || '-', rq.metode || '-', s.metodeSettlement || '-', rq.ts || '-', s.approvedTs || '-', s.approvedBy || '-', rq.reason || '-');
        }
        return row;
    });
}
function downloadCsv(data) {
    var e = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['Auto Settlement — Tab ' + STATUS_LABEL[activeTab], 'Generated By:,dion@paydia.id', '', exportCols().join(',')];
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
    document.getElementById('asExportHead').innerHTML = '<tr>' + exportCols().map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
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

// ── Export Segregasi per Bank ──
// Tabel dipisah per channel payment; nama tabel & kolom EXACT dari file
// "Sample Data Breakdown ... sheet 2606 REG". Isi tabel disimulasikan (random).
// Semua tabel dalam 1 sheet (di preview = satu tabel dengan section per channel).
var SEG_TABLES = [
    'A. VIA OCBC - BCA', 'B. VIA OCBC - BRI', 'C. VIA OCBC - MANDIRI, BNI, PERMATA, CIMB',
    'D. VIA OCBC - LAINNYA', 'F. VIA BCA', 'F. VIA BRI', 'G. VIA MANDIRI', 'H. AGI', 'I. NOBU',
    'J. VIA FASPAY', 'K. VIA PAYDIA BISNIS', 'Transaksi Crossborder', 'Transaksi Bug', 'Transaksi Fee Faspay'
];
var SEG_COLS = ['Total Settle', 'Nama Bank', 'Nomor rekening', 'Nama pemilik rekening', 'Keterangan'];
var SEG_BANKS = ['BCA', 'BRI', 'BANK MANDIRI', 'BNI', 'BANK PERMATA', 'BANK CIMB NIAGA/SYARIAH', 'BANK JAGO', 'BANK OCBC NISP', 'NOBU BANK', 'BANK ARTHA GRAHA', 'BANK MAYBANK INDONESIA'];
var SEG_OWNERS = ['PT MITRA BERSAMA', 'EDY KUSUMA', 'CICIH JUARSIH', 'PT DISTRIBUSI SUKSES MANDIRI', 'ANDI NAHDA', 'PT FOTO AJAIB INDONESIA', 'YOLANDA', 'Anastasia Soelistio', 'PT SUMBER MANDALA KARYA', 'Sigit Setyawan'];
function segRand(a) { return a[Math.floor(Math.random() * a.length)]; }
function segData() {
    return SEG_TABLES.map(function (title) {
        // Tabel K selalu berisi (2–5 baris); tabel lain 0–5 baris.
        var n = (title.indexOf('K.') === 0) ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 6);
        var rows = [], total = 0;
        for (var i = 0; i < n; i++) {
            var amt = Math.floor(Math.random() * 90000000) + 10000;
            total += amt;
            rows.push({ total: amt, bank: segRand(SEG_BANKS), norek: String(Math.floor(Math.random() * 8999999999) + 1000000000), owner: segRand(SEG_OWNERS), ket: '' });
        }
        return { title: title, rows: rows, total: total };
    });
}
// Rekap grand total setelah tabel K (format mengikuti sheet 2606 REG).
function segRecap(tables) {
    var grand = tables.reduce(function (s, t) { return s + t.total; }, 0);
    var adm = Math.floor(Math.random() * 150000) + 50000;   // dana admin
    var hold = Math.floor(Math.random() * 60000) + 10000;   // dana yang di-hold
    var diff = adm + hold;
    return { grand: grand, grand2: grand + diff, diff: diff, adm: adm, hold: hold };
}
var _segCache = null, _segDate = '', _segRecap = null;
function showSegregasiPreview(dateStr) {
    _segCache = segData(); _segDate = dateStr; _segRecap = segRecap(_segCache);
    document.getElementById('asExportSub').innerHTML = 'Simulasi hasil <b>Export Segregasi per Bank</b> — Tanggal ' + esc(dateStr) + '. Tabel dipisah per channel payment (semua dalam 1 sheet). Hanya memuat data dengan Metode Settlement <b>Manual</b>.';
    document.getElementById('asExportHead').innerHTML = '<tr>' + SEG_COLS.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    var html = '';
    _segCache.forEach(function (t) {
        html += '<tr><td colspan="5" style="background:#eef2ff;color:#4f46e5;font-weight:700;padding:8px 10px;">' + esc(t.title) + '</td></tr>';
        t.rows.forEach(function (r) {
            html += '<tr><td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(r.total) + '</td><td>' + esc(r.bank) + '</td><td style="font-variant-numeric:tabular-nums;">' + esc(r.norek) + '</td><td>' + esc(r.owner) + '</td><td>' + esc(r.ket) + '</td></tr>';
        });
        html += '<tr><td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;border-top:2px solid #cbd5e1;">' + num(t.total) + '</td><td colspan="4" style="border-top:2px solid #cbd5e1;"></td></tr>';
        // Rekap grand total tepat setelah tabel K.
        if (t.title.indexOf('K.') === 0) {
            var rc = _segRecap;
            var rt = 'text-align:right;font-weight:700;font-variant-numeric:tabular-nums;';
            html += '<tr><td style="' + rt + '">' + num(rc.grand) + '</td><td style="font-weight:700;">Grand Total</td><td></td><td></td><td></td></tr>';
            html += '<tr><td style="' + rt + 'border-bottom:2px solid #334155;">' + num(rc.grand2) + '</td><td style="border-bottom:2px solid #334155;"></td><td style="border-bottom:2px solid #334155;"></td><td style="border-bottom:2px solid #334155;"></td><td style="border-bottom:2px solid #334155;"></td></tr>';
            html += '<tr><td style="text-align:right;color:#dc2626;font-variant-numeric:tabular-nums;">(' + num(rc.diff) + ')</td><td>ok, by admin + dana yang di hold)</td><td style="font-weight:700;">Adm</td><td style="font-weight:700;">Hold</td><td style="font-weight:700;">Released HOLD</td></tr>';
            html += '<tr><td></td><td></td><td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(rc.adm) + '</td><td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(rc.hold) + '</td><td></td></tr>';
        }
    });
    document.getElementById('asExportBody').innerHTML = html;
    document.getElementById('asExportDownload').onclick = function () { downloadSegregasiCsv(); };
    document.getElementById('asExportModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function downloadSegregasiCsv() {
    var e = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['Export Segregasi per Bank', 'Tanggal:,' + _segDate, 'Generated By:,dion@paydia.id', '', SEG_COLS.join(',')];
    _segCache.forEach(function (t) {
        lines.push(e(t.title));
        t.rows.forEach(function (r) { lines.push([r.total, r.bank, r.norek, r.owner, r.ket].map(e).join(',')); });
        lines.push(e(t.total)); // baris total (hanya kolom Total Settle)
        if (t.title.indexOf('K.') === 0 && _segRecap) {
            var rc = _segRecap;
            lines.push([rc.grand, 'Grand Total'].map(e).join(','));
            lines.push(e(rc.grand2));
            lines.push([-rc.diff, 'ok, by admin + dana yang di hold)', 'Adm', 'Hold', 'Released HOLD'].map(e).join(','));
            lines.push(['', '', rc.adm, rc.hold, ''].map(e).join(','));
        }
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'Segregasi_per_Bank_' + (_segDate || '').replace(/\//g, '-') + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export Berhasil', 'Segregasi per Bank di-export.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Export Segregasi per Bank (' + _segDate + ')');
}
function openSegregasiModal() {
    var body = '<div class="as-fld"><label>Tanggal Export <span style="color:#ef4444;">*</span></label>' +
        '<input type="date" id="asSegDate" value="' + todayISO() + '" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.85rem;"></div>' +
        '<p style="font-size:0.8rem;padding:8px 12px;background:#eff6ff;color:#1d4ed8;border-radius:6px;margin:0;"><i class="fas fa-info-circle"></i> Export Segregasi hanya akan memuat data dengan Metode Settlement <b>Manual</b>.</p>';
    openModal('Export Segregasi per Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Export', style: 'background:#10b981;color:#fff;border:none;padding:8px 20px;font-weight:600;', onClick: function () {
            var d = document.getElementById('asSegDate').value;
            if (!d) { showToast('Tanggal Wajib', 'Pilih Tanggal Export.'); return; }
            var disp = d.split('-').reverse().join('/');
            closeModal();
            // Progress bar seperti export biasa, lalu tampilkan modal simulasi hasil.
            var wrap = document.getElementById('asExportProgress');
            var bar = document.getElementById('asProgressBar');
            var txt = document.getElementById('asProgressText');
            bar.style.width = '0%'; txt.textContent = 'Memproses… 0%'; wrap.style.display = 'flex';
            var pct = 0;
            var iv = setInterval(function () {
                pct += Math.floor(Math.random() * 14) + 6; if (pct > 100) pct = 100;
                bar.style.width = pct + '%'; txt.textContent = 'Memproses… ' + pct + '%';
                if (pct >= 100) { clearInterval(iv); setTimeout(function () { wrap.style.display = 'none'; showSegregasiPreview(disp); }, 350); }
            }, 180);
        } }
    ]);
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
    else if (act === 'catatan') openCatatanModal(g);
    else if (act === 'detail') openDetailModal(g);
    else if (act === 'rejectbybank_item') openRejectByBankItem(g);
}

function closeKebab() { var m = document.getElementById('asKebabMenu'); m.classList.remove('show'); m.style.display = 'none'; m.innerHTML = ''; }
function openKebab(btn, g) {
    var m = document.getElementById('asKebabMenu');
    m.innerHTML = actionMenuItems(g).map(function (it) { return '<button class="dropdown-item" data-act="' + it[0] + '" style="width:100%;text-align:left;">' + it[1] + '</button>'; }).join('');
    m.style.display = 'block'; m.classList.add('show');
    var rect = btn.getBoundingClientRect();
    var mw = 200;
    m.style.left = Math.max(8, Math.min(rect.right - mw, window.innerWidth - mw - 8)) + 'px';
    m.style.top = (rect.bottom + 4) + 'px';
    m.querySelectorAll('.dropdown-item').forEach(function (b) { b.addEventListener('click', function () { closeKebab(); runAction(b.dataset.act, g); }); });
}

// Modal Lihat Catatan (Hold / Reject tabs)
// - Tampilkan Waktu Disetujui di bawah Waktu Diajukan.
// - Bukti: tampilkan hanya tombol Lihat tanpa nama file.
function openCatatanModal(g) {
    var s = st(g.groupId); var rq = s.request || {};
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var reqLbl = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type ? rq.type.charAt(0).toUpperCase() + rq.type.slice(1) : '-');
    var buktiVal = rq.bukti
        ? '<button type="button" id="asBuktiBtn" class="btn" style="padding:3px 12px;font-size:0.74rem;background:var(--primary);color:#fff;border:none;font-weight:600;">Lihat</button>'
        : '<span style="color:var(--text-muted);">tidak ada</span>';
    // Tab hold: field "Tipe Request" jadi "Alasan". Tab reject: field dihapus.
    var reqLine = (activeTab === 'hold') ? kv('Alasan', esc(reqLbl)) : '';
    var body = kv('ID Settlement', '<span style="font-family:monospace;">' + esc(g.groupId) + '</span>') +
        reqLine +
        (rq.type === 'hold' && rq.scope === 'partial' && rq.partialMids ? kv('MID Dihold', esc(rq.partialMids.join(', '))) : '') +
        kv('Catatan', rq.reason ? '<span style="white-space:pre-wrap;">' + esc(rq.reason) + '</span>' : '<span style="color:var(--text-muted);">-</span>') +
        kv('Bukti', buktiVal) +
        kv('Waktu Diajukan', esc(rq.ts || '-')) +
        kv('Waktu Disetujui', esc(s.approvedTs || '-')) +
        kv('Disetujui Oleh', esc(s.approvedBy || '-'));
    openModal('Catatan & Bukti', body, [{ label: 'Tutup', onClick: closeModal }]);
    var bb = document.getElementById('asBuktiBtn');
    if (bb) bb.addEventListener('click', function () { openBukti(rq.bukti); });
}

function onTableClick(e) {
    var d = e.target.closest('[data-detail]');
    if (d) { var g = groupById(d.dataset.id); if (g) showSettlementDetail(g); return; }
    var ap = e.target.closest('.as-approval-btn');
    if (ap) { var g3 = groupById(ap.dataset.id); if (g3) openApproverModal(g3); return; }
    var k = e.target.closest('.as-kebab');
    if (k) { var g2 = groupById(k.dataset.id); if (g2) openKebab(k, g2); return; }
}

// ── filter panel + init ──
function syncFilterInputs() {
    document.getElementById('asFilterStart').value = filters.start || '';
    document.getElementById('asFilterEnd').value = filters.end || '';
    document.getElementById('asFilterBig').checked = !!filters.big;
    document.getElementById('asFilterSmall').checked = !!filters.small;
    document.querySelectorAll('.as-fbank').forEach(function (cb) { cb.checked = filters.banks.has(cb.value); });
    document.getElementById('asFilterReq').value = filters.req || '';
    document.getElementById('asFilterReqSection').style.display = (activeTab === 'pending') ? 'block' : 'none';
    // Settle-specific filters
    document.querySelectorAll('.as-fss').forEach(function (cb) { cb.checked = (filters.settleStatuses || new Set()).has(cb.value); });
    var metodeEl = document.getElementById('asFilterMetode');
    if (metodeEl) metodeEl.value = filters.metodeSettle || '';
    var channelEl = document.getElementById('asFilterChannel');
    if (channelEl) channelEl.value = filters.channel || '';
    var isSettle = activeTab === 'settle';
    var ssEl = document.getElementById('asFilterSettleStatus');
    var msEl = document.getElementById('asFilterMetodeSection');
    var chEl = document.getElementById('asFilterChannelSection');
    if (ssEl) ssEl.style.display = isSettle ? 'block' : 'none';
    if (msEl) msEl.style.display = isSettle ? 'block' : 'none';
    if (chEl) chEl.style.display = isSettle ? 'block' : 'none';
}
function applyFilterPanel() {
    filters.start = document.getElementById('asFilterStart').value;
    filters.end = document.getElementById('asFilterEnd').value;
    filters.big = document.getElementById('asFilterBig').checked;
    filters.small = document.getElementById('asFilterSmall').checked;
    filters.banks = new Set(Array.from(document.querySelectorAll('.as-fbank:checked')).map(function (c) { return c.value; }));
    filters.req = (activeTab === 'pending') ? document.getElementById('asFilterReq').value : '';
    filters.settleStatuses = new Set(Array.from(document.querySelectorAll('.as-fss:checked')).map(function (c) { return c.value; }));
    var metodeEl = document.getElementById('asFilterMetode');
    filters.metodeSettle = metodeEl ? metodeEl.value : '';
    var channelEl = document.getElementById('asFilterChannel');
    filters.channel = channelEl ? channelEl.value : '';
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
    var segBtn = document.getElementById('asExportSegBtn');
    if (segBtn) segBtn.addEventListener('click', openSegregasiModal);
    document.getElementById('asBulkSettle').addEventListener('click', openBulkSettle);
    document.getElementById('asUnselectAll').addEventListener('click', function () { selected.clear(); render(); });
    document.getElementById('asTableBody').addEventListener('click', onTableClick);
    document.getElementById('asModalClose').addEventListener('click', closeModal);
    document.getElementById('asModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    document.getElementById('asBuktiClose').addEventListener('click', closeBukti);
    document.getElementById('asBuktiOverlay').addEventListener('click', function (e) { if (e.target === this) closeBukti(); });
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
    // Reset ke seed bersih sekali saat versi seed berubah (normalisasi data lama).
    var SEED_VER = '2026-07-01-seed20-clean';
    if (localStorage.getItem('paydia_as_seedver') !== SEED_VER) {
        localStorage.removeItem('paydia_as_items');
        localStorage.removeItem('paydia_as_splits');
        localStorage.setItem('paydia_as_seedver', SEED_VER);
    }
    loadItems();
    loadSplits();
    loadPool();
    filters = defaultFilters();
    bind();
    syncFilterInputs();
    render();
});
