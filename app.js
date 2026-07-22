


/* ============================================
   Paydia Bisnis – QRIS Auto Reconcile Dashboard
   QRIS Acquirer Page Logic
   ============================================ */

// ── Seed Transactions Database ──
const rawTransactions = [
    // --- ACQUIRER MATCHED ---
    { id: 'TX-ACQ-10001', refNo: 'REF-20260527-010', date: '2026-05-27 08:12:44', nominal: 150000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rcPaydia: '00', rcSwitching: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10002', refNo: 'REF-20260527-011', date: '2026-05-27 08:35:19', nominal: 45000, merchantId: 'MID-88134', merchantName: 'Indomaret', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10003', refNo: 'REF-20260527-012', date: '2026-05-27 09:04:11', nominal: 1250000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rcPaydia: '00', rcSwitching: '00', switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10004', refNo: 'REF-20260527-013', date: '2026-05-27 10:14:02', nominal: 87000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rcPaydia: '00', rcSwitching: '00', switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10005', refNo: 'REF-20260527-014', date: '2026-05-27 11:22:58', nominal: 32000, merchantId: 'MID-88155', merchantName: 'Alfa Mart', rcPaydia: '00', rcSwitching: '00', switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-10006', refNo: 'REF-20260527-015', date: '2026-05-27 14:02:11', nominal: 105000, merchantId: 'MID-88301', merchantName: 'Starbucks', rcPaydia: '00', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    
    // --- ACQUIRER UNMATCHED ---
    { id: 'TX-ACQ-20001', refNo: 'REF-20260527-020', date: '2026-05-27 07:11:02', nominal: 75000, merchantId: 'MID-88134', merchantName: 'Indomaret', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20002', refNo: 'REF-20260527-021', date: '2026-05-27 09:44:32', nominal: 220000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: 'DISP-001' },
    { id: 'TX-ACQ-20003', refNo: 'REF-20260527-022', date: '2026-05-27 10:05:14', nominal: 500000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rcPaydia: '00', rcSwitching: null, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20004', refNo: 'REF-20260527-023', date: '2026-05-27 15:30:19', nominal: 180000, merchantId: 'MID-88301', merchantName: 'Starbucks', rcSwitching: '68', rcPaydia: null, switching: 'Alto', statusRekon: 'Unmatched', label: 'Switching-Only RC68', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-ACQ-20005', refNo: 'REF-20260527-024', date: '2026-05-27 12:08:33', nominal: 120000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', switchingTime: '12:09:33', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-20008', refNo: 'REF-20260527-026', date: '2026-05-27 16:02:09', nominal: 67000, merchantId: 'MID-88301', merchantName: 'Starbucks', rcPaydia: '00', rcSwitching: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
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
    // Validasi Tolak (MID-77021 "Toko Validasi"): Paydia-Only & Beda Status — tolak hanya bila transaksi gagal.
    // VAL-001/002 sukses → tolak DIBLOKIR (ubah status ke Gagal di QRIS MPM dulu). VAL-003/004 sudah gagal → tolak BISA. VAL-005/006 sukses → tolak DIBLOKIR.
    { id: 'TX-VAL-001', refNo: 'REF-20260522-201', date: '2026-05-22 09:00:00', nominal: 320000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '00', rcSwitching: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-VAL-002', refNo: 'REF-20260522-202', date: '2026-05-22 10:30:00', nominal: 145000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '00', rcSwitching: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-VAL-003', refNo: 'REF-20260522-203', date: '2026-05-22 11:15:00', nominal: 530000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '05', rcSwitching: '00', nominalPaydia: 530000, nominalSwitching: 530000, switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-VAL-004', refNo: 'REF-20260522-204', date: '2026-05-22 13:45:00', nominal: 88000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '51', rcSwitching: '00', nominalPaydia: 88000, nominalSwitching: 88000, switching: 'Alto', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-VAL-005', refNo: 'REF-20260522-205', date: '2026-05-22 14:20:00', nominal: 410000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 410000, nominalSwitching: 410000, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Crossborder', disputeRef: null },
    { id: 'TX-VAL-006', refNo: 'REF-20260522-206', date: '2026-05-22 15:50:00', nominal: 67000, merchantId: 'MID-77021', merchantName: 'Toko Validasi', rcPaydia: '00', rcSwitching: '05', nominalPaydia: 67000, nominalSwitching: 67000, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },

    // --- ACQUIRER DECLINED ---
    // Decline = selain RC 00/68. Dua definisi: (a) Paydia failed + switching decline, (b) Paydia gaada + switching decline.
    // (a) Paydia failed (rcPaydia != 00) + switching decline
    { id: 'TX-ACQ-30001', refNo: 'REF-20260527-030', date: '2026-05-27 08:02:11', nominal: 11000, merchantId: 'MID-88134', merchantName: 'Indomaret', rc: '51', rcPaydia: '05', rcSwitching: '51', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-30002', refNo: 'REF-20260527-031', date: '2026-05-27 11:45:00', nominal: 95000, merchantId: 'MID-88129', merchantName: 'Kopi Kenangan', rc: '05', rcPaydia: '14', rcSwitching: '05', switching: 'Rintis', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-30003', refNo: 'REF-20260527-032', date: '2026-05-27 13:18:40', nominal: 240000, merchantId: 'MID-88220', merchantName: 'Sushi Tei', rc: '51', rcPaydia: '51', rcSwitching: '51', switching: 'Artajasa', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    // (b) Paydia gaada (rcPaydia null) + switching decline
    { id: 'TX-ACQ-30004', refNo: 'REF-20260527-033', date: '2026-05-27 09:50:25', nominal: 58000, merchantId: 'MID-88301', merchantName: 'Starbucks', rc: '12', rcPaydia: null, rcSwitching: '12', switching: 'Alto', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ACQ-30005', refNo: 'REF-20260527-034', date: '2026-05-27 15:12:07', nominal: 132000, merchantId: 'MID-88155', merchantName: 'Alfa Mart', rc: '54', rcPaydia: null, rcSwitching: '54', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Acquirer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER MATCHED ---
    { id: 'TX-ISS-10001', refNo: 'REF-20260527-040', date: '2026-05-27 08:05:22', nominal: 24000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10002', refNo: 'REF-20260527-041', date: '2026-05-27 09:12:18', nominal: 155000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10003', refNo: 'REF-20260527-042', date: '2026-05-27 10:20:11', nominal: 60000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcSwitching: '00', rcPaydia: null, switching: 'Alto', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-10004', refNo: 'REF-20260527-043', date: '2026-05-27 13:14:02', nominal: 320000, merchantId: 'MID-99440', merchantName: 'Shell Gandaria', rcSwitching: '00', rcPaydia: null, switching: 'Artajasa', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'CPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER UNMATCHED ---
    { id: 'TX-ISS-20001', refNo: 'REF-20260527-050', date: '2026-05-27 08:22:19', nominal: 89000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', statusRekon: 'Unmatched', label: 'Switching-Only RC00', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20002', refNo: 'REF-20260527-051', date: '2026-05-27 11:05:44', nominal: 45000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcSwitching: '00', rcPaydia: null, switching: 'Jalin', statusRekon: 'Unmatched', label: 'Paydia-Only Success', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20003', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', switchingTime: '12:15:00', statusRekon: 'Matched', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20005', refNo: 'REF-20260527-052', date: '2026-05-27 12:15:00', nominal: 95000, merchantId: 'MID-99120', merchantName: 'Solaria Mall', rcSwitching: '00', rcPaydia: null, switching: 'Rintis', switchingTime: '12:15:22', statusRekon: 'Unmatched', label: 'Double RRN', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20004', refNo: 'REF-20260527-053', date: '2026-05-27 13:40:00', nominal: 140000, nominalPaydia: 140000, nominalSwitching: 140000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcPaydia: '51', rcSwitching: '00', switching: 'Jalin', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    { id: 'TX-ISS-20006', refNo: 'REF-20260527-055', date: '2026-05-27 14:10:00', nominal: 120000, nominalPaydia: 120000, nominalSwitching: 120000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rcPaydia: '00', rcSwitching: '05', switching: 'Artajasa', statusRekon: 'Unmatched', label: 'Beda Status Transaksi', flaggingStatus: 'On-Hold', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null },
    
    // --- ISSUER DECLINED ---
    { id: 'TX-ISS-30001', refNo: 'REF-20260527-060', date: '2026-05-27 07:44:06', nominal: 18000, merchantId: 'MID-99002', merchantName: 'HokBen PIM', rc: '14', switching: 'Jalin', statusRekon: 'Declined', label: 'Match', flaggingStatus: 'Unflagged', tipe: 'Issuer', skema: 'MPM', domestic: 'Domestic', disputeRef: null }
];

// ── Extra seed: 600 unmatched rows (200 each) so bulk Buat Transaksi / Flag Recon /
// Tolak have plenty of eligible data to demo. ponytail: flat generator, no new shape.
(function seedBulkDemoRows() {
    const merchants = [
        { merchantId: 'MID-88129', merchantName: 'Kopi Kenangan' },
        { merchantId: 'MID-88134', merchantName: 'Indomaret' },
        { merchantId: 'MID-88220', merchantName: 'Sushi Tei' },
        { merchantId: 'MID-88301', merchantName: 'Starbucks' },
        { merchantId: 'MID-88155', merchantName: 'Alfa Mart' },
        { merchantId: 'MID-88901', merchantName: 'Matahari Dept Store' }
    ];
    const switchers = ['Rintis', 'Jalin', 'Artajasa', 'Alto'];
    const rows = [];
    let seq = 90000;

    function baseRow(i) {
        const m = merchants[i % merchants.length];
        const sw = switchers[i % switchers.length];
        const day = 23 + (i % 5); // 2026-06-23..27
        const hh = String(7 + (i % 12)).padStart(2, '0');
        const mm = String((i * 7) % 60).padStart(2, '0');
        const ss = String((i * 13) % 60).padStart(2, '0');
        return {
            id: 'TX-ACQ-' + (seq++),
            refNo: 'REF-20260623-' + (900 + i),
            date: `2026-06-${String(day).padStart(2, '0')} ${hh}:${mm}:${ss}`,
            nominal: 25000 + (i % 40) * 15000,
            merchantId: m.merchantId,
            merchantName: m.merchantName,
            switching: sw,
            statusRekon: 'Unmatched',
            flaggingStatus: 'On-Hold',
            tipe: 'Acquirer',
            skema: i % 2 === 0 ? 'MPM' : 'CPM',
            domestic: i % 5 === 0 ? 'Crossborder' : 'Domestic',
            disputeRef: null
        };
    }

    // 200 × Double RRN → eligible buat_trx (+ tolak).
    for (let i = 0; i < 200; i++) {
        const r = baseRow(i);
        r.label = 'Double RRN';
        r.rcSwitching = '00';
        r.rcPaydia = null;
        r.switchingTime = r.date.slice(11) ;
        rows.push(r);
    }
    // 200 × Paydia-Only Success → eligible flag_recon.
    for (let i = 200; i < 400; i++) {
        const r = baseRow(i);
        r.label = 'Paydia-Only Success';
        r.rcPaydia = '00';
        r.rcSwitching = null;
        rows.push(r);
    }
    // 200 × Switching-Only RC00 → eligible tolak.
    for (let i = 400; i < 600; i++) {
        const r = baseRow(i);
        r.label = 'Switching-Only RC00';
        r.rcSwitching = '00';
        r.rcPaydia = null;
        rows.push(r);
    }

    rawTransactions.push.apply(rawTransactions, rows);
})();

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
let activeSubtab = 'acq-match';
let transactions = [];
let disputes = [];
let reconProcesses = [];
let currentPage = 1;
const perPage = 50; // PRD: default 50 baris per halaman
const BULK_MAX = 50; // PRD: maks 50 data per bulk action
let selectedUnmatchIds = [];
let visibleUnmatchedList = [];
let visibleDisputeList = [];

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

// ── Initialize Dashboard ──
function init() {
    try {
        initDatabase();
    } catch (e) {
        console.error("Error in initDatabase:", e);
    }
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
    try {
        loadPermissions();
    } catch (e) {
        console.error("Error in loadPermissions:", e);
    }
    try {
        applyPermissions();
    } catch (e) {
        console.error("Error in applyPermissions:", e);
    }
    try {
        bindEvents();
    } catch (e) {
        console.error("Error in bindEvents:", e);
    }
    try {
        renderSummary();
    } catch (e) {
        console.error("Error in renderSummary:", e);
    }
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam === 'dispute') {
            activeSubtab = 'acq-dispute';
            const matchBtn = document.querySelector('.sub-tab-btn[data-subtab="acq-match"]');
            const disputeBtn = document.querySelector('.sub-tab-btn[data-subtab="acq-dispute"]');
            if (matchBtn) matchBtn.classList.remove('active');
            if (disputeBtn) disputeBtn.classList.add('active');

            const matchPane = document.getElementById('acq-match');
            const disputePane = document.getElementById('acq-dispute');
            if (matchPane) matchPane.classList.remove('active');
            if (disputePane) disputePane.classList.add('active');
        }
        renderActiveTableWithLoading();
    } catch (e) {
        console.error("Error in renderActiveTableWithLoading:", e);
    }
    try {
        initMockDataControl();
    } catch (e) {
        console.error("Error in initMockDataControl:", e);
    }
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
    try {
        initDisputeSearchModal();
    } catch (e) {
        console.error("Error in initDisputeSearchModal:", e);
    }
    try {
        initDisputeBuktiHandlers();
    } catch (e) {
        console.error("Error in initDisputeBuktiHandlers:", e);
    }
}

let mockInterval = null;

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

// Mandatory-note reject modal (single & bulk Tolak). Textarea starts empty;
// confirm button stays disabled until a note is entered.
function openRejectNoteModal(count, onConfirm) {
    const ov = document.getElementById('rejectNoteOverlay');
    const txt = document.getElementById('rejectNoteText');
    const btn = document.getElementById('rejectNoteConfirm');
    const cnt = document.getElementById('rejectNoteCount');
    const cancel = document.getElementById('rejectNoteCancel');
    const close = document.getElementById('rejectNoteClose');
    if (!ov) return;
    txt.value = '';                 // selalu kosong
    cnt.textContent = count;
    btn.disabled = true;            // gate: wajib isi
    ov.classList.add('show');
    const onInput = () => { btn.disabled = txt.value.trim().length === 0; };
    const closeM = () => { ov.classList.remove('show'); txt.removeEventListener('input', onInput); btn.removeEventListener('click', doIt); cancel.removeEventListener('click', closeM); close.removeEventListener('click', closeM); };
    const doIt = () => { const v = txt.value.trim(); if (!v) return; closeM(); onConfirm(v); };
    txt.addEventListener('input', onInput);
    btn.addEventListener('click', doIt);
    cancel.addEventListener('click', closeM);
    close.addEventListener('click', closeM);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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
        // Migrate legacy 'Ada Catatan' rows (status no longer used) back to On-Hold so they can be processed
        transactions.forEach(t => { if (t.flaggingStatus === 'Ada Catatan') t.flaggingStatus = 'On-Hold'; });
        localStorage.setItem('paydia_recon_trx', JSON.stringify(transactions));

        // Load or initialize disputes.
        // PRD: 4 alasan dispute. Auto disputes (1st/2nd chargeback, represent) di-proses sistem -> status
        // otomatis (Done Deduct / Failed Deduct / Transaksi Tidak Ditemukan). Good faith = manual flow (Open).
        const seedDisputes = [
            // 1st chargeback (10)
            { id: 'DISP-001', refId: 'REF-20260520-001', date: '2026-05-28 09:15:00', type: '1st chargeback', switching: 'Jalin', nominal: 220000, status: 'Done Deduct', desc: 'Double payment terdeteksi, saldo merchant terpotong dua kali' },
            { id: 'DISP-002', refId: 'REF-20260520-002', date: '2026-05-28 09:20:00', type: '1st chargeback', switching: 'Artajasa', nominal: 150000, status: 'Done Deduct', desc: 'Debit tanpa otorisasi merchant' },
            { id: 'DISP-003', refId: 'REF-20260520-003', date: '2026-05-28 09:25:00', type: '1st chargeback', switching: 'Rintis', nominal: 75000, status: 'Done Deduct', desc: 'Transaksi tidak dikenal oleh pemegang kartu' },
            { id: 'DISP-004', refId: 'REF-20260520-004', date: '2026-05-28 09:30:00', type: '1st chargeback', switching: 'Alto', nominal: 300000, status: 'Done Deduct', desc: 'Merchant tidak memberikan barang/jasa' },
            { id: 'DISP-005', refId: 'REF-20260520-005', date: '2026-05-28 09:35:00', type: '1st chargeback', switching: 'Jalin', nominal: 95000, status: 'Failed Deduct', desc: 'Nominal settlement lebih kecil dari nominal dispute' },
            { id: 'DISP-006', refId: 'REF-20260520-006', date: '2026-05-28 09:40:00', type: '1st chargeback', switching: 'Artajasa', nominal: 180000, status: 'Failed Deduct', desc: 'Rekening merchant tidak mencukupi' },
            { id: 'DISP-007', refId: 'REF-20260520-007', date: '2026-05-28 09:45:00', type: '1st chargeback', switching: 'Rintis', nominal: 500000, status: 'Failed Deduct', desc: 'Gagal debit, saldo tidak cukup' },
            { id: 'DISP-008', refId: 'REF-20260520-008', date: '2026-05-28 09:50:00', type: '1st chargeback', switching: 'Alto', nominal: 45000, status: 'Transaksi Tidak Ditemukan', desc: 'Tidak ada transaksi settlement reguler sebagai lawan dispute' },
            { id: 'DISP-009', refId: 'REF-20260520-009', date: '2026-05-28 09:55:00', type: '1st chargeback', switching: 'Jalin', nominal: 130000, status: 'Transaksi Tidak Ditemukan', desc: 'Transaksi tidak ditemukan di sistem Paydia' },
            { id: 'DISP-010', refId: 'REF-20260520-010', date: '2026-05-28 10:00:00', type: '1st chargeback', switching: 'Artajasa', nominal: 260000, status: 'Transaksi Tidak Ditemukan', desc: 'ID transaksi tidak valid dalam periode rekon' },
            // 2nd chargeback (10)
            { id: 'DISP-011', refId: 'REF-20260521-001', date: '2026-05-29 08:10:00', type: '2nd chargeback', switching: 'Jalin', nominal: 310000, status: 'Done Deduct', desc: 'Bukti 2nd chargeback diterima, merchant terbukti salah' },
            { id: 'DISP-012', refId: 'REF-20260521-002', date: '2026-05-29 08:15:00', type: '2nd chargeback', switching: 'Rintis', nominal: 85000, status: 'Done Deduct', desc: 'Verifikasi pihak ketiga konfirmasi 2nd chargeback' },
            { id: 'DISP-013', refId: 'REF-20260521-003', date: '2026-05-29 08:20:00', type: '2nd chargeback', switching: 'Artajasa', nominal: 420000, status: 'Done Deduct', desc: 'Settlement berhasil dikurangi untuk 2nd chargeback' },
            { id: 'DISP-014', refId: 'REF-20260521-004', date: '2026-05-29 08:25:00', type: '2nd chargeback', switching: 'Alto', nominal: 165000, status: 'Done Deduct', desc: 'Dispute kedua disetujui, dana dikembalikan ke issuer' },
            { id: 'DISP-015', refId: 'REF-20260521-005', date: '2026-05-29 08:30:00', type: '2nd chargeback', switching: 'Jalin', nominal: 55000, status: 'Failed Deduct', desc: 'Nominal settlement tidak mencukupi untuk debit' },
            { id: 'DISP-016', refId: 'REF-20260521-006', date: '2026-05-29 08:35:00', type: '2nd chargeback', switching: 'Rintis', nominal: 195000, status: 'Failed Deduct', desc: 'Gagal pemotongan, saldo harian habis' },
            { id: 'DISP-017', refId: 'REF-20260521-007', date: '2026-05-29 08:40:00', type: '2nd chargeback', switching: 'Artajasa', nominal: 720000, status: 'Failed Deduct', desc: 'Rekening ditutup sementara karena audit' },
            { id: 'DISP-018', refId: 'REF-20260521-008', date: '2026-05-29 08:45:00', type: '2nd chargeback', switching: 'Alto', nominal: 38000, status: 'Transaksi Tidak Ditemukan', desc: 'Tidak ditemukan transaksi referensi untuk 2nd chargeback' },
            { id: 'DISP-019', refId: 'REF-20260521-009', date: '2026-05-29 08:50:00', type: '2nd chargeback', switching: 'Jalin', nominal: 275000, status: 'Transaksi Tidak Ditemukan', desc: 'RRN tidak terdaftar dalam sistem switching' },
            { id: 'DISP-020', refId: 'REF-20260521-010', date: '2026-05-29 08:55:00', type: '2nd chargeback', switching: 'Rintis', nominal: 112000, status: 'Transaksi Tidak Ditemukan', desc: 'Transaksi kadaluarsa untuk periode dispute' },
            // represent (10)
            { id: 'DISP-021', refId: 'REF-20260522-001', date: '2026-05-30 07:00:00', type: 'represent', switching: 'Jalin', nominal: 450000, status: 'Done Deduct', desc: 'Represent diterima, settlement merchant ditambah kembali' },
            { id: 'DISP-022', refId: 'REF-20260522-002', date: '2026-05-30 07:05:00', type: 'represent', switching: 'Artajasa', nominal: 88000, status: 'Done Deduct', desc: 'Bukti pengiriman diterima, chargeback dibatalkan' },
            { id: 'DISP-023', refId: 'REF-20260522-003', date: '2026-05-30 07:10:00', type: 'represent', switching: 'Rintis', nominal: 215000, status: 'Done Deduct', desc: 'Merchant memberikan bukti transaksi yang valid' },
            { id: 'DISP-024', refId: 'REF-20260522-004', date: '2026-05-30 07:15:00', type: 'represent', switching: 'Alto', nominal: 67000, status: 'Done Deduct', desc: 'Represent dikonfirmasi, dana kembali ke merchant' },
            { id: 'DISP-025', refId: 'REF-20260522-005', date: '2026-05-30 07:20:00', type: 'represent', switching: 'Jalin', nominal: 385000, status: 'Done Deduct', desc: 'Issuer setuju dengan bukti merchant, represent berhasil' },
            { id: 'DISP-026', refId: 'REF-20260522-006', date: '2026-05-30 07:25:00', type: 'represent', switching: 'Artajasa', nominal: 120000, status: 'Failed Deduct', desc: 'Bukti tidak lengkap, represent gagal diproses' },
            { id: 'DISP-027', refId: 'REF-20260522-007', date: '2026-05-30 07:30:00', type: 'represent', switching: 'Rintis', nominal: 540000, status: 'Failed Deduct', desc: 'Deadline represent terlewati' },
            { id: 'DISP-028', refId: 'REF-20260522-008', date: '2026-05-30 07:35:00', type: 'represent', switching: 'Alto', nominal: 95000, status: 'Failed Deduct', desc: 'Merchant tidak merespons dalam waktu yang ditentukan' },
            { id: 'DISP-029', refId: 'REF-20260522-009', date: '2026-05-30 07:40:00', type: 'represent', switching: 'Jalin', nominal: 170000, status: 'Failed Deduct', desc: 'Dokumen tidak sesuai format yang diminta' },
            { id: 'DISP-030', refId: 'REF-20260522-010', date: '2026-05-30 07:45:00', type: 'represent', switching: 'Artajasa', nominal: 330000, status: 'Failed Deduct', desc: 'Verifikasi gagal, represent ditolak secara sistem' },
            // good faith pemotongan (10)
            { id: 'DISP-031', refId: 'TX-BULK-001', date: '2026-05-28 11:00:00', type: 'good faith pemotongan', switching: 'Jalin', nominal: 85000, status: 'Open', desc: 'Transaksi switching sukses tapi tidak ada di Paydia', tipeDispute: 'Pemotongan' },
            { id: 'DISP-032', refId: 'TX-BULK-002', date: '2026-05-28 11:05:00', type: 'good faith pemotongan', switching: 'Artajasa', nominal: 120000, status: 'Open', desc: 'Merchant dikenakan potongan karena selisih rekon', tipeDispute: 'Pemotongan' },
            { id: 'DISP-033', refId: 'TX-BULK-003', date: '2026-05-28 11:10:00', type: 'good faith pemotongan', switching: 'Rintis', nominal: 200000, status: 'Open', desc: 'Dana dikembalikan ke konsumen, merchant dipotong', tipeDispute: 'Pemotongan' },
            { id: 'DISP-034', refId: 'TX-BULK-004', date: '2026-05-28 11:15:00', type: 'good faith pemotongan', switching: 'Alto', nominal: 45000, status: 'Transaksi Terbuat', desc: 'Proses pemotongan settlement sedang berjalan', tipeDispute: 'Pemotongan' },
            { id: 'DISP-035', refId: 'TX-BULK-005', date: '2026-05-28 11:20:00', type: 'good faith pemotongan', switching: 'Jalin', nominal: 350000, status: 'Transaksi Terbuat', desc: 'Buat transaksi untuk pemotongan good faith', tipeDispute: 'Pemotongan' },
            { id: 'DISP-036', refId: 'TX-BULK-006', date: '2026-05-28 11:25:00', type: 'good faith pemotongan', switching: 'Artajasa', nominal: 75000, status: 'Transaksi Terbuat', desc: 'Buat transaksi pemotongan good faith sedang diproses', tipeDispute: 'Pemotongan' },
            { id: 'DISP-037', refId: 'TX-BULK-007', date: '2026-05-28 11:30:00', type: 'good faith pemotongan', switching: 'Rintis', nominal: 580000, status: 'Flag Recon', desc: 'Pemotongan sudah di-flag recon, menunggu settle', tipeDispute: 'Pemotongan' },
            { id: 'DISP-038', refId: 'TX-BULK-008', date: '2026-05-28 11:35:00', type: 'good faith pemotongan', switching: 'Alto', nominal: 95000, status: 'Flag Recon', desc: 'Good faith pemotongan di-flag recon', tipeDispute: 'Pemotongan' },
            { id: 'DISP-039', refId: 'TX-BULK-009', date: '2026-05-28 11:40:00', type: 'good faith pemotongan', switching: 'Jalin', nominal: 160000, status: 'Flag Settle', desc: 'Settlement pemotongan diflag untuk diproses', tipeDispute: 'Pemotongan' },
            { id: 'DISP-040', refId: 'TX-BULK-010', date: '2026-05-28 11:45:00', type: 'good faith pemotongan', switching: 'Artajasa', nominal: 420000, status: 'Flag Settle', desc: 'Good faith pemotongan menunggu konfirmasi settlement', tipeDispute: 'Pemotongan' },
            // good faith penambahan (10)
            { id: 'DISP-041', refId: 'TX-BULK-021', date: '2026-05-28 13:00:00', type: 'good faith penambahan', switching: 'Jalin', nominal: 180000, status: 'Open', desc: 'Dana terjebak di switching, perlu penambahan ke merchant', tipeDispute: 'Penambahan' },
            { id: 'DISP-042', refId: 'TX-BULK-022', date: '2026-05-28 13:05:00', type: 'good faith penambahan', switching: 'Rintis', nominal: 310000, status: 'Open', desc: 'Merchant tidak menerima settlement yang seharusnya', tipeDispute: 'Penambahan' },
            { id: 'DISP-043', refId: 'TX-BULK-023', date: '2026-05-28 13:10:00', type: 'good faith penambahan', switching: 'Jalin', nominal: 75000, status: 'Open', desc: 'Selisih nominal antara Paydia dan switching, merchant perlu ditambah', tipeDispute: 'Penambahan' },
            { id: 'DISP-044', refId: 'TX-BULK-024', date: '2026-05-28 13:15:00', type: 'good faith penambahan', switching: 'Alto', nominal: 550000, status: 'Transaksi Terbuat', desc: 'Buat transaksi penambahan untuk good faith', tipeDispute: 'Penambahan' },
            { id: 'DISP-045', refId: 'TX-BULK-025', date: '2026-05-28 13:20:00', type: 'good faith penambahan', switching: 'Artajasa', nominal: 42000, status: 'Transaksi Terbuat', desc: 'Transaksi penambahan dalam antrian approval', tipeDispute: 'Penambahan' },
            { id: 'DISP-046', refId: 'TX-BULK-026', date: '2026-05-28 13:25:00', type: 'good faith penambahan', switching: 'Rintis', nominal: 220000, status: 'Transaksi Terbuat', desc: 'Buat transaksi penambahan good faith sedang diproses', tipeDispute: 'Penambahan' },
            { id: 'DISP-047', refId: 'TX-BULK-027', date: '2026-05-28 13:30:00', type: 'good faith penambahan', switching: 'Jalin', nominal: 890000, status: 'Flag Recon', desc: 'Penambahan sudah di-flag recon, menunggu settle', tipeDispute: 'Penambahan' },
            { id: 'DISP-048', refId: 'TX-BULK-028', date: '2026-05-28 13:35:00', type: 'good faith penambahan', switching: 'Alto', nominal: 135000, status: 'Flag Recon', desc: 'Good faith penambahan di-flag recon', tipeDispute: 'Penambahan' },
            { id: 'DISP-049', refId: 'TX-BULK-029', date: '2026-05-28 13:40:00', type: 'good faith penambahan', switching: 'Artajasa', nominal: 270000, status: 'Flag Settle', desc: 'Penambahan diflag untuk settlement', tipeDispute: 'Penambahan' },
            { id: 'DISP-050', refId: 'TX-BULK-030', date: '2026-05-28 13:45:00', type: 'good faith penambahan', switching: 'Rintis', nominal: 1500000, status: 'Flag Settle', desc: 'Good faith penambahan menunggu final settlement', tipeDispute: 'Penambahan' },
        ];
        const savedDis = localStorage.getItem('paydia_disputes');
        if (savedDis) {
            disputes = JSON.parse(savedDis);
            // Merge newer seed disputes (represent / 2nd chargeback / auto-status examples) into existing storage
            seedDisputes.forEach(sd => {
                const i = disputes.findIndex(x => x.id === sd.id);
                if (i === -1) disputes.push(sd);
                else if (disputes[i].status === 'Open' && !(sd.type || '').includes('good faith')) {
                    disputes[i] = { ...disputes[i], type: sd.type, status: sd.status }; // fix legacy auto-dispute seeded as Open
                }
            });
        } else {
            disputes = [...seedDisputes];
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
        if (t.tipe !== 'Acquirer') return false;
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
        // Check if related transaction is Acquirer
        const t = transactions.find(trx => trx.id === d.refId || trx.refNo === d.refId);
        if (!t || t.tipe !== 'Acquirer') return false;
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
    const finalStatus = getFinalizationStatus('Acquirer');
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
    
    const pane = document.getElementById('acq-match');
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
                message = '<strong>Sesi Rekonsiliasi Acquirer Terkunci:</strong> Pengajuan finalisasi sedang menunggu persetujuan dari Management.';
            } else if (finalStatus === 'Approved') {
                iconClass = 'fa-check-circle';
                message = '<strong>Sesi Rekonsiliasi Acquirer Selesai:</strong> Hasil rekonsiliasi telah disetujui oleh Management.';
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

    if (activeSubtab === 'acq-match') { tbody = document.getElementById('acqMatchTableBody'); colCount = 8; }
    else if (activeSubtab === 'acq-unmatch') { tbody = document.getElementById('acqUnmatchTableBody'); colCount = 11; }
    else if (activeSubtab === 'acq-decline') { tbody = document.getElementById('acqDeclineTableBody'); colCount = 8; }
    else if (activeSubtab === 'acq-dispute') { tbody = document.getElementById('acqDisputeTableBody'); colCount = 9; }

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

// Show only the filter sections relevant to the active subtab
function syncFilterContext() {
    const showUnmatch = activeSubtab === 'acq-unmatch';
    const showDispute = activeSubtab === 'acq-dispute';
    document.querySelectorAll('.filter-ctx-unmatch').forEach(el => el.classList.toggle('filter-ctx-visible', showUnmatch));
    document.querySelectorAll('.filter-ctx-dispute').forEach(el => el.classList.toggle('filter-ctx-visible', showDispute));
}

// Reset all reconcile filters + search to default (called on subtab switch and Clear All)
function resetFilters() {
    currentPage = 1;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const sd = document.getElementById('filterStartDate'); if (sd) sd.value = todayStr;
    const ed = document.getElementById('filterEndDate'); if (ed) ed.value = todayStr;
    const v = document.getElementById('filterVendor'); if (v) v.selectedIndex = 0;
    const lk = document.getElementById('filterLokasi'); if (lk) lk.selectedIndex = 0;
    const tx = document.getElementById('filterTxId'); if (tx) tx.value = '';
    const mi = document.getElementById('filterMerchantId'); if (mi) mi.value = '';
    ['chkStatusSukses', 'chkStatusGagal', 'chkStatusPending', 'chkKategoriTopup', 'chkKategoriUser']
        .forEach(idv => { const el = document.getElementById(idv); if (el) el.checked = false; });
    document.querySelectorAll('.chk-unmatch-status, .chk-unmatch-rc, .chk-unmatch-tipe, .chk-dispute-status, .chk-dispute-alasan')
        .forEach(c => { c.checked = false; });
    if (searchInput) searchInput.value = '';
}

// A transaction is "gagal" when Paydia RC is present and not sukses ('00') / pending ('68').
function isTrxGagal(t) {
    return !!t && !!t.rcPaydia && t.rcPaydia !== '00' && t.rcPaydia !== '68';
}

// Collect checked values for a given checkbox class
function checkedValues(cls) {
    return [...document.querySelectorAll('.' + cls + ':checked')].map(c => c.value);
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

    // Reconcile Tables (Acquirer)
    let tbody;
    let category = 'Acquirer';
    let sub = activeSubtab;

    // Unmatch-specific multi-select filters (PRD: Status / RC / Tipe Unmatch)
    const unmatchStatusVals = checkedValues('chk-unmatch-status');
    const unmatchRcVals = checkedValues('chk-unmatch-rc');
    const unmatchTipeVals = checkedValues('chk-unmatch-tipe');

    // Filter transaction list
    let filtered = transactions.filter(t => {
        if (t.tipe !== category) return false;

        // Sub-tabs filters
        if (sub === 'acq-match' && t.statusRekon !== 'Matched') return false;
        if (sub === 'acq-unmatch' && t.statusRekon !== 'Unmatched') return false;
        if (sub === 'acq-decline' && t.statusRekon !== 'Declined') return false;

        // Unmatch checklist filters
        if (sub === 'acq-unmatch') {
            if (unmatchStatusVals.length) {
                const flag = t.flaggingStatus === 'On-Hold' || !t.flaggingStatus || t.flaggingStatus === 'Unmatch' ? 'On-Hold' : t.flaggingStatus;
                if (!unmatchStatusVals.includes(flag)) return false;
            }
            if (unmatchRcVals.length) {
                const rc = t.rcSwitching || t.rc || '';
                let rcBucket = rc === '00' ? '00' : (rc === '68' ? '68' : 'other');
                if (!unmatchRcVals.includes(rcBucket)) return false;
            }
            if (unmatchTipeVals.length && !unmatchTipeVals.includes(t.label)) return false;
        }

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

        // Search text: RRN (refNo) / ID / Merchant ID / Merchant Name
        if (searchVal
            && !t.refNo.toLowerCase().includes(searchVal)
            && !t.id.toLowerCase().includes(searchVal)
            && !(t.merchantId || '').toLowerCase().includes(searchVal)
            && !(t.merchantName || '').toLowerCase().includes(searchVal)) return false;

        return true;
    });
    window.currentExportData = filtered;

    if (sub === 'acq-match') {
        tbody = document.getElementById('acqMatchTableBody');
        renderMatchRows(filtered, tbody);
    } else if (sub === 'acq-unmatch') {
        tbody = document.getElementById('acqUnmatchTableBody');
        renderUnmatchRows(filtered, tbody);
    } else if (sub === 'acq-decline') {
        tbody = document.getElementById('acqDeclineTableBody');
        renderDeclineRows(filtered, tbody);
    } else if (sub === 'acq-dispute') {
        tbody = document.getElementById('acqDisputeTableBody');
        renderDisputeRows(tbody);
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

    const finalStatus = getFinalizationStatus('Acquirer');
    let statusLabel = 'Belum Finalisasi';
    let statusClass = '';
    if (finalStatus === 'Pending') { statusLabel = 'Menunggu Approval'; statusClass = 'status-proses'; }
    else if (finalStatus === 'Approved') { statusLabel = 'Selesai Approval'; statusClass = 'status-sukses'; }
    else if (finalStatus === 'Rejected') { statusLabel = 'Ditolak'; statusClass = 'status-gagal'; }
    else { statusLabel = 'Belum Finalisasi'; statusClass = ''; }

    const { pageItems, startIdx } = paginate(list);
    pageItems.forEach((t, i) => {
        const idx = startIdx + i;
        const tr = document.createElement('tr');

        let rowStatusLabel = statusLabel;
        let rowStatusClass = statusClass;
        
        // If not finalized yet, show examples of other statuses on the first few rows
        if (finalStatus === 'None' || !finalStatus) {
            if (idx === 1) {
                rowStatusLabel = 'Menunggu Approval';
                rowStatusClass = 'status-proses';
            } else if (idx === 2) {
                rowStatusLabel = 'Selesai Approval';
                rowStatusClass = 'status-sukses';
            } else {
                rowStatusLabel = 'Belum Finalisasi';
                rowStatusClass = '';
            }
        }
        
        const statusCell = rowStatusLabel === 'Belum Finalisasi'
            ? `<span class="status-badge" style="background: rgba(148, 163, 184, 0.1); color: var(--text-secondary); border: 1px solid rgba(148, 163, 184, 0.2);">${rowStatusLabel}</span>`
            : `<span class="status-badge ${rowStatusClass}">${rowStatusLabel}</span>`;

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
}

function renderUnmatchRows(list, tbody) {
    // Action-first bulk mode: show only rows eligible for the chosen action.
    const bulkOn = activeBulkAction && bulkContext() === 'unmatch';
    if (bulkOn) list = list.filter(t => isUnmatchEligible(t, activeBulkAction));
    const checkTh = document.getElementById('acqUnmatchCheckTh');
    if (checkTh) checkTh.style.display = bulkOn ? '' : 'none';
    tbody.innerHTML = '';

    if (list.length === 0) {
        visibleUnmatchedList = [];
        updateBulkActionBar();
        // If unmatched data exists but is filtered/searched out -> "No Data"; if genuinely empty -> populate prompt.
        const anyUnmatchedExists = transactions.some(t => t.tipe === 'Acquirer' && t.statusRekon === 'Unmatched');
        if (anyUnmatchedExists) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="15" style="text-align:center; padding: 40px 16px;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px 0;">
                            <i class="fas fa-filter" style="color: var(--text-muted); font-size: 1.5rem;"></i>
                            <span style="color: var(--text-muted); font-size: 0.9rem;">No Data — tidak ada transaksi yang cocok dengan filter / pencarian</span>
                        </div>
                    </td>
                </tr>
            `;
            updatePaginationInfo(0);
            return;
        }
        tbody.innerHTML = `
            <tr>
                <td colspan="15" style="text-align:center; padding: 40px 16px;">
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

    const { pageItems, startIdx } = paginate(list);
    visibleUnmatchedList = pageItems;
    updateBulkActionBar();
    pageItems.forEach((t, i) => {
        const idx = startIdx + i;
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
        else if (t.flaggingStatus === 'Ditolak') flagClass = 'status-gagal';
        else if (t.flaggingStatus === 'Transaksi Terbuat') flagClass = 'status-dikembalikan';
        else flagClass = 'status-proses';

        let actionCell = `<button class="btn-action-dots btn-flag-menu-trigger" data-id="${t.id}" data-label="${t.label}"><i class="fas fa-ellipsis-v"></i></button>`;

        const nominalTotal = t.nominal;
        const nominalTip = Math.floor(t.nominal * 0.05);
        const nominalMdr = Math.floor(t.nominal * 0.007);
        const nominalTx = nominalTotal + nominalTip + nominalMdr;

        const bulkOn = activeBulkAction && bulkContext() === 'unmatch';
        const isChecked = selectedUnmatchIds.includes(t.id);
        const checkboxCell = bulkOn
            ? `<td class="col-checkbox" style="text-align: center;"><input type="checkbox" class="unmatch-row-checkbox" data-id="${t.id}" ${isChecked ? 'checked' : ''}></td>`
            : '';

        tr.innerHTML = `
            ${checkboxCell}
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
}

function renderDeclineRows(list, tbody) {
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center; padding: 40px 16px;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px 0;">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Tidak ada transaksi decline (Data Kosong)</span>
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

    const { pageItems, startIdx } = paginate(list);
    pageItems.forEach((t, i) => {
        const idx = startIdx + i;
        const tr = document.createElement('tr');
        const nominalTotal = t.nominal;
        const nominalTip = Math.floor(t.nominal * 0.05);
        const nominalMdr = Math.floor(t.nominal * 0.007);
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
            <td><span class="badge-rc-decline">${t.rc}</span></td>
            <td>${t.switching}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Slice a list to the current page; render pagination controls. Returns page slice + global offset.
function paginate(list) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const startIdx = (currentPage - 1) * perPage;
    const pageItems = list.slice(startIdx, startIdx + perPage);
    renderPaginationControls(total, totalPages, startIdx, pageItems.length);
    return { pageItems, startIdx };
}

function renderPaginationControls(total, totalPages, startIdx, shown) {
    const info = document.getElementById('paginationInfo');
    if (info) info.textContent = total > 0 ? `${startIdx + 1} - ${startIdx + shown} of ${total}` : '0 - 0 of 0';
    const container = document.getElementById('pagination');
    if (!container) return;
    container.querySelectorAll('.page-num').forEach(b => b.remove());
    const nextBtn = document.getElementById('nextPage');
    const maxBtns = 7;
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + maxBtns - 1);
    start = Math.max(1, end - maxBtns + 1);
    const frag = document.createDocumentFragment();
    for (let p = start; p <= end; p++) {
        const b = document.createElement('button');
        b.className = 'page-btn page-num' + (p === currentPage ? ' active' : '');
        b.textContent = p;
        b.dataset.page = p;
        frag.appendChild(b);
    }
    if (nextBtn) container.insertBefore(frag, nextBtn);
    const prevBtn = document.getElementById('prevPage');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// Empty-table helper: reset pagination display.
function updatePaginationInfo(count) {
    renderPaginationControls(count, 1, 0, count);
}

// ── Open Drill-down Modal ──
function openDetailModal(trxId) {
    let t = transactions.find(item => item.id === trxId || item.refNo === trxId);
    if (!t) {
        // Auto-processed disputes (1st/2nd chargeback, represent) have no separate transaction
        // record — their refId is the RRN. Synthesize a transaction-like object from the dispute
        // so its detail is viewable. Both Paydia & Switching sides exist (except "Transaksi Tidak Ditemukan").
        const d = disputes.find(x => x.id === trxId || x.refId === trxId);
        if (d) {
            t = {
                id: d.refId || d.id,
                refNo: (String(d.refId || '').startsWith('REF') ? d.refId : (d.rrn || d.refId || d.id)),
                date: d.date,
                nominal: d.nominal,
                merchantId: d.merchantId || ('MID-' + String(d.refId || d.id).replace(/\D/g, '').slice(-5)),
                merchantName: d.merchantName || d.merchant || 'Merchant',
                rc: '00', rcPaydia: '00', rcSwitching: '00',
                switching: d.switching || 'Rintis',
                statusRekon: 'Matched',
                label: 'Match',
                domestic: d.domestic || 'Domestic',
                tipe: 'Acquirer', skema: 'MPM'
            };
        }
    }
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

    const dis = disputes.find(x => x.refId === t.id || x.refId === t.refNo);
    const disStatus = dis ? dis.status : '';

    let paydiaContent = '';
    // Switching-Only & Double RRN: data only in switching, no Paydia data
    const hidePaydia = t.label.startsWith('Switching-Only') || t.label === 'Double RRN';
    if (hidePaydia) {
        paydiaContent = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; font-family: 'Inter', sans-serif;">
                <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> Tidak ada data Paydia (${t.label === 'Double RRN' ? 'Double RRN' : 'Switching-Only'})
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
                    <td class="detail-value">${t.merchantId || ('M' + t.refNo.substring(0, 8) + 'ID')}</td>
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
                    <td class="detail-label">Lokasi</td>
                    <td class="detail-value">${t.domestic}</td>
                </tr>
                <tr>
                    <td class="detail-label">Tanggal Transaksi</td>
                    <td class="detail-value">${(t.date || '').substring(0, 10).replace(/-/g, '/')}</td>
                </tr>
                <tr>
                    <td class="detail-label">Jam Transaksi</td>
                    <td class="detail-value">${(t.date || '').substring(11)}</td>
                </tr>
                <tr>
                    <td class="detail-label">Status Transaksi</td>
                    <td class="detail-value">${statusBadgeFromRc(paydiaRc)}</td>
                </tr>
                ${dis && (dis.type || '').includes('good faith') ? `
                <tr>
                    <td class="detail-label">Bukti</td>
                    <td class="detail-value">${dis.buktiUrl
                        ? `<button onclick="(function(){const o=document.getElementById('buktiPreviewOverlay');document.getElementById('buktiPreviewImg').src='${dis.buktiUrl}';o.style.display='flex';o.classList.add('show');})()" class="flag-btn settle" style="font-size:0.78rem;padding:4px 10px;"><i class='fas fa-eye'></i> Lihat</button>`
                        : '<span style="color:var(--text-muted);font-size:0.82rem;">Belum diupload</span>'}</td>
                </tr>` : ''}
            </table>
        `;
    }

    let switchingContent = '';
    const hideSwitching = t.label.startsWith('Paydia-Only') || disStatus === 'Transaksi Tidak Ditemukan';
    if (hideSwitching) {
        switchingContent = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; font-family: 'Inter', sans-serif;">
                <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i> Tidak ada data Switching${disStatus === 'Transaksi Tidak Ditemukan' ? ' (Transaksi Tidak Ditemukan)' : ' (Paydia-Only)'}
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
    const hasFailed = checkHasFailedProcess('Acquirer');
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
    
    const hasFailed = checkHasFailedProcess('Acquirer');
    const statusMsg = document.getElementById('rerunStatusMsg');
    if (statusMsg) statusMsg.style.display = 'none';

    if (rerunConfigOverlay) {
        rerunConfigOverlay.classList.add('show');
    }
}

function startRerunMatching() {
    const hasFailed = checkHasFailedProcess('Acquirer');
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
    
    const latestFile = getLatestProcessFile('Acquirer');
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
        const suspect = transactions.find(t => t.id === 'TX-ACQ-20003');
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
    const switchingVal = document.getElementById('filterVendor').value;
    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;

    let filtered = transactions.filter(t => {
        if (t.tipe !== 'Acquirer') return false;
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
        account: `Sesi Rekonsiliasi QRIS Acquirer: ${dateVal}`,
        admin: 'Dion',
        tipeRequest: 'Finalize Reconcile',
        status: 'Pending',
        refId: getRefId('Acquirer'),
        alasan: 'Hasil rekonsiliasi siap diproses',
        nominal: 245890000,
        statusRekon: 'Pending'
    };

    approvals.unshift(appEntry);
    localStorage.setItem('paydia_approvals', JSON.stringify(approvals));

    writeLog('Finalisasi', `email : dion@paydia.id\naction : Mengajukan finalisasi rekonsiliasi Acquirer sesi ${dateVal}`);
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

            resetBulkMode();
            resetFilters();
            syncBulkActionButton();
            syncFilterContext();
            renderActiveTableWithLoading();
        });
    });
    syncFilterContext();
    syncBulkActionButton();

    // Dispute tab action buttons
    const btnImportDispute = document.getElementById('btnImportDispute');
    const btnAddDispute = document.getElementById('btnAddDispute');
    const btnUploadTemplate = document.getElementById('btnUploadTemplate');
    const disputeTemplateFile = document.getElementById('disputeTemplateFile');
    if (btnImportDispute) {
        btnImportDispute.addEventListener('click', () => {
            writeLog('Import Dispute', `email : dion@paydia.id\naction : Import data dispute`);
            showToast('Import Data Dispute', 'File data dispute berhasil diimport ke sistem.');
        });
    }
    if (btnAddDispute) {
        btnAddDispute.addEventListener('click', () => {
            openDisputeSearchModal();
        });
    }
    if (btnUploadTemplate && disputeTemplateFile) {
        btnUploadTemplate.addEventListener('click', () => {
            disputeTemplateFile.click();
        });
        disputeTemplateFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                showToast('Upload Template', `Template dispute "${file.name}" berhasil diunggah.`);
                writeLog('Upload Template Dispute', `email : dion@paydia.id\naction : Mengunggah template dispute ${file.name}`);
            }
        });
    }

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
            currentPage = 1;
            renderActiveTableWithLoading();
            filterPanel.classList.remove('open');
            filterBtn.classList.remove('active');
        });
    }

    // Clear All button click (Reset)
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            resetFilters();
            showToast('Filter Direset', 'Semua filter pencarian direset.');
            renderActiveTableWithLoading();
        });
    }

    searchBtn.addEventListener('click', () => {
        currentPage = 1;
        renderActiveTableWithLoading();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { currentPage = 1; renderActiveTableWithLoading(); }
    });
    // Live search: filter as the user types (RRN / MID).
    searchInput.addEventListener('input', () => { currentPage = 1; renderTableData(); });

    // Pagination controls (prev / next / numbered)
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const paginationEl = document.getElementById('pagination');
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTableData(); } });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { currentPage++; renderTableData(); });
    if (paginationEl) paginationEl.addEventListener('click', (e) => {
        const b = e.target.closest('.page-num');
        if (b) { currentPage = parseInt(b.dataset.page, 10); renderTableData(); }
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
                        writeLog('Ekspor Data Tabel', `email : dion@paydia.id\naction : Mengeksport data ${subtabName} Acquirer sesi ${dateVal} (Vendor: ${vendorVal})`);
                        showToast('Export Selesai', `File export QRIS_Acquirer_${subtabName.replace(/\s+/g, '_')}_${dateVal}.xlsx berhasil diunduh.`);
                    if(typeof window.showExcelSimulationModal === "function") window.showExcelSimulationModal(window.currentExportData || [], subtabName);
}, 300);
                }
            }, 100);
        } else {
            writeLog('Ekspor Data Tabel', `email : dion@paydia.id\naction : Mengeksport data ${subtabName} Acquirer sesi ${dateVal} (Vendor: ${vendorVal})`);
            showToast('Export Selesai', `File export QRIS_Acquirer_${subtabName.replace(/\s+/g, '_')}_${dateVal}.xlsx berhasil diunduh.`);
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
                const d = disputes.find(item => item.id === id);
                const pendingDispute = (() => {
                    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                    return approvals.some(a => a.refId == id && a.status === 'Pending');
                })();
                let disputeActionHtml = '';
                if (d && !pendingDispute) {
                    // PRD: only Good Faith disputes get the manual flow (Buat Transaksi/Flag Settle/Tolak).
                    // Auto disputes (1st/2nd chargeback, represent) are system-processed -> only Lihat Catatan.
                    const isGoodFaith = (d.type || '').toLowerCase().includes('good faith');
                    if (isGoodFaith) {
                        if (d.status === 'Ditolak') {
                            // only Lihat Catatan
                        } else if (d.status === 'Transaksi Terbuat') {
                            disputeActionHtml += `<button class="dropdown-item btn-dispute-flag-settle" data-id="${id}">Flag Settle</button>`;
                        } else if (d.status === 'Open' || !d.status) {
                            disputeActionHtml += `<button class="dropdown-item btn-dispute-buat-trx" data-id="${id}">Buat Transaksi</button>`;
                            disputeActionHtml += `<button class="dropdown-item btn-dispute-tolak" data-id="${id}" style="color: var(--danger);">Tolak</button>`;
                        }
                    }
                }
                menu.innerHTML = `
                    ${disputeActionHtml}
                    <button class="dropdown-item btn-edit-dispute" data-id="${id}">
                        <i class="fas fa-clipboard-check" style="color: var(--primary); width: 16px; margin-right: 4px;"></i> Lihat Catatan
                    </button>
                `;
            } else {
                const t = transactions.find(item => item.id === id);
                let actionHtml = '';
                if (t) {
                    const labelVal = t.label || '';
                    if (t.flaggingStatus === 'Ditolak') {
                        // no extra buttons
                    } else if (t.flaggingStatus === 'Flag Settle' || t.flaggingStatus === 'Cancelled') {
                        // no extra buttons
                    } else if (t.flaggingStatus === 'On-Hold' || !t.flaggingStatus || t.flaggingStatus === 'Unmatch') {
                        // PRD: Switching-Only/Double RRN have no Paydia record yet -> Buat Transaksi first.
                        // Paydia-Only/Beda Status already exist -> Flag Recon. Tolak available only at On-Hold.
                        if (labelVal.includes('Switching') || labelVal.includes('Double')) {
                            actionHtml += `<button class="dropdown-item btn-unmatch-buat-trx" data-id="${id}">Buat Transaksi</button>`;
                        } else {
                            actionHtml += `<button class="dropdown-item btn-unmatch-flag-recon" data-id="${id}">Flag Recon</button>`;
                        }
                        actionHtml += `<button class="dropdown-item btn-unmatch-tolak" data-id="${id}" style="color: var(--danger);">Tolak</button>`;
                    } else if (t.flaggingStatus === 'Transaksi Terbuat') {
                        // transaction now exists -> recon it next (PRD: Transaksi Dibuat -> Flag Recon -> Flag Settle)
                        actionHtml += `<button class="dropdown-item btn-unmatch-flag-recon" data-id="${id}">Flag Recon</button>`;
                    } else if (t.flaggingStatus === 'Flag Recon') {
                        actionHtml += `<button class="dropdown-item btn-unmatch-flag-settle" data-id="${id}">Flag Settle</button>`;
                    }
                }
                menu.innerHTML = `
                    ${actionHtml}
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
            const isDisputePending = (refId) => {
                const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                return approvals.some(a => a.refId == refId && a.status === 'Pending');
            };
            if (dropdownItem.classList.contains('btn-dispute-tolak')) {
                const d = disputes.find(item => item.id == activeFlaggingTrxId);
                if (d) {
                    openRejectNoteModal(1, (note) => {
                        d.status = 'Ditolak';
                        d.rejectNote = note;
                        saveDisputesToStorage();
                        writeLog('tolak-dispute', `email : dion@paydia.id\naction : Menolak proses dispute ${d.id}, catatan: ${note}`);
                        showToast('Dispute Ditolak', `Dispute ${d.id} berhasil ditolak.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-dispute-buat-trx')) {
                const d = disputes.find(item => item.id == activeFlaggingTrxId);
                if (d) {
                    // PRD: dispute good faith Buat Transaksi melewati approval; status berubah setelah disetujui.
                    if (isDisputePending(d.id)) {
                        showToast('Peringatan', 'data sudah direquest approval, mohon tunggu');
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin mengajukan pembuatan transaksi untuk dispute ${d.id}? (Memerlukan persetujuan Management)`, () => {
                        const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                        const now = new Date();
                        const timeStr = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
                        approvals.unshift({
                            id: 'RQ-' + (10000 + Math.floor(Math.random() * 90000)),
                            tanggal: timeStr,
                            account: `Buat Transaksi Dispute: ${d.id}\n${d.merchantName || d.merchant || 'Good Faith'}`,
                            admin: 'Dion',
                            tipeRequest: 'Ubah Transaksi Mismatch',
                            refTable: 'dispute',
                            actionType: 'buat_trx',
                            status: 'Pending',
                            refId: d.id,
                            alasan: 'Pembuatan transaksi dispute good faith',
                            nominal: d.nominal || 0,
                            statusRekon: 'Pending'
                        });
                        localStorage.setItem('paydia_approvals', JSON.stringify(approvals));
                        writeLog('buat-trx-dispute-request', `email : dion@paydia.id\naction : Mengajukan pembuatan transaksi untuk dispute ${d.id}`);
                        showToast('Pending Approval', `Pengajuan pending approval berhasil dikirim untuk dispute ${d.id}.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-dispute-flag-settle')) {
                const d = disputes.find(item => item.id == activeFlaggingTrxId);
                if (d) {
                    if (isDisputePending(d.id)) {
                        showToast('Peringatan', 'data sudah direquest approval, mohon tunggu');
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin mengajukan <strong>Flag Settle</strong> untuk dispute ${d.id}? (Memerlukan persetujuan Management)`, () => {
                        // Keep status as 'Transaksi Terbuat' while pending approval
                        const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                        const now = new Date();
                        const timeStr = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
                        approvals.unshift({
                            id: 'RQ-' + (10000 + Math.floor(Math.random() * 90000)),
                            tanggal: timeStr,
                            account: `Flag Settle: Dispute ${d.id}\nRef: ${d.refId}`,
                            admin: 'Dion',
                            tipeRequest: 'Ubah Transaksi Mismatch',
                            refTable: 'dispute',
                            actionType: 'flag_settle',
                            status: 'Pending',
                            refId: d.id,
                            alasan: 'Persetujuan flag settle data dispute',
                            nominal: d.nominal || 0,
                            statusRekon: 'Pending'
                        });
                        localStorage.setItem('paydia_approvals', JSON.stringify(approvals));
                        writeLog('flag-settle-dispute-request', `email : dion@paydia.id\naction : Mengajukan flag settle untuk dispute ${d.id}`);
                        showToast('Pending Approval', `Pengajuan pending approval berhasil dikirim untuk dispute ${d.id}.`);
                        renderActiveTableWithLoading();
                    });
                }
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
                    // PRD: semua data yang diklik Flag Recon dicek status Paydia harus sukses (rcPaydia '00').
                    if (t.rcPaydia !== '00') {
                        showToast('Tidak Bisa Flag Recon', 'Status transaksi belum sukses, silahkan ubah status transaksi menjadi sukses di halaman transaksi');
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
            if (dropdownItem.classList.contains('btn-unmatch-tolak')) {
                const t = transactions.find(item => item.id == activeFlaggingTrxId);
                if (t) {
                    // Paydia-Only / Beda Status: transaksi harus gagal dulu sebelum bisa ditolak.
                    if ((t.label === 'Paydia-Only Success' || t.label === 'Beda Status Transaksi') && !isTrxGagal(t)) {
                        showToast('Tidak Bisa Tolak', 'Transaksi harus berstatus gagal terlebih dahulu, silahkan ubah status transaksi menjadi gagal di halaman Transaksi QRIS MPM.');
                        hideFlagDropdown();
                        return;
                    }
                    openRejectNoteModal(1, (note) => {
                        t.flaggingStatus = 'Ditolak';
                        rrnNotes[t.id] = note;
                        localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes));
                        saveTrxToStorage();
                        writeLog('tolak-unmatch', `email : dion@paydia.id\naction : Menolak proses transaksi ${t.id}, catatan: ${note}`);
                        showToast('Transaksi Ditolak', `Transaksi ${t.id} berhasil ditolak.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            const isPendingApproval = (refId) => {
                const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
                return approvals.some(a => a.refId == refId && a.status === 'Pending');
            };

            if (dropdownItem.classList.contains('btn-unmatch-buat-trx')) {
                const t = transactions.find(item => item.id == activeFlaggingTrxId);
                if (t) {
                    if (isPendingApproval(t.id)) {
                        showToast('Peringatan', 'data sudah direquest approval, mohon tunggu');
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin mengajukan <strong>Buat Transaksi</strong> untuk ${t.id}? (Memerlukan persetujuan Management)`, () => {
                        // PRD: Buat Transaksi wajib lewat approval; status tetap On-Hold sampai disetujui.
                        createUnmatchApproval('buat_trx', [t]);
                        writeLog('buat-trx-unmatch-request', `email : dion@paydia.id\naction : Mengajukan buat transaksi untuk ${t.id}`);
                        showToast('Pending Approval', `Pengajuan buat transaksi berhasil dikirim untuk transaksi ${t.id}.`);
                        renderActiveTableWithLoading();
                    });
                }
                hideFlagDropdown();
                return;
            }
            if (dropdownItem.classList.contains('btn-unmatch-flag-settle')) {
                const t = transactions.find(item => item.id == activeFlaggingTrxId);
                if (t) {
                    if (t.flaggingStatus === 'Cancelled') {
                        showToast('Error', `Transaksi sudah dibatalkan pada ${t.cancelledAt} oleh ${t.cancelledBy}`);
                        hideFlagDropdown();
                        return;
                    }
                    
                    // PRD/guide: Flag Settle SELALU lewat approval (semua tipe unmatch).
                    // Prasyarat: harus sudah Flag Recon (atau Transaksi Terbuat -> Flag Recon).
                    if (t.flaggingStatus !== 'Flag Recon') {
                        showToast('Peringatan', 'Transaksi harus di-Flag Recon terlebih dahulu sebelum di-Flag Settle.');
                        hideFlagDropdown();
                        return;
                    }
                    if (isPendingApproval(t.id)) {
                        showToast('Peringatan', 'data sudah direquest approval, mohon tunggu');
                        hideFlagDropdown();
                        return;
                    }
                    openActionConfirmModal(`Apakah Anda yakin ingin mengajukan <strong>Flag Settle</strong> untuk transaksi ${t.id}? (Memerlukan persetujuan Management)`, () => {
                        // Keep flaggingStatus as is (Flag Recon) while pending approval
                        createUnmatchApproval('flag_settle', [t]);
                        writeLog('flag-settle-unmatch-request', `email : dion@paydia.id\naction : Mengajukan flag settle untuk transaksi ${t.id}`);
                        showToast('Pending Approval', `Pengajuan pending approval berhasil dikirim untuk transaksi ${t.id}.`);
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

        // Edit Dispute trigger
        const editDispBtn = e.target.closest('.btn-edit-dispute');
        if (editDispBtn) {
            e.preventDefault();
            const id = editDispBtn.dataset.id;
            openNotesForm(id);
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

    const disputeOverlay = document.getElementById('disputeOverlay');
    const disputeClose = document.getElementById('disputeClose');
    if (disputeClose) {
        disputeClose.addEventListener('click', () => {
            if (disputeOverlay) disputeOverlay.classList.remove('show');
        });
    }
    const disputeCancelBtn = document.getElementById('disputeCancelBtn');
    if (disputeCancelBtn) {
        disputeCancelBtn.addEventListener('click', () => {
            if (disputeOverlay) disputeOverlay.classList.remove('show');
        });
    }
    const disputeForm = document.getElementById('disputeForm');
    if (disputeForm) {
        disputeForm.addEventListener('submit', handleDisputeSubmit);
    }

    // General escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('show');
            settlementOverlay.classList.remove('show');
            if (disputeOverlay) disputeOverlay.classList.remove('show');
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
        let todayProcess = processes.find(p => p.date === todayStr && p.tipe === 'Acquirer');
        
        chkSimulateFail.checked = (todayProcess && todayProcess.status === 'Gagal');

        chkSimulateFail.addEventListener('change', () => {
            const isChecked = chkSimulateFail.checked;
            const currentProcesses = JSON.parse(localStorage.getItem('paydia_recon_processes') || '[]');
            let targetProcess = currentProcesses.find(p => p.date === todayStr && p.tipe === 'Acquirer');
            if (targetProcess) {
                targetProcess.status = isChecked ? 'Gagal' : 'Sukses';
            } else {
                currentProcesses.push({
                    date: todayStr,
                    filename: `qris_recon_${todayStr.replace(/-/g, '')}_latest.csv`,
                    status: isChecked ? 'Gagal' : 'Sukses',
                    tipe: 'Acquirer'
                });
            }
            localStorage.setItem('paydia_recon_processes', JSON.stringify(currentProcesses));

            const currentTrxs = JSON.parse(localStorage.getItem('paydia_recon_trx') || '[]');
            let suspect = currentTrxs.find(t => t.id === 'TX-ACQ-20003');
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

// ── Dispute Table Actions & Rendering ──
function saveDisputesToStorage() {
    localStorage.setItem('paydia_disputes', JSON.stringify(disputes));
}

function renderDisputeRows(tbody) {
    tbody.innerHTML = '';

    const startDateVal = document.getElementById('filterStartDate').value;
    const endDateVal = document.getElementById('filterEndDate').value;
    const vendorVal = document.getElementById('filterVendor').value;
    const lokasiVal = document.getElementById('filterLokasi') ? document.getElementById('filterLokasi').value : '';
    const searchVal = searchInput.value.trim().toLowerCase();

    // Dispute multi-select filters (PRD: Status / Alasan Dispute)
    const dStatusVals = checkedValues('chk-dispute-status');
    const dAlasanVals = checkedValues('chk-dispute-alasan');

    let filtered = disputes.filter(d => {
        const dDate = d.date.substring(0, 10);
        if (startDateVal && dDate < startDateVal) return false;
        if (endDateVal && dDate > endDateVal) return false;
        if (vendorVal && d.switching !== vendorVal) return false;
        if (searchVal) {
            const dTrx = transactions.find(item => item.id === d.refId || item.refNo === d.refId);
            const rrnVal = dTrx ? dTrx.refNo : (d.rrn || (String(d.refId || '').startsWith('REF') ? d.refId : ''));
            const midVal = dTrx ? (dTrx.merchantId || '') : (d.merchantId || '');
            const nameVal = dTrx ? (dTrx.merchantName || '') : (d.merchantName || d.merchant || '');
            const idVal = String(d.refId || d.id || '');
            if (!rrnVal.toLowerCase().includes(searchVal)
                && !midVal.toLowerCase().includes(searchVal)
                && !nameVal.toLowerCase().includes(searchVal)
                && !idVal.toLowerCase().includes(searchVal)) return false;
        }
        if (dStatusVals.length && !dStatusVals.includes(d.status)) return false;
        if (dAlasanVals.length && !dAlasanVals.includes(d.type)) return false;
        if (lokasiVal) {
            const trx = transactions.find(item => item.id === d.refId || item.refNo === d.refId);
            if ((trx ? (trx.domestic || 'Domestic') : 'Domestic') !== lokasiVal) return false;
        }
        return true;
    });

    // Action-first bulk mode: show only good-faith disputes eligible for the chosen action.
    const bulkOn = activeBulkAction && bulkContext() === 'dispute';
    if (bulkOn) filtered = filtered.filter(d => isDisputeEligible(d, activeBulkAction));
    const checkTh = document.getElementById('acqDisputeCheckTh');
    if (checkTh) checkTh.style.display = bulkOn ? '' : 'none';
    visibleDisputeList = filtered;
    updateDisputeBulkBar();

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${bulkOn ? 14 : 13}" style="text-align:center;color:var(--text-muted);padding: 40px 16px;">Tidak ada data dispute</td></tr>`;
        updatePaginationInfo(0);
        return;
    }

    filtered.forEach((d, idx) => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-proses';
        if (d.status === 'Closed' || d.status === 'Flag Settle' || d.status === 'Done Deduct') statusClass = 'status-sukses';
        else if (d.status === 'Ditolak' || d.status === 'Failed Deduct' || d.status === 'Transaksi Tidak Ditemukan') statusClass = 'status-gagal';
        else if (d.status === 'Transaksi Terbuat' || d.status === 'Flag Recon') statusClass = 'status-dikembalikan';

        let displayType = d.type;
        if (d.type === '1st chargeback') displayType = '1st Chargeback';
        else if (d.type === '2nd chargeback') displayType = '2nd Chargeback';
        else if (d.type === 'good faith pemotongan') displayType = 'Good Faith Pemotongan';
        else if (d.type === 'good faith penambahan') displayType = 'Good Faith Penambahan';
        else if (d.type === 'good faith') displayType = 'Good Faith';
        else if (d.type === 'represent') displayType = 'Represent';

        const trx = transactions.find(item => item.id === d.refId || item.refNo === d.refId);
        const merchantName = d.merchantName || d.merchant || (trx ? trx.merchantName : 'Kopi Kenangan');

        // PRD: Nominal Transaksi = Nominal Tip + Nominal MDR + Nominal Total (base nominal = total)
        const nominalTotal = d.nominalTotal !== undefined ? d.nominalTotal : d.nominal;
        const nominalTip = d.nominalTip !== undefined ? d.nominalTip : Math.floor(d.nominal * 0.05);
        const nominalMdr = d.nominalMdr !== undefined ? d.nominalMdr : Math.floor(d.nominal * 0.007);
        const nominalTx = d.nominalTx !== undefined ? d.nominalTx : (nominalTip + nominalMdr + nominalTotal);

        const trxId = trx ? trx.id : (d.txId || d.refId || '-');
        // Auto-processed disputes (1st/2nd chargeback, represent) carry the RRN directly in refId.
        const rrn = trx ? trx.refNo : (d.rrn || (String(d.refId || '').startsWith('REF') ? d.refId : '-'));

        const dCheckboxCell = bulkOn
            ? `<td class="col-checkbox" style="text-align:center;"><input type="checkbox" class="dispute-row-checkbox" data-id="${d.id}" ${selectedDisputeIds.includes(d.id) ? 'checked' : ''}></td>`
            : '';

        tr.innerHTML = `
            ${dCheckboxCell}
            <td class="col-no">${idx + 1}</td>
            <td style="font-variant-numeric: tabular-nums;">${d.date}</td>
            <td><a href="#" class="ref-link detail-trx-trigger" data-id="${trxId}">${trxId}</a></td>
            <td style="font-variant-numeric: tabular-nums;">${rrn}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTx.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
            <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTotal.toLocaleString('id-ID')}</strong></td>
            <td>${merchantName}</td>
            <td><span class="request-badge" style="background:var(--primary-bg);color:var(--primary);border:1px solid rgba(99, 102, 241, 0.1);">${displayType}</span></td>
            <td>${d.switching}</td>
            <td><span class="status-badge ${statusClass}">${d.status}</span></td>
            <td>
                <button class="btn-action-dots btn-dispute-menu-trigger" data-id="${d.id}" ${permissions.inputDispute ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;" title="Izin Edit diperlukan"'}>
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updatePaginationInfo(filtered.length);
}

let _modalBuktiData = {}; // txId → base64, used by add-dispute modal
let _activeBuktiTxId = null; // set when Lihat Detail opened from modal context

function initDisputeBuktiHandlers() {
    document.getElementById('buktiPreviewClose')?.addEventListener('click', () => {
        const overlay = document.getElementById('buktiPreviewOverlay');
        overlay.classList.remove('show'); overlay.style.display = 'none';
        _activeBuktiTxId = null;
    });

    document.getElementById('buktiHapusBtn')?.addEventListener('click', () => {
        if (_activeBuktiTxId) {
            delete _modalBuktiData[_activeBuktiTxId];
            const wrap = document.querySelector(`.dispute-modal-bukti-wrap[data-id="${_activeBuktiTxId}"]`);
            if (wrap) {
                wrap.innerHTML = `<button class="btn-modal-upload-bukti flag-btn settle" data-id="${_activeBuktiTxId}" style="font-size:0.78rem;padding:4px 8px;"><i class="fas fa-upload"></i> Upload</button><input type="file" class="input-modal-bukti" data-id="${_activeBuktiTxId}" accept=".jpg,.jpeg,.png" style="display:none;">`;
            }
        }
        const overlay = document.getElementById('buktiPreviewOverlay');
        overlay.classList.remove('show'); overlay.style.display = 'none';
        _activeBuktiTxId = null;
    });
}

function openDisputeSearchModal() {
    if (!permissions.inputDispute) {
        showToast('Access Denied', 'Anda tidak memiliki izin untuk menginput dispute.');
        return;
    }
    const rrnInput = document.getElementById('searchDisputeRrn');
    const startDateInput = document.getElementById('searchDisputeStartDate');
    const endDateInput = document.getElementById('searchDisputeEndDate');
    const tbody = document.getElementById('disputeSearchTableBody');
    const submitBtn = document.getElementById('disputeSubmitBtn');
    const selectAll = document.getElementById('disputeSearchSelectAll');

    if (rrnInput) rrnInput.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (selectAll) selectAll.checked = false;
    _modalBuktiData = {};
    _activeBuktiTxId = null;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Silakan masukkan RRN dan/atau Range Tanggal untuk mencari transaksi.
                </td>
            </tr>
        `;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
    }

    const disputeOverlay = document.getElementById('disputeOverlay');
    if (disputeOverlay) disputeOverlay.classList.add('show');
}

function handleDisputeSearch() {
    const rrn = document.getElementById('searchDisputeRrn').value.trim();
    const startDate = document.getElementById('searchDisputeStartDate').value;
    const endDate = document.getElementById('searchDisputeEndDate').value;
    const tbody = document.getElementById('disputeSearchTableBody');
    const selectAll = document.getElementById('disputeSearchSelectAll');
    const submitBtn = document.getElementById('disputeSubmitBtn');

    if (selectAll) selectAll.checked = false;
    if (submitBtn) submitBtn.disabled = true;

    if (!rrn && !startDate && !endDate) {
        showToast('Peringatan', 'Silakan masukkan RRN dan/atau Range Tanggal terlebih dahulu.');
        return;
    }

    let results = transactions.filter(t => {
        if (rrn && t.refNo && !t.refNo.includes(rrn)) return false;
        if (rrn && !t.refNo) return false;
        const tDate = t.date.substring(0, 10);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
    });

    if (tbody) {
        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; color: var(--text-muted); padding: 30px;">
                        Tidak ditemukan transaksi yang cocok.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = '';
            results.forEach(t => {
                const tr = document.createElement('tr');
                const nominalTx = t.nominal;
                const nominalTip = Math.floor(nominalTx * 0.05);
                const nominalMdr = Math.floor(nominalTx * 0.007);
                const nominalTotal = nominalTx + nominalTip + nominalMdr;

                tr.innerHTML = `
                    <td style="text-align: center;"><input type="checkbox" class="dispute-search-checkbox" data-id="${t.id}"></td>
                    <td style="font-variant-numeric: tabular-nums;">${t.date}</td>
                    <td>${t.id}</td>
                    <td style="font-variant-numeric: tabular-nums;">${t.refNo || '-'}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalTx.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalTip.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;">Rp${nominalMdr.toLocaleString('id-ID')}</td>
                    <td style="font-variant-numeric: tabular-nums;"><strong>Rp${nominalTotal.toLocaleString('id-ID')}</strong></td>
                    <td>${t.merchantName}</td>
                    <td>${t.switching}</td>
                    <td>
                        <select class="dispute-modal-tipe" data-id="${t.id}" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:0.82rem;background:var(--bg-card);color:var(--text-primary);">
                            <option value="">-- Pilih --</option>
                            <option value="Pemotongan">Pemotongan</option>
                            <option value="Penambahan">Penambahan</option>
                        </select>
                    </td>
                    <td>
                        <span class="dispute-modal-bukti-wrap" data-id="${t.id}">
                            <button class="btn-modal-upload-bukti flag-btn settle" data-id="${t.id}" style="font-size:0.78rem;padding:4px 8px;"><i class="fas fa-upload"></i> Upload</button>
                            <input type="file" class="input-modal-bukti" data-id="${t.id}" accept=".jpg,.jpeg,.png" style="display:none;">
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Re-bind listeners for checkboxes to enable submit button
            const checkboxes = tbody.querySelectorAll('.dispute-search-checkbox');
            checkboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const anyChecked = Array.from(checkboxes).some(c => c.checked);
                    if (submitBtn) submitBtn.disabled = !anyChecked;
                    if (selectAll) {
                        selectAll.checked = Array.from(checkboxes).every(c => c.checked);
                    }
                });
            });
        }
    }
}

function handleDisputeBulkSubmit() {
    const tbody = document.getElementById('disputeSearchTableBody');
    const submitBtn = document.getElementById('disputeSubmitBtn');
    if (!tbody) return;

    const checkedCbs = Array.from(tbody.querySelectorAll('.dispute-search-checkbox:checked'));
    if (checkedCbs.length === 0) return;

    // Validate tipe + bukti for each checked row
    for (const cb of checkedCbs) {
        const row = cb.closest('tr');
        const tipeSel = row?.querySelector('.dispute-modal-tipe');
        if (!tipeSel || !tipeSel.value) {
            showToast('Validasi Gagal', 'Harap pilih Tipe untuk semua transaksi yang dipilih.');
            return;
        }
        if (!_modalBuktiData[cb.dataset.id]) {
            showToast('Validasi Gagal', 'Harap upload Bukti untuk semua transaksi yang dipilih.');
            return;
        }
    }

    // Loading state
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; }

    setTimeout(() => {
        try {
            let addedCount = 0;
            checkedCbs.forEach(cb => {
                const txId = cb.dataset.id;
                const row = cb.closest('tr');
                const tipeValue = row?.querySelector('.dispute-modal-tipe')?.value || 'Pemotongan';
                const type = tipeValue === 'Penambahan' ? 'good faith penambahan' : 'good faith pemotongan';
                const buktiUrl = _modalBuktiData[txId] || '';

                const t = transactions.find(trx => trx.id === txId);
                if (t) {
                    const dispId = 'DISP-' + String(disputes.length + 1).padStart(3, '0');
                    const now = new Date();
                    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
                    const nominalTx = t.nominal;
                    const nominalTip = Math.floor(nominalTx * 0.05);
                    const nominalMdr = Math.floor(nominalTx * 0.007);
                    const nominalTotal = nominalTx + nominalTip + nominalMdr;
                    disputes.unshift({ id: dispId, txId: t.id, refId: t.id, rrn: t.refNo, date: dateStr, type, tipeDispute: tipeValue, buktiUrl, nominalTx, nominalTip, nominalMdr, nominalTotal, nominal: nominalTotal, merchant: t.merchantName, merchantName: t.merchantName, switching: t.switching, status: 'Open', desc: 'Penyelesaian secara good faith' });
                    t.disputeRef = dispId;
                    addedCount++;
                }
            });
            saveDisputesToStorage();
            saveTrxToStorage();
            writeLog('add-dispute-goodfaith', `email : dion@paydia.id\naction : Menambahkan ${addedCount} data dispute good faith`);
            const disputeOverlay = document.getElementById('disputeOverlay');
            if (disputeOverlay) disputeOverlay.classList.remove('show');
            showToast('Berhasil', 'Berhasil bulk proses data');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showToast('Gagal', 'Gagal bulk proses data');
            setTimeout(() => window.location.reload(), 1500);
        }
    }, 500);
}

function initDisputeSearchModal() {
    const btnSearch = document.getElementById('btnSearchDisputeTrx');
    const selectAll = document.getElementById('disputeSearchSelectAll');
    const submitBtn = document.getElementById('disputeSubmitBtn');
    const searchTbody = document.getElementById('disputeSearchTableBody');

    if (btnSearch) btnSearch.addEventListener('click', handleDisputeSearch);

    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.dispute-search-checkbox');
            checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
            if (submitBtn) submitBtn.disabled = !selectAll.checked || checkboxes.length === 0;
        });
    }

    if (submitBtn) submitBtn.addEventListener('click', handleDisputeBulkSubmit);

    // Modal bukti upload/preview handlers
    if (searchTbody) {
        searchTbody.addEventListener('click', (e) => {
            const uploadBtn = e.target.closest('.btn-modal-upload-bukti');
            if (uploadBtn) {
                uploadBtn.closest('.dispute-modal-bukti-wrap')?.querySelector('.input-modal-bukti')?.click();
                return;
            }
            const lihatBtn = e.target.closest('.btn-modal-lihat-bukti');
            if (lihatBtn) {
                const txId = lihatBtn.dataset.id;
                const url = _modalBuktiData[txId];
                if (url) {
                    _activeBuktiTxId = txId;
                    document.getElementById('buktiPreviewImg').src = url;
                    const overlay = document.getElementById('buktiPreviewOverlay');
                    overlay.style.display = 'flex'; overlay.classList.add('show');
                }
            }
        });

        searchTbody.addEventListener('change', (e) => {
            const fileInput = e.target.closest('.input-modal-bukti');
            if (!fileInput) return;
            const file = fileInput.files[0];
            if (!file) return;
            if (file.size > 1024 * 1024) { showToast('Upload Gagal', 'Ukuran file melebihi 1MB'); fileInput.value = ''; return; }
            if (!['image/jpeg', 'image/png'].includes(file.type)) { showToast('Upload Gagal', 'Format tidak valid. Hanya JPG/PNG'); fileInput.value = ''; return; }
            const txId = fileInput.dataset.id;
            const wrap = fileInput.closest('.dispute-modal-bukti-wrap');
            if (wrap) wrap.innerHTML = '<span style="font-size:0.78rem;color:var(--text-muted);">Uploading...</span>';
            const reader = new FileReader();
            reader.onload = (ev) => {
                _modalBuktiData[txId] = ev.target.result;
                if (wrap) wrap.innerHTML = `<button class="btn-modal-lihat-bukti flag-btn settle" data-id="${txId}" style="font-size:0.78rem;padding:4px 8px;"><i class="fas fa-eye"></i> Lihat Detail</button>`;
            };
            reader.onerror = () => showToast('Upload Gagal', 'Gagal membaca file');
            reader.readAsDataURL(file);
        });
    }
}

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
                        showToast('Export Selesai', `File export QRIS_Acquirer_${randomBank}_${selectedDate.replace(/-/g, '')}.xlsx berhasil diunduh.`);
                    if(typeof window.showExcelSimulationModal === "function") window.showExcelSimulationModal(window.currentExportData || [], subtabName);
}, 300);
                }
            }, 100);
        } else {
            const banks = ['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB'];
            const randomBank = banks[Math.floor(Math.random() * banks.length)];
            writeLog('Ekspor Data per Bank', `email : dion@paydia.id\naction : Melakukan ekspor data bank ${randomBank} tanggal ${selectedDate}`);
            showToast('Export Selesai', `File export QRIS_Acquirer_${randomBank}_${selectedDate.replace(/-/g, '')}.xlsx berhasil diunduh.`);
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
            notesOverlay.classList.remove('remove');
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
            
            if (targetId.startsWith('DISP-')) {
                const disp = disputes.find(d => d.id === targetId);
                if (disp) {
                    disp.desc = noteVal;
                    saveDisputesToStorage();
                    writeLog('edit-notes-dispute', `email : dion@paydia.id\naction : Mengedit catatan dispute record ${targetId}`);
                    showToast('Catatan Disimpan', 'Catatan dispute berhasil disimpan.');
                }
            } else {
                rrnNotes[targetId] = noteVal;
                localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes));
                // PRD: catatan TIDAK mengubah flaggingStatus — status hanya bergerak lewat aksi flow
                // (On-Hold -> Flag Recon/Buat Transaksi -> ...). Sebelumnya catatan menyetel 'Ada Catatan'
                // yang mengunci data dari pemrosesan.
                showToast('Catatan Disimpan', 'Catatan transaksi unmatch berhasil disimpan.');
                writeLog('edit-notes-unmatch', `email : dion@paydia.id\naction : Menyimpan catatan untuk ID ${targetId}`);
            }
            
            notesOverlay.classList.remove('show');
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
    
    let existingNote = '';
    if (id.startsWith('DISP-')) {
        const disp = disputes.find(d => d.id === id);
        existingNote = disp ? (disp.desc || '') : '';
        const titleEl = document.querySelector('#notesOverlay .modal-title');
        if (titleEl) titleEl.textContent = 'Lihat / Edit Catatan Dispute';
    } else {
        existingNote = rrnNotes[id] || '';
        const titleEl = document.querySelector('#notesOverlay .modal-title');
        if (titleEl) titleEl.textContent = 'Lihat / Edit Catatan Transaksi';
    }
    
    notesText.value = existingNote;
    notesCharCount.textContent = `${existingNote.length} / 255`;
    notesOverlay.classList.add('show');
}

// ── Bulk Actions (action-first flow) for Unmatch & Dispute ──
// User picks ONE action from the "Bulk Action" menu; the table filters to rows
// eligible for that action and a checklist column appears. ponytail: one mechanism,
// context = active subtab. Action keys shared by both tabs.
const BULK_ACTION_LABELS = {
    buat_trx: 'Buat Transaksi',
    flag_recon: 'Flag Recon',
    flag_settle: 'Flag Settle',
    tolak: 'Tolak'
};
const BULK_ACTION_ORDER = ['buat_trx', 'flag_recon', 'flag_settle', 'tolak'];

let activeBulkAction = null;   // null | one of BULK_ACTION_ORDER
let selectedDisputeIds = [];

function bulkContext() {
    if (activeSubtab === 'acq-dispute') return 'dispute';
    if (activeSubtab === 'acq-unmatch') return 'unmatch';
    return null;
}

// Unmatch eligibility per PRD.
function isUnmatchEligible(t, action) {
    if (!t) return false;
    const label = t.label || '';
    const st = (t.flaggingStatus && t.flaggingStatus !== 'Unmatch') ? t.flaggingStatus : 'On-Hold';
    const onHold = st === 'On-Hold';
    const createType = label === 'Double RRN' || label === 'Switching-Only RC00' || label === 'Switching-Only RC68';
    const paydiaOrBeda = label === 'Paydia-Only Success' || label === 'Beda Status Transaksi';
    if (action === 'buat_trx') return createType && onHold;
    if (action === 'flag_recon') {
        if (createType && st === 'Transaksi Terbuat') return true;
        if (paydiaOrBeda && onHold) {
            if (label === 'Beda Status Transaksi' && t.rcPaydia !== '00') return false; // must be sukses first
            return true;
        }
        return false;
    }
    if (action === 'flag_settle') return st === 'Flag Recon';
    if (action === 'tolak') {
        if (!onHold) return false;
        // Paydia-Only / Beda Status: transaksi harus gagal dulu sebelum bisa ditolak.
        if (paydiaOrBeda && !isTrxGagal(t)) return false;
        return true;
    }
    return false;
}

// Dispute eligibility per PRD (Good Faith only; "On Hold" == Open status).
function isDisputeEligible(d, action) {
    if (!d) return false;
    if (!(d.type || '').toLowerCase().includes('good faith')) return false;
    const st = d.status || 'Open';
    if (action === 'buat_trx') return st === 'Open';
    if (action === 'flag_recon') return st === 'Transaksi Terbuat';
    if (action === 'flag_settle') return st === 'Flag Recon';
    if (action === 'tolak') return st === 'Open';
    return false;
}

// Back-compat helper: does this unmatch row support any bulk action at all.
function unmatchRowActions(t) {
    return BULK_ACTION_ORDER.filter(a => isUnmatchEligible(t, a));
}

// PRD: Buat Transaksi & Flag Settle wajib lewat approval. Bulk request digrouping per merchant.
// txList = transaksi dari SATU merchant yang sama (single-row = 1 elemen).
function createUnmatchApproval(action, txList) {
    if (!txList || !txList.length) return;
    const approvals = JSON.parse(localStorage.getItem('paydia_approvals') || '[]');
    const now = new Date();
    const timeStr = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    const first = txList[0];
    const actionLabel = action === 'buat_trx' ? 'Buat Transaksi' : 'Flag Settle';
    approvals.unshift({
        id: 'RQ-' + (10000 + Math.floor(Math.random() * 90000)),
        tanggal: timeStr,
        account: `${first.merchantName || 'Unmatch'}\nMID: ${first.merchantId || '-'}`,
        admin: 'Dion',
        tipeRequest: 'Ubah Transaksi Mismatch',
        refTable: 'unmatch',
        actionType: action,
        status: 'Pending',
        refId: first.id,
        txIds: txList.map(t => t.id),
        merchantName: first.merchantName || '-',
        merchantId: first.merchantId || '-',
        mpan: first.mpan || '-',
        alasan: `Persetujuan ${actionLabel} ${txList.length} transaksi unmatched`,
        nominal: txList.reduce((s, t) => s + (t.nominal || 0), 0),
        statusRekon: 'Pending'
    });
    localStorage.setItem('paydia_approvals', JSON.stringify(approvals));
}

function updateBulkActionBar() {
    const selectAllCheckbox = document.getElementById('acqUnmatchSelectAll');
    const bulkBar = document.getElementById('acqBulkActionBar');
    const countSpan = document.getElementById('acqBulkSelectedCount');
    const btnContainer = document.getElementById('acqBulkActionButtons');
    if (!bulkBar || !countSpan) return;

    const bulkOn = activeBulkAction && bulkContext() === 'unmatch';
    if (!bulkOn) { bulkBar.style.display = 'none'; return; }

    if (selectAllCheckbox) {
        selectAllCheckbox.checked = visibleUnmatchedList.length > 0 && visibleUnmatchedList.every(t => selectedUnmatchIds.includes(t.id));
    }

    // Single action button = the chosen bulk action.
    if (btnContainer) {
        const danger = activeBulkAction === 'tolak';
        btnContainer.innerHTML = `<button type="button" class="btn btn-bulk-action" data-action="${activeBulkAction}" style="background: ${danger ? 'var(--danger)' : 'var(--primary)'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;">${BULK_ACTION_LABELS[activeBulkAction]}</button>`;
    }

    if (selectedUnmatchIds.length > 0) {
        bulkBar.style.display = 'flex';
        countSpan.textContent = selectedUnmatchIds.length;
    } else {
        bulkBar.style.display = 'none';
    }
}

function initBulkActions() {
    const selectAllCheckbox = document.getElementById('acqUnmatchSelectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            if (selectAllCheckbox.checked) {
                let capped = false;
                visibleUnmatchedList.forEach(t => {
                    if (selectedUnmatchIds.includes(t.id)) return;
                    if (selectedUnmatchIds.length >= BULK_MAX) { capped = true; return; }
                    selectedUnmatchIds.push(t.id);
                });
                if (capped) showToast('Maksimal 50 Data', 'Maksimal 50 data dapat dipilih dalam satu bulk action.');
            } else {
                visibleUnmatchedList.forEach(t => {
                    const idx = selectedUnmatchIds.indexOf(t.id);
                    if (idx !== -1) selectedUnmatchIds.splice(idx, 1);
                });
            }
            renderTableData();
        });
    }

    const tbody = document.getElementById('acqUnmatchTableBody');
    if (tbody) {
        tbody.addEventListener('change', (e) => {
            const checkbox = e.target.closest('.unmatch-row-checkbox');
            if (!checkbox) return;
            const id = checkbox.dataset.id;
            if (checkbox.checked) {
                if (selectedUnmatchIds.length >= BULK_MAX && !selectedUnmatchIds.includes(id)) {
                    checkbox.checked = false;
                    showToast('Maksimal 50 Data', 'Maksimal 50 data dapat dipilih dalam satu bulk action.');
                    return;
                }
                if (!selectedUnmatchIds.includes(id)) selectedUnmatchIds.push(id);
            } else {
                const idx = selectedUnmatchIds.indexOf(id);
                if (idx !== -1) selectedUnmatchIds.splice(idx, 1);
            }
            updateBulkActionBar();
        });
    }

    const btnAcqBulkUnselect = document.getElementById('btnAcqBulkUnselect');
    if (btnAcqBulkUnselect) {
        btnAcqBulkUnselect.addEventListener('click', () => {
            selectedUnmatchIds = [];
            renderTableData();
        });
    }

    // Action button (single, dynamically rendered) -> straight to loading/success/error.
    const btnContainer = document.getElementById('acqBulkActionButtons');
    if (btnContainer) {
        btnContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-bulk-action');
            if (!btn || selectedUnmatchIds.length === 0) return;
            handleBulkUnmatchAction(btn.dataset.action, selectedUnmatchIds.slice());
        });
    }

    initDisputeBulkActions();
    initBulkActionMenu();
}

// ── Dispute bulk wiring (mirrors unmatch) ──
function updateDisputeBulkBar() {
    const selectAll = document.getElementById('acqDisputeSelectAll');
    const bar = document.getElementById('acqDisputeBulkBar');
    const countSpan = document.getElementById('acqDisputeBulkSelectedCount');
    const btnContainer = document.getElementById('acqDisputeBulkActionButtons');
    if (!bar || !countSpan) return;

    const bulkOn = activeBulkAction && bulkContext() === 'dispute';
    if (!bulkOn) { bar.style.display = 'none'; return; }

    if (selectAll) {
        selectAll.checked = visibleDisputeList.length > 0 && visibleDisputeList.every(d => selectedDisputeIds.includes(d.id));
    }
    if (btnContainer) {
        const danger = activeBulkAction === 'tolak';
        btnContainer.innerHTML = `<button type="button" class="btn btn-dispute-bulk-action" data-action="${activeBulkAction}" style="background: ${danger ? 'var(--danger)' : 'var(--primary)'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;">${BULK_ACTION_LABELS[activeBulkAction]}</button>`;
    }
    if (selectedDisputeIds.length > 0) {
        bar.style.display = 'flex';
        countSpan.textContent = selectedDisputeIds.length;
    } else {
        bar.style.display = 'none';
    }
}

function initDisputeBulkActions() {
    const selectAll = document.getElementById('acqDisputeSelectAll');
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            if (selectAll.checked) {
                visibleDisputeList.forEach(d => { if (!selectedDisputeIds.includes(d.id)) selectedDisputeIds.push(d.id); });
            } else {
                visibleDisputeList.forEach(d => {
                    const idx = selectedDisputeIds.indexOf(d.id);
                    if (idx !== -1) selectedDisputeIds.splice(idx, 1);
                });
            }
            renderTableData();
        });
    }
    const tbody = document.getElementById('acqDisputeTableBody');
    if (tbody) {
        tbody.addEventListener('change', (e) => {
            const checkbox = e.target.closest('.dispute-row-checkbox');
            if (!checkbox) return;
            const id = checkbox.dataset.id;
            if (checkbox.checked) {
                if (!selectedDisputeIds.includes(id)) selectedDisputeIds.push(id);
            } else {
                const idx = selectedDisputeIds.indexOf(id);
                if (idx !== -1) selectedDisputeIds.splice(idx, 1);
            }
            updateDisputeBulkBar();
        });
    }
    const unselect = document.getElementById('btnAcqDisputeBulkUnselect');
    if (unselect) unselect.addEventListener('click', () => { selectedDisputeIds = []; renderTableData(); });

    const btnContainer = document.getElementById('acqDisputeBulkActionButtons');
    if (btnContainer) {
        btnContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-dispute-bulk-action');
            if (!btn || selectedDisputeIds.length === 0) return;
            handleBulkDisputeAction(btn.dataset.action, selectedDisputeIds.slice());
        });
    }
}

// ── Bulk Action menu (toolbar) ──
function syncBulkActionButton() {
    const wrap = document.getElementById('bulkActionWrap');
    if (!wrap) return;
    wrap.style.display = bulkContext() ? 'inline-block' : 'none';
    updateBulkToggleLabel();
}

function updateBulkToggleLabel() {
    const label = document.getElementById('bulkActionToggleLabel');
    const cancelItem = document.getElementById('bulkActionCancel');
    if (label) label.textContent = activeBulkAction ? `Bulk: ${BULK_ACTION_LABELS[activeBulkAction]}` : 'Bulk Action';
    if (cancelItem) cancelItem.style.display = activeBulkAction ? 'block' : 'none';
    document.querySelectorAll('.bulk-menu-item[data-bact]').forEach(b => {
        b.style.background = (b.dataset.bact && b.dataset.bact === activeBulkAction) ? 'rgba(99,102,241,0.12)' : 'transparent';
        b.style.fontWeight = (b.dataset.bact && b.dataset.bact === activeBulkAction) ? '700' : '400';
    });
}

function resetBulkMode() {
    activeBulkAction = null;
    selectedUnmatchIds = [];
    selectedDisputeIds = [];
    const menu = document.getElementById('bulkActionMenu');
    if (menu) menu.style.display = 'none';
    updateBulkToggleLabel();
}

function initBulkActionMenu() {
    const toggle = document.getElementById('bulkActionToggle');
    const menu = document.getElementById('bulkActionMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    menu.addEventListener('click', (e) => {
        const item = e.target.closest('.bulk-menu-item');
        if (!item) return;
        e.stopPropagation();
        const action = item.dataset.bact;
        activeBulkAction = action || null;   // empty data-bact = Batal
        selectedUnmatchIds = [];
        selectedDisputeIds = [];
        menu.style.display = 'none';
        updateBulkToggleLabel();
        renderTableData();
    });
    // Close menu on outside click.
    document.addEventListener('click', (e) => {
        if (menu.style.display === 'block' && !e.target.closest('#bulkActionWrap')) {
            menu.style.display = 'none';
        }
    });
}

// Wording for the bulk confirm modal (non-tolak actions). Count = eligible data.
function bulkConfirmMsg(action, n) {
    if (action === 'buat_trx') return `Ajukan <strong>Buat Transaksi</strong> untuk <strong>${n}</strong> data? (Memerlukan persetujuan Management)`;
    if (action === 'flag_recon') return `Lakukan <strong>Flag Recon</strong> pada <strong>${n}</strong> data?`;
    if (action === 'flag_settle') return `Ajukan <strong>Flag Settle</strong> untuk <strong>${n}</strong> data? (Memerlukan persetujuan Management)`;
    return '';
}

// Bulk action across selected good-faith disputes: confirm gate, then loading -> success/error -> reload.
function handleBulkDisputeAction(action, ids) {
    const eligible = ids.filter(id => {
        const d = disputes.find(x => x.id === id);
        return d && isDisputeEligible(d, action);
    });
    if (eligible.length === 0) {
        showToast('Tidak Ada Perubahan', 'Tidak ada dispute yang bisa diproses.');
        updateDisputeBulkBar();
        return;
    }
    const n = eligible.length;
    if (action === 'tolak') {
        openRejectNoteModal(n, (note) => execBulkDispute(action, eligible, note));
    } else {
        openActionConfirmModal(bulkConfirmMsg(action, n), () => execBulkDispute(action, eligible, null));
    }
}

function execBulkDispute(action, ids, note) {
    const btnContainer = document.getElementById('acqDisputeBulkActionButtons');
    if (btnContainer) { btnContainer.style.opacity = '0.5'; btnContainer.style.pointerEvents = 'none'; btnContainer.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--primary);"></i>'; }
    setTimeout(() => {
        try {
            let count = 0;
            ids.forEach(id => {
                const d = disputes.find(x => x.id === id);
                if (!d || !isDisputeEligible(d, action)) return;
                if (action === 'buat_trx') d.status = 'Transaksi Terbuat';
                else if (action === 'flag_recon') d.status = 'Flag Recon';
                else if (action === 'flag_settle') d.status = 'Flag Settle';
                else if (action === 'tolak') { d.status = 'Ditolak'; d.rejectNote = note; }
                count++;
            });
            if (count === 0) {
                if (btnContainer) { btnContainer.style.opacity = ''; btnContainer.style.pointerEvents = ''; }
                showToast('Tidak Ada Perubahan', 'Tidak ada dispute yang bisa diproses.');
                updateDisputeBulkBar();
                return;
            }
            saveDisputesToStorage();
            writeLog('bulk-dispute-' + action, `email : dion@paydia.id\naction : Bulk ${BULK_ACTION_LABELS[action]} untuk ${count} dispute good faith`);
            selectedDisputeIds = [];
            showToast('Berhasil', 'Berhasil bulk proses data');
            setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
            showToast('Gagal', 'Gagal bulk proses data');
            setTimeout(() => window.location.reload(), 1200);
        }
    }, 600);
}

// Confirm gate: validate max/eligibility, show the right modal, then hand off to execBulkUnmatch.
function handleBulkUnmatchAction(action, ids) {
    // PRD: maks 50 data sekali waktu.
    if (ids.length > BULK_MAX) {
        showToast('Maksimal 50 Data', 'Maksimal 50 data dapat diproses dalam satu bulk action.');
        return;
    }
    const eligible = ids.map(id => transactions.find(t => t.id === id)).filter(t => t && isUnmatchEligible(t, action));
    if (eligible.length === 0) {
        showToast('Tidak Ada Perubahan', 'Tidak ada transaksi yang bisa diproses.');
        updateBulkActionBar();
        return;
    }
    const n = eligible.length;
    if (action === 'tolak') {
        openRejectNoteModal(n, (note) => execBulkUnmatch(action, eligible, note));
    } else {
        openActionConfirmModal(bulkConfirmMsg(action, n), () => execBulkUnmatch(action, eligible, null));
    }
}

// Execute a bulk action across already-confirmed eligible rows, applying the same
// effect as the single-row handler. Loading state -> apply -> log -> reload.
function execBulkUnmatch(action, eligible, note) {
    const btnContainer = document.getElementById('acqBulkActionButtons');
    if (btnContainer) { btnContainer.style.pointerEvents = 'none'; btnContainer.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--primary);"></i>'; }

    try {
        if (action === 'buat_trx' || action === 'flag_settle') {
            // PRD: lewat approval, request digrouping per merchant.
            const groups = {};
            eligible.forEach(t => { (groups[t.merchantId || '-'] = groups[t.merchantId || '-'] || []).push(t); });
            Object.values(groups).forEach(group => createUnmatchApproval(action, group));
            const reqCount = Object.keys(groups).length;
            writeLog('bulk-unmatch-' + action + '-request', `email : dion@paydia.id\naction : Mengajukan bulk ${BULK_ACTION_LABELS[action]} untuk ${eligible.length} transaksi (${reqCount} request approval per merchant)`);
        } else if (action === 'tolak') {
            // Tolak: langsung diterapkan, catatan wajib disimpan per transaksi.
            eligible.forEach(t => { t.flaggingStatus = 'Ditolak'; rrnNotes[t.id] = note; });
            localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes));
            saveTrxToStorage();
            writeLog('bulk-unmatch-tolak', `email : dion@paydia.id\naction : Bulk Tolak untuk ${eligible.length} transaksi unmatched, catatan: ${note}`);
        } else {
            // flag_recon: langsung diterapkan (tanpa approval).
            eligible.forEach(t => { t.flaggingStatus = 'Flag Recon'; });
            saveTrxToStorage();
            writeLog('bulk-unmatch-' + action, `email : dion@paydia.id\naction : Bulk ${BULK_ACTION_LABELS[action]} untuk ${eligible.length} transaksi unmatched`);
        }

        selectedUnmatchIds = [];
        showToast('Berhasil', 'Berhasil bulk proses data');
        setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
        showToast('Gagal', 'Gagal bulk proses data');
        setTimeout(() => window.location.reload(), 1000);
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
        { key: 'paydiaDate', label: 'Tanggal Proses' },
        { key: 'txDate', label: 'Tanggal Transaksi' },
        { key: 'txTime', label: 'Jam Transaksi' },
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
        { key: 'swDate', label: 'Tanggal Transaksi di Switching' },
        { key: 'swTime', label: 'Jam Transaksi di Switching' },
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
                txDate: t.date ? t.date.substring(0, 10).replace(/-/g, '/') : '-',
                txTime: t.date ? t.date.substring(11) : '-',
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
                    vals.txDate = '-';
                    vals.txTime = '-';
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

function pushToApprovalQueue(t, typeReq) {
    let q = JSON.parse(localStorage.getItem('mockApprovalQueue') || '[]');
    q.push({
        id: t.id,
        date: new Date().toISOString(),
        type: typeReq,
        status: 'Pending',
        details: t
    });
    localStorage.setItem('mockApprovalQueue', JSON.stringify(q));
}
