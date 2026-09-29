/* Dealer topup UI shared by Payin, Approval, Admin and Log. */
(function () {
    'use strict';
    const core = window.PaydiaTopup;
    const $ = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = value => 'Rp' + Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 20 });
    const dateTime = value => {
        if (!value) return '-';
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(value));
        const p = Object.fromEntries(parts.map(item => [item.type, item.value]));
        return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second}`;
    };
    const size = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    const account = state => state.accounts.find(a => String(a.id) === String(state.activeAccountId));
    const latest = (state, txId, kind) => state.requests.filter(r => r.transactionId === txId && r.kind === kind).at(-1);
    const status = value => ({ pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[value] || 'Belum ada');
    let activeObjectUrl = null;
    let dialogOpener = null;
    let dialogOpenerTransactionId = null;
    let pendingDialogOpener = null;
    let listScroll = null;
    let dialogSerial = 0;
    let formContext = null;
    let formSubmitting = false;
    let activeMenu = null;
    let page = 1;
    let search = '';
    let filters = { status: '', adjustment: '', vendor: '' };

    function dialog() {
        let el = $('topup-dialog');
        if (!el) {
            el = document.createElement('dialog');
            el.id = 'topup-dialog'; el.className = 'topup-dialog';
            el.setAttribute('aria-labelledby', 'topup-dialog-title');
            el.innerHTML = '<div class="topup-dialog-head"><h2 id="topup-dialog-title"></h2><button type="button" id="topup-dialog-close" class="topup-close" aria-label="Tutup">&times;</button></div><div id="topup-dialog-body"></div>';
            document.body.appendChild(el);
        }
        if (!el.dataset.topupWired) {
            el.querySelector('#topup-dialog-close').addEventListener('click', () => formContext ? cancelForm() : closeDialog());
            el.addEventListener('cancel', event => {
                if (!formContext) return;
                event.preventDefault();
                cancelForm();
            });
            el.addEventListener('close', cleanupDialog);
            el.dataset.topupWired = 'true';
        }
        return el;
    }
    function cleanupDialog() {
        dialogSerial++;
        if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
        formContext = null;
        formSubmitting = false;
        const opener = dialogOpener?.isConnected ? dialogOpener :
            [...document.querySelectorAll('[data-topup-menu]')].find(button => button.dataset.topupMenu === dialogOpenerTransactionId) ||
            $('topup-search-input') || $('topup-filter-btn');
        if (listScroll) {
            const wrapper = $('topup-table')?.closest('.table-wrapper');
            if (wrapper) { wrapper.scrollLeft = listScroll.tableLeft; wrapper.scrollTop = listScroll.tableTop; }
            window.scrollTo(listScroll.x, listScroll.y);
        }
        opener?.focus({ preventScroll: true });
        dialogOpener = null;
        dialogOpenerTransactionId = null;
        listScroll = null;
    }
    function closeDialog(force = false) { const el = dialog(); if (force) { formContext = null; formSubmitting = false; } if (el.open) el.close(); }
    function openDialog(title, html) {
        const el = dialog();
        if (!el.open) {
            dialogOpener = pendingDialogOpener?.button || document.activeElement;
            dialogOpenerTransactionId = pendingDialogOpener?.transactionId || null;
            listScroll = pendingDialogOpener?.scroll || null;
        }
        pendingDialogOpener = null;
        if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
        dialogSerial++;
        $('topup-dialog-title').textContent = title;
        $('topup-dialog-body').innerHTML = html;
        $('topup-dialog-close').disabled = false;
        if (!el.open) el.showModal();
        el.querySelector('#topup-dialog-close').focus();
        return $('topup-dialog-body');
    }
    function row(label, value) { return `<div class="topup-readonly-row"><span>${escape(label)}</span><strong>${escape(value ?? '-')}</strong></div>`; }
    function actions(extra = '') { return `<div class="topup-actions"><button type="button" class="topup-button secondary" data-topup-close>Batal / Tutup</button>${extra}</div>`; }
    function bindClose(body) { body.querySelector('[data-topup-close]')?.addEventListener('click', () => closeDialog()); }
    function cancelForm() {
        if (formSubmitting || !formContext) return;
        const context = formContext;
        formContext = null;
        if (context.origin === 'detail') {
            txDetail(context.transactionId);
            dialog().scrollTop = context.scrollTop;
            dialog().querySelector(context.focus)?.focus({ preventScroll: true });
        } else closeDialog();
    }
    function startSubmitting(body) {
        formSubmitting = true;
        body.querySelector('[data-topup-close]').disabled = true;
        $('topup-dialog-close').disabled = true;
        const submit = body.querySelector('[type=submit]');
        submit.disabled = true;
        submit.textContent = 'Mengirim…';
        return dialogSerial;
    }
    function stopSubmitting(body, label) {
        formSubmitting = false;
        body.querySelector('[data-topup-close]').disabled = false;
        $('topup-dialog-close').disabled = false;
        const submit = body.querySelector('[type=submit]');
        submit.disabled = false;
        submit.textContent = label;
    }
    function message(body, text, kind = 'notice') {
        let box = body.querySelector('[data-topup-message]');
        if (!box) { box = document.createElement('div'); box.dataset.topupMessage = ''; body.prepend(box); }
        box.className = kind === 'success' ? 'topup-success' : 'topup-notice';
        box.textContent = text;
    }

    async function showEvidence(target, evidenceId, fallback) {
        const serial = dialogSerial;
        target.replaceChildren();
        if (!evidenceId) { target.textContent = 'Tidak ada bukti'; return; }
        try {
            const item = await core.getEvidence(evidenceId);
            if (serial !== dialogSerial || !target.isConnected) return;
            if (!item?.blob) { target.textContent = fallback || 'Bukti tidak ditemukan'; return; }
            const label = document.createElement('div');
            label.textContent = `${item.name} · ${size(item.size)}`;
            target.appendChild(label);
            const mime = item.type || item.blob.type;
            const url = URL.createObjectURL(item.blob);
            if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = url;
            const media = document.createElement(mime === 'application/pdf' ? 'embed' : 'img');
            media.src = url;
            if (media.tagName === 'EMBED') media.type = 'application/pdf';
            else media.alt = `Preview ${item.name}`;
            target.appendChild(media);
            const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Buka bukti';
            target.appendChild(link);
        } catch (error) { if (target.isConnected) target.textContent = `Bukti tidak dapat dibuka: ${error.message}`; }
    }
    function liveEvidence(input, target) {
        const error = core.validateEvidence(input.files);
        const fieldError = input.closest('.topup-field').querySelector('.topup-error');
        fieldError.textContent = error;
        target.replaceChildren();
        if (activeObjectUrl) { URL.revokeObjectURL(activeObjectUrl); activeObjectUrl = null; }
        if (error || input.files.length !== 1) return;
        const file = input.files[0];
        const label = document.createElement('div'); label.textContent = `${file.name} · ${size(file.size)}`; target.appendChild(label);
        const url = URL.createObjectURL(file); activeObjectUrl = url;
        const media = document.createElement(file.type === 'application/pdf' ? 'embed' : 'img');
        media.src = url;
        if (media.tagName === 'EMBED') media.type = 'application/pdf'; else media.alt = `Preview ${file.name}`;
        target.appendChild(media);
        const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Buka bukti';
        target.appendChild(link);
    }

    function baseContext(tx) { return `<div class="topup-context"><div class="topup-field"><span class="topup-label">Kode transaksi</span><div class="topup-value">${escape(tx.id)}</div></div><div class="topup-field"><span class="topup-label">Dealer</span><div class="topup-value">${escape(tx.dealerName)}<br>${escape(tx.dealerEmail)}</div></div></div>`; }
    function txDetail(id) {
        const state = core.getState(), tx = state.transactions.find(t => t.id === id);
        if (!tx) return;
        const adjustment = latest(state, id, 'adjustment'), topup = latest(state, id, 'topup');
        const opening = state.dealers[tx.dealerId]?.openingBalance ?? 0;
        const balance = state.dealers[tx.dealerId]?.balance ?? 0;
        let html = `${baseContext(tx)}<div class="topup-readonly-list">${row('Nominal efektif (read-only)', money(tx.effectiveAmount))}${row('Nominal referensi awal', money(tx.originalAmount))}${row('Status topup', tx.status)}${row('Request Adjustment', adjustment ? `${status(adjustment.status)} · ${adjustment.id}` : 'Belum ada')}${row('Request Approve', topup ? `${status(topup.status)} · ${topup.id}` : 'Belum ada')}${row('Saldo demo dealer', `${money(balance)} (awal ${money(opening)})`)}</div>`;
        if (adjustment?.status === 'pending') html += '<p class="topup-notice">Adjustment menunggu keputusan L3. Setelah keputusan, L1 dapat memeriksa nominal dan mengajukan approval transaksi ke L2.</p>';
        const actor = account(state);
        let buttons = '';
        if (actor?.canRequest && tx.status !== 'Sukses') {
            buttons += `<button type="button" class="topup-button secondary" data-topup-edit="${escape(id)}">Edit nominal</button>`;
            if (adjustment?.status !== 'pending' && topup?.status !== 'pending') buttons += `<button type="button" class="topup-button" data-topup-approve="${escape(id)}">Request Approve</button>`;
        }
        const body = openDialog(`Detail Payin ${id}`, html + actions(buttons));
        bindClose(body);
        body.querySelector('[data-topup-edit]')?.addEventListener('click', () => editForm(id, { origin: 'detail', transactionId: id, scrollTop: dialog().scrollTop, focus: '[data-topup-edit]' }));
        body.querySelector('[data-topup-approve]')?.addEventListener('click', () => topupForm(id, { origin: 'detail', transactionId: id, scrollTop: dialog().scrollTop, focus: '[data-topup-approve]' }));
    }

    function editForm(id, context = { origin: 'list', transactionId: id }) {
        const state = core.getState(), tx = state.transactions.find(t => t.id === id);
        if (!tx) return;
        formContext = context;
        const body = openDialog(`Request Edit · ${id}`, `${baseContext(tx)}<form class="topup-form" id="topup-edit-form" novalidate><div class="topup-field"><span class="topup-label">Nominal awal (read-only)</span><div class="topup-value">${money(tx.effectiveAmount)}</div></div><div class="topup-field"><label for="topup-proposed">Nominal usulan (Rp) <span aria-hidden="true">*</span></label><input id="topup-proposed" type="text" inputmode="numeric" autocomplete="off" aria-describedby="topup-proposed-error"><span class="topup-error" id="topup-proposed-error"></span></div><div class="topup-field"><label for="topup-reason">Alasan (opsional)</label><textarea id="topup-reason" maxlength="256" aria-describedby="topup-reason-count topup-reason-error"></textarea><span class="topup-counter" id="topup-reason-count">0 / 255</span><span class="topup-error" id="topup-reason-error"></span></div><div class="topup-field"><label for="topup-edit-file">Bukti mutasi baru <span aria-hidden="true">*</span></label><input id="topup-edit-file" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" aria-describedby="topup-edit-file-error"><span class="topup-help">Tepat satu JPG, JPEG, PNG, atau PDF; maksimal 15 MB.</span><span class="topup-error" id="topup-edit-file-error"></span><div class="topup-preview" id="topup-edit-preview" hidden></div></div>${actions('<button class="topup-button" type="submit">Request Edit</button>')}</form>`);
        body.querySelector('[data-topup-close]').textContent = 'Batal';
        body.querySelector('[data-topup-close]').addEventListener('click', cancelForm);
        const form = $('topup-edit-form'), amount = $('topup-proposed'), reason = $('topup-reason'), file = $('topup-edit-file'), preview = $('topup-edit-preview');
        amount.focus();
        reason.addEventListener('input', () => { $('topup-reason-count').textContent = `${reason.value.length} / 255`; $('topup-reason-error').textContent = reason.value.length > 255 ? 'Alasan maksimal 255 karakter.' : ''; });
        file.addEventListener('change', () => { preview.hidden = file.files.length !== 1; liveEvidence(file, preview); });
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const raw = amount.value.trim();
            const validAmount = /^\d+(?:\.\d+)?$/.test(raw) && Number(raw) >= 1 && Number.isFinite(Number(raw));
            $('topup-proposed-error').textContent = validAmount ? '' : 'Nominal wajib angka minimal Rp1.';
            $('topup-reason-error').textContent = reason.value.length <= 255 ? '' : 'Alasan maksimal 255 karakter.';
            $('topup-edit-file-error').textContent = core.validateEvidence(file.files);
            if (!validAmount || reason.value.length > 255 || $('topup-edit-file-error').textContent) return;
            const serial = startSubmitting(body);
            try {
                const evidence = await core.saveEvidence(file.files[0]);
                if (serial !== dialogSerial || !dialog().open) return;
                core.submitAdjustment({ transactionId: id, proposedAmount: raw, reason: reason.value, evidenceId: evidence.id });
                result(`Request Edit untuk ${id} berhasil diajukan. Nominal efektif tetap ${money(tx.effectiveAmount)} sampai L3 menyetujui.`, 'Request Edit terkirim');
            } catch (error) { if (serial === dialogSerial) { message(body, error.message); stopSubmitting(body, 'Request Edit'); } }
        });
    }
    function topupForm(id, context = { origin: 'list', transactionId: id }) {
        const state = core.getState(), tx = state.transactions.find(t => t.id === id);
        if (!tx) return;
        formContext = context;
        const body = openDialog(`Request Approve · ${id}`, `${baseContext(tx)}<form class="topup-form" id="topup-approval-form" novalidate><div class="topup-field"><span class="topup-label">Nominal efektif (read-only)</span><div class="topup-value">${money(tx.effectiveAmount)}</div></div><div class="topup-field"><label for="topup-approval-file">Bukti mutasi untuk L2 <span aria-hidden="true">*</span></label><input id="topup-approval-file" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" aria-describedby="topup-approval-file-error"><span class="topup-help">Unggah bukti baru untuk request ini. Bukti adjustment tidak terisi otomatis.</span><span class="topup-error" id="topup-approval-file-error"></span><div class="topup-preview" id="topup-approval-preview" hidden></div></div>${actions('<button type="submit" class="topup-button">Request Approve</button>')}</form>`);
        body.querySelector('[data-topup-close]').textContent = 'Batal';
        body.querySelector('[data-topup-close]').addEventListener('click', cancelForm);
        const form = $('topup-approval-form'), file = $('topup-approval-file'), preview = $('topup-approval-preview');
        file.addEventListener('change', () => { preview.hidden = file.files.length !== 1; liveEvidence(file, preview); });
        form.addEventListener('submit', async e => {
            e.preventDefault();
            $('topup-approval-file-error').textContent = core.validateEvidence(file.files);
            if ($('topup-approval-file-error').textContent) return;
            const serial = startSubmitting(body);
            try {
                const evidence = await core.saveEvidence(file.files[0]);
                if (serial !== dialogSerial || !dialog().open) return;
                core.submitTopup({ transactionId: id, evidenceId: evidence.id });
                result(`Request Approve untuk ${id} berhasil diajukan ke L2. Status topup dan saldo dealer belum berubah.`, 'Request Approve terkirim');
            } catch (error) { if (serial === dialogSerial) { message(body, error.message); stopSubmitting(body, 'Request Approve'); } }
        });
    }
    function result(text, title) { formContext = null; formSubmitting = false; const body = openDialog(title, `<p class="topup-success">${escape(text)}</p>${actions()}`); bindClose(body); }

    function openRequest(id) {
        formContext = null;
        const state = core.getState(), req = state.requests.find(r => r.id === id);
        if (!req) return;
        const tx = state.transactions.find(t => t.id === req.transactionId);
        const actor = account(state);
        const selfAdjustment = req.kind === 'adjustment' && String(actor?.id) === String(req.requester?.id);
        const allowed = req.status === 'pending' && !!actor && !selfAdjustment && (req.kind === 'adjustment' ? actor.requestAdjustment : actor.topupManual);
        let html = `${baseContext(tx)}<div class="topup-readonly-list">${row('ID request', req.id)}${row('Jenis', req.kind === 'adjustment' ? 'Request Adjustment' : 'Request Approve')}${row('Status request', status(req.status))}${row('Pengaju', `${req.requester?.name || '-'} · ${req.requester?.email || '-'}`)}${row('Waktu pengajuan', dateTime(req.createdAt))}${row('Reviewer', req.reviewer ? `${req.reviewer.name} · ${req.reviewer.email}` : '-')}${row('Waktu keputusan', dateTime(req.decidedAt))}</div>`;
        if (req.kind === 'adjustment') html += `<div class="topup-amount-pair"><div><span class="topup-label">Nominal awal</span><strong>${money(req.originalAmount)}</strong></div><div><span class="topup-label">Nominal pengajuan</span><strong>${money(req.proposedAmount)}</strong></div></div><div class="topup-readonly-list">${row('Alasan', req.reason || '-')}</div>`;
        else html += `<div class="topup-readonly-list">${row('Nominal yang diajukan', money(req.amount))}${row('Status topup', tx.status)}</div>`;
        html += `<div class="topup-field"><span class="topup-label">Bukti mutasi request ini</span><div class="topup-preview" id="topup-request-evidence"></div></div>`;
        if (req.status === 'pending' && !allowed) html += `<p class="topup-notice">${selfAdjustment ? 'Pengaju tidak dapat memutuskan Request Adjustment miliknya sendiri.' : 'Akun ini tidak memiliki permission untuk keputusan request ini.'}</p>`;
        const body = openDialog(`Detail ${req.kind === 'adjustment' ? 'Request Adjustment' : 'Topup'} · ${id}`, html + actions(allowed ? '<button type="button" class="topup-button danger" data-topup-decision="rejected">Reject</button><button type="button" class="topup-button" data-topup-decision="approved">Approve</button>' : ''));
        bindClose(body);
        showEvidence($('topup-request-evidence'), req.evidenceId);
        body.querySelectorAll('[data-topup-decision]').forEach(button => button.addEventListener('click', () => {
            try { core.decide(id, button.dataset.topupDecision); openRequest(id); }
            catch (error) { message(body, error.message); }
        }));
    }
    function openLog(id) {
        formContext = null;
        const state = core.getState(), log = state.logs.find(l => String(l.id) === String(id));
        if (!log) return;
        const request = state.requests.find(r => r.id === log.requestId);
        const tx = state.transactions.find(t => t.id === log.transactionId);
        const html = `<div class="topup-readonly-list">${row('Aktivitas', log.event || log.type || '-')}${row('Keputusan', log.decision || '-')}${row('Kode transaksi', log.transactionId)}${row('ID request', log.requestId)}${row('Dealer', `${log.dealerName || tx?.dealerName || '-'} · ${log.dealerEmail || tx?.dealerEmail || '-'}`)}${row('Nominal sebelum', money(log.beforeAmount))}${row('Nominal sesudah', money(log.afterAmount))}${row('Nominal usulan', log.proposedAmount == null ? '-' : money(log.proposedAmount))}${row('Alasan', log.reason || '-')}${row('Bukti', log.evidence?.name || request?.evidence?.name || '-')}${row('Pengaju', log.requester ? `${log.requester.name} · ${log.requester.email}` : request?.requester ? `${request.requester.name} · ${request.requester.email}` : '-')}${row('Reviewer', log.reviewer ? `${log.reviewer.name} · ${log.reviewer.email}` : '-')}${row('Waktu', dateTime(log.timestamp || log.createdAt))}</div><div class="topup-field"><span class="topup-label">Preview bukti request</span><div class="topup-preview" id="topup-log-evidence"></div></div>${actions()}`;
        const body = openDialog(`Audit topup · ${id}`, html); bindClose(body);
        showEvidence($('topup-log-evidence'), log.evidenceId || request?.evidenceId);
    }

    function filteredTransactions(state) {
        return state.transactions.filter(tx => {
            const adjustment = latest(state, tx.id, 'adjustment');
            if (filters.status && tx.status !== filters.status) return false;
            if (filters.vendor && filters.vendor !== 'Biller Gateway') return false;
            if (filters.adjustment && (adjustment?.status || 'none') !== filters.adjustment) return false;
            const haystack = [tx.id, tx.dealerName, tx.dealerEmail, tx.status, tx.effectiveAmount, 'Biller Gateway'].join(' ').toLowerCase();
            return !search || haystack.includes(search);
        });
    }
    function closeActionMenu() {
        if (!activeMenu) return;
        const { button, panel } = activeMenu;
        activeMenu = null;
        if (panel.hidePopover && panel.matches(':popover-open')) panel.hidePopover();
        panel.hidden = true;
        panel.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
    }
    function openActionMenu(button) {
        closeActionMenu();
        const panel = button.parentElement.querySelector('.topup-action-menu');
        const rect = button.getBoundingClientRect(), width = 180, height = 122;
        panel.style.left = `${Math.max(8, Math.min(rect.right - width, innerWidth - width - 8))}px`;
        panel.style.top = `${rect.bottom + height + 8 > innerHeight ? Math.max(8, rect.top - height - 5) : rect.bottom + 5}px`;
        panel.hidden = false;
        panel.classList.add('is-open');
        if (panel.showPopover) panel.showPopover();
        activeMenu = { button, panel };
        button.setAttribute('aria-expanded', 'true');
    }
    function renderPayin() {
        const tbody = $('topup-table-body'); if (!tbody) return;
        closeActionMenu();
        const state = core.getState();
        const rows = filteredTransactions(state);
        const pages = Math.max(1, Math.ceil(rows.length / 10)); page = Math.min(page, pages);
        const start = (page - 1) * 10;
        tbody.innerHTML = rows.length ? rows.slice(start, start + 10).map((tx, index) => { const blocked = tx.status === 'Sukses' || !account(state)?.canRequest || state.requests.some(r => r.transactionId === tx.id && r.status === 'pending'); return `<tr><td>${start + index + 1}</td><td>${escape(tx.id)}</td><td>Biller Gateway</td><td>${dateTime(tx.createdAt)}</td><td>Topup Dealer</td><td>${escape(tx.dealerName)}<br><small>${escape(tx.dealerEmail)}</small></td><td>${money(tx.effectiveAmount)}</td><td><span class="topup-table-status ${tx.status === 'Sukses' ? 'sukses' : ''}">${escape(tx.status)}</span></td><td class="topup-action"><button type="button" class="btn-action" data-topup-menu="${escape(tx.id)}" aria-expanded="false">Action <i class="fas fa-chevron-down"></i></button><div class="topup-action-menu" popover="auto" hidden><button type="button" data-topup-detail="${escape(tx.id)}">Detail</button><button type="button" data-topup-edit="${escape(tx.id)}" ${blocked ? 'disabled' : ''}>Edit</button><button type="button" data-topup-approve="${escape(tx.id)}" ${blocked ? 'disabled' : ''}>Request Approve</button></div></td></tr>`; }).join('') : '<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:36px">No Data</td></tr>';
        tbody.querySelectorAll('.topup-action-menu').forEach(panel => panel.addEventListener('toggle', () => {
            if (!panel.matches(':popover-open')) {
                panel.hidden = true;
                panel.classList.remove('is-open');
                panel.parentElement.querySelector('[data-topup-menu]').setAttribute('aria-expanded', 'false');
                if (activeMenu?.panel === panel) activeMenu = null;
            }
        }));
        $('topup-page-info').textContent = `${rows.length ? start + 1 : 0} - ${Math.min(start + 10, rows.length)} of ${rows.length}`;
        $('topup-prev').disabled = page === 1; $('topup-next').disabled = page === pages;
        $('topup-page-buttons').innerHTML = Array.from({ length: pages }, (_, i) => `<button type="button" class="page-btn ${page === i + 1 ? 'active' : ''}" data-topup-page="${i + 1}">${i + 1}</button>`).join('');
    }
    function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
    function exportPayin() {
        const rows = filteredTransactions(core.getState());
        const csv = [['Id Referensi', 'Vendor', 'Tanggal', 'Kategori', 'Dealer', 'Email', 'Nominal', 'Status'], ...rows.map(t => [t.id, 'Biller Gateway', dateTime(t.createdAt), 'Topup Dealer', t.dealerName, t.dealerEmail, t.effectiveAmount, t.status])].map(row => row.map(csvCell).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = 'paydia-payin-topup-demo.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    function setupPayin() {
        if (!$('topup-table-body')) return;
        renderPayin();
        $('topup-filter-btn').addEventListener('click', () => { $('topup-filter-panel').hidden = !$('topup-filter-panel').hidden; });
        $('topup-apply-filters').addEventListener('click', () => { filters = { status: $('topup-filter-status').value, adjustment: $('topup-filter-adjustment').value, vendor: $('topup-filter-vendor').value }; page = 1; $('topup-filter-panel').hidden = true; renderPayin(); });
        const applySearch = () => { search = $('topup-search-input').value.trim().toLowerCase(); page = 1; renderPayin(); };
        $('topup-search-btn').addEventListener('click', applySearch);
        $('topup-search-input').addEventListener('keydown', e => { if (e.key === 'Enter') applySearch(); });
        $('topup-reset-filters').addEventListener('click', () => { search = ''; filters = { status: '', adjustment: '', vendor: '' }; page = 1; $('topup-search-input').value = ''; ['topup-filter-status', 'topup-filter-adjustment', 'topup-filter-vendor'].forEach(id => $(id).value = ''); renderPayin(); });
        $('topup-export-btn').addEventListener('click', exportPayin);
        $('topup-prev').addEventListener('click', () => { if (page > 1) { page--; renderPayin(); } });
        $('topup-next').addEventListener('click', () => { page++; renderPayin(); });
        $('topup-page-buttons').addEventListener('click', e => { const btn = e.target.closest('[data-topup-page]'); if (btn) { page = Number(btn.dataset.topupPage); renderPayin(); } });
        $('topup-table-body').addEventListener('click', e => {
            const menu = e.target.closest('[data-topup-menu]');
            if (menu) {
                if (activeMenu?.button === menu) closeActionMenu();
                else openActionMenu(menu);
                return;
            }
            const btn = e.target.closest('[data-topup-detail],[data-topup-edit],[data-topup-approve]');
            if (!btn || btn.disabled) return;
            const action = activeMenu?.button || [...$('topup-table-body').querySelectorAll('[data-topup-menu]')].find(button => button.dataset.topupMenu === (btn.dataset.topupDetail || btn.dataset.topupEdit || btn.dataset.topupApprove));
            if (action) {
                const wrapper = $('topup-table').closest('.table-wrapper');
                pendingDialogOpener = { button: action, transactionId: action.dataset.topupMenu, scroll: { x: window.scrollX, y: window.scrollY, tableLeft: wrapper.scrollLeft, tableTop: wrapper.scrollTop } };
            }
            closeActionMenu();
            if (btn.dataset.topupDetail) txDetail(btn.dataset.topupDetail);
            if (btn.dataset.topupEdit) editForm(btn.dataset.topupEdit);
            if (btn.dataset.topupApprove) topupForm(btn.dataset.topupApprove);
        });
        document.addEventListener('click', e => { if (activeMenu && !e.target.closest('.topup-action-menu,[data-topup-menu]')) closeActionMenu(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeActionMenu(); });
        window.addEventListener('resize', closeActionMenu);
        window.addEventListener('scroll', closeActionMenu, true);
    }
    function renderDemo() {
        const panel = $('topup-demo'); if (!panel) return;
        const state = core.getState(), current = account(state);
        const selector = $('topup-demo-account');
        selector.innerHTML = state.accounts.map(a => `<option value="${escape(a.id)}" ${String(a.id) === String(state.activeAccountId) ? 'selected' : ''}>${escape(a.name)} · ${escape(a.email)}</option>`).join('');
        $('topup-demo-rights').textContent = `Akun: ${current?.name || '-'} · Request: ${current?.canRequest ? 'Ya' : 'Tidak'} · Request Adjustment: ${current?.requestAdjustment ? 'Ya' : 'Tidak'} · Topup Manual (L2): ${current?.topupManual ? 'Ya' : 'Tidak'}`;
        $('topup-demo-fail').checked = !!state.telegramFail;
        $('topup-demo-balances').textContent = Object.entries(state.dealers).map(([id, d]) => `${d.name || id}: ${money(d.balance)} (awal ${money(d.openingBalance)})`).join(' · ');
        $('topup-demo-notifications').innerHTML = state.notifications.slice().reverse().map(n => `<div class="topup-demo-message ${n.status === 'failed' || n.deliveryStatus === 'failed' ? 'failed' : ''}"><strong>${escape(n.status || n.deliveryStatus || '')}</strong><br>${escape(n.text || n.message || '')}</div>`).join('') || '<span>Belum ada notifikasi.</span>';
    }
    function setupDemo() {
        const anchor = document.querySelector('.main-content') || document.querySelector('main'); if (!anchor) return;
        const panel = document.createElement('details'); panel.id = 'topup-demo'; panel.className = 'topup-demo';
        panel.innerHTML = `<summary>Simulasi Topup Dealer · akun, saldo, Telegram</summary><div class="topup-demo-body"><div class="topup-demo-controls"><label for="topup-demo-account">Akun aktif<select id="topup-demo-account"></select></label><label><span>Simulasikan kegagalan Telegram</span><input type="checkbox" id="topup-demo-fail"></label><button type="button" id="topup-demo-reset">Reset simulasi topup</button></div><div id="topup-demo-rights"></div><div><strong>Saldo dealer:</strong> <span id="topup-demo-balances"></span></div><details><summary>Preview Telegram</summary><div class="topup-demo-messages" id="topup-demo-notifications"></div></details><small>Kontrol ini hanya untuk review mockup. Tidak mengirim pesan Telegram atau memindahkan uang.</small></div>`;
        anchor.appendChild(panel);
        renderDemo();
        $('topup-demo-account').addEventListener('change', e => core.setActiveAccount(e.target.value));
        $('topup-demo-fail').addEventListener('change', e => core.setTelegramFail(e.target.checked));
        $('topup-demo-reset').addEventListener('click', async e => {
            const button = e.currentTarget;
            if (!button.dataset.confirm) { button.dataset.confirm = 'true'; button.textContent = 'Klik lagi untuk reset data topup'; return; }
            button.disabled = true;
            try { await core.resetDemo(); closeActionMenu(); closeDialog(true); button.textContent = 'Reset simulasi topup'; delete button.dataset.confirm; }
            catch (error) { button.textContent = error.message; }
            finally { button.disabled = false; }
        });
    }
    function setupDialog() { dialog(); }
    document.addEventListener('DOMContentLoaded', () => {
        setupDialog(); setupPayin(); setupDemo();
        window.addEventListener('paydia-topup-change', () => { renderPayin(); renderDemo(); });
    });
    window.PaydiaTopupUI = { escape, openRequest, openLog, openTransaction: txDetail };
})();
