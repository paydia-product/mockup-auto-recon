/* ===================================================
   Paydia Bisnis – Settlement & Recon Dashboard Logic
   =================================================== */

// --- Mock Settlement Database ---
const mockSettlements = [
    { id: 1, tanggal: '05-02-2025 07:30:02', txId: '61d900a0057d4930f0912fc9b07fa7fa', merchantCode: '240827001000000', merchantName: 'Koperasi Sasuka Online', nominalQris: 3000.86, nominalSettle: 3000.86, bankCode: 'BRI', bankAccount: '024701001749308', bankAccountName: 'Koperasi Sasuka Online Indonesia', status: 'Pembayaran' },
    { id: 2, tanggal: '01-02-2025 07:30:00', txId: '33eec359dc94c1b780ea2cf79d6a8aa9', merchantCode: '240827001000000', merchantName: 'Koperasi Sasuka Online', nominalQris: 1500.43, nominalSettle: 1500.43, bankCode: 'BRI', bankAccount: '024701001749308', bankAccountName: 'Koperasi Sasuka Online Indonesia', status: 'Pembayaran' },
    { id: 3, tanggal: '18-01-2025 07:30:02', txId: '82200b330a55d7cb2ebb2f8d79cbdcaf', merchantCode: '240327001000000', merchantName: 'Firman Zain', nominalQris: 103008.22, nominalSettle: 103008.22, bankCode: 'BCA', bankAccount: '3847075823', bankAccountName: 'Putri Padmasari', status: 'Pembayaran' },
    { id: 4, tanggal: '14-01-2025 07:30:01', txId: '03883cc434416911ec94c2e8aa388aa5', merchantCode: '240327001000000', merchantName: 'Firman Zain', nominalQris: 49700.00, nominalSettle: 49700.00, bankCode: 'BCA', bankAccount: '3847075823', bankAccountName: 'Putri Padmasari', status: 'Pembayaran' },
    { id: 5, tanggal: '03-01-2025 07:30:07', txId: 'cfebd0ff30395c5a8604303b4afadb32', merchantCode: '240327001000000', merchantName: 'Firman Zain', nominalQris: 78625.40, nominalSettle: 78625.40, bankCode: 'BCA', bankAccount: '3847075823', bankAccountName: 'Putri Padmasari', status: 'Pembayaran' },
    { id: 6, tanggal: '09-11-2024 07:30:03', txId: '0bfb0e3c479952b651ad17f3178d2532', merchantCode: '240925001000000', merchantName: 'Jodogaming Test', nominalQris: 49650.00, nominalSettle: 49650.00, bankCode: 'BCA', bankAccount: '12345678', bankAccountName: 'Jodo Test', status: 'Pembayaran' },
    { id: 7, tanggal: '07-11-2024 07:30:00', txId: '5db19557b349c15830ccf8bac719f262', merchantCode: '240327001000000', merchantName: 'Firman Zain', nominalQris: 80712.80, nominalSettle: 80712.80, bankCode: 'BCA', bankAccount: '3847075823', bankAccountName: 'Putri Padmasari', status: 'Pembayaran' },
    { id: 8, tanggal: '03-01-2025 07:31:10', txId: 'a91f02bc77de41128cc0a8f4d2b6e310', merchantCode: '240512001000000', merchantName: 'Warung Bu Sri', nominalQris: 65000.00, nominalSettle: 65000.00, bankCode: 'Mandiri', bankAccount: '1370011223344', bankAccountName: 'Sri Wahyuni', status: 'Pembayaran' },
    { id: 9, tanggal: '03-01-2025 07:32:05', txId: 'b72c19ad88ef52239dd1b9f5e3c7f421', merchantCode: '240512001000000', merchantName: 'Warung Bu Sri', nominalQris: 42000.00, nominalSettle: 42000.00, bankCode: 'Mandiri', bankAccount: '1370011223344', bankAccountName: 'Sri Wahyuni', status: 'Pembayaran' },
    { id: 10, tanggal: '03-01-2025 07:33:40', txId: 'c53d28be99fa63340ee2caf6f4d8a532', merchantCode: '240718001000000', merchantName: 'Toko Berkah Jaya', nominalQris: 120000.00, nominalSettle: 120000.00, bankCode: 'Permata', bankAccount: '0980011556677', bankAccountName: 'Hendra Gunawan', status: 'Pembayaran' },
    { id: 11, tanggal: '03-01-2025 07:34:55', txId: 'd64e39cf00ab74451ff3dba7a5e9b643', merchantCode: '240718001000000', merchantName: 'Toko Berkah Jaya', nominalQris: 55000.00, nominalSettle: 55000.00, bankCode: 'CIMB Niaga', bankAccount: '7650011889900', bankAccountName: 'Hendra Gunawan', status: 'Pembayaran' }
];

let database = [];
let selectedIds = [];

// Initialize local DB state
function initDatabase() {
    const saved = localStorage.getItem('paydia_settlements');
    if (saved) {
        database = JSON.parse(saved);
        // Merge newer seed records (Mandiri + other-bank examples for admin-fee demo) into existing storage
        mockSettlements.forEach(seed => {
            if (!database.some(r => r.txId === seed.txId)) database.push(seed);
        });
        localStorage.setItem('paydia_settlements', JSON.stringify(database));
    } else {
        database = JSON.parse(JSON.stringify(mockSettlements));
        localStorage.setItem('paydia_settlements', JSON.stringify(database));
    }
}

function saveDatabase() {
    localStorage.setItem('paydia_settlements', JSON.stringify(database));
}

// Render Table Rows
function renderTableData() {
    const tbody = document.getElementById('settleReconTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filterStartDate = document.getElementById('filterStartDate').value;
    const filterEndDate = document.getElementById('filterEndDate').value;
    const filterBank = document.getElementById('filterBank').value;

    let filtered = database.filter(item => {
        // Date mapping
        if (filterStartDate || filterEndDate) {
            // ISO Date conversion (dd-mm-yyyy)
            const parts = item.tanggal.substring(0, 10).split('-');
            const itemDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to yyyy-mm-dd
            if (filterStartDate && itemDate < filterStartDate) return false;
            if (filterEndDate && itemDate > filterEndDate) return false;
        }
        // Bank mapping
        if (filterBank && item.bankCode !== filterBank) return false;

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 40px 16px; color: var(--text-muted);">Tidak ada data settlement</td></tr>`;
        updateStats();
        return;
    }

    filtered.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const isChecked = selectedIds.includes(item.id);

        let displayStatus = item.status || 'Pembayaran';
        if (displayStatus === 'Mulai pembayaran') {
            displayStatus = 'Mulai Pembayaran';
        }
        let statusClass = 'status-sukses'; // default for "Pembayaran" (green/success)
        if (displayStatus === 'Mulai Pembayaran') {
            statusClass = 'status-dikembalikan'; // blue/info style for "Mulai Pembayaran"
        }

        tr.innerHTML = `
            <td class="col-checkbox" style="text-align: center;">
                <input type="checkbox" class="row-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
            </td>
            <td class="col-no">${idx + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${item.tanggal}</td>
            <td style="font-family: monospace; font-size: 0.8rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.txId}">
                ${item.txId}
            </td>
            <td>
                <div class="cell-text-stack">
                    <span class="cell-text-main">${item.merchantName}</span>
                    <span class="cell-text-sub">${item.merchantCode}</span>
                </div>
            </td>
            <td style="font-variant-numeric: tabular-nums; font-weight: 500;">Rp ${item.nominalQris.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
            <td style="font-variant-numeric: tabular-nums; font-weight: 600;">Rp ${item.nominalSettle.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
            <td>
                <div class="cell-text-stack">
                    <span class="cell-text-main">${item.bankCode}</span>
                    <span class="cell-text-sub">${item.bankAccount} - ${item.bankAccountName}</span>
                </div>
            </td>
            <td>
                <span class="status-badge ${statusClass}">${displayStatus}</span>
            </td>
            <td class="col-action" style="text-align: center; white-space: nowrap;">
                <a href="#" class="action-link btn-action-dropdown-trigger" data-id="${item.id}" style="font-size: 0.82rem; font-weight: 600; text-decoration: none; color: var(--primary); padding: 6px 12px; border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 6px; background: rgba(99, 102, 241, 0.05); display: inline-block;">
                    Action <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-left: 4px;"></i>
                </a>
            </td>
        `;

        tbody.appendChild(tr);
    });

    updateStats();
}

// Update Selected Count & Nominal stats
function updateStats() {
    const countEl = document.getElementById('statsSelectedCount');
    const nominalEl = document.getElementById('statsTotalNominal');
    const globalSelect = document.getElementById('globalSelectCheckbox');

    if (!countEl || !nominalEl) return;

    let totalNominal = 0;
    selectedIds.forEach(id => {
        const item = database.find(item => item.id === id);
        if (item) {
            totalNominal += item.nominalSettle;
        }
    });

    countEl.textContent = selectedIds.length;
    nominalEl.textContent = 'Rp ' + totalNominal.toLocaleString('id-ID', { minimumFractionDigits: 2 });

    // Update bulk action bar visibility
    const bulkBar = document.getElementById('settleBulkActionBar');
    const countSpan = document.getElementById('settleBulkCountText');
    if (bulkBar && countSpan) {
        if (selectedIds.length > 0) {
            bulkBar.style.display = 'flex';
            countSpan.textContent = selectedIds.length;
        } else {
            bulkBar.style.display = 'none';
        }
    }

    // Global select check box update
    if (globalSelect) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        if (checkboxes.length > 0) {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            globalSelect.checked = allChecked;
        } else {
            globalSelect.checked = false;
        }
    }
}

// Show standard toast notifications
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
        <i class="fas fa-info-circle toast-icon" style="color: var(--primary);"></i>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        </div>
        <button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('leaving');
        toast.addEventListener('animationend', () => toast.remove());
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('leaving');
            toast.addEventListener('animationend', () => toast.remove());
        }
    }, 3500);
}

// Wire Up Events
function bindEvents() {
    // Dropdown filters toggles
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterPanel.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!filterPanel.contains(e.target) && e.target !== filterBtn) {
                filterPanel.classList.remove('open');
            }
        });
    }

    const btnApplyFilters = document.getElementById('btnApplyFilters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            renderTableData();
            filterPanel.classList.remove('open');
        });
    }

    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            document.getElementById('filterBank').value = '';
            renderTableData();
        });
    }

    // Toggle Auto reporting toggle slider
    const autoReportingToggle = document.getElementById('autoReportingToggle');
    const autoReportingStatusText = document.getElementById('autoReportingStatusText');
    if (autoReportingToggle && autoReportingStatusText) {
        autoReportingToggle.addEventListener('change', () => {
            if (autoReportingToggle.checked) {
                autoReportingStatusText.textContent = 'ON';
                autoReportingStatusText.style.color = 'var(--success)';
                showToast('Schedule Aktif', 'Auto Reporting Schedule berhasil diaktifkan.');
            } else {
                autoReportingStatusText.textContent = 'OFF';
                autoReportingStatusText.style.color = 'var(--text-secondary)';
                showToast('Schedule Nonaktif', 'Auto Reporting Schedule dimatikan.');
            }
        });
    }

    // Table checkbox click delegation
    const globalSelect = document.getElementById('globalSelectCheckbox');
    if (globalSelect) {
        globalSelect.addEventListener('change', () => {
            const isChecked = globalSelect.checked;
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => {
                const id = parseInt(cb.dataset.id, 10);
                cb.checked = isChecked;
                const idx = selectedIds.indexOf(id);
                if (isChecked) {
                    if (idx === -1) selectedIds.push(id);
                } else {
                    if (idx !== -1) selectedIds.splice(idx, 1);
                }
            });
            updateStats();
        });
    }

    // Sidebar Mobile Toggle Actions
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.classList.add('show');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
        });
    }

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
                    if (submenu) submenu.classList.remove('open');
                    if (arrow) {
                        arrow.classList.remove('fa-chevron-up');
                        arrow.classList.add('fa-chevron-down');
                    }
                } else {
                    group.classList.add('open');
                    if (submenu) submenu.classList.add('open');
                    if (arrow) {
                        arrow.classList.remove('fa-chevron-down');
                        arrow.classList.add('fa-chevron-up');
                    }
                }
            }
        });
    });

    // NOTE: "Export Data per Bank" is wired in the setTimeout override at the
    // bottom of this file (binds #exportBankBtn -> date modal -> progress ->
    // showSettlementExcelModal(database, 'bank')). The old handler that lived
    // here referenced non-existent IDs (#btnExportBank / #exportBankModalOverlay)
    // and never ran, so it was removed.

    const tbody = document.getElementById('settleReconTableBody');
    if (tbody) {
        tbody.addEventListener('change', (e) => {
            const cb = e.target.closest('.row-checkbox');
            if (cb) {
                const id = parseInt(cb.dataset.id, 10);
                const idx = selectedIds.indexOf(id);
                if (cb.checked) {
                    if (idx === -1) selectedIds.push(id);
                } else {
                    if (idx !== -1) selectedIds.splice(idx, 1);
                }
                updateStats();
            }
        });

        // Click actions trigger delegation (Open dropdown option)
        let activeSettleTrxId = null;

        function hideDropdown() {
            const menu = document.getElementById('actionDropdownMenu');
            if (menu) {
                menu.classList.remove('show');
            }
            activeSettleTrxId = null;
        }

        tbody.addEventListener('click', (e) => {
            const trigger = e.target.closest('.btn-action-dropdown-trigger');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();

                const id = parseInt(trigger.dataset.id, 10);
                const menu = document.getElementById('actionDropdownMenu');

                if (activeSettleTrxId === id && menu.classList.contains('show')) {
                    hideDropdown();
                    return;
                }

                activeSettleTrxId = id;
                const rect = trigger.getBoundingClientRect();
                menu.style.top = `${rect.bottom + 4}px`;
                menu.style.left = `${rect.right - 230}px`;
                menu.classList.add('show');
                return;
            }
        });

        // Dropdown actions handling
        const dropdownMenu = document.getElementById('actionDropdownMenu');
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', (e) => {
                if (e.target.closest('.btn-dropdown-lihat')) {
                    e.preventDefault();
                    if (activeSettleTrxId) {
                        const item = database.find(t => t.id == activeSettleTrxId);
                        if (item) {
                            const targetNominal = typeof item.nominalSettle === 'number' ? item.nominalSettle : parseFloat(item.nominalSettle.toString().replace(/,/g,'')) || 10000;
                            const tbody = document.getElementById('listTransaksiTbody');
                            
                            const nominal1 = targetNominal * 0.5;
                            const nominal2 = targetNominal * 0.3;
                            const nominal3 = targetNominal * 0.2;
                            const cbMinus = 5000;
                            const cbPlus = 5000;
                            
                            const fmt = n => n.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:2});
                            const date = "01-01-2025 00:00:00";
                            const mname = item.merchantName || item.namaMerchant || "Merchant";
                            
                            // ponytail: 1st/2nd chargeback & good faith are the dispute-minus categories; pick one per row
                            const cbCats = ['1st Chargeback', '2nd Chargeback', 'Good Faith'];
                            const makeRow = (id, n, isChargeback) => {
                                let kategori = 'Merchant Bayar';
                                let nStr = fmt(n);
                                if (isChargeback === '+') { kategori = 'Represent'; nStr = fmt(Math.abs(n)); }
                                else if (isChargeback === '-') { kategori = cbCats[Math.floor(Math.random()*cbCats.length)]; nStr = '-' + fmt(Math.abs(n)); }
                                const mdr = Math.abs(n) * 0.003;
                                const mdrStr = fmt(mdr);
                                const totalStr = (isChargeback === '-' ? '-' : '') + fmt(Math.abs(n) - mdr);
                                return `<tr>
                                    <td>${date}</td>
                                    <td>${id}</td>
                                    <td>25011300000${Math.floor(Math.random()*90)+10}</td>
                                    <td>${mname}</td>
                                    <td>${kategori}</td>
                                    <td><span class="status-badge success">Sukses</span></td>
                                    <td>${nStr}</td>
                                    <td>${mdrStr}</td>
                                    <td>${totalStr}</td>
                                    <td><button class="btn-action">Action <i class="fas fa-chevron-down"></i></button></td>
                                </tr>`;
                            };

                            let html = '';
                            html += makeRow('159724e4b1e444...', nominal1);
                            html += makeRow('361c1177f98f4cc...', nominal2);
                            html += makeRow('06a36d113ca34e...', nominal3);
                            html += makeRow('8a12d2b3834248...', cbMinus, '-');
                            html += makeRow('29be8a3d0ae49a...', cbPlus, '+');
                            
                            tbody.innerHTML = html;
                            const _ltm = document.getElementById('listTransaksiModal');
                            _ltm.style.display = '';        // clear inline display:none
                            _ltm.classList.add('show');     // .modal-overlay needs .show to be visible
                        }
                    }
                    hideDropdown();
                } else if (e.target.closest('.btn-dropdown-settle')) {
                    e.preventDefault();
                    if (activeSettleTrxId) {
                        const item = database.find(t => t.id == activeSettleTrxId);
                        if (item) {
                            showConfirmModal(
                                'Konfirmasi Settle',
                                `Apakah Anda yakin ingin melakukan settlement untuk transaksi ${item.txId} dengan nominal Rp ${item.nominalSettle.toLocaleString('id-ID')}?`,
                                () => {
                                    item.status = 'Mulai Pembayaran';
                                    saveDatabase();
                                    
                                    // Log the settle activity
                                    writeLog('settle-settle-recon', `Settle transaksi ${item.txId} (Nominal: Rp ${item.nominalSettle.toLocaleString('id-ID')})`);
                                    
                                    showToast('Settlement Berhasil', `Transaksi ${item.txId} berhasil disettle.`);
                                    renderTableData();
                                }
                            );
                        }
                    }
                    hideDropdown();
                } else if (e.target.closest('.btn-dropdown-cancel-settle')) {
                    e.preventDefault();
                    if (activeSettleTrxId) {
                        const item = database.find(t => t.id == activeSettleTrxId);
                        if (item) {
                            showConfirmModal(
                                'Konfirmasi Pembatalan Settlement',
                                `Apakah Anda yakin ingin membatalkan settlement untuk transaksi ${item.txId}? Transaksi ini akan dihapus dari daftar settlement & recon.`,
                                () => {
                                    database = database.filter(t => t.id != activeSettleTrxId);
                                    saveDatabase();
                                    
                                    // Log the cancel settle activity
                                    writeLog('cancel-settlement-settle-recon', `Batalkan settlement transaksi ${item.txId}`);
                                    
                                    showToast('Settlement Dibatalkan', `Settlement untuk transaksi ${item.txId} berhasil dibatalkan.`);
                                    renderTableData();
                                }
                            );
                        }
                    }
                    hideDropdown();
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-action-dropdown-trigger') && !e.target.closest('#actionDropdownMenu')) {
                hideDropdown();
            }
        });

        window.addEventListener('scroll', hideDropdown, { passive: true });
    }

    // Bulk Settle & Cancel Settle event handlers
    const btnBulkSettle = document.getElementById('btnBulkSettle');
    const btnBulkCancelSettle = document.getElementById('btnBulkCancelSettle');

    if (btnBulkSettle) {
        btnBulkSettle.addEventListener('click', () => {
            if (selectedIds.length === 0) {
                showToast('Peringatan', 'Pilih minimal satu transaksi untuk disettle.');
                return;
            }
            showConfirmModal(
                'Konfirmasi Settle',
                `Apakah Anda yakin ingin melakukan settlement untuk ${selectedIds.length} transaksi terpilih?`,
                () => {
                    selectedIds.forEach(id => {
                        const item = database.find(t => t.id === id);
                        if (item) {
                            item.status = 'Mulai Pembayaran';
                            writeLog('settle-settle-recon', `Settle transaksi ${item.txId} (Nominal: Rp ${item.nominalSettle.toLocaleString('id-ID')})`);
                        }
                    });
                    saveDatabase();
                    showToast('Settle Berhasil', `${selectedIds.length} transaksi berhasil disettle.`);
                    selectedIds = [];
                    renderTableData();
                }
            );
        });
    }

    if (btnBulkCancelSettle) {
        btnBulkCancelSettle.addEventListener('click', () => {
            if (selectedIds.length === 0) {
                showToast('Peringatan', 'Pilih minimal satu transaksi untuk membatalkan transaksi.');
                return;
            }
            showConfirmModal(
                'Konfirmasi Pembatalan Transaksi',
                `Apakah Anda yakin ingin membatalkan ${selectedIds.length} transaksi terpilih? Transaksi ini akan dihapus dari daftar settlement & recon.`,
                () => {
                    const idsToCancel = [...selectedIds];
                    idsToCancel.forEach(id => {
                        const item = database.find(t => t.id === id);
                        if (item) {
                            writeLog('cancel-settlement-settle-recon', `Batalkan transaksi ${item.txId}`);
                        }
                    });
                    database = database.filter(t => !idsToCancel.includes(t.id));
                    saveDatabase();
                    showToast('Pembatalan Selesai', `${idsToCancel.length} transaksi berhasil dibatalkan.`);
                    selectedIds = [];
                    renderTableData();
                }
            );
        });
    }


    // ponytail: old inline exportBtn handler (hardcoded dataset) deleted.
    // Export is bound below on DOMContentLoaded -> date modal -> progress -> showSettlementExcelModal(database, mode).


    // Confirmation Modal Event Listeners
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmModalClose = document.getElementById('confirmModalClose');
    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', hideConfirmModal);
    }
    if (confirmModalClose) {
        confirmModalClose.addEventListener('click', hideConfirmModal);
    }
    if (confirmSubmitBtn) {
        confirmSubmitBtn.addEventListener('click', () => {
            if (confirmActionCallback) {
                confirmActionCallback();
            }
            hideConfirmModal();
        });
    }
}

let confirmActionCallback = null;

function showConfirmModal(title, message, callback) {
    const overlay = document.getElementById('confirmModalOverlay');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    
    if (overlay && titleEl && messageEl) {
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmActionCallback = callback;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideConfirmModal() {
    const overlay = document.getElementById('confirmModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    confirmActionCallback = null;
}

function writeLog(type, detail) {
    const savedLogs = localStorage.getItem('paydia_logs');
    let logsList = [];
    if (savedLogs) {
        logsList = JSON.parse(savedLogs);
    }
    
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
        container: 'paydia-settle-recon',
        type: type,
        detail: detail,
        ip: '125.161.77.69'
    };
    
    logsList.unshift(newLog);
    localStorage.setItem('paydia_logs', JSON.stringify(logsList));
}

// Initialise Settle page
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    bindEvents();
    renderTableData();
});


    
document.addEventListener('DOMContentLoaded', () => {
    const btnManualRecon = document.getElementById('btnManualRecon');
    const manualReconOverlay = document.getElementById('manualReconOverlay');
    const manualReconClose = document.getElementById('manualReconClose');
    const btnCancelManualRecon = document.getElementById('btnCancelManualRecon');
    const btnSubmitManualRecon = document.getElementById('btnSubmitManualRecon');

    if (btnManualRecon) {
        btnManualRecon.addEventListener('click', () => {
            if (manualReconOverlay) {
                manualReconOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    function closeManualReconModal() {
        if (manualReconOverlay) {
            manualReconOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    if (manualReconClose) manualReconClose.addEventListener('click', closeManualReconModal);
    if (btnCancelManualRecon) btnCancelManualRecon.addEventListener('click', closeManualReconModal);

    if (btnSubmitManualRecon) {
        btnSubmitManualRecon.addEventListener('click', () => {
            closeManualReconModal();
            // Trigger retry auto recon logic reusing existing progress modal
            if (typeof doSimulateRerun === 'function') {
                doSimulateRerun();
            } else {
                const progressOverlay = document.getElementById('progressOverlay');
                const progressBarFill = document.getElementById('progressBarFill');
                const progressStatus = document.getElementById('progressStatus');
                if (progressOverlay) {
                    progressOverlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    let progress = 0;
                    const messages = [
                        'Menginisialisasi engine manual recon...',
                        'Membaca file data dari direktori lokal...',
                        'Mencocokkan baris data switching vs database Paydia...',
                        'Memverifikasi integritas rrn & stan...',
                        'Mengklasifikasikan data match dan unmatch...',
                        'Menyimpan hasil ke database sementara...',
                        'Menyiapkan tampilan log hasil rekonsiliasi...'
                    ];
                    
                    const interval = setInterval(() => {
                        progress += Math.floor(Math.random() * 15) + 5;
                        if (progress > 100) progress = 100;
                        if (progressBarFill) progressBarFill.style.width = progress + '%';
                        const msgIndex = Math.min(Math.floor((progress / 100) * messages.length), messages.length - 1);
                        if (progressStatus) progressStatus.textContent = messages[msgIndex] + ' (' + progress + '%)';
                        
                        if (progress === 100) {
                            clearInterval(interval);
                            if (progressStatus) progressStatus.textContent = 'Proses Manual Recon Selesai (100%)';
                            setTimeout(() => {
                                progressOverlay.classList.remove('show');
                                document.body.style.overflow = 'auto';
                                if (typeof showToast === 'function') showToast('Manual Recon Berhasil', 'Proses manual rekonsiliasi selesai.');
                                if (typeof writeLog === 'function') writeLog('manual-recon', 'email : dion@paydia.id\naction : Melakukan Manual Recon');
                            }, 800);
                        }
                    }, 400);
                }
            }
        });
    }
});



// ── Export Segregasi per Bank (CSV pivot, on-demand) ──
// One sheet: disclaimer header + Raw Data table + per-bank tables (BCA, BRI,
// Mandiri, Bank Lainnya) each with a rekap per nomor rekening.
// ponytail: plain CSV string + Blob download; no library needed.
function downloadSegregasiCSV(data) {
    const esc = (v) => {
        if (v === null || v === undefined) v = '';
        v = String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    const row = (arr) => arr.map(esc).join(',');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateGen = now.getFullYear() + '/' + pad(now.getMonth() + 1) + '/' + pad(now.getDate());
    const timeGen = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    const username = 'dion@paydia.id';

    const lines = [];
    // Disclaimer header (read-only context)
    lines.push(row(['Generated By:', username]));
    lines.push(row(['Date Generated:', dateGen]));
    lines.push(row(['Time Generated:', timeGen]));
    lines.push(row(['Disclaimer:', 'Data ini merupakan hasil generate dari sistem, disajikan sesuai kondisi saat waktu generate, Dan dapat berubah sewaktu-waktu melalui mekanisme pengkinian data']));
    lines.push('');

    // ── Raw Data table ──
    lines.push(row(['TABEL RAW DATA']));
    lines.push(row(['Tanggal', 'ID', 'MID', 'Nama Merchant', 'Nominal', 'Adjustment Chargeback', 'Nominal Settle', 'Bank', 'No. Rek Bank', 'Nama Rek Bank']));
    data.forEach(r => {
        const adjNet = (r['Adjustment Chargeback (+)'] || 0) - (r['Adjustment Chargeback (-)'] || 0);
        lines.push(row([
            r['Tanggal dan Jam Proses'] || '', r['ID Transaksi'] || '', r['MID'] || '',
            r['Nama Merchant'] || '', r['Nominal Awal'] || 0, adjNet, r['Nominal Settlement'] || 0,
            r['Nama Bank'] || '', r['Nomor Rekening'] || '', r['Nama Pemilik Rekening'] || ''
        ]));
    });
    lines.push('');

    // ── Per-bank tables with rekap per nomor rekening ──
    const bankCols = ['Tanggal dan Jam Proses', 'Tanggal dan Jam Transaksi', 'ID Transaksi', 'RRN', 'MID',
        'Nama Merchant', 'Nominal', 'Biaya Admin', 'Adjustment Chargeback (+)', 'Adjustment Chargeback (-)',
        'Nominal Settlement', 'Nama Bank', 'Nomor Rekening', 'Nama Pemilik Rekening'];

    const banks = [
        { title: 'TABEL BCA', match: b => b.includes('BCA') },
        { title: 'TABEL BRI', match: b => b.includes('BRI') },
        { title: 'TABEL MANDIRI', match: b => b.includes('MANDIRI') },
        { title: 'TABEL BANK LAINNYA', match: b => !b.includes('BCA') && !b.includes('BRI') && !b.includes('MANDIRI') }
    ];

    banks.forEach(bank => {
        const rows = data.filter(r => bank.match((r['Nama Bank'] || '').toUpperCase()));
        lines.push(row([bank.title]));
        lines.push(row(bankCols));
        if (rows.length === 0) {
            lines.push(row(['Tidak ada data']));
            lines.push('');
            return;
        }
        // Sort by rekening to group, then emit rows + a rekap (TOTAL) per rekening.
        rows.sort((a, b) => String(a['Nomor Rekening'] || '').localeCompare(String(b['Nomor Rekening'] || '')));
        let curRek = null, sumSettle = 0, sumPlus = 0, sumMinus = 0, curBank = '', curNama = '';
        const flush = () => {
            if (curRek !== null) {
                lines.push(row(['', '', '', '', '', 'TOTAL SETTLEMENT', '', '', sumPlus, sumMinus, sumSettle, curBank, curRek, curNama]));
            }
        };
        rows.forEach(r => {
            const rek = r['Nomor Rekening'] || '';
            if (rek !== curRek) {
                flush();
                curRek = rek; sumSettle = 0; sumPlus = 0; sumMinus = 0;
                curBank = r['Nama Bank'] || ''; curNama = r['Nama Pemilik Rekening'] || '';
            }
            lines.push(row(bankCols.map(c => c === 'Nominal' ? (r['Nominal Awal'] || 0) : (r[c] !== undefined ? r[c] : ''))));
            sumSettle += r['Nominal Settlement'] || 0;
            sumPlus += r['Adjustment Chargeback (+)'] || 0;
            sumMinus += r['Adjustment Chargeback (-)'] || 0;
        });
        flush();
        lines.push('');
    });

    const csv = '﻿' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Segregasi_Settlement_per_Bank_${dateGen.replace(/\//g, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Export Berhasil', 'File segregasi per bank berhasil di-generate.');
    if (typeof writeLog === 'function') writeLog('Export Segregasi per Bank', `email : dion@paydia.id\naction : Generate file segregasi settlement per bank (${dateGen})`);
}

window.showSettlementExcelModal = function(raw_data, mode) {
    let data = raw_data;
    const parseNom = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString().replace(/,/g, '')) || 0;
    };
    if (data && data.length > 0 && ('txId' in data[0] || 'tanggal' in data[0] || 'Nominal Settle (Rp)' in data[0])) {
        data = data.map((row, idx) => {
            const cbId = row.id || idx;
            let cbPlus = 0;
            let cbMinus = 0;
            if (cbId % 7 === 1) {
                cbPlus = 15000;
            } else if (cbId % 7 === 3) {
                cbMinus = 10000;
            }
            const bankName = row.bankCode || row["Bank"] || row["Nama Bank"] || "";
            // PRD: BCA / Mandiri / BRI free; bank lainnya flat 6500
            const biayaAdmin = /BCA|MANDIRI|BRI/i.test(bankName) ? 0 : 6500;
            const nominalAwal = parseNom(row.nominalQris || row["Nominal QRIS (Rp)"] || row["Nominal Awal"]);
            const nominalSettlement = nominalAwal - biayaAdmin + cbPlus - cbMinus;
            const tglProses = row.tanggal || row["Tanggal"] || row["Tanggal dan Jam Proses"] || "";
            const tglTransaksi = row.tanggalTransaksi || row["Tanggal dan Jam Transaksi"] || tglProses;
            const rrn = row.rrn || row["RRN"] || ('2501130000' + String(100 + (cbId % 900)));
            return {
                "id": cbId,
                "Tanggal dan Jam Proses": tglProses,
                "Tanggal dan Jam Transaksi": tglTransaksi,
                "ID Transaksi": row.txId || row["ID Transaksi"] || "",
                "RRN": rrn,
                "MID": row.merchantCode || row["MID"] || "",
                "Nama Merchant": row.merchantName || row["Nama Merchant"] || "",
                "Nominal Awal": nominalAwal,
                "Biaya Admin": biayaAdmin,
                "Adjustment Chargeback (+)": cbPlus,
                "Adjustment Chargeback (-)": cbMinus,
                "Nominal Settlement": nominalSettlement,
                "Nama Bank": bankName,
                "Nomor Rekening": row.bankAccount || row["No. Rek Bank"] || row["Nomor Rekening"] || "",
                "Nama Pemilik Rekening": row.bankAccountName || row["Nama Rek Bank"] || row["Nama Pemilik Rekening"] || ""
            };
        });
    }

    let overlay = document.getElementById('settlementExcelSimulationOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'settlementExcelSimulationOverlay';
        document.body.appendChild(overlay);
    }
    
    let tabsHtml = '';
    if (mode === 'utama') {
        tabsHtml = `<button class="excel-tab active" data-tab="utama" style="padding: 6px 12px; border: 1px solid #c8c6c4; border-bottom: none; border-top-left-radius: 4px; border-top-right-radius: 4px; cursor: pointer; font-size: 0.8rem; background: white; color: #107c41; font-weight: bold;">Data Utama</button>`;
    } else {
        tabsHtml = `
            <button class="excel-tab" data-tab="bca" style="padding: 6px 12px; border: 1px solid #c8c6c4; border-bottom: none; border-top-left-radius: 4px; border-top-right-radius: 4px; cursor: pointer; font-size: 0.8rem;">BCA</button>
            <button class="excel-tab" data-tab="mandiri" style="padding: 6px 12px; border: 1px solid #c8c6c4; border-bottom: none; border-top-left-radius: 4px; border-top-right-radius: 4px; cursor: pointer; font-size: 0.8rem;">Mandiri</button>
            <button class="excel-tab" data-tab="bri" style="padding: 6px 12px; border: 1px solid #c8c6c4; border-bottom: none; border-top-left-radius: 4px; border-top-right-radius: 4px; cursor: pointer; font-size: 0.8rem;">BRI</button>
            <button class="excel-tab" data-tab="lainnya" style="padding: 6px 12px; border: 1px solid #c8c6c4; border-bottom: none; border-top-left-radius: 4px; border-top-right-radius: 4px; cursor: pointer; font-size: 0.8rem;">Lainnya</button>
        `;
    }
    
    // Core structure
    overlay.innerHTML = `
        <div class="modal" style="max-width: 98%; width: 1400px; max-height: 95vh; display: flex; flex-direction: column; overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div class="modal-header" style="background: #107c41; color: white; padding: 12px 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <h2 class="modal-title" style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;">
                    <i class="fas fa-file-excel" style="margin-right: 8px;"></i> Excel Export Simulation - Settlement Bank
                </h2>
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${mode === 'bank' ? `<button id="settlementDownloadCsvBtn" style="background: #fff; color: #107c41; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"><i class="fas fa-download"></i> Download CSV Segregasi</button>` : ''}
                    <button class="modal-close" id="settlementExcelSimClose" aria-label="Tutup" style="color: white; background: transparent; border: none; font-size: 1.2rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div style="display: flex; background: #f3f2f1; padding: 8px 12px 0 12px; border-bottom: 1px solid #c8c6c4; flex-shrink: 0; overflow-x: auto; gap: 4px;">${tabsHtml}</div>

            <div class="modal-body" style="flex: 1; overflow: auto; padding: 0; background: white;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Calibri', sans-serif; font-size: 0.85rem; white-space: nowrap;">
                    <thead style="position: sticky; top: 0; z-index: 10;" id="settlementExcelThead">
                        <!-- injected -->
                    </thead>
                    <tbody id="settlementExcelTbody">
                        <!-- injected -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('settlementExcelSimClose').addEventListener('click', () => {
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    });

    const dlBtn = document.getElementById('settlementDownloadCsvBtn');
    if (dlBtn) dlBtn.addEventListener('click', () => downloadSegregasiCSV(data));

    // logic rendering tab — PRD column order
    const baseCols = [
        "Tanggal dan Jam Proses", "Tanggal dan Jam Transaksi", "ID Transaksi", "RRN", "MID",
        "Nama Merchant", "Nominal Awal", "Biaya Admin", "Adjustment Chargeback (+)",
        "Adjustment Chargeback (-)", "Nominal Settlement", "Nama Bank", "Nomor Rekening", "Nama Pemilik Rekening"
    ];

    const renderTab = (tabId) => {
        let cols = [...baseCols];

        let targetData = [];
        if (tabId === 'utama') {
            targetData = data;
        } else {
            // bank segregation
            targetData = data.filter(r => {
                const b = (r["Nama Bank"] || '').toUpperCase();
                if (tabId === 'bca') return b.includes('BCA');
                if (tabId === 'mandiri') return b.includes('MANDIRI');
                if (tabId === 'bri') return b.includes('BRI');
                if (tabId === 'lainnya') return !b.includes('BCA') && !b.includes('MANDIRI') && !b.includes('BRI');
                return false;
            });
            
            const formatNominal = (num) => {
                if (typeof num !== 'number') return num;
                let parts = num.toFixed(2).split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                if (parts[1] === "00") return parts[0];
                return parts.join(".");
            };

            // Sort data by Date and Rekening to group them together
            targetData.sort((a, b) => {
                let dateA = (a["Tanggal dan Jam Proses"] || "").split(" ")[0];
                let dateB = (b["Tanggal dan Jam Proses"] || "").split(" ")[0];
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                let rekA = a["Nomor Rekening"] || "";
                let rekB = b["Nomor Rekening"] || "";
                return rekA.localeCompare(rekB);
            });

            let newTargetData = [];
            let currentGroupKey = null;
            let currentGroupSumSettle = 0;
            let currentGroupSumCbPlus = 0;
            let currentGroupSumCbMinus = 0;
            let currentBank = "";
            let currentRek = "";
            let currentNamaRek = "";
            let currentDate = "";

            const pushSummaryRow = () => {
                if (currentGroupKey !== null) {
                    newTargetData.push({
                        "Tanggal dan Jam Proses": currentDate,
                        "Tanggal dan Jam Transaksi": "",
                        "ID Transaksi": "",
                        "RRN": "",
                        "MID": "",
                        "Nama Merchant": "TOTAL SETTLEMENT",
                        "Nominal Awal": "",
                        "Biaya Admin": "",
                        "Adjustment Chargeback (+)": currentGroupSumCbPlus,
                        "Adjustment Chargeback (-)": currentGroupSumCbMinus,
                        "Nominal Settlement": currentGroupSumSettle,
                        "Nama Bank": currentBank,
                        "Nomor Rekening": currentRek,
                        "Nama Pemilik Rekening": currentNamaRek,
                        "isSummary": true
                    });
                }
            };

            targetData.forEach(r => {
                let datePart = (r["Tanggal dan Jam Proses"] || "").split(" ")[0];
                let rekBank = r["Nomor Rekening"] || "";
                let groupKey = datePart + "|" + rekBank;

                if (groupKey !== currentGroupKey) {
                    pushSummaryRow();
                    currentGroupKey = groupKey;
                    currentGroupSumSettle = 0;
                    currentGroupSumCbPlus = 0;
                    currentGroupSumCbMinus = 0;
                    currentBank = r["Nama Bank"] || "";
                    currentRek = rekBank;
                    currentNamaRek = r["Nama Pemilik Rekening"] || "";
                    currentDate = datePart;
                }

                newTargetData.push(r);
                // Nominal Settlement already = awal - admin + cb+ - cb- ; sum it directly
                currentGroupSumSettle += r["Nominal Settlement"] || 0;
                currentGroupSumCbPlus += r["Adjustment Chargeback (+)"] || 0;
                currentGroupSumCbMinus += r["Adjustment Chargeback (-)"] || 0;
            });
            pushSummaryRow();

            targetData = newTargetData;
        }
        
        // render thead
        const theadHTML = '<tr style="background: #f3f2f1; border-bottom: 2px solid #c8c6c4;">' +
            cols.map(c => `<th style="padding: 6px 12px; border: 1px solid #c8c6c4; text-align: left; font-weight: 600; color: #323130;">${c}</th>`).join('') +
            '</tr>';
        
        document.getElementById('settlementExcelThead').innerHTML = theadHTML;
        
        // render tbody
        const formatCell = (num) => {
            if (num === null || num === undefined || num === '') return '';
            if (typeof num === 'number') {
                return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            }
            return num;
        };

        let tbodyHTML = '';
        if (targetData.length === 0) {
            tbodyHTML = `<tr><td colspan="${cols.length}" style="padding: 12px; text-align: center; color: #666;">Tidak ada data pada sheet ini.</td></tr>`;
        } else {
            const numCols = ["Nominal Awal", "Biaya Admin", "Adjustment Chargeback (+)", "Adjustment Chargeback (-)", "Nominal Settlement"];
            targetData.forEach(row => {
                let tds = '';
                cols.forEach(c => {
                    let val;
                    if (row.isSummary) {
                        if (c === "Nama Merchant") val = '<b>TOTAL SETTLEMENT</b>';
                        else if (c === "Nominal Settlement") val = '<b>' + formatCell(row[c]) + '</b>';
                        else if (numCols.includes(c)) val = formatCell(row[c]);
                        else val = (row[c] === 0 ? '0' : (row[c] || ''));
                    } else {
                        if (numCols.includes(c)) val = formatCell(row[c]);
                        else val = (row[c] === 0 ? '0' : (row[c] || '-'));
                    }
                    tds += `<td style="padding: 6px 12px; border: 1px solid #e1dfdd; color: #323130; ${row.isSummary ? 'background-color: #e2e8f0;' : ''}">${val}</td>`;
                });
                tbodyHTML += `<tr>${tds}</tr>`;
            });
        }
        document.getElementById('settlementExcelTbody').innerHTML = tbodyHTML;
        
        // update tabs ui
        document.querySelectorAll('.excel-tab').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
                btn.style.background = 'white';
                btn.style.color = '#107c41';
                btn.style.fontWeight = 'bold';
            } else {
                btn.classList.remove('active');
                btn.style.background = '#e1dfdd';
                btn.style.color = '#323130';
                btn.style.fontWeight = 'normal';
            }
        });
    };

    // Attach tab listeners
    document.querySelectorAll('.excel-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            renderTab(e.target.dataset.tab);
        });
    });

    renderTab(mode === 'utama' ? 'utama' : 'bca');

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
};


// List Transaksi Modal Logic

document.addEventListener('DOMContentLoaded', () => {
    const _closeListTransaksiBtn = document.getElementById('closeListTransaksiBtn');
    if (_closeListTransaksiBtn) {
        _closeListTransaksiBtn.addEventListener('click', () => {
            const m = document.getElementById('listTransaksiModal');
            if (m) m.classList.remove('show');
        });
    }
});

// Export buttons: bind on DOMContentLoaded (no arbitrary 500ms delay, no clone
// hack — the old conflicting inline handler was removed). ponytail: this is the
// only export wiring now. Buttons exist before this script; the date modal lives
// after it, so the modal is looked up inside the handler at click time.
document.addEventListener('DOMContentLoaded', () => {
    const btnExpUtama = document.getElementById('exportBtn');
    const btnExpBank = document.getElementById('exportBankBtn');
    const dateModal = document.getElementById('exportDateModal');
    const cancelBtn = document.getElementById('cancelExportBtn');
    const submitBtn = document.getElementById('submitExportBtn');

    let activeExportMode = 'utama';

    // .modal-overlay is hidden via opacity/visibility and only revealed by the .show class.
    // Setting style.display alone leaves it transparent (the bug). Toggle .show AND clear the
    // inline display:none that the markup ships with.
    const openModal = (m) => { if (m) { m.style.display = ''; m.classList.add('show'); } };
    const closeModal = (m) => { if (m) m.classList.remove('show'); };

    if (btnExpUtama) btnExpUtama.addEventListener('click', () => {
        activeExportMode = 'utama';
        openModal(dateModal);
    });

    if (btnExpBank) btnExpBank.addEventListener('click', () => {
        activeExportMode = 'bank';
        openModal(dateModal);
    });

    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        closeModal(dateModal);
    });

    if (submitBtn) submitBtn.addEventListener('click', () => {
        closeModal(dateModal);
        const overlay = document.getElementById('exportProgressOverlay');
        overlay.style.display = 'flex';
        let progress = 0;
        const bar = document.getElementById('exportProgressBar');
        const text = document.getElementById('exportProgressText');

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) progress = 100;
            bar.style.width = progress + '%';
            text.innerText = 'Memproses... ' + progress + '%';

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    overlay.style.display = 'none';
                    bar.style.width = '0%';
                    window.showSettlementExcelModal(database, activeExportMode);
                }, 500);
            }
        }, 200);
    });
});
