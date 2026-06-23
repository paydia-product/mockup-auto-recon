const fs = require('fs');

const updatedExcelFn = `
window.showExcelSimulationModal = function(data, tabName) {
    let overlay = document.getElementById('excelSimulationOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'excelSimulationOverlay';
        document.body.appendChild(overlay);
    }
    
    // Determine columns dynamically
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

    if (!isMatched) {
        cols.push({ key: 'tipeUnmatch', label: 'Tipe Unmatch / Match' });
    }
    if (!isDecline && !isDispute) {
        cols.push({ key: 'flagging', label: 'Flagging Status' });
    }
    cols.push({ key: 'domestic', label: 'Domestic / Crossborder' });
    if (isDispute) {
        cols.push({ key: 'disputeRef', label: 'Dispute Ref' });
    }
    if (isUnmatched || isDispute) {
        cols.push({ key: 'catatan', label: 'Catatan' });
    }

    const theadHTML = cols.map(c => \`<th style="padding: 6px 12px; border: 1px solid #c8c6c4; text-align: left; font-weight: 600; color: #323130;">\${c.label}</th>\`).join('');

    let trsHTML = '';
    if (!data || data.length === 0) {
        trsHTML = \`<tr><td colspan="\${cols.length}" style="padding: 12px; text-align: center; color: #666;">Tidak ada data untuk diexport.</td></tr>\`;
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

            let vals = {
                no: i + 1,
                idTx: t.id || '-',
                rrn: t.refNo || t.rrn || '-',
                paydiaDate: t.date || '-',
                swDate: t.date ? t.date.substring(0, 10) : '-',
                swTime: t.switchingTime || (t.date ? t.date.substring(11) : '-'),
                merchantId: 'M' + (t.refNo ? t.refNo.substring(0, 8) : '00000000') + 'ID',
                merchantName: t.merchantName || '-',
                customerData: ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay'][hash % 5] + ' - ' + ['Budi Santoso', 'Andi Wijaya', 'Siti Rahma', 'Dewi Lestari', 'Rian Hidayat', 'Mega Wati', 'Joni Pratama'][hash % 7],
                customerPan: '936008******' + (1000 + (hash % 9000)),
                acquirerId: '93600' + (100 + (hash % 900)),
                issuerName: ['BCA', 'Bank Mandiri', 'BRI', 'BNI', 'Bank Danamon', 'CIMB Niaga'][hash % 6],
                terminalId: 'TID-' + (10000 + (hash % 90000)),
                rcSwitching: t.rcSwitching || t.rc || '-',
                rcPaydia: t.rcPaydia || t.rc || '-',
                switchingName: t.switching || '-',
                tipeUnmatch: t.label || t.statusRekon || '-',
                flagging: t.flaggingStatus || '-',
                domestic: t.domestic || '-',
                disputeRef: t.disputeRef || '-',
                catatan: t.catatan || '-'
            };

            let nominalTx = t.nominalTx !== undefined ? t.nominalTx : t.nominal;
            let nominalTip = t.nominalTip !== undefined ? t.nominalTip : Math.floor(t.nominal * 0.05);
            let nominalMdr = t.nominalMdr !== undefined ? t.nominalMdr : Math.floor(t.nominal * 0.007);
            let nominalTotal = nominalTx - nominalTip - nominalMdr;

            vals.nominalTx = nominalTx;
            vals.nominalTip = nominalTip;
            vals.nominalMdr = nominalMdr;
            vals.nominalTotal = nominalTotal;

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

            let tds = cols.map(c => \`<td style="padding: 6px 12px; border: 1px solid #e1dfdd; color: #323130;">\${vals[c.key]}</td>\`).join('');
            trsHTML += \`<tr>\${tds}</tr>\`;
        });
    }

    overlay.innerHTML = \`
        <div class="modal" style="max-width: 95%; width: 1200px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div class="modal-header" style="background: #107c41; color: white; padding: 12px 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <h2 class="modal-title" style="color: white; margin: 0; font-size: 1.1rem; font-weight: 600;"><i class="fas fa-file-excel" style="margin-right: 8px;"></i> Excel Export Simulation - <span id="excelTabName">\${tabName || 'Exported Data'}</span></h2>
                <button class="modal-close" id="excelSimClose" aria-label="Tutup" style="color: white; background: transparent; border: none; font-size: 1.2rem; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="flex: 1; overflow: auto; padding: 0; background: #f3f2f1;">
                <table style="width: 100%; border-collapse: collapse; font-family: 'Calibri', sans-serif; font-size: 0.85rem; white-space: nowrap; background: white;">
                    <thead style="position: sticky; top: 0; z-index: 10;">
                        <tr style="background: #f3f2f1; border-bottom: 2px solid #c8c6c4;">
                            \${theadHTML}
                        </tr>
                    </thead>
                    <tbody id="excelSimTbody">
                        \${trsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    \`;

    document.getElementById('excelSimClose').addEventListener('click', () => {
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    });

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
};
`;

const jsFiles = ['app.js', 'issuer.js', 'qris-mpm.js'];
jsFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // We just append the updated function to the end. Since it's a global window property, it overwrites the previous definition.
    content += '\n\n' + updatedExcelFn;
    fs.writeFileSync(f, content, 'utf8');
});
console.log('done updating excel modal logic');
