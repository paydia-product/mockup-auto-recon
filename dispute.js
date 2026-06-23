/* ============================================
   Paydia Bisnis – QRIS Auto Reconcile Dashboard
   Dispute Data Page Logic
   ============================================ */

// ── Seed Transactions Database ──
const rawTransactions = [
    // --- ACQUIRER MATCHED ---
    { id: 'TX-ACQ-10001', refNo: 'REF-20260527-010', date: '2026-05-27 08:12:44', nominal: 150000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10002', refNo: 'REF-20260527-011', date: '2026-05-27 08:35:19', nominal: 45000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10003', refNo: 'REF-20260527-012', date: '2026-05-27 09:04:11', nominal: 1250000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '00', switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10004', refNo: 'REF-20260527-013', date: '2026-05-27 10:14:02', nominal: 87000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10005', refNo: 'REF-20260527-014', date: '2026-05-27 11:22:58', nominal: 32000, merchantId: 'MID-88155', merchantName: 'Alfa Mart', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10006', refNo: 'REF-20260527-015', date: '2026-05-27 14:02:11', nominal: 105000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    
    // --- ACQUIRER UNMATCHED ---
    { id: 'TX-ACQ-20001', refNo: 'REF-20260527-020', date: '2026-05-27 07:11:02', nominal: 75000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20002', refNo: 'REF-20260527-021', date: '2026-05-27 09:44:32', nominal: 220000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: 'DISP-001' },
    { id: 'TX-ACQ-20003', refNo: 'REF-20260527-022', date: '2026-05-27 10:05:14', nominal: 500000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '68', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20004', refNo: 'REF-20260527-023', date: '2026-05-27 15:30:19', nominal: 180000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '68', rcSwitching: '68', rcPaydia: '68', switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-ACQ-20005', refNo: 'REF-20260527-024', date: '2026-05-27 12:08:33', nominal: 120000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Jalin', switchingTime: '12:09:33', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20008', refNo: 'REF-20260527-026', date: '2026-05-27 16:02:09', nominal: 67000, nominalPaydia: 67000, nominalSwitching: 67000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '00', rcPaydia: '00', rcSwitching: '05', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ACQUIRER DECLINED ---
    { id: 'TX-ACQ-30001', refNo: 'REF-20260527-030', date: '2026-05-27 08:02:11', nominal: 11000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '51', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-30002', refNo: 'REF-20260527-031', date: '2026-05-27 11:45:00', nominal: 95000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '05', switching: 'Rintis', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER MATCHED ---
    { id: 'TX-ISS-10001', refNo: 'REF-20260527-040', date: '2026-05-27 08:05:22', nominal: 24000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10002', refNo: 'REF-20260527-041', date: '2026-05-27 09:12:18', nominal: 155000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10003', refNo: 'REF-20260527-042', date: '2026-05-27 10:20:11', nominal: 60000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10004', refNo: 'REF-20260527-043', date: '2026-05-27 13:14:02', nominal: 320000, merchantId: 'MID-99440', merchantName: 'Shell Gandaria', rc: '00', switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER UNMATCHED ---
    { id: 'TX-ISS-20001', refNo: 'REF-20260527-050', date: '2026-05-27 08:22:19', nominal: 89000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20002', refNo: 'REF-20260527-051', date: '2026-05-27 11:05:44', nominal: 45000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20003', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', switchingTime: '12:15:00', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20005', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', switchingTime: '12:15:22', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20004', refNo: 'REF-20260527-053', date: '2026-05-27 13:40:00', nominal: 140000, nominalPaydia: 140000, nominalSwitching: 140000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20006', refNo: 'REF-20260527-055', date: '2026-05-27 14:10:00', nominal: 120000, nominalPaydia: 120000, nominalSwitching: 120000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', rcPaydia: '00', rcSwitching: '05', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER DECLINED ---
    { id: 'TX-ISS-30001', refNo: 'REF-20260527-060', date: '2026-05-27 07:44:06', nominal: 18000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '14', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null }
];

const seedLogs = [
    { id: 9145, tanggal: '28-05-2026 15:01:39', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9144, tanggal: '28-05-2026 15:00:31', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9143, tanggal: '28-05-2026 14:57:42', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9142, tanggal: '28-05-2026 14:42:06', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : dion@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9141, tanggal: '28-05-2026 14:28:23', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '38.75.8.222' },
    { id: 9140, tanggal: '28-05-2026 11:31:14', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9139, tanggal: '28-05-2026 15:54:41', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : aldy@merchant.id\nuser.type : admin', ip: '103.177.100.34' }
];

// ── State Management ──
let transactions = [];
let disputes = [];

let permissions = {
    read: true,
    flagging: true,
    inputDispute: true,
    export: true,
    approve: true,
    rerun: true,
    log: true
};

// ── DOM References ──
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const btnClearAll = document.getElementById('btnClearAll');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const btnImportData = document.getElementById('btnImportData');
const importProgressOverlay = document.getElementById('importProgressOverlay');
const importProgressBarFill = document.getElementById('importProgressBarFill');
const importProgressStatus = document.getElementById('importProgressStatus');
const disputeOverlay = document.getElementById('disputeOverlay');
// disputeForm is deprecated
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');

// Permissions widget inputs
const permRead = document.getElementById('permRead');
const permFlagging = document.getElementById('permFlagging');
const permInputDispute = document.getElementById('permInputDispute');
const permExport = document.getElementById('permExport');
const permApprove = document.getElementById('permApprove');
const permRerun = document.getElementById('permRerun');
const permLog = document.getElementById('permLog');

function loadPermissions() {
    const saved = localStorage.getItem('paydia_mock_perms');
    if (saved) {
        permissions = JSON.parse(saved);
    } else {
        permissions = {
            read: true,
            flagging: true,
            inputDispute: true,
            export: true,
            approve: true,
            rerun: true,
            log: true
        };
    }
    // Update checkboxes
    if (permRead) permRead.checked = permissions.read;
    if (permFlagging) permFlagging.checked = permissions.flagging;
    if (permInputDispute) permInputDispute.checked = permissions.inputDispute;
    if (permExport) permExport.checked = permissions.export;
    if (permApprove) permApprove.checked = permissions.approve;
    if (permRerun) permRerun.checked = permissions.rerun;
    if (permLog) permLog.checked = permissions.log;
}

function savePermissions() {
    permissions = {
        read: permRead ? permRead.checked : true,
        flagging: permFlagging ? permFlagging.checked : true,
        inputDispute: permInputDispute ? permInputDispute.checked : true,
        export: permExport ? permExport.checked : true,
        approve: permApprove ? permApprove.checked : true,
        rerun: permRerun ? permRerun.checked : true,
        log: permLog ? permLog.checked : true
    };
    localStorage.setItem('paydia_mock_perms', JSON.stringify(permissions));
    applyPermissions();
}

function applyPermissions() {
    // 1. Read permission overlay
    const mainContent = document.querySelector('.main-content');
    const existingOverlay = document.getElementById('permissionErrorOverlay');
    
    if (!permissions.read) {
        if (!existingOverlay && mainContent) {
            const overlay = document.createElement('div');
            overlay.id = 'permissionErrorOverlay';
            overlay.className = 'permission-error-overlay';
            overlay.innerHTML = `
                <div class="permission-error-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2 class="permission-error-title">Akses Rekonsiliasi Dibatasi</h2>
                <p class="permission-error-desc">
                    Akun Anda tidak memiliki izin <strong>Read Reconcile</strong>. Hubungi administrator sistem untuk meminta akses ke modul ini.
                </p>
            `;
            Array.from(mainContent.children).forEach(child => {
                if (child.id !== 'permissionErrorOverlay' && child.className !== 'breadcrumb') {
                    child.style.display = 'none';
                }
            });
            mainContent.appendChild(overlay);
        }
        return;
    } else {
        if (existingOverlay) {
            existingOverlay.remove();
            if (mainContent) {
                Array.from(mainContent.children).forEach(child => {
                    if (child.className !== 'filter-panel' && child.id !== 'disputeOverlay' && child.id !== 'modalOverlay') {
                        child.style.display = '';
                    }
                });
            }
        }
    }

    // 2. Input Dispute check
    if (btnImportData) {
        btnImportData.style.display = permissions.inputDispute ? '' : 'none';
    }
    
    // 3. Export check
    if (exportBtn) {
        exportBtn.style.display = permissions.export ? '' : 'none';
    }
}

// ── Initialize Dashboard ──
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    try {
        const startDateInput = document.getElementById('filterStartDate');
        const endDateInput = document.getElementById('filterEndDate');
        if (startDateInput && !startDateInput.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            startDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
        if (endDateInput && !endDateInput.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            endDateInput.value = `${yyyy}-${mm}-${dd}`;
        }
    } catch (e) {
        console.error("Error setting default date filter:", e);
    }
    loadPermissions();
    applyPermissions();
    bindEvents();
    initNotesModal();
    initDisputeSearchModal();
    renderTableData();
    initMockDataControl();
});

function adjustDatesToToday(items) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return items.map((item) => {
        const updatedItem = { ...item };
        if (item.date) {
            updatedItem.date = todayStr + item.date.substring(10);
        }
        return updatedItem;
    });
}

function initDatabase() {
    let populatedVal = localStorage.getItem('paydia_mock_populated');
    if (populatedVal === null) {
        localStorage.setItem('paydia_mock_populated', 'true');
        populatedVal = 'true';
    }
    const isPopulated = populatedVal === 'true';
    if (isPopulated) {
        // Load or initialize transactions
        const savedTrx = localStorage.getItem('paydia_recon_trx');
        if (savedTrx) {
            transactions = JSON.parse(savedTrx);
        } else {
            transactions = [...rawTransactions];
        }
        transactions = adjustDatesToToday(transactions);
        localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));

        // Load or initialize disputes
        const savedDis = localStorage.getItem('paydia_disputes');
        if (savedDis) {
            disputes = JSON.parse(savedDis);
            // Migrate old types if they exist in localStorage
            disputes.forEach(d => {
                if (d.type === 'Paydia-Only' || d.type === 'Nominal-Mismatch' || d.type === 'Suspect') d.type = '1st chargeback';
                else if (d.type === 'Switching-Only') d.type = 'good faith';
            });
        } else {
            disputes = [
                { id: 'DISP-001', refId: 'REF-20260527-021', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
                { id: 'DISP-002', refId: 'TX-ISS-20001', date: '2026-05-28 09:44:00', type: 'good faith', switching: 'Rintis', nominal: 89000, status: 'Open', desc: 'Dana menggantung di switching, merchant belum terima dana' }
            ];
        }
        disputes = adjustDatesToToday(disputes);
        localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
    } else {
        transactions = [];
        disputes = [];
    }
}

function saveTrxToStorage() {
    localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));
}

function saveDisputesToStorage() {
    localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
}

// ── Log Helper ──
function writeLog(type, detail) {
    const savedLogs = localStorage.getItem('paydia_logs');
    let logsList = [];
    if (savedLogs) {
        logsList = JSON.parse(savedLogs);
    } else {
        logsList = [...seedLogs];
    }
    
    // Find max ID
    let maxId = 9138;
    logsList.forEach(l => {
        const numericId = parseInt(l.id);
        if (!isNaN(numericId) && numericId > maxId) {
            maxId = numericId;
        }
    });
    const nextId = maxId + 1;
    
    const now = new Date();
    const dateStr = String(now.getDate()).padStart(2, '0') + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        now.getFullYear() + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
        
    const newLog = {
        id: nextId,
        tanggal: dateStr,
        container: 'paydia-reconcile',
        type: type,
        detail: detail,
        ip: '125.161.77.69'
    };
    
    logsList.unshift(newLog);
    localStorage.setItem('paydia_logs', JSON.stringify(logsList));
}

// ── Summary Cards Calculations ──
function renderSummary() {
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const switchingVal = document.getElementById('filterSwitching').value;

    let filtered = transactions.filter(t => {
        const tDate = t.date.substring(0, 10);
        if (startDateVal && tDate < startDateVal) return false;
        if (endDateVal && tDate > endDateVal) return false;
        if (switchingVal && t.switching !== switchingVal) return false;
        return true;
    });

    const totalTrx = filtered.length;
    const matched = filtered.filter(t => t.statusRekon === 'Matched').length;
    const unmatched = filtered.filter(t => t.statusRekon === 'Unmatched').length;
    const onHold = filtered.filter(t => t.flaggingStatus === 'On-Hold').length;
    
    // Disputes filtered
    let filteredDisputes = disputes.filter(d => {
        const dDate = d.date.substring(0, 10);
        if (startDateVal && dDate < startDateVal) return false;
        if (endDateVal && dDate > endDateVal) return false;
        if (switchingVal && d.switching !== switchingVal) return false;
        return true;
    });
    const disputeCount = filteredDisputes.length;

    // Nominal settlement = (matched nominal - matched on-hold) + unmatch nominal that is Settled
    const settleTrx = filtered.filter(t => {
        if (t.statusRekon === 'Matched' && t.flaggingStatus !== 'On-Hold') return true;
        if (t.statusRekon === 'Unmatched' && t.flaggingStatus === 'Settled') return true;
        return false;
    });
    const nominalSettle = settleTrx.reduce((sum, t) => sum + t.nominal, 0);

    const cardTotalTrx = document.getElementById('cardTotalTrx');
    const cardTotalMatch = document.getElementById('cardTotalMatch');
    const cardTotalUnmatch = document.getElementById('cardTotalUnmatch');
    const cardTotalOnhold = document.getElementById('cardTotalOnhold');
    const cardTotalDispute = document.getElementById('cardTotalDispute');
    const cardNominalSettle = document.getElementById('cardNominalSettle');

    if (cardTotalTrx) cardTotalTrx.textContent = totalTrx.toLocaleString('id-ID');
    if (cardTotalMatch) cardTotalMatch.textContent = matched.toLocaleString('id-ID');
    if (cardTotalUnmatch) cardTotalUnmatch.textContent = unmatched.toLocaleString('id-ID');
    if (cardTotalOnhold) cardTotalOnhold.textContent = onHold.toLocaleString('id-ID');
    if (cardTotalDispute) cardTotalDispute.textContent = disputeCount.toLocaleString('id-ID');
    if (cardNominalSettle) cardNominalSettle.textContent = 'Rp' + nominalSettle.toLocaleString('id-ID');
}

// ── Main Rendering ──
function renderTableData() {
    const isPendingApproval = (refId) => {
        const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
        return approvals.some(a => a.refId == refId && a.status === 'Pending');
    };
    renderSummary();

    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const switchingVal = document.getElementById('filterSwitching').value;
    const typeVal = document.getElementById('filterDisputeType').value;
    const statusVal = document.getElementById('filterStatus').value;
    const searchVal = searchInput.value.trim().toLowerCase();

    const tbody = document.getElementById('disputeTableBody');
    tbody.innerHTML = '';

    let filtered = disputes.filter(d => {
        const dDate = d.date.substring(0, 10);
        if (startDateVal && dDate < startDateVal) return false;
        if (endDateVal && dDate > endDateVal) return false;
        if (switchingVal && d.switching !== switchingVal) return false;
        if (typeVal && d.type !== typeVal) return false;
        if (statusVal && d.status !== statusVal) return false;
        if (searchVal && !d.id.toLowerCase().includes(searchVal) && !d.refId.toLowerCase().includes(searchVal)) return false;
        return true;
    });
    window.currentExportData = filtered;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="16" style="text-align:center;color:var(--text-muted);padding: 40px 16px;">Tidak ada data dispute</td></tr>`;
        updatePaginationInfo(0);
        return;
    }

    filtered.forEach((d, idx) => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-proses';
        if (d.status === 'Closed' || d.status === 'Flag Settle') statusClass = 'status-sukses';
        else if (d.status === 'Ditolak') statusClass = 'status-gagal';
        else if (d.status === 'Transaksi Terbuat') statusClass = 'status-dikembalikan';

        let displayType = d.type;
        if (d.type === '1st chargeback') displayType = '1st Chargeback';
        else if (d.type === '2nd chargeback') displayType = '2nd Chargeback';
        else if (d.type === 'good faith') displayType = 'Good Faith';

        const trx = transactions.find(item => item.id === d.refId || item.refNo === d.refId);
        const merchantName = d.merchantName || d.merchant || (trx ? trx.merchantName : 'Kopi Kenangan');

        const nominalTx = d.nominalTx !== undefined ? d.nominalTx : d.nominal;
        const nominalTip = d.nominalTip !== undefined ? d.nominalTip : Math.floor(d.nominal * 0.05);
        const nominalMdr = d.nominalMdr !== undefined ? d.nominalMdr : Math.floor(d.nominal * 0.007);
        const nominalTotal = d.nominalTotal !== undefined ? d.nominalTotal : (nominalTx + nominalTip + nominalMdr);

        const trxId = trx ? trx.id : (d.txId || d.refId || '-');
        const rrn = trx ? trx.refNo : (d.rrn || '-');

        tr.innerHTML = `
            <td class="col-no">${idx + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${d.date}</td>
            <td><a href="#" class="ref-link detail-trx-trigger" data-id="${trxId}">${trxId}</a></td>
            <td style="font-variant-numeric: tabular-nums;">${rrn}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTx.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTotal.toLocaleString('id-ID')}</strong></td>
            <td>${merchantName}</td>
            <td><span class="request-badge" style="background:var(--primary-bg);color:var(--primary);border:1px solid rgba(99, 102, 241, 0.1);">${displayType}</span></td>
            <td>${d.switching}</td>
            <td><span class="status-badge ${statusClass}">${d.status}</span></td>
            <td style="min-width:120px;">
                ${d.type === 'good faith' && ['Open', 'Transaksi Terbuat'].includes(d.status)
                    ? `<select class="select-tipe-dispute" data-id="${d.id}" style="font-size:0.8rem;padding:4px 6px;border-radius:4px;border:1px solid var(--border);background:var(--card-bg);color:var(--text-primary);width:100%;">
                        <option value="">-- Pilih --</option>
                        <option value="Pemotongan" ${d.tipeDispute === 'Pemotongan' ? 'selected' : ''}>Pemotongan</option>
                        <option value="Penambahan" ${d.tipeDispute === 'Penambahan' ? 'selected' : ''}>Penambahan</option>
                       </select>`
                    : `<span style="font-size:0.82rem;">${d.tipeDispute || '-'}</span>`}
            </td>
            <td style="min-width:110px;">
                ${d.type === 'good faith'
                    ? (d.buktiUrl
                        ? `<button class="btn-lihat-bukti flag-btn settle" data-id="${d.id}" style="font-size:0.78rem;white-space:nowrap;"><i class="fas fa-eye"></i> Lihat Detail</button>`
                        : `<span class="bukti-upload-wrap" data-id="${d.id}">
                             <button class="btn-upload-bukti flag-btn settle" data-id="${d.id}" style="font-size:0.78rem;white-space:nowrap;"><i class="fas fa-upload"></i> Upload</button>
                             <input type="file" class="input-bukti" data-id="${d.id}" accept=".jpg,.jpeg,.png" style="display:none;">
                           </span>`)
                    : '-'}
            </td>
            <td>
                ${(() => {
                    if (isPendingApproval(d.id)) return '<span style="color:#f59e0b;font-weight:600;">Pending Approval...</span>';
                    
                    let act = '';
                    if (d.status === 'Ditolak') {
                        act = `<button class="flag-btn settle btn-edit-dispute" data-id="${d.id}"><i class="fas fa-clipboard"></i> Lihat Catatan</button>`;
                    } else if (d.status === 'Transaksi Terbuat') {
                        act = `<button class="flag-btn settle btn-flag-settle" data-id="${d.id}" style="background:#10b981;color:white;border-color:#059669;margin-right:4px;">Flag Settle</button>
                               <button class="flag-btn settle btn-edit-dispute" data-id="${d.id}"><i class="fas fa-clipboard"></i> Lihat Catatan</button>`;
                    } else if (d.status === 'Open' || !d.status) {
                        act = `<button class="flag-btn settle btn-buat-trx" data-id="${d.id}" style="background:#3b82f6;color:white;border-color:#2563eb;margin-right:4px;">Buat Transaksi</button>
                               <button class="flag-btn settle btn-tolak-proses" data-id="${d.id}" style="background:#ef4444;color:white;border-color:#dc2626;margin-right:4px;">Tolak</button>
                               <button class="flag-btn settle btn-edit-dispute" data-id="${d.id}"><i class="fas fa-clipboard"></i> Lihat Catatan</button>`;
                    } else {
                        act = `<button class="flag-btn settle btn-edit-dispute" data-id="${d.id}"><i class="fas fa-clipboard"></i> Lihat Catatan</button>`;
                    }
                    if (d.type === 'good faith' && d.status !== 'Ditolak' && d.status !== 'Selesai') {
                        act += `<button class="flag-btn settle btn-mark-done" data-id="${d.id}" style="margin-left: 8px; background: #10b981; color: white; border-color: #059669;"><i class="fas fa-check"></i> Tandai Selesai</button>`;
                    }
                    return act;
                })()}
            </td>
        `;
        tbody.appendChild(tr);
    });
    updatePaginationInfo(filtered.length);
}

function updatePaginationInfo(count) {
    document.getElementById('paginationInfo').textContent = `1 - ${count} of ${count}`;
}

function openDetailModal(trxId) {
    const t = transactions.find(item => item.id === trxId || item.refNo === trxId);
    if (!t) {
        showToast('Error', 'Detail transaksi tidak ditemukan');
        return;
    }

    const modalTitleEl = document.querySelector('#detailModal .modal-title');
    if (modalTitleEl) {
        modalTitleEl.textContent = `Rincian Transaksi QRIS - ${t.id}`;
    }

    const nominalTotal = t.nominal;
    const nominalTip = Math.floor(t.nominal * 0.05);
    const nominalMdr = Math.floor(t.nominal * 0.007);
    const nominalTx = nominalTotal + nominalTip + nominalMdr;

    // Deterministik mock data generator untuk matched detail modal
    let hash = 0;
    for (let i = 0; i < t.id.length; i++) {
        hash = t.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const acquirerId = '93600' + (100 + (hash % 900));
    const customerPan = '936008******' + (1000 + (hash % 9000));
    
    const names = ['Budi Santoso', 'Andi Wijaya', 'Siti Rahma', 'Dewi Lestari', 'Rian Hidayat', 'Mega Wati', 'Joni Pratama'];
    const wallets = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay'];
    const customerData = `${wallets[hash % wallets.length]} - ${names[hash % names.length]}`;
    
    const issuerNames = ['BCA', 'Bank Mandiri', 'BRI', 'BNI', 'Bank Danamon', 'CIMB Niaga'];
    const issuerName = issuerNames[hash % issuerNames.length];
    
    const merchantPan = '936009******' + (1000 + (hash % 9000));
    const terminalId = 'TID-' + (10000 + (hash % 90000));
    
    const merchantCategory = ['F&B / Restaurant', 'Retail / Supermarket', 'Entertainment', 'Transportation', 'Services'][hash % 5];
    const merchantCriteria = ['UMI (Usaha Mikro)', 'UKE (Usaha Kecil)', 'UME (Usaha Menengah)', 'UBE (Usaha Besar)'][hash % 4];
    const traceNo = (100000 + (hash % 900000)).toString();

    // Status Transaksi badge
    let statusText = 'Gagal';
    let statusColorClass = 'gagal';
    if (t.paydiaStatus) {
        statusText = t.paydiaStatus;
        if (t.paydiaStatus === 'Sukses') statusColorClass = 'sukses';
        else if (t.paydiaStatus === 'Pending') statusColorClass = 'proses';
        else statusColorClass = 'gagal';
    } else {
        if (t.rc === '00') {
            statusText = 'Sukses';
            statusColorClass = 'sukses';
        } else if (t.rc === '68') {
            statusText = 'Pending';
            statusColorClass = 'proses';
        }
    }
    const statusBadge = `<span class="status-badge status-${statusColorClass}">${statusText}</span>`;

    // Find dispute linked to this transaction for status-based section visibility
    const dis = disputes.find(x => x.refId === t.id || x.refId === t.refNo);
    const disStatus = dis ? dis.status : '';

    let paydiaContent = '';
    {
        paydiaContent = `
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">Acquirer Id</td>
                    <td class="detail-value">${acquirerId}</td>
                </tr>
                <tr>
                    <td class="detail-label">Customer Pan</td>
                    <td class="detail-value">${customerPan}</td>
                </tr>

                <tr>
                    <td class="detail-label">Customer Data</td>
                    <td class="detail-value">${customerData}</td>
                </tr>
                <tr>
                    <td class="detail-label">Issuer Name</td>
                    <td class="detail-value">${issuerName}</td>
                </tr>
                <tr>
                    <td class="detail-label">Merchant Name</td>
                    <td class="detail-value">${t.merchantName}</td>
                </tr>
                <tr>
                    <td class="detail-label">Merchant Pan</td>
                    <td class="detail-value">${merchantPan}</td>
                </tr>
                <tr>
                    <td class="detail-label">Rrn</td>
                    <td class="detail-value">${t.refNo}</td>
                </tr>
                <tr>
                    <td class="detail-label">Terminal Id</td>
                    <td class="detail-value">${terminalId}</td>
                </tr>
                <tr>
                    <td class="detail-label">Transaction Amount</td>
                    <td class="detail-value"><strong>Rp${nominalTx.toLocaleString('id-ID')}</strong></td>
                </tr>
                <tr>
                    <td class="detail-label">Lokasi Domestik / Crossborder</td>
                    <td class="detail-value">${t.domestic}</td>
                </tr>
                <tr>
                    <td class="detail-label">Status Transaksi</td>
                    <td class="detail-value">${statusBadge}</td>
                </tr>
                ${dis && dis.type === 'good faith' ? `
                <tr>
                    <td class="detail-label">Bukti</td>
                    <td class="detail-value">${dis.buktiUrl
                        ? `<button onclick="(function(){document.getElementById('buktiPreviewImg').src='${dis.buktiUrl}';var o=document.getElementById('buktiPreviewOverlay');o.style.display='flex';o.classList.add('show');})()" style="padding:4px 12px;border-radius:4px;border:1px solid var(--primary);color:var(--primary);background:transparent;cursor:pointer;font-size:0.82rem;">Lihat</button>`
                        : '<span style="color:var(--text-muted);font-size:0.82rem;">Belum diupload</span>'}</td>
                </tr>` : ''}
            </table>
        `;
    }

    // Dispute status determines switching section: hide only for 'Transaksi Tidak Ditemukan'
    let switchingContent = '';
    if (disStatus === 'Transaksi Tidak Ditemukan') {
        switchingContent = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; font-family: 'Inter', sans-serif;">
                <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> Tidak ada data Switching (Transaksi Tidak Ditemukan)
            </div>
        `;
    } else {
        switchingContent = `
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">Nama Switching</td>
                    <td class="detail-value">${t.switching}</td>
                </tr>
                <tr>
                    <td class="detail-label">Response Code</td>
                    <td class="detail-value"><span class="status-badge status-${t.rc === '00' ? 'sukses' : (t.rc === '68' ? 'sukses' : 'gagal')}">${t.rc}</span></td>
                </tr>
                <tr>
                    <td class="detail-label">Reference Number</td>
                    <td class="detail-value">${t.refNo}</td>
                </tr>
                <tr>
                    <td class="detail-label">Nominal</td>
                    <td class="detail-value">Rp${t.nominal.toLocaleString('id-ID')}</td>
                </tr>
            </table>
        `;
    }

    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="fas fa-info-circle"></i> Detail Transaksi - Data Paydia</h3>
            ${paydiaContent}
        </div>

        <div class="modal-section">
            <h3 class="modal-section-title"><i class="fas fa-exchange-alt"></i> Detail Transaksi - Data Switching</h3>
            ${switchingContent}
        </div>
    `;
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ── Import Dispute Data Simulation ──
let importInterval = null;

function startImportDisputeData() {
    if (!permissions.inputDispute) {
        showToast('Access Denied', 'Anda tidak memiliki izin untuk mengimport dispute.');
        return;
    }
    
    importProgressOverlay.classList.add('show');
    importProgressBarFill.style.width = '0%';
    importProgressStatus.textContent = 'Membaca file (0%)';
    
    let percent = 0;
    if (importInterval) clearInterval(importInterval);
    
    importInterval = setInterval(() => {
        percent += 10;
        importProgressBarFill.style.width = percent + '%';
        importProgressStatus.textContent = `Memproses data dispute (${percent}%)`;
        
        if (percent === 30) {
            importProgressStatus.textContent = 'Menganalisis kolom dan data...';
        } else if (percent === 70) {
            importProgressStatus.textContent = 'Menyimpan entri dispute ke database...';
        }
        
        if (percent >= 100) {
            clearInterval(importInterval);
            setTimeout(() => {
                importProgressOverlay.classList.remove('show');
                
                // Add the 3 new mock disputes if not already added
                const checkExists = disputes.some(d => d.id === 'DISP-003');
                if (!checkExists) {
                    disputes.push(
                        { id: 'DISP-003', refId: 'TX-ACQ-20004', date: '2026-05-28 10:15:00', type: '1st chargeback', switching: 'Alto', nominal: 180000, status: 'Open', desc: 'Chargeback diajukan oleh pemegang kartu (1st chargeback)' },
                        { id: 'DISP-004', refId: 'TX-ACQ-20001', date: '2026-05-28 10:20:00', type: '2nd chargeback', switching: 'Jalin', nominal: 75000, status: 'Open', desc: 'Persetujuan dispute ditolak switching, mengajukan 2nd chargeback' },
                        { id: 'DISP-005', refId: 'TX-ACQ-20002', date: '2026-05-28 10:25:00', type: 'good faith', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Penyelesaian secara good faith dengan pihak acquirer' }
                    );
                    saveDisputesToStorage();
                }
                
                writeLog('Import Dispute', 'email : dion@paydia.id\naction : Mengimport data dispute dari CSV. 3 entri baru ditambahkan.');
                showToast('Import Berhasil', '3 data dispute baru berhasil diimport dari file CSV.');
                renderTableData();
            }, 300);
        }
    }, 150);
}

// ── Open Dispute Search Modal ──
function openDisputeSearchModal() {
    if (!permissions.inputDispute) {
        showToast('Access Denied', 'Anda tidak memiliki izin untuk menginput dispute.');
        return;
    }
    const rrnInput = document.getElementById('searchDisputeRrn');
    const startDateInput = document.getElementById('searchDisputeStartDate');
    const endDateInput = document.getElementById('searchDisputeEndDate');
    const tbody = document.getElementById('disputeSearchTableBody');
    const submitBtn = document.getElementById('disputeSubmitBtn');
    const selectAll = document.getElementById('disputeSearchSelectAll');

    if (rrnInput) rrnInput.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (selectAll) selectAll.checked = false;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Silakan masukkan RRN dan/atau Range Tanggal untuk mencari transaksi.
                </td>
            </tr>
        `;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
    }

    const disputeOverlay = document.getElementById('disputeOverlay');
    if (disputeOverlay) disputeOverlay.classList.add('show');
}

function handleDisputeSearch() {
    const rrn = document.getElementById('searchDisputeRrn').value.trim();
    const startDate = document.getElementById('searchDisputeStartDate').value;
    const endDate = document.getElementById('searchDisputeEndDate').value;
    const tbody = document.getElementById('disputeSearchTableBody');
    const selectAll = document.getElementById('disputeSearchSelectAll');
    const submitBtn = document.getElementById('disputeSubmitBtn');

    if (selectAll) selectAll.checked = false;
    if (submitBtn) submitBtn.disabled = true;

    if (!rrn && !startDate && !endDate) {
        showToast('Peringatan', 'Silakan masukkan RRN dan/atau Range Tanggal terlebih dahulu.');
        return;
    }

    let results = transactions.filter(t => {
        if (rrn && t.refNo && !t.refNo.includes(rrn)) return false;
        if (rrn && !t.refNo) return false;
        const tDate = t.date.substring(0, 10);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
    });

    if (tbody) {
        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">
                        Tidak ditemukan transaksi yang cocok.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = '';
            results.forEach(t => {
                const tr = document.createElement('tr');
                const nominalTx = t.nominal;
                const nominalTip = Math.floor(nominalTx * 0.05);
                const nominalMdr = Math.floor(nominalTx * 0.007);
                const nominalTotal = nominalTx + nominalTip + nominalMdr;

                tr.innerHTML = `
                    <td style="text-align: center;"><input type="checkbox" class="dispute-search-checkbox" data-id="${t.id}"></td>
                    <td style="font-variant-numeric: tabular-nums;">${t.date}</td>
                    <td>${t.id}</td>
                    <td style="font-variant-numeric: tabular-nums;">${t.refNo || '-'}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalTx.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTotal.toLocaleString('id-ID')}</strong></td>
                    <td>${t.merchantName}</td>
                    <td>${t.switching}</td>
                `;
                tbody.appendChild(tr);
            });

            // Re-bind listeners for checkboxes to enable submit button
            const checkboxes = tbody.querySelectorAll('.dispute-search-checkbox');
            checkboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const anyChecked = Array.from(checkboxes).some(c => c.checked);
                    if (submitBtn) submitBtn.disabled = !anyChecked;
                    if (selectAll) {
                        selectAll.checked = Array.from(checkboxes).every(c => c.checked);
                    }
                });
            });
        }
    }
}

function handleDisputeBulkSubmit() {
    const tbody = document.getElementById('disputeSearchTableBody');
    if (!tbody) return;

    const checkedCbs = tbody.querySelectorAll('.dispute-search-checkbox:checked');
    if (checkedCbs.length === 0) return;

    let addedCount = 0;
    checkedCbs.forEach(cb => {
        const txId = cb.dataset.id;
        const reason = 'good faith';

        const t = transactions.find(trx => trx.id === txId);
        if (t) {
            const dispId = 'DISP-' + String(disputes.length + 1).padStart(3, '0');
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';

            const nominalTx = t.nominal;
            const nominalTip = Math.floor(nominalTx * 0.05);
            const nominalMdr = Math.floor(nominalTx * 0.007);
            const nominalTotal = nominalTx + nominalTip + nominalMdr;

            const newDisp = {
                id: dispId,
                txId: t.id,
                refId: t.id,
                rrn: t.refNo,
                date: dateStr,
                type: reason,
                nominalTx,
                nominalTip,
                nominalMdr,
                nominalTotal,
                nominal: nominalTotal,
                merchant: t.merchantName,
                merchantName: t.merchantName,
                switching: t.switching,
                status: 'Open',
                desc: 'Penyelesaian secara good faith'
            };

            disputes.unshift(newDisp);
            t.disputeRef = dispId;
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveDisputesToStorage();
        saveTrxToStorage();
        showToast('Dispute Disimpan', `${addedCount} transaksi berhasil ditambahkan ke tabel dispute.`);
        writeLog('add-dispute-goodfaith', `email : dion@paydia.id\naction : Menambahkan ${addedCount} data dispute good faith`);
    }

    const disputeOverlay = document.getElementById('disputeOverlay');
    if (disputeOverlay) disputeOverlay.classList.remove('show');

    renderTableData();
}

function initDisputeSearchModal() {
    const btnSearch = document.getElementById('btnSearchDisputeTrx');
    const selectAll = document.getElementById('disputeSearchSelectAll');
    const submitBtn = document.getElementById('disputeSubmitBtn');

    if (btnSearch) {
        btnSearch.addEventListener('click', handleDisputeSearch);
    }

    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const isChecked = selectAll.checked;
            const checkboxes = document.querySelectorAll('.dispute-search-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
            });
            if (submitBtn) submitBtn.disabled = !isChecked || checkboxes.length === 0;
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', handleDisputeBulkSubmit);
    }
}

// ── Notes for Dispute ──
let rrnNotes = JSON.parse(localStorage.getItem('paydia_rrn_notes') || '{}');

function initNotesModal() {
    const notesOverlay = document.getElementById('notesOverlay');
    const notesClose = document.getElementById('notesClose');
    const notesCancelBtn = document.getElementById('notesCancelBtn');
    const notesForm = document.getElementById('notesForm');
    const notesText = document.getElementById('notesText');
    const notesCharCount = document.getElementById('notesCharCount');
    const notesTargetId = document.getElementById('notesTargetId');
    const notesTextError = document.getElementById('notesTextError');

    if (notesClose) {
        notesClose.addEventListener('click', () => {
            notesOverlay.classList.remove('show');
        });
    }

    if (notesCancelBtn) {
        notesCancelBtn.addEventListener('click', () => {
            notesOverlay.classList.remove('show');
        });
    }

    if (notesText) {
        notesText.addEventListener('input', () => {
            const len = notesText.value.length;
            notesCharCount.textContent = `${len} / 255`;
        });
    }

    if (notesForm) {
        notesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const noteVal = notesText.value.trim();
            if (!noteVal) {
                notesTextError.classList.add('show');
                return;
            }
            notesTextError.classList.remove('show');
            const targetId = notesTargetId.value;
            
            if (targetId.startsWith('DISP-')) {
                const disp = disputes.find(d => d.id === targetId);
                if (disp) {
                    disp.desc = noteVal;
                    saveDisputesToStorage();
                    writeLog('edit-notes-dispute', `email : dion@paydia.id\naction : Mengedit catatan dispute record ${targetId}`);
                    showToast('Catatan Disimpan', 'Catatan dispute berhasil disimpan.');
                }
            } else {
                rrnNotes[targetId] = noteVal;
                localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes));
                
                const t = transactions.find(item => item.id === targetId);
                if (t && t.flaggingStatus === 'On Hold') {
                    t.flaggingStatus = 'Ada Catatan';
                    saveTrxToStorage();
                }
                showToast('Catatan Disimpan', 'Catatan transaksi unmatch berhasil disimpan.');
                writeLog('edit-notes-unmatch', `email : dion@paydia.id\naction : Menyimpan catatan untuk ID ${targetId}`);
            }
            
            notesOverlay.classList.remove('show');
            renderTableData();
        });
    }
}

function openNotesForm(id) {
    const notesOverlay = document.getElementById('notesOverlay');
    const notesText = document.getElementById('notesText');
    const notesTargetId = document.getElementById('notesTargetId');
    const notesCharCount = document.getElementById('notesCharCount');
    const notesTextError = document.getElementById('notesTextError');

    if (!notesOverlay || !notesText || !notesTargetId) return;

    notesTextError.classList.remove('show');
    notesTargetId.value = id;
    
    let existingNote = '';
    if (id.startsWith('DISP-')) {
        const disp = disputes.find(d => d.id === id);
        existingNote = disp ? (disp.desc || '') : '';
        const titleEl = document.querySelector('#notesOverlay .modal-title');
        if (titleEl) titleEl.textContent = 'Lihat / Edit Catatan Dispute';
    } else {
        existingNote = rrnNotes[id] || '';
        const titleEl = document.querySelector('#notesOverlay .modal-title');
        if (titleEl) titleEl.textContent = 'Lihat / Edit Catatan Transaksi';
    }
    
    notesText.value = existingNote;
    notesCharCount.textContent = `${existingNote.length} / 255`;
    notesOverlay.classList.add('show');
}

// ── Bind Interactive Events ──
function bindEvents() {
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('open');
        filterBtn.classList.toggle('active');
    });

    const btnClearAll = document.getElementById('btnClearAll');
    const btnApplyFilters = document.getElementById('btnApplyFilters');

    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('filterStartDate').value = `${yyyy}-${mm}-${dd}`;
            document.getElementById('filterEndDate').value = `${yyyy}-${mm}-${dd}`;
            document.getElementById('filterSwitching').selectedIndex = 0;
            document.getElementById('filterDisputeType').selectedIndex = 0;
            document.getElementById('filterStatus').selectedIndex = 0;
            searchInput.value = '';
            showToast('Filter Direset', 'Semua filter pencarian direset.');
            renderTableData();
        });
    }

    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            renderTableData();
            filterPanel.classList.remove('open');
            filterBtn.classList.remove('active');
        });
    }

    searchBtn.addEventListener('click', () => {
        renderTableData();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') renderTableData();
    });

    // Export CSV
    exportBtn.addEventListener('click', () => {
        const startVal = document.getElementById('filterStartDate').value || '2026-05-28';
        const endVal = document.getElementById('filterEndDate').value || '2026-05-28';
        let dateVal = startVal;
        if (startVal !== endVal) {
            dateVal = `${startVal}_to_${endVal}`;
        }
        const switchingVal = document.getElementById('filterSwitching').value || 'Semua';
        
        const originalText = exportBtn.innerHTML;
        let percent = 0;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengekspor (0%)';
        exportBtn.disabled = true;
        
        const interval = setInterval(() => {
            percent += 20;
            exportBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mengekspor (${percent}%)`;
            if (percent >= 100) {
                clearInterval(interval);
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
                writeLog('Ekspor Data Tabel', `email : dion@paydia.id\naction : Mengeksport data dispute sesi ${dateVal} (Switching: ${switchingVal})`);
                showToast('Export Selesai', `File export QRIS_Disputes_${dateVal}.csv berhasil diunduh.`);
                
                if(typeof window.showExcelSimulationModal === "function") {
                    let mappedData = (window.currentExportData || []).map(d => {
                        const trx = window.transactions ? window.transactions.find(item => item.id === d.refId || item.refNo === d.refId) : null;
                        return {
                            ...(trx || {}),
                            id: trx ? trx.id : (d.txId || d.refId || '-'),
                            refNo: trx ? trx.refNo : (d.rrn || '-'),
                            merchantName: d.merchantName || d.merchant || (trx ? trx.merchantName : 'Kopi Kenangan'),
                            nominal: d.nominal,
                            nominalTx: d.nominalTx !== undefined ? d.nominalTx : d.nominal,
                            nominalTip: d.nominalTip !== undefined ? d.nominalTip : Math.floor(d.nominal * 0.05),
                            nominalMdr: d.nominalMdr !== undefined ? d.nominalMdr : Math.floor(d.nominal * 0.007),
                            date: d.date,
                            type: d.type,
                            status: d.status,
                            disputeRef: d.id,
                            switching: d.switching || (trx ? trx.switching : '-'),
                            label: d.type,
                            catatan: d.catatan || '-'
                        };
                    });
                    window.showExcelSimulationModal(mappedData, 'Dispute');
                }
            }
        }, 100);
    });

    if (btnImportData) {
        btnImportData.addEventListener('click', () => {
            startImportDisputeData();
        });
    }

    document.getElementById('disputeClose').addEventListener('click', () => {
        disputeOverlay.classList.remove('show');
    });
    document.getElementById('disputeCancelBtn').addEventListener('click', () => {
        disputeOverlay.classList.remove('show');
    });

    const btnAddDispute = document.getElementById('btnAddDispute');
    if (btnAddDispute) {
        btnAddDispute.addEventListener('click', () => {
            openDisputeSearchModal();
        });
    }

    // Permissions toggles
    const permInputs = [permRead, permFlagging, permInputDispute, permExport, permApprove, permRerun, permLog];
    permInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', () => {
                savePermissions();
            });
        }
    });

    // Permission collapse toggle
    const permissionWidgetToggle = document.getElementById('permissionWidgetToggle');
    const permissionWidget = document.getElementById('permissionWidget');
    if (permissionWidgetToggle && permissionWidget) {
        permissionWidgetToggle.addEventListener('click', () => {
            permissionWidget.classList.toggle('collapsed');
        });
    }

    // Bukti upload button click → trigger hidden file input
    document.addEventListener('click', (e) => {
        const uploadBtn = e.target.closest('.btn-upload-bukti');
        if (uploadBtn) {
            e.preventDefault();
            const wrap = uploadBtn.closest('.bukti-upload-wrap');
            if (wrap) {
                const fileInput = wrap.querySelector('.input-bukti');
                if (fileInput) fileInput.click();
            }
            return;
        }

        // Lihat Bukti button
        const lihatBtn = e.target.closest('.btn-lihat-bukti');
        if (lihatBtn) {
            e.preventDefault();
            const id = lihatBtn.dataset.id;
            const d = disputes.find(x => x.id === id);
            if (d && d.buktiUrl) {
                window._buktiActiveId = id;
                document.getElementById('buktiPreviewImg').src = d.buktiUrl;
                const overlay = document.getElementById('buktiPreviewOverlay');
                if (overlay) { overlay.style.display = 'flex'; overlay.classList.add('show'); }
            }
            return;
        }
    });

    // File input change → validate + upload
    document.addEventListener('change', (e) => {
        const fileInput = e.target.closest('.input-bukti');
        if (!fileInput) return;
        const id = fileInput.dataset.id;
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            showToast('Upload Gagal', 'Ukuran file melebihi 1MB');
            fileInput.value = '';
            return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showToast('Upload Gagal', 'Format tidak valid. Hanya JPG/PNG yang diizinkan');
            fileInput.value = '';
            return;
        }

        const wrap = fileInput.closest('.bukti-upload-wrap');
        const btn = wrap ? wrap.querySelector('.btn-upload-bukti') : null;
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setTimeout(() => {
                const d = disputes.find(x => x.id === id);
                if (d) {
                    d.buktiUrl = ev.target.result;
                    saveDisputesToStorage();
                    showToast('Upload Berhasil', 'Bukti berhasil diupload');
                }
                renderTableData();
            }, 300);
        };
        reader.onerror = () => {
            showToast('Upload Gagal', 'Gagal membaca file');
            if (btn) { btn.innerHTML = '<i class="fas fa-upload"></i> Upload'; btn.disabled = false; }
        };
        reader.readAsDataURL(file);
    });

    // Tipe Dispute dropdown change
    document.addEventListener('change', (e) => {
        const sel = e.target.closest('.select-tipe-dispute');
        if (!sel) return;
        const id = sel.dataset.id;
        const d = disputes.find(x => x.id === id);
        if (d) {
            d.tipeDispute = sel.value;
            saveDisputesToStorage();
        }
    });

    // Bukti preview modal close and hapus
    const buktiClose = document.getElementById('buktiPreviewClose');
    if (buktiClose) {
        buktiClose.addEventListener('click', () => {
            const overlay = document.getElementById('buktiPreviewOverlay');
            if (overlay) { overlay.classList.remove('show'); overlay.style.display = 'none'; }
            window._buktiActiveId = null;
        });
    }
    const buktiHapus = document.getElementById('buktiHapusBtn');
    if (buktiHapus) {
        buktiHapus.addEventListener('click', () => {
            const id = window._buktiActiveId;
            if (id) {
                const d = disputes.find(x => x.id === id);
                if (d) { delete d.buktiUrl; saveDisputesToStorage(); }
            }
            const overlay = document.getElementById('buktiPreviewOverlay');
            if (overlay) { overlay.classList.remove('show'); overlay.style.display = 'none'; }
            window._buktiActiveId = null;
            renderTableData();
        });
    }

    // Drill-down and Edit Dispute handler
    document.addEventListener('click', (e) => {
        const editDispBtn = e.target.closest('.btn-edit-dispute');
        if (editDispBtn) {
            e.preventDefault();
            const id = editDispBtn.dataset.id;
            openNotesForm(id);
            return;
        }

        const detailLink = e.target.closest('.detail-trx-trigger');
        if (detailLink) {
            e.preventDefault();
            const id = detailLink.dataset.id;
            openDetailModal(id);
            return;
        }
    });

    document.getElementById('modalClose').addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
    });

    // General escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('show');
            disputeOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Sidebar Mobile Toggle Actions
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    });

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    });

    // Submenu toggles (sidebar)
    document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const group = item.closest('.nav-group');
            if (group) {
                const submenu = group.querySelector('.submenu');
                const arrow = item.querySelector('.submenu-arrow');
                const isOpen = group.classList.contains('open');
                if (isOpen) {
                    group.classList.remove('open');
                    submenu.classList.remove('open');
                    arrow.classList.remove('fa-chevron-up');
                    arrow.classList.add('fa-chevron-down');
                } else {
                    group.classList.add('open');
                    submenu.classList.add('open');
                    arrow.classList.remove('fa-chevron-down');
                    arrow.classList.add('fa-chevron-up');
                }
            }
        });
    });
}

// ── Toast Helper ──
function showToast(title, msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas fa-info-circle toast-icon"></i>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        </div>
        <button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    setTimeout(() => removeToast(toast), 3500);
}

function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
}

// ── Mock Data Control Actions ──
function initMockDataControl() {
    const btnPopulateMock = document.getElementById('btnPopulateMock');
    const btnClearData = document.getElementById('btnClearData');
    const simulatorWidgetToggle = document.getElementById('simulatorWidgetToggle');
    const simulatorWidget = document.getElementById('simulatorWidget');

    if (simulatorWidgetToggle && simulatorWidget) {
        simulatorWidgetToggle.addEventListener('click', () => {
            simulatorWidget.classList.toggle('collapsed');
            const arrow = simulatorWidgetToggle.querySelector('.widget-arrow');
            if (arrow) {
                if (simulatorWidget.classList.contains('collapsed')) {
                    arrow.classList.remove('fa-chevron-up');
                    arrow.classList.add('fa-chevron-down');
                } else {
                    arrow.classList.remove('fa-chevron-down');
                    arrow.classList.add('fa-chevron-up');
                }
            }
        });
    }

    if (btnPopulateMock) {
        btnPopulateMock.addEventListener('click', () => {
            localStorage.setItem('paydia_mock_populated', 'true');
            localStorage.setItem('paydia_recon_trx', JSON.stringify(rawTransactions));
            localStorage.setItem('paydia_disputes', JSON.stringify([
                { id: 'DISP-001', refId: 'REF-20260527-021', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
                { id: 'DISP-002', refId: 'TX-ISS-20001', date: '2026-05-28 09:44:00', type: 'good faith', switching: 'Rintis', nominal: 89000, status: 'Open', desc: 'Dana menggantung di switching, merchant belum terima dana' }
            ]));
            localStorage.setItem('paydia_logs', JSON.stringify(seedLogs));
            localStorage.removeItem('paydia_status_overrides');
            localStorage.setItem('paydia_approvals', JSON.stringify([]));

            showToast('Populasi Mock Data', 'Mockup data berhasil di-populate. Menyegarkan halaman...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    if (btnClearData) {
        btnClearData.addEventListener('click', () => {
            localStorage.setItem('paydia_mock_populated', 'false');
            localStorage.removeItem('paydia_recon_trx');
            localStorage.removeItem('paydia_disputes');
            localStorage.removeItem('paydia_logs');
            localStorage.removeItem('paydia_approvals');
            localStorage.removeItem('paydia_status_overrides');
            
            showToast('Hapus Data', 'Semua data telah dikosongkan. Menyegarkan halaman...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
}

document.addEventListener('click', (e) => {
    const markBtn = e.target.closest('.btn-mark-done');
    if (markBtn) {
        const disputeId = markBtn.getAttribute('data-id');
        const dispute = disputes.find(d => d.id == disputeId);
        if (dispute) {
            if(confirm('Tandai dispute ini sebagai Selesai?')) {
                dispute.status = 'Closed';
                localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
                renderTableData();
                showToast('Sukses', 'Dispute ditandai sebagai Selesai.');
            }
        }
        return;
    }

    const tolakBtn = e.target.closest('.btn-tolak-proses');
    if (tolakBtn) {
        const disputeId = tolakBtn.getAttribute('data-id');
        const dispute = disputes.find(d => d.id == disputeId);
        if (dispute) {
            if(confirm(`Apakah Anda yakin ingin menolak proses dispute ${disputeId}?`)) {
                dispute.status = 'Ditolak';
                localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
                renderTableData();
                showToast('Sukses', `Dispute ${disputeId} telah ditolak.`);
            }
        }
        return;
    }

    const isPendingApproval = (refId) => {
        const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
        return approvals.some(a => a.refId == refId && a.status === 'Pending');
    };

    const buatBtn = e.target.closest('.btn-buat-trx');
    if (buatBtn) {
        const disputeId = buatBtn.getAttribute('data-id');
        const dispute = disputes.find(d => d.id == disputeId);
        if (dispute) {
            if(confirm(`Apakah Anda yakin ingin membuat transaksi untuk dispute ${disputeId}?`)) {
                dispute.status = 'Transaksi Terbuat';
                localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
                
                // Add actual transaction record in paydia_recon_trx so it shows up in QRIS MPM page
                const savedTrx = localStorage.getItem('paydia_recon_trx');
                const trxs = savedTrx ? JSON.parse(savedTrx) : [];
                const exists = trxs.some(t => t.id === 'TX-DISP-' + dispute.id);
                if (!exists) {
                    trxs.unshift({
                        id: 'TX-DISP-' + dispute.id,
                        refNo: dispute.refId || ('REF-' + Date.now()),
                        date: dispute.date,
                        nominal: dispute.nominal,
                        merchantId: 'MID-88129',
                        merchantName: dispute.merchantName || 'Kopi Kenangan',
                        rc: '00',
                        switching: dispute.switching,
                        statusRekon: 'Matched',
                        label: 'Match',
                        flaggingStatus: 'Unflagged',
                        tipe: 'Acquirer',
                        skema: 'MPM',
                        domestic: 'Domestic',
                        disputeRef: dispute.id
                    });
                    localStorage.setItem('paydia_recon_trx', JSON.stringify(trxs));
                }

                renderTableData();
                showToast('Sukses', `Transaksi berhasil dibuat untuk dispute ${disputeId}.`);
            }
        }
        return;
    }

    const settleBtn = e.target.closest('.btn-flag-settle');
    if (settleBtn) {
        const disputeId = settleBtn.getAttribute('data-id');
        const dispute = disputes.find(d => d.id == disputeId);
        if (dispute) {
            if (isPendingApproval(dispute.id)) {
                showToast('Peringatan', 'data sudah direquest approval, mohon tunggu');
                return;
            }
            if(confirm(`Apakah Anda yakin ingin mengajukan Flag Settle untuk dispute ${disputeId}? (Memerlukan persetujuan Management)`)) {
                // Keep status as 'Transaksi Terbuat' while pending approval
                const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                const now = new Date();
                const timeStr = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
                approvals.unshift({
                    id: 'RQ-' + (10000 + Math.floor(Math.random() * 90000)),
                    tanggal: timeStr,
                    account: `Flag Settle: Dispute ${dispute.id}\nRef: ${dispute.refId}`,
                    admin: 'Dion',
                    tipeRequest: 'Ubah Transaksi Mismatch',
                    refTable: 'dispute',
                    actionType: 'flag_settle',
                    status: 'Pending',
                    refId: dispute.id,
                    alasan: 'Persetujuan flag settle data dispute',
                    nominal: dispute.nominal || 0,
                    statusRekon: 'Pending'
                });
                localStorage.setItem('paydia_approvals', JSON.stringify(approvals));
                
                renderTableData();
                showToast('Pending Approval', `Pengajuan pending approval berhasil dikirim untuk dispute ${disputeId}.`);
            }
        }
        return;
    }
});





window.showExcelSimulationModal = function(data, tabName) {
    let overlay = document.getElementById('excelSimulationOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'excelSimulationOverlay';
        document.body.appendChild(overlay);
    }
    
    const isMatched = tabName.toLowerCase().includes('match') && !tabName.toLowerCase().includes('unmatch');
    const isUnmatched = tabName.toLowerCase().includes('unmatch');
    const isDecline = tabName.toLowerCase().includes('decline');
    const isDispute = tabName.toLowerCase().includes('dispute');

    let cols = [
        { key: 'no', label: 'No' },
        { key: 'idTx', label: 'ID Transaksi' },
        { key: 'rrn', label: 'RRN' },
        { key: 'paydiaDate', label: 'Tanggal Waktu' },
        { key: 'swDate', label: 'Tanggal Transaksi di Switching' },
        { key: 'swTime', label: 'Jam Transaksi di Switching' },
        { key: 'nominalTx', label: 'Nominal Transaksi' },
        { key: 'nominalTip', label: 'Nominal Tip' },
        { key: 'nominalMdr', label: 'Nominal MDR' },
        { key: 'nominalTotal', label: 'Nominal Total' },
        { key: 'merchantId', label: 'Merchant ID' },
        { key: 'merchantName', label: 'Nama Merchant' },
        { key: 'customerData', label: 'Customer Data' },
        { key: 'customerPan', label: 'Customer PAN' },
        { key: 'acquirerId', label: 'Acquirer ID' },
        { key: 'issuerName', label: 'Issuer Name' },
        { key: 'terminalId', label: 'Terminal ID' },
        { key: 'rcSwitching', label: 'RC Switching' },
        { key: 'rcPaydia', label: 'Status Transaksi' },
        { key: 'switchingName', label: 'Switching' }
    ];

    if (!isMatched && !isDecline) cols.push({ key: 'tipeUnmatch', label: 'Tipe Unmatch / Match' });
    if (isUnmatched) cols.push({ key: 'flagging', label: 'Flagging Status' });
    cols.push({ key: 'domestic', label: 'Domestic / Crossborder' });
    if (isUnmatched || isDispute) cols.push({ key: 'catatan', label: 'Catatan' });

    const theadHTML = cols.map(c => `<th style="padding: 6px 12px; border: 1px solid #c8c6c4; text-align: left; font-weight: 600; color: #323130;">${c.label}</th>`).join('');

    let trsHTML = '';
    if (!data || data.length === 0) {
        trsHTML = `<tr><td colspan="${cols.length}" style="padding: 12px; text-align: center; color: #666;">Tidak ada data untuk diexport.</td></tr>`;
    } else {
        data.forEach((t, i) => {
            let isPaydiaOnly = (t.label || t.statusRekon || '').startsWith('Paydia-Only');
            let isSwitchingOnly = (t.label || t.statusRekon || '').startsWith('Switching-Only');

            let hash = 0;
            let txIdStr = t.id || t.refNo || '';
            for (let j = 0; j < txIdStr.length; j++) {
                hash = txIdStr.charCodeAt(j) + ((hash << 5) - hash);
            }
            hash = Math.abs(hash);

            let nominalTx = t.nominalTx !== undefined ? t.nominalTx : t.nominal;
            let nominalTip = t.nominalTip !== undefined ? t.nominalTip : Math.floor(t.nominal * 0.05);
            let nominalMdr = t.nominalMdr !== undefined ? t.nominalMdr : Math.floor(t.nominal * 0.007);
            let nominalTotal = nominalTx - nominalTip - nominalMdr;

            let rcPaydiaCode = t.rcPaydia || t.rc || '-';
            let statusTxVal = '-';
            if (rcPaydiaCode === '00') statusTxVal = 'Sukses';
            else if (rcPaydiaCode === '68') statusTxVal = 'Pending';
            else if (rcPaydiaCode !== '-') statusTxVal = 'Gagal';

            let vals = {
                no: i + 1,
                idTx: t.id || '-',
                rrn: t.refNo || t.rrn || '-',
                paydiaDate: t.date || '-',
                swDate: t.date ? t.date.substring(0, 10) : '-',
                swTime: t.switchingTime || (t.date ? t.date.substring(11) : '-'),
                nominalTx: nominalTx,
                nominalTip: nominalTip,
                nominalMdr: nominalMdr,
                nominalTotal: nominalTotal,
                merchantId: 'M' + (t.refNo ? t.refNo.substring(0, 8) : '00000000') + 'ID',
                merchantName: t.merchantName || '-',
                customerData: ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay'][hash % 5] + ' - ' + ['Budi Santoso', 'Andi Wijaya', 'Siti Rahma', 'Dewi Lestari', 'Rian Hidayat', 'Mega Wati', 'Joni Pratama'][hash % 7],
                customerPan: '936008******' + (1000 + (hash % 9000)),
                acquirerId: '93600' + (100 + (hash % 900)),
                issuerName: ['BCA', 'Bank Mandiri', 'BRI', 'BNI', 'Bank Danamon', 'CIMB Niaga'][hash % 6],
                terminalId: 'TID-' + (10000 + (hash % 90000)),
                rcSwitching: t.rcSwitching || t.rc || '-',
                rcPaydia: statusTxVal,
                switchingName: t.switching || '-',
                tipeUnmatch: t.label || t.statusRekon || '-',
                flagging: t.flaggingStatus || '-',
                domestic: t.domestic || '-',
                catatan: t.catatan || '-'
            };

            if (isUnmatched) {
                if (isPaydiaOnly) {
                    vals.rrn = '-';
                    vals.swDate = '-';
                    vals.swTime = '-';
                    vals.rcSwitching = '-';
                    vals.switchingName = '-';
                }
                if (isSwitchingOnly) {
                    vals.idTx = '-';
                    vals.paydiaDate = '-';
                    vals.merchantId = '-';
                    vals.merchantName = '-';
                    vals.customerData = '-';
                    vals.customerPan = '-';
                    vals.acquirerId = '-';
                    vals.issuerName = '-';
                    vals.terminalId = '-';
                    vals.rcPaydia = '-';
                    vals.domestic = '-';
                    
                    vals.nominalTx = t.nominalSwitching || t.nominal;
                    vals.nominalTip = '-';
                    vals.nominalMdr = '-';
                    vals.nominalTotal = vals.nominalTx;
                }
            }

            let tds = cols.map(c => `<td style="padding: 6px 12px; border: 1px solid #e1dfdd; color: #323130;">${vals[c.key]}</td>`).join('');
            trsHTML += `<tr>${tds}</tr>`;
        });
    }

    overlay.innerHTML = `
        <div class="modal" style="max-width: 95%; width: 1200px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div class="modal-header" style="background: #107c41; color: white; padding: 12px 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <h2 class="modal-title" style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;"><i class="fas fa-file-excel" style="margin-right: 8px;"></i> Excel Export Simulation - <span id="excelTabName">${tabName || 'Exported Data'}</span></h2>
                <button class="modal-close" id="excelSimClose" aria-label="Tutup" style="color: white; background: transparent; border: none; font-size: 1.2rem; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="flex: 1; overflow: auto; padding: 0; background: #f3f2f1;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Calibri', sans-serif; font-size: 0.85rem; white-space: nowrap; background: white;">
                    <thead style="position: sticky; top: 0; z-index: 10;">
                        <tr style="background: #f3f2f1; border-bottom: 2px solid #c8c6c4;">
                            ${theadHTML}
                        </tr>
                    </thead>
                    <tbody id="excelSimTbody">
                        ${trsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('excelSimClose').addEventListener('click', () => {
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    });

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
};
