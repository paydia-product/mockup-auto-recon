# Plan — Auto Reconcile: modal konfirmasi bulk, modal catatan Tolak, seed 200×3

Planned by Opus 4.8. Implement by Sonnet 5. Audit by Opus 4.8. Fix by Sonnet 5.
Files: `app.js`, `index.html` only. Surgical. Jangan refactor hal lain.

## Konteks kode saat ini (sudah diverifikasi)
- Bulk actions: `handleBulkUnmatchAction(action, ids)` (app.js:3459) & `handleBulkDisputeAction(action, ids)` (app.js:3424) → **langsung apply, TANPA modal konfirmasi**.
- Single actions (flag dropdown per baris) **SUDAH** pakai `openActionConfirmModal(msg, onConfirm)` (app.js:390):
  - unmatch: flag-recon (2146), tolak (2180), buat-trx (2204), flag-settle (2236)
  - dispute: tolak (2049), buat-trx (2069), flag-settle (2104)
- `openActionConfirmModal` pakai HTML modal `#actionConfirmOverlay` (index.html:862).
- Notes modal existing: `#notesOverlay` (index.html:806) + `initNotesModal`/`openNotesForm` (app.js:3015/3080) — dipakai untuk edit catatan umum, BUKAN untuk gate Tolak. Jangan diubah.
- `BULK_ACTION_LABELS` (app.js:3113): buat_trx='Buat Transaksi', flag_recon='Flag Recon', flag_settle='Flag Settle', tolak='Tolak'. `BULK_MAX=50`.
- Eligibility: `isUnmatchEligible(t,action)` (3131), `isDisputeEligible(d,action)` (3158).
- `rrnNotes` = catatan per transaksi unmatch (localStorage `paydia_rrn_notes`). Dispute catatan = `d.desc`.
- Seed transaksi = `rawTransactions` (app.js:10–120). Merge ke localStorage existing terjadi di `initDatabase` (app.js:458–472): tiap seed `statusRekon:'Unmatched'` yang id-nya belum ada akan di-push → **seed baru otomatis sampai ke prod user existing**.

---

## Requirement 1 — Modal konfirmasi untuk BULK action (single sudah ada)
Tambahkan konfirmasi (Konfirmasi/Batal) SEBELUM bulk apply, wording per aksi, isi = **jumlah data**.
Single action TIDAK diubah (sudah konfirmasi per-ID) kecuali Tolak (lihat Req 2).

### Wording bulk (pakai count = jumlah data eligible):
- buat_trx: `Ajukan <strong>Buat Transaksi</strong> untuk <strong>N</strong> data? (Memerlukan persetujuan Management)`
- flag_recon: `Lakukan <strong>Flag Recon</strong> pada <strong>N</strong> data?`
- flag_settle: `Ajukan <strong>Flag Settle</strong> untuk <strong>N</strong> data? (Memerlukan persetujuan Management)`
- tolak: TIDAK pakai modal ini — pakai modal catatan Req 2 (yang juga menampilkan jumlah).

### Implementasi (refactor gate + exec):
Pecah `handleBulkUnmatchAction` jadi gate + exec:
```
function handleBulkUnmatchAction(action, ids) {
    if (ids.length > BULK_MAX) { showToast('Maksimal 50 Data', 'Maksimal 50 data dapat diproses dalam satu bulk action.'); return; }
    const eligible = ids.map(id => transactions.find(t => t.id === id)).filter(t => t && isUnmatchEligible(t, action));
    if (eligible.length === 0) { showToast('Tidak Ada Perubahan', 'Tidak ada transaksi yang bisa diproses.'); return; }
    const n = eligible.length;
    if (action === 'tolak') {
        openRejectNoteModal(n, (note) => execBulkUnmatch(action, eligible, note));
    } else {
        openActionConfirmModal(bulkConfirmMsg(action, n), () => execBulkUnmatch(action, eligible, null));
    }
}
```
`execBulkUnmatch(action, eligible, note)` = isi lama handleBulk (spinner + apply + log + reload).
Di dalamnya, saat `action==='tolak'`: untuk tiap `t` set `t.flaggingStatus='Ditolak'` DAN `rrnNotes[t.id]=note` lalu `localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes))`. Log sertakan cuplikan catatan.
Helper `bulkConfirmMsg(action, n)` return string wording di atas.

Lakukan hal sama utk `handleBulkDisputeAction` → gate + `execBulkDispute`. Tolak dispute: `openRejectNoteModal(n, note => ...)`, set `d.status='Ditolak'` DAN `d.rejectNote=note` (field baru) untuk tiap dispute; non-tolak pakai `openActionConfirmModal(bulkConfirmMsg(...))`.

## Requirement 2 — Modal catatan wajib untuk Tolak (single + bulk)
Modal BARU khusus reject. Muncul dengan textarea KOSONG. Tombol Tolak disabled sampai catatan terisi.
Pesan wajib tampil: **"Catatan akan ditambah ke seluruh data yang ditolak"**. Tampilkan juga jumlah data.

### HTML baru di index.html (setelah `#actionConfirmOverlay`, sebelum toast, ~line 881):
```html
<div class="modal-overlay" id="rejectNoteOverlay">
  <div class="modal" style="max-width: 440px;">
    <div class="modal-header">
      <h2 class="modal-title">Tolak Proses Data</h2>
      <button class="modal-close" id="rejectNoteClose" aria-label="Tutup"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" style="padding: 20px;">
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;"><strong id="rejectNoteCount">0</strong> data akan ditolak.</p>
      <div class="form-group">
        <label class="form-label">Catatan <span class="required">*</span></label>
        <textarea id="rejectNoteText" class="form-input form-textarea" rows="4" maxlength="255" placeholder="Masukkan catatan penolakan..." style="resize:none;"></textarea>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;"><i class="fas fa-info-circle"></i> Catatan akan ditambah ke seluruh data yang ditolak</div>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
        <button class="btn" id="rejectNoteCancel" style="background:rgba(255,255,255,0.05);color:var(--text-primary);border:1px solid var(--border-color);">Batal</button>
        <button class="btn" id="rejectNoteConfirm" style="background:var(--danger);color:white;border:none;" disabled>Tolak Data</button>
      </div>
    </div>
  </div>
</div>
```

### JS baru di app.js (dekat openActionConfirmModal):
```
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
```

### Ubah SINGLE Tolak agar lewat modal ini:
- unmatch tolak (app.js:2164–2189): hapus precheck `rrnNotes`+toast+openNotesForm. Tetap pertahankan guard "harus gagal dulu" utk Paydia-Only/Beda Status. Lalu ganti `openActionConfirmModal(...)` jadi:
  `openRejectNoteModal(1, (note) => { t.flaggingStatus='Ditolak'; rrnNotes[t.id]=note; localStorage.setItem('paydia_rrn_notes', JSON.stringify(rrnNotes)); saveTrxToStorage(); writeLog('tolak-unmatch', ...+catatan); showToast('Transaksi Ditolak', ...); renderActiveTableWithLoading(); });`
- dispute tolak (app.js:2040–2055): hapus precheck `d.desc`+toast+openNotesForm. Ganti confirm jadi:
  `openRejectNoteModal(1, (note) => { d.status='Ditolak'; d.rejectNote=note; saveDisputesToStorage(); writeLog('tolak-dispute', ...+catatan); showToast('Dispute Ditolak', ...); renderActiveTableWithLoading(); });`

## Requirement 3 — Seed 200×3 (buat_trx, flag_recon, tolak)
Tambah IIFE seed SETELAH `rawTransactions` literal (app.js:120), sebelum kode lain.
Generate 600 baris unmatched On-Hold, id `TX-ACQ-90000..90599`, refNo unik:
- 200 × label `Double RRN` (createType) → eligible **buat_trx** (+tolak). rcSwitching:'00', switchingTime terisi.
- 200 × label `Paydia-Only Success` (rcPaydia:'00') → eligible **flag_recon**.
- 200 × label `Switching-Only RC00` (rcSwitching:'00') → eligible **tolak** (createType, onHold).
Field per baris ikut shape seed existing (lihat app.js:20 dst): id, refNo, date, nominal, merchantId, merchantName, switching, statusRekon:'Unmatched', flaggingStatus:'On-Hold', tipe:'Acquirer', skema, domestic:'Domestic', disputeRef:null, label, rcPaydia, rcSwitching. Rotasi merchant & switching dari pool existing.
`rawTransactions.push.apply(rawTransactions, rows);` (rawTransactions const array — mutasi push OK).

## Success criteria (verifiable di browser)
1. Bulk buat_trx/flag_recon/flag_settle → muncul modal konfirmasi dengan jumlah data + wording sesuai aksi; Batal batalkan, Konfirmasi lanjut.
2. Bulk Tolak → muncul modal catatan KOSONG, tombol "Tolak Data" disabled; isi catatan → enabled; konfirmasi → semua data jadi Ditolak, catatan tersimpan; ada teks "Catatan akan ditambah ke seluruh data yang ditolak" + jumlah data.
3. Single Tolak (unmatch & dispute) → modal catatan wajib yang sama (jumlah=1) sebelum benar-benar menolak.
4. Setelah reload, ada cukup data untuk bulk **Buat Transaksi**, **Flag Recon**, dan **Tolak** (tiap aksi ≥ puluhan baris terpilih).
5. Tidak ada error console. Halaman lain tidak rusak.

## Non-goals
- Tidak mengubah single non-tolak confirm (sudah ada).
- Tidak menyentuh Auto Settlement, versions*.js, VERSION, CHANGELOG.
- "Approval" flow buat_trx/flag_settle tetap seperti sekarang (hanya ditambah gate konfirmasi).
