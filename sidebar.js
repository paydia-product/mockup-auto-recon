/* ===================================================
   Paydia Bisnis – Shared Sidebar (single source of truth)
   ----------------------------------------------------
   Every page used to hardcode its own copy of the sidebar
   HTML *and* re-wire it in its own JS. That duplication is
   why menu items kept going missing on some pages and why
   the toggles broke on new pages.

   This file renders ONE canonical sidebar into <aside id="sidebar">
   and wires all its behaviour. Loaded on every page. To add a
   menu item or a new page, edit ONLY this file.

   It runs on window.load (after each page's own JS) and replaces
   #sidebar's contents, so it deterministically overrides any
   stale per-page markup/listeners — no need to touch page JS.
   =================================================== */
(function () {
    var NAV = `
        <div class="sidebar-header">
            <div class="logo"><span class="logo-text">paydia</span></div>
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar"><i class="fas fa-bars"></i></button>
        </div>
        <div class="sidebar-user">
            <div class="user-avatar"><img src="https://ui-avatars.com/api/?name=Dion&background=4f46e5&color=fff&size=40" alt="User Avatar"></div>
            <div class="user-info"><span class="user-name">Dion</span><span class="user-email">dion@paydia.id</span></div>
        </div>
        <div class="sidebar-label">Paydia Bisnis</div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item" id="nav-merchant"><i class="fas fa-store"></i><span>Merchant</span></a>
            <div class="nav-group" id="nav-settlement-group">
                <a href="#" class="nav-item has-submenu" id="nav-settlement">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>Settlement <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
                    <i class="fas fa-chevron-down submenu-arrow"></i>
                </a>
                <div class="submenu">
                    <a href="settle-recon.html" class="submenu-item" id="nav-settle-recon">
                        <i class="fas fa-handshake"></i><span>Settle &amp; Recon</span><span class="sidebar-badge-dot"></span>
                    </a>
                    <a href="auto-settlement.html" class="submenu-item" id="nav-auto-settlement">
                        <i class="fas fa-money-bill-transfer"></i><span>Auto Settlement QRIS</span><span class="sidebar-badge-dot"></span>
                    </a>
                </div>
            </div>
            <a href="approval.html" class="nav-item" id="nav-approval">
                <i class="fas fa-check-circle"></i>
                <span>Approval <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
            </a>
            <a href="admin.html" class="nav-item" id="nav-admin">
                <i class="fas fa-user-shield"></i>
                <span>Admin <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
            </a>
            <div class="nav-group" id="nav-reconcile-group">
                <a href="#" class="nav-item has-submenu" id="nav-reconcile">
                    <i class="fas fa-check-double"></i>
                    <span>Reconcile <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
                    <i class="fas fa-chevron-down submenu-arrow"></i>
                </a>
                <div class="submenu">
                    <a href="index.html" class="submenu-item" id="nav-qris-acquirer"><i class="fas fa-download"></i><span>QRIS Acquirer</span><span class="sidebar-badge-dot"></span></a>
                    <a href="issuer.html" class="submenu-item" id="nav-qris-issuer"><i class="fas fa-upload"></i><span>QRIS Issuer <i class="fas fa-hourglass-half" style="color:#6366f1; margin-left:6px; font-size:0.78rem;" title="Dikerjakan Next Phase"></i></span><span class="sidebar-badge-dot"></span></a>
                </div>
            </div>
            <a href="#" class="nav-item" id="nav-vendor"><i class="fas fa-truck"></i><span>Vendor</span></a>
            <a href="#" class="nav-item" id="nav-product"><i class="fas fa-box"></i><span>Product</span></a>
            <a href="#" class="nav-item has-submenu" id="nav-marketing"><i class="fas fa-bullhorn"></i><span>Marketing</span><i class="fas fa-chevron-down submenu-arrow"></i></a>
            <a href="#" class="nav-item" id="nav-bank-account"><i class="fas fa-university"></i><span>Bank Account</span></a>
            <a href="#" class="nav-item" id="nav-kasbon"><i class="fas fa-hand-holding-usd"></i><span>Kasbon</span></a>
            <a href="#" class="nav-item has-submenu" id="nav-virtual-account"><i class="fas fa-credit-card"></i><span>Virtual Account</span><i class="fas fa-chevron-down submenu-arrow"></i></a>
            <div class="nav-group">
                <a href="#" class="nav-item has-submenu" id="nav-transaction">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Transaction <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
                    <i class="fas fa-chevron-down submenu-arrow"></i>
                </a>
                <div class="submenu">
                    <a href="#" class="submenu-item" id="nav-trx-payin"><i class="fas fa-arrow-down"></i><span>Payin</span></a>
                    <a href="#" class="submenu-item" id="nav-trx-payout"><i class="fas fa-arrow-up"></i><span>Payout</span></a>
                    <a href="qris-mpm.html" class="submenu-item" id="nav-trx-qris-mpm"><i class="fas fa-th"></i><span>QRIS MPM <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span></a>
                    <a href="#" class="submenu-item" id="nav-trx-qris-cpm"><i class="fas fa-th-large"></i><span>QRIS CPM</span></a>
                    <a href="transaksi.html" class="submenu-item" id="nav-trx-app-users"><i class="fas fa-user"></i><span>App Users</span></a>
                    <a href="#" class="submenu-item" id="nav-trx-topup-manual"><i class="fas fa-download"></i><span>Topup Manual</span></a>
                    <a href="#" class="submenu-item" id="nav-trx-auto-reporting"><i class="fas fa-file-alt"></i><span>Auto Reporting</span></a>
                </div>
            </div>
            <a href="#" class="nav-item" id="nav-schedule"><i class="fas fa-calendar-alt"></i><span>Schedule</span></a>
            <a href="log.html" class="nav-item" id="nav-log">
                <i class="fas fa-clipboard-list"></i>
                <span>Log <i class="fas fa-hammer" style="color:#f59e0b; margin-left:6px; font-size:0.8rem;" title="Butuh Pengerjaan"></i></span>
            </a>
            <a href="#" class="nav-item has-submenu" id="nav-recap"><i class="fas fa-chart-bar"></i><span>Recap</span><i class="fas fa-chevron-down submenu-arrow"></i></a>
            <a href="#" class="nav-item has-submenu" id="nav-settings"><i class="fas fa-cog"></i><span>Settings</span><i class="fas fa-chevron-down submenu-arrow"></i></a>
        </nav>`;

    function fileOf(href) { return (href || '').split('/').pop().split('?')[0].split('#')[0].toLowerCase(); }

    function currentFile() {
        var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (!f.includes('.')) f += '.html'; // clean-URL hosts strip the extension
        return f;
    }

    function markActive(sb) {
        var cur = currentFile();
        var links = sb.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
            var a = links[i];
            if (fileOf(a.getAttribute('href')) !== cur) continue;
            a.classList.add('active');
            var group = a.closest('.nav-group');
            if (group) {
                group.classList.add('open');
                var sub = group.querySelector('.submenu');
                if (sub) sub.classList.add('open');
                var parent = group.querySelector('.nav-item.has-submenu');
                if (parent) {
                    parent.classList.add('active-parent');
                    var arrow = parent.querySelector('.submenu-arrow');
                    if (arrow) { arrow.classList.remove('fa-chevron-down'); arrow.classList.add('fa-chevron-up'); }
                }
            }
            break;
        }
    }

    function wire(sb) {
        // Collapse/close button inside the sidebar header (mobile close).
        var sidebarToggle = sb.querySelector('#sidebarToggle');
        var overlay = document.getElementById('sidebarOverlay');
        var mobileToggle = document.getElementById('mobileToggle');

        function closeMobile() { sb.classList.remove('open'); if (overlay) overlay.classList.remove('show'); }
        function openMobile() { sb.classList.add('open'); if (overlay) overlay.classList.add('show'); }

        if (sidebarToggle) sidebarToggle.addEventListener('click', closeMobile);
        if (overlay) overlay.addEventListener('click', closeMobile);   // idempotent w/ any page-JS handler (both just remove)
        if (mobileToggle) mobileToggle.addEventListener('click', openMobile); // idempotent (both just add)

        // Submenu expand/collapse. These are fresh nodes, so only THIS handler is bound.
        sb.querySelectorAll('.nav-item.has-submenu').forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                var group = item.closest('.nav-group');
                if (!group) return; // standalone has-submenu (Marketing/VA/Recap/Settings): no panel in this mock
                var submenu = group.querySelector('.submenu');
                var arrow = item.querySelector('.submenu-arrow');
                var open = group.classList.toggle('open');
                if (submenu) submenu.classList.toggle('open', open);
                if (arrow) { arrow.classList.toggle('fa-chevron-up', open); arrow.classList.toggle('fa-chevron-down', !open); }
            });
        });
    }

    function render() {
        var sb = document.getElementById('sidebar');
        if (!sb) return null;
        sb.innerHTML = NAV;
        markActive(sb);
        return sb;
    }

    // Render early to avoid a flash of stale markup...
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();

    // ...then take authoritative ownership on load (after each page's own JS has
    // wired the old nodes). Re-rendering discards those listeners; we bind ours once.
    window.addEventListener('load', function () {
        if (window.__paydiaSidebarWired) return;
        var sb = render();
        if (!sb) return;
        wire(sb);
        window.__paydiaSidebarWired = true;
    });
})();
