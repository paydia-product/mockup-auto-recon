/* ============================================
   Paydia Bisnis – Transaksi Page
   Application Logic
   ============================================ */

// ── Transaction Data ──
const transaksiData = [
    {
        no: 1,
        refId: '290512000003',
        date: '12-May-2026 15:30:37',
        category: 'Merchant - Bayar Merchant',
        name: 'Faspay Test',
        phone: '085782219544',
        email: 'faspay@test.com',
        nominal: 26709,
        status: 'Sukses',
        hasRetry: false
    },
    {
        no: 2,
        refId: '290512000002',
        date: '12-May-2026 15:27:05',
        category: 'Merchant - Bayar Merchant',
        name: 'Faspay Test',
        phone: '085782219544',
        email: 'faspay@test.com',
        nominal: 23889,
        status: 'Sukses',
        hasRetry: false
    },
    {
        no: 3,
        refId: '290512000001',
        date: '12-May-2026 11:57:52',
        category: 'Uang Masuk - Transfer Bank',
        name: 'Dion',
        phone: '087885800280',
        email: 'dion.scholus@gmail.com',
        nominal: 50000,
        status: 'Gagal',
        hasRetry: true
    },
    {
        no: 4,
        refId: '280511000025',
        date: '11-May-2026 22:22:14',
        category: 'Merchant - Auth Payment',
        name: 'Davonte',
        phone: '085155208048',
        email: 'davonte@mail.com',
        nominal: 17000,
        status: 'Sukses',
        hasRetry: false
    },
    {
        no: 5,
        refId: '280511000024',
        date: '11-May-2026 22:19:16',
        category: 'Merchant - Auth Payment',
        name: 'Davonte',
        phone: '085155208048',
        email: 'davonte@mail.com',
        nominal: 17000,
        status: 'Sukses',
        hasRetry: false
    },
    {
        no: 6,
        refId: '280511000023',
        date: '11-May-2026 22:04:27',
        category: 'Merchant - Auth Payment',
        name: 'Davonte',
        phone: '085155208048',
        email: 'davonte@mail.com',
        nominal: 17000,
        status: 'Sukses',
        hasRetry: false
    },
    // ── 4x Digital Content - Flazz transactions ──
    {
        no: 7,
        refId: '280511000022',
        date: '11-May-2026 22:04:05',
        category: 'Digital Content - Flazz',
        name: 'Dion',
        phone: '087885800290',
        email: 'dion.scholus@gmail.com',
        nominal: 50000,
        adminFee: 1500,
        cardNumber: '6013012345678901',
        product: 'Top Up Flazz Rp 50.000',
        status: 'Sukses',
        hasRetry: false
    },
    {
        no: 8,
        refId: '280511000021',
        date: '11-May-2026 22:03:42',
        category: 'Digital Content - Flazz',
        name: 'Naomi',
        phone: '088202183788',
        email: 'naomilinki@gmail.com',
        nominal: 100000,
        adminFee: 1500,
        cardNumber: '6013098765432109',
        product: 'Top Up Flazz Rp 100.000',
        status: 'Gagal',
        hasRetry: false
    },
    {
        no: 9,
        refId: '280511000020',
        date: '11-May-2026 22:03:29',
        category: 'Digital Content - Flazz',
        name: 'Xailure',
        phone: '081111111111',
        email: 'jays@xailure.co',
        nominal: 200000,
        adminFee: 1500,
        cardNumber: '6013055512349876',
        product: 'Top Up Flazz Rp 200.000',
        status: 'Proses',
        hasRetry: false
    },
    {
        no: 10,
        refId: '280511000019',
        date: '11-May-2026 22:02:57',
        category: 'Digital Content - Flazz',
        name: 'Davonte',
        phone: '085155208048',
        email: 'davonte@mail.com',
        nominal: 75000,
        adminFee: 1500,
        cardNumber: '6013011122334455',
        product: 'Top Up Flazz Rp 75.000',
        status: 'Dikembalikan',
        hasRetry: false
    }
];

// ── State ──
let currentTransaksiData = [];
let currentPage = 1;
const totalItems = 7863;
const perPage = 10;
const totalPages = Math.ceil(totalItems / perPage);
let activeGagalkanRef = null; // tracks which trx the gagalkan modal is for

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
const tableBody = document.getElementById('transaksiTableBody');
const paginationInfo = document.getElementById('paginationInfo');
const paginationContainer = document.getElementById('pagination');
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const exportBtn = document.getElementById('exportBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileToggle = document.getElementById('mobileToggle');
const sidebarToggle = document.getElementById('sidebarToggle');

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
    // If Read is false, we can disable or limit features on transaksi.js
    // Hide Export button if permissions.export is false
    if (exportBtn) {
        exportBtn.style.display = permissions.export ? '' : 'none';
    }
    renderTable();
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    createModal();
    createGagalkanModal();
    loadPermissions();
    applyPermissions();
    renderTableWithLoading();
    renderPagination();
    bindEvents();
    initMockDataControl();

    // Check URL params for user filter
    const params = new URLSearchParams(window.location.search);
    const userName = params.get('user');
    if (userName) {
        const sanitized = userName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        showToast('Filter Aktif', `Menampilkan transaksi untuk "${sanitized}"`);
    }
});

// ── Skeleton Loader ──
function renderSkeleton(colsCount) {
    tableBody.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const tr = document.createElement('tr');
        let tds = '';
        for (let j = 0; j < colsCount; j++) {
            let width = '70%';
            if (j === 0) width = '30px';
            else if (j === 7) width = '60px';
            else if (j === 8) width = '80px';
            else width = `${Math.floor(Math.random() * 30) + 60}%`;
            tds += `<td><div class="skeleton" style="height: 18px; width: ${width}; margin: 2px auto;"></div></td>`;
        }
        tr.innerHTML = tds;
        tableBody.appendChild(tr);
    }
}

function renderTableWithLoading() {
    renderSkeleton(9);
    setTimeout(() => {
        renderTable();
    }, 350);
}

// ── Create Detail Modal (injected into DOM) ──
function createModal() {
    const modalHTML = `
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal" id="detailModal">
            <div class="modal-header">
                <h2 class="modal-title">Rincian Transaksi</h2>
                <button class="modal-close" id="modalClose" aria-label="Tutup">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ── Create Gagalkan Transaksi Modal ──
function createGagalkanModal() {
    const html = `
    <div class="modal-overlay" id="gagalkanOverlay">
        <div class="modal" id="gagalkanModal" style="max-width:500px;">
            <div class="modal-header">
                <h2 class="modal-title">Gagalkan Transaksi</h2>
                <button class="modal-close" id="gagalkanClose" aria-label="Tutup">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="gagalkanForm" novalidate>
                    <!-- Alasan -->
                    <div class="form-group">
                        <label for="gagalkanAlasan" class="form-label">Alasan <span class="required">*</span></label>
                        <textarea id="gagalkanAlasan" class="form-input form-textarea" maxlength="250"
                                  placeholder="Masukkan alasan gagalkan transaksi..." rows="4" required></textarea>
                        <div class="form-hint">
                            <span id="gagalkanCharCount">0</span>/250 karakter
                        </div>
                        <div class="form-error" id="gagalkanAlasanError">Alasan wajib diisi</div>
                    </div>

                    <!-- Bukti Komplain -->
                    <div class="form-group">
                        <label for="gagalkanFile" class="form-label">Bukti Komplain <span class="optional">(opsional)</span></label>
                        <div class="file-upload-area" id="fileUploadArea">
                            <input type="file" id="gagalkanFile" accept=".jpg,.jpeg,.png,.pdf" class="file-input-hidden">
                            <div class="file-upload-placeholder" id="filePlaceholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span>Pilih file atau drag & drop</span>
                                <small>JPG, PNG, PDF (maks. 5MB)</small>
                            </div>
                            <div class="file-upload-selected" id="fileSelected" style="display:none;">
                                <i class="fas fa-file"></i>
                                <span id="fileName"></span>
                                <button type="button" class="file-remove" id="fileRemove" aria-label="Hapus file">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-error" id="gagalkanFileError"></div>
                    </div>

                    <!-- Buttons -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-cancel" id="gagalkanCancelBtn">Cancel</button>
                        <button type="submit" class="btn btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

// ── Open Gagalkan Modal ──
function openGagalkanModal(refId) {
    activeGagalkanRef = refId;
    const overlay = document.getElementById('gagalkanOverlay');

    // Reset form
    document.getElementById('gagalkanForm').reset();
    document.getElementById('gagalkanCharCount').textContent = '0';
    document.getElementById('gagalkanAlasanError').classList.remove('show');
    document.getElementById('gagalkanFileError').classList.remove('show');
    document.getElementById('filePlaceholder').style.display = '';
    document.getElementById('fileSelected').style.display = 'none';

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Focus the textarea
    setTimeout(() => document.getElementById('gagalkanAlasan').focus(), 200);
}

// ── Close Gagalkan Modal ──
function closeGagalkanModal() {
    const overlay = document.getElementById('gagalkanOverlay');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    activeGagalkanRef = null;
}

// ── Handle Gagalkan Form Submit ──
function handleGagalkanSubmit(e) {
    e.preventDefault();

    const alasanEl = document.getElementById('gagalkanAlasan');
    const fileEl = document.getElementById('gagalkanFile');
    const alasan = alasanEl.value.trim();

    // Validate alasan
    if (!alasan) {
        document.getElementById('gagalkanAlasanError').textContent = 'Alasan wajib diisi';
        document.getElementById('gagalkanAlasanError').classList.add('show');
        alasanEl.focus();
        return;
    }
    document.getElementById('gagalkanAlasanError').classList.remove('show');

    // Validate file (if selected)
    const file = fileEl.files[0];
    if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (file.size > maxSize) {
            document.getElementById('gagalkanFileError').textContent = 'Ukuran file maksimal 5MB';
            document.getElementById('gagalkanFileError').classList.add('show');
            return;
        }
        if (!allowedTypes.includes(file.type)) {
            document.getElementById('gagalkanFileError').textContent = 'Format file harus JPG, PNG, atau PDF';
            document.getElementById('gagalkanFileError').classList.add('show');
            return;
        }
        document.getElementById('gagalkanFileError').classList.remove('show');
    }

    // Find the transaction
    const trx = currentTransaksiData.find(t => t.refId === activeGagalkanRef);
    if (!trx) return;

    // Build approval entry
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '-') + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const approvalEntry = {
        id: 'APR-' + Date.now(),
        tanggal: dateStr,
        account: trx.email,
        admin: 'Dion',
        tipeRequest: 'Ubah Status Transaksi Digital Content',
        refId: trx.refId,
        userName: trx.name,
        product: trx.product,
        nominal: trx.nominal,
        adminFee: trx.adminFee,
        currentStatus: 'Proses',
        requestedStatus: 'Gagal',
        alasan: alasan,
        fileName: file ? file.name : 'sample-bukti.png',
        fileUrl: 'sample-bukti.png',
        fileData: null,
        status: 'Pending'
    };

    // Convert file to base64 if it's an image, then save
    const saveAndClose = () => {
        const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
        approvals.unshift(approvalEntry);
        localStorage.setItem('paydia_approvals', JSON.stringify(approvals));

        closeGagalkanModal();
        showToast('Pengajuan Berhasil', `Pengajuan gagalkan transaksi ${trx.refId} telah dikirim ke halaman Approval.`);
    };

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            approvalEntry.fileData = ev.target.result;
            saveAndClose();
        };
        reader.readAsDataURL(file);
    } else {
        saveAndClose();
    }
}

// ── Open Flazz Detail Modal ──
function openFlazzModal(trx) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const total = trx.nominal + trx.adminFee;

    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title">Rincian Umum</h3>
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">ID Transaksi</td>
                    <td class="detail-value">${trx.refId}</td>
                </tr>
                <tr>
                    <td class="detail-label">Nama Pengguna</td>
                    <td class="detail-value">${trx.name}</td>
                </tr>
                <tr>
                    <td class="detail-label">Email</td>
                    <td class="detail-value">${trx.email}</td>
                </tr>
                <tr>
                    <td class="detail-label">Nomor HP Pengguna</td>
                    <td class="detail-value">${trx.phone}</td>
                </tr>
                <tr>
                    <td class="detail-label">Kategori</td>
                    <td class="detail-value">${trx.category}</td>
                </tr>
                <tr>
                    <td class="detail-label">Produk</td>
                    <td class="detail-value">${trx.product}</td>
                </tr>
                <tr>
                    <td class="detail-label">Status</td>
                    <td class="detail-value">
                        <span class="status-badge status-${trx.status.toLowerCase()}">${trx.status}</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="modal-section">
            <h3 class="modal-section-title">Rincian Top Up</h3>
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">Nomor Kartu Flazz</td>
                    <td class="detail-value">${trx.cardNumber}</td>
                </tr>
                <tr>
                    <td class="detail-label">Nominal (Rp)</td>
                    <td class="detail-value">Rp ${formatNominal(trx.nominal)}</td>
                </tr>
                <tr>
                    <td class="detail-label">Biaya Admin</td>
                    <td class="detail-value">Rp ${formatNominal(trx.adminFee)}</td>
                </tr>
                <tr>
                    <td class="detail-label detail-label-total">Total</td>
                    <td class="detail-value detail-value-total">Rp ${formatNominal(total)}</td>
                </tr>
            </table>
        </div>
    `;

    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ── Close Modal ──
function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// ── Render Table ──
function renderTable() {
    tableBody.innerHTML = '';

    // Read status overrides from localStorage
    const overrides = JSON.parse(localStorage.getItem('paydia_status_overrides') || '{}');

    currentTransaksiData.forEach((trx) => {
        const isFlazz = trx.category === 'Digital Content - Flazz';
        // Apply status override if exists
        const displayStatus = overrides[trx.refId] || trx.status;
        const isFlazzProses = isFlazz && displayStatus === 'Proses';
        const tr = document.createElement('tr');

        // Build action cell content
        let actionContent = '';
        // Show retry only for non-Flazz rows with hasRetry
        if (trx.hasRetry && !isFlazz) {
            actionContent += `<button class="btn-retry" data-ref="${trx.refId}" title="Retry"><i class="fas fa-redo-alt"></i></button>`;
        }
        if (isFlazzProses) {
            actionContent += `<button class="btn-gagalkan" data-ref="${trx.refId}">Gagalkan Transaksi</button>`;
        }

        tr.innerHTML = `
            <td class="col-no">${trx.no}</td>
            <td><a href="#" class="ref-link ${isFlazz ? 'ref-link-flazz' : ''}" data-ref="${trx.refId}">${trx.refId}</a></td>
            <td>${trx.date}</td>
            <td>${trx.category}</td>
            <td>${trx.name}</td>
            <td>${trx.phone}</td>
            <td>Rp${formatNominal(trx.nominal)}</td>
            <td><span class="status-badge status-${displayStatus.toLowerCase()}">${displayStatus}</span></td>
            <td class="col-action-trx">${actionContent}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function formatNominal(amount) {
    return amount.toLocaleString('id-ID');
}

// ── Render Pagination ──
function renderPagination() {
    const existingBtns = paginationContainer.querySelectorAll('.page-btn:not(#prevPage):not(#nextPage), .page-dots');
    existingBtns.forEach(btn => btn.remove());

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);
    paginationInfo.textContent = `${start} - ${end} of ${totalItems}`;

    const pages = getPageNumbers(currentPage, totalPages);
    const frag = document.createDocumentFragment();

    pages.forEach(p => {
        if (p === '...') {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '...';
            frag.appendChild(dots);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-btn${p === currentPage ? ' active' : ''}`;
            btn.textContent = p;
            btn.setAttribute('aria-label', `Page ${p}`);
            btn.addEventListener('click', () => {
                currentPage = p;
                renderTableWithLoading();
                renderPagination();
            });
            frag.appendChild(btn);
        }
    });

    nextBtn.before(frag);
}

function getPageNumbers(current, total) {
    const pages = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
    }

    pages.push(1);
    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
}

// ── Toast Notification ──
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

    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
}

// ── Bind Events ──
function bindEvents() {
    // Filter toggle
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('open');
        filterBtn.classList.toggle('active');
    });

    // Export button
    exportBtn.addEventListener('click', () => {
        showToast('Export', 'Mengexport data transaksi...');
    });

    // Table click delegation: ref links, retry, gagalkan
    tableBody.addEventListener('click', (e) => {
        // Ref link
        const refLink = e.target.closest('.ref-link');
        if (refLink) {
            e.preventDefault();
            const refId = refLink.dataset.ref;
            const trx = currentTransaksiData.find(t => t.refId === refId);
            if (trx && trx.category === 'Digital Content - Flazz') {
                openFlazzModal(trx);
            } else {
                showToast('Detail Transaksi', `Membuka detail ${refId}`);
            }
            return;
        }

        // Retry button
        const retryBtn = e.target.closest('.btn-retry');
        if (retryBtn) {
            e.preventDefault();
            showToast('Retry', `Mencoba ulang transaksi ${retryBtn.dataset.ref}`);
            return;
        }

        // Gagalkan Transaksi button
        const gagalkanBtn = e.target.closest('.btn-gagalkan');
        if (gagalkanBtn) {
            e.preventDefault();
            openGagalkanModal(gagalkanBtn.dataset.ref);
            return;
        }
    });

    // ── Detail Modal close events ──
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // ── Gagalkan Modal events ──
    document.getElementById('gagalkanClose').addEventListener('click', closeGagalkanModal);
    document.getElementById('gagalkanCancelBtn').addEventListener('click', closeGagalkanModal);
    document.getElementById('gagalkanOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeGagalkanModal();
    });

    // Char counter
    document.getElementById('gagalkanAlasan').addEventListener('input', (e) => {
        document.getElementById('gagalkanCharCount').textContent = e.target.value.length;
        if (e.target.value.trim()) {
            document.getElementById('gagalkanAlasanError').classList.remove('show');
        }
    });

    // File input handling
    const fileInput = document.getElementById('gagalkanFile');
    const uploadArea = document.getElementById('fileUploadArea');

    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            document.getElementById('filePlaceholder').style.display = 'none';
            document.getElementById('fileSelected').style.display = 'flex';
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('gagalkanFileError').classList.remove('show');
        }
    });

    document.getElementById('fileRemove').addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        document.getElementById('filePlaceholder').style.display = '';
        document.getElementById('fileSelected').style.display = 'none';
    });

    // Form submit
    document.getElementById('gagalkanForm').addEventListener('submit', handleGagalkanSubmit);

    // Escape key closes whichever modal is open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeGagalkanModal();
        }
    });

    // Pagination prev/next
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableWithLoading();
            renderPagination();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTableWithLoading();
            renderPagination();
        }
    });

    // Sidebar mobile toggle
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

    // Submenu toggle (sidebar)
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
}

function initDatabase() {
    let populatedVal = localStorage.getItem('paydia_mock_populated');
    if (populatedVal === null) {
        localStorage.setItem('paydia_mock_populated', 'true');
        populatedVal = 'true';
    }
    const isPopulated = populatedVal === 'true';
    if (isPopulated) {
        currentTransaksiData = [...transaksiData];
    } else {
        currentTransaksiData = [];
    }
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
                { id: 9145, tanggal: '28-05-2026 15:01:39', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
                { id: 9144, tanggal: '28-05-2026 15:00:31', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
                { id: 9143, tanggal: '28-05-2026 14:57:42', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
                { id: 9142, tanggal: '28-05-2026 14:42:06', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : dion@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
                { id: 9141, tanggal: '28-05-2026 14:28:23', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '38.75.8.222' },
                { id: 9140, tanggal: '28-05-2026 11:31:14', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
                { id: 9139, tanggal: '28-05-2026 15:54:41', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : aldy@merchant.id\nuser.type : admin', ip: '103.177.100.34' }
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
