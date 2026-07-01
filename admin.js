/* Paydia Bisnis — Admin Management + Manage Permissions (mockup) */

// ── Mock admin list ──
const STATUSES = ['Active', 'Suspend', 'Archive'];
const seedAdmins = (() => {
    const base = [
        ['dionscholus+1@gmail.com', 'dion test', 'Suspend'],
        ['dionscholus+2@gmail.com', 'dion test', 'Archive'],
        ['dion@paydia.id', 'Dion', 'Active'],
        ['kenny@paydia.id', 'King Kenny 1', 'Active'],
        ['rafli@paydia.id', 'Rafli', 'Archive'],
        ['izar@gmail.com', 'izarlvl2', 'Active'],
        ['izar@paydia.id', 'Izar', 'Active'],
        ['blackvolk@paydia.id', 'BlackVolk', 'Active'],
        ['krisvalencio28@gmail.com', 'Kris test 2', 'Suspend'],
        ['gkvalencio97@gmail.com', 'kris test 1', 'Suspend']
    ];
    const list = base.map((b, i) => ({ id: i + 1, email: b[0], nama: b[1], status: b[2] }));
    for (let i = 11; i <= 27; i++) {
        list.push({ id: i, email: `admin${i}@paydia.id`, nama: `Admin ${i}`, status: STATUSES[i % 3] });
    }
    return list;
})();

let admins = JSON.parse(JSON.stringify(seedAdmins));
let currentPage = 1;
const perPage = 10;
let editingId = null;

// ── Permission segments (PRD: + Process Unmatched Transaction, + Export per Bank, + Reconcile QRIS Acquirer) ──
const permSegments = [
    { name: 'Manajemen Tema', perms: ['Create', 'Delete', 'Read', 'Update'] },
    { name: 'Merchant', perms: ['Export', 'Fds Reactive Limit', 'Read', 'Read Mutasi', 'Update Kym', 'Update Merchant', 'Update Merchant Bank Account', 'Update Public Key', 'Update Soundbox'] },
    {
        name: 'Approval', perms: [
            'Change Edit', 'Change Merchant', 'Change Merchant Bank Account', 'Change User', 'Merchant',
            'Promo Campaign', 'Public Key', 'Qris Callback', 'Read', 'Topup Manual', 'Trx Bisnis',
            'Trx User', 'Update Soundbox', 'Upgrade Gold', 'User Config Transaction', 'User Device Id',
            { label: 'Process Unmatched Transaction', isNew: true }
        ]
    },
    { name: 'Settlement Rekon', perms: ['Export', 'Inquiry', 'Read', 'Update', { label: 'Export per Bank', isNew: true }] },
    { name: 'Reconcile QRIS Acquirer', isNew: true, perms: ['Card Statistic', 'View Match', 'View Unmatch', 'Action Unmatch', 'Export', 'View Decline'] },
    { name: 'Auto Settlement QRIS Checker', isNew: true, perms: ['Read', 'Export', 'Hold', 'Reject', 'Settle'] },
    { name: 'Auto Settlement QRIS Approver', isNew: true, perms: ['Read', 'Approval'] },
    { name: 'Auto Settlement QRIS Result', isNew: true, perms: ['Read', 'Export', 'Export Segregasi', 'Hold', 'Settle', 'Reject', 'Retry Settle'] }
];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// ── Render admin list ──
function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '';
    const total = admins.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * perPage;
    const pageItems = admins.slice(start, start + perPage);

    pageItems.forEach((a, i) => {
        const tr = document.createElement('tr');
        const cls = a.status.toLowerCase();
        tr.innerHTML = `
            <td>${start + i + 1}</td>
            <td>${a.email}</td>
            <td>${a.nama}</td>
            <td><span class="admin-status ${cls}">${a.status}</span></td>
            <td style="text-align:center;"><button class="btn btn-edit-admin" data-id="${a.id}" style="background:var(--primary,#4f46e5); color:white; border:none; padding:6px 16px;">Edit <i class="fas fa-hammer" style="margin-left:4px; font-size:0.72rem;" title="Butuh Pengerjaan"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('adminPaginationInfo').textContent = `${total ? start + 1 : 0} - ${Math.min(start + perPage, total)} of ${total}`;
    renderPageButtons(totalPages);
}

function renderPageButtons(totalPages) {
    const container = document.getElementById('adminPagination');
    container.querySelectorAll('.page-num').forEach(b => b.remove());
    const next = document.getElementById('adminNextPage');
    const frag = document.createDocumentFragment();
    for (let p = 1; p <= totalPages; p++) {
        const b = document.createElement('button');
        b.className = 'page-btn page-num' + (p === currentPage ? ' active' : '');
        b.textContent = p;
        b.dataset.page = p;
        frag.appendChild(b);
    }
    container.insertBefore(frag, next);
    document.getElementById('adminPrevPage').disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
}

// ── Permission modal rendering ──
function renderPermSegments(filter = '') {
    const wrap = document.getElementById('permSegments');
    wrap.innerHTML = '';
    const f = filter.trim().toLowerCase();
    permSegments.forEach((seg, si) => {
        if (f && !seg.name.toLowerCase().includes(f)) return;
        const items = seg.perms.map((p, pi) => {
            const label = typeof p === 'string' ? p : p.label;
            const isNew = typeof p === 'object' && p.isNew;
            const id = `perm-${si}-${pi}`;
            return `<label class="perm-item"><input type="checkbox" class="perm-chk" data-seg="${si}" id="${id}"> ${label}${isNew ? '<span class="perm-new-badge">Baru</span>' : ''}</label>`;
        }).join('');
        const seg_html = `
            <div class="perm-segment" data-seg="${si}">
                <div class="perm-segment-head">
                    <div><span class="perm-segment-title">${seg.name}</span><span class="perm-segment-count">(${seg.perms.length} permissions)</span>${seg.isNew ? '<span class="perm-new-badge">Baru</span>' : ''}</div>
                    <label class="perm-selectall"><input type="checkbox" class="perm-selectall-chk" data-seg="${si}"> Select All</label>
                </div>
                <div class="perm-grid">${items}</div>
            </div>`;
        wrap.insertAdjacentHTML('beforeend', seg_html);
    });
}

function openAdminModal(admin) {
    editingId = admin ? admin.id : null;
    document.getElementById('adminModalTitle').textContent = admin ? 'Edit Admin' : 'Tambah Admin';
    document.getElementById('adminEmail').value = admin ? admin.email : '';
    document.getElementById('adminNama').value = admin ? admin.nama : '';
    document.getElementById('adminStatus').value = admin ? admin.status : '';
    document.getElementById('permSearch').value = '';
    renderPermSegments();
    const overlay = document.getElementById('adminModalOverlay');
    overlay.style.display = 'flex';
    overlay.classList.add('show'); // .modal-overlay is opacity/visibility-hidden until .show
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    const overlay = document.getElementById('adminModalOverlay');
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function showToast(title, msg) {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-content"><strong>${title}</strong><div>${msg}</div></div>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ── Events ──
document.addEventListener('DOMContentLoaded', () => {
    renderTable();

    document.getElementById('btnAddAdmin').addEventListener('click', () => openAdminModal(null));
    document.getElementById('btnRefreshPerm').addEventListener('click', () => showToast('Permissions', 'Permission list di-refresh.'));

    document.getElementById('adminTableBody').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-edit-admin');
        if (btn) {
            const a = admins.find(x => x.id === parseInt(btn.dataset.id, 10));
            if (a) openAdminModal(a);
        }
    });

    document.getElementById('adminModalClose').addEventListener('click', closeAdminModal);
    document.getElementById('adminCancelBtn').addEventListener('click', closeAdminModal);

    document.getElementById('adminSaveBtn').addEventListener('click', () => {
        const status = document.getElementById('adminStatus').value;
        if (!status) { showToast('Validasi', 'Status wajib dipilih.'); return; }
        const email = document.getElementById('adminEmail').value.trim();
        const nama = document.getElementById('adminNama').value.trim();
        if (editingId) {
            const a = admins.find(x => x.id === editingId);
            if (a) { a.email = email || a.email; a.nama = nama || a.nama; a.status = status; }
            showToast('Berhasil', 'Data admin & permission diperbarui.');
        } else {
            admins.unshift({ id: Date.now(), email: email || 'admin@paydia.id', nama: nama || 'Admin Baru', status });
            showToast('Berhasil', 'Admin baru ditambahkan.');
        }
        closeAdminModal();
        renderTable();
    });

    // Permission search
    document.getElementById('permSearch').addEventListener('input', (e) => renderPermSegments(e.target.value));

    // Select-all per segment + sync
    document.getElementById('permSegments').addEventListener('change', (e) => {
        if (e.target.classList.contains('perm-selectall-chk')) {
            const si = e.target.dataset.seg;
            document.querySelectorAll(`.perm-chk[data-seg="${si}"]`).forEach(c => { c.checked = e.target.checked; });
        } else if (e.target.classList.contains('perm-chk')) {
            const si = e.target.dataset.seg;
            const all = [...document.querySelectorAll(`.perm-chk[data-seg="${si}"]`)];
            const sa = document.querySelector(`.perm-selectall-chk[data-seg="${si}"]`);
            if (sa) sa.checked = all.every(c => c.checked);
        }
    });

    // Pagination
    document.getElementById('adminPrevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
    document.getElementById('adminNextPage').addEventListener('click', () => { currentPage++; renderTable(); });
    document.getElementById('adminPagination').addEventListener('click', (e) => {
        const b = e.target.closest('.page-num');
        if (b) { currentPage = parseInt(b.dataset.page, 10); renderTable(); }
    });

    // Sidebar submenu toggles (must toggle .submenu.open — that's what the CSS keys on)
    document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const group = item.closest('.nav-group');
            const submenu = group ? group.querySelector('.submenu') : null;
            const arrow = item.querySelector('.submenu-arrow');
            if (group) group.classList.toggle('open');
            if (submenu) submenu.classList.toggle('open');
            if (arrow) { arrow.classList.toggle('fa-chevron-down'); arrow.classList.toggle('fa-chevron-up'); }
        });
    });

    // Sidebar collapse + mobile toggles (parity with other pages)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.getElementById('mobileToggle');
    if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    if (mobileToggle && sidebar) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
});
