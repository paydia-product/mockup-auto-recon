/* ===================================================
   Paydia Bisnis – Auto Settlement Dashboard Logic
   Modul TERPISAH dari Auto Recon. Membaca state recon
   (paydia_recon_done_<tgl>) sebagai gate, lalu mengelola
   batch settlement: segregasi per bank, Maker→Checker→
   Approver (no-skip), adjustment chargeback, hold/release,
   disbursement, export. Tanpa backend / framework baru.
   =================================================== */

// Bank yang punya channel disbursement langsung; selain ini = "Lainnya" (admin flat Rp6.500).
const CORE_BANKS = ['BCA', 'BRI', 'MANDIRI'];
const ADMIN_FEE_OTHER = 6500;

// Master lookup whitelist nomor rekening (CR: verifikasi via master, bukan ketik manual).
// '12345678' (Jodo Test) sengaja TIDAK terdaftar → demo row invalid.
const REK_WHITELIST = new Set([
    '024701001749308', '024701001749309', '3847075823',
    '1370011223344', '0980011556677', '7650011889900'
]);

// Approval badge mapping (reuse existing status-badge classes).
const APPROVAL_BADGE = {
    'Draft': 'status-notes', 'Maker Submitted': 'status-proses', 'Checked': 'status-dikembalikan',
    'Approved': 'status-sukses', 'Rejected': 'status-gagal', 'On Hold': 'status-proses'
};
const DISB_BADGE = { 'Pending': 'status-proses', 'Diproses': 'status-dikembalikan', 'Selesai': 'status-sukses' };

let pool = [];          // batch rows derived from paydia_settlements
let stateMap = {};      // per-txId: {approval, prevApproval, disb, adjPlus, adjMinus, adjFinance}
let selected = new Set();
let gateOpen = false;

// ── helpers ──
const rupiah = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 });
const todayISO = () => { const d = new Date(); const p = x => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const isOther = bank => !CORE_BANKS.includes(String(bank).toUpperCase());
const bankGroup = bank => isOther(bank) ? 'Lainnya' : String(bank).toUpperCase().replace('MANDIRI', 'Mandiri');

function loadState() {
    try { stateMap = JSON.parse(localStorage.getItem('paydia_autosettle_state')) || {}; }
    catch (e) { stateMap = {}; }
}
function saveState() { localStorage.setItem('paydia_autosettle_state', JSON.stringify(stateMap)); }

function st(txId) {
    if (!stateMap[txId]) stateMap[txId] = { approval: 'Draft', prevApproval: null, disb: '', adjPlus: 0, adjMinus: 0, adjFinance: false };
    return stateMap[txId];
}

function loadPool() {
    let db = [];
    try { db = JSON.parse(localStorage.getItem('paydia_settlements')) || []; } catch (e) { db = []; }
    pool = db.map(r => {
        const admin = isOther(r.bankCode) ? ADMIN_FEE_OTHER : 0;
        return {
            txId: r.txId, tanggal: r.tanggal, merchantName: r.merchantName, merchantCode: r.merchantCode,
            bankCode: r.bankCode, bankAccount: r.bankAccount, bankAccountName: r.bankAccountName,
            nominalAwal: Number(r.nominalSettle) || 0, admin: admin
        };
    });
}

function totalOf(row) {
    const s = st(row.txId);
    return row.nominalAwal - row.admin + (s.adjPlus || 0) - (s.adjMinus || 0);
}

// ── Gate ──
function checkGate() {
    const date = document.getElementById('asDate').value || todayISO();
    let flag = null;
    try { flag = JSON.parse(localStorage.getItem('paydia_recon_done_' + date)); } catch (e) { flag = null; }
    gateOpen = !!(flag && flag.done);

    const gate = document.getElementById('asGate');
    const txt = document.getElementById('asGateText');
    const link = document.getElementById('asGateLink');
    const human = date.split('-').reverse().join('-');
    if (gateOpen) {
        gate.className = 'as-gate open';
        gate.querySelector('i').className = 'fas fa-circle-check';
        txt.innerHTML = `Recon ${human} selesai ✓ — siap settlement (${flag.matched || 0} matched).`;
        link.style.display = 'none';
    } else {
        gate.className = 'as-gate locked';
        gate.querySelector('i').className = 'fas fa-lock';
        txt.innerHTML = `Auto Recon untuk <b>${human}</b> belum selesai. Jalankan Manual Recon dulu di Settle &amp; Recon.`;
        link.style.display = 'inline-block';
    }
    applyGateToControls();
}

function applyGateToControls() {
    document.querySelectorAll('.as-act').forEach(b => { b.disabled = !gateOpen; b.style.opacity = gateOpen ? '1' : '.5'; b.style.cursor = gateOpen ? 'pointer' : 'not-allowed'; });
    const exp = document.getElementById('asExportBtn');
    exp.disabled = !gateOpen; exp.style.opacity = gateOpen ? '1' : '.5'; exp.style.cursor = gateOpen ? 'pointer' : 'not-allowed';
    document.querySelectorAll('#asTableBody .row-cb, #asSelectAll').forEach(cb => cb.disabled = !gateOpen);
    if (!gateOpen) { selected.clear(); }
}

// ── Render ──
function render() {
    renderBankCards();
    renderTable();
    renderBulkBar();
}

function renderBankCards() {
    const groups = ['BCA', 'Mandiri', 'BRI', 'Lainnya'];
    const icon = { BCA: 'fa-building-columns', Mandiri: 'fa-building-columns', BRI: 'fa-building-columns', Lainnya: 'fa-ellipsis' };
    const wrap = document.getElementById('asBankCards');
    wrap.innerHTML = groups.map(g => {
        const rows = pool.filter(r => bankGroup(r.bankCode) === g);
        const cnt = rows.length;
        const nominal = rows.reduce((a, r) => a + r.nominalAwal, 0);
        const admin = rows.reduce((a, r) => a + r.admin, 0);
        const net = rows.reduce((a, r) => a + totalOf(r), 0);
        return `<div class="as-bank-card">
            <h4><i class="fas ${icon[g]}" style="color:var(--primary);"></i> ${g}${g === 'Lainnya' ? ' <span class="as-tag-finance">admin Rp6.500</span>' : ''}</h4>
            <div class="as-bank-row"><span>Transaksi</span><b>${cnt}</b></div>
            <div class="as-bank-row"><span>Total Nominal</span><b>${rupiah(nominal)}</b></div>
            <div class="as-bank-row"><span>Total Admin</span><b>${rupiah(admin)}</b></div>
            <div class="as-bank-net"><span>Settlement Bersih</span><span>${rupiah(net)}</span></div>
        </div>`;
    }).join('');
}

function renderTable() {
    const tb = document.getElementById('asTableBody');
    if (!pool.length) { tb.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--text-muted);">Tidak ada data settlement</td></tr>`; return; }
    tb.innerHTML = pool.map((r, i) => {
        const s = st(r.txId);
        const rekValid = REK_WHITELIST.has(String(r.bankAccount));
        const aBadge = APPROVAL_BADGE[s.approval] || 'status-notes';
        const disbCell = s.disb ? `<span class="status-badge ${DISB_BADGE[s.disb]}" style="font-size:0.66rem;">${s.disb}</span>` : '<span style="color:var(--text-muted);">—</span>';
        return `<tr class="${rekValid ? '' : 'rek-bad-row'}">
            <td style="text-align:center;"><input type="checkbox" class="row-cb" data-id="${r.txId}" ${selected.has(r.txId) ? 'checked' : ''} ${gateOpen ? '' : 'disabled'}></td>
            <td>${i + 1}</td>
            <td style="font-variant-numeric:tabular-nums;">${r.tanggal}</td>
            <td><div class="cell-text-stack"><span class="cell-text-main">${r.merchantName}</span><span class="cell-text-sub">${r.merchantCode}</span></div></td>
            <td>${r.bankCode}</td>
            <td class="${rekValid ? '' : 'rek-bad'}">${r.bankAccount} ${rekValid ? '<i class="fas fa-circle-check" style="color:#16a34a;font-size:0.7rem;" title="Lolos master lookup"></i>' : '<i class="fas fa-triangle-exclamation" title="Di luar whitelist master rekening"></i>'}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;">${rupiah(r.nominalAwal)}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;">${r.admin ? rupiah(r.admin) : '-'}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;color:#16a34a;">${s.adjPlus ? '+' + rupiah(s.adjPlus) : '-'}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;color:#dc2626;">${s.adjMinus ? '−' + rupiah(s.adjMinus) : '-'}</td>
            <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:700;">${rupiah(totalOf(r))}</td>
            <td><span class="status-badge ${aBadge}" style="font-size:0.66rem;">${s.approval}</span>${s.adjFinance ? '<span class="as-tag-finance">verif Finance</span>' : ''}</td>
            <td>${disbCell}</td>
        </tr>`;
    }).join('');
    tb.querySelectorAll('.row-cb').forEach(cb => cb.addEventListener('change', () => {
        cb.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id);
        renderBulkBar();
        const all = document.getElementById('asSelectAll'); const boxes = tb.querySelectorAll('.row-cb');
        all.checked = boxes.length && Array.from(boxes).every(b => b.checked);
    }));
}

function renderBulkBar() {
    const bar = document.getElementById('asBulkBar');
    document.getElementById('asBulkCount').textContent = selected.size;
    bar.style.display = selected.size > 0 ? 'flex' : 'none';
}

// ── Actions (Maker → Checker → Approver, no-skip) ──
function selectedRows() { return pool.filter(r => selected.has(r.txId)); }

function doAction(act) {
    if (!gateOpen) return;
    const rows = selectedRows();
    if (!rows.length) { showToast('Peringatan', 'Pilih minimal satu baris terlebih dahulu.'); return; }

    if (act === 'submit') {
        const bad = rows.filter(r => !REK_WHITELIST.has(String(r.bankAccount)));
        if (bad.length) { showToast('Submit Ditolak', `${bad.length} baris punya No.Rek di luar master lookup (ditandai merah). Perbaiki dulu.`); return; }
        const wrong = rows.filter(r => st(r.txId).approval !== 'Draft');
        if (wrong.length) { showToast('Tidak Bisa Submit', 'Hanya baris berstatus Draft yang bisa di-Submit (Maker).'); return; }
        rows.forEach(r => { st(r.txId).approval = 'Maker Submitted'; });
        finishAction(`Maker submit ${rows.length} baris`, 'Submit Berhasil', 'Batch dikirim ke Checker.');
    } else if (act === 'check') {
        const wrong = rows.filter(r => st(r.txId).approval !== 'Maker Submitted');
        if (wrong.length) { showToast('Tidak Bisa Check', 'Checker hanya bisa memeriksa baris berstatus "Maker Submitted". Tidak boleh skip tahap.'); return; }
        rows.forEach(r => { st(r.txId).approval = 'Checked'; });
        finishAction(`Checker verifikasi ${rows.length} baris`, 'Check Berhasil', 'Batch siap di-Approve.');
    } else if (act === 'approve') {
        const wrong = rows.filter(r => st(r.txId).approval !== 'Checked');
        if (wrong.length) { showToast('Tidak Bisa Approve', 'Approve hanya aktif saat status "Checked". Jalankan Submit → Check dulu (no-skip).'); return; }
        open2FA();
    } else if (act === 'adjust') {
        if (rows.length !== 1) { showToast('Pilih Satu', 'Adjustment dilakukan per satu transaksi. Pilih tepat 1 baris.'); return; }
        openAdjust(rows[0]);
    } else if (act === 'hold') {
        const ok = rows.filter(r => !['Approved', 'Rejected', 'On Hold'].includes(st(r.txId).approval));
        if (!ok.length) { showToast('Tidak Bisa Hold', 'Hanya batch yang belum Approved/Rejected yang bisa di-Hold.'); return; }
        ok.forEach(r => { const s = st(r.txId); s.prevApproval = s.approval; s.approval = 'On Hold'; });
        finishAction(`Hold ${ok.length} baris`, 'Settlement Di-Hold', `${ok.length} baris ditahan.`);
    } else if (act === 'release') {
        const ok = rows.filter(r => st(r.txId).approval === 'On Hold');
        if (!ok.length) { showToast('Tidak Bisa Release', 'Hanya baris berstatus "On Hold" yang bisa di-Release.'); return; }
        ok.forEach(r => { const s = st(r.txId); s.approval = s.prevApproval || 'Draft'; s.prevApproval = null; });
        finishAction(`Release ${ok.length} baris`, 'Settlement Di-Release', 'Batch dikembalikan ke tahap sebelumnya.');
    } else if (act === 'reject') {
        const ok = rows.filter(r => st(r.txId).approval !== 'Approved');
        if (!ok.length) { showToast('Tidak Bisa Reject', 'Batch yang sudah Approved tidak bisa di-Reject.'); return; }
        ok.forEach(r => { st(r.txId).approval = 'Rejected'; });
        finishAction(`Reject ${ok.length} baris`, 'Batch Ditolak', `${ok.length} baris ditolak.`);
    }
}

function finishAction(logDetail, toastTitle, toastMsg, keepSelection) {
    saveState();
    if (!keepSelection) selected.clear();
    render();
    if (toastTitle) showToast(toastTitle, toastMsg);
    writeLog('auto-settlement', `email : dion@paydia.id\naction : ${logDetail}`);
}

// ── 2FA / approve ──
function open2FA() {
    document.getElementById('asOtpInputs').querySelectorAll('input').forEach(i => i.value = '');
    showModal('as2faOverlay');
    const inputs = document.getElementById('asOtpInputs').querySelectorAll('input');
    inputs[0].focus();
}
function confirmApprove() {
    hideModal('as2faOverlay');
    const rows = selectedRows().filter(r => st(r.txId).approval === 'Checked');
    rows.forEach(r => { const s = st(r.txId); s.approval = 'Approved'; s.disb = 'Pending'; });
    finishAction(`Approver approve ${rows.length} baris (2FA simulasi)`, 'Approved', `${rows.length} baris disetujui. Disbursement dimulai.`, true);
    // Simulasi disbursement per baris: Pending → Diproses → Selesai
    const ids = rows.map(r => r.txId);
    setTimeout(() => { ids.forEach(id => st(id).disb = 'Diproses'); saveState(); render(); }, 700);
    setTimeout(() => { ids.forEach(id => st(id).disb = 'Selesai'); saveState(); render(); selected.clear(); render(); }, 1600);
}

// ── Adjustment ──
let adjustTarget = null;
function openAdjust(row) {
    adjustTarget = row;
    document.getElementById('asAdjustTarget').textContent = `${row.merchantName} · ${row.bankCode} · ${rupiah(row.nominalAwal)}`;
    document.getElementById('asAdjustType').value = 'minus';
    document.getElementById('asAdjustNominal').value = '';
    document.getElementById('asAdjustReason').value = '';
    showModal('asAdjustOverlay');
}
function saveAdjust() {
    if (!adjustTarget) return;
    const type = document.getElementById('asAdjustType').value;
    const nominal = Number(document.getElementById('asAdjustNominal').value) || 0;
    const reason = document.getElementById('asAdjustReason').value.trim();
    if (nominal <= 0) { showToast('Nominal Kosong', 'Isi nominal adjustment lebih dari 0.'); return; }
    if (!reason) { showToast('Alasan Kosong', 'Isi alasan adjustment.'); return; }
    const s = st(adjustTarget.txId);
    if (type === 'plus') s.adjPlus = (s.adjPlus || 0) + nominal; else s.adjMinus = (s.adjMinus || 0) + nominal;
    s.adjFinance = true;
    hideModal('asAdjustOverlay');
    finishAction(`Adjustment CB ${type === 'plus' ? '(+)' : '(−)'} ${rupiah(nominal)} pada ${adjustTarget.merchantName} — menunggu verifikasi Finance`, 'Adjustment Tersimpan', 'Menunggu verifikasi Finance.', true);
    adjustTarget = null;
}

// ── Export (per-bank tabs) ──
function buildExportData() {
    const groups = ['BCA', 'Mandiri', 'BRI', 'Lainnya'];
    const data = {};
    groups.forEach(g => {
        data[g] = pool.filter(r => bankGroup(r.bankCode) === g).map(r => {
            const s = st(r.txId);
            return { tanggal: r.tanggal, merchant: r.merchantName, rek: r.bankAccount, namaRek: r.bankAccountName,
                bank: r.bankCode, nominal: r.nominalAwal, admin: r.admin, adjPlus: s.adjPlus || 0, adjMinus: s.adjMinus || 0, total: totalOf(r) };
        });
    });
    return data;
}
function openExport() {
    if (!gateOpen) return;
    const data = buildExportData();
    const groups = Object.keys(data);
    const tabs = document.getElementById('asExportTabs');
    tabs.innerHTML = groups.map((g, i) => `<button class="as-export-tab ${i === 0 ? 'active' : ''}" data-g="${g}">${g} (${data[g].length})</button>`).join('');
    const renderPanel = g => {
        const rows = data[g];
        const panel = document.getElementById('asExportPanel');
        if (!rows.length) { panel.innerHTML = `<p style="padding:20px;color:var(--text-muted);text-align:center;">Tidak ada data untuk ${g}.</p>`; return; }
        panel.innerHTML = `<table class="data-table"><thead><tr>
            <th>Tanggal</th><th>Merchant</th><th>No.Rek</th><th style="text-align:right;">Nominal</th>
            <th style="text-align:right;">Admin</th><th style="text-align:right;">Adj (+)</th><th style="text-align:right;">Adj (−)</th><th style="text-align:right;">Total</th>
            </tr></thead><tbody>${rows.map(r => `<tr>
            <td>${r.tanggal}</td><td>${r.merchant}</td><td>${r.rek}</td>
            <td style="text-align:right;">${rupiah(r.nominal)}</td><td style="text-align:right;">${r.admin ? rupiah(r.admin) : '-'}</td>
            <td style="text-align:right;">${r.adjPlus ? rupiah(r.adjPlus) : '-'}</td><td style="text-align:right;">${r.adjMinus ? rupiah(r.adjMinus) : '-'}</td>
            <td style="text-align:right;font-weight:700;">${rupiah(r.total)}</td></tr>`).join('')}</tbody></table>`;
    };
    renderPanel(groups[0]);
    tabs.querySelectorAll('.as-export-tab').forEach(t => t.addEventListener('click', () => {
        tabs.querySelectorAll('.as-export-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active'); renderPanel(t.dataset.g);
    }));
    showModal('asExportOverlay');
}
function downloadExportCSV() {
    const data = buildExportData();
    const esc = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const lines = ['Generated By:,dion@paydia.id', 'Modul:,Auto Settlement (bukan Auto Recon)', ''];
    Object.keys(data).forEach(g => {
        lines.push('TABEL ' + g.toUpperCase());
        lines.push(['Tanggal', 'Merchant', 'No.Rek', 'Nama Rek', 'Bank', 'Nominal', 'Biaya Admin', 'Adj CB (+)', 'Adj CB (-)', 'Total Settlement'].join(','));
        data[g].forEach(r => lines.push([r.tanggal, r.merchant, r.rek, r.namaRek, r.bank, r.nominal, r.admin, r.adjPlus, r.adjMinus, r.total].map(esc).join(',')));
        lines.push('');
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Auto_Settlement_per_Bank_' + (document.getElementById('asDate').value || todayISO()) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export Berhasil', 'File Auto Settlement per bank di-generate.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Export Auto Settlement segregasi per bank');
}

// ── Cut-off 14.00 ──
function renderCutoff() {
    const el = document.getElementById('asCutoff');
    const h = new Date().getHours();
    if (h >= 14) { el.className = 'as-cutoff past'; el.innerHTML = '<i class="far fa-clock"></i> Lewat cut-off 14.00 — fallback manual'; }
    else { el.className = 'as-cutoff ok'; el.innerHTML = '<i class="far fa-clock"></i> Sebelum cut-off 14.00'; }
}

// ── modal + toast utils ──
function showModal(id) { const m = document.getElementById(id); m.classList.add('show'); document.body.style.overflow = 'hidden'; }
function hideModal(id) { const m = document.getElementById(id); m.classList.remove('show'); document.body.style.overflow = 'auto'; }

function showToast(title, msg) {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i class="fas fa-info-circle toast-icon" style="color:var(--primary);"></i>
        <div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>
        <button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>`;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => { t.classList.add('leaving'); t.addEventListener('animationend', () => t.remove()); });
    setTimeout(() => { if (t.parentNode) { t.classList.add('leaving'); t.addEventListener('animationend', () => t.remove()); } }, 3500);
}

function writeLog(type, detail) {
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('paydia_logs')) || []; } catch (e) { logs = []; }
    let maxId = 9138;
    logs.forEach(l => { const n = parseInt(l.id); if (!isNaN(n) && n > maxId) maxId = n; });
    const now = new Date(); const p = x => String(x).padStart(2, '0');
    const dateStr = `${p(now.getDate())}-${p(now.getMonth() + 1)}-${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
    logs.unshift({ id: maxId + 1, tanggal: dateStr, container: 'paydia-auto-settlement', type, detail, ip: '125.161.77.69' });
    localStorage.setItem('paydia_logs', JSON.stringify(logs));
}

// ── wire up ──
function bind() {
    document.getElementById('asDate').value = todayISO();
    document.getElementById('asDate').addEventListener('change', checkGate);

    const sched = document.getElementById('asScheduleToggle');
    sched.checked = localStorage.getItem('paydia_autosettle_sched') === '1';
    document.getElementById('asScheduleText').textContent = sched.checked ? 'ON' : 'OFF';
    sched.addEventListener('change', () => {
        localStorage.setItem('paydia_autosettle_sched', sched.checked ? '1' : '0');
        document.getElementById('asScheduleText').textContent = sched.checked ? 'ON' : 'OFF';
        showToast('Schedule ' + (sched.checked ? 'Aktif' : 'Nonaktif'), 'Auto Settlement Schedule ' + (sched.checked ? 'diaktifkan.' : 'dimatikan.'));
    });

    document.getElementById('asSelectAll').addEventListener('change', e => {
        if (!gateOpen) { e.target.checked = false; return; }
        selected.clear();
        if (e.target.checked) pool.forEach(r => selected.add(r.txId));
        render();
    });

    document.querySelectorAll('.as-act').forEach(b => b.addEventListener('click', () => doAction(b.dataset.act)));
    document.getElementById('asExportBtn').addEventListener('click', openExport);

    // Modal close wiring
    [['asConfirmClose', 'asConfirmOverlay'], ['asConfirmCancel', 'asConfirmOverlay'],
    ['asAdjustClose', 'asAdjustOverlay'], ['asAdjustCancel', 'asAdjustOverlay'],
    ['as2faClose', 'as2faOverlay'], ['as2faCancel', 'as2faOverlay'],
    ['asExportClose', 'asExportOverlay'], ['asExportCloseBtn', 'asExportOverlay']]
        .forEach(([btn, ov]) => document.getElementById(btn).addEventListener('click', () => hideModal(ov)));

    document.getElementById('asAdjustSave').addEventListener('click', saveAdjust);
    document.getElementById('as2faConfirm').addEventListener('click', confirmApprove);
    document.getElementById('asExportDownload').addEventListener('click', downloadExportCSV);

    // OTP auto-advance
    const otp = document.getElementById('asOtpInputs').querySelectorAll('input');
    otp.forEach((inp, i) => inp.addEventListener('input', () => { if (inp.value && i < otp.length - 1) otp[i + 1].focus(); }));

    // sidebar toggle (shared behaviour)
    const sidebar = document.getElementById('sidebar');
    const tgl = document.getElementById('sidebarToggle');
    if (tgl && sidebar) tgl.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    const mob = document.getElementById('mobileToggle');
    if (mob && sidebar) mob.addEventListener('click', () => sidebar.classList.toggle('open'));
}

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    loadPool();
    bind();
    renderCutoff();
    checkGate();
    render();
});
