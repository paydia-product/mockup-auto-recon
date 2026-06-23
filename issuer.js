


/* ============================================
   Paydia Bisnis – QRIS Auto Reconcile Dashboard
   QRIS Issuer Page Logic
   ============================================ */

// ── Seed Transactions Database ──
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
    { id: 'TX-ACQ-20002', refNo: 'REF-20260527-021', date: '2026-05-27 09:44:32', nominal: 220000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: 'DISP-001' },
    { id: 'TX-ACQ-20003', refNo: 'REF-20260527-022', date: '2026-05-27 10:05:14', nominal: 500000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '68', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20004', refNo: 'REF-20260527-023', date: '2026-05-27 15:30:19', nominal: 180000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '68', rcSwitching: '68', rcPaydia: '68', switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-ACQ-20005', refNo: 'REF-20260527-024', date: '2026-05-27 12:08:33', nominal: 120000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '00', switching: 'Jalin', switchingTime: '12:09:33', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20008', refNo: 'REF-20260527-026', date: '2026-05-27 16:02:09', nominal: 67000, nominalPaydia: 67000, nominalSwitching: 67000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '00', rcPaydia: '00', rcSwitching: '05', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
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
    { id: 'TX-ACQ-20009', refNo: 'REF-20260527-027', date: '2026-05-27 13:21:48', nominal: 90000, nominalPaydia: 90000, nominalSwitching: 90000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '05', rcPaydia: '05', rcSwitching: '00', switching: 'Rintis', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20009', refNo: 'REF-20260527-054', date: '2026-05-27 14:55:12', nominal: 145000, nominalPaydia: 145000, nominalSwitching: 145000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rc: '68', rcPaydia: '68', rcSwitching: '00', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },

    // --- BULK SEED (MID-88901 - Matahari Dept Store, 50 Unmatch entries covering all types) ---
    // Switching-Only RC00: data ONLY in switching (RC00), NO Paydia data → rcPaydia: null
    { id: 'TX-BULK-001', refNo: 'REF-20260519-101', date: '2026-05-19 08:15:00', nominal: 85000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-002', refNo: 'REF-20260519-102', date: '2026-05-19 09:22:00', nominal: 120000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-003', refNo: 'REF-20260519-103', date: '2026-05-19 10:05:00', nominal: 200000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-004', refNo: 'REF-20260519-104', date: '2026-05-19 11:30:00', nominal: 45000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-005', refNo: 'REF-20260519-105', date: '2026-05-19 13:15:00', nominal: 350000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-006', refNo: 'REF-20260520-101', date: '2026-05-20 08:45:00', nominal: 75000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-007', refNo: 'REF-20260520-102', date: '2026-05-20 10:00:00', nominal: 580000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-008', refNo: 'REF-20260520-103', date: '2026-05-20 14:20:00', nominal: 95000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-009', refNo: 'REF-20260521-101', date: '2026-05-21 09:10:00', nominal: 160000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-010', refNo: 'REF-20260521-102', date: '2026-05-21 15:30:00', nominal: 420000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    // Switching-Only RC68: data ONLY in switching (RC68), NO Paydia data → rcPaydia: null
    { id: 'TX-BULK-011', refNo: 'REF-20260519-111', date: '2026-05-19 08:30:00', nominal: 230000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-012', refNo: 'REF-20260519-112', date: '2026-05-19 10:45:00', nominal: 55000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-013', refNo: 'REF-20260519-113', date: '2026-05-19 12:00:00', nominal: 780000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-014', refNo: 'REF-20260519-114', date: '2026-05-19 14:00:00', nominal: 110000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-015', refNo: 'REF-20260520-111', date: '2026-05-20 09:00:00', nominal: 330000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-016', refNo: 'REF-20260520-112', date: '2026-05-20 11:15:00', nominal: 67000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-017', refNo: 'REF-20260520-113', date: '2026-05-20 13:45:00', nominal: 450000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-018', refNo: 'REF-20260521-111', date: '2026-05-21 08:00:00', nominal: 89000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-019', refNo: 'REF-20260521-112', date: '2026-05-21 10:30:00', nominal: 195000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-020', refNo: 'REF-20260521-113', date: '2026-05-21 14:00:00', nominal: 640000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '68', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    // Paydia-Only Success: data ONLY in Paydia (sukses), NO switching data → rcSwitching: null
    { id: 'TX-BULK-021', refNo: 'REF-20260519-121', date: '2026-05-19 08:00:00', nominal: 180000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-022', refNo: 'REF-20260519-122', date: '2026-05-19 10:00:00', nominal: 310000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-023', refNo: 'REF-20260519-123', date: '2026-05-19 11:30:00', nominal: 75000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-024', refNo: 'REF-20260519-124', date: '2026-05-19 14:15:00', nominal: 550000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-025', refNo: 'REF-20260520-121', date: '2026-05-20 09:30:00', nominal: 42000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-026', refNo: 'REF-20260520-122', date: '2026-05-20 11:00:00', nominal: 220000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-027', refNo: 'REF-20260520-123', date: '2026-05-20 13:00:00', nominal: 890000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-028', refNo: 'REF-20260521-121', date: '2026-05-21 08:30:00', nominal: 135000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-029', refNo: 'REF-20260521-122', date: '2026-05-21 10:00:00', nominal: 270000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-030', refNo: 'REF-20260521-123', date: '2026-05-21 14:45:00', nominal: 1500000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    // Double RRN (5 pairs): per pair ONE entry is Matched (the DB Paydia entry), the other stays Unmatched
    { id: 'TX-BULK-031', refNo: 'REF-20260519-131', date: '2026-05-19 09:00:00', nominal: 150000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', switchingTime: '09:01:12', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-032', refNo: 'REF-20260519-131', date: '2026-05-19 09:00:00', nominal: 150000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', switchingTime: '09:01:55', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-033', refNo: 'REF-20260519-132', date: '2026-05-19 12:30:00', nominal: 280000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '00', switching: 'Rintis', switchingTime: '12:30:08', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-034', refNo: 'REF-20260519-132', date: '2026-05-19 12:30:00', nominal: 280000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', switchingTime: '12:30:44', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-035', refNo: 'REF-20260520-131', date: '2026-05-20 10:15:00', nominal: 95000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '00', switching: 'Artajasa', switchingTime: '10:15:22', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-036', refNo: 'REF-20260520-131', date: '2026-05-20 10:15:00', nominal: 95000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Artajasa', switchingTime: '10:16:01', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-037', refNo: 'REF-20260520-132', date: '2026-05-20 15:00:00', nominal: 510000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '00', switching: 'Alto', switchingTime: '15:00:15', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-038', refNo: 'REF-20260520-132', date: '2026-05-20 15:00:00', nominal: 510000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Alto', switchingTime: '15:00:58', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-039', refNo: 'REF-20260521-131', date: '2026-05-21 11:00:00', nominal: 375000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', switchingTime: '11:00:33', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-040', refNo: 'REF-20260521-131', date: '2026-05-21 11:00:00', nominal: 375000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', switchingTime: '11:01:09', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    // Beda Status: DIFFERENT rc on both sides — 041-045 blocked (rcPaydia≠00), 046-050 allowed (rcPaydia=00 after ubah status, rcSwitching≠00)
    { id: 'TX-BULK-041', refNo: 'REF-20260519-141', date: '2026-05-19 09:30:00', nominal: 250000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '05', rcSwitching: '00', nominalPaydia: 250000, nominalSwitching: 250000, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-042', refNo: 'REF-20260519-142', date: '2026-05-19 11:00:00', nominal: 130000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '51', rcSwitching: '00', nominalPaydia: 130000, nominalSwitching: 130000, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-043', refNo: 'REF-20260520-141', date: '2026-05-20 09:45:00', nominal: 670000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '05', rcSwitching: '00', nominalPaydia: 670000, nominalSwitching: 670000, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-044', refNo: 'REF-20260520-142', date: '2026-05-20 12:30:00', nominal: 45000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '51', rcSwitching: '00', nominalPaydia: 45000, nominalSwitching: 45000, switching: 'Alto', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-045', refNo: 'REF-20260521-141', date: '2026-05-21 08:00:00', nominal: 390000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '05', rcSwitching: '00', nominalPaydia: 390000, nominalSwitching: 390000, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-046', refNo: 'REF-20260519-146', date: '2026-05-19 14:30:00', nominal: 180000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 180000, nominalSwitching: 180000, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-047', refNo: 'REF-20260520-146', date: '2026-05-20 10:45:00', nominal: 840000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 840000, nominalSwitching: 840000, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-048', refNo: 'REF-20260520-147', date: '2026-05-20 15:15:00', nominal: 60000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 60000, nominalSwitching: 60000, switching: 'Alto', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-BULK-049', refNo: 'REF-20260521-146', date: '2026-05-21 09:15:00', nominal: 490000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 490000, nominalSwitching: 490000, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-BULK-050', refNo: 'REF-20260521-147', date: '2026-05-21 13:00:00', nominal: 210000, merchantId: 'MID-88901', merchantName: 'Matahari Dept Store', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 210000, nominalSwitching: 210000, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },

    // --- ISSUER DECLINED ---
    { id: 'TX-ISS-30001', refNo: 'REF-20260527-060', date: '2026-05-27 07:44:06', nominal: 18000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '14', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null }
];

const seedLogs = [
    { id: 9145, tanggal: '28-05-2026 15:01:39', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9144, tanggal: '28-05-2026 15:00:31', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '36.75.6.222' },
    { id: 9143, tanggal: '28-05-2026 14:57:42', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9142, tanggal: '28-05-2026 14:42:06', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : dion@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9141, tanggal: '28-05-2026 14:28:23', container: 'paydia-account', type: 'merchant-login', detail: 'email : incarnata.maria@pt-mfa.com\nuser.type : merchant', ip: '38.75.8.222' },
    { id: 9140, tanggal: '28-05-2026 11:31:14', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : kenny@paydia.id\nuser.type : admin', ip: '125.161.77.69' },
    { id: 9139, tanggal: '28-05-2026 15:54:41', container: 'paydia-account-admin', type: 'admin-login', detail: 'email : aldy@merchant.id\nuser.type : admin', ip: '103.177.100.34' }
];

// ── State Management ──
let activeSubtab = 'iss-match';
let transactions = [];
let disputes = [];
let reconProcesses = [];
let currentPage = 1;
const perPage = 10;

let permissions = {
    read: true,
    flagging: true,
    inputDispute: true,
    export: true,
    approve: true,
    rerun: true,
    log: true
};

let activeFlaggingTrxId = null;

// ── DOM References ──
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const btnClearAll = document.getElementById('btnClearAll');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const btnRerun = document.getElementById('btnRerun');
const btnApproveSettlement = document.getElementById('btnApproveSettlement');
const progressOverlay = document.getElementById('progressOverlay');
const progressBarFill = document.getElementById('progressBarFill');
const progressStatus = document.getElementById('progressStatus');
const settlementOverlay = document.getElementById('settlementOverlay');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');

// Permissions widget inputs
const permRead = document.getElementById('permRead');
const permFlagging = document.getElementById('permFlagging');
const permInputDispute = document.getElementById('permInputDispute');
const permExport = document.getElementById('permExport');
const permApprove = document.getElementById('permApprove');
const permRerun = document.getElementById('permRerun');
const permLog = document.getElementById('permLog');

// Telegram Alert and Rerun config refs
const rerunConfigOverlay = document.getElementById('rerunConfigOverlay');
const chkSimulateSlow = document.getElementById('chkSimulateSlow');
const telegramAlertCard = document.getElementById('telegramAlertCard');
const telegramAlertClose = document.getElementById('telegramAlertClose');
const telegramAlertBypass = document.getElementById('telegramAlertBypass');
const telegramAlertTime = document.getElementById('telegramAlertTime');

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
    // 1. Read permission overlay
    const mainContent = document.querySelector('.main-content');
    const existingOverlay = document.getElementById('permissionErrorOverlay');
    
    if (!permissions.read) {
        if (!existingOverlay && mainContent) {
            const overlay = document.createElement('div');
            overlay.id = 'permissionErrorOverlay';
            overlay.className = 'permission-error-overlay';
            overlay.innerHTML = `
                <div class="permission-error-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2 class="permission-error-title">Akses Rekonsiliasi Dibatasi</h2>
                <p class="permission-error-desc">
                    Akun Anda tidak memiliki izin <strong>Read Reconcile</strong>. Hubungi administrator sistem untuk meminta akses ke modul ini.
                </p>
            `;
            // Keep header but hide children except overlay
            Array.from(mainContent.children).forEach(child => {
                if (child.id !== 'permissionErrorOverlay' && child.className !== 'breadcrumb') {
                    child.style.display = 'none';
                }
            });
            mainContent.appendChild(overlay);
        }
        return;
    } else {
        if (existingOverlay) {
            existingOverlay.remove();
            if (mainContent) {
                Array.from(mainContent.children).forEach(child => {
                    if (child.className !== 'filter-panel' && child.id !== 'progressOverlay' && child.id !== 'settlementOverlay' && child.id !== 'modalOverlay' && child.id !== 'rerunConfigOverlay') {
                        child.style.display = '';
                    }
                });
            }
        }
    }

    // 2. Flagging check is applied dynamically in renderTableData logic

    // 3. Export
    if (exportBtn) {
        exportBtn.style.display = permissions.export ? '' : 'none';
    }
    const exportBankBtn = document.getElementById('exportBankBtn');
    if (exportBankBtn) {
        exportBankBtn.style.display = permissions.export ? '' : 'none';
    }
    
    // 4. Approve
    if (btnApproveSettlement) {
        btnApproveSettlement.style.display = permissions.approve ? '' : 'none';
    }
    
    // 5. Rerun
    if (btnRerun) {
        btnRerun.style.display = permissions.rerun ? '' : 'none';
    }
}

// Action Confirm logic
let currentActionConfirmCallback = null;
function openActionConfirmModal(message, onConfirm) {
    const overlay = document.getElementById('actionConfirmOverlay');
    const msgEl = document.getElementById('actionConfirmMessage');
    const btnCancel = document.getElementById('btnActionCancel');
    const btnConfirm = document.getElementById('btnActionConfirm');
    const btnClose = document.getElementById('actionConfirmClose');

    if (!overlay) return;

    msgEl.innerHTML = message;
    currentActionConfirmCallback = onConfirm;

    overlay.classList.add('show');

    const closeModal = () => {
        overlay.classList.remove('show');
        currentActionConfirmCallback = null;
        btnCancel.removeEventListener('click', closeModal);
        btnClose.removeEventListener('click', closeModal);
        btnConfirm.removeEventListener('click', confirmAction);
    };

    const confirmAction = () => {
        if (currentActionConfirmCallback) currentActionConfirmCallback();
        closeModal();
    };

    btnCancel.addEventListener('click', closeModal);
    btnClose.addEventListener('click', closeModal);
    btnConfirm.addEventListener('click', confirmAction);
}

// ── Initialize Dashboard ──
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    try {
        const startDateInput = document.getElementById('filterStartDate');
        const endDateInput = document.getElementById('filterEndDate');
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = todayStr;
        }
        if (endDateInput && !endDateInput.value) {
            endDateInput.value = todayStr;
        }
    } catch (e) {
        console.error("Error setting default date filter:", e);
    }
    loadPermissions();
    applyPermissions();
    bindEvents();
    renderSummary();
    renderActiveTableWithLoading();
    initMockDataControl();
    try {
        initExportBank();
    } catch (e) {
        console.error("Error in initExportBank:", e);
    }
    try {
        initNotesModal();
    } catch (e) {
        console.error("Error in initNotesModal:", e);
    }
    try {
        initBulkActions();
    } catch (e) {
        console.error("Error in initBulkActions:", e);
    }
});

function adjustDatesToToday(items) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return items.map((item, idx) => {
        const defaultKategori = idx % 2 === 0 ? 'payin-topup' : 'payin-user';
        const updatedItem = { ...item, kategori: item.kategori || defaultKategori };
        if (item.date) {
            updatedItem.date = todayStr + item.date.substring(10);
        }
        return updatedItem;
    });
}

function initDatabase() {
    let populatedVal = localStorage.getItem('paydia_mock_populated');
    if (populatedVal === null) {
        localStorage.setItem('paydia_mock_populated', 'true');
        populatedVal = 'true';
    }
    const isPopulated = populatedVal === 'true';
    if (isPopulated) {
        // Load or initialize transactions
        const savedTrx = localStorage.getItem('paydia_recon_trx');
        if (savedTrx) {
            transactions = JSON.parse(savedTrx);
            // Merge all seed unmatch entries; force-fix Beda Status RCs (definition changed)
            rawTransactions.forEach(seedEntry => {
                if (seedEntry.statusRekon !== 'Unmatched') return;
                const storedIdx = transactions.findIndex(t => t.id === seedEntry.id);
                if (storedIdx === -1) {
                    transactions.push(seedEntry);
                } else {
                    if (seedEntry.label === 'Beda Status Transaksi') {
                        transactions[storedIdx].rcPaydia = seedEntry.rcPaydia;
                        transactions[storedIdx].rcSwitching = seedEntry.rcSwitching;
                        transactions[storedIdx].rc = seedEntry.rc;
                    }
                    if (!transactions[storedIdx].rcPaydia && seedEntry.rcPaydia) transactions[storedIdx].rcPaydia = seedEntry.rcPaydia;
                    if (!transactions[storedIdx].switchingTime && seedEntry.switchingTime) transactions[storedIdx].switchingTime = seedEntry.switchingTime;
                }
            });
        } else {
            transactions = [...rawTransactions];
        }
        transactions = adjustDatesToToday(transactions);
        localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));

        // Load or initialize disputes
        const savedDis = localStorage.getItem('paydia_disputes');
        if (savedDis) {
            disputes = JSON.parse(savedDis);
        } else {
            disputes = [
                { id: 'DISP-001', refId: 'REF-20260527-021', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
                { id: 'DISP-002', refId: 'TX-ISS-20001', date: '2026-05-28 09:44:00', type: 'good faith', switching: 'Rintis', nominal: 89000, status: 'Open', desc: 'Dana menggantung di switching, merchant belum terima dana' }
            ];
        }
        disputes = adjustDatesToToday(disputes);
        localStorage.setItem('paydia_disputes', JSON.stringify(disputes));

        // Load or initialize processes
        const savedProcesses = localStorage.getItem('paydia_recon_processes');
        if (savedProcesses) {
            reconProcesses = JSON.parse(savedProcesses);
        } else {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;

            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const yyyyY = yesterday.getFullYear();
            const mmY = String(yesterday.getMonth() + 1).padStart(2, '0');
            const ddY = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayStr = `${yyyyY}-${mmY}-${ddY}`;

            reconProcesses = [
                { date: todayStr, filename: `qris_recon_${todayStr.replace(/-/g, '')}_latest.csv`, status: 'Gagal', tipe: 'Acquirer' },
                { date: todayStr, filename: `qris_recon_${todayStr.replace(/-/g, '')}_latest.csv`, status: 'Gagal', tipe: 'Issuer' },
                { date: yesterdayStr, filename: `qris_recon_${yesterdayStr.replace(/-/g, '')}_final.csv`, status: 'Sukses', tipe: 'Acquirer' },
                { date: yesterdayStr, filename: `qris_recon_${yesterdayStr.replace(/-/g, '')}_final.csv`, status: 'Sukses', tipe: 'Issuer' }
            ];
            localStorage.setItem('paydia_recon_processes', JSON.stringify(reconProcesses));
        }
    } else {
        transactions = [];
        disputes = [];
        reconProcesses = [];
    }
}

function saveTrxToStorage() {
    localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));
}

// ── Log Helper ──
function writeLog(type, detail) {
    const savedLogs = localStorage.getItem('paydia_logs');
    let logsList = [];
    if (savedLogs) {
        logsList = JSON.parse(savedLogs);
    } else {
        logsList = [...seedLogs];
    }
    
    // Find max ID
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
        container: 'paydia-reconcile',
        type: type,
        detail: detail,
        ip: '125.161.77.69'
    };
    
    logsList.unshift(newLog);
    localStorage.setItem('paydia_logs', JSON.stringify(logsList));
}

// ── Summary Cards Calculations ──
function renderSummary() {
    // Apply local filters dynamically on data subset to display aggregate values
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    
    function formatDateIndo(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const monthNum = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const monthName = months[monthNum - 1] || parts[1];
            return `${day} ${monthName} ${year}`;
        }
        return dateStr;
    }

    // Update active date label
    const activeDateLabel = document.getElementById('activeDateLabel');
    if (activeDateLabel) {
        if (startDateVal && endDateVal) {
            if (startDateVal === endDateVal) {
                activeDateLabel.textContent = formatDateIndo(startDateVal);
            } else {
                activeDateLabel.textContent = `${formatDateIndo(startDateVal)} - ${formatDateIndo(endDateVal)}`;
            }
        } else if (startDateVal) {
            activeDateLabel.textContent = `Mulai ${formatDateIndo(startDateVal)}`;
        } else if (endDateVal) {
            activeDateLabel.textContent = `Hingga ${formatDateIndo(endDateVal)}`;
        } else {
            activeDateLabel.textContent = 'Semua Tanggal';
        }
    }

    const switchingVal = document.getElementById('filterVendor').value;

    let filtered = transactions.filter(t => {
        if (t.tipe !== 'Issuer') return false;
        const tDate = t.date.substring(0, 10);
        if (startDateVal && tDate < startDateVal) return false;
        if (endDateVal && tDate > endDateVal) return false;
        if (switchingVal && t.switching !== switchingVal) return false;
        return true;
    });
    window.currentExportData = filtered;

    const totalTrx = filtered.length;
    const matched = filtered.filter(t => t.statusRekon === 'Matched').length;
    const unmatched = filtered.filter(t => t.statusRekon === 'Unmatched').length;
    const onHold = filtered.filter(t => t.flaggingStatus === 'On-Hold').length;
    
    // Disputes filtered
    let filteredDisputes = disputes.filter(d => {
        const dDate = d.date.substring(0, 10);
        if (startDateVal && dDate < startDateVal) return false;
        if (endDateVal && dDate > endDateVal) return false;
        if (switchingVal && d.switching !== switchingVal) return false;
        // Check if related transaction is Issuer
        const t = transactions.find(trx => trx.id === d.refId || trx.refNo === d.refId);
        if (!t || t.tipe !== 'Issuer') return false;
        return true;
    });
    const disputeCount = filteredDisputes.length;

    // Nominal settlement = (matched nominal - matched on-hold) + unmatch nominal that is Settled
    const settleTrx = filtered.filter(t => {
        if (t.statusRekon === 'Matched' && t.flaggingStatus !== 'On-Hold') return true;
        if (t.statusRekon === 'Unmatched' && t.flaggingStatus === 'Settled') return true;
        return false;
    });
    const nominalSettle = settleTrx.reduce((sum, t) => sum + t.nominal, 0);

    document.getElementById('cardTotalTrx').textContent = totalTrx.toLocaleString('id-ID');
    document.getElementById('cardTotalMatch').textContent = matched.toLocaleString('id-ID');
    document.getElementById('cardTotalUnmatch').textContent = unmatched.toLocaleString('id-ID');
    document.getElementById('cardTotalOnhold').textContent = onHold.toLocaleString('id-ID');
    document.getElementById('cardTotalDispute').textContent = disputeCount.toLocaleString('id-ID');
    document.getElementById('cardNominalSettle').textContent = 'Rp' + nominalSettle.toLocaleString('id-ID');
}

function getRefId(tipe) {
    const startVal = document.getElementById('filterStartDate').value;
    const endVal = document.getElementById('filterEndDate').value;
    let dateStr = "";
    if (startVal && endVal) {
        if (startVal === endVal) {
            dateStr = startVal.replace(/-/g, '');
        } else {
            dateStr = startVal.replace(/-/g, '') + '_' + endVal.replace(/-/g, '');
        }
    } else if (startVal) {
        dateStr = startVal.replace(/-/g, '') + '_since';
    } else if (endVal) {
        dateStr = 'until_' + endVal.replace(/-/g, '');
    } else {
        const now = new Date();
        dateStr = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
    }
    return 'RECON-' + (tipe === 'Acquirer' ? 'ACQ' : 'ISS') + '-' + dateStr;
}

function getFinalizationStatus(tipe) {
    const refId = getRefId(tipe);
    const stored = localStorage.getItem('paydia_recon_approved_' + refId);
    if (stored === 'Approved') return 'Approved';
    if (stored === 'Rejected') return 'Rejected';
    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
    const isPending = approvals.some(a => a.refId === refId && a.tipeRequest === 'Finalize Reconcile' && a.status === 'Pending');
    if (isPending) return 'Pending';
    return 'None';
}

function renderFinalizationBannerAndButton() {
    const finalStatus = getFinalizationStatus('Issuer');
    const btn = document.getElementById('btnApproveSettlement');
    
    if (btn) {
        if (finalStatus === 'Pending') {
            btn.disabled = true;
            btn.style.opacity = '0.65';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = '<i class="fas fa-clock"></i> Pending Approval';
        } else if (finalStatus === 'Approved') {
            btn.disabled = true;
            btn.style.opacity = '0.65';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = '<i class="fas fa-check-double"></i> Finalized';
        } else {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.cursor = '';
            btn.innerHTML = finalStatus === 'Rejected'
                ? '<i class="fas fa-redo"></i> Finalisasi Ulang'
                : '<i class="fas fa-file-invoice-dollar"></i> Finalisasi';
        }
    }

    const pane = document.getElementById('iss-match');
    if (pane) {
        const existingBanner = pane.querySelector('.finalization-lock-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        if (finalStatus !== 'None') {
            const bannerDiv = document.createElement('div');
            bannerDiv.className = `finalization-lock-banner ${finalStatus.toLowerCase()}`;
            
            let iconClass = 'fa-lock';
            let message = '';
            if (finalStatus === 'Pending') {
                iconClass = 'fa-clock';
                message = '<strong>Sesi Rekonsiliasi Issuer Terkunci:</strong> Pengajuan finalisasi sedang menunggu persetujuan dari Management.';
            } else if (finalStatus === 'Approved') {
                iconClass = 'fa-check-circle';
                message = '<strong>Sesi Rekonsiliasi Issuer Selesai:</strong> Hasil rekonsiliasi telah disetujui oleh Management.';
            } else if (finalStatus === 'Rejected') {
                iconClass = 'fa-times-circle';
                message = '<strong>Finalisasi Ditolak:</strong> Pengajuan finalisasi ditolak oleh Management. Silakan ajukan kembali.';
            }

            bannerDiv.innerHTML = `
                <i class="fas ${iconClass} finalization-lock-banner-icon"></i>
                <div class="finalization-lock-banner-text">${message}</div>
            `;
            
            const wrapper = pane.querySelector('.table-wrapper');
            if (wrapper) {
                pane.insertBefore(bannerDiv, wrapper);
            } else {
                pane.appendChild(bannerDiv);
            }
        }
    }
}

// ── Main Routing & Loading Rendering ──
function renderActiveTableWithLoading() {
    let tbody;
    let colCount = 12;

    if (activeSubtab === 'iss-match') { tbody = document.getElementById('issMatchTableBody'); colCount = 8; }
    else if (activeSubtab === 'iss-unmatch') { tbody = document.getElementById('issUnmatchTableBody'); colCount = 11; }

    if (!tbody) return;

    // Show skeleton
    tbody.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        let tds = '';
        for (let j = 0; j < colCount; j++) {
            let width = '75%';
            if (j === 0) width = '30px';
            tds += `<td><div class="skeleton" style="height: 18px; width: ${width}; margin: 2px 0;"></div></td>`;
        }
        tr.innerHTML = tds;
        tbody.appendChild(tr);
    }

    setTimeout(() => {
        renderTableData();
    }, 300);
}

function renderTableData() {
    renderSummary();
    renderFinalizationBannerAndButton();
    updateRerunButtonState();

    // Filters
    const startDateVal = document.getElementById('filterStartDate') ? document.getElementById('filterStartDate').value : '';
    const endDateVal = document.getElementById('filterEndDate') ? document.getElementById('filterEndDate').value : '';
    const vendorVal = document.getElementById('filterVendor') ? document.getElementById('filterVendor').value : '';
    const txIdVal = document.getElementById('filterTxId') ? document.getElementById('filterTxId').value.trim().toLowerCase() : '';
    const merchantIdVal = document.getElementById('filterMerchantId') ? document.getElementById('filterMerchantId').value.trim().toLowerCase() : '';
    const lokasiVal = document.getElementById('filterLokasi') ? document.getElementById('filterLokasi').value : '';

    const isSuksesChecked = document.getElementById('chkStatusSukses') ? document.getElementById('chkStatusSukses').checked : false;
    const isGagalChecked = document.getElementById('chkStatusGagal') ? document.getElementById('chkStatusGagal').checked : false;
    const isPendingChecked = document.getElementById('chkStatusPending') ? document.getElementById('chkStatusPending').checked : false;
    
    const isTopupChecked = document.getElementById('chkKategoriTopup') ? document.getElementById('chkKategoriTopup').checked : false;
    const isUserChecked = document.getElementById('chkKategoriUser') ? document.getElementById('chkKategoriUser').checked : false;
    
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Reconcile Tables (Issuer)
    let tbody;
    let category = 'Issuer';
    let sub = activeSubtab;

    // Filter transaction list
    let filtered = transactions.filter(t => {
        if (t.tipe !== category) return false;
        
        // Sub-tabs filters
        if (sub === 'iss-match' && t.statusRekon !== 'Matched') return false;
        if (sub === 'iss-unmatch' && t.statusRekon !== 'Unmatched') return false;

        // Date filter
        const tDate = t.date.substring(0, 10);
        if (startDateVal && tDate < startDateVal) return false;
        if (endDateVal && tDate > endDateVal) return false;
        
        // Vendor filter
        if (vendorVal && t.switching !== vendorVal) return false;
        
        // Transaction ID filter
        if (txIdVal && !t.id.toLowerCase().includes(txIdVal)) return false;
        
        // Merchant ID filter
        if (merchantIdVal && !t.merchantId.toLowerCase().includes(merchantIdVal)) return false;

        // Lokasi filter
        if (lokasiVal && (t.domestic || 'Domestic') !== lokasiVal) return false;

        // Status Transaksi (Sukses, Gagal, Pending) Checkboxes
        if (isSuksesChecked || isGagalChecked || isPendingChecked) {
            let matchStatus = false;
            if (isSuksesChecked && t.rc === '00') matchStatus = true;
            if (isPendingChecked && t.rc === '68') matchStatus = true;
            if (isGagalChecked && t.rc !== '00' && t.rc !== '68') matchStatus = true;
            if (!matchStatus) return false;
        }
        
        // Kategori Checkboxes
        if (isTopupChecked || isUserChecked) {
            let matchKategori = false;
            if (isTopupChecked && t.kategori === 'payin-topup') matchKategori = true;
            if (isUserChecked && t.kategori === 'payin-user') matchKategori = true;
            if (!matchKategori) return false;
        }

        // Search text: RRN (refNo) / Merchant ID only
        if (searchVal && !t.refNo.toLowerCase().includes(searchVal) && !(t.merchantId || '').toLowerCase().includes(searchVal)) return false;

        return true;
    });
    window.currentExportData = filtered;

    if (sub === 'iss-match') {
        tbody = document.getElementById('issMatchTableBody');
        renderMatchRows(filtered, tbody);
    } else if (sub === 'iss-unmatch') {
        tbody = document.getElementById('issUnmatchTableBody');
        renderUnmatchRows(filtered, tbody);
    }
}

function renderMatchRows(list, tbody) {
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px 16px;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px 0;">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Tidak ada transaksi match (Data Kosong)</span>
                        <button class="btn-populate-empty-state" style="background: var(--success); color: white; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                            <i class="fas fa-seedling"></i> Populate Mock Data
                        </button>
                    </div>
                </td>
            </tr>
        `;
        const btn = tbody.querySelector('.btn-populate-empty-state');
        if (btn) {
            btn.addEventListener('click', () => {
                const btnPop = document.getElementById('btnPopulateMock');
                if (btnPop) btnPop.click();
            });
        }
        updatePaginationInfo(0);
        return;
    }

    list.forEach((t, idx) => {
        const tr = document.createElement('tr');
        
        const nominalTotal = t.nominal;
        const nominalTip = Math.floor(t.nominal * 0.05); // 5% tip as a mock example
        const nominalMdr = Math.floor(t.nominal * 0.007); // 0.7% MDR as a mock example
        const nominalTx = nominalTotal + nominalTip + nominalMdr;

        tr.innerHTML = `
            <td class="col-no">${idx + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${t.date}</td>
            <td><a href="#" class="ref-link detail-trx-trigger" data-id="${t.id}">${t.id}</a></td>
            <td>${t.refNo}</td>
            <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTx.toLocaleString('id-ID')}</strong></td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTotal.toLocaleString('id-ID')}</td>
            <td>${t.merchantName}</td>
            <td>${t.switching}</td>
        `;
        tbody.appendChild(tr);
    });
    updatePaginationInfo(list.length);
}

function renderUnmatchRows(list, tbody) {
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" style="text-align:center; padding: 40px 16px;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px 0;">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Tidak ada transaksi unmatch (Data Kosong)</span>
                        <button class="btn-populate-empty-state" style="background: var(--success); color: white; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                            <i class="fas fa-seedling"></i> Populate Mock Data
                        </button>
                    </div>
                </td>
            </tr>
        `;
        const btn = tbody.querySelector('.btn-populate-empty-state');
        if (btn) {
            btn.addEventListener('click', () => {
                const btnPop = document.getElementById('btnPopulateMock');
                if (btnPop) btnPop.click();
            });
        }
        updatePaginationInfo(0);
        return;
    }

    list.forEach((t, idx) => {
        const tr = document.createElement('tr');

        let labelClass = '';
        if (t.label === 'Paydia-Only Success') labelClass = 'paydia';
        else if (t.label.startsWith('Switching-Only')) labelClass = 'switching';
        else if (t.label === 'Double RRN') labelClass = 'double-rrn';
        else if (t.label === 'Beda Status Transaksi') labelClass = 'beda-status';
        else labelClass = 'switching';

        let flagClass = '';
        if (t.flaggingStatus === 'On-Hold') flagClass = 'status-proses';
        else if (t.flaggingStatus === 'Flag Recon') flagClass = 'status-dikembalikan';
        else if (t.flaggingStatus === 'Flag Settle') flagClass = 'status-sukses';
        else if (t.flaggingStatus === 'Ada Catatan') flagClass = 'status-notes';
        else if (t.flaggingStatus === 'Cancelled') flagClass = 'status-gagal';
        else flagClass = 'status-proses';

        let actionCell = `<button class="btn-action-dots btn-flag-menu-trigger" data-id="${t.id}" data-label="${t.label}"><i class="fas fa-ellipsis-v"></i></button>`;

        const nominalTotal = t.nominal;
        const nominalTip = Math.floor(t.nominal * 0.05);
        const nominalMdr = Math.floor(t.nominal * 0.007);
        const nominalTx = nominalTotal + nominalTip + nominalMdr;

        const isChecked = selectedUnmatchIds && selectedUnmatchIds.includes(t.id);

        tr.innerHTML = `
            <td class="col-checkbox" style="text-align: center;"><input type="checkbox" class="unmatch-row-checkbox" data-id="${t.id}" ${isChecked ? 'checked' : ''}></td>
            <td class="col-no">${idx + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${t.date}</td>
            <td><a href="#" class="ref-link detail-trx-trigger" data-id="${t.id}">${t.refNo}</a></td>
            <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTx.toLocaleString('id-ID')}</strong></td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTotal.toLocaleString('id-ID')}</td>
            <td>${t.merchantName}</td>
            <td>${t.label.startsWith('Paydia-Only') ? '' : `<span class="status-badge status-${(t.rcSwitching || t.rc) === '00' ? 'sukses' : ((t.rcSwitching || t.rc) === '68' ? 'sukses' : 'gagal')}">${t.rcSwitching || t.rc}</span>`}</td>
            <td>${t.switching}</td>
            <td><span class="badge-unmatch ${labelClass}">${t.label}</span></td>
            <td><span class="status-badge ${flagClass}">${t.flaggingStatus}</span></td>
            <td class="col-action" style="white-space: nowrap;">${actionCell}</td>
        `;
        tbody.appendChild(tr);
    });
    updatePaginationInfo(list.length);
}

function updatePaginationInfo(count) {
    document.getElementById('paginationInfo').textContent = `1 - ${count} of ${count}`;
}

function openDetailModal(trxId) {
    const t = transactions.find(item => item.id === trxId || item.refNo === trxId);
    if (!t) {
        showToast('Error', 'Detail transaksi tidak ditemukan');
        return;
    }

    const modalTitleEl = document.querySelector('#detailModal .modal-title');
    if (modalTitleEl) {
        modalTitleEl.textContent = `Rincian Transaksi QRIS - ${t.id}`;
    }

    const nominalTotal = t.nominal;
    const nominalTip = Math.floor(t.nominal * 0.05);
    const nominalMdr = Math.floor(t.nominal * 0.007);
    const nominalTx = nominalTotal + nominalTip + nominalMdr;

    // Deterministik mock data generator untuk matched detail modal
    let hash = 0;
    for (let i = 0; i < t.id.length; i++) {
        hash = t.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const acquirerId = '93600' + (100 + (hash % 900));
    const customerPan = '936008******' + (1000 + (hash % 9000));
    
    const names = ['Budi Santoso', 'Andi Wijaya', 'Siti Rahma', 'Dewi Lestari', 'Rian Hidayat', 'Mega Wati', 'Joni Pratama'];
    const wallets = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay'];
    const customerData = `${wallets[hash % wallets.length]} - ${names[hash % names.length]}`;
    
    const issuerNames = ['BCA', 'Bank Mandiri', 'BRI', 'BNI', 'Bank Danamon', 'CIMB Niaga'];
    const issuerName = issuerNames[hash % issuerNames.length];
    
    const merchantPan = '936009******' + (1000 + (hash % 9000));
    const terminalId = 'TID-' + (10000 + (hash % 90000));
    
    const merchantCategory = ['F&B / Restaurant', 'Retail / Supermarket', 'Entertainment', 'Transportation', 'Services'][hash % 5];
    const merchantCriteria = ['UMI (Usaha Mikro)', 'UKE (Usaha Kecil)', 'UME (Usaha Menengah)', 'UBE (Usaha Besar)'][hash % 4];
    const traceNo = (100000 + (hash % 900000)).toString();

    function rcBadge(rc) {
        const cls = rc === '00' ? 'sukses' : (rc === '68' ? 'sukses' : 'gagal');
        const label = rc === '00' ? 'Sukses' : (rc === '68' ? 'Pending' : 'Gagal');
        return `<span class="status-badge status-${cls}">${rc} - ${label}</span>`;
    }

    function statusBadgeFromRc(rc) {
        if (!rc) return `<span class="status-badge status-proses">Create</span>`;
        if (rc === '00') return `<span class="status-badge status-sukses">Sukses</span>`;
        if (rc === '68') return `<span class="status-badge status-proses">Pending</span>`;
        return `<span class="status-badge status-gagal">Gagal</span>`;
    }

    const paydiaRc = t.rcPaydia || t.rc;
    const switchingRc = t.rcSwitching || t.rc;
    const paydiaNominal = t.nominalPaydia || t.nominal;
    const switchingNominal = t.nominalSwitching || t.nominal;
    const txDatePart = t.date ? t.date.substring(0, 10) : '';
    const switchingJam = t.switchingTime || (t.date ? t.date.substring(11) : '');

    let paydiaContent = '';
    if (t.label.startsWith('Switching-Only')) {
        paydiaContent = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; font-family: 'Inter', sans-serif;">
                <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> Tidak ada data Paydia (Switching-Only)
            </div>
        `;
    } else {
        paydiaContent = `
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">Acquirer Id</td>
                    <td class="detail-value">${acquirerId}</td>
                </tr>
                <tr>
                    <td class="detail-label">Customer Pan</td>
                    <td class="detail-value">${customerPan}</td>
                </tr>
                <tr>
                    <td class="detail-label">Customer Data</td>
                    <td class="detail-value">${customerData}</td>
                </tr>
                <tr>
                    <td class="detail-label">Issuer Name</td>
                    <td class="detail-value">${issuerName}</td>
                </tr>
                <tr>
                    <td class="detail-label">Merchant Name</td>
                    <td class="detail-value">${t.merchantName}</td>
                </tr>
                <tr>
                    <td class="detail-label">Merchant ID</td>
                    <td class="detail-value">M${t.refNo.substring(0, 8)}ID</td>
                </tr>
                <tr>
                    <td class="detail-label">Merchant Pan</td>
                    <td class="detail-value">${merchantPan}</td>
                </tr>
                <tr>
                    <td class="detail-label">Rrn</td>
                    <td class="detail-value">${t.refNo}</td>
                </tr>
                <tr>
                    <td class="detail-label">Terminal Id</td>
                    <td class="detail-value">${terminalId}</td>
                </tr>
                <tr>
                    <td class="detail-label">Transaction Amount</td>
                    <td class="detail-value"><strong>Rp${paydiaNominal.toLocaleString('id-ID')}</strong></td>
                </tr>
                <tr>
                    <td class="detail-label">Lokasi Domestik / Crossborder</td>
                    <td class="detail-value">${t.domestic}</td>
                </tr>
                <tr>
                    <td class="detail-label">Status Transaksi</td>
                    <td class="detail-value">${statusBadgeFromRc(paydiaRc)}</td>
                </tr>
            </table>
        `;
    }

    let switchingContent = '';
    if (t.label.startsWith('Paydia-Only')) {
        switchingContent = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; font-family: 'Inter', sans-serif;">
                <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> Tidak ada data Switching (Paydia-Only)
            </div>
        `;
    } else {
        switchingContent = `
            <table class="modal-detail-table">
                <tr>
                    <td class="detail-label">Nama Switching</td>
                    <td class="detail-value">${t.switching}</td>
                </tr>
                <tr>
                    <td class="detail-label">Response Code</td>
                    <td class="detail-value">${rcBadge(switchingRc)}</td>
                </tr>
                <tr>
                    <td class="detail-label">Tanggal Transaksi</td>
                    <td class="detail-value">${txDatePart}</td>
                </tr>
                <tr>
                    <td class="detail-label">Jam Transaksi</td>
                    <td class="detail-value">${switchingJam}</td>
                </tr>
                <tr>
                    <td class="detail-label">Reference Number</td>
                    <td class="detail-value">${t.refNo}</td>
                </tr>

                <tr>
                    <td class="detail-label">Nominal</td>
                    <td class="detail-value"><strong>Rp${switchingNominal.toLocaleString('id-ID')}</strong></td>
                </tr>
            </table>
        `;
    }

    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="fas fa-info-circle"></i> Detail Transaksi - Data Paydia</h3>
            ${paydiaContent}
        </div>

        <div class="modal-section">
            <h3 class="modal-section-title"><i class="fas fa-exchange-alt"></i> Detail Transaksi - Data Switching</h3>
            ${switchingContent}
        </div>
    `;
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function checkHasFailedProcess(tipe) {
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const saved = localStorage.getItem('paydia_recon_processes');
    const processes = saved ? JSON.parse(saved) : [];
    const filtered = processes.filter(p => {
        if (p.tipe !== tipe) return false;
        if (startDateVal && p.date < startDateVal) return false;
        if (endDateVal && p.date > endDateVal) return false;
        return true;
    });
    return filtered.some(p => p.status === 'Gagal');
}

function getLatestProcessFile(tipe) {
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const saved = localStorage.getItem('paydia_recon_processes');
    const processes = saved ? JSON.parse(saved) : [];
    const filtered = processes.filter(p => {
        if (p.tipe !== tipe) return false;
        if (startDateVal && p.date < startDateVal) return false;
        if (endDateVal && p.date > endDateVal) return false;
        return true;
    });
    if (filtered.length === 0) return null;
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    return filtered[0];
}

function updateRerunButtonState() {
    const hasFailed = checkHasFailedProcess('Issuer');
    const btn = document.getElementById('btnRerun');
    if (btn) {
        if (hasFailed) {
            btn.removeAttribute('disabled');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = 'Retry Auto Recon untuk file terbaru';
        } else {
            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Tidak ada proses gagal pada rentang tanggal terpilih';
        }
    }
}

// ── Re-run Matching Control ──
function openRerunConfigModal() {
    if (!permissions.rerun) {
        showToast('Access Denied', 'Anda tidak memiliki izin untuk melakukan Retry Auto Recon.');
        return;
    }
    
    const hasFailed = checkHasFailedProcess('Issuer');
    const statusMsg = document.getElementById('rerunStatusMsg');
    if (statusMsg) statusMsg.style.display = 'none';

    if (rerunConfigOverlay) {
        rerunConfigOverlay.classList.add('show');
    }
}

function startRerunMatching() {
    const hasFailed = checkHasFailedProcess('Issuer');
    const statusMsg = document.getElementById('rerunStatusMsg');
    
    if (!hasFailed) {
        if (statusMsg) {
            statusMsg.textContent = 'Tidak valid: Tidak ada proses gagal di hari tersebut.';
            statusMsg.style.display = 'block';
        } else {
            showToast('Gagal', 'Tidak valid: Tidak ada proses gagal di hari tersebut.');
        }
        return;
    }
    
    if (rerunConfigOverlay) rerunConfigOverlay.classList.remove('show');
    showToast('Retry Auto Recon', 'Auto recon sedang proses...');
    
    const latestFile = getLatestProcessFile('Issuer');
    if (latestFile) {
        const saved = localStorage.getItem('paydia_recon_processes');
        const processes = saved ? JSON.parse(saved) : [];
        const target = processes.find(p => p.date === latestFile.date && p.tipe === latestFile.tipe && p.filename === latestFile.filename);
        if (target) {
            target.status = 'Sukses';
            localStorage.setItem('paydia_recon_processes', JSON.stringify(processes));
        }
    }
    
    setTimeout(() => {
        const suspect = transactions.find(t => t.id === 'TX-ISS-20002');
        if (suspect && suspect.statusRekon === 'Unmatched') {
            suspect.statusRekon = 'Matched';
            suspect.label = 'Match';
            suspect.rc = '00';
            saveTrxToStorage();
        }

        writeLog('Re-run Reconcile', 'email : dion@paydia.id\naction : Retry Auto Recon (Auto rekonsiliasi file terbaru sukses)');
        showToast('Retry Auto Recon', 'Auto recon berhasil diproses!');
        renderActiveTableWithLoading();
    }, 1500);
}

// ── Finalize Reconcile Trigger ──
function triggerApproveSettlement() {
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const switchingVal = document.getElementById('filterVendor').value;

    let filtered = transactions.filter(t => {
        if (t.tipe !== 'Issuer') return false;
        const tDate = t.date.substring(0, 10);
        if (startDateVal && tDate < startDateVal) return false;
        if (endDateVal && tDate > endDateVal) return false;
        if (switchingVal && t.switching !== switchingVal) return false;
        return true;
    });
    window.currentExportData = filtered;

    const matched = filtered.filter(t => t.statusRekon === 'Matched' && t.flaggingStatus !== 'On-Hold').length;
    const unmatchRel = filtered.filter(t => t.statusRekon === 'Unmatched' && t.flaggingStatus === 'Settled').length;
    const settleTrx = filtered.filter(t => {
        if (t.statusRekon === 'Matched' && t.flaggingStatus !== 'On-Hold') return true;
        if (t.statusRekon === 'Unmatched' && t.flaggingStatus === 'Settled') return true;
        return false;
    });
    const nominalSettle = settleTrx.reduce((sum, t) => sum + t.nominal, 0);

    document.getElementById('settleConfirmMatch').textContent = matched + ' Transaksi';
    document.getElementById('settleConfirmUnmatchRel').textContent = unmatchRel + ' Transaksi';
    document.getElementById('settleConfirmNominal').textContent = 'Rp' + nominalSettle.toLocaleString('id-ID');

    settlementOverlay.classList.add('show');
}

function submitSettlementRequest() {
    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
    
    const startVal = document.getElementById('filterStartDate').value;
    const endVal = document.getElementById('filterEndDate').value;
    
    function formatDateIndo(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const monthNum = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const monthName = months[monthNum - 1] || parts[1];
            return `${day} ${monthName} ${year}`;
        }
        return dateStr;
    }
    
    let dateVal = 'Hari Ini';
    if (startVal && endVal) {
        dateVal = startVal === endVal ? formatDateIndo(startVal) : `${formatDateIndo(startVal)} - ${formatDateIndo(endVal)}`;
    } else if (startVal) {
        dateVal = `Mulai ${formatDateIndo(startVal)}`;
    } else if (endVal) {
        dateVal = `Hingga ${formatDateIndo(endVal)}`;
    }
    
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB');

    const appEntry = {
        id: 'APR-RECON-' + Date.now(),
        tanggal: timeStr,
        account: `Sesi Rekonsiliasi QRIS Issuer: ${dateVal}`,
        admin: 'Dion',
        tipeRequest: 'Finalize Reconcile',
        status: 'Pending',
        refId: getRefId('Issuer'),
        alasan: 'Hasil rekonsiliasi siap diproses',
        nominal: 245890000,
        statusRekon: 'Pending'
    };

    approvals.unshift(appEntry);
    localStorage.setItem('paydia_approvals', JSON.stringify(approvals));

    writeLog('Finalisasi', `email : dion@paydia.id\naction : Mengajukan finalisasi rekonsiliasi Issuer sesi ${dateVal}`);
    settlementOverlay.classList.remove('show');
    showToast('Request Terkirim', 'Request finalisasi rekonsiliasi dikirim ke Management.');
}

// ── Bind Interactive Events ──
function bindEvents() {
    // Sub-tab switching
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pane = btn.closest('.tab-pane');
            pane.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            pane.querySelectorAll('.sub-tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetSub = btn.dataset.subtab;
            document.getElementById(targetSub).classList.add('active');
            activeSubtab = targetSub;

            renderActiveTableWithLoading();
        });
    });

    // Filters and toolbar events
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('open');
        filterBtn.classList.toggle('active');
    });

    // Close filter panel if click outside
    document.addEventListener('click', (e) => {
        if (filterPanel && filterBtn && !filterPanel.contains(e.target) && !filterBtn.contains(e.target)) {
            filterPanel.classList.remove('open');
            filterBtn.classList.remove('active');
        }
    });

    // Apply Filters button click
    const btnApplyFilters = document.getElementById('btnApplyFilters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            renderActiveTableWithLoading();
            filterPanel.classList.remove('open');
            filterBtn.classList.remove('active');
        });
    }

    // Clear All button click (Reset)
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            
            if (document.getElementById('filterStartDate')) document.getElementById('filterStartDate').value = `${yyyy}-${mm}-${dd}`;
            if (document.getElementById('filterEndDate')) document.getElementById('filterEndDate').value = `${yyyy}-${mm}-${dd}`;
            if (document.getElementById('filterVendor')) document.getElementById('filterVendor').selectedIndex = 0;
            if (document.getElementById('filterTxId')) document.getElementById('filterTxId').value = '';
            if (document.getElementById('filterMerchantId')) document.getElementById('filterMerchantId').value = '';
            
            if (document.getElementById('chkStatusSukses')) document.getElementById('chkStatusSukses').checked = false;
            if (document.getElementById('chkStatusGagal')) document.getElementById('chkStatusGagal').checked = false;
            if (document.getElementById('chkStatusPending')) document.getElementById('chkStatusPending').checked = false;
            
            if (document.getElementById('chkKategoriTopup')) document.getElementById('chkKategoriTopup').checked = false;
            if (document.getElementById('chkKategoriUser')) document.getElementById('chkKategoriUser').checked = false;
            
            if (searchInput) searchInput.value = '';
            showToast('Filter Direset', 'Semua filter pencarian direset.');
            renderActiveTableWithLoading();
        });
    }

    searchBtn.addEventListener('click', () => {
        renderActiveTableWithLoading();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') renderActiveTableWithLoading();
    });

    // Export Excel/CSV
    exportBtn.addEventListener('click', () => {
        if (!permissions.export) {
            showToast('Access Denied', 'Anda tidak memiliki izin untuk mengeksport data.');
            return;
        }
        const startVal = document.getElementById('filterStartDate').value || '2026-05-28';
        const endVal = document.getElementById('filterEndDate').value || '2026-05-28';
        let dateVal = startVal;
        if (startVal !== endVal) {
            dateVal = `${startVal}_to_${endVal}`;
        }
        const vendorVal = document.getElementById('filterVendor').value || 'Semua';
        
        // Only export the active sub-tab
        const activeSubtabBtn = document.querySelector('.sub-tab-btn.active');
        const subtabName = activeSubtabBtn ? activeSubtabBtn.textContent.trim() : 'Matched Table';
        
        const inlineProgress = document.getElementById('exportInlineProgress');
        const fill = document.getElementById('exportInlineProgressBarFill');
        const status = document.getElementById('exportInlineProgressStatus');
        
        if (inlineProgress && fill && status) {
            inlineProgress.style.display = 'flex';
            fill.style.width = '0%';
            status.textContent = 'Mempersiapkan data (0%)';
            
            let percent = 0;
            const interval = setInterval(() => {
                percent += 10;
                fill.style.width = percent + '%';
                status.textContent = `Mengekspor data (${percent}%)`;
                
                if (percent >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        inlineProgress.style.display = 'none';
                        writeLog('Ekspor Data Tabel', `email : dion@paydia.id\naction : Mengeksport data ${subtabName} Issuer sesi ${dateVal} (Vendor: ${vendorVal})`);
                        showToast('Export Selesai', `File export QRIS_Issuer_${subtabName.replace(/\s+/g, '_')}_${dateVal}.xlsx berhasil diunduh.`);
                    if(typeof window.showExcelSimulationModal === "function") window.showExcelSimulationModal(window.currentExportData || [], subtabName);
}, 300);
                }
            }, 100);
        } else {
            writeLog('Ekspor Data Tabel', `email : dion@paydia.id\naction : Mengeksport data ${subtabName} Issuer sesi ${dateVal} (Vendor: ${vendorVal})`);
            showToast('Export Selesai', `File export QRIS_Issuer_${subtabName.replace(/\s+/g, '_')}_${dateVal}.xlsx berhasil diunduh.`);
        }
    });

    // Re-run matching
    if (btnRerun) {
        btnRerun.addEventListener('click', () => {
            openRerunConfigModal();
        });
    }

    const rerunConfigClose = document.getElementById('rerunConfigClose');
    if (rerunConfigClose) {
        rerunConfigClose.addEventListener('click', () => {
            rerunConfigOverlay.classList.remove('show');
        });
    }

    const btnCancelRerun = document.getElementById('btnCancelRerun');
    if (btnCancelRerun) {
        btnCancelRerun.addEventListener('click', () => {
            rerunConfigOverlay.classList.remove('show');
        });
    }

    const btnConfirmRerun = document.getElementById('btnConfirmRerun');
    if (btnConfirmRerun) {
        btnConfirmRerun.addEventListener('click', () => {
            startRerunMatching();
        });
    }

    // Telegram Alert Card controls
    if (telegramAlertClose) {
        telegramAlertClose.addEventListener('click', () => {
            telegramAlertCard.classList.remove('show');
        });
    }

    if (telegramAlertBypass) {
        telegramAlertBypass.addEventListener('click', () => {
            telegramAlertCard.classList.remove('show');
            progressStatus.textContent = 'Menyelesaikan matching engine (Bypass)...';
            progressBarFill.style.width = '100%';
            finishRerunMatching(true);
        });
    }

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

    // Settlement confirmation
    if (btnApproveSettlement) {
        btnApproveSettlement.addEventListener('click', () => {
            triggerApproveSettlement();
        });
    }

    document.getElementById('btnSubmitSettlement').addEventListener('click', () => {
        submitSettlementRequest();
    });

    document.getElementById('btnCancelSettlement').addEventListener('click', () => {
        settlementOverlay.classList.remove('show');
    });
    document.getElementById('settlementClose').addEventListener('click', () => {
        settlementOverlay.classList.remove('show');
    });

    // Flagging control click inside table body using event delegation
    document.addEventListener('click', (e) => {
        // Toggle flagging dropdown menu trigger
        const triggerBtn = e.target.closest('.btn-flag-menu-trigger') || e.target.closest('.btn-dispute-menu-trigger');
        if (triggerBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const id = triggerBtn.dataset.id;
            const menu = document.getElementById('flagDropdownMenu');
            
            if (activeFlaggingTrxId === id && menu.classList.contains('show')) {
                hideFlagDropdown();
                return;
            }
            
            hideFlagDropdown();
            activeFlaggingTrxId = id;
            
            const isDispute = triggerBtn.classList.contains('btn-dispute-menu-trigger');
            
            if (isDispute) {
                menu.innerHTML = `
                    <button class="dropdown-item btn-edit-dispute" data-id="${id}">
                        <i class="fas fa-clipboard-check" style="color: var(--primary); width: 16px; margin-right: 4px;"></i> Lihat Catatan
                    </button>
                `;
            } else {
                const t = transactions.find(item => item.id === id);
                let flagButton = '';
                if (t) {
                    if (t.flaggingStatus === 'Flag Recon') {
                        flagButton = `<button class="dropdown-item btn-unmatch-flag-settle" data-id="${id}">Flag Settle</button>`;
                    } else if (t.flaggingStatus !== 'Flag Settle' && t.flaggingStatus !== 'Cancelled') {
                        flagButton = `<button class="dropdown-item btn-unmatch-flag-recon" data-id="${id}">Flag Recon</button>`;
                    }
                }
                menu.innerHTML = `
                    ${flagButton}
                    <button class="dropdown-item btn-take-notes" data-id="${id}">Lihat Catatan</button>
                `;
            }

            const rect = triggerBtn.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.left = `${rect.right - 180}px`;
            menu.classList.add('show');
            triggerBtn.classList.add('active');
            return;
        }

        // Click dropdown item
        const dropdownItem = e.target.closest('#flagDropdownMenu .dropdown-item');
        if (dropdownItem) {
            e.preventDefault();
            if (dropdownItem.classList.contains('btn-take-notes')) {
                openNotesForm(activeFlaggingTrxId);
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-edit-dispute')) {
                openNotesForm(activeFlaggingTrxId);
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-unmatch-flag-recon')) {
                const t = transactions.find(item => item.id === activeFlaggingTrxId);
                if (t) {
                    if (t.flaggingStatus === 'Cancelled') {
                        showToast('Error', `Transaksi sudah dibatalkan pada ${t.cancelledAt} oleh ${t.cancelledBy}`);
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin melakukan <strong>Flag Recon</strong> pada transaksi ${t.id}?`, () => {
                        t.flaggingStatus = 'Flag Recon';
                        
                        const isSwitchingOnly = t.label.startsWith('Switching-Only');
                        let logDetail = `Mengubah status transaksi ${t.id} menjadi Flag Recon`;
                        if (isSwitchingOnly) {
                            logDetail = `Membuat data transaksi di DB Paydia dan melakukan flagging recon untuk switching-only transaction ${t.id}`;
                        }
                        
                        saveTrxToStorage();
                        writeLog('flag-recon-unmatch', `email : dion@paydia.id\naction : ${logDetail}`);
                        showToast('Flag Recon Berhasil', `Transaksi ${t.id} berhasil di-Flag Recon.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-unmatch-flag-settle')) {
                const t = transactions.find(item => item.id === activeFlaggingTrxId);
                if (t) {
                    if (t.flaggingStatus === 'Cancelled') {
                        showToast('Error', `Transaksi sudah dibatalkan pada ${t.cancelledAt} oleh ${t.cancelledBy}`);
                        hideFlagDropdown();
                        return;
                    }
                    if (t.flaggingStatus !== 'Flag Recon') {
                        showToast('Peringatan', 'Transaksi harus di-Flag Recon terlebih dahulu sebelum di-Flag Settle.');
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin melakukan <strong>Flag Settle</strong> pada transaksi ${t.id}? Transaksi ini akan diteruskan ke Settlement.`, () => {
                        t.flaggingStatus = 'Flag Settle';
                        saveTrxToStorage();
                        
                        // Copy to paydia_settlements
                        const savedSettlements = localStorage.getItem('paydia_settlements');
                        const database = savedSettlements ? JSON.parse(savedSettlements) : [];
                        const exists = database.some(item => item.txId === t.id);
                        if (!exists) {
                            database.unshift({
                                id: Date.now(),
                                tanggal: t.date,
                                txId: t.id,
                                merchantCode: t.merchantId || '240827001000000',
                                merchantName: t.merchantName,
                                nominalQris: t.nominal,
                                nominalSettle: t.nominal,
                                bankCode: t.switching === 'Jalin' ? 'BRI' : 'BCA',
                                bankAccount: '12345678',
                                bankAccountName: t.merchantName,
                                status: 'Pembayaran'
                            });
                            localStorage.setItem('paydia_settlements', JSON.stringify(database));
                        }
                        
                        writeLog('flag-settle-unmatch', `email : dion@paydia.id\naction : Mengubah status transaksi ${t.id} menjadi Flag Settle dan meneruskan ke settlement`);
                        showToast('Flag Settle Berhasil', `Transaksi ${t.id} berhasil di-Flag Settle dan diteruskan ke settlement.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            hideFlagDropdown();
            return;
        }

        // Close dropdown when clicking outside
        if (!e.target.closest('.btn-flag-menu-trigger') && !e.target.closest('.btn-dispute-menu-trigger') && !e.target.closest('#flagDropdownMenu')) {
            hideFlagDropdown();
        }

        // Drill-down link detail trigger
        const detailLink = e.target.closest('.detail-trx-trigger');
        if (detailLink) {
            e.preventDefault();
            const id = detailLink.dataset.id;
            openDetailModal(id);
            return;
        }

        // Take Notes trigger
        const takeNotesBtn = e.target.closest('.btn-take-notes');
        if (takeNotesBtn) {
            e.preventDefault();
            const id = takeNotesBtn.dataset.id;
            openNotesForm(id);
            return;
        }
    });

    // Helper to close dropdown menu
    function hideFlagDropdown() {
        const menu = document.getElementById('flagDropdownMenu');
        if (menu) {
            menu.classList.remove('show');
        }
        document.querySelectorAll('.btn-flag-menu-trigger.active').forEach(btn => {
            btn.classList.remove('active');
        });
        activeFlaggingTrxId = null;
    }

    window.addEventListener('scroll', hideFlagDropdown, { passive: true });

    // Close details modal
    document.getElementById('modalClose').addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
    });

    // General escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('show');
            settlementOverlay.classList.remove('show');
            if (rerunConfigOverlay) rerunConfigOverlay.classList.remove('show');
            if (telegramAlertCard) telegramAlertCard.classList.remove('show');
            const exportBankModalOverlay = document.getElementById('exportBankModalOverlay');
            if (exportBankModalOverlay) exportBankModalOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Sidebar Mobile Toggle Actions
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

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
}

// ── Toast Helper ──
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

    setTimeout(() => removeToast(toast), 3500);
}

function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
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
            localStorage.setItem('paydia_recon_trx', JSON.stringify(rawTransactions));
            localStorage.setItem('paydia_disputes', JSON.stringify([
                { id: 'DISP-001', refId: 'REF-20260527-021', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Rintis', nominal: 220000, status: 'Open', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
                { id: 'DISP-002', refId: 'TX-ISS-20001', date: '2026-05-28 09:44:00', type: 'good faith', switching: 'Rintis', nominal: 89000, status: 'Open', desc: 'Dana menggantung di switching, merchant belum terima dana' }
            ]));
            localStorage.setItem('paydia_logs', JSON.stringify(seedLogs));
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

    const chkSimulateFail = document.getElementById('chkSimulateFail');
    if (chkSimulateFail) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const savedProcesses = localStorage.getItem('paydia_recon_processes');
        let processes = savedProcesses ? JSON.parse(savedProcesses) : [];
        let todayProcess = processes.find(p => p.date === todayStr && p.tipe === 'Issuer');
        
        chkSimulateFail.checked = (todayProcess && todayProcess.status === 'Gagal');

        chkSimulateFail.addEventListener('change', () => {
            const isChecked = chkSimulateFail.checked;
            const currentProcesses = JSON.parse(localStorage.getItem('paydia_recon_processes') || '[]');
            let targetProcess = currentProcesses.find(p => p.date === todayStr && p.tipe === 'Issuer');
            if (targetProcess) {
                targetProcess.status = isChecked ? 'Gagal' : 'Sukses';
            } else {
                currentProcesses.push({
                    date: todayStr,
                    filename: `qris_recon_${todayStr.replace(/-/g, '')}_latest.csv`,
                    status: isChecked ? 'Gagal' : 'Sukses',
                    tipe: 'Issuer'
                });
            }
            localStorage.setItem('paydia_recon_processes', JSON.stringify(currentProcesses));

            const currentTrxs = JSON.parse(localStorage.getItem('paydia_recon_trx') || '[]');
            let suspect = currentTrxs.find(t => t.id === 'TX-ISS-20002');
            if (suspect) {
                if (isChecked) {
                    suspect.statusRekon = 'Unmatched';
                    suspect.label = 'Paydia-Only';
                    suspect.rc = '68';
                } else {
                    suspect.statusRekon = 'Matched';
                    suspect.label = 'Match';
                    suspect.rc = '00';
                }
                localStorage.setItem('paydia_recon_trx', JSON.stringify(currentTrxs));
            }

            const msg = isChecked 
                ? 'Simulasi proses recon gagal berhasil diset. Menyegarkan halaman...'
                : 'Simulasi proses recon sukses berhasil diset. Menyegarkan halaman...';
            showToast('Simulasi', msg);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        });
    }
}

// ── Export per Bank Modal Logic ──
function checkIsDateFinalized(tipe, dateStr) {
    const formattedDate = dateStr.replace(/-/g, '');
    const refId = 'RECON-' + (tipe === 'Acquirer' ? 'ACQ' : 'ISS') + '-' + formattedDate;
    
    const stored = localStorage.getItem('paydia_recon_approved_' + refId);
    if (stored === 'Approved' || stored === 'Rejected') return true;
    
    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
    const isPending = approvals.some(a => a.refId === refId && a.tipeRequest === 'Finalize Reconcile' && a.status === 'Pending');
    if (isPending) return true;
    
    return false;
}

function initExportBank() {
    const exportBankBtn = document.getElementById('exportBankBtn');
    const exportBankModalOverlay = document.getElementById('exportBankModalOverlay');
    const exportBankModalClose = document.getElementById('exportBankModalClose');
    const btnExportBankStart = document.getElementById('btnExportBankStart');
    const exportBankDatePicker = document.getElementById('exportBankDatePicker');

    if (!exportBankBtn) return;

    const filterStartDate = document.getElementById('filterStartDate');
    if (filterStartDate && filterStartDate.value) {
        exportBankDatePicker.value = filterStartDate.value;
    }

    exportBankBtn.addEventListener('click', () => {
        if (!permissions.export) {
            showToast('Access Denied', 'Anda tidak memiliki izin untuk mengeksport data.');
            return;
        }
        if (filterStartDate && filterStartDate.value) {
            exportBankDatePicker.value = filterStartDate.value;
        }
        const progressContainer = document.getElementById('exportBankProgressBarContainer');
        if (progressContainer) progressContainer.style.display = 'none';
        
        exportBankModalOverlay.classList.add('show');
    });

    exportBankModalClose.addEventListener('click', () => {
        exportBankModalOverlay.classList.remove('show');
    });

    btnExportBankStart.addEventListener('click', () => {
        const selectedDate = exportBankDatePicker.value;
        if (!selectedDate) {
            showToast('Eror', 'Silakan pilih tanggal terlebih dahulu.');
            return;
        }

        // Finalization check removed as requested


        const progressContainer = document.getElementById('exportBankProgressBarContainer');
        const fill = document.getElementById('exportBankProgressBarFill');
        const status = document.getElementById('exportBankProgressStatus');

        if (progressContainer && fill && status) {
            btnExportBankStart.disabled = true;
            progressContainer.style.display = 'flex';
            fill.style.width = '0%';
            status.textContent = 'Mempersiapkan data bank (0%)';

            const banks = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB'];
            const randomBank = banks[Math.floor(Math.random() * banks.length)];
            
            let percent = 0;
            const interval = setInterval(() => {
                percent += 10;
                fill.style.width = percent + '%';
                status.textContent = `Mengekspor data bank ${randomBank} (${percent}%)`;

                if (percent >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        btnExportBankStart.disabled = false;
                        progressContainer.style.display = 'none';
                        exportBankModalOverlay.classList.remove('show');
                        
                        writeLog('Ekspor Data per Bank', `email : dion@paydia.id\naction : Melakukan ekspor data bank ${randomBank} tanggal ${selectedDate}`);
                        showToast('Export Selesai', `File export QRIS_Issuer_${randomBank}_${selectedDate.replace(/-/g, '')}.xlsx berhasil diunduh.`);
                    if(typeof window.showExcelSimulationModal === "function") window.showExcelSimulationModal(window.currentExportData || [], subtabName);
}, 300);
                }
            }, 100);
        } else {
            const banks = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB'];
            const randomBank = banks[Math.floor(Math.random() * banks.length)];
            writeLog('Ekspor Data per Bank', `email : dion@paydia.id\naction : Melakukan ekspor data bank ${randomBank} tanggal ${selectedDate}`);
            showToast('Export Selesai', `File export QRIS_Issuer_${randomBank}_${selectedDate.replace(/-/g, '')}.xlsx berhasil diunduh.`);
            exportBankModalOverlay.classList.remove('show');
        }
    });
}

// ── Notes for Double RRN ──
let rrnNotes = JSON.parse(localStorage.getItem('paydia_rrn_notes') || '{}');

function initNotesModal() {
    const notesOverlay = document.getElementById('notesOverlay');
    const notesClose = document.getElementById('notesClose');
    const notesCancelBtn = document.getElementById('notesCancelBtn');
    const notesForm = document.getElementById('notesForm');
    const notesText = document.getElementById('notesText');
    const notesCharCount = document.getElementById('notesCharCount');
    const notesTargetId = document.getElementById('notesTargetId');
    const notesTextError = document.getElementById('notesTextError');

    if (notesClose) {
        notesClose.addEventListener('click', () => {
            notesOverlay.classList.remove('show');
        });
    }

    if (notesCancelBtn) {
        notesCancelBtn.addEventListener('click', () => {
            notesOverlay.classList.remove('show');
        });
    }

    if (notesText) {
        notesText.addEventListener('input', () => {
            const len = notesText.value.length;
            notesCharCount.textContent = `${len} / 255`;
        });
    }

    if (notesForm) {
        notesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const noteVal = notesText.value.trim();
            if (!noteVal) {
                notesTextError.classList.add('show');
                return;
            }
            notesTextError.classList.remove('show');
            const targetId = notesTargetId.value;
            
            rrnNotes[targetId] = noteVal;
            localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes));
            
            const t = transactions.find(item => item.id === targetId);
            if (t && t.flaggingStatus === 'On-Hold') {
                t.flaggingStatus = 'Ada Catatan';
                saveTrxToStorage();
            }
            
            notesOverlay.classList.remove('show');
            showToast('Catatan Disimpan', 'Catatan transaksi unmatch berhasil disimpan.');
            writeLog('edit-notes-unmatch', `email : dion@paydia.id\naction : Menyimpan catatan untuk ID ${targetId}`);
            renderTableData();
        });
    }
}

function openNotesForm(id) {
    const notesOverlay = document.getElementById('notesOverlay');
    const notesText = document.getElementById('notesText');
    const notesTargetId = document.getElementById('notesTargetId');
    const notesCharCount = document.getElementById('notesCharCount');
    const notesTextError = document.getElementById('notesTextError');

    if (!notesOverlay || !notesText || !notesTargetId) return;

    notesTextError.classList.remove('show');
    notesTargetId.value = id;
    const existingNote = rrnNotes[id] || '';
    notesText.value = existingNote;
    notesCharCount.textContent = `${existingNote.length} / 255`;
    notesOverlay.classList.add('show');
}

// ── Bulk Actions for Issuer Unmatched ──
let selectedUnmatchIds = [];
let visibleUnmatchedList = [];

function updateBulkActionBar() {
    const bulkBar = document.getElementById('issBulkActionBar');
    const countEl = document.getElementById('issBulkSelectedCount');
    const globalSelectAll = document.getElementById('issUnmatchSelectAll');

    if (!bulkBar || !countEl) return;

    if (selectedUnmatchIds.length > 0) {
        bulkBar.style.display = 'flex';
        countEl.textContent = selectedUnmatchIds.length;
        
        // Update global checkbox state
        if (globalSelectAll) {
            const allVisibleSelected = visibleUnmatchedList.length > 0 && visibleUnmatchedList.every(t => selectedUnmatchIds.includes(t.id));
            globalSelectAll.checked = allVisibleSelected;
        }
    } else {
        bulkBar.style.display = 'none';
        if (globalSelectAll) globalSelectAll.checked = false;
    }
}

function initBulkActions() {
    const selectAllCheckbox = document.getElementById('issUnmatchSelectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            visibleUnmatchedList.forEach(t => {
                const idx = selectedUnmatchIds.indexOf(t.id);
                if (isChecked) {
                    if (idx === -1) selectedUnmatchIds.push(t.id);
                } else {
                    if (idx !== -1) selectedUnmatchIds.splice(idx, 1);
                }
            });
            renderTableData();
        });
    }

    const tbody = document.getElementById('issUnmatchTableBody');
    if (tbody) {
        tbody.addEventListener('change', (e) => {
            const checkbox = e.target.closest('.unmatch-row-checkbox');
            if (checkbox) {
                const id = checkbox.dataset.id;
                const isChecked = checkbox.checked;
                const idx = selectedUnmatchIds.indexOf(id);
                if (isChecked) {
                    if (idx === -1) selectedUnmatchIds.push(id);
                } else {
                    if (idx !== -1) selectedUnmatchIds.splice(idx, 1);
                }
                updateBulkActionBar();
            }
        });
    }

    const btnIssBulkSelectAll = document.getElementById('btnIssBulkSelectAll');
    if (btnIssBulkSelectAll) {
        btnIssBulkSelectAll.addEventListener('click', () => {
            visibleUnmatchedList.forEach(t => {
                if (!selectedUnmatchIds.includes(t.id)) {
                    selectedUnmatchIds.push(t.id);
                }
            });
            renderTableData();
        });
    }

    const btnIssBulkUnselect = document.getElementById('btnIssBulkUnselect');
    if (btnIssBulkUnselect) {
        btnIssBulkUnselect.addEventListener('click', () => {
            selectedUnmatchIds = [];
            renderTableData();
        });
    }

    const btnIssBulkRelease = document.getElementById('btnIssBulkRelease');
    if (btnIssBulkRelease) {
        btnIssBulkRelease.addEventListener('click', () => {
            if (selectedUnmatchIds.length === 0) return;
            openActionConfirmModal(`Apakah Anda yakin ingin melakukan <strong>Bulk Release</strong> pada ${selectedUnmatchIds.length} transaksi terpilih?`, () => {
                handleBulkRelease(selectedUnmatchIds);
            });
        });
    }

    const btnIssBulkGagal = document.getElementById('btnIssBulkGagal');
    if (btnIssBulkGagal) {
        btnIssBulkGagal.addEventListener('click', () => {
            if (selectedUnmatchIds.length === 0) return;
            openActionConfirmModal(`Apakah Anda yakin ingin melakukan <strong>Bulk Gagal</strong> pada ${selectedUnmatchIds.length} transaksi terpilih?`, () => {
                handleBulkGagal(selectedUnmatchIds);
            });
        });
    }
}

function handleBulkRelease(selectedIds) {
    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
    const now = new Date();
    const timeStr = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    let count = 0;
    selectedIds.forEach(id => {
        const t = transactions.find(item => item.id === id);
        if (t && (t.flaggingStatus === 'On-Hold' || t.flaggingStatus === 'Ditolak')) {
            t.flaggingStatus = 'Menunggu Persetujuan';
            approvals.push({
                id: 'RQ-' + (10000 + Math.floor(Math.random() * 90000)),
                tanggal: timeStr,
                account: `Release Unmatched: ${t.id}\n${t.merchantName}`,
                admin: 'Dion',
                tipeRequest: 'Release Unmatched',
                status: 'Pending',
                refId: t.id,
                alasan: 'Pengajuan bulk release data unmatched',
                nominal: t.nominal,
                statusRekon: 'Pending'
            });
            count++;
        }
    });

    if (count > 0) {
        localStorage.setItem('paydia_approvals', JSON.stringify(approvals));
        saveTrxToStorage();
        writeLog('Flagging Bulk', `email : dion@paydia.id\naction : Mengajukan bulk release untuk ${count} transaksi unmatched`);
        showToast('Bulk Status Diupdate', `${count} transaksi berhasil diajukan untuk release.`);
        selectedUnmatchIds = [];
        renderActiveTableWithLoading();
    }
}

function handleBulkGagal(selectedIds) {
    let count = 0;
    selectedIds.forEach(id => {
        const t = transactions.find(item => item.id === id);
        if (t && (t.flaggingStatus === 'On-Hold' || t.flaggingStatus === 'Ditolak')) {
            t.flaggingStatus = 'Gagal';
            count++;
        }
    });

    if (count > 0) {
        saveTrxToStorage();
        writeLog('Flagging Bulk', `email : dion@paydia.id\naction : Mengubah status ${count} transaksi unmatched menjadi Gagal`);
        showToast('Bulk Status Diupdate', `${count} transaksi berhasil diubah statusnya menjadi Gagal.`);
        selectedUnmatchIds = [];
        renderActiveTableWithLoading();
    }
}






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
