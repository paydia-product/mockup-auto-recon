/* ============================================
   Paydia Bisnis – Unified Activity Log Page Logic
   ============================================ */

const seedLogs = [
    { id: 9501, tanggal: '28-05-2026 14:02:11', container: 'paydia-reconcile', type: 'flag-recon-unmatch', detail: 'email : dion@paydia.id\naction : Mengubah status transaksi TX-ACQ-20001 menjadi Flag Recon', ip: '125.161.77.69' },
    { id: 9502, tanggal: '28-05-2026 14:05:19', container: 'paydia-reconcile', type: 'flag-settle-unmatch', detail: 'email : dion@paydia.id\naction : Mengubah status transaksi TX-ACQ-20001 menjadi Flag Settle dan meneruskan ke settlement', ip: '125.161.77.69' },
    { id: 9503, tanggal: '28-05-2026 14:08:33', container: 'paydia-reconcile', type: 'edit-notes-unmatch', detail: 'email : dion@paydia.id\naction : Menyimpan catatan untuk ID TX-ACQ-20002', ip: '125.161.77.69' },
    { id: 9504, tanggal: '28-05-2026 14:10:00', container: 'paydia-reconcile', type: 'edit-notes-dispute', detail: 'email : dion@paydia.id\naction : Mengedit catatan dispute record DISP-001', ip: '125.161.77.69' },
    { id: 9505, tanggal: '28-05-2026 14:12:00', container: 'paydia-trx-mpm', type: 'cancel-transaction-mpm', detail: 'email : dion@paydia.id\naction : Batalkan transaksi TX-ACQ-20002 di halaman transaction - qris mpm', ip: '125.161.77.69' },
    { id: 9506, tanggal: '28-05-2026 14:15:00', container: 'paydia-settle-recon', type: 'settle-settlement', detail: 'email : dion@paydia.id\naction : Melakukan settlement transaksi TX-ACQ-20002', ip: '125.161.77.69' },
    { id: 9507, tanggal: '28-05-2026 14:18:00', container: 'paydia-settle-recon', type: 'cancel-settlement', detail: 'email : dion@paydia.id\naction : Batalkan settlement transaksi TX-ACQ-20002', ip: '125.161.77.69' },
    { id: 9508, tanggal: '28-05-2026 14:20:00', container: 'paydia-reconcile', type: 'export-matched', detail: 'email : dion@paydia.id\naction : Export data tabel matched', ip: '125.161.77.69' },
    { id: 9509, tanggal: '28-05-2026 14:22:00', container: 'paydia-reconcile', type: 'export-unmatched', detail: 'email : dion@paydia.id\naction : Export data tabel unmatched', ip: '125.161.77.69' },
    { id: 9510, tanggal: '28-05-2026 14:24:00', container: 'paydia-reconcile', type: 'export-dispute', detail: 'email : dion@paydia.id\naction : Export data tabel dispute', ip: '125.161.77.69' },
    { id: 9511, tanggal: '28-05-2026 14:26:00', container: 'paydia-reconcile', type: 'export-declined', detail: 'email : dion@paydia.id\naction : Export data tabel declined', ip: '125.161.77.69' },
    { id: 9512, tanggal: '28-05-2026 14:28:00', container: 'paydia-reconcile', type: 'add-dispute-goodfaith', detail: 'email : dion@paydia.id\naction : Menambahkan 1 data dispute good faith', ip: '125.161.77.69' },
    // ── Auto Settlement: request approval & approve/reject ──
    { id: 95001, tanggal: '30-06-2026 09:05:00', container: 'paydia-auto-settlement', type: 'request-hold', detail: 'email : dion@paydia.id\naction : Mengajukan request approval Hold (Hold Semua) STL-3847075823\ncatatan : Indikasi transaksi mencurigakan, perlu verifikasi merchant\nbukti : bukti-hold-3847075823.pdf', ip: '125.161.77.69' },
    { id: 95002, tanggal: '30-06-2026 09:07:30', container: 'paydia-auto-settlement', type: 'request-hold-partial', detail: 'email : dion@paydia.id\naction : Mengajukan request approval Hold Partial (MID-77001) STL-8800123456789\ncatatan : Hold sebagian MID karena dispute belum selesai\nbukti : bukti-hold-partial-mid77001.jpg', ip: '125.161.77.69' },
    { id: 95003, tanggal: '30-06-2026 09:10:12', container: 'paydia-auto-settlement', type: 'request-hold-min', detail: 'email : dion@paydia.id\naction : Mengajukan request approval Hold Dibawah Min. Transaksi STL-6600055554444\ncatatan : Total settle di bawah Rp10.000 untuk bank non-core\nbukti : bukti-hold-min-6600055554444.png', ip: '125.161.77.69' },
    { id: 95004, tanggal: '30-06-2026 09:13:45', container: 'paydia-auto-settlement', type: 'request-reject', detail: 'email : dion@paydia.id\naction : Mengajukan request approval Reject STL-1370011223344\ncatatan : Rekening tujuan tidak valid, settlement ditolak\nbukti : bukti-reject-1370011223344.pdf', ip: '125.161.77.69' },
    { id: 95005, tanggal: '30-06-2026 09:16:20', container: 'paydia-auto-settlement', type: 'request-settle', detail: 'email : dion@paydia.id\naction : Mengajukan request approval Settle STL-024701001749308\nchannel payment : Mandiri\nmetode transfer : BI-Fast\ncatatan : Settlement reguler harian\nbukti : bukti-settle-024701001749308.jpg', ip: '125.161.77.69' },
    { id: 95006, tanggal: '30-06-2026 10:02:05', container: 'paydia-auto-settlement', type: 'approve-approval', detail: 'email : approver@paydia.id\naction : Menyetujui (Approve) request Settle STL-024701001749308 — status sebelumnya Checker', ip: '125.161.77.69' },
    { id: 95007, tanggal: '30-06-2026 10:05:48', container: 'paydia-auto-settlement', type: 'reject-approval', detail: 'email : approver@paydia.id\naction : Menolak (Reject) request Hold STL-3847075823 — dikembalikan ke status sebelumnya (Checker)', ip: '125.161.77.69' },
    { id: 95008, tanggal: '30-06-2026 10:12:03', container: 'paydia-auto-settlement', type: 'bulk-settle', detail: 'email : dion@paydia.id\naction : Bulk Settle 3 entry [Otomatis] via BCA / BI-Fast', ip: '125.161.77.69' },
    { id: 95009, tanggal: '30-06-2026 10:20:41', container: 'paydia-auto-settlement', type: 'reject-by-bank', detail: 'email : dion@paydia.id\naction : Menandai settlement STL-7100099887766 sebagai Reject by Bank (Metode Manual)', ip: '125.161.77.69' },
    { id: 95010, tanggal: '30-06-2026 10:28:15', container: 'paydia-auto-settlement', type: 'export-settle', detail: 'email : dion@paydia.id\naction : Export tab Settle', ip: '125.161.77.69' },
    { id: 95011, tanggal: '30-06-2026 10:33:52', container: 'paydia-auto-settlement', type: 'export-segregasi', detail: 'email : dion@paydia.id\naction : Export Segregasi per Bank (30-06-2026)', ip: '125.161.77.69' },
    { id: 95012, tanggal: '30-06-2026 10:41:09', container: 'paydia-auto-settlement', type: 'retry-settlement', detail: 'email : dion@paydia.id\naction : Retry Settlement (Metode Otomatis, status Gagal) tanggal 30-06-2026 — 2 transaksi dikirim ulang ke bank', ip: '125.161.77.69' },
    { id: 95013, tanggal: '30-06-2026 10:48:37', container: 'paydia-auto-settlement', type: 'request-hold-partial-split', detail: 'email : dion@paydia.id\naction : Ajukan Hold Partial (MID-77001, MID-77002) dari STL-8800123456789 → settlement baru STL-8800123456789-P1', ip: '125.161.77.69' },
    { id: 9145, tanggal: '28-05-2026 15:01:39', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9144, tanggal: '28-05-2026 15:00:31', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9143, tanggal: '28-05-2026 14:57:42', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9142, tanggal: '28-05-2026 14:42:06', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : dion@paydia.id\nuser.type : admin', ip: '125.161.77.69' }
];

// ── State Management ──
let logs = [];
let currentPage = 1;
const itemsPerPage = 10;
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
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');

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
    // 1. Log view permission overlay
    const mainContent = document.querySelector('.main-content');
    const existingOverlay = document.getElementById('permissionErrorOverlay');
    
    if (!permissions.log) {
        if (!existingOverlay && mainContent) {
            const overlay = document.createElement('div');
            overlay.id = 'permissionErrorOverlay';
            overlay.className = 'permission-error-overlay';
            overlay.innerHTML = `
                <div class="permission-error-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2 class="permission-error-title">Akses Log Trail Dibatasi</h2>
                <p class="permission-error-desc">
                    Akun Anda tidak memiliki izin <strong>View Log Activity</strong>. Hubungi administrator sistem untuk meminta akses audit trail.
                </p>
            `;
            // Hide main contents
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
                    if (child.className !== 'filter-panel') {
                        child.style.display = '';
                    }
                });
            }
        }
    }

    // 2. Export check
    if (exportBtn) {
        exportBtn.style.display = permissions.export ? '' : 'none';
    }
}

// ── Initialize Log Page ──
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    loadPermissions();
    applyPermissions();
    bindEvents();
    renderTableData();
    initMockDataControl();
});

// Map raw writeLog types -> clean display types (PRD activity log naming).
const typeAliases = {
    // Tabel Unmatch
    'flag-recon-unmatch': 'Flag Recon',
    'bulk-unmatch-flag_recon': 'Flag Recon',
    'buat-trx-unmatch': 'Buat Transaksi',
    'buat-trx-unmatch-request': 'Buat Transaksi',
    'bulk-unmatch-buat_trx-request': 'Buat Transaksi',
    'flag-settle-unmatch': 'Flag Settle',
    'flag-settle-unmatch-request': 'Flag Settle',
    'bulk-unmatch-flag_settle-request': 'Flag Settle',
    'tolak-unmatch': 'Tolak',
    'bulk-unmatch-tolak': 'Tolak',
    'edit-notes-unmatch': 'Edit Catatan',
    'edit-notes-dispute': 'Edit Catatan',
    // Export
    'export-matched': 'Ekspor Data Tabel',
    'export-unmatched': 'Ekspor Data Tabel',
    'export-dispute': 'Ekspor Data Tabel',
    'export-declined': 'Ekspor Data Tabel',
    'export-csv': 'Ekspor Data Tabel',
    'Export': 'Ekspor Data Tabel',
    'Export CSV': 'Ekspor Data Tabel',
    'export-bank': 'Ekspor Segregasi per Bank',
    'Export Bank': 'Ekspor Segregasi per Bank',
    // Settle & Recon
    'settle-settlement': 'Settle Settlement',
    'settle-settle-recon': 'Settle Settlement',
    'cancel-settlement': 'Batalkan Settlement',
    'cancel-settlement-settle-recon': 'Batalkan Settlement',
    // Approval
    'approve-flag-settle-unmatch': 'Approval Flag Settle',
    'approve-buat-trx-unmatch': 'Approval Buat Transaksi',
    'approve-settlement': 'Finalisasi',
    // Dispute / others
    'add-dispute-goodfaith': 'Tambah Dispute Good Faith',
    'cancel-transaction-mpm': 'Batalkan Transaksi MPM',
    're-run-matching': 'Re-run Reconcile',
    'flagging-control': 'Flagging',
    'Flagging Control': 'Flagging',
    'telegram-alert': 'Telegram Alert',
    // Auto Settlement
    'request-hold': 'Ajukan Hold',
    'request-hold-partial': 'Ajukan Hold Partial',
    'request-hold-partial-split': 'Ajukan Hold Partial',
    'request-hold-min': 'Ajukan Hold Min. Transaksi',
    'request-reject': 'Ajukan Reject',
    'request-settle': 'Ajukan Settle',
    'approve-approval': 'Approve Request',
    'reject-approval': 'Reject Request',
    'bulk-settle': 'Bulk Settle',
    'reject-by-bank': 'Reject by Bank',
    'export-settle': 'Ekspor Data Tabel',
    'export-segregasi': 'Ekspor Segregasi per Bank',
    'retry-settlement': 'Retry Settlement'
};

function migrateLogTypes(list) {
    return list.map(l => ({
        ...l,
        type: typeAliases[l.type] || l.type
    }));
}

function initDatabase() {
    let populatedVal = localStorage.getItem('paydia_mock_populated');
    if (populatedVal === null) {
        localStorage.setItem('paydia_mock_populated', 'true');
        populatedVal = 'true';
    }
    const isPopulated = populatedVal === 'true';
    if (isPopulated) {
        const savedLogs = localStorage.getItem('paydia_logs');
        if (savedLogs) {
            const parsed = JSON.parse(savedLogs);
            logs = migrateLogTypes(parsed);
            // merge in any seed entries not yet present
            const existingIds = new Set(logs.map(l => l.id));
            const newEntries = migrateLogTypes(seedLogs.filter(s => !existingIds.has(s.id)));
            if (newEntries.length > 0) {
                logs = [...newEntries, ...logs];
            }
            localStorage.setItem('paydia_logs', JSON.stringify(logs));
        } else {
            logs = migrateLogTypes(seedLogs);
            localStorage.setItem('paydia_logs', JSON.stringify(logs));
        }
    } else {
        logs = [];
    }
}

// ── Main Rendering ──
function renderTableData() {
    const dateVal = document.getElementById('filterDate').value;
    const containerVals = [...document.querySelectorAll('.chk-container:checked')].map(c => c.value);
    const typeVals = [...document.querySelectorAll('.chk-type:checked')].map(c => c.value);
    const detailVal = (document.getElementById('filterDetail')?.value || '').trim().toLowerCase();
    const ipVal = (document.getElementById('filterIp')?.value || '').trim().toLowerCase();
    const searchVal = searchInput.value.trim().toLowerCase();

    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';

    // Date formatting helper for filter input comparison (YYYY-MM-DD -> DD-MM-YYYY)
    let filterDateStr = '';
    if (dateVal) {
        const parts = dateVal.split('-'); // [YYYY, MM, DD]
        filterDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    let filtered = logs.filter(l => {
        if (filterDateStr && !l.tanggal.startsWith(filterDateStr)) return false;
        if (containerVals.length && !containerVals.includes(l.container)) return false;
        if (typeVals.length && !typeVals.includes(l.type)) return false;
        if (detailVal && !l.detail.toLowerCase().includes(detailVal)) return false;
        if (ipVal && !l.ip.toLowerCase().includes(ipVal)) return false;
        if (searchVal &&
            !l.id.toString().includes(searchVal) &&
            !l.type.toLowerCase().includes(searchVal) &&
            !l.detail.toLowerCase().includes(searchVal) &&
            !l.ip.toLowerCase().includes(searchVal)) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Tidak ada data log yang sesuai</td></tr>`;
        updatePaginationInfo(0, 0);
        renderPaginationButtons(0);
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // Ensure currentPage is within valid range
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    const pageData = filtered.slice(startIndex, endIndex);

    // Render entries for current page only
    pageData.forEach((l) => {
        const tr = document.createElement('tr');

        // Detail lines wrapper
        const detailLines = l.detail.split('\n');
        let detailHtml = '';
        detailLines.forEach(line => {
            detailHtml += `<div class="log-detail-line">${line}</div>`;
        });

        tr.innerHTML = `
            <td>${l.id}</td>
            <td style="font-variant-numeric: tabular-nums;">${l.tanggal}</td>
            <td><strong>${l.container}</strong></td>
            <td style="font-size:0.85rem; color:var(--text-primary);">${l.type}</td>
            <td class="detail-cell">${detailHtml}</td>
            <td style="font-variant-numeric: tabular-nums;">${l.ip}</td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo(filtered.length, totalPages);
    renderPaginationButtons(totalPages);
}

function updatePaginationInfo(totalCount, totalPages) {
    const paginationInfo = document.getElementById('paginationInfo');
    if (totalCount === 0) {
        paginationInfo.textContent = '0 - 0 of 0';
        return;
    }
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
    paginationInfo.textContent = `${startIndex} - ${endIndex} of ${totalCount}`;
}

function renderPaginationButtons(totalPages) {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    // Remove existing page number buttons
    const existingButtons = pagination.querySelectorAll('.page-btn:not(#prevPage):not(#nextPage)');
    existingButtons.forEach(btn => btn.remove());

    // Disable/enable prev/next buttons
    prevBtn.disabled = currentPage === 1 || totalPages === 0;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (totalPages === 0) return;

    // Generate page number buttons (show max 5 pages at a time)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTableData();
        });
        pagination.insertBefore(btn, nextBtn);
    }
}

// ── Bind Interactive Events ──
function bindEvents() {
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('open');
        filterBtn.classList.toggle('active');
    });

    searchBtn.addEventListener('click', () => {
        currentPage = 1;
        renderTableData();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            renderTableData();
        }
    });

    // Apply / Clear filter buttons (checkbox multi-select panel)
    const btnApply = document.getElementById('btnApplyFiltersLog');
    if (btnApply) btnApply.addEventListener('click', () => {
        currentPage = 1;
        renderTableData();
        filterPanel.classList.remove('open');
        filterBtn.classList.remove('active');
    });
    const btnClear = document.getElementById('btnClearAllLog');
    if (btnClear) btnClear.addEventListener('click', () => {
        document.querySelectorAll('.chk-container, .chk-type').forEach(c => { c.checked = false; });
        ['filterDate', 'filterDetail', 'filterIp'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        currentPage = 1;
        renderTableData();
    });

    // Export log activity
    exportBtn.addEventListener('click', () => {
        const dateVal = document.getElementById('filterDate').value || '2026-05-28';
        showToast('Export Selesai', `Audit log file paydia_audit_trail_${dateVal}.csv berhasil diunduh.`);
    });

    // Pagination controls
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableData();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalCount = logs.length; // This will be recalculated in renderTableData with filters
        currentPage++;
        renderTableData();
    });

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
            
            const rawTransactionsSeed = [
                { id: 'TX-ACQ-10001', refNo: 'REF-20260527-010', date: '2026-05-27 08:12:44', nominal: 150000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-10002', refNo: 'REF-20260527-011', date: '2026-05-27 08:35:19', nominal: 45000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-10003', refNo: 'REF-20260527-012', date: '2026-05-27 09:04:11', nominal: 1250000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '00', switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-10004', refNo: 'REF-20260527-013', date: '2026-05-27 10:14:02', nominal: 87000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-10005', refNo: 'REF-20260527-014', date: '2026-05-27 11:22:58', nominal: 32000, merchantId: 'MID-88155', merchantName: 'Alfa Mart', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-10006', refNo: 'REF-20260527-015', date: '2026-05-27 14:02:11', nominal: 105000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
                { id: 'TX-ACQ-20001', refNo: 'REF-20260527-020', date: '2026-05-27 07:11:02', nominal: 75000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-20002', refNo: 'REF-20260527-021', date: '2026-05-27 09:44:32', nominal: 220000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: 'DISP-001' },
                { id: 'TX-ACQ-20003', refNo: 'REF-20260527-022', date: '2026-05-27 10:05:14', nominal: 500000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '68', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-20004', refNo: 'REF-20260527-023', date: '2026-05-27 15:30:19', nominal: 180000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '68', rcSwitching: '68', rcPaydia: '68', switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
                { id: 'TX-ACQ-20005', refNo: 'REF-20260527-024', date: '2026-05-27 12:08:33', nominal: 120000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Jalin', switchingTime: '12:09:33', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-20008', refNo: 'REF-20260527-026', date: '2026-05-27 16:02:09', nominal: 67000, nominalPaydia: 67000, nominalSwitching: 67000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '00', rcPaydia: '00', rcSwitching: '05', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-30001', refNo: 'REF-20260527-030', date: '2026-05-27 08:02:11', nominal: 11000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '51', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ACQ-30002', refNo: 'REF-20260527-031', date: '2026-05-27 11:45:00', nominal: 95000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '05', switching: 'Rintis', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-10001', refNo: 'REF-20260527-040', date: '2026-05-27 08:05:22', nominal: 24000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-10002', refNo: 'REF-20260527-041', date: '2026-05-27 09:12:18', nominal: 155000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-10003', refNo: 'REF-20260527-042', date: '2026-05-27 10:20:11', nominal: 60000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-10004', refNo: 'REF-20260527-043', date: '2026-05-27 13:14:02', nominal: 320000, merchantId: 'MID-99440', merchantName: 'Shell Gandaria', rc: '00', switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20001', refNo: 'REF-20260527-050', date: '2026-05-27 08:22:19', nominal: 89000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20002', refNo: 'REF-20260527-051', date: '2026-05-27 11:05:44', nominal: 45000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20003', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', switchingTime: '12:15:00', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20005', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '00', switching: 'Rintis', switchingTime: '12:15:22', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20004', refNo: 'REF-20260527-053', date: '2026-05-27 13:40:00', nominal: 140000, nominalPaydia: 140000, nominalSwitching: 140000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-20006', refNo: 'REF-20260527-055', date: '2026-05-27 14:10:00', nominal: 120000, nominalPaydia: 120000, nominalSwitching: 120000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '00', rcPaydia: '00', rcSwitching: '05', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
                { id: 'TX-ISS-30001', refNo: 'REF-20260527-060', date: '2026-05-27 07:44:06', nominal: 18000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '14', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null }
            ];

            const seedLogsSeed = [
                { id: 9501, tanggal: '28-05-2026 14:02:11', container: 'paydia-reconcile', type: 'flag-recon-unmatch', detail: 'email : dion@paydia.id\naction : Mengubah status transaksi TX-ACQ-20001 menjadi Flag Recon', ip: '125.161.77.69' },
                { id: 9502, tanggal: '28-05-2026 14:05:19', container: 'paydia-reconcile', type: 'flag-settle-unmatch', detail: 'email : dion@paydia.id\naction : Mengubah status transaksi TX-ACQ-20001 menjadi Flag Settle dan meneruskan ke settlement', ip: '125.161.77.69' },
                { id: 9503, tanggal: '28-05-2026 14:08:33', container: 'paydia-reconcile', type: 'edit-notes-unmatch', detail: 'email : dion@paydia.id\naction : Menyimpan catatan untuk ID TX-ACQ-20002', ip: '125.161.77.69' },
                { id: 9504, tanggal: '28-05-2026 14:10:00', container: 'paydia-reconcile', type: 'edit-notes-dispute', detail: 'email : dion@paydia.id\naction : Mengedit catatan dispute record DISP-001', ip: '125.161.77.69' },
                { id: 9505, tanggal: '28-05-2026 14:12:00', container: 'paydia-trx-mpm', type: 'cancel-transaction-mpm', detail: 'email : dion@paydia.id\naction : Batalkan transaksi TX-ACQ-20002 di halaman transaction - qris mpm', ip: '125.161.77.69' },
                { id: 9506, tanggal: '28-05-2026 14:15:00', container: 'paydia-settle-recon', type: 'settle-settlement', detail: 'email : dion@paydia.id\naction : Melakukan settlement transaksi TX-ACQ-20002', ip: '125.161.77.69' },
                { id: 9507, tanggal: '28-05-2026 14:18:00', container: 'paydia-settle-recon', type: 'cancel-settlement', detail: 'email : dion@paydia.id\naction : Batalkan settlement transaksi TX-ACQ-20002', ip: '125.161.77.69' },
                { id: 9508, tanggal: '28-05-2026 14:20:00', container: 'paydia-reconcile', type: 'export-matched', detail: 'email : dion@paydia.id\naction : Export data tabel matched', ip: '125.161.77.69' },
                { id: 9509, tanggal: '28-05-2026 14:22:00', container: 'paydia-reconcile', type: 'export-unmatched', detail: 'email : dion@paydia.id\naction : Export data tabel unmatched', ip: '125.161.77.69' },
                { id: 9510, tanggal: '28-05-2026 14:24:00', container: 'paydia-reconcile', type: 'export-dispute', detail: 'email : dion@paydia.id\naction : Export data tabel dispute', ip: '125.161.77.69' },
                { id: 9511, tanggal: '28-05-2026 14:26:00', container: 'paydia-reconcile', type: 'export-declined', detail: 'email : dion@paydia.id\naction : Export data tabel declined', ip: '125.161.77.69' },
                { id: 9512, tanggal: '28-05-2026 14:28:00', container: 'paydia-reconcile', type: 'add-dispute-goodfaith', detail: 'email : dion@paydia.id\naction : Menambahkan 1 data dispute good faith', ip: '125.161.77.69' },
                { id: 9145, tanggal: '28-05-2026 15:01:39', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
                { id: 9144, tanggal: '28-05-2026 15:00:31', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
                { id: 9143, tanggal: '28-05-2026 14:57:42', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
                { id: 9142, tanggal: '28-05-2026 14:42:06', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : dion@paydia.id\nuser.type : admin', ip: '125.161.77.69' }
            ];

            localStorage.setItem('paydia_recon_trx', JSON.stringify(rawTransactionsSeed));
            localStorage.setItem('paydia_disputes', JSON.stringify([
                { id: 'DISP-001', refId: 'REF-20260527-021', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
                { id: 'DISP-002', refId: 'TX-ISS-20001', date: '2026-05-28 09:44:00', type: 'good faith', switching: 'Rintis', nominal: 89000, status: 'Open', desc: 'Dana menggantung di switching, merchant belum terima dana' }
            ]));
            localStorage.setItem('paydia_logs', JSON.stringify(seedLogsSeed));
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
