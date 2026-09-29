/* Local simulation only. All business metadata lives under one isolated key. */
(function (root) {
    'use strict';

    const KEY = 'paydia_topup_authorization_v1';
    const DB_NAME = 'paydia_topup_evidence_v1';
    const STORE = 'evidence';
    const LIMIT = 15 * 1024 * 1024;
    const memory = new Map();
    const storage = root.localStorage || {
        getItem: key => memory.has(key) ? memory.get(key) : null,
        setItem: (key, value) => memory.set(key, value),
        removeItem: key => memory.delete(key)
    };
    const copy = value => JSON.parse(JSON.stringify(value));
    const pad = n => String(n).padStart(2, '0');
    const stamp = date => {
        const d = new Date(date);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const listStamp = value => {
        const s = stamp(value);
        return `${s.slice(8, 10)}-${s.slice(5, 7)}-${s.slice(0, 4)} ${s.slice(11)}`;
    };
    const money = value => `Rp${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 20 })}`;
    const now = () => new Date().toISOString();
    const actor = account => ({ id: account.id, name: account.name, email: account.email });
    function seedPdf(lines) {
        const escaped = lines.map(line => String(line).replace(/[\\()]/g, '\\$&'));
        const content = `BT /F1 12 Tf 50 750 Td ${escaped.map((line, index) => `${index ? '0 -22 Td ' : ''}(${line}) Tj`).join(' ')} ET`;
        const objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
        ];
        let pdf = '%PDF-1.4\n';
        const offsets = [0];
        objects.forEach((object, index) => {
            offsets.push(pdf.length);
            pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        });
        const xref = pdf.length;
        pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
        offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
        pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
        return new root.Blob([pdf], { type: 'application/pdf' });
    }
    const emit = () => {
        if (typeof root.dispatchEvent === 'function' && typeof root.Event === 'function') {
            root.dispatchEvent(new root.Event('paydia-topup-change'));
        }
    };

    function seed() {
        const accounts = [
            { id: 3, name: 'Dion', email: 'dion@paydia.id', canRequest: true, requestAdjustment: false, topupManual: false },
            { id: 6, name: 'izarlvl2', email: 'izar@gmail.com', canRequest: false, requestAdjustment: false, topupManual: true },
            { id: 4, name: 'King Kenny 1', email: 'kenny@paydia.id', canRequest: false, requestAdjustment: true, topupManual: false },
            { id: 7, name: 'Izar', email: 'izar@paydia.id', canRequest: false, requestAdjustment: false, topupManual: false },
            { id: 8, name: 'BlackVolk', email: 'blackvolk@paydia.id', canRequest: true, requestAdjustment: true, topupManual: false }
        ];
        const dealers = {
            'dealer-a': { id: 'dealer-a', name: 'Dealer Nusantara', email: 'finance@dealernusantara.id', openingBalance: 10000000, balance: 10000000 },
            'dealer-b': { id: 'dealer-b', name: 'Dealer Sentosa', email: 'ops@dealersentosa.id', openingBalance: 5000000, balance: 5000000 }
        };
        const state = {
            accounts, activeAccountId: 3, dealers, transactions: [], requests: [], logs: [],
            notifications: [], evidence: {}, telegramFail: false, nextRequest: 12, nextLog: 97001
        };
        const amounts = [1000000, 1000123, 1000123, 1000123, 1000123, 750000, 1200123, 900000, 800000, 1000123, 600000];
        amounts.forEach((amount, index) => {
            const n = index + 1;
            const dealer = dealers[n % 2 ? 'dealer-a' : 'dealer-b'];
            state.transactions.push({
                id: `TOPUP-${String(n).padStart(3, '0')}`, dealerId: dealer.id,
                dealerName: dealer.name, dealerEmail: dealer.email,
                createdAt: `2026-09-${pad(10 + n)}T09:00:00+07:00`,
                originalAmount: amount, effectiveAmount: amount, status: 'Proses',
                credited: false, creditedAmount: 0, vendor: 'Biller Gateway', category: 'Topup Dealer'
            });
        });
        const dion = actor(accounts[0]);
        const l2 = actor(accounts[1]);
        const l3 = actor(accounts[2]);
        const black = actor(accounts[4]);
        const add = (number, kind, status, requester, reviewer, proposed, failure) => {
            const tx = state.transactions[number - 1];
            const id = `TOPUP-REQ-${String(number).padStart(3, '0')}${kind === 'adjustment' ? '-A' : '-T'}`;
            const evidenceId = `topup-seed-${String(number).padStart(3, '0')}-${kind}`;
            const createdAt = `2026-09-${pad(10 + number)}T${number === 7 && kind === 'topup' ? '12' : '10'}:00:00+07:00`;
            const decidedAt = status === 'pending' ? null : `2026-09-${pad(10 + number)}T11:00:00+07:00`;
            const seedLines = [
                'SIMULASI - BUKAN BUKTI BANK',
                `Tahap: ${kind === 'adjustment' ? 'Request Edit' : 'Request Approve'}`,
                `Transaksi: ${tx.id}`,
                `Dealer: ${tx.dealerName}`,
                `Email: ${tx.dealerEmail}`,
                `Nominal referensi: ${money(tx.effectiveAmount)}`,
                ...(kind === 'adjustment' ? [`Nominal usulan: ${money(proposed)}`] : []),
                `Tanggal: ${stamp(createdAt)}`
            ];
            state.evidence[evidenceId] = {
                id: evidenceId, name: `simulasi-mutasi-${tx.id}-${kind}.pdf`,
                size: seedPdf(seedLines).size, type: 'application/pdf',
                requestId: id, seeded: true, seedLines
            };
            const request = {
                id, transactionId: tx.id, kind, status: 'pending',
                originalAmount: tx.effectiveAmount,
                proposedAmount: kind === 'adjustment' ? proposed : null,
                amount: kind === 'topup' ? tx.effectiveAmount : null,
                reason: kind === 'adjustment' ? 'Nominal transfer berbeda dari referensi' : '',
                evidenceId, evidence: copy(state.evidence[evidenceId]),
                requester, createdAt, reviewer: null, decidedAt: null,
                dealerName: tx.dealerName, dealerEmail: tx.dealerEmail
            };
            state.requests.push(request);
            record(state, request, tx, kind === 'adjustment' ? 'Request Edit' : 'Request Approve', requester, createdAt, tx.effectiveAmount, tx.effectiveAmount, false);
            if (status !== 'pending') {
                const before = tx.effectiveAmount;
                request.status = status;
                request.reviewer = reviewer;
                request.decidedAt = decidedAt;
                if (kind === 'adjustment' && status === 'approved') tx.effectiveAmount = proposed;
                if (kind === 'topup' && status === 'approved') {
                    tx.status = 'Sukses';
                    tx.credited = true;
                    tx.creditedAmount = request.amount;
                    state.dealers[tx.dealerId].balance += request.amount;
                }
                const event = `${status === 'approved' ? 'Approve' : 'Reject'} ${kind === 'adjustment' ? 'Edit' : 'Topup'}`;
                record(state, request, tx, event, reviewer, decidedAt, before, tx.effectiveAmount, !!failure);
            }
            return request;
        };
        add(3, 'adjustment', 'pending', dion, null, 1000000);
        add(4, 'adjustment', 'approved', dion, l3, 1000000);
        add(5, 'adjustment', 'rejected', dion, l3, 1000000);
        add(6, 'topup', 'pending', dion);
        add(7, 'adjustment', 'approved', dion, l3, 1200000);
        add(7, 'topup', 'pending', dion);
        add(8, 'topup', 'approved', dion, l2);
        add(9, 'topup', 'rejected', dion, l2);
        add(10, 'adjustment', 'pending', black, null, 1000000);
        add(11, 'topup', 'approved', dion, l2, null, true);
        return state;
    }

    function adjustedAmounts(state, request) {
        const previous = state.requests.filter(r => r.transactionId === request.transactionId && r.kind === 'adjustment' && r.createdAt <= request.createdAt).at(-1);
        return previous ? [
            `Nominal Awal: ${money(previous.originalAmount)}`,
            `Nominal Pengajuan: ${money(previous.proposedAmount)}`,
            `Status Adjustment: ${previous.status === 'approved' ? 'Disetujui' : 'Ditolak'}`
        ] : [];
    }

    function message(state, request, tx, event, time) {
        const title = event === 'Request Approve' ? `📝${event}` : request.kind === 'topup' ? `⚠️${event}` : event;
        const lines = [title, `Nama Dealer: ${request.dealerName}`, `Email: ${request.dealerEmail}`];
        if (request.kind === 'adjustment') {
            lines.push(`Nominal Awal: ${money(request.originalAmount)}`, `Nominal Pengajuan: ${money(request.proposedAmount)}`);
        } else {
            lines.push(`Nominal: ${money(request.amount)}`);
            if (event !== 'Request Approve') lines.push(...adjustedAmounts(state, request));
        }
        lines.push(`Requestor: ${request.requester.name}`);
        if (request.reviewer) lines.push(`Reviewer: ${request.reviewer.name}`);
        lines.push(`🕐${stamp(time)}`);
        return lines.join('\n');
    }

    function record(state, request, tx, event, actionActor, time, beforeAmount, afterAmount, fail) {
        const id = state.nextLog++;
        const base = {
            id, event, type: event, requestId: request.id, transactionId: tx.id,
            dealerId: tx.dealerId, dealerName: request.dealerName, dealerEmail: request.dealerEmail,
            kind: request.kind, decision: request.status, actor: copy(actionActor),
            requester: copy(request.requester), reviewer: request.reviewer ? copy(request.reviewer) : null,
            originalAmount: request.originalAmount, proposedAmount: request.proposedAmount,
            amount: request.amount, beforeAmount, afterAmount, reason: request.reason,
            evidenceId: request.evidenceId, evidence: copy(request.evidence), timestamp: time
        };
        state.logs.push(base);
        const text = message(state, request, tx, event, time);
        state.notifications.push({
            id: `TOPUP-NOTIF-${id}`, event, requestId: request.id, transactionId: tx.id,
            text, timestamp: time, status: fail ? 'failed' : 'sent',
            deliveryStatus: fail ? 'failed' : 'sent',
            failureDetail: fail ? 'Simulasi pengiriman Telegram gagal' : ''
        });
        if (fail) state.logs.push({ ...base, id: state.nextLog++, event: 'Telegram Failure', type: 'Telegram Failure', notificationId: `TOPUP-NOTIF-${id}` });
    }

    function read() {
        const raw = storage.getItem(KEY);
        if (raw !== null) return JSON.parse(raw);
        const initial = seed();
        storage.setItem(KEY, JSON.stringify(initial));
        return initial;
    }

    function mutate(change) {
        const draft = read();
        const result = change(draft);
        storage.setItem(KEY, JSON.stringify(draft)); // Storage failure leaves the live record unchanged.
        emit();
        return result === undefined ? getState() : copy(result);
    }

    function getState() { return copy(read()); }
    function current(state) {
        const account = state.accounts.find(a => String(a.id) === String(state.activeAccountId));
        if (!account) throw new Error('Akun simulasi tidak ditemukan.');
        return account;
    }
    function transaction(state, id) {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) throw new Error('Transaksi topup tidak ditemukan.');
        return tx;
    }
    function pending(state, id) {
        return state.requests.some(r => r.transactionId === id && r.status === 'pending');
    }
    function requireRequester(state) {
        const account = current(state);
        if (!account.canRequest) throw new Error('Akun ini tidak memiliki akses mengajukan topup dealer.');
        return account;
    }
    function requireOpen(state, tx) {
        if (tx.status === 'Sukses' || tx.credited) throw new Error('Topup sudah sukses dan tidak dapat diproses lagi.');
        if (pending(state, tx.id)) throw new Error('Masih ada request menunggu keputusan untuk transaksi ini.');
    }
    function requireEvidence(state, evidenceId) {
        const evidence = state.evidence[evidenceId];
        if (!evidence || evidence.requestId) throw new Error('Unggah satu bukti baru untuk request ini.');
        return evidence;
    }
    function submit(kind, input) {
        return mutate(state => {
            const account = requireRequester(state);
            const tx = transaction(state, input && input.transactionId);
            requireOpen(state, tx);
            const evidence = requireEvidence(state, input && input.evidenceId);
            let proposedAmount = null;
            let reason = '';
            if (kind === 'adjustment') {
                const raw = String(input.proposedAmount ?? '').trim();
                if (!/^\d+(?:\.\d+)?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) < 1) {
                    throw new Error('Nominal usulan harus angka minimal Rp1.');
                }
                proposedAmount = Number(raw);
                reason = String(input.reason ?? '');
                if (reason.length > 255) throw new Error('Alasan maksimal 255 karakter.');
            }
            const id = `TOPUP-REQ-${String(state.nextRequest++).padStart(3, '0')}`;
            const time = now();
            evidence.requestId = id;
            const request = {
                id, transactionId: tx.id, kind, status: 'pending',
                originalAmount: tx.effectiveAmount, proposedAmount,
                amount: kind === 'topup' ? tx.effectiveAmount : null, reason,
                evidenceId: evidence.id, evidence: copy(evidence),
                requester: actor(account), createdAt: time, reviewer: null, decidedAt: null,
                dealerName: tx.dealerName, dealerEmail: tx.dealerEmail
            };
            state.requests.push(request);
            record(state, request, tx, kind === 'adjustment' ? 'Request Edit' : 'Request Approve', actor(account), time, tx.effectiveAmount, tx.effectiveAmount, state.telegramFail);
            return request;
        });
    }
    function submitAdjustment(input) { return submit('adjustment', input); }
    function submitTopup(input) { return submit('topup', input); }

    function decide(requestId, decision) {
        return mutate(state => {
            if (decision !== 'approved' && decision !== 'rejected') throw new Error('Keputusan tidak valid.');
            const request = state.requests.find(r => r.id === requestId);
            if (!request) throw new Error('Request tidak ditemukan.');
            if (request.status !== 'pending') throw new Error('Request ini sudah diputuskan.');
            const account = current(state);
            if (request.kind === 'adjustment') {
                if (!account.requestAdjustment) throw new Error('Permission Request Adjustment diperlukan.');
                if (String(request.requester.id) === String(account.id)) throw new Error('Pengaju tidak boleh memutuskan request miliknya sendiri.');
            } else if (!account.topupManual) {
                throw new Error('Permission Topup Manual diperlukan.');
            }
            const tx = transaction(state, request.transactionId);
            if (tx.status === 'Sukses' || tx.credited) throw new Error('Topup sudah sukses.');
            const before = tx.effectiveAmount;
            if (request.kind === 'topup' && request.amount !== before) throw new Error('Nominal transaksi berubah sejak request diajukan.');
            const time = now();
            request.status = decision;
            request.reviewer = actor(account);
            request.decidedAt = time;
            if (decision === 'approved' && request.kind === 'adjustment') tx.effectiveAmount = request.proposedAmount;
            if (decision === 'approved' && request.kind === 'topup') {
                tx.status = 'Sukses';
                tx.credited = true;
                tx.creditedAmount = request.amount;
                state.dealers[tx.dealerId].balance += request.amount;
            }
            const event = `${decision === 'approved' ? 'Approve' : 'Reject'} ${request.kind === 'adjustment' ? 'Edit' : 'Topup'}`;
            record(state, request, tx, event, actor(account), time, before, tx.effectiveAmount, state.telegramFail);
            return request;
        });
    }

    function setActiveAccount(id) {
        return mutate(state => {
            if (!state.accounts.some(a => String(a.id) === String(id))) throw new Error('Akun simulasi tidak ditemukan.');
            state.activeAccountId = Number(id);
        });
    }
    function setAccountPermissions(account, patch) {
        return mutate(state => {
            if (!account || account.id == null) throw new Error('Identitas akun wajib ada.');
            if (!patch || Object.keys(patch).some(key => !['requestAdjustment', 'topupManual'].includes(key))) throw new Error('Permission tidak valid.');
            let saved = state.accounts.find(a => String(a.id) === String(account.id));
            if (!saved) {
                if (!account.name && !account.nama) throw new Error('Nama akun wajib ada.');
                saved = { id: Number(account.id), name: String(account.name || account.nama), email: String(account.email || ''), canRequest: false, requestAdjustment: false, topupManual: false };
                state.accounts.push(saved);
            }
            if (account.name || account.nama) saved.name = String(account.name || account.nama);
            if (account.email) saved.email = String(account.email);
            for (const key of ['requestAdjustment', 'topupManual']) {
                if (Object.hasOwn(patch, key)) saved[key] = !!patch[key];
            }
            return saved;
        });
    }
    function setTelegramFail(value) {
        return mutate(state => { state.telegramFail = !!value; });
    }

    function validateEvidence(files) {
        const list = files ? Array.from(files) : [];
        if (list.length !== 1) return 'Unggah tepat satu file JPG, JPEG, PNG, atau PDF.';
        const file = list[0];
        const extension = String(file.name || '').split('.').pop().toLowerCase();
        const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' };
        if (!types[extension] || (file.type && file.type.toLowerCase() !== types[extension])) return 'Format bukti harus JPG, JPEG, PNG, atau PDF.';
        if (!Number.isFinite(file.size) || file.size < 0 || file.size > LIMIT) return 'Ukuran bukti maksimal 15 MB.';
        return '';
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            if (!root.indexedDB) return reject(new Error('IndexedDB tidak tersedia untuk menyimpan bukti.'));
            const request = root.indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Gagal membuka penyimpanan bukti.'));
        });
    }
    async function evidenceAction(mode, value) {
        const adapter = root.__paydiaTopupEvidenceAdapter;
        if (adapter) return adapter[mode](value);
        const db = await openDb();
        try {
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, mode === 'get' ? 'readonly' : 'readwrite');
                const store = tx.objectStore(STORE);
                const request = mode === 'put' ? store.put(value) : store.get(value);
                let result;
                request.onsuccess = () => { result = request.result; };
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan bukti.'));
                tx.onabort = () => reject(tx.error || new Error('Penyimpanan bukti dibatalkan.'));
            });
        } finally { db.close(); }
    }
    async function saveEvidence(file) {
        const error = validateEvidence([file]);
        if (error) throw new Error(error);
        const id = `topup-evidence-${root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
        const metadata = { id, name: file.name, size: file.size, type: file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' })[file.name.split('.').pop().toLowerCase()], requestId: null };
        await evidenceAction('put', { ...metadata, blob: file });
        mutate(state => { state.evidence[id] = metadata; });
        return copy(metadata);
    }
    async function getEvidence(id) {
        const metadata = read().evidence[id];
        if (!metadata) throw new Error('Bukti tidak ditemukan.');
        let saved = await evidenceAction('get', id);
        if (!saved && metadata.seeded) {
            saved = { ...metadata, blob: seedPdf(metadata.seedLines) };
            await evidenceAction('put', saved);
        }
        if (!saved || !saved.blob) throw new Error('File bukti tidak tersedia.');
        return { id, name: metadata.name, size: metadata.size, type: metadata.type, blob: saved.blob };
    }
    async function resetDemo() {
        // Persist the replacement first: a quota failure must leave the old evidence intact.
        storage.setItem(KEY, JSON.stringify(seed()));
        emit();
        const adapter = root.__paydiaTopupEvidenceAdapter;
        if (adapter) await adapter.clear();
        else {
            const db = await openDb();
            try {
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readwrite');
                    tx.objectStore(STORE).clear();
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error || new Error('Gagal mereset bukti.'));
                    tx.onabort = () => reject(tx.error || new Error('Reset bukti dibatalkan.'));
                });
            } finally { db.close(); }
        }
        return getState();
    }
    function approvalRows() {
        return read().requests.map(request => ({
            id: request.id, tanggal: listStamp(request.createdAt),
            account: `${request.dealerEmail}\n${request.dealerName}\n${request.transactionId}`,
            admin: request.requester.name,
            tipeRequest: request.kind === 'adjustment' ? 'Request Adjustment' : 'Ubah Status Top Up Pengguna',
            status: request.status === 'pending' ? 'Pending' : request.status === 'approved' ? 'Approved' : 'Rejected',
            topupRequestId: request.id
        }));
    }
    function logRows() {
        return read().logs.map(log => ({
            id: log.id, tanggal: listStamp(log.timestamp), container: 'paydia-topup', type: log.type,
            detail: `transaksi : ${log.transactionId}\nrequest : ${log.requestId}\naktivitas : ${log.event}`,
            ip: 'Simulasi', topupLogId: log.id
        }));
    }

    const api = { getState, setActiveAccount, setAccountPermissions, setTelegramFail, submitAdjustment, submitTopup, decide, validateEvidence, saveEvidence, getEvidence, resetDemo, approvalRows, logRows };
    root.PaydiaTopup = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
