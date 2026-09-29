const assert = require('node:assert/strict');

const values = new Map();
let failWrite = false;
global.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => {
        if (failWrite) throw new Error('Quota exceeded');
        values.set(key, value);
    }
};
const blobs = new Map();
global.__paydiaTopupEvidenceAdapter = {
    put: value => { blobs.set(value.id, value); },
    get: id => blobs.get(id),
    clear: () => blobs.clear()
};
const topup = require('./topup-state.js');
const file = (name = 'mutasi.pdf', size = 100, type = 'application/pdf') => {
    const blob = new Blob([new Uint8Array(size)], { type });
    Object.defineProperty(blob, 'name', { value: name });
    return blob;
};

async function demo() {
    const seeded = topup.getState();
    assert.equal(seeded.transactions.length, 11);
    assert.equal(seeded.transactions.find(t => t.id === 'TOPUP-004').effectiveAmount, 1000000);
    assert.equal(seeded.transactions.find(t => t.id === 'TOPUP-004').status, 'Proses');
    assert.equal(seeded.transactions.find(t => t.id === 'TOPUP-008').creditedAmount, 900000);
    const seventhAdjustment = seeded.requests.find(r => r.transactionId === 'TOPUP-007' && r.kind === 'adjustment');
    const seventhTopup = seeded.requests.find(r => r.transactionId === 'TOPUP-007' && r.kind === 'topup');
    assert.ok(Date.parse(seventhTopup.createdAt) > Date.parse(seventhAdjustment.decidedAt));
    for (const dealer of Object.values(seeded.dealers)) {
        const credits = seeded.transactions.filter(t => t.dealerId === dealer.id).reduce((sum, t) => sum + t.creditedAmount, 0);
        assert.equal(dealer.balance, dealer.openingBalance + credits);
    }
    const seedEvidence = await topup.getEvidence('topup-seed-007-adjustment');
    assert.equal(seedEvidence.type, 'application/pdf');
    assert.match(await seedEvidence.blob.text(), /SIMULASI - BUKAN BUKTI BANK/);
    assert.match(await seedEvidence.blob.text(), /TOPUP-007/);

    assert.match(topup.validateEvidence([]), /tepat satu/);
    assert.match(topup.validateEvidence([file(), file()]), /tepat satu/);
    assert.match(topup.validateEvidence([file('x.txt', 1, 'text/plain')]), /Format/);
    assert.equal(topup.validateEvidence([file('x.JPG', 15 * 1024 * 1024, 'image/jpeg')]), '');
    assert.match(topup.validateEvidence([file('x.jpg', 15 * 1024 * 1024 + 1, 'image/jpeg')]), /15 MB/);

    const pendingL3 = 'TOPUP-REQ-003-A';
    topup.setActiveAccount(7);
    assert.throws(() => topup.decide(pendingL3, 'approved'), /Permission/);
    assert.throws(() => topup.decide(pendingL3, 'rejected'), /Permission/);
    topup.setAccountPermissions({ id: 3 }, { requestAdjustment: true });
    topup.setAccountPermissions({ id: 3, name: 'Dion Baru', email: 'dion-baru@paydia.id' }, {});
    assert.equal(topup.getState().accounts.find(a => a.id === 3).name, 'Dion Baru');
    assert.equal(topup.getState().accounts.find(a => a.id === 3).canRequest, true);
    assert.equal(topup.getState().requests.find(r => r.id === pendingL3).requester.name, 'Dion');
    topup.setActiveAccount(3);
    assert.throws(() => topup.decide(pendingL3, 'approved'), /Pengaju/);
    assert.throws(() => topup.decide(pendingL3, 'rejected'), /Pengaju/);
    topup.setActiveAccount(8);
    assert.throws(() => topup.decide('TOPUP-REQ-010-A', 'approved'), /Pengaju/);
    assert.throws(() => topup.decide('TOPUP-REQ-010-A', 'rejected'), /Pengaju/);
    topup.setActiveAccount(4);
    topup.setAccountPermissions({ id: 4 }, { requestAdjustment: false });
    assert.throws(() => topup.decide(pendingL3, 'approved'), /Permission/);
    topup.setAccountPermissions({ id: 4 }, { requestAdjustment: true });
    const beforeL3 = topup.getState().dealers['dealer-a'].balance;
    topup.decide(pendingL3, 'approved');
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-003').effectiveAmount, 1000000);
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-003').status, 'Proses');
    assert.equal(topup.getState().dealers['dealer-a'].balance, beforeL3);
    assert.throws(() => topup.decide(pendingL3, 'approved'), /sudah diputuskan/);
    const rejectBefore = topup.getState().transactions.find(t => t.id === 'TOPUP-010').effectiveAmount;
    topup.decide('TOPUP-REQ-010-A', 'rejected');
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-010').effectiveAmount, rejectBefore);
    assert.equal(topup.getState().logs.at(-1).afterAmount, rejectBefore);

    topup.setActiveAccount(3);
    const editEvidence = await topup.saveEvidence(file('edit.pdf'));
    const beforeInvalid = topup.getState();
    for (const bad of ['', 'abc', '0', '-1']) {
        assert.throws(() => topup.submitAdjustment({ transactionId: 'TOPUP-002', proposedAmount: bad, evidenceId: editEvidence.id }), /Nominal/);
    }
    assert.throws(() => topup.submitAdjustment({ transactionId: 'TOPUP-002', proposedAmount: 1, reason: 'x'.repeat(256), evidenceId: editEvidence.id }), /255/);
    assert.equal(topup.getState().requests.length, beforeInvalid.requests.length);
    assert.equal(topup.getState().notifications.length, beforeInvalid.notifications.length);

    // A failed metadata write cannot publish a request, log, notification, or evidence binding.
    failWrite = true;
    assert.throws(() => topup.submitAdjustment({ transactionId: 'TOPUP-002', proposedAmount: 1, evidenceId: editEvidence.id }), /Quota exceeded/);
    failWrite = false;
    assert.deepEqual(topup.getState(), beforeInvalid);
    const adjustment = topup.submitAdjustment({ transactionId: 'TOPUP-002', proposedAmount: 1, reason: 'x'.repeat(255), evidenceId: editEvidence.id });
    assert.equal(adjustment.proposedAmount, 1);
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-002').effectiveAmount, 1000123);
    topup.setActiveAccount(4);
    topup.decide(adjustment.id, 'approved');
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-002').effectiveAmount, 1);
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-002').status, 'Proses');

    topup.setActiveAccount(3);
    assert.throws(() => topup.submitTopup({ transactionId: 'TOPUP-002', evidenceId: editEvidence.id }), /bukti baru/);
    const l2Evidence = await topup.saveEvidence(file('mutasi-l2.pdf'));
    const topupRequest = topup.submitTopup({ transactionId: 'TOPUP-002', evidenceId: l2Evidence.id });
    assert.notEqual(topupRequest.evidenceId, adjustment.evidenceId);
    assert.equal(topupRequest.amount, 1);
    topup.setActiveAccount(6);
    topup.setAccountPermissions({ id: 6 }, { topupManual: false });
    assert.throws(() => topup.decide(topupRequest.id, 'approved'), /Topup Manual/);
    topup.setAccountPermissions({ id: 6 }, { topupManual: true });
    const balanceBefore = topup.getState().dealers['dealer-b'].balance;
    topup.setTelegramFail(true);
    topup.decide(topupRequest.id, 'approved');
    const after = topup.getState();
    assert.equal(after.dealers['dealer-b'].balance, balanceBefore + 1);
    assert.equal(after.transactions.find(t => t.id === 'TOPUP-002').creditedAmount, 1);
    assert.equal(after.notifications.at(-1).status, 'failed');
    assert.match(after.notifications.at(-1).text, /Nominal Awal:/);
    assert.equal(after.logs.at(-1).event, 'Telegram Failure');
    assert.throws(() => topup.decide(topupRequest.id, 'approved'), /sudah diputuskan/);
    assert.equal(topup.getState().dealers['dealer-b'].balance, balanceBefore + 1);
    assert.throws(() => topup.submitTopup({ transactionId: 'TOPUP-002', evidenceId: l2Evidence.id }), /akses|sukses|bukti baru/);

    topup.setTelegramFail(false);
    topup.setActiveAccount(3);
    const rejectedHistoryEvidence = await topup.saveEvidence(file('l2-after-rejected-adjustment.pdf'));
    const afterRejectedAdjustment = topup.submitTopup({ transactionId: 'TOPUP-005', evidenceId: rejectedHistoryEvidence.id });
    topup.setActiveAccount(6);
    topup.decide(afterRejectedAdjustment.id, 'approved');
    const rejectedHistoryMessage = topup.getState().notifications.at(-1).text;
    assert.match(rejectedHistoryMessage, /Nominal Awal: Rp1\.000\.123/);
    assert.match(rejectedHistoryMessage, /Nominal Pengajuan: Rp1\.000\.000/);
    assert.match(rejectedHistoryMessage, /Status Adjustment: Ditolak/);
    assert.equal(topup.getState().transactions.find(t => t.id === 'TOPUP-005').effectiveAmount, 1000123);

    topup.setActiveAccount(3);
    const decimalEvidence = await topup.saveEvidence(file('decimal.pdf'));
    const decimalRequest = topup.submitAdjustment({ transactionId: 'TOPUP-001', proposedAmount: '1.0001', evidenceId: decimalEvidence.id });
    assert.equal(decimalRequest.proposedAmount, 1.0001);
    assert.match(topup.getState().notifications.at(-1).text, /Nominal Pengajuan: Rp1,0001/);

    const snapshot = topup.getState();
    const logCount = snapshot.logs.length;
    snapshot.transactions[0].effectiveAmount = 99;
    snapshot.logs.pop();
    assert.equal(topup.getState().transactions[0].effectiveAmount, 1000000);
    assert.equal(topup.getState().logs.length, logCount);
    values.set('paydia_logs', 'legacy-kept');
    const beforeFailedReset = topup.getState();
    failWrite = true;
    await assert.rejects(() => topup.resetDemo(), /Quota exceeded/);
    failWrite = false;
    assert.deepEqual(topup.getState(), beforeFailedReset);
    assert.equal((await topup.getEvidence(editEvidence.id)).blob.size, 100);
    await topup.resetDemo();
    assert.equal(values.get('paydia_logs'), 'legacy-kept');
    assert.equal(topup.getState().requests.length, seeded.requests.length);
    assert.equal(blobs.size, 0);

    const headerRoutes = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'vercel.json'), 'utf8')).headers;
    assert.equal(headerRoutes[0].headers.find(header => header.key === 'X-Frame-Options').value, 'DENY');
    const oldCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://ui-avatars.com; connect-src 'self'; frame-ancestors 'none';";
    const topupCsp = oldCsp.replace('img-src \'self\' data: https://ui-avatars.com;', "img-src 'self' data: https://ui-avatars.com blob:; object-src 'self' blob:; frame-src 'self' blob:;");
    assert.deepEqual(headerRoutes.filter(route => route.headers.some(header => header.key === 'Content-Security-Policy')).map(route => route.source), [
        '/((?!payin\\.html$|approval\\.html$|log\\.html$).*)', '/payin.html', '/approval.html', '/log.html'
    ]);
    const matches = (source, path) => source === '/(.*)' ? true : source.startsWith('/((') ? new RegExp(`^${source}$`).test(path) : source === path;
    const matched = path => headerRoutes.filter(route => matches(route.source, path)).flatMap(route => route.headers);
    for (const path of ['/payin.html', '/approval.html', '/log.html']) {
        assert.deepEqual(matched(path).filter(header => header.key === 'Content-Security-Policy').map(header => header.value), [topupCsp]);
        assert.match(topupCsp, /img-src[^;]*blob:/);
        assert.match(topupCsp, /object-src 'self' blob:/);
        assert.match(topupCsp, /frame-src 'self' blob:/);
        assert.match(topupCsp, /frame-ancestors 'none'/);
    }
    for (const path of ['/', '/index.html', '/admin.html', '/settle-recon.html', '/auto-settlement.html', '/transaksi.html']) {
        assert.deepEqual(matched(path).filter(header => header.key === 'Content-Security-Policy').map(header => header.value), [oldCsp]);
    }
    for (const path of ['/payin.html', '/approval.html', '/log.html', '/index.html']) {
        assert.deepEqual(matched(path).filter(header => header.key !== 'Content-Security-Policy').map(header => header.key), [
            'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-DNS-Prefetch-Control'
        ]);
    }
    console.log('topup-state checks passed');
}

demo().catch(error => { console.error(error); process.exitCode = 1; });
