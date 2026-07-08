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
var METODE_TRANSFER = ['BI-Fast', 'On-Us / IFT', 'RTGS'];
// Label request hold di tab Approver per cakupan.
var REQ_HOLD_LABEL = { all: 'Hold', partial: 'Hold Partial', min: 'Hold Dibawah Min. Transaksi', rejectbybank: 'Reject by Bank' };
// Settle tab status system
var SETTLE_STATUS_LABEL = { pending: 'Pending', success: 'Success', fail: 'Fail', rejectbybank: 'Reject by Bank' };
var SETTLE_STATUS_COLOR = { pending: '#b45309', success: '#16a34a', fail: '#dc2626', rejectbybank: '#7c3aed' };
var PER_PAGE = 50;

// Base columns shared by every tab (in order). Unit = settlement group (per norek).
var BASE_COLS = ['No', 'Tanggal Recon', 'Tanggal Perubahan Terakhir', 'ID Settlement', 'Nominal Awal (Rp)', 'Admin (Rp)',
    'Adjustment Chargeback (+) (Rp)', 'Adjustment Chargeback (−) (Rp)', 'Total Settle (Rp)', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

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
var summaryCollapsed = false; // §1.3: panel Ringkasan per Bank bisa dilipat
var summaryPage = 1;          // pagination Ringkasan per Bank
var SUMMARY_PER_PAGE = 10;
var simMode = null; // null | 'success' | 'pending' | 'fail' | 'rejectbybank' (settle tab simulation)
var sim2faWrong = false; // §7: Approver — bila aktif, verifikasi 2FA selalu gagal (uji error path)

// ── helpers ──
var rupiah = function (n) { return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }); };
var num = function (n) { return (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 }); }; // tanpa "Rp" untuk sel tabel
var AUTO_HOLD_MIN = 10000;
var SCOPE_LABEL = { all: 'Hold Semua', partial: 'Hold Partial', min: 'Hold Dibawah Min. Transaksi', rejectbybank: 'Reject by Bank', anomaly: 'Anomali Rekening' };
// §8: data settlement terakhir per merchant tunggal (by MID) untuk deteksi perubahan rekening.
var REF_ACCOUNTS = {
    'MID-W002': { norek: '8810000000099', nama: 'PT Notif Merchant', bank: 'BCA', notified: true },  // ada pemberitahuan
    'MID-W003': { norek: '8810000000088', nama: 'Fathurroji', bank: 'BCA', notified: false }          // anomali (acuan Fathurroji)
};
var NEW_MIDS = { 'MID-W001': 1 }; // merchant baru (belum pernah settle)
// Status rekening merchant tunggal: null | 'baru' | 'notified' | 'anomaly'.
function accountStatus(g) {
    var mids = midSummary(g);
    if (mids.length !== 1) return null; // hanya merchant tunggal
    var mid = mids[0].mid;
    if (NEW_MIDS[mid]) return 'baru';
    var ref = REF_ACCOUNTS[mid];
    if (!ref) return null;
    if (ref.norek === g.norek && ref.bank === g.bank && ref.nama === g.namaRek) return null;
    return ref.notified ? 'notified' : 'anomaly';
}
// Notifikasi deteksi rekening (baru / perubahan data) untuk lonceng header — bukan lagi badge di tabel.
function buildAcctNotifs() {
    var out = [];
    groups.forEach(function (g) {
        var stt = accountStatus(g);
        if (!stt) return;
        var mids = midSummary(g); var mid = mids[0] ? mids[0].mid : '-';
        if (stt === 'baru') {
            out.push({ groupId: g.groupId, kind: 'baru',
                text: 'Merchant ' + mid + ' dengan nomor rekening ' + g.norek + ' dan nama pemilik rekening ' + g.namaRek + ' terdeteksi baru pertama kali melakukan transaksi' });
        } else {
            var ref = REF_ACCOUNTS[mid] || {};
            var parts = [];
            if (ref.norek && ref.norek !== g.norek) parts.push('dari nomor rekening ' + ref.norek + ' ke ' + g.norek);
            if (ref.nama && ref.nama !== g.namaRek) parts.push('dari nama pemilik rekening ' + ref.nama + ' ke ' + g.namaRek);
            if (ref.bank && ref.bank !== g.bank) parts.push('dari bank ' + ref.bank + ' ke ' + g.bank);
            out.push({ groupId: g.groupId, kind: stt,
                text: 'Terdeteksi perubahan data merchant ' + mid + ': ' + parts.join(', ') });
        }
    });
    return out;
}
// Render lonceng notifikasi (badge + dropdown).
function renderNotifBell() {
    var notifs = buildAcctNotifs();
    var badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = notifs.length; badge.style.display = notifs.length ? 'flex' : 'none'; }
    var dd = document.getElementById('notifDropdown');
    if (!dd) return;
    var body = notifs.length ? notifs.map(function (nt) {
        var col = nt.kind === 'anomaly' ? '#dc2626' : (nt.kind === 'baru' ? '#2563eb' : '#b45309');
        var ico = nt.kind === 'anomaly' ? 'fa-triangle-exclamation' : (nt.kind === 'baru' ? 'fa-user-plus' : 'fa-pen-to-square');
        return '<div class="notif-item"><span class="ni-ico" style="background:' + col + '22;color:' + col + ';"><i class="fas ' + ico + '"></i></span><span class="ni-body">' + esc(nt.text) + '</span></div>';
    }).join('') : '<div class="notif-empty">Tidak ada notifikasi.</div>';
    dd.innerHTML = '<div class="notif-dropdown-head"><span>Notifikasi Deteksi Rekening</span><span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">' + notifs.length + ' notifikasi</span></div>' + body;
}
// §1.5: status akumulasi norek yang punya hold <Rp10.000.
// §1/§2: status hold sesuai filter — Belum Diproses / Siap Release / Sudah Release Checker.
// "Siap Release" hanya untuk hold Dibawah Min. Transaksi yang akumulasi norek-nya ≥ Rp10.000.
var HOLD_STATUS_LABEL = { belum: 'Belum Diproses', siap: 'Siap Release', released: 'Sudah Release Checker' };
function holdStatusKey(g) {
    var s = st(g.groupId);
    if (s.status === 'hold') return isReleasableMinHold(g) ? 'siap' : 'belum';
    return 'released';
}
function holdStatusChip(g) {
    var k = holdStatusKey(g);
    var m = { belum: ['#b4530922', '#b45309'], siap: ['#16a34a22', '#15803d'], released: ['#0891b222', '#0e7490'] }[k];
    return '<span style="font-size:0.68rem;font-weight:700;border-radius:5px;padding:2px 8px;white-space:nowrap;background:' + m[0] + ';color:' + m[1] + ';">' + HOLD_STATUS_LABEL[k] + '</span>';
}
// Auto-approval request ke Approver (persisten, TIDAK bisa dihapus). 2 jenis: Rilis ke Checker & Reject by Bank.
// Data tetap hidup di tab tujuan (checker/hold); di Approver hanya tercatat sebagai request yang auto-approve.
var AUTOREQ_LABEL = { rilis: 'Rilis ke Checker', rejectbybank: 'Reject by Bank' };
var AUTOREQ_TAB = { checker: 'Checker', hold: 'Hold', reject: 'Reject', settle: 'Settle', pending: 'Approver' };
function autoReqText(a) { return a ? ('Otomatis ' + (AUTOREQ_TAB[a.from] || a.from) + ' → ' + (AUTOREQ_TAB[a.to] || a.to)) : ''; }
// Label MID yang dihold (Hold Partial). Bila per-nominal, tampilkan jumlah yang dihold tiap MID.
function partialMidsLabel(rq) {
    return (rq.partialMids || []).map(function (m) {
        return (rq.holdAmounts && rq.holdAmounts[m] != null) ? (m + ' (Rp ' + num(rq.holdAmounts[m]) + ')') : m;
    }).join(', ');
}
// Alasan hold — dari holdScope yang persist (agar ledger yang sudah rilis tetap ada isinya).
function holdAlasan(g) { var s = st(g.groupId); return s.holdScope || (s.request || {}).scope || null; }
// §3: badge gabung pada settlement induk yang menyerap transaksi dibawah min norek sama.
function mergeBadge(g) {
    var mi = st(g.groupId).mergeInfo; if (!mi) return '';
    return ' <span title="Digabung dari ' + mi.count + ' transaksi dibawah min (norek sama) saat approve — total ' + rupiah(mi.total) + '" style="font-size:0.62rem;font-weight:700;border-radius:4px;padding:1px 6px;background:#0891b222;color:#0e7490;white-space:nowrap;">⊕ Gabung ' + mi.count + '</span>';
}
// §2/§3: hold <min ("Dibawah Min. Transaksi") bisa dirilis bila total settlement norek yg sama
// (checker + hold min) ≥ Rp10.000. Dihitung sekali per render (O(n)) lalu di-cache.
var _releasableNoreks = {};
function computeReleasable() {
    var tot = {}, minNorek = {};
    groups.forEach(function (g) {
        var s = st(g.groupId), sc = (s.request || {}).scope;
        if (s.status === 'checker' || (s.status === 'hold' && sc === 'min')) tot[g.norek] = (tot[g.norek] || 0) + totalOf(g);
        if (s.status === 'hold' && sc === 'min') minNorek[g.norek] = 1;
    });
    _releasableNoreks = {};
    Object.keys(minNorek).forEach(function (nr) { if ((tot[nr] || 0) >= AUTO_HOLD_MIN) _releasableNoreks[nr] = 1; });
}
function accumReleasableCount() { return Object.keys(_releasableNoreks).length; }
function isReleasableMinHold(g) { var s = st(g.groupId); return s.status === 'hold' && (s.request || {}).scope === 'min' && !!_releasableNoreks[g.norek]; }
var esc = function (v) { v = String(v == null ? '' : v); return v.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
var isOther = function (b) { return CORE_BANKS.indexOf(String(b).toUpperCase()) === -1; };
var bankGroup = function (b) { return isOther(b) ? 'Lainnya' : String(b).toUpperCase().replace('MANDIRI', 'Mandiri'); };
var todayProc = function () { var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
var todayISO = function () { var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
// Dokumentasi: default filter = SEMUA tanggal (start/end kosong). User bisa mempersempit via panel Filter.
function defaultFilters() { return { start: '', end: '', banks: new Set(), big: false, mid: false, small: false, reqs: new Set(), settleStatuses: new Set(), metodeSettle: '', channel: '', holdAlasans: new Set(), holdStatuses: new Set() }; }
// Cocokkan 1 nilai filter Tipe Request ke state group (dipakai multi-select OR).
function reqMatchesValue(v, s) {
    var rq = s.request || {};
    if (v === 'hold') return rq.type === 'hold' && rq.scope === 'all';
    if (v === 'holdpartial') return rq.type === 'hold' && rq.scope === 'partial';
    if (v === 'holdmin') return rq.type === 'hold' && rq.scope === 'min';
    if (v === 'reject') return rq.type === 'reject';
    if (v === 'settle') return rq.type === 'settle';
    if (v === 'rilis') return !!(s.autoReq && s.autoReq.type === 'rilis');
    if (v === 'rejectbybank') return !!(s.autoReq && s.autoReq.type === 'rejectbybank');
    return false;
}

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

// ── Seed generator (stress test 1000+/tab, DETERMINISTIK agar groupId stabil lintas reload) ──
var GEN_BANKS = ['BCA', 'BRI', 'MANDIRI', 'BNI', 'PERMATA', 'CIMB', 'OCBC', 'NOBU', 'AGI', 'JAGO', 'MEGA', 'SEABANK', 'BSI', 'DANAMON', 'BTN', 'SINARMAS', 'MUAMALAT', 'BANK DKI', 'MAYBANK', 'PANIN', 'BUKOPIN', 'COMMONWEALTH'];
var GEN_NAMES = ['Toko Makmur', 'CV Sinar Jaya', 'PT Anugerah', 'Warung Berkah', 'Kedai Kopi', 'PT Sentosa', 'Gerai Sehat', 'Toko Elektronik', 'PT Digital Niaga', 'Apotek Waras', 'PT Boga Rasa', 'Studio Kreatif', 'PT Mitra Usaha', 'Laundry Kilat', 'PT Sumber Pangan', 'Bengkel Jaya', 'PT Cahaya Abadi', 'Toko Bangunan', 'PT Karya Mandiri', 'Warteg Sederhana'];
var GEN_MERCH = ['Outlet Pusat', 'Cabang Kota', 'Gerai Mall', 'Kios Online', 'Toko Utama', 'Stand Bazaar', 'Booth Event', 'Lapak Digital'];
var GEN_REASONS = ['Data tidak sesuai rekonsiliasi', 'Menunggu konfirmasi merchant', 'Indikasi selisih nominal', 'Perlu verifikasi dokumen', 'Permintaan tim finance'];
var _gi = 0;
function _r(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
function _pick(a, s) { return a[Math.floor(_r(s) * a.length) % a.length]; }
function _int(s, lo, hi) { return Math.floor(_r(s) * (hi - lo + 1)) + lo; }
function _pad2(x) { return String(x).padStart(2, '0'); }
function _isoDaysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate()); }
function _isoAdd(iso, n) { var d = new Date(iso); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate()); }
function _disp(iso, s) { var p = iso.split('-'); return p[2] + '-' + p[1] + '-' + p[0] + ' ' + _pad2(_int(s, 8, 17)) + ':' + _pad2(_int(s + 1, 0, 59)) + ':' + _pad2(_int(s + 2, 0, 59)); }

var _seedSplitsOut = [];
function buildSeedPool() {
    _gi = 5;
    _seedSplitsOut = [];
    var rows = [], uid = 4000000000;
    function nextNorek() { uid += 7; return '88' + String(uid).slice(-11); }
    // add 1 settlement (1..midCount MID, disputeCount MID dgn chargeback). state di-embed pada tx pertama.
    function add(bank, midCount, disputeCount, amtEach, state, forceNorek, forceISO) {
        var norek = forceNorek || nextNorek();
        var owner = _pick(GEN_NAMES, _gi++) + ' ' + norek.slice(-4);
        var iso = forceISO || _isoDaysAgo(_int(_gi++, 3, 120));
        var disp = _disp(iso, _gi++);
        if (state && state.__changed) {
            var uts = _disp(_isoAdd(iso, _int(_gi++, 1, 20)), _gi++);
            state.updatedTs = uts;
            if (state.approvedTs === '__ts') state.approvedTs = uts;
            if (state.request && state.request.ts === '__ts') state.request.ts = uts;
            if (state.autoReq && state.autoReq.ts === '__ts') state.autoReq.ts = uts;
            delete state.__changed;
        }
        for (var m = 0; m < midCount; m++) {
            var mid = 'MID-' + norek.slice(-6) + '-' + m;
            var merch = _pick(GEN_MERCH, _gi++) + ' ' + norek.slice(-3);
            var amt = amtEach > 0 ? _int(_gi++, Math.floor(amtEach * 0.6), Math.floor(amtEach * 1.4)) : _int(_gi++, 30000, 900000);
            var row = { txId: 'TX-' + norek + '-' + m, tanggal: disp, merchantName: merch, mid: mid, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: amt, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp };
            if (m === 0 && state) row.seedState = state;
            rows.push(row);
            if (m < disputeCount) {
                // chargeback dibatasi ≤ ~40% nominal MID agar Total Settle tak jadi negatif tak wajar.
                var cb = _int(_gi++, 5000, Math.max(6000, Math.floor(amt * 0.4)));
                rows.push({ txId: 'TX-' + norek + '-' + m + 'D', tanggal: disp, merchantName: merch, mid: mid, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: 0, tipeSettlement: (m % 2 ? 'Tambahan Dispute' : 'Reguler Dispute'), adjPlus: 0, adjMinus: cb, procISO: iso, procDisplay: disp });
            }
        }
    }
    // Case gabung: 1 norek+bank punya base (checker) + 1 MID di-carve jadi split hold Dibawah Min.
    function addMergeCase() {
        var norek = nextNorek(), bank = 'OCBC';
        var owner = _pick(GEN_NAMES, _gi++) + ' ' + norek.slice(-4);
        var iso = _isoDaysAgo(_int(_gi++, 3, 120)), disp = _disp(iso, _gi++);
        var uts = _disp(_isoAdd(iso, _int(_gi++, 1, 15)), _gi++);
        var base = norek.slice(-6);
        var midA = 'MID-' + base + '-0', midB = 'MID-' + base + '-1';
        rows.push({ txId: 'TX-' + norek + '-0', tanggal: disp, merchantName: 'Gerai ' + norek.slice(-3), mid: midA, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: _int(_gi++, 18000, 30000), tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp, seedState: { status: 'checker' } });
        rows.push({ txId: 'TX-' + norek + '-1', tanggal: disp, merchantName: 'Kios ' + norek.slice(-3), mid: midB, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: _int(_gi++, 12000, 15500), tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp, seedState: { status: 'hold', everHeld: true, holdScope: 'min', holdReason: 'Auto hold: total settle < Rp10.000', approvedTs: uts, approvedBy: 'sistem', updatedTs: uts, request: { type: 'hold', scope: 'min', prevStatus: 'checker', reason: 'Auto hold: total settle < Rp10.000', bukti: '', ts: uts } } });
        _seedSplitsOut.push({ id: 'STL-' + norek + '-P1', norek: norek, bank: bank, mids: [midB], createdTs: disp });
    }
    var mc = function () { var r = _r(_gi++); return r < 0.4 ? 1 : r < 0.7 ? 2 : r < 0.9 ? 3 : 4; };       // banyak multi-MID
    var dc = function (n) { return _r(_gi++) < 0.35 ? Math.min(n, _int(_gi++, 1, 2)) : 0; };                // ~35% punya dispute
    var i, n;
    // 1) CHECKER (~1000): variasi bank, multi-MID, dispute, sebagian nominal besar (>250jt)
    for (i = 0; i < 1000; i++) { var big = (i % 40 === 0); n = big ? 1 : mc(); add(_pick(GEN_BANKS, _gi++), n, dc(n), big ? 280000000 : 0, { status: 'checker' }); }
    // 2) APPROVER/pending (~1000): request settle / hold(all,partial,min) / reject
    for (i = 0; i < 1000; i++) {
        n = mc(); var t = _r(_gi++), req;
        if (t < 0.4) req = { type: 'settle', metodeSettlement: 'Manual', channel: _pick(CHANNELS, _gi++), metode: _pick(METODE_TRANSFER, _gi++), prevStatus: 'checker', reason: '', bukti: '', ts: '__ts' };
        else if (t < 0.7) req = { type: 'hold', scope: _pick(['all', 'partial', 'min'], _gi++), prevStatus: 'checker', reason: _pick(GEN_REASONS, _gi++), bukti: '', ts: '__ts' };
        else req = { type: 'reject', prevStatus: 'checker', reason: _pick(GEN_REASONS, _gi++), bukti: '', ts: '__ts' };
        add(_pick(GEN_BANKS, _gi++), n, dc(n), 0, { status: 'pending', request: req, __changed: true });
    }
    // 3) HOLD aktif (~1000): 4 alasan (Hold Semua / Partial / Dibawah Min / Reject by Bank)
    for (i = 0; i < 1000; i++) {
        var scope = _pick(['all', 'partial', 'min', 'min', 'rejectbybank'], _gi++);
        var noncore = ['OCBC', 'NOBU', 'BNI', 'PERMATA', 'CIMB', 'JAGO', 'MEGA', 'BSI', 'DANAMON'];
        var bk = (scope === 'min') ? _pick(noncore, _gi++) : _pick(GEN_BANKS, _gi++);
        var reason = scope === 'min' ? 'Auto hold: total settle < Rp10.000' : (scope === 'rejectbybank' ? 'Reject by Bank: nomor rekening ditolak bank' : _pick(GEN_REASONS, _gi++));
        var st2 = { status: 'hold', everHeld: true, holdScope: scope, holdReason: reason, approvedTs: '__ts', approvedBy: 'dion@paydia.id', __changed: true,
            request: { type: 'hold', scope: scope, prevStatus: scope === 'rejectbybank' ? 'settle' : 'checker', reason: reason, bukti: (i % 3 ? 'bukti_' + norekSafe(i) + '.pdf' : ''), ts: '__ts' } };
        if (scope === 'rejectbybank') st2.settleStatus = 'rejectbybank';
        add(bk, scope === 'min' ? 1 : mc(), scope === 'min' ? 0 : dc(2), scope === 'min' ? 11000 : 0, st2);
    }
    // 4) HOLD LEDGER (~300): pernah di-hold, sudah RILIS ke Checker — tetap tampil di Hold (Sudah Release Checker)
    for (i = 0; i < 300; i++) {
        var lsc = _pick(['all', 'partial', 'min'], _gi++);
        add(_pick(GEN_BANKS, _gi++), mc(), 0, 0, { status: 'checker', everHeld: true, released: true, holdScope: lsc, holdReason: (lsc === 'min' ? 'Auto hold: total settle < Rp10.000' : _pick(GEN_REASONS, _gi++)), request: null, __changed: true });
    }
    // 5) REJECT (~1000)
    for (i = 0; i < 1000; i++) { n = mc(); add(_pick(GEN_BANKS, _gi++), n, dc(n), 0, { status: 'reject', approvedTs: '__ts', approvedBy: 'dion@paydia.id', __changed: true, request: { type: 'reject', prevStatus: 'checker', reason: _pick(GEN_REASONS, _gi++), bukti: (i % 2 ? 'bukti_r' + i + '.pdf' : ''), ts: '__ts' } }); }
    // 6) SETTLE (~1000): status pending/success/fail (Reject by Bank tidak di sini — masuk Hold)
    for (i = 0; i < 1000; i++) {
        var ss = _pick(['success', 'success', 'pending', 'fail'], _gi++);
        var metode = ss === 'success' ? 'Manual' : _pick(['Manual', 'Otomatis'], _gi++);
        n = mc();
        add(_pick(GEN_BANKS, _gi++), n, dc(n), 0, { status: 'settle', settleStatus: ss, metodeSettlement: metode, channel: _pick(CHANNELS, _gi++), approvedTs: '__ts', approvedBy: 'dion@paydia.id', __changed: true, request: { type: 'settle', metodeSettlement: metode, metode: _pick(METODE_TRANSFER, _gi++), channel: _pick(CHANNELS, _gi++), prevStatus: 'checker', reason: '', bukti: '', ts: '__ts' } });
    }
    // 7) CASE GABUNG (~40): 1 norek+bank = base (checker ≥10k) + split hold Dibawah Min (<10k) via splits.
    //    Akumulasi norek ≥ Rp10.000 → split berstatus "Siap Release"; saat base di-settle & approve → digabung.
    for (i = 0; i < 40; i++) addMergeCase();
    // 8) NOTIFIKASI APPROVER (contoh, ~5 tiap kasus): perpindahan data → notif read-only di tab Approver.
    //    3 kasus: hold→checker (rilis), reject→checker (rilis), settle→hold (reject by bank). Semua AUTO-APPROVE, persisten.
    for (i = 0; i < 5; i++) {
        // (a) hold → checker via Rilis: sudah di Checker (released), tercatat auto-approve di Approver.
        add(_pick(GEN_BANKS, _gi++), mc(), 0, 0, { status: 'checker', everHeld: true, released: true, holdScope: 'all', holdReason: _pick(GEN_REASONS, _gi++), request: null,
            autoReq: { type: 'rilis', from: 'hold', to: 'checker', ts: '__ts' }, __changed: true });
        // (b) reject → checker via Rilis: sudah di Checker, tercatat auto-approve di Approver.
        add(_pick(GEN_BANKS, _gi++), mc(), 0, 0, { status: 'checker', released: true, request: null,
            autoReq: { type: 'rilis', from: 'reject', to: 'checker', ts: '__ts' }, __changed: true });
        // (c) settle → hold via Reject by Bank: di Hold (status Reject by Bank), tercatat auto-approve di Approver.
        add(_pick(GEN_BANKS, _gi++), mc(), 0, 0, { status: 'hold', everHeld: true, settleStatus: 'rejectbybank', holdScope: 'rejectbybank', holdReason: 'Reject by Bank: nomor rekening ditolak bank', approvedTs: '__ts', approvedBy: 'dion@paydia.id',
            request: { type: 'hold', scope: 'rejectbybank', prevStatus: 'settle', reason: 'Reject by Bank: nomor rekening ditolak bank', bukti: '', ts: '__ts' },
            autoReq: { type: 'rejectbybank', from: 'settle', to: 'hold', ts: '__ts' }, __changed: true });
    }
    // 9) DETEKSI REKENING (contoh notifikasi lonceng): merchant single-MID yang cocok REF_ACCOUNTS/NEW_MIDS.
    //    Tetap di Checker (tanpa auto-hold) — Checker review manual.
    function addDetect(mid, norek, bank, nama) {
        var iso = _isoDaysAgo(_int(_gi++, 2, 20)), disp = _disp(iso, _gi++);
        rows.push({ txId: 'TX-' + norek + '-0', tanggal: disp, merchantName: 'Merchant ' + norek.slice(-3), mid: mid, bankCode: bank, bankAccount: norek, bankAccountName: nama, nominalSettle: _int(_gi++, 40000, 120000), tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp, seedState: { status: 'checker' } });
    }
    addDetect('MID-W001', '8810000000111', 'BCA', 'Kopi Senja Nusantara');   // baru (pertama kali transaksi)
    addDetect('MID-W002', '8810000000200', 'BCA', 'PT Notif Merchant');       // perubahan norek (ada pemberitahuan)
    addDetect('MID-W003', '8810000000300', 'BCA', 'Fathurroji Wijaya');       // anomali: perubahan norek + nama tanpa pemberitahuan
    // 10) SKENARIO DIBAWAH MIN. TRANSAKSI (demo 10+ data). Tiap split = 1 settlement terpisah pada 1 norek.
    //     Bank non-core → admin Rp6.500 → totalOf = nominal − 6.500. computeReleasable menjumlah totalOf per norek.
    function addMinScenario(norek, bank, splitAmts, baseAmt) {
        var owner = 'Merchant ' + norek.slice(-4);
        var iso = _isoDaysAgo(_int(_gi++, 2, 18)), disp = _disp(iso, _gi++);
        var idx = 0;
        splitAmts.forEach(function (amt, i) {
            var mid = 'MID-' + norek.slice(-6) + '-' + (idx++);
            rows.push({ txId: 'TX-' + norek + '-' + idx, tanggal: disp, merchantName: 'Gerai ' + norek.slice(-3), mid: mid, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: amt, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp });
            _seedSplitsOut.push({ id: 'STL-' + norek + '-P' + (i + 1), norek: norek, bank: bank, mids: [mid], createdTs: disp });
        });
        if (baseAmt) { // base >Rp10.000 → tetap di Checker (skenario B)
            var bmid = 'MID-' + norek.slice(-6) + '-' + (idx++);
            rows.push({ txId: 'TX-' + norek + '-' + idx, tanggal: disp, merchantName: 'Gerai ' + norek.slice(-3), mid: bmid, bankCode: bank, bankAccount: norek, bankAccountName: owner, nominalSettle: baseAmt, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp });
        }
    }
    // Skenario A — akumulasi hold-min per norek (nominal 10.500 → totalOf 4.000 tiap split):
    addMinScenario('8830000000001', 'OCBC', [10500, 10500, 10500]);        // A lengkap: 3×4.000 = 12.000 ≥10rb → semua Siap Release
    addMinScenario('8830000000002', 'NOBU', [10500, 10500, 10500, 10500]); // A lengkap: 4×4.000 = 16.000 → semua Siap Release
    addMinScenario('8830000000003', 'MEGA', [10500, 10500]);               // A belum: 2×4.000 = 8.000 <10rb → Belum Diproses
    // Skenario B — 1 hold-min (<10rb) + 1 base checker (>10rb) pada norek sama → hold-min jadi Siap Release, base tetap Checker:
    addMinScenario('8830000000004', 'OCBC', [10500], 60000);               // split 4.000 + base 53.500 = 57.500 → Siap Release
    addMinScenario('8830000000005', 'BSI', [10500], 35000);                // split 4.000 + base 28.500 = 32.500 → Siap Release
    // Task 2 — settlement <Rp10.000 ke bank BCA/Mandiri/BRI (core): TIDAK auto-hold, tetap di Checker.
    function addCoreSmall(norek, bank, amt) {
        var iso = _isoDaysAgo(_int(_gi++, 2, 18)), disp = _disp(iso, _gi++);
        rows.push({ txId: 'TX-' + norek + '-0', tanggal: disp, merchantName: 'Gerai ' + norek.slice(-3), mid: 'MID-' + norek.slice(-6) + '-0', bankCode: bank, bankAccount: norek, bankAccountName: 'Merchant ' + norek.slice(-4), nominalSettle: amt, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: iso, procDisplay: disp, seedState: { status: 'checker' } });
    }
    addCoreSmall('8830000000011', 'BCA', 8000);
    addCoreSmall('8830000000012', 'MANDIRI', 6500);
    addCoreSmall('8830000000013', 'BRI', 9000);
    return rows;
}
function norekSafe(i) { return String(1000 + i); }

// Terapkan status seed ke items[] (hanya saat fresh seed). State di-embed pada tx pertama tiap group.
function seedStatuses() {
    groups.forEach(function (g) {
        var ss = g.txns[0] && g.txns[0].seedState;
        if (!ss) return;
        items[g.groupId] = { status: ss.status, adjPlus: 0, adjMinus: 0, note: '', request: ss.request || null,
            channel: ss.channel || '', bukti: '', settleStatus: ss.settleStatus || null,
            approvedTs: ss.approvedTs || null, approvedBy: ss.approvedBy || null,
            metodeSettlement: ss.metodeSettlement || null, everHeld: !!ss.everHeld,
            updatedTs: ss.updatedTs || null, released: !!ss.released, autoReq: ss.autoReq || null,
            holdScope: ss.holdScope || null, holdReason: ss.holdReason || null };
    });
    saveItems();
}

function loadPool(fresh) {
    pool = buildSeedPool();
    if (fresh) { splits = _seedSplitsOut.slice(); saveSplits(); }
    buildGroups();
    if (fresh) seedStatuses();
}

// Bangun 1 group settlement dari sekumpulan transaksi.
function makeGroup(id, norek, txns) {
    var g = { groupId: id, norek: norek, bank: txns[0].bankCode, namaRek: txns[0].bankAccountName,
        procISO: txns[0].procISO, procDisplay: txns[0].procDisplay, txns: txns, nominalAwal: 0, adjPlus: 0, adjMinus: 0,
        admin: isOther(txns[0].bankCode) ? ADMIN_FEE_OTHER : 0 };
    txns.forEach(function (t) { g.nominalAwal += t.nominalSettle; g.adjPlus += (t.adjPlus || 0); g.adjMinus += (t.adjMinus || 0); });
    return g;
}
// §4.7: Tanggal Perubahan Terakhir hanya terisi bila record pernah berubah (stamp aksi > approve > request).
// Kosong ('') bila belum pernah diubah — dan selalu > Tanggal Recon.
function updatedOf(g) { var s = st(g.groupId); return s.updatedTs || s.approvedTs || (s.request && s.request.ts) || ''; }

// Group transaksi per NOMOR REKENING → 1 entry settlement.
// Hold Partial memecah sebagian MID jadi settlement terpisah (splits).
function buildGroups() {
    // §1.1: kunci entitas = BANK + NOREK (nama beda tetap 1 entitas; nama tampil = input paling awal).
    // Norek sama + bank beda = 2 rekening terpisah.
    var norekBanks = {};
    pool.forEach(function (t) { (norekBanks[t.bankAccount] = norekBanks[t.bankAccount] || {})[t.bankCode] = 1; });
    var baseIdFor = function (bank, norek) { return 'STL-' + norek + (Object.keys(norekBanks[norek] || {}).length > 1 ? '-' + bank : ''); };
    var byKey = {};
    pool.forEach(function (t) { var k = t.bankCode + '||' + t.bankAccount; (byKey[k] = byKey[k] || []).push(t); });
    groups = [];
    Object.keys(byKey).forEach(function (k) {
        var txns = byKey[k];
        var bank = txns[0].bankCode, norek = txns[0].bankAccount;
        var mySplits = splits.filter(function (s) { return s.norek === norek && (s.bank || bank) === bank; });
        var heldMids = {}, remainder = 0;
        mySplits.forEach(function (sp) {
            var stx = txns.filter(function (t) { return sp.mids.indexOf(t.mid) >= 0; });
            if (stx.length) {
                var gg = makeGroup(sp.id, norek, stx);
                // Hold Partial per-nominal: group hanya menampilkan dana yang dihold; sisa MID balik ke Checker.
                if (sp.holdAmounts) {
                    var held = 0;
                    sp.mids.forEach(function (m) {
                        var full = stx.reduce(function (a, t) { return a + (t.mid === m ? t.nominalSettle : 0); }, 0);
                        var h = (sp.holdAmounts[m] != null) ? sp.holdAmounts[m] : full;
                        held += h; remainder += (full - h);
                    });
                    gg.nominalAwal = held; gg.adjPlus = 0; gg.adjMinus = 0;
                }
                groups.push(gg);
            }
            sp.mids.forEach(function (m) { heldMids[m] = true; });
        });
        var baseTx = txns.filter(function (t) { return !heldMids[t.mid]; });
        if (baseTx.length) {
            var bg = makeGroup(baseIdFor(bank, norek), norek, baseTx);
            bg.nominalAwal += remainder; // sisa dana partial-hold tetap di Checker
            groups.push(bg);
        } else if (remainder > 0) {
            var meta = txns[0];
            groups.push(makeGroup(baseIdFor(bank, norek), norek, [{ txId: 'TX-' + norek + '-sisa', mid: '(sisa)', merchantName: 'Sisa dana (partial hold)', bankCode: bank, bankAccount: norek, bankAccountName: meta.bankAccountName, nominalSettle: remainder, tipeSettlement: 'Reguler Matched', adjPlus: 0, adjMinus: 0, procISO: meta.procISO, procDisplay: meta.procDisplay }]));
        }
    });
    groups.forEach(function (g) {
        var s = st(g.groupId);
        // Auto-hold: total settle < Rp10.000 untuk bank tujuan bukan BCA/Mandiri/BRI.
        if (s.status === 'checker' && !s.request && isOther(g.bank) && totalOf(g) < AUTO_HOLD_MIN) {
            s.status = 'hold'; s.everHeld = true;
            s.request = { type: 'hold', scope: 'min', reason: 'Auto hold: total settle < Rp10.000 (bank tujuan non-BCA/Mandiri/BRI)', bukti: '', ts: todayProc(), auto: true };
        }
        // §8: anomali/perubahan rekening TIDAK lagi auto-hold — hanya notifikasi ke lonceng.
        // Checker mereview manual lalu bisa hold sendiri bila perlu.
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
        // §3: baris yang sudah digabung ke settlement lain tidak tampil terpisah.
        if (s.mergedInto) return false;
        // Approver menampilkan request pending (manual) + request auto-approve (Rilis/Reject by Bank) yang persisten.
        if (tab === 'pending') { if (s.status !== 'pending' && !s.autoReq) return false; }
        // §4.5 Hold = ledger permanen: semua yang pernah di-hold tetap tampil (walau sudah pindah tab).
        else if (tab === 'hold') { if (s.status !== 'hold' && !s.everHeld) return false; }
        else if (s.status !== tab) return false;
        if (f.start && g.procISO < f.start) return false;
        if (f.end && g.procISO > f.end) return false;
        if (f.banks && f.banks.size > 0 && !f.banks.has(g.bank)) return false;
        // Semua filter nominal berbasis Total Settle (totalOf). Partisi: <10rb / 10rb–250jt / >250jt.
        if (f.big && totalOf(g) <= BIG_THRESHOLD) return false;
        if (f.mid && !(totalOf(g) >= AUTO_HOLD_MIN && totalOf(g) <= BIG_THRESHOLD)) return false;
        if (f.small && totalOf(g) >= AUTO_HOLD_MIN) return false;
        if (tab === 'pending' && f.reqs && f.reqs.size > 0) {
            // multi-select (OR): baris lolos bila cocok salah satu Tipe Request yang dicentang.
            var reqOk = false;
            f.reqs.forEach(function (v) { if (reqMatchesValue(v, s)) reqOk = true; });
            if (!reqOk) return false;
        }
        if (tab === 'hold') {
            if (f.holdAlasans && f.holdAlasans.size > 0 && !f.holdAlasans.has(holdAlasan(g))) return false;
            if (f.holdStatuses && f.holdStatuses.size > 0 && !f.holdStatuses.has(holdStatusKey(g))) return false;
        }
        if (tab === 'settle') {
            var ds = displaySettleStatus(g);
            if (f.settleStatuses && f.settleStatuses.size > 0 && !f.settleStatuses.has(ds)) return false;
            if (f.metodeSettle && s.metodeSettlement !== f.metodeSettle) return false;
            if (f.channel && (s.channel || (s.request && s.request.channel) || '') !== f.channel) return false;
        }
        if (searchTerm) {
            // by ID Settlement / Nama Pemilik Rekening / No. Rekening
            var hay = (g.groupId + ' ' + g.namaRek + ' ' + g.norek).toLowerCase();
            if (hay.indexOf(searchTerm.toLowerCase()) === -1) return false;
        }
        return true;
    });
}

// ── render ──
// §1.3: Panel Summary per bank tujuan — dinamis dari data tab aktif (respek filter/search).
function renderSummary() {
    var el = document.getElementById('asSummaryPanel');
    if (!el) return;
    // §2: summary di dalam tab Checker, mengikuti filter & search yang aktif.
    if (activeTab !== 'checker') { el.style.display = 'none'; return; }
    var byBank = {};
    tabGroups('checker').forEach(function (g) {
        var b = byBank[g.bank] = byBank[g.bank] || { awal: 0, admin: 0, cbP: 0, cbM: 0, count: 0 };
        b.awal += g.nominalAwal; b.admin += g.admin; b.cbP += (g.adjPlus || 0); b.cbM += (g.adjMinus || 0); b.count++;
    });
    var banks = Object.keys(byBank).sort();
    var th = 'padding:8px 12px;font-size:0.7rem;font-weight:600;color:var(--text-secondary);text-align:right;';
    var tdR = 'padding:7px 12px;text-align:right;font-variant-numeric:tabular-nums;';
    // Total = semua bank (bukan hanya halaman aktif).
    var tAwal = 0, tAdmin = 0, tcbP = 0, tcbM = 0, tEnd = 0, tCount = 0;
    banks.forEach(function (b) { var d = byBank[b]; tAwal += d.awal; tAdmin += d.admin; tcbP += d.cbP; tcbM += d.cbM; tEnd += (d.awal - d.admin + d.cbP - d.cbM); tCount += d.count; });
    // §2: pagination maks 10 bank per halaman.
    var pages = Math.max(1, Math.ceil(banks.length / SUMMARY_PER_PAGE));
    if (summaryPage > pages) summaryPage = pages;
    if (summaryPage < 1) summaryPage = 1;
    var pageBanks = banks.slice((summaryPage - 1) * SUMMARY_PER_PAGE, summaryPage * SUMMARY_PER_PAGE);
    var body = pageBanks.map(function (b, i) {
        var d = byBank[b], end = d.awal - d.admin + d.cbP - d.cbM;
        var no = (summaryPage - 1) * SUMMARY_PER_PAGE + i + 1;
        return '<tr style="border-top:1px solid var(--border-color);">' +
            '<td style="padding:7px 12px;color:var(--text-muted);">' + no + '</td>' +
            '<td style="padding:7px 12px;font-weight:600;">' + esc(b) + '</td>' +
            '<td style="' + tdR + 'color:var(--text-muted);">' + d.count + '</td>' +
            '<td style="' + tdR + '">' + num(d.awal) + '</td>' +
            '<td style="' + tdR + '">' + (d.admin ? '−' + num(d.admin) : '-') + '</td>' +
            '<td style="' + tdR + 'color:#16a34a;">' + (d.cbP ? '+' + num(d.cbP) : '-') + '</td>' +
            '<td style="' + tdR + 'color:#dc2626;">' + (d.cbM ? '−' + num(d.cbM) : '-') + '</td>' +
            '<td style="' + tdR + 'font-weight:700;">' + num(end) + '</td></tr>';
    }).join('');
    var totalRow = '<tr style="border-top:2px solid #c7d2fe;background:#eef2ff;">' +
        '<td style="padding:9px 12px;"></td>' +
        '<td style="padding:9px 12px;font-weight:800;color:#4f46e5;">Total Semua Bank</td>' +
        '<td style="' + tdR + 'font-weight:800;color:#4f46e5;">' + tCount + '</td>' +
        '<td style="' + tdR + 'font-weight:800;">' + num(tAwal) + '</td>' +
        '<td style="' + tdR + 'font-weight:800;">' + (tAdmin ? '−' + num(tAdmin) : '-') + '</td>' +
        '<td style="' + tdR + 'font-weight:800;color:#16a34a;">' + (tcbP ? '+' + num(tcbP) : '-') + '</td>' +
        '<td style="' + tdR + 'font-weight:800;color:#dc2626;">' + (tcbM ? '−' + num(tcbM) : '-') + '</td>' +
        '<td style="' + tdR + 'font-weight:800;color:#4f46e5;">' + num(tEnd) + '</td></tr>';
    var pager = '';
    if (banks.length > SUMMARY_PER_PAGE) {
        pager = '<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--border-color);font-size:0.75rem;color:var(--text-secondary);">' +
            '<span>Halaman ' + summaryPage + ' dari ' + pages + ' · ' + banks.length + ' bank</span>' +
            '<button class="as-sum-pg" data-pg="' + (summaryPage - 1) + '"' + (summaryPage <= 1 ? ' disabled' : '') + ' style="padding:3px 10px;border:1px solid var(--border-color);border-radius:6px;background:#fff;cursor:pointer;' + (summaryPage <= 1 ? 'opacity:.4;cursor:not-allowed;' : '') + '">&lt;</button>' +
            '<button class="as-sum-pg" data-pg="' + (summaryPage + 1) + '"' + (summaryPage >= pages ? ' disabled' : '') + ' style="padding:3px 10px;border:1px solid var(--border-color);border-radius:6px;background:#fff;cursor:pointer;' + (summaryPage >= pages ? 'opacity:.4;cursor:not-allowed;' : '') + '">&gt;</button></div>';
    }
    // §3: panel tetap tampil walau data kosong (isi kosong).
    var inner = banks.length
        ? '<div style="overflow-x:auto;"><table style="width:100%;font-size:0.78rem;border-collapse:collapse;min-width:640px;"><thead><tr>' +
            '<th style="padding:8px 12px;font-size:0.7rem;font-weight:600;color:var(--text-secondary);text-align:left;">No</th>' +
            '<th style="padding:8px 12px;font-size:0.7rem;font-weight:600;color:var(--text-secondary);text-align:left;">Bank Tujuan</th>' +
            '<th style="' + th + '">Rekening</th><th style="' + th + '">Nominal Awal (Rp)</th><th style="' + th + '">Admin (Rp)</th>' +
            '<th style="' + th + '">Chargeback (+) (Rp)</th><th style="' + th + '">Chargeback (−) (Rp)</th><th style="' + th + '">Nominal Ending (Rp)</th>' +
            '</tr></thead><tbody>' + body + totalRow + '</tbody></table></div>' + pager
        : '<div style="padding:22px 12px;text-align:center;color:var(--text-muted);font-size:0.82rem;">Tidak ada data untuk ditampilkan.</div>';
    el.style.display = 'block';
    el.innerHTML = '<div style="border:1px solid var(--border-color);border-radius:10px;overflow:hidden;">' +
        '<div id="asSummaryToggle" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;' + (summaryCollapsed ? '' : 'border-bottom:1px solid var(--border-color);') + 'cursor:pointer;">' +
        '<span style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:0.85rem;"><i class="fas fa-chevron-' + (summaryCollapsed ? 'right' : 'down') + '" style="font-size:0.7rem;color:var(--text-muted);width:10px;"></i>Ringkasan Nominal per Bank Tujuan</span>' +
        '<span style="font-size:0.7rem;color:var(--text-muted);">Mengikuti filter aktif · ending = awal − admin + chargeback</span></div>' +
        (summaryCollapsed ? '' : inner) + '</div>';
    var tgl = document.getElementById('asSummaryToggle');
    if (tgl) tgl.addEventListener('click', function () { summaryCollapsed = !summaryCollapsed; renderSummary(); });
    el.querySelectorAll('.as-sum-pg').forEach(function (b) { b.addEventListener('click', function () { summaryPage = +b.dataset.pg; renderSummary(); }); });
}

// §1: sticky message di atas tabel (Checker & Hold) — TIDAK bisa ditutup; hilang sendiri
// saat tidak ada lagi hold Dibawah Min. Transaksi yang bisa dirilis.
function renderAccumSticky() {
    var el = document.getElementById('asAccumSticky');
    if (!el) return;
    var n = accumReleasableCount();
    if (!(n > 0 && activeTab === 'checker')) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.style.cssText = 'position:sticky;top:0;z-index:20;margin-bottom:12px;background:#ecfdf5;border:1px solid #16a34a;border-radius:8px;padding:10px 14px;display:flex;gap:10px;align-items:center;';
    el.innerHTML = '<i class="fas fa-circle-check" style="color:#16a34a;"></i>' +
        '<div style="font-size:0.82rem;color:#065f46;line-height:1.4;"><b>Beberapa Settlement Hold Dibawah Min. Transaksi sudah bisa dirilis</b> — buka tab Hold, lalu filter status Siap Release.</div>';
    el.style.display = 'flex';
}

function render() {
    computeReleasable();
    renderCounts();
    renderTabsActive();
    renderToolbarActions();
    renderTable();
    renderSummary();
    renderBulkBar();
    renderAccumSticky();
    // Export dihapus di tab Approver. Export Segregasi hanya di tab Settle.
    var exBtn = document.getElementById('asExportBtn');
    if (exBtn) exBtn.style.display = (activeTab === 'pending') ? 'none' : '';
    var segBtn = document.getElementById('asExportSegBtn');
    if (segBtn) segBtn.style.display = (activeTab === 'settle') ? '' : 'none';
    // Report Manajemen = summary harian settlement — hanya relevan di tab Settle.
    var mgmtBtn = document.getElementById('asExportMgmtBtn');
    if (mgmtBtn) mgmtBtn.style.display = (activeTab === 'settle') ? '' : 'none';
}

function renderCounts() {
    ['checker', 'pending', 'hold', 'reject', 'settle'].forEach(function (tab) {
        var id = tab === 'pending' ? 'cnt-approver' : 'cnt-' + tab;
        var el = document.getElementById(id);
        if (el) el.textContent = groups.filter(function (g) { var s = st(g.groupId); return tab === 'pending' ? (s.status === 'pending' || s.autoReq) : tab === 'hold' ? (s.status === 'hold' || s.everHeld) : s.status === tab; }).length;
    });
}

function renderTabsActive() {
    document.querySelectorAll('.as-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === uiTab()); });
}
function uiTab() { return activeTab === 'pending' ? 'approver' : activeTab; }

function columnsFor(tab) {
    var cols = BASE_COLS.slice();
    if (tab === 'pending') cols.push('Request');
    if (tab === 'hold') cols.push('Alasan', 'Status Hold'); // §4.5 status ledger hold (aktif / sudah diproses)
    if (tab === 'settle') cols.push('Channel Payment', 'Metode Settlement', 'Status');
    return cols;
}

function renderTable() {
    var thead = document.getElementById('asThead');
    var tbody = document.getElementById('asTableBody');
    var cols = columnsFor(activeTab);
    // Bulk mode: Checker / Approver. Hold & Reject & Settle tanpa bulk (per-baris saja).
    var hasCb = (activeTab === 'checker' || activeTab === 'pending') && bulkMode;
    var headHtml = '<tr>';
    if (hasCb) headHtml += '<th style="width:38px;text-align:center;"><input type="checkbox" id="asSelectAll"></th>';
    cols.forEach(function (c) {
        var align = (c.indexOf('Nominal') >= 0 || c.indexOf('Admin') >= 0 || c.indexOf('Adj') >= 0 || c.indexOf('Total') >= 0) ? ' style="text-align:right;"' : '';
        headHtml += '<th' + align + '>' + c + '</th>';
    });
    headHtml += '<th style="text-align:center;width:120px;">Aksi</th></tr>';
    thead.innerHTML = headHtml;

    var groupRows = tabGroups(activeTab);
    // §4: tab Settle — settlement yang dipecah (settleParts) ditampilkan sebagai >1 baris.
    var rows = [];
    if (activeTab === 'settle') {
        groupRows.forEach(function (g) {
            var parts = st(g.groupId).settleParts;
            if (parts && parts.length > 1) parts.forEach(function (amt, k) { rows.push({ g: g, pIdx: k, pAmt: amt, pN: parts.length }); });
            else rows.push({ g: g });
        });
    } else { rows = groupRows.map(function (g) { return { g: g }; }); }
    var totalSpan = cols.length + 1 + (hasCb ? 1 : 0);
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="' + totalSpan + '" style="text-align:center;padding:36px;color:var(--text-muted);">Tidak ada data</td></tr>';
        renderPager(0);
        return;
    }
    var pages = Math.ceil(rows.length / PER_PAGE);
    if (page > pages) page = pages;
    var slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    tbody.innerHTML = slice.map(function (v, idx) {
        var g = v.g, part = (v.pIdx != null) ? v : null;
        var s = st(g.groupId);
        var no = (page - 1) * PER_PAGE + idx + 1;
        var c = '<tr>';
        // Hold ledger yang sudah diproses tidak bisa di-bulk (view-only) → sel checkbox kosong.
        var rowCb = hasCb && !(activeTab === 'hold' && s.status !== 'hold');
        if (hasCb) c += '<td style="text-align:center;">' + (rowCb ? '<input type="checkbox" class="as-cb" data-id="' + g.groupId + '" ' + (selected.has(g.groupId) ? 'checked' : '') + '>' : '') + '</td>';
        c += '<td>' + no + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(g.procDisplay) + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + (updatedOf(g) ? esc(updatedOf(g)) : '<span style="color:var(--text-muted);">-</span>') + '</td>';
        var idDisp = part ? esc(g.groupId) + ' <span style="color:#4f46e5;font-weight:700;">#' + (part.pIdx + 1) + '/' + part.pN + '</span>' : esc(g.groupId) + mergeBadge(g);
        c += '<td style="min-width:150px;"><a class="as-link" data-detail="settle" data-id="' + g.groupId + '" style="font-family:monospace;font-size:0.78rem;white-space:normal;word-break:break-all;">' + idDisp + '</a></td>';
        if (part) {
            c += '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(part.pAmt) + '</td>';
            c += '<td style="text-align:right;">-</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td>';
            c += '<td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">' + num(part.pAmt) + '</td>';
        } else {
            c += '<td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(g.nominalAwal) + '</td>';
            c += '<td style="text-align:right;">' + (g.admin ? num(g.admin) : '-') + '</td>';
            c += '<td style="text-align:right;color:#16a34a;">' + (g.adjPlus ? '+' + num(g.adjPlus) : '-') + '</td>';
            c += '<td style="text-align:right;color:#dc2626;">' + (g.adjMinus ? '−' + num(g.adjMinus) : '-') + '</td>';
            c += '<td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">' + num(totalOf(g)) + '</td>';
        }
        c += '<td>' + esc(g.bank) + '</td>';
        c += '<td style="font-variant-numeric:tabular-nums;">' + esc(g.norek) + '</td>';
        c += '<td>' + esc(g.namaRek) + '</td>';
        if (activeTab === 'pending') {
            if (s.autoReq) {
                var acol = s.autoReq.type === 'rejectbybank' ? '#7c3aed' : '#0e7490';
                c += '<td><span class="as-req-badge" style="background:' + acol + '22;color:' + acol + ';white-space:normal;display:inline-block;line-height:1.3;">' + esc(AUTOREQ_LABEL[s.autoReq.type] || s.autoReq.type) + '</span></td>';
            } else {
                var rq = s.request || {};
                var col = rq.type === 'settle' ? '#16a34a' : (rq.type === 'reject' ? '#dc2626' : (rq.type === 'rejectbybank' ? '#7c3aed' : '#b45309'));
                var lbl = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type === 'settle' ? 'Settle' : (rq.type === 'reject' ? 'Reject' : (rq.type === 'rejectbybank' ? 'Reject by Bank' : '-')));
                c += '<td><span class="as-req-badge" style="background:' + col + '22;color:' + col + ';white-space:normal;display:inline-block;line-height:1.3;">' + esc(lbl) + '</span></td>';
            }
        }
        if (activeTab === 'hold') {
            c += '<td>' + esc(SCOPE_LABEL[holdAlasan(g)] || '-') + '</td>';
            c += '<td>' + holdStatusChip(g) + '</td>';
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
        var syncHeader = function () { if (all) all.checked = slice.length > 0 && slice.every(function (v) { return selected.has(v.g.groupId); }); };
        syncHeader();
        if (all) all.addEventListener('change', function () {
            var on = all.checked;
            slice.forEach(function (v) { on ? selected.add(v.g.groupId) : selected.delete(v.g.groupId); });
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
    // §4.5 Hold ledger: baris aktif bisa dirilis; baris yang sudah diproses (pindah tab) view-only.
    if (activeTab === 'hold') return (st(g.groupId).status === 'hold') ? [['rilis', 'Rilis ke Checker'], ['catatan', 'Lihat Bukti']] : [['catatan', 'Lihat Bukti']];
    // Tab Reject sama seperti Hold: hanya bisa Rilis ke Checker + Lihat Bukti (rilis kirim notif ke Approver).
    if (activeTab === 'reject') return [['rilis', 'Rilis ke Checker'], ['catatan', 'Lihat Bukti']];
    if (activeTab === 'settle') {
        var acts = [['detail', 'Lihat Detail']];
        // Reject by Bank hanya tersedia untuk item dengan Metode Settlement = Manual.
        if (g && st(g.groupId).metodeSettlement === 'Manual') acts.push(['rejectbybank_item', 'Reject by Bank']);
        return acts;
    }
    return [];
}
function actionButtons(g) {
    // §4: saat Bulk Aksi aktif, tombol aksi single dinonaktifkan di semua kolom.
    var disabled = 'opacity:.4;pointer-events:none;cursor:not-allowed;';
    if (activeTab === 'pending') {
        var ar = st(g.groupId).autoReq;
        // Rilis ke Checker & Reject by Bank = auto-approve → tak ada tombol, hanya teks status perpindahan (data tetap ada).
        if (ar) {
            return '<span style="font-size:0.74rem;font-weight:600;color:#0e7490;white-space:normal;line-height:1.3;display:inline-block;"><i class="fas fa-bolt" style="margin-right:5px;"></i>' + esc(autoReqText(ar)) + '</span>';
        }
        return '<button class="as-approval-btn btn" data-id="' + g.groupId + '" ' + (bulkMode ? 'disabled' : '') + ' style="margin:0;background:var(--primary);color:#fff;border:none;font-size:0.78rem;font-weight:600;padding:6px 14px;' + (bulkMode ? disabled : '') + '">Approval</button>';
    }
    if (actionMenuItems(g).length === 0) return '<span style="color:var(--text-muted);">—</span>';
    return '<button class="as-kebab" data-id="' + g.groupId + '" title="' + (bulkMode ? 'Nonaktif saat Bulk Aksi' : 'Aksi') + '" ' + (bulkMode ? 'disabled' : '') + ' style="background:none;border:none;color:var(--text-secondary);font-size:1.1rem;padding:4px 10px;' + (bulkMode ? disabled : 'cursor:pointer;') + '"><i class="fas fa-ellipsis-vertical"></i></button>';
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
    var bulkBtn = '<button class="btn" id="asBulkBtn" style="margin:0;background:' + (bulkMode ? 'var(--primary)' : '#1e293b') + ';color:#fff;border:none;font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-check-double"></i> ' + (bulkMode ? 'Tutup Bulk Aksi' : 'Bulk Aksi') + '</button>';
    // §2: tab Hold & Reject tanpa bulk — hanya rilis ke Checker per baris.
    if (activeTab === 'checker' || activeTab === 'pending') {
        box.innerHTML = bulkBtn;
        // §7: Approver — toggle simulasi 2FA salah.
        if (activeTab === 'pending') {
            box.innerHTML += '<button class="btn" id="asSim2faBtn" title="Bila aktif, PIN 2FA yang dimasukkan akan dianggap salah" style="margin:0 0 0 8px;background:' + (sim2faWrong ? '#dc2626' : '#fff') + ';color:' + (sim2faWrong ? '#fff' : 'var(--text-secondary)') + ';border:1px solid ' + (sim2faWrong ? '#dc2626' : 'var(--border-color)') + ';font-size:0.8rem;font-weight:600;padding:9px 14px;"><i class="fas fa-triangle-exclamation"></i> Simulasi 2FA Salah: ' + (sim2faWrong ? 'ON' : 'OFF') + '</button>';
        }
        document.getElementById('asBulkBtn').addEventListener('click', function () { bulkMode = !bulkMode; if (!bulkMode) selected.clear(); render(); });
        var s2 = document.getElementById('asSim2faBtn');
        if (s2) s2.addEventListener('click', function () { sim2faWrong = !sim2faWrong; render(); });
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
    var bulkTabs = ['checker', 'pending'];
    if (bulkTabs.indexOf(activeTab) === -1 || !bulkMode) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    document.getElementById('asBulkCount').textContent = selected.size;
    var show = selected.size > 0;
    // §1.6/§5.3: aksi bulk per tab. Approver (pending): Approve/Reject (2FA).
    var avail = { checker: ['hold', 'reject', 'settle'], pending: ['approve', 'rejectreq'] }[activeTab] || [];
    var setBtn = function (id, act) { document.getElementById(id).style.display = (show && avail.indexOf(act) >= 0) ? 'inline-flex' : 'none'; };
    setBtn('asBulkApprove', 'approve');
    setBtn('asBulkRejectReq', 'rejectreq');
    setBtn('asBulkHold', 'hold');
    setBtn('asBulkReject', 'reject');
    setBtn('asBulkSettle', 'settle');
    document.getElementById('asUnselectAll').style.display = show ? 'inline-flex' : 'none';
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
        '<th style="' + thR + '">Nominal Settle (Rp)</th><th style="' + thR + '">Adjustment Chargeback (+) (Rp)</th><th style="' + thR + '">Adjustment Chargeback (−) (Rp)</th>' +
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
        '<select id="asMetodeSettle"><option value="">Pilih metode settlement…</option><option value="Manual">Manual</option><option value="Otomatis" disabled>Otomatis (Fase 2)</option></select>' +
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

// §10: BI-FAST limit Rp250 juta/transaksi. Merchant Indonusa dikecualikan (selalu BI-FAST).
function isIndonusa(g) { return /indonusa/i.test(g.namaRek || '') || (g.txns || []).some(function (t) { return /indonusa/i.test(t.merchantName || ''); }); }
function overBifastLimit(g) { return !isIndonusa(g) && totalOf(g) > BIG_THRESHOLD; }
function bifastGuardOk(g, metode) {
    if (metode === 'BI-Fast' && overBifastLimit(g)) {
        showToast('Melebihi Limit BI-FAST', g.namaRek + ': nominal > Rp250 juta tidak bisa via BI-FAST. Pecah manual atau pakai RTGS (> Rp500 juta).');
        return false;
    }
    return true;
}

// Info data terpilih untuk modal aksi single (tanpa ID Settlement).
function selInfo(g) {
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    return '<div style="margin-bottom:14px;">' +
        kv('Bank', esc(g.bank)) + kv('Nomor Rekening', esc(g.norek)) +
        kv('Nama Pemilik Rekening', esc(g.namaRek)) + kv('Nominal Settle', '<b>' + rupiah(totalOf(g)) + '</b>') +
        '</div>';
}

// ── checker actions (operate on the settlement GROUP) ──
function openHold(g) {
    var body = selInfo(g) + '<div class="as-fld"><label>Cakupan Hold</label>' +
        '<label style="font-weight:500;display:block;"><input type="radio" name="asHoldScope" value="all" checked> Hold Semua</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="partial"> Hold Partial (pilih MID)</label>' +
        '<label style="font-weight:500;display:block;margin-top:4px;"><input type="radio" name="asHoldScope" value="min"> Hold Dibawah Min. Transaksi <span style="font-weight:400;color:var(--text-muted);">(hold seluruh settlement norek ini)</span></label></div>' +
        '<div class="as-fld" id="asPartialWrap" style="display:none;"><label>Pilih MID & nominal yang dihold <span style="font-weight:400;color:var(--text-muted);">(kosongkan nominal = hold seluruh dana MID)</span></label><div class="as-partial-list" id="asPartialList">' +
        midSummary(g).map(function (m, i) {
            var maxHold = m.total - 1;
            return '<div style="padding:7px 0;border-bottom:1px solid #f1f5f9;">' +
                '<label style="display:flex;align-items:flex-start;gap:8px;font-weight:500;font-size:0.82rem;"><input type="checkbox" class="as-pp" value="' + esc(m.mid) + '" data-total="' + m.total + '" ' + (i === 0 ? 'checked' : '') + '> <span>' + esc(m.merchant) + ' · ' + esc(m.mid) + ' · ' + m.count + ' transaksi · <b>' + rupiah(m.total) + '</b></span></label>' +
                '<div style="display:flex;align-items:center;gap:6px;margin:6px 0 0 24px;font-size:0.78rem;color:var(--text-secondary);">Hold Rp <input type="number" class="as-pp-amt" data-mid="' + esc(m.mid) + '" min="1" max="' + maxHold + '" placeholder="penuh" style="width:130px;padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;font-size:0.8rem;"> <span style="font-size:0.72rem;">maks ' + rupiah(maxHold) + ' · kosong = penuh</span></div>' +
                '</div>';
        }).join('') +
        '</div></div>' + noteField(true) + fileField('(opsional — maks 25 MB, PDF/JPG/JPEG/PNG, bisa menyusul di tab Hold)');
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
    var picked = null, holdAmounts = null;
    if (scope === 'partial') {
        var boxes = Array.from(document.querySelectorAll('.as-pp:checked'));
        picked = boxes.map(function (c) { return c.value; });
        if (!picked.length) { showToast('Pilih MID', 'Pilih minimal satu MID untuk hold partial.'); return; }
        // Nominal hold per MID: kosong = hold penuh; isi = partial (Rp1 … total−1).
        var amts = {}, anyPartial = false, bad = null;
        boxes.forEach(function (cb) {
            if (bad) return;
            var mid = cb.value, total = +cb.getAttribute('data-total');
            var amtEl = document.querySelector('.as-pp-amt[data-mid="' + mid + '"]');
            var raw = (amtEl && amtEl.value || '').trim();
            if (raw === '') { amts[mid] = total; return; } // hold seluruh dana MID
            var n = Math.floor(Number(raw));
            if (!(n >= 1 && n <= total - 1)) { bad = { mid: mid, total: total }; return; }
            amts[mid] = n; anyPartial = true;
        });
        if (bad) { showToast('Nominal Hold Tidak Valid', 'Nominal hold ' + bad.mid + ' harus Rp1 – ' + rupiah(bad.total - 1) + ', atau kosongkan untuk hold seluruh dana MID.'); return; }
        holdAmounts = anyPartial ? amts : null;
    }
    var bk = validateBukti(null); // §3.2: bukti opsional semua jenis hold (boleh menyusul di tab Hold).
    if (!bk) return;
    if (scope === 'partial') {
        // Pecah: MID yang dihold jadi settlement baru terpisah; sisa MID tetap di Checker.
        var seq = splits.filter(function (x) { return x.norek === g.norek && (x.bank || g.bank) === g.bank; }).length + 1;
        var splitId = g.groupId + '-P' + seq;
        splits.push({ id: splitId, norek: g.norek, bank: g.bank, mids: picked, holdAmounts: holdAmounts, createdTs: todayProc() });
        items[splitId] = { status: 'pending', adjPlus: 0, adjMinus: 0, note: '', channel: '', bukti: '', settleStatus: null, approvedTs: null, approvedBy: null, metodeSettlement: null,
            request: { type: 'hold', scope: 'partial', partialMids: picked, holdAmounts: holdAmounts, prevStatus: 'checker', reason: reason, bukti: bk.name, ts: todayProc() } };
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
    var body = selInfo(g) + noteField(true) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
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

// §5.5/§6: breakdown konfirmasi settle — grouping per BANK TUJUAN, tiap bank list norek + qty transaksi + nominal akhir.
function settleGroupedHTML(arr) {
    var byBank = {};
    arr.forEach(function (g) {
        var b = byBank[g.bank] = byBank[g.bank] || { rows: [], tx: 0, total: 0 };
        b.rows.push(g); b.tx += (g.txns ? g.txns.length : 0); b.total += totalOf(g);
    });
    var grand = arr.reduce(function (a, g) { return a + totalOf(g); }, 0);
    var blocks = Object.keys(byBank).sort().map(function (b) {
        var d = byBank[b];
        var list = d.rows.slice().sort(function (x, y) { return String(x.norek).localeCompare(String(y.norek)); }).map(function (g) {
            return '<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 12px;font-size:0.78rem;border-top:1px solid var(--border-color);">' +
                '<span style="font-variant-numeric:tabular-nums;">' + esc(g.norek) + ' · <span style="color:var(--text-secondary);">' + esc(g.namaRek) + '</span></span>' +
                '<span style="font-variant-numeric:tabular-nums;font-weight:600;">' + num(totalOf(g)) + '</span></div>';
        }).join('');
        return '<div style="border:1px solid var(--border-color);border-radius:8px;overflow:hidden;margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 12px;background:#f8fafc;">' +
            '<span style="font-weight:700;font-size:0.85rem;">' + esc(b) + '</span>' +
            '<span style="font-size:0.72rem;color:var(--text-secondary);">' + d.rows.length + ' rekening · ' + d.tx + ' transaksi · <b style="color:var(--text-primary);">' + rupiah(d.total) + '</b></span></div>' +
            list + '</div>';
    }).join('');
    return '<div style="font-weight:700;font-size:0.85rem;margin:12px 0 8px;">Breakdown per Bank Tujuan</div>' + blocks +
        '<div class="as-kv" style="margin-top:6px;border-top:2px solid #cbd5e1;padding-top:10px;"><span style="font-weight:700;">Grand Total Settlement</span><span style="font-weight:800;">' + rupiah(grand) + '</span></div>';
}
function settleSummaryHTML(arr, ms, tf) {
    var kv = function (k, v) { return '<div class="as-kv"><span>' + k + '</span><span>' + v + '</span></div>'; };
    return kv('Metode Settlement', esc(ms)) + kv('Channel Payment (sumber dana)', esc(tf.channel)) + kv('Metode Transfer', esc(tf.metode)) +
        kv('Jumlah Baris (entry settlement)', arr.length) + settleGroupedHTML(arr);
}

// §10: pecah nominal > Rp250 juta jadi beberapa transfer BI-FAST secara otomatis.
// Greedy: isi penuh Rp250 juta per transfer, sisanya jadi transfer terakhir.
// Contoh 470 juta → [250 juta, 220 juta].
function splitBifast(total, limit) {
    limit = limit || BIG_THRESHOLD;
    var arr = [], rem = total;
    while (rem > limit) { arr.push(limit); rem -= limit; }
    arr.push(rem);
    return arr;
}
// self-check: setiap pecahan ≤ limit dan jumlahnya = total (jalan sekali saat load)
console.assert(JSON.stringify(splitBifast(470000000)) === JSON.stringify([250000000, 220000000]) &&
    splitBifast(600000000).reduce(function (a, b) { return a + b; }, 0) === 600000000, 'splitBifast invariant');

function splitPreviewHTML(total) {
    var chunks = splitBifast(total);
    var rows = chunks.map(function (amt, i) {
        return '<tr><td style="padding:5px 10px;">BI-FAST Transfer ' + (i + 1) + '</td><td style="padding:5px 10px;text-align:right;font-variant-numeric:tabular-nums;">' + rupiah(amt) + '</td></tr>';
    }).join('');
    return '<div style="margin-top:14px;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">' +
        '<div style="font-weight:700;font-size:0.82rem;color:#b45309;margin-bottom:6px;">Pecah Otomatis Settlement menjadi:</div>' +
        '<table style="width:100%;font-size:0.8rem;"><tbody>' + rows + '</tbody></table></div>';
}
function openSettle(g) {
    var warn = overBifastLimit(g) ? '<p style="font-size:0.8rem;padding:8px 12px;background:#fff7ed;color:#b45309;border-radius:6px;margin-bottom:14px;"><i class="fas fa-triangle-exclamation"></i> Nominal &gt; Rp250 juta — bila pakai BI-FAST, settlement <b>dipecah otomatis</b> jadi beberapa transfer &le; Rp250 juta. Alternatif: RTGS (&gt; Rp500 juta).</p>' : '';
    var body = selInfo(g) + warn +
        metodeSettlementField() + channelField() + metodeField() + noteField(false) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Settle Transaksi', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Lanjut', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ms = document.getElementById('asMetodeSettle').value;
            if (!ms) { showToast('Metode Wajib', 'Pilih Metode Settlement.'); return; }
            var tf = validateTransfer(); if (!tf) return;
            var bk = validateBukti(null); if (!bk) return;
            var reason = document.getElementById('asReason').value.trim();
            // §4/§10: konfirmasi single = kalimat ringkas. BI-FAST > Rp250 juta → tawarkan Pecah Manual.
            var overBif = tf.metode === 'BI-Fast' && overBifastLimit(g);
            var pecah = overBif ? splitBifast(totalOf(g)).length : 0;
            var confirmBody = '<p style="font-size:0.9rem;line-height:1.65;">Konfirmasi Pengajuan Settle ke <b>' + esc(g.norek) + '</b> dari bank <b>' + esc(g.bank) + '</b> dengan nama pemilik <b>' + esc(g.namaRek) + '</b> sebesar <b>' + rupiah(totalOf(g)) + '</b>.</p>' +
                (overBif ? splitPreviewHTML(totalOf(g)) : '');
            openModal('Konfirmasi Settle', confirmBody, [
                { label: 'Batal', onClick: closeModal },
                { label: 'Konfirmasi & Ajukan', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
                    var s = st(g.groupId); var prev = s.status; s.status = 'pending';
                    var metode = overBif ? 'BI-Fast (Pecah Otomatis)' : tf.metode;
                    s.request = { type: 'settle', metodeSettlement: ms, channel: tf.channel, metode: metode, pecahOtomatis: pecah, prevStatus: prev, reason: reason, bukti: bk.name, ts: todayProc() };
                    saveItems(); closeModal(); render();
                    showToast('Settle Diajukan', overBif ? ('Nominal dipecah otomatis jadi ' + pecah + ' transfer BI-FAST.') : (ms === 'Manual' ? 'Sistem hanya mencatat settlement (tidak kirim uang ke bank).' : 'Sistem mencatat settlement dan mengirim uang ke bank.'));
                    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Ajukan Settle ' + g.groupId + ' [' + ms + '] via ' + tf.channel + ' / ' + metode + (overBif ? (' — pecah ' + pecah + ' transfer') : ''));
                } }
            ]);
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

// §5.3 Bulk approve/reject request (Approver) — 2FA sekali untuk semua.
function bulkApproverDecide(approve) {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu request.'); return; }
    var ids = Array.from(selected);
    var body = '<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">' + (approve ? 'Approve' : 'Reject') + ' <b>' + ids.length + '</b> request terpilih sekaligus.</p>' +
        '<p style="font-size:0.78rem;color:var(--text-muted);">Bulk tidak menampilkan catatan/bukti per item — untuk kasus yang perlu diperiksa, tinjau satu-satu.</p>';
    // §6: khusus Bulk Approve, tampilkan breakdown per bank untuk request settle terpilih.
    if (approve) {
        var settleArr = ids.map(groupById).filter(function (g) { return g && st(g.groupId).status === 'pending' && (st(g.groupId).request || {}).type === 'settle'; });
        if (settleArr.length) body += settleGroupedHTML(settleArr);
    }
    openModal(approve ? 'Bulk Approve' : 'Bulk Reject', body, [
        { label: 'Batal', onClick: closeModal },
        { label: approve ? 'Lanjut Approve' : 'Lanjut Reject', style: 'background:' + (approve ? '#16a34a' : '#dc2626') + ';color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            require2FA(approve ? 'Verifikasi 2FA — Bulk Approve' : 'Verifikasi 2FA — Bulk Reject', function () {
                ids.forEach(function (id) { var g = groupById(id); if (g && st(g.groupId).status === 'pending') approverDecide(g, approve); });
                selected.clear(); bulkMode = false; closeModal(); render();
                showToast(approve ? 'Bulk Approve Selesai' : 'Bulk Reject Selesai', ids.length + ' request diproses.');
                writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk ' + (approve ? 'Approve' : 'Reject') + ' ' + ids.length + ' request');
            });
        } }
    ]);
}

// §1.6 Bulk Hold — semua baris terpilih di-hold (Hold Semua), catatan sama untuk semua, bukti opsional.
function openBulkHold() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk Hold <b>' + selected.size + '</b> entry terpilih (Hold Semua). Catatan berlaku untuk semua baris.</p>' +
        noteField(true) + fileField('(opsional — bisa menyusul di tab Hold)');
    openModal('Bulk Hold', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Hold', style: 'background:#b45309;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan hold.'); return; }
            var bk = validateBukti(null); if (!bk) return;
            var ids = Array.from(selected);
            ids.forEach(function (id) { var s = st(id); var prev = s.status; s.status = 'pending'; s.request = { type: 'hold', scope: 'all', prevStatus: prev, reason: reason, bukti: bk.name, ts: todayProc() }; });
            selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Hold Diajukan', ids.length + ' entry menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Hold ' + ids.length + ' entry');
        } }
    ]);
}

// §1.6 Bulk Reject — catatan sama untuk semua, bukti opsional.
function openBulkReject() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk Reject <b>' + selected.size + '</b> entry terpilih. Catatan berlaku untuk semua baris.</p>' +
        noteField(true) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Bulk Reject', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Ajukan Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan reject.'); return; }
            var bk = validateBukti(null); if (!bk) return;
            var ids = Array.from(selected);
            ids.forEach(function (id) { var s = st(id); var prev = s.status; s.status = 'pending'; s.request = { type: 'reject', prevStatus: prev, reason: reason, bukti: bk.name, ts: todayProc() }; });
            selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Reject Diajukan', ids.length + ' entry menunggu approval.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Reject ' + ids.length + ' entry');
        } }
    ]);
}

function openBulkSettle() {
    if (selected.size === 0) { showToast('Tidak Ada Pilihan', 'Pilih minimal satu baris.'); return; }
    var body = '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Bulk settle <b>' + selected.size + '</b> entry terpilih.</p>' + metodeSettlementField() + channelField() + metodeField();
    openModal('Bulk Settle', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Lanjut', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var ms = document.getElementById('asMetodeSettle').value;
            if (!ms) { showToast('Metode Wajib', 'Pilih Metode Settlement.'); return; }
            var tf = validateTransfer(); if (!tf) return;
            if (tf.metode === 'BI-Fast') {
                var over = Array.from(selected).map(groupById).filter(function (g) { return g && overBifastLimit(g); });
                if (over.length) { showToast('Melebihi Limit BI-FAST', over.length + ' entry > Rp250 juta. Pakai RTGS, atau settle satu per satu agar dipecah otomatis.'); return; }
            }
            var ids = Array.from(selected);
            var arr = ids.map(groupById).filter(Boolean);
            openModal('Konfirmasi Bulk Settle', settleSummaryHTML(arr, ms, tf), [
                { label: 'Batal', onClick: closeModal },
                { label: 'Konfirmasi & Ajukan', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
                    ids.forEach(function (id) { var s = st(id); var prev = s.status; s.status = 'pending'; s.request = { type: 'settle', metodeSettlement: ms, channel: tf.channel, metode: tf.metode, prevStatus: prev, reason: '', bukti: '', ts: todayProc() }; });
                    selected.clear(); saveItems(); closeModal(); render(); showToast('Bulk Settle Diajukan', ids.length + ' entry menunggu approval.');
                    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Bulk Settle ' + ids.length + ' entry [' + ms + '] via ' + tf.channel + ' / ' + tf.metode);
                } }
            ]);
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
    var reqLabel = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type === 'rejectbybank' ? 'Reject by Bank' : (rq.type ? rq.type.charAt(0).toUpperCase() + rq.type.slice(1) : '-'));
    var buktiVal = rq.bukti
        ? esc(rq.bukti) + ' <button type="button" id="asBuktiBtn" class="btn" style="margin-left:8px;padding:3px 12px;font-size:0.74rem;background:var(--primary);color:#fff;border:none;font-weight:600;">Lihat</button>'
        : '<span style="color:var(--text-muted);">tidak ada</span>';
    var reqSection = '<div style="margin-top:18px;font-weight:700;font-size:0.9rem;margin-bottom:6px;">Detail Request</div>' +
        kv('Tipe Request', esc(reqLabel)) +
        (rq.type === 'hold' && rq.scope === 'partial' && rq.partialMids ? kv('MID Dihold', esc(partialMidsLabel(rq))) : '') +
        kv('Status Sebelumnya', esc(STATUS_LABEL[rq.prevStatus] || 'Checker')) +
        (rq.metodeSettlement ? kv('Metode Settlement', esc(rq.metodeSettlement)) : '') +
        kv('Channel Payment', esc(rq.channel || '-')) + kv('Metode Transfer', esc(rq.metode || '-')) +
        kv('Catatan', esc(rq.reason || '-')) + kv('Bukti', buktiVal) + kv('Waktu Diajukan', esc(rq.ts || '-'));
    // §3: notice GABUNG — data belum digabung saat approval (ada kemungkinan reject); digabung setelah approve.
    if (rq.type === 'settle') {
        var relMin = groups.filter(function (x) { var xs = st(x.groupId); return x.norek === g.norek && x.bank === g.bank && x.groupId !== g.groupId && !xs.mergedInto && xs.holdScope === 'min' && (xs.status === 'checker' || xs.status === 'hold'); });
        if (relMin.length) {
            var relTot = relMin.reduce(function (a, x) { return a + totalOf(x); }, 0);
            reqSection += '<p style="margin-top:12px;font-size:0.8rem;padding:8px 12px;background:#ecfeff;color:#0e7490;border-radius:6px;"><i class="fas fa-layer-group"></i> <b>Akan digabung setelah approve</b>: norek ini punya ' + relMin.length + ' transaksi dibawah min (' + rupiah(relTot) + '). Data <b>belum digabung sekarang</b> (bisa direject); setelah approve baru digabung jadi 1 settlement.</p>';
        }
    }
    // §4: notice PECAH — data belum dipecah saat approval; dipecah setelah approve bila BI-FAST > Rp250 juta.
    if (rq.type === 'settle' && rq.pecahOtomatis && rq.pecahOtomatis > 1) {
        reqSection += '<p style="margin-top:12px;font-size:0.8rem;padding:8px 12px;background:#fff7ed;color:#b45309;border-radius:6px;"><i class="fas fa-triangle-exclamation"></i> <b>Akan dipecah setelah approve</b>: nominal &gt; Rp250 juta via BI-FAST. Data <b>belum dipecah sekarang</b> (bisa direject); setelah approve baru dipecah jadi <b>' + rq.pecahOtomatis + ' settlement</b> (greedy 250 juta + sisa).</p>';
    }
    openModal('Detail Request', detailBodyHTML(g) + reqSection, [
        { label: 'Cancel', onClick: closeModal },
        { label: 'Reject', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { confirmApprover(g, false); } },
        { label: 'Approve', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () { confirmApprover(g, true); } }
    ], '880px');
    var bb = document.getElementById('asBuktiBtn');
    if (bb) bb.addEventListener('click', function () { openBukti(rq.bukti); });
}
// §5.2: 2FA wajib saat approve & reject. Mock: PIN 6 digit.
function require2FA(title, onOk) {
    var body = '<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;"><i class="fas fa-shield-halved" style="color:var(--primary);margin-right:6px;"></i>Masukkan <b>PIN 2FA</b> (6 digit) untuk melanjutkan.</p>' +
        '<div class="as-fld"><label>PIN 2FA <span style="color:#ef4444;">*</span></label><input type="password" id="as2fa" inputmode="numeric" maxlength="6" placeholder="••••••" style="letter-spacing:6px;font-size:1.1rem;text-align:center;"></div>';
    openModal(title, body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Verifikasi', style: 'background:var(--primary);color:#fff;border:none;padding:8px 20px;font-weight:600;', onClick: function () {
            var pin = (document.getElementById('as2fa').value || '').trim();
            if (!/^\d{6}$/.test(pin)) { showToast('PIN Tidak Valid', 'PIN 2FA harus 6 digit angka.'); return; }
            if (sim2faWrong) { showToast('Verifikasi 2FA Gagal', 'PIN 2FA yang dimasukkan salah. Silakan coba lagi.'); document.getElementById('as2fa').value = ''; return; }
            onOk();
        } }
    ]);
    var el = document.getElementById('as2fa'); if (el) el.focus();
}
function confirmApprover(g, approve) {
    var verb = approve ? 'menyetujui' : 'menolak';
    var body = '<p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">Yakin ingin <b>' + verb + '</b> request untuk <b>' + esc(g.groupId) + '</b>?</p>';
    openModal(approve ? 'Konfirmasi Approve' : 'Konfirmasi Reject', body, [
        { label: 'Batal', onClick: function () { openApproverModal(g); } },
        { label: approve ? 'Ya, Approve' : 'Ya, Reject', style: 'background:' + (approve ? '#16a34a' : '#dc2626') + ';color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            require2FA(approve ? 'Verifikasi 2FA — Approve' : 'Verifikasi 2FA — Reject', function () { approverDecide(g, approve); closeModal(); });
        } }
    ]);
}
function approverDecide(g, approve) {
    var s = st(g.groupId); var rq = s.request || {};
    s.updatedTs = todayProc(); // record berubah → perbarui Tanggal Perubahan Terakhir
    if (approve) {
        if (rq.type === 'rejectbybank') {
            // §6.2: Reject by Bank = kategori HOLD → masuk tab Hold (untuk besok).
            s.status = 'hold';
            s.settleStatus = 'rejectbybank';
            s.request = { type: 'hold', scope: 'rejectbybank', prevStatus: 'settle', reason: rq.reason || 'Reject by Bank', bukti: rq.bukti || '', ts: rq.ts || todayProc() };
        } else {
            s.status = rq.type;
            if (rq.type === 'settle') {
                s.metodeSettlement = rq.metodeSettlement || 'Otomatis';
                s.channel = rq.channel || '';
                // Manual = tidak kirim ke bank, langsung Sukses. Otomatis = Pending (menunggu respons bank).
                s.settleStatus = (s.metodeSettlement === 'Manual') ? 'success' : 'pending';
                // §4: baru DIPECAH setelah approve (greedy + sisa) bila BI-FAST > Rp250 juta.
                if (rq.pecahOtomatis && rq.pecahOtomatis > 1) s.settleParts = splitBifast(totalOf(g));
                // §3: baru DIGABUNG setelah approve — serap transaksi dibawah min norek+bank sama yang sudah rilis ke Checker.
                var sib = groups.filter(function (x) {
                    var xs = st(x.groupId);
                    return x.norek === g.norek && x.bank === g.bank && x.groupId !== g.groupId && !xs.mergedInto && xs.holdScope === 'min' && (xs.status === 'checker' || xs.status === 'hold');
                });
                if (sib.length) {
                    var mtot = 0;
                    sib.forEach(function (x) { var xs = st(x.groupId); xs.status = 'settle'; xs.settleStatus = s.settleStatus; xs.metodeSettlement = s.metodeSettlement; xs.channel = s.channel; xs.mergedInto = g.groupId; xs.approvedTs = todayProc(); xs.updatedTs = todayProc(); mtot += totalOf(x); });
                    s.mergeInfo = { count: sib.length, total: mtot };
                }
            }
        }
        if (s.status === 'hold') s.everHeld = true; // §7: tandai settlement pernah di-hold
        s.approvedTs = todayProc();
        s.approvedBy = 'dion@paydia.id';
        var extra = s.settleParts ? (' Dipecah jadi ' + s.settleParts.length + ' settlement.') : (s.mergeInfo ? (' Digabung ' + s.mergeInfo.count + ' transaksi dibawah min.') : '');
        showToast('Request Disetujui', g.groupId + ' → ' + (rq.type || '').toUpperCase() + '.' + extra);
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

// ── settle tab: per-row Reject by Bank (Manual only) — perlu approval Approver ──
function openRejectByBankItem(g) {
    var s = st(g.groupId);
    var body = selInfo(g) +
        '<p style="font-size:0.82rem;padding:8px 12px;background:#fff7ed;color:#b45309;border-radius:6px;margin-bottom:14px;"><i class="fas fa-info-circle"></i> Metode Manual — settlement ditandai Reject by Bank dan <b>langsung dipindah ke Hold</b> tanpa approval. Approver hanya menerima notifikasi perpindahan data.</p>' +
        noteField(true) + fileField('(opsional, maks 25 MB, format PDF/JPG/JPEG/PNG)');
    openModal('Reject by Bank', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Pindahkan ke Hold', style: 'background:#dc2626;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var reason = document.getElementById('asReason').value.trim();
            if (!reason) { showToast('Catatan Wajib', 'Isi catatan Reject by Bank.'); return; }
            var bk = validateBukti(null); if (!bk) return;
            // §6.2: langsung ke Hold (tanpa approval), + notifikasi ke Approver (mirip Rilis ke Checker).
            s.status = 'hold'; s.settleStatus = 'rejectbybank'; s.everHeld = true; s.updatedTs = todayProc();
            s.request = { type: 'hold', scope: 'rejectbybank', prevStatus: 'settle', reason: reason, bukti: bk.name, ts: todayProc() };
            s.autoReq = { type: 'rejectbybank', from: 'settle', to: 'hold', ts: todayProc() };
            saveItems(); closeModal(); render();
            showToast('Dipindah ke Hold', g.groupId + ' → Hold (Reject by Bank). Approver ter-notifikasi.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Reject by Bank ' + g.groupId + ' → pindah ke Hold (notifikasi Approver)\ncatatan : ' + reason + (bk.name ? '\nbukti : ' + bk.name : ''));
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
var EXPORT_COLS = ['No', 'Tanggal Recon', 'Tanggal Perubahan Terakhir', 'ID Settlement', 'Nominal Awal (Rp)', 'Admin (Rp)', 'Adjustment Chargeback (+) (Rp)', 'Adjustment Chargeback (-) (Rp)', 'Total Settle (Rp)', 'Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

function exportCols() {
    if (activeTab === 'pending') return EXPORT_COLS.concat(['Request']);
    if (activeTab === 'hold') return EXPORT_COLS.concat(['Alasan', 'Status Hold', 'Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    if (activeTab === 'reject') return EXPORT_COLS.concat(['Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    if (activeTab === 'settle') return EXPORT_COLS.concat(['Channel Payment', 'Metode Transfer', 'Metode Settlement', 'Waktu Diajukan', 'Waktu Disetujui', 'Disetujui Oleh', 'Catatan']);
    return EXPORT_COLS;
}

function exportRowData(rows) {
    return rows.map(function (g, i) {
        var row = [i + 1, g.procDisplay, updatedOf(g), g.groupId, g.nominalAwal, g.admin, g.adjPlus || 0, g.adjMinus || 0, totalOf(g), g.bank, g.norek, g.namaRek];
        var s = st(g.groupId); var rq = s.request || {};
        if (activeTab === 'pending') {
            var lbl = rq.type === 'hold' ? (REQ_HOLD_LABEL[rq.scope] || 'Hold') : (rq.type ? rq.type.charAt(0).toUpperCase() + rq.type.slice(1) : '-');
            row.push(lbl);
        } else if (activeTab === 'hold') {
            var hStat = s.status === 'hold' ? 'Aktif · Belum Diproses' : ('Selesai · ' + (s.released ? 'Dirilis ke Checker' : (s.status === 'settle' ? 'Settle' : (s.status === 'reject' ? 'Reject' : (STATUS_LABEL[s.status] || s.status)))));
            row.push(rq.scope === 'anomaly' ? '-' : (SCOPE_LABEL[rq.scope] || '-'), hStat, rq.ts || '-', s.approvedTs || '-', s.approvedBy || '-', rq.reason || '-');
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
    var fmt = function (c, v) { return (typeof v === 'number' && c >= 4 && c <= 8) ? num(v) : esc(v); };
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
    'A. VIA OCBC - LAINNYA', 'B. VIA BCA', 'C. VIA BRI', 'D. VIA MANDIRI', 'E. AGI', 'F. NOBU'
];
var SEG_COLS = ['Total Settle', 'Nama Bank', 'Nomor rekening', 'Nama pemilik rekening', 'Keterangan'];
// §4.6: segregasi dibangun dari DATA AKTUAL — settle Manual, dibucket per bank tujuan ke tabel A–F.
var SEG_BANK_TABLE = { BCA: 'B. VIA BCA', BRI: 'C. VIA BRI', MANDIRI: 'D. VIA MANDIRI', AGI: 'E. AGI', NOBU: 'F. NOBU' };
function segData() {
    var buckets = {}; SEG_TABLES.forEach(function (t) { buckets[t] = []; });
    groups.forEach(function (g) {
        var s = st(g.groupId);
        if (s.status !== 'settle' || s.metodeSettlement !== 'Manual') return;
        var title = SEG_BANK_TABLE[g.bank] || 'A. VIA OCBC - LAINNYA';
        buckets[title].push({ total: totalOf(g), bank: g.bank, norek: g.norek, owner: g.namaRek, ket: '' });
    });
    return SEG_TABLES.map(function (t) {
        var rows = buckets[t];
        return { title: t, rows: rows, total: rows.reduce(function (a, r) { return a + r.total; }, 0) };
    });
}
// Rekap grand total: adm = admin settle Manual, hold = nominal hold aktif (dari data aktual).
function segRecap(tables) {
    var grand = tables.reduce(function (s, t) { return s + t.total; }, 0);
    var adm = 0, hold = 0;
    groups.forEach(function (g) {
        var s = st(g.groupId);
        if (s.status === 'settle' && s.metodeSettlement === 'Manual') adm += g.admin;
        if (s.status === 'hold') hold += totalOf(g);
    });
    var diff = adm + hold;
    return { grand: grand, grand2: grand + diff, diff: diff, adm: adm, hold: hold };
}
var _segCache = null, _segDate = '', _segRecap = null;
function showSegregasiPreview(dateStr) {
    _segCache = segData(); _segDate = dateStr; _segRecap = segRecap(_segCache);
    document.getElementById('asExportSub').innerHTML = 'Simulasi hasil <b>Export Segregasi per Bank</b> — Tanggal ' + esc(dateStr) + '. Tabel dipisah per channel payment (semua dalam 1 sheet). Hanya memuat data dengan Metode Settlement <b>Manual</b>.';
    document.getElementById('asExportHead').innerHTML = '<tr>' + SEG_COLS.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    var html = '';
    _segCache.forEach(function (t, idx) {
        html += '<tr><td colspan="5" style="background:#eef2ff;color:#4f46e5;font-weight:700;padding:8px 10px;">' + esc(t.title) + '</td></tr>';
        t.rows.forEach(function (r) {
            html += '<tr><td style="text-align:right;font-variant-numeric:tabular-nums;">' + num(r.total) + '</td><td>' + esc(r.bank) + '</td><td style="font-variant-numeric:tabular-nums;">' + esc(r.norek) + '</td><td>' + esc(r.owner) + '</td><td>' + esc(r.ket) + '</td></tr>';
        });
        html += '<tr><td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;border-top:2px solid #cbd5e1;">' + num(t.total) + '</td><td colspan="4" style="border-top:2px solid #cbd5e1;"></td></tr>';
        // Rekap grand total setelah tabel terakhir.
        if (idx === _segCache.length - 1) {
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
    _segCache.forEach(function (t, idx) {
        lines.push(e(t.title));
        t.rows.forEach(function (r) { lines.push([r.total, r.bank, r.norek, r.owner, r.ket].map(e).join(',')); });
        lines.push(e(t.total)); // baris total (hanya kolom Total Settle)
        if (idx === _segCache.length - 1 && _segRecap) {
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

// ── §9.2 Export Report ke Manajemen (summary harian) ──
function mgmtReportData() {
    var settle = groups.filter(function (g) { return st(g.groupId).status === 'settle'; });
    var tree = { Manual: {}, Otomatis: {} };
    settle.forEach(function (g) {
        var s = st(g.groupId), m = s.metodeSettlement || 'Manual', ch = s.channel || '-', bk = g.bank;
        tree[m] = tree[m] || {}; tree[m][ch] = tree[m][ch] || {};
        var cell = tree[m][ch][bk] = tree[m][ch][bk] || { qty: 0, total: 0 };
        cell.qty++; cell.total += totalOf(g);
    });
    var sukses = { qty: 0, total: 0 };
    settle.forEach(function (g) { if (st(g.groupId).settleStatus === 'success') { sukses.qty++; sukses.total += totalOf(g); } });
    var released = { qty: 0, total: 0 };
    groups.forEach(function (g) { if (st(g.groupId).released) { released.qty++; released.total += totalOf(g); } });
    var hold = { below: { qty: 0, total: 0 }, request: { qty: 0, total: 0 }, rbb: { qty: 0, total: 0 } };
    groups.filter(function (g) { return st(g.groupId).status === 'hold'; }).forEach(function (g) {
        var sc = (st(g.groupId).request || {}).scope, t = totalOf(g);
        if (sc === 'min') { hold.below.qty++; hold.below.total += t; }
        else if (sc === 'rejectbybank') { hold.rbb.qty++; hold.rbb.total += t; }
        else { hold.request.qty++; hold.request.total += t; }
    });
    return { tree: tree, sukses: sukses, released: released, hold: hold };
}
var _mgmt = null, _mgmtDate = '';
function showMgmtReport(dateStr) {
    _mgmt = mgmtReportData(); _mgmtDate = dateStr;
    document.getElementById('asExportSub').innerHTML = 'Simulasi <b>Report Manajemen</b> — Tanggal ' + esc(dateStr) + '. Pending & Fail = 0 (khusus metode Otomatis, Fase 2).';
    document.getElementById('asExportHead').innerHTML = '<tr><th>Kategori</th><th>Channel / Detail</th><th>Bank Tujuan</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Nominal</th></tr>';
    var num2 = function (n) { return num(n); };
    var html = '';
    ['Manual', 'Otomatis'].forEach(function (m) {
        html += '<tr><td colspan="5" style="background:#eef2ff;color:#4f46e5;font-weight:700;padding:8px 10px;">Metode ' + m + (m === 'Otomatis' ? ' (Fase 2 — kosong)' : '') + '</td></tr>';
        var chs = Object.keys(_mgmt.tree[m] || {}).sort();
        if (!chs.length) { html += '<tr><td></td><td colspan="4" style="color:var(--text-muted);padding:6px 10px;">— tidak ada —</td></tr>'; }
        chs.forEach(function (ch) {
            var banks = Object.keys(_mgmt.tree[m][ch]).sort();
            banks.forEach(function (bk, i) {
                var c = _mgmt.tree[m][ch][bk];
                html += '<tr><td></td><td>' + (i === 0 ? esc(ch) : '') + '</td><td>' + esc(bk) + '</td><td style="text-align:center;">' + c.qty + '</td><td style="text-align:right;font-variant-numeric:tabular-nums;">' + num2(c.total) + '</td></tr>';
            });
        });
    });
    var t = _mgmt;
    var totRow = function (label, d, color) { return '<tr><td colspan="3" style="padding:7px 10px;font-weight:700;color:' + (color || 'inherit') + ';">' + label + '</td><td style="text-align:center;font-weight:700;">' + d.qty + '</td><td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">' + num2(d.total) + '</td></tr>'; };
    html += '<tr><td colspan="5" style="background:#f1f5f9;font-weight:700;padding:8px 10px;">Rekap Status & Hold</td></tr>';
    html += totRow('Total Settlement Sukses', t.sukses, '#16a34a');
    html += totRow('Total Dirilis', t.released, '#0891b2');
    html += totRow('Hold — Below Rp10.000', t.hold.below, '#b45309');
    html += totRow('Hold — Request (Semua/Partial)', t.hold.request, '#b45309');
    html += totRow('Hold — Reject by Bank', t.hold.rbb, '#7c3aed');
    html += totRow('Status Pending (Otomatis, Fase 2)', { qty: 0, total: 0 }, 'var(--text-muted)');
    html += totRow('Status Fail (Otomatis, Fase 2)', { qty: 0, total: 0 }, 'var(--text-muted)');
    document.getElementById('asExportBody').innerHTML = html;
    document.getElementById('asExportDownload').onclick = function () { downloadMgmtCsv(); };
    document.getElementById('asExportModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function downloadMgmtCsv() {
    var e = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = ['Report Manajemen — Auto Settlement QRIS', 'Tanggal:,' + _mgmtDate, 'Generated By:,dion@paydia.id', '', 'Kategori,Channel,Bank Tujuan,Qty,Nominal'];
    ['Manual', 'Otomatis'].forEach(function (m) {
        lines.push(e('Metode ' + m));
        Object.keys(_mgmt.tree[m] || {}).sort().forEach(function (ch) {
            Object.keys(_mgmt.tree[m][ch]).sort().forEach(function (bk) {
                var c = _mgmt.tree[m][ch][bk];
                lines.push(['', ch, bk, c.qty, c.total].map(e).join(','));
            });
        });
    });
    var t = _mgmt;
    [['Total Settlement Sukses', t.sukses], ['Total Dirilis', t.released], ['Hold Below 10rb', t.hold.below], ['Hold Request', t.hold.request], ['Hold Reject by Bank', t.hold.rbb], ['Status Pending (Fase 2)', { qty: 0, total: 0 }], ['Status Fail (Fase 2)', { qty: 0, total: 0 }]].forEach(function (r) {
        lines.push([r[0], '', '', r[1].qty, r[1].total].map(e).join(','));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'Report_Manajemen_' + (_mgmtDate || '').replace(/\//g, '-') + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Export Berhasil', 'Report Manajemen di-export.');
    writeLog('auto-settlement', 'email : dion@paydia.id\naction : Export Report Manajemen (' + _mgmtDate + ')');
}
function openMgmtModal() {
    var body = '<div class="as-fld"><label>Tanggal Report <span style="color:#ef4444;">*</span></label>' +
        '<input type="date" id="asMgmtDate" value="' + todayISO() + '" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.85rem;"></div>' +
        '<p style="font-size:0.8rem;padding:8px 12px;background:#eff6ff;color:#1d4ed8;border-radius:6px;margin:0;"><i class="fas fa-info-circle"></i> Summary harian untuk manajemen: per metode → channel → bank tujuan, plus rekap sukses/rilis/hold.</p>';
    openModal('Export Report Manajemen', body, [
        { label: 'Batal', onClick: closeModal },
        { label: 'Export', style: 'background:#10b981;color:#fff;border:none;padding:8px 20px;font-weight:600;', onClick: function () {
            var d = document.getElementById('asMgmtDate').value;
            if (!d) { showToast('Tanggal Wajib', 'Pilih Tanggal Report.'); return; }
            closeModal(); showMgmtReport(d.split('-').reverse().join('/'));
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
    else if (act === 'rilis') openRilis(g);
}

// §3.3/§3.4/§3.5: Rilis hold ke Checker (gabung ke settlement berjalan) — TANPA approval.
function openRilis(g) {
    var body = selInfo(g) +
        '<p style="font-size:0.82rem;padding:8px 12px;background:#ecfdf5;color:#065f46;border-radius:6px;margin-bottom:8px;"><i class="fas fa-arrow-rotate-left"></i> Rilis kembali ke <b>Checker</b> untuk digabung ke settlement berjalan. Tidak perlu approval; Approver hanya ter-notice.</p>';
    openModal('Rilis ke Checker', body, [
        { label: 'Tetap Hold', onClick: closeModal },
        { label: 'Rilis ke Checker', style: 'background:#16a34a;color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var s = st(g.groupId); var from = s.status; // 'hold' atau 'reject'
            s.status = 'checker'; s.request = null; s.settleStatus = null; s.released = true;
            s.autoReq = { type: 'rilis', from: from, to: 'checker', ts: todayProc() }; // auto-approve, tercatat persisten di Approver
            s.updatedTs = todayProc();
            saveItems(); closeModal(); render();
            showToast('Dirilis ke Checker', g.groupId + ' digabung ke settlement berjalan. Approver ter-notifikasi.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Rilis ' + from + ' ke Checker ' + g.groupId + ' (notifikasi Approver)');
        } }
    ]);
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

// Modal "Lihat Bukti" (Hold / Reject tabs) — gabungan lihat catatan + tambah/lihat bukti.
// - Tampilkan Waktu Disetujui di bawah Waktu Diajukan.
// - Bukti: tombol Lihat (bila ada) + upload untuk tambah/ganti bukti.
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
        (rq.type === 'hold' && rq.scope === 'partial' && rq.partialMids ? kv('MID Dihold', esc(partialMidsLabel(rq))) : '') +
        kv('Catatan', rq.reason ? '<span style="white-space:pre-wrap;">' + esc(rq.reason) + '</span>' : '<span style="color:var(--text-muted);">-</span>') +
        kv('Bukti', buktiVal) +
        kv('Waktu Diajukan', esc(rq.ts || '-')) +
        kv('Waktu Disetujui', esc(s.approvedTs || '-')) +
        kv('Disetujui Oleh', esc(s.approvedBy || '-')) +
        '<div style="margin-top:14px;border-top:1px solid var(--border-color);padding-top:12px;">' +
        '<div style="font-weight:700;font-size:0.82rem;margin-bottom:8px;">' + (rq.bukti ? 'Ganti Bukti' : 'Tambah Bukti') + '</div>' +
        fileField('(maks 25 MB, format PDF/JPG/JPEG/PNG)') + '</div>';
    openModal('Lihat Bukti', body, [
        { label: 'Tutup', onClick: closeModal },
        { label: 'Simpan Bukti', style: 'background:var(--primary);color:#fff;border:none;padding:8px 16px;font-weight:600;', onClick: function () {
            var bk = validateBukti('Pilih file bukti dulu.'); if (!bk) return;
            if (!s.request) s.request = { type: (activeTab === 'reject' ? 'reject' : 'hold'), scope: 'all', reason: '', ts: todayProc() };
            s.request.bukti = bk.name; saveItems(); closeModal(); render();
            showToast('Bukti Disimpan', 'Bukti ' + g.groupId + ' diperbarui.');
            writeLog('auto-settlement', 'email : dion@paydia.id\naction : Tambah/ganti bukti ' + activeTab + ' ' + g.groupId + '\nbukti : ' + bk.name);
        } }
    ]);
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
// §1.4: filter bank tujuan = tiap bank merchant terpisah (bukan dikelompok "Lainnya").
function renderBankFilter() {
    var el = document.getElementById('asFilterBanks');
    if (!el) return;
    var seen = {};
    groups.forEach(function (g) { seen[g.bank] = true; });
    var list = Object.keys(seen).sort();
    el.innerHTML = list.map(function (b) {
        return '<label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer;"><input type="checkbox" class="as-fbank" value="' + esc(b) + '"' + ((filters && filters.banks && filters.banks.has(b)) ? ' checked' : '') + '> ' + esc(b) + '</label>';
    }).join('');
}
function syncFilterInputs() {
    document.getElementById('asFilterStart').value = filters.start || '';
    document.getElementById('asFilterEnd').value = filters.end || '';
    document.getElementById('asFilterBig').checked = !!filters.big;
    document.getElementById('asFilterMid').checked = !!filters.mid;
    document.getElementById('asFilterSmall').checked = !!filters.small;
    renderBankFilter();
    document.querySelectorAll('.as-fbank').forEach(function (cb) { cb.checked = filters.banks.has(cb.value); });
    document.querySelectorAll('.as-freq').forEach(function (cb) { cb.checked = (filters.reqs || new Set()).has(cb.value); });
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
    // §1: filter khusus tab Hold — Alasan & Status.
    var isHold = activeTab === 'hold';
    var haEl = document.getElementById('asFilterHoldAlasanSection');
    var hsEl = document.getElementById('asFilterHoldStatusSection');
    if (haEl) haEl.style.display = isHold ? 'block' : 'none';
    if (hsEl) hsEl.style.display = isHold ? 'block' : 'none';
    document.querySelectorAll('.as-falasan').forEach(function (cb) { cb.checked = (filters.holdAlasans || new Set()).has(cb.value); });
    document.querySelectorAll('.as-fhs').forEach(function (cb) { cb.checked = (filters.holdStatuses || new Set()).has(cb.value); });
}
function applyFilterPanel() {
    filters.start = document.getElementById('asFilterStart').value;
    filters.end = document.getElementById('asFilterEnd').value;
    filters.big = document.getElementById('asFilterBig').checked;
    filters.mid = document.getElementById('asFilterMid').checked;
    filters.small = document.getElementById('asFilterSmall').checked;
    filters.banks = new Set(Array.from(document.querySelectorAll('.as-fbank:checked')).map(function (c) { return c.value; }));
    filters.reqs = (activeTab === 'pending') ? new Set(Array.from(document.querySelectorAll('.as-freq:checked')).map(function (c) { return c.value; })) : new Set();
    filters.settleStatuses = new Set(Array.from(document.querySelectorAll('.as-fss:checked')).map(function (c) { return c.value; }));
    var metodeEl = document.getElementById('asFilterMetode');
    filters.metodeSettle = metodeEl ? metodeEl.value : '';
    var channelEl = document.getElementById('asFilterChannel');
    filters.channel = channelEl ? channelEl.value : '';
    filters.holdAlasans = (activeTab === 'hold') ? new Set(Array.from(document.querySelectorAll('.as-falasan:checked')).map(function (c) { return c.value; })) : new Set();
    filters.holdStatuses = new Set(Array.from(document.querySelectorAll('.as-fhs:checked')).map(function (c) { return c.value; }));
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
    var mgmtBtn = document.getElementById('asExportMgmtBtn');
    if (mgmtBtn) mgmtBtn.addEventListener('click', openMgmtModal);
    document.getElementById('asBulkApprove').addEventListener('click', function () { bulkApproverDecide(true); });
    document.getElementById('asBulkRejectReq').addEventListener('click', function () { bulkApproverDecide(false); });
    document.getElementById('asBulkHold').addEventListener('click', openBulkHold);
    document.getElementById('asBulkReject').addEventListener('click', openBulkReject);
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
    var nbtn = document.getElementById('notificationBtn');
    if (nbtn) nbtn.addEventListener('click', function (e) { e.stopPropagation(); var dd = document.getElementById('notifDropdown'); if (dd) dd.style.display = (dd.style.display === 'none' || !dd.style.display) ? 'block' : 'none'; });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.as-kebab') && !e.target.closest('#asKebabMenu')) closeKebab();
        if (!e.target.closest('#asFilterBtn') && !e.target.closest('#asFilterPanel')) document.getElementById('asFilterPanel').style.display = 'none';
        if (!e.target.closest('.notif-wrap')) { var dd = document.getElementById('notifDropdown'); if (dd) dd.style.display = 'none'; }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Reset ke seed bersih sekali saat versi seed berubah (normalisasi data lama).
    var SEED_VER = '2026-07-08-minhold-scenarios';
    var fresh = localStorage.getItem('paydia_as_seedver') !== SEED_VER;
    if (fresh) {
        localStorage.removeItem('paydia_as_items');
        localStorage.removeItem('paydia_as_splits');
        localStorage.setItem('paydia_as_seedver', SEED_VER);
    }
    loadItems();
    loadSplits();
    loadPool(fresh);
    filters = defaultFilters();
    bind();
    syncFilterInputs();
    render();
    renderNotifBell();
});
