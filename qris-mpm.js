


/* ============================================
   Paydia Bisnis – Transaksi QRIS MPM
   Application Logic
   ============================================ */

// ── Seed Transactions if not present ──
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
    { id: 'TX-ACQ-20002', refNo: 'REF-20260527-021', date: '2026-05-27 09:44:32', nominal: 220000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: 'DISP-001' },
    { id: 'TX-ACQ-20003', refNo: 'REF-20260527-022', date: '2026-05-27 10:05:14', nominal: 500000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rcPaydia: '00', rcSwitching: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20004', refNo: 'REF-20260527-023', date: '2026-05-27 15:30:19', nominal: 180000, merchantId: 'MID-88301', merchantName: 'Starbucks', rcSwitching: '68', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-ACQ-20005', refNo: 'REF-20260527-024', date: '2026-05-27 12:08:33', nominal: 120000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Jalin', switchingTime: '12:09:33', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20008', refNo: 'REF-20260527-026', date: '2026-05-27 16:02:09', nominal: 67000, merchantId: 'MID-88301', merchantName: 'Starbucks', rcPaydia: '00', rcSwitching: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
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
    { id: 'TX-ISS-20004', refNo: 'REF-20260527-053', date: '2026-05-27 13:40:00', nominal: 140000, nominalPaydia: 140000, nominalSwitching: 140000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcPaydia: '51', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20006', refNo: 'REF-20260527-055', date: '2026-05-27 14:10:00', nominal: 120000, nominalPaydia: 120000, nominalSwitching: 120000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcPaydia: '00', rcSwitching: '05', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER DECLINED ---
    { id: 'TX-ISS-30001', refNo: 'REF-20260527-060', date: '2026-05-27 07:44:06', nominal: 18000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '14', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null }
];

let transactions = [];
let currentPage = 1;
const perPage = 10;
let activeActionTrxId = null;

// Permissions State
let permissions = {
    read: true,
    flagging: true,
    inputDispute: true,
    export: true,
    approve: true,
    rerun: true,
    log: true
};

// ── Toast Helper ──
function showToast(title, message, duration = 3000) {
    const oldToast = document.querySelector('.toast-container');
    if (oldToast) oldToast.remove();

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';

    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.style.cssText = 'pointer-events: auto;';
    toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-info-circle toast-icon" style="color: var(--primary); margin-right: 8px;"></i>
            <strong class="toast-title" style="margin-right: auto;">${title}</strong>
            <button class="toast-close" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        container.remove();
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.remove(), 300);
    }, duration);
}

// ── Log Helper ──
function writeLog(type, detail) {
    const savedLogs = localStorage.getItem('paydia_logs');
    const logs = savedLogs ? JSON.parse(savedLogs) : [];
    
    const now = new Date();
    const formattedDate = String(now.getDate()).padStart(2, '0') + '-' +
                          String(now.getMonth() + 1).padStart(2, '0') + '-' +
                          now.getFullYear() + ' ' +
                          String(now.getHours()).padStart(2, '0') + ':' +
                          String(now.getMinutes()).padStart(2, '0') + ':' +
                          String(now.getSeconds()).padStart(2, '0');
    
    logs.unshift({
        id: Math.floor(1000 + Math.random() * 9000),
        tanggal: formattedDate,
        container: 'paydia-trx-mpm',
        type: type,
        detail: detail,
        ip: '127.0.0.1'
    });
    
    localStorage.setItem('paydia_logs', JSON.stringify(logs));
}

// ── Database Initialization ──
function initDatabase() {
    const savedTrxs = localStorage.getItem('paydia_recon_trx');
    if (savedTrxs) {
        transactions = JSON.parse(savedTrxs);
    } else {
        transactions = [...rawTransactions];
        localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));
    }
}

// ── Sidebar & Responsive UI ──
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (mobileToggle) mobileToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    // Collapsible submenu
    document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const group = item.closest('.nav-group');
            if (group) {
                group.classList.toggle('open');
                const submenu = group.querySelector('.submenu');
                if (submenu) {
                    submenu.classList.toggle('open');
                }
                const arrow = item.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.classList.toggle('fa-chevron-down');
                    arrow.classList.toggle('fa-chevron-up');
                }
            } else {
                item.classList.toggle('open');
                const submenu = item.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    submenu.classList.toggle('open');
                }
                const arrow = item.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.classList.toggle('fa-chevron-down');
                    arrow.classList.toggle('fa-chevron-up');
                }
            }
        });
    });
}

// ── Mock Permission Widget Handler ──
function initPermissionsWidget() {
    const widgetToggle = document.getElementById('permissionWidgetToggle');
    const widgetBody = document.getElementById('permissionWidgetBody');
    const widget = document.getElementById('permissionWidget');

    if (widgetToggle && widgetBody && widget) {
        widgetToggle.addEventListener('click', () => {
            widget.classList.toggle('collapsed');
            const arrow = widgetToggle.querySelector('.widget-arrow');
            if (arrow) {
                arrow.classList.toggle('fa-chevron-down');
                arrow.classList.toggle('fa-chevron-up');
            }
        });
    }

    // Bind checkbox changes
    const permInputs = {
        read: document.getElementById('permRead'),
        flagging: document.getElementById('permFlagging'),
        inputDispute: document.getElementById('permInputDispute'),
        export: document.getElementById('permExport'),
        approve: document.getElementById('permApprove'),
        rerun: document.getElementById('permRerun'),
        log: document.getElementById('permLog')
    };

    // Load from storage or default
    const savedPerms = localStorage.getItem('paydia_mock_permissions');
    if (savedPerms) {
        permissions = JSON.parse(savedPerms);
    }

    Object.keys(permInputs).forEach(key => {
        const input = permInputs[key];
        if (input) {
            input.checked = permissions[key];
            input.addEventListener('change', () => {
                permissions[key] = input.checked;
                localStorage.setItem('paydia_mock_permissions', JSON.stringify(permissions));
                applyPermissions();
            });
        }
    });

    applyPermissions();
}

function applyPermissions() {
    // Read Permission check
    const mainContent = document.querySelector('.main-content');
    if (!permissions.read) {
        if (mainContent) {
            mainContent.style.opacity = '0.1';
            mainContent.style.pointerEvents = 'none';
        }
    } else {
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.pointerEvents = 'auto';
        }
    }

    // Refresh UI to display buttons according to new permissions
    renderTable();
}

// ── Table Rendering ──
function renderTable() {
    const tbody = document.getElementById('qrisMpmTableBody');
    if (!tbody) return;

    // Filters
    const searchVal = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterRrnVal = document.getElementById('filterRrn').value.trim().toLowerCase();
    const filterMerchantVal = document.getElementById('filterMerchant').value.trim().toLowerCase();
    const filterStatusVal = document.getElementById('filterStatus').value;

    // Filter only MPM transactions; Switching-Only and Double RRN only appear after Buat Transaksi
    let mpmTrxs = transactions.filter(t => {
        if (t.skema !== 'MPM') return false;
        if ((t.label && (t.label.startsWith('Switching-Only') || t.label === 'Double RRN'))
            && t.flaggingStatus !== 'Transaksi Terbuat') return false;
        return true;
    });

    // Apply Filters
    let filtered = mpmTrxs.filter(t => {
        // Search: RRN (refNo) / Merchant ID / Merchant Name
        if (searchVal &&
            !t.refNo.toLowerCase().includes(searchVal) &&
            !(t.merchantId || '').toLowerCase().includes(searchVal) &&
            !t.merchantName.toLowerCase().includes(searchVal)) {
            return false;
        }
        // RRN Filter
        if (filterRrnVal && t.refNo && !t.refNo.toLowerCase().includes(filterRrnVal)) {
            return false;
        }
        // Merchant Filter
        if (filterMerchantVal && !t.merchantName.toLowerCase().includes(filterMerchantVal)) {
            return false;
        }
        // Status Filter
        if (filterStatusVal) {
            const isMatched = t.rc === '00' || t.statusRekon === 'Matched';
            const statusText = isMatched ? 'Sukses' : 'Gagal';
            if (statusText !== filterStatusVal) return false;
        }
        return true;
    });
    window.currentExportData = filtered;

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const startIdx = (currentPage - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, total);
    const paginated = filtered.slice(startIdx, endIdx);

    // Update Pagination Info text
    const info = document.getElementById('paginationInfo');
    if (info) {
        info.textContent = total > 0 ? `${startIdx + 1} - ${endIdx} of ${total}` : '0 of 0';
    }

    // Render Table Rows
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; color: var(--text-muted); padding: 40px;">Tidak ada data transaksi QRIS MPM</td></tr>`;
        renderPaginationControls(totalPages);
        return;
    }

    tbody.innerHTML = '';
    paginated.forEach((t, index) => {
        const isMatched = t.rc === '00' || t.statusRekon === 'Matched';
        const statusClass = isMatched ? 'status-sukses' : 'status-gagal';
        const statusText = isMatched ? 'Sukses' : 'Gagal';

        const nominalTx = t.nominal;
        const nominalTip = 0; // Default tip
        const nominalMdr = Math.floor(nominalTx * 0.007); // 0.7% MDR
        const nominalTotal = nominalTx + nominalTip - nominalMdr;

        const isCancelled = t.flaggingStatus === 'Cancelled';
        const statusBadge = isCancelled ? '<span class="status-badge status-gagal">Batal</span>' : `<span class="status-badge ${statusClass}">${statusText}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-no">${startIdx + index + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${t.date}</td>
            <td>${t.id}</td>
            <td style="font-variant-numeric: tabular-nums;">${t.refNo || '-'}</td>
            <td>${t.merchantName}</td>
            <td>Merchant Bayar Merchant</td>
            <td>${statusBadge}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTx.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTotal.toLocaleString('id-ID')}</strong></td>
            <td>paydia</td>
            <td><span class="status-badge status-sukses">Sukses</span></td>
            <td>
                <div style="position: relative;">
                    <button class="btn-action-dots btn-trx-menu-trigger" data-id="${t.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';
    
    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        pagination.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    pagination.appendChild(nextBtn);
}

// ── Dropdown and Confirm Handler ──
function initDropdownActions() {
    const menu = document.getElementById('flagDropdownMenu');
    
    // Toggle action dropdown using event delegation
    document.addEventListener('click', (e) => {
        const triggerBtn = e.target.closest('.btn-trx-menu-trigger');
        if (triggerBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const id = triggerBtn.dataset.id;
            
            if (activeActionTrxId === id && menu.classList.contains('show')) {
                hideDropdown();
                return;
            }
            
            hideDropdown();
            activeActionTrxId = id;
            
            // Build dropdown
            const trx = transactions.find(t => t.id === id);
            const isCancelled = trx && trx.flaggingStatus === 'Cancelled';
            
            if (isCancelled) {
                menu.innerHTML = `
                    <div style="padding: 10px 12px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">
                        <i class="fas fa-ban" style="margin-right: 4px;"></i> Transaksi Batal
                    </div>
                `;
            } else {
                const canUbahStatus = trx && (trx.label === 'Beda Status Transaksi' || trx.label === 'Paydia-Only Success');
                menu.innerHTML = `
                    ${canUbahStatus ? `<button class="dropdown-item btn-ubah-status" data-id="${id}">
                        <i class="fas fa-edit" style="color: var(--primary); width: 16px; margin-right: 4px;"></i> Ubah Status Transaksi
                    </button>` : ''}
                    <button class="dropdown-item btn-cancel-trx" data-id="${id}">
                        <i class="fas fa-times-circle" style="color: var(--danger); width: 16px; margin-right: 4px;"></i> Batalkan Transaksi
                    </button>
                `;
            }
            
            const rect = triggerBtn.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.left = `${rect.right - 230}px`;
            menu.classList.add('show');
            triggerBtn.classList.add('active');
            return;
        }

        // Close dropdown when clicking outside
        if (!e.target.closest('.btn-trx-menu-trigger') && !e.target.closest('#flagDropdownMenu')) {
            hideDropdown();
        }
    });

    window.addEventListener('scroll', hideDropdown, { passive: true });
}

function hideDropdown() {
    const menu = document.getElementById('flagDropdownMenu');
    if (menu) {
        menu.classList.remove('show');
    }
    document.querySelectorAll('.btn-trx-menu-trigger.active').forEach(btn => {
        btn.classList.remove('active');
    });
    activeActionTrxId = null;
}

// ── Transaction Cancellation flow ──
function initCancelFlow() {
    const confirmOverlay = document.getElementById('actionConfirmOverlay');
    const confirmBtn = document.getElementById('btnActionConfirm');
    const cancelBtn = document.getElementById('btnActionCancel');
    
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.btn-cancel-trx');
        if (item) {
            e.preventDefault();
            const id = item.dataset.id;
            activeActionTrxId = id;
            hideDropdown();
            
            // Show Confirm Overlay
            const msgEl = document.getElementById('actionConfirmMessage');
            if (msgEl) msgEl.innerHTML = `Apakah Anda yakin ingin membatalkan transaksi <strong>${id}</strong>? Data di unmatch table tidak akan bisa diproses lebih lanjut.`;
            if (confirmOverlay) confirmOverlay.classList.add('show');
        }
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirmOverlay) confirmOverlay.classList.remove('show');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const id = activeActionTrxId;
            if (!id) return;

            const t = transactions.find(trx => trx.id === id);
            if (t) {
                // Get timestamp and user info
                const now = new Date();
                const formattedDate = String(now.getDate()).padStart(2, '0') + '-' +
                                      String(now.getMonth() + 1).padStart(2, '0') + '-' +
                                      now.getFullYear() + ' ' +
                                      String(now.getHours()).padStart(2, '0') + ':' +
                                      String(now.getMinutes()).padStart(2, '0') + ':' +
                                      String(now.getSeconds()).padStart(2, '0');
                
                t.flaggingStatus = 'Cancelled';
                t.cancelledAt = formattedDate;
                t.cancelledBy = 'dion@paydia.id';

                localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));
                
                // Write Audit Log
                writeLog('cancel-transaction-mpm', `email : dion@paydia.id\naction : Batalkan transaksi ${id} di halaman transaction - qris mpm`);
                
                showToast('Transaksi Dibatalkan', `Transaksi ${id} berhasil dibatalkan.`);
                renderTable();
            }

            if (confirmOverlay) confirmOverlay.classList.remove('show');
        });
    }
}

// ── Ubah Status Flow (for Beda Status Transaksi) ──
function initUbahStatusFlow() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ubah-status');
        if (!btn) return;
        e.preventDefault();
        const id = btn.dataset.id;
        hideDropdown();

        const overlay = document.getElementById('ubahStatusOverlay');
        if (!overlay) return;
        document.getElementById('ubahStatusTrxId').textContent = id;
        overlay.dataset.trxId = id;

        const t = transactions.find(x => x.id === id);
        const sel = document.getElementById('selectNewStatus');
        if (sel && t) {
            if (t.rcPaydia === '00') sel.value = 'Sukses';
            else if (t.rcPaydia === '68') sel.value = 'Pending';
            else sel.value = 'Gagal';
        }

        overlay.style.display = 'flex';
        overlay.classList.add('show');
    });

    const closeBtn = document.getElementById('ubahStatusClose');
    const cancelBtn = document.getElementById('ubahStatusCancel');
    const confirmBtn = document.getElementById('ubahStatusConfirm');

    [closeBtn, cancelBtn].forEach(b => {
        if (b) b.addEventListener('click', () => {
            const overlay = document.getElementById('ubahStatusOverlay');
            if (overlay) { overlay.classList.remove('show'); overlay.style.display = 'none'; }
        });
    });

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const overlay = document.getElementById('ubahStatusOverlay');
            const id = overlay.dataset.trxId;
            const sel = document.getElementById('selectNewStatus');
            const newStatus = sel ? sel.value : '';
            const t = transactions.find(x => x.id === id);
            if (t) {
                t.rcPaydia = newStatus === 'Sukses' ? '00' : (newStatus === 'Pending' ? '68' : '05');
                t.rc = t.rcPaydia;
                localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));
                writeLog('ubah-status-beda', `email : dion@paydia.id\naction : Ubah status Paydia transaksi ${id} menjadi ${newStatus}`);
                showToast('Status Diubah', `Status transaksi ${id} berhasil diubah menjadi ${newStatus}`);
            }
            overlay.classList.remove('show');
            overlay.style.display = 'none';
            renderTable();
        });
    }
}

// ── Search & Filter Input Listeners ──
function initSearchFilter() {
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const searchInput = document.getElementById('searchInput');
    const filterRrn = document.getElementById('filterRrn');
    const filterMerchant = document.getElementById('filterMerchant');
    const filterStatus = document.getElementById('filterStatus');
    const exportBtn = document.getElementById('exportBtn');

    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('open');
            filterBtn.classList.toggle('active');
        });
    }

    // Bind real-time change events for filters
    [filterRrn, filterMerchant, filterStatus].forEach(el => {
        if (el) {
            el.addEventListener('change', () => {
                currentPage = 1;
                renderTable();
            });
            el.addEventListener('input', () => {
                currentPage = 1;
                renderTable();
            });
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderTable();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!permissions.export) {
                showToast('Access Denied', 'Anda tidak memiliki izin untuk mengekspor data.');
                return;
            }
            
            // Simulate progress on button itself
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
                    writeLog('export-qris-mpm', 'email : dion@paydia.id\naction : Export data tabel qris mpm');
                    showToast('Export Berhasil', 'Data transaksi QRIS MPM berhasil diekspor.');
                    if(typeof window.showExcelSimulationModal === "function") window.showExcelSimulationModal(window.currentExportData || [], 'QRIS MPM');
                }
            }, 100);
        });
    }
}

// ── Page Initialization ──
function init() {
    initDatabase();
    initSidebar();
    initPermissionsWidget();
    initDropdownActions();
    initCancelFlow();
    initUbahStatusFlow();
    initSearchFilter();
    renderTable();
}

document.addEventListener('DOMContentLoaded', init);

// Re-read storage when the page regains focus / another tab updates it (e.g. after
// "Buat Transaksi" on the reconcile page) so newly created transactions appear without a manual reload.
function refreshFromStorage() {
    initDatabase();
    renderTable();
}
window.addEventListener('storage', (e) => { if (e.key === 'paydia_recon_trx') refreshFromStorage(); });
window.addEventListener('pageshow', refreshFromStorage);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshFromStorage(); });





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
