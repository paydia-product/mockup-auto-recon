# Rencana Implementasi Mockup — Auto Settlement

> Sumber: `CR - Auto Settlement_Christian Handoko.pdf` (FM-010-IT-PAY, Versi 3.0)
> Requestor: Christian Handoko (Head of FAT) · Approved: Deni Koesmanto (Dirut), 30/12/2025
> Konteks: lanjutan langsung dari mockup **Auto Recon** yang sudah ada di folder ini.
> Stack existing: vanilla multi-page HTML + JS murni (tanpa build step), sidebar shared, `page-guide.js`, pola maker-checker di `approval.html`. Mockup ini **mengikuti pola itu** — tanpa dependency/framework baru.

---

## 0. Inti CR (ringkas)

Saat ini settlement harian dari Operation → disbursement ke merchant dilakukan **manual via Excel + e-banking** oleh Finance. CR meminta otomatisasi end-to-end lewat **Auto Settlement Dashboard**, dengan keterkaitan wajib:

> **Auto Settlement HANYA bisa berjalan jika Auto Recon untuk tanggal tersebut sudah dijalankan & selesai (matched).** Ini gate utama yang harus terlihat di mockup.

Poin kunci dari Change Description & Risk Assessment yang harus tercermin di mockup:

| # | Poin CR | Implikasi mockup |
|---|---------|------------------|
| 1 | Settlement disegregasi otomatis per bank (BCA/Mandiri/BRI + Lainnya), Lainnya kena admin flat Rp6.500 | Sudah ada di `settle-recon.html` (Export per Bank) — Auto Settlement memanfaatkan logika sama |
| 2 | Adjustment chargeback (+/−) otomatis terbawa | Kolom adjustment di tabel batch |
| 3 | Adjustment by admin (3 bank) → harus lewat **sub-menu Adjustment** + verifikasi Finance | Halaman/menu Adjustment baru |
| 4 | Verifikasi nomor rekening via **master lookup** (whitelist rekening), bukan ketik manual | Validasi saat build batch |
| 5 | **Maker → Checker → Approver** (3 layer, 3 PIC berbeda), tanpa skip; device whitelist + 2FA | Flow approval Auto Settlement |
| 6 | Hold/release settlement (subject pembentukan PRD) | Aksi Hold/Release di batch |
| 7 | Disbursement per channel payment / per bank, level approval beda-beda | Status disbursement per bank |
| 8 | Auto Settlement bisa di-export ke Excel | Tombol Export |
| 9 | Batas waktu sistem **14.00**; lewat itu → fallback manual | Indikator cut-off |

---

## 1. Arsitektur Halaman

### Keputusan: **1 halaman baru** + **3 modifikasi ringan**

Auto Settlement adalah modul tersendiri (alur Maker→Checker→Approver + disbursement) sehingga layak halaman sendiri, bukan tab di `settle-recon.html`. Tapi ia **membaca state** dari Settle & Recon, jadi keterkaitan dibangun lewat shared state (localStorage, pola yang sudah dipakai `approval.js`).

| Aksi | File | Keterangan |
|------|------|-----------|
| **BARU** | `auto-settlement.html` + `auto-settlement.js` | Dashboard utama Auto Settlement |
| **MODIF** | `index.html` (sidebar) | Tambah submenu **Auto Settlement** di grup Settlement |
| **MODIF** | `settle-recon.js` | Saat recon selesai, set flag `paydia_recon_done_<tanggal>` = true (gate) |
| **MODIF** | `page-guide.js` | Tambah entri panduan untuk `auto-settlement.html` |

> ponytail: tidak bikin halaman Adjustment & Disbursement terpisah dulu — keduanya jadi **modal/sub-panel** di dalam `auto-settlement.html`. Pecah jadi halaman sendiri hanya kalau nanti diminta.

---

## 2. Detail per Halaman

### 2.1 `auto-settlement.html` (BARU) — Dashboard Auto Settlement

Struktur mengikuti `settle-recon.html`: shared sidebar, `page-title`, satu `.card` utama, tabel `.data-table`, modal `.modal-overlay`, toast.

**Layout dari atas ke bawah:**

1. **Gate Banner (paling penting)** — di atas card utama.
   - Jika recon tanggal terpilih **belum selesai** → banner merah: *"Auto Recon untuk DD-MM-YYYY belum selesai. Jalankan recon dulu di Settle & Recon."* + tombol link ke `settle-recon.html`. Seluruh aksi settlement **disabled**.
   - Jika sudah selesai → banner hijau: *"Recon selesai ✓ — siap settlement"*. Aksi enabled.

2. **Toolbar**: pilih Tanggal Settlement · toggle **Auto Settlement Schedule** (ON/OFF, pola toggle sama dgn Auto Reporting di settle-recon) · indikator **Cut-off 14.00** (countdown/teks) · tombol **Filter** · **Export Excel**.

3. **Kartu ringkasan per bank** (segregasi otomatis): 4 kartu — BCA, Mandiri, BRI, Lainnya — masing-masing: jumlah transaksi, total nominal, total biaya admin, total settlement bersih. (Lainnya: admin flat Rp6.500/rekening.)

4. **Tabel batch settlement** — kolom:
   `Checkbox · No · Tanggal · Merchant · Bank · No.Rek (✓ master lookup) · Nominal Awal · Biaya Admin · Adj. CB (+) · Adj. CB (−) · Total Settlement · Status Approval · Status Disbursement · Aksi`

5. **Status Approval** (badge): `Draft → Maker Submitted → Checked → Approved` (atau `Rejected`, `On Hold`). Reuse class `status-badge`.

6. **Status Disbursement** (badge): `Pending → Diproses → Selesai` per bank.

7. **Bulk action bar** (muncul saat ada row terpilih): **Submit (Maker)**, **Hold**, **Release**, **Adjustment**.

**Modal yang dibutuhkan (semua di file ini):**
- Modal **Konfirmasi Submit/Approve/Reject** (reuse pola `confirmModal`).
- Modal **Adjustment** — form: pilih transaksi, tipe (chargeback +/−), nominal, alasan; tertanda *butuh verifikasi Finance*.
- Modal **Detail Disbursement per bank**.
- Modal **2FA / Device check** (mock): input OTP 6 digit sebelum Approve (CR poin device whitelist + 2FA). Mock-only, OTP apa saja diterima dengan note "simulasi".

### 2.2 `index.html` — sidebar (MODIF)

Di grup `nav-settlement-group`, tambah submenu setelah Settle & Recon:
```html
<a href="auto-settlement.html" class="submenu-item" id="nav-auto-settlement">
    <i class="fas fa-money-bill-transfer"></i>
    <span>Auto Settlement</span>
    <span class="sidebar-badge-dot"></span>
</a>
```
Salin blok sidebar yang sama ke **semua** halaman (pola existing: sidebar di-copy per file). Minimal: `settle-recon.html` & `auto-settlement.html`.

### 2.3 `settle-recon.js` — gate flag (MODIF)

Saat recon untuk satu tanggal selesai (Manual Recon sukses / semua matched), set:
```js
localStorage.setItem('paydia_recon_done_' + tgl, JSON.stringify({done:true, ts:Date.now(), matched:n}));
```
`auto-settlement.js` membaca key ini untuk gate. Tidak ada perubahan UI di settle-recon selain set flag.

### 2.4 `page-guide.js` (MODIF)

Tambah `'auto-settlement.html'` ke object `GUIDES` dengan item: Gate dari Recon, Segregasi per Bank, Adjustment Chargeback, Maker-Checker-Approver, Hold/Release, Cut-off 14.00, Export.

---

## 3. Flow Inti (state machine settlement)

```
[Recon selesai?] --tidak--> GATE: aksi disabled, banner merah
       | ya
       v
   Draft (batch auto-generated, segregasi per bank, adj. CB terbawa)
       | Maker pilih + Submit
       v
   Maker Submitted --(Checker review)--> Checked --(Approver + 2FA)--> Approved
       |                                    |                            |
       |--Hold--> On Hold --Release--> kembali ke tahap sebelumnya       |
       |                                                                  v
       Reject di tahap mana pun --> Rejected                       Disbursement
                                                                  (per bank: Pending->Diproses->Selesai)
```

Aturan dari CR yang di-enforce di mock:
- **Tidak boleh skip**: tombol Approve disabled sampai status = `Checked`; Check disabled sampai `Maker Submitted`. 3 aksi = 3 "peran" berbeda (di mock dipilih lewat dropdown peran / atau diasumsikan PIC berbeda).
- **No.Rek wajib lolos master lookup** sebelum bisa Submit (kalau tidak match → row ditandai merah, tak bisa disubmit).
- **Adjustment** hanya lewat modal Adjustment, dan menambahkan tag "menunggu verifikasi Finance".
- **Cut-off 14.00**: jika jam sistem > 14.00, banner kuning "Lewat cut-off — fallback manual" (mock pakai jam lokal browser).

---

## 4. Subfitur (checklist)

- [ ] Gate Auto Recon → Auto Settlement (banner + disable aksi)
- [ ] Toggle Auto Settlement Schedule (ON/OFF)
- [ ] Indikator cut-off 14.00
- [ ] Segregasi otomatis per bank + kartu ringkasan (admin flat Rp6.500 utk "Lainnya")
- [ ] Adjustment chargeback (+/−) terbawa otomatis ke Total Settlement
- [ ] Sub-menu Adjustment manual (modal) + tag verifikasi Finance
- [ ] Master lookup validasi nomor rekening (whitelist)
- [ ] Maker → Checker → Approver (no-skip enforced)
- [ ] Mock 2FA/OTP + catatan device whitelist sebelum Approve
- [ ] Hold / Release settlement
- [ ] Status Disbursement per bank (Pending/Diproses/Selesai)
- [ ] Export Excel (reuse pola export settle-recon)
- [ ] Panduan halaman (page-guide)

---

## 5. /goal — Kriteria Sukses (verifiable)

1. Buka `auto-settlement.html` dengan tanggal yang **recon-nya belum selesai** → seluruh tombol aksi disabled + banner merah muncul. **verify:** klik Submit tidak melakukan apa-apa; banner merah terlihat.
2. Set recon selesai di `settle-recon.html`, kembali ke Auto Settlement tanggal sama → banner hijau, aksi enabled, batch ter-generate per bank. **verify:** jumlah & total per kartu bank = total tabel.
3. Coba Approve langsung dari Draft → **gagal** (disabled). Harus Submit→Check→Approve berurutan. **verify:** Approve hanya aktif saat status `Checked`.
4. Tambah adjustment chargeback (−) pada 1 transaksi → Total Settlement turun sesuai nilai. **verify:** Total = Nominal − Admin + Adj(+) − Adj(−).
5. Row dengan No.Rek di luar whitelist → ditandai merah & tak bisa Submit. **verify:** Submit batch melewati/menolak row tsб.
6. Export menghasilkan modal/file simulasi tersegregasi per bank. **verify:** tab BCA/Mandiri/BRI/Lainnya terisi benar.

## 6. /loop — Urutan Pengerjaan

```
1. Modif sidebar (index + settle-recon + buat auto-settlement.html shell) → verify: menu muncul, halaman load tanpa error console
2. settle-recon.js set flag recon_done                                   → verify: localStorage terisi setelah recon
3. auto-settlement.js: gate + render batch per bank dari mockSettleData   → verify: kriteria #1 & #2
4. State machine Maker→Checker→Approver + 2FA modal                       → verify: kriteria #3
5. Adjustment modal + master lookup + Total calc                         → verify: kriteria #4 & #5
6. Disbursement status + Hold/Release + Export                           → verify: status berubah, export modal benar
7. page-guide entry                                                       → verify: tombol Panduan tampil isi benar
```

## 7. /verify — Cara Cek Akhir

- Buka tiap halaman, cek **console bersih** (tanpa error JS).
- Jalankan 6 skenario /goal secara manual di browser.
- Cek konsistensi sidebar di semua halaman (link aktif benar).
- Deploy preview Vercel (`ar-mockup`) bila perlu demo.

---

## Catatan ruang lingkup (ponytail)

- Mock pakai data dari `mockSettleData.json` / array di `settle-recon.js`; **tidak ada backend baru**. 2FA, device whitelist, master lookup = simulasi front-end.
- Halaman Adjustment & Disbursement = modal dulu; pecah jadi halaman sendiri hanya jika diminta.
- Cut-off & countdown pakai jam browser (cukup untuk mockup). 
- skipped: auth backend nyata, persistensi server, OTP nyata → tambah saat masuk fase PRD/integrasi (CR menandai beberapa item "subject pembentukan PRD").
