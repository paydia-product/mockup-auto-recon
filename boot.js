// Shared mock-data bootstrap. ONE source of truth for the cache-busting version so
// pages never drift and wipe each other's localStorage on navigation.
// Bump MOCK_VERSION whenever seed data changes.
(function () {
    var MOCK_VERSION = 'v14';
    if (localStorage.getItem('mock_version') !== MOCK_VERSION) {
        ['paydia_recon_trx', 'paydia_disputes', 'paydia_logs', 'paydia_settlements',
            'paydia_approvals', 'paydia_mock_perms', 'paydia_status_overrides', 'paydia_rrn_notes']
            .forEach(function (k) { localStorage.removeItem(k); });
        localStorage.setItem('mock_version', MOCK_VERSION);
    }
})();
