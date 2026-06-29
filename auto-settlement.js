/* ===================================================
   Paydia Bisnis – Auto Settlement (tabbed workflow)
   Modul TERPISAH dari Auto Recon.
   Tabs: Checker → Approver → (Hold | Reject | Settle).
   Checker mengajukan aksi (hold/reject/settle) → Approver
   menyetujui/menolak → item masuk tab Hold/Reject/Settle.
   Mock front-end only: upload bukti = nama file saja, no backend.
   =================================================== */

var CORE_BANKS = ['BCA', 'BRI', 'MANDIRI'];
var ADMIN_FEE_OTHER = 6500;
var CHANNELS = ['BI-FAST', 'SKN', 'RTGS', 'Internal Transfer'];
var PER_PAGE = 10;

// Base columns shared by every tab (in order).
var BASE_COLS = ['No', 'Tanggal Proses', 'ID Transaksi', 'Merchant', 'Nominal Awal', 'Admin',
    'Adj. CB (+)', 'Adj. CB (−)', 'Total Settle', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

var STATUS_LABEL = { checker: 'Checker', pending: 'Approver', hold: 'Hold', reject: 'Reject', settle: 'Settle' };

var pool = [];        // immutable transaction facts
var items = {};       // per-txId mutable state
var activeTab = 'checker';
var page = 1;
var selected = new Set();
var searchTerm = '';
var bankFilter = '';

// ── helpers ──
var rupiah = function (n) { return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }); };
var esc = function (v) { v = String(v == null ? '' : v); return v.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
var isOther = function (b) { return CORE_BANKS.indexOf(String(b).toUpperCase()) === -1; };
var bankGroup = function (b) { return isOther(b) ? 'Lainnya' : String(b).toUpperCase().replace('MANDIRI', 'Mandiri'); };
var todayProc = function () { var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };

function loadItems() { try { items = JSON.parse(localStorage.getItem('paydia_as_items')) || {}; } catch (e) { items = {}; } }
function saveItems() { localStorage.setItem('paydia_as_items', JSON.stringify(items)); }

function st(txId) {
    if (!items[txId]) items[txId] = { status: 'checker', adjPlus: 0, adjMinus: 0, note: '', request: null, channel: '', bukti: '' };
    return items[txId];
}

function loadPool() {
    var db = [];
    try { db = JSON.parse(localStorage.getItem('paydia_settlements')) || []; } catch (e) { db = []; }
    pool = db.map(function (r) {
        return {
            txId: r.txId, tanggal: r.tanggal, merchantName: r.merchantName, mid: r.merchantCode,
            bankCode: r.bankCode, bankAccount: r.bankAccount, bankAccountName: r.bankAccountName,
            nominalAwal: Number(r.nominalSettle) || 0, admin: isOther(r.bankCode) ? ADMIN_FEE_OTHER : 0
        };
    });
    pool.forEach(function (r) { st(r.txId); }); // ensure state exists
    saveItems();
}

function totalOf(r) { var s = st(r.txId); return r.nominalAwal - r.admin + (s.adjPlus || 0) - (s.adjMinus || 0); }
function rowByTx(txId) { return pool.find(function (r) { return r.txId === txId; }); }

// ── filtering ──
function tabRows(tab) {
    return pool.filter(function (r) {
        var s = st(r.txId);
        if (s.status !== tab) return false;
        if (bankFilter && bankGroup(r.bankCode) !== bankFilter) return false;
        if (searchTerm) {
            var hay = (r.txId + ' ' + r.merchantName + ' ' + r.mid + ' ' + r.bankAccount + ' ' + r.bankAccountName).toLowerCase();
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
        if (el) el.textContent = pool.filter(function (r) { return st(r.txId).status === tab; }).length;
    });
}

function renderTabsActive() {
    document.querySelectorAll('.as-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === uiTab());
    });
}
// activeTab uses status names; the "approver" tab maps to status 'pending'
function uiTab() { return activeTab === 'pending' ? 'approver' : activeTab; }

function columnsFor(tab) {
    var cols = BASE_COLS.slice();
    if (tab === 'pending') cols.push('Request');
    return cols;
}

function renderTable() {
    var thead = document.getElementById('asThead');
    var tbody = document.getElementById('asTableBody');
    var cols = columnsFor(activeTab);
    var hasCb = activeTab === 'checker';
    var headHtml = '<tr>';
    if (hasCb) headHtml += '<th style="width:38px;text-align:center;"><input type="checkbox" id="asSelectAll"></th>';
    cols.forEach(function (c, i) {
        var align = (c.indexOf('Nominal') >= 0 || c.indexOf('Admin') >= 0 || c.indexOf('Adj') >= 0 || c.indexOf('Total') >= 0) ? ' style="text-align:right;"' : '';
        headHtml += '<th' + align + '>' + c + '</th>';
    });
    headHtml += '<th style="text-align:center;width:120px;">Aksi</th></tr>';
    thead.innerHTML = headHtml;

    var rows = tabRows(activeTab);
    var totalSpan = cols.length + 1 + (hasCb ? 1 : 0);
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="' + totalSpan + '" style="text-align:center;padding:36px;color:var(--text-muted);">Tidak ada data</td></tr>';
        renderPager(0);
        return;
    }
    var pages = Math.ceil(rows.length / PER_PAGE);
    if (page > pages) page = pages;
    var slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    tbody.innerHTML = slice.map(function (r, idx) {
        var s = st(r.txId);
        var no = (page - 1) * PER_PAGE + idx + 1;
        var c = '<tr>';
        if (hasCb) c += '<td style="text-align:center;"><input type="checkbox" class="as-cb" data-id="' + r.txId + '" ' + (selected.has(r.txId) ? 'checked' : '') + '></td>';
        c += '<td>' + no + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(r.tanggal) + '</td>';
        c += '<td><a class="as-link" data-detail="trx" data-id="' + r.txId + '" style="font-family:monospace;font-size:0.8rem;">' + esc(r.txId.slice(0, 12)) + '…</a></td>';
        c += '<td><a class="as-link" data-detail="merchant" data-id="' + r.txId + '">' + esc(r.merchantName) + '</a><div style="font-size:0.72rem;color:var(--text-muted);">' + esc(r.mid) + '</div></td>';
        c += '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + rupiah(r.nominalAwal) + '</td>';
        c += '<td style="text-align:right;">' + (r.admin ? rupiah(r.admin) : '-') + '</td>';
        c += '<td style="text-align:right;color:#16a34a;">' + (s.adjPlus ? '+' + rupiah(s.adjPlus) : '-') + '</td>';
        c += '<td style="text-align:right;color:#dc2626;">' + (s.adjMinus ? '−' + rupiah(s.adjMinus) : '-') + '</td>';
        c += '<td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">' + rupiah(totalOf(r)) + '</td>';
        c += '<td>' + esc(r.bankCode) + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(r.bankAccount) + '</td>';
        c += '<td>' + esc(r.bankAccountName) + '</td>';
        if (activeTab === 'pending') {
            var rq = s.request || {};
            var col = rq.type === 'settle' ? '#16a34a' : (rq.type === 'reject' ? '#dc2626' : '#b45309');
            c += '<td><span class="as-req-badge" style="background:' + col + '22;color:' + col + ';">' + (rq.type ? rq.type.toUpperCase() : '-') + '</span></td>';
        }
        c += '<td style="text-align:center;white-space:nowrap;">' + actionButtons(r) + '</td>';
        c += '</tr>';
        return c;
    }).join('');

    // wire checkboxes
    if (hasCb) {
        var all = document.getElementById('asSelectAll');
        if (all) all.addEventListener('change', function () {
            slice.forEach(function (r) { this.checked ? selected.add(r.txId) : selected.delete(r.txId); }, all);
            render();
        });
        tbody.querySelectorAll('.as-cb').forEach(function (cb) {
            cb.addEventListener('change', function () { cb.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id); renderBulkBar(); });
        });
    }
    renderPager(rows.length);
}

function btn(act, id, icon, title, color) {
    return '<button class="as-iact" data-act="' + act + '" data-id="' + id + '" title="' + title + '" style="background:none;border:none;cursor:pointer;color:' + color + ';font-size:0.95rem;padding:4px 6px;"><i class="fas ' + icon + '"></i></button>';
}
function actionButtons(r) {
    var id = r.txId;
    if (activeTab === 'checker') return btn('hold', id, 'fa-pause', 'Hold', '#b45309') + btn('reject', id, 'fa-ban', 'Reject', '#dc2626') + btn('settle', id, 'fa-circle-check', 'Settle', '#16a34a') + btn('note', id, 'fa-note-sticky', 'Lihat/Edit Catatan', '#6366f1');
    if (activeTab === 'pending') return btn('approve', id, 'fa-check', 'Approve', '#16a34a') + btn('areject', id, 'fa-xmark', 'Reject', '#dc2626') + btn('view', id, 'fa-eye', 'Lihat Catatan & Bukti', '#6366f1');
    if (activeTab === 'settle') return btn('toreject', id, 'fa-rotate-left', 'Ganti Status → Reject', '#dc2626') + btn('note', id, 'fa-note-sticky', 'Lihat Catatan', '#6366f1');
    return btn('note', id, 'fa-note-sticky', 'Lihat Catatan', '#6366f1'); // hold, reject
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
    if (activeTab === 'settle') box.innerHTML = '<button class="btn" id="asRejectByBank" style="margin:0;background:#dc2626;color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-building-columns"></i> Reject by Bank</button>';
    else box.innerHTML = '';
    var rbb = document.getElementById('asRejectByBank');
    if (rbb) rbb.addEventListener('click', openRejectByBank);
}

function renderBulkBar() {
    var bar = document.getElementById('asBulkBar');
    if (activeTab !== 'checker' || selected.size === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    document.getElementById('asBulkCount').textContent = selected.size;
}

// ── generic modal ──
function openModal(title, bodyHTML, footer) {
    document.getElementById('asModalTitle').innerHTML = title;
    document.getElementById('asModalBody').innerHTML = bodyHTML;
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

var BTN_PRIMARY = 'background:var(--primary);color:#fff;border:none;padding:8px 16px;font-weight:600;';
var BTN_CANCEL = '';

// ── detail modals ──
function showTrxDetail(r) {
    var s = st(r.txId);
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var body = kv('ID Transaksi', '<span style="font-family:monospace;">' + esc(r.txId) + '</span>') + kv('Tanggal Proses', esc(r.tanggal)) +
        kv('MID', esc(r.mid)) + kv('Merchant', esc(r.merchantName)) + kv('Bank', esc(r.bankCode)) +
        kv('Nomor Rekening', esc(r.bankAccount)) + kv('Nama Pemilik', esc(r.bankAccountName)) +
        kv('Nominal Awal', rupiah(r.nominalAwal)) + kv('Biaya Admin', rupiah(r.admin)) +
        kv('Adj. CB (+)', rupiah(s.adjPlus)) + kv('Adj. CB (−)', rupiah(s.adjMinus)) +
        kv('Total Settle', '<b>' + rupiah(totalOf(r)) + '</b>') + kv('Status', STATUS_LABEL[s.status] || s.status);
    openModal('Detail Transaksi', body, [{ label: 'Tutup', onClick: closeModal }]);
}
function showMerchantDetail(r) {
    var txs = pool.filter(function (x) { return x.mid === r.mid; });
    var totN = txs.reduce(function (a, x) { return a + x.nominalAwal; }, 0);
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var body = kv('Nama Merchant', esc(r.merchantName)) + kv('MID', esc(r.mid)) + kv('Bank', esc(r.bankCode)) +
        kv('Nomor Rekening', esc(r.bankAccount)) + kv('Nama Pemilik', esc(r.bankAccountName)) +
        kv('Jumlah Transaksi', txs.length) + kv('Total Nominal', rupiah(totN));
    openModal('Detail Merchant', body, [{ label: 'Tutup', onClick: closeModal }]);
}

// ── note ──
function openNote(r) {
    var s = st(r.txId);
    var editable = s.status === 'checker';
    var body = '<div class="as-fld"><label>Catatan ' + esc(r.merchantName) + '</label>' +
        '<textarea id="asNoteTxt" rows="4" ' + (editable ? '' : 'readonly') + ' placeholder="Belum ada catatan…">' + esc(s.note || '') + '</textarea></div>';
    var footer = [{ label: 'Tutup', onClick: closeModal }];
    if (editable) footer.push({ label: 'Simpan', style: BTN_PRIMARY, onClick: function () { s.note = document.getElementById('asNoteTxt').value.trim(); saveItems(); closeModal(); showToast('Catatan Disimpan', 'Catatan diperbarui.'); writeLog('auto-settlement', 'email : dion@paydia.id\naction : Edit catatan ' + r.merchantName); } });
    openModal(editable ? 'Lihat / Edit Catatan' : 'Catatan', body, footer);
}

// ── checker actions ──
function fileField(label, required) {
    return '<div class="as-fld"><label>Upload Bukti' + (required ? ' <span style="color:#ef4444;">*</span>' : ' (opsional)') + '</label>' +
        '<input type="file" id="asBukti" style="font-size:0.82rem;"></div>';
}
function noteField(required) {
    return '<div class="as-fld"><label>Catatan' + (required ? ' <span style="color:#ef4444;">*</span>' : ' (opsional)') + '</label><textarea id="asReason" rows="3" placeholder="Tulis catatan…"></textarea></div>';
}
function buktiName() { var f = document.getElementById('asBukti'); return (f && f.files && f.files[0]) ? f.files[0].name : ''; }

function openHold(r) {
    var merch = pool.filter(function (x) { return x.mid === r.mid && st(x.txId).status === 'checker'; });
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Hold transaksi merchant <b>' + esc(r.merchantName) + '</b>.</p>' +
        '<div class="as-fld"><label>Cakupan Hold</label>' +
        '<label style="font-weight:500;display:block;"><input type="radio" name="asHoldScope" value="all" checked> Hold Semua (' + merch.length + ' transaksi)</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="partial"> Hold Partial (pilih MID)</label></div>' +
        '<div class="as-fld" id="asPartialWrap" style="display:none;"><label>Pilih transaksi yang dihold</label><div class="as-partial-list" id="asPartialList">' +
        merch.map(function (x) { return '<label><input type="checkbox" class="as-pp" value="' + x.txId + '" ' + (x.txId === r.txId ? 'checked' : '') + '> ' + esc(x.mid) + ' · ' + esc(x.tanggal) + ' · ' + rupiah(x.nominalAwal) + '</label>'; }).join('') +
        '</div></div>' + noteField(true) + fileField('bukti', false);
    openModal('Hold Settlement', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Hold', style: 'background:#b45309;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { submitHold(r, merch); } }
    ]);
    document.querySelectorAll('input[name=asHoldScope]').forEach(function (rb) {
        rb.addEventListener('change', function () { document.getElementById('asPartialWrap').style.display = (this.value === 'partial') ? 'block' : 'none'; });
    });
}
function submitHold(r, merch) {
    var scope = document.querySelector('input[name=asHoldScope]:checked').value;
    var reason = document.getElementById('asReason').value.trim();
    if (!reason) { showToast('Catatan Wajib', 'Isi catatan hold.'); return; }
    var targets;
    if (scope === 'partial') {
        var picked = Array.from(document.querySelectorAll('.as-pp:checked')).map(function (c) { return c.value; });
        if (!picked.length) { showToast('Pilih MID', 'Pilih minimal satu transaksi untuk hold partial.'); return; }
        targets = picked;
    } else targets = merch.map(function (x) { return x.txId; });
    var bukti = buktiName();
    targets.forEach(function (id) { var s = st(id); s.status = 'pending'; s.request = { type: 'hold', scope: scope, reason: reason, bukti: bukti, ts: todayProc() }; });
    saveItems(); closeModal(); render();
    showToast('Hold Diajukan', targets.length + ' transaksi menunggu approval Approver.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Hold (' + scope + ') ' + targets.length + ' transaksi ' + r.merchantName);
}

function openReject(r) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Reject settlement <b>' + esc(r.merchantName) + '</b>.</p>' + noteField(true) + fileField('bukti', false);
    openModal('Reject Settlement', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan reject.'); return; }
            var s = st(r.txId); s.status = 'pending'; s.request = { type: 'reject', reason: reason, bukti: buktiName(), ts: todayProc() };
            saveItems(); closeModal(); render(); showToast('Reject Diajukan', 'Menunggu approval Approver.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Reject ' + r.merchantName);
        } }
    ]);
}

function openSettle(r) {
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Settle <b>' + esc(r.merchantName) + '</b> — ' + rupiah(totalOf(r)) + '.</p>' + channelField() + noteField(false) + fileField('bukti', false);
    openModal('Settle Transaksi', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ch = document.getElementById('asChannel').value;
            var s = st(r.txId); s.status = 'pending'; s.request = { type: 'settle', channel: ch, reason: document.getElementById('asReason').value.trim(), bukti: buktiName(), ts: todayProc() };
            saveItems(); closeModal(); render(); showToast('Settle Diajukan', 'Menunggu approval Approver.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Settle ' + r.merchantName + ' via ' + ch);
        } }
    ]);
}
function channelField() {
    return '<div class="as-fld"><label>Channel Payment</label><select id="asChannel">' + CHANNELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>';
}

function openBulkSettle() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk settle <b>' + selected.size + '</b> transaksi terpilih.</p>' + channelField();
    openModal('Bulk Settle', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Settle', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ch = document.getElementById('asChannel').value;
            var ids = Array.from(selected);
            ids.forEach(function (id) { var s = st(id); s.status = 'pending'; s.request = { type: 'settle', channel: ch, reason: '', bukti: '', ts: todayProc() }; });
            selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Settle Diajukan', ids.length + ' transaksi menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Settle ' + ids.length + ' transaksi via ' + ch);
        } }
    ]);
}

// ── approver actions ──
function openApproverView(r) {
    var s = st(r.txId); var rq = s.request || {};
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    var body = kv('Merchant', esc(r.merchantName)) + kv('Tipe Request', (rq.type || '-').toUpperCase()) +
        (rq.scope ? kv('Cakupan', rq.scope) : '') + (rq.channel ? kv('Channel', rq.channel) : '') +
        kv('Catatan', esc(rq.reason || '-')) + kv('Bukti', rq.bukti ? esc(rq.bukti) : '<span style="color:var(--text-muted);">tidak ada</span>') + kv('Diajukan', esc(rq.ts || '-'));
    openModal('Detail Request', body, [{ label: 'Tutup', onClick: closeModal }]);
}
function approverDecide(r, approve) {
    var s = st(r.txId); var rq = s.request || {};
    if (approve) {
        s.status = rq.type; // hold | reject | settle
        if (rq.type === 'settle') s.channel = rq.channel || '';
        showToast('Request Disetujui', r.merchantName + ' → ' + (rq.type || '').toUpperCase() + '.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Approve ' + (rq.type || '') + ' ' + r.merchantName);
    } else {
        s.status = 'checker';
        s.note = (s.note ? s.note + '\n' : '') + '[Approver reject ' + (rq.type || '') + ']';
        s.request = null;
        showToast('Request Ditolak', r.merchantName + ' dikembalikan ke Checker.');
        writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject request ' + r.merchantName);
    }
    saveItems(); render();
}

// ── settle tab: reject by bank ──
function openRejectByBank() {
    var groups = ['BCA', 'Mandiri', 'BRI', 'Lainnya'];
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Pindahkan seluruh transaksi <b>Settle</b> pada bank terpilih ke status <b>Reject</b>.</p>' +
        '<div class="as-fld"><label>Bank</label><select id="asRbbBank">' + groups.map(function (g) {
            var n = pool.filter(function (r) { return st(r.txId).status === 'settle' && bankGroup(r.bankCode) === g; }).length;
            return '<option value="' + g + '">' + g + ' (' + n + ' transaksi)</option>';
        }).join('') + '</select></div>';
    openModal('Reject by Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var g = document.getElementById('asRbbBank').value;
            var targets = pool.filter(function (r) { return st(r.txId).status === 'settle' && bankGroup(r.bankCode) === g; });
            if (!targets.length) { showToast('Kosong', 'Tidak ada transaksi settle untuk bank ' + g + '.'); return; }
            targets.forEach(function (r) { st(r.txId).status = 'reject'; });
            saveItems(); closeModal(); render(); showToast('Status Diubah', targets.length + ' transaksi ' + g + ' → Reject.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject by Bank ' + g + ' (' + targets.length + ' transaksi)');
        } }
    ]);
}

// ── export current tab ──
function exportTab() {
    var rows = tabRows(activeTab);
    if (!rows.length) { showToast('Kosong', 'Tidak ada data untuk diexport.'); return; }
    var cols = ['No', 'Tanggal Proses', 'ID Transaksi', 'MID', 'Merchant', 'Nominal Awal', 'Admin', 'Adj CB (+)', 'Adj CB (-)', 'Total Settle', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening', 'Status'];
    var e = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['Auto Settlement — Tab ' + STATUS_LABEL[activeTab], 'Generated By:,dion@paydia.id', '', cols.join(',')];
    rows.forEach(function (r, i) { var s = st(r.txId); lines.push([i + 1, r.tanggal, r.txId, r.mid, r.merchantName, r.nominalAwal, r.admin, s.adjPlus || 0, s.adjMinus || 0, totalOf(r), r.bankCode, r.bankAccount, r.bankAccountName, STATUS_LABEL[s.status]].map(e).join(',')); });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'AutoSettlement_' + STATUS_LABEL[activeTab] + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export Berhasil', 'Tab ' + STATUS_LABEL[activeTab] + ' di-export.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Export tab ' + STATUS_LABEL[activeTab]);
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

// ── delegated row clicks ──
function onTableClick(e) {
    var d = e.target.closest('[data-detail]');
    if (d) { var r = rowByTx(d.dataset.id); if (r) { d.dataset.detail === 'merchant' ? showMerchantDetail(r) : showTrxDetail(r); } return; }
    var b = e.target.closest('.as-iact');
    if (!b) return;
    var r2 = rowByTx(b.dataset.id); if (!r2) return;
    var act = b.dataset.act;
    if (act === 'hold') openHold(r2);
    else if (act === 'reject') openReject(r2);
    else if (act === 'settle') openSettle(r2);
    else if (act === 'note') openNote(r2);
    else if (act === 'view') openApproverView(r2);
    else if (act === 'approve') approverDecide(r2, true);
    else if (act === 'areject') approverDecide(r2, false);
    else if (act === 'toreject') { st(r2.txId).status = 'reject'; saveItems(); render(); showToast('Status Diubah', r2.merchantName + ' → Reject.'); writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ganti status ke Reject ' + r2.merchantName); }
}

// ── init ──
function bind() {
    document.querySelectorAll('.as-tab').forEach(function (t) {
        t.addEventListener('click', function () { activeTab = t.dataset.tab === 'approver' ? 'pending' : t.dataset.tab; page = 1; selected.clear(); render(); });
    });
    document.getElementById('asSearch').addEventListener('input', function () { searchTerm = this.value.trim(); page = 1; renderTable(); });
    document.getElementById('asBankFilter').addEventListener('change', function () { bankFilter = this.value; page = 1; renderTable(); });
    document.getElementById('asExportBtn').addEventListener('click', exportTab);
    document.getElementById('asBulkSettle').addEventListener('click', openBulkSettle);
    document.getElementById('asTableBody').addEventListener('click', onTableClick);
    document.getElementById('asModalClose').addEventListener('click', closeModal);
    document.getElementById('asModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
}

document.addEventListener('DOMContentLoaded', function () {
    loadItems();
    loadPool();
    bind();
    render();
});
