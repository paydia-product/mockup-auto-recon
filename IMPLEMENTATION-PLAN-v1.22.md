# IMPLEMENTATION-PLAN v1.22.0 — 1 perubahan

Basis: v1.21.0 (working tree bersih). File: `auto-settlement.js`. Baris merujuk snapshot v1.21.0. Gaya ES5. Surgical. TIDAK ada perubahan seed → SEED_VER tidak di-bump.

## Item 1 — Tabel "Breakdown per Bank Tujuan" (konfirmasi Bulk Settle): norek per baris, tetap tergroup per bank

**Masalah:** kolom Nomor Rekening saat ini `d.noreks.join(', ')` (baris 1190) — blob koma, tidak user-friendly.
**Target:** tiap nomor rekening jadi BARIS sendiri, tapi masih terkelompok di bawah bank tujuan yang sama (grouping visual). Kolom Total per norek ikut ditampilkan (data sudah ada). Jumlah rekening + subtotal bank ditaruh di sel bank (rowspan). Pagination tetap per BANK (5 bank/halaman), search tetap by nama bank / norek, Grand Total tetap.

### Perubahan (hanya 3 fungsi, `auto-settlement.js`)

**1) `settleBankTable` (1165-1177):** simpan total PER NOREK (bukan cuma daftar norek). Ganti blok agregasi (baris 1166-1168):
```js
function settleBankTable(arr) {
    var byBank = {};
    arr.forEach(function (g) {
        var b = byBank[g.bank] = byBank[g.bank] || { bank: g.bank, byNorek: {}, order: [], total: 0 };
        if (b.byNorek[g.norek] == null) { b.byNorek[g.norek] = 0; b.order.push(g.norek); }
        b.byNorek[g.norek] += totalOf(g);
        b.total += totalOf(g);
    });
    _sbtData = Object.keys(byBank).sort().map(function (bk) {
        var b = byBank[bk];
        return { bank: b.bank, total: b.total, rows: b.order.map(function (nr) { return { norek: nr, total: b.byNorek[nr] }; }) };
    });
    _sbtPage = 1; _sbtSearch = '';
    var grand = arr.reduce(function (a, g) { return a + totalOf(g); }, 0);
    return '<div style="font-weight:700;font-size:0.85rem;margin:12px 0 8px;">Breakdown per Bank Tujuan</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<input type="text" id="asSbtSearch" placeholder="Cari nama bank / nomor rekening…" style="flex:1;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;font-size:0.82rem;">' +
        '<button type="button" id="asSbtCari" class="btn" style="background:var(--primary);color:#fff;border:none;padding:8px 16px;font-weight:600;">Cari</button></div>' +
        '<div id="asSbtBody"></div>' +
        '<div class="as-kv" style="margin-top:6px;border-top:2px solid #cbd5e1;padding-top:10px;"><span style="font-weight:700;">Grand Total Settlement</span><span style="font-weight:800;">' + rupiah(grand) + '</span></div>';
}
```
> Agregasi per-norek (bukan sekadar push) menjaga benar bila 1 norek punya >1 entry (mis. split Hold Partial norek+bank sama) — total norek dijumlahkan, tidak dobel baris.

**2) `_sbtFiltered` (1178-1182):** norek kini di `d.rows`, bukan `d.noreks`. Ganti baris 1181:
```js
return _sbtData.filter(function (d) { return d.bank.toLowerCase().indexOf(q) !== -1 || d.rows.some(function (r) { return String(r.norek).indexOf(q) !== -1; }); });
```

**3) `renderSbtBody` (1183-1199):** layout rowspan — sel Bank Tujuan menjangkau semua baris norek-nya; tiap norek 1 baris (norek + total norek). Ganti blok `rowsHtml` + header (baris 1188-1198). Kolom: **Bank Tujuan · Nomor Rekening · Total (Rp)** (3 kolom).
```js
    var rowsHtml = slice.length ? slice.map(function (d) {
        var n = d.rows.length;
        return d.rows.map(function (r, ri) {
            var bankCell = ri === 0
                ? '<td rowspan="' + n + '" style="padding:6px 10px;font-weight:600;vertical-align:top;border-right:1px solid var(--border-color);">' + esc(d.bank) +
                    '<div style="font-size:0.7rem;color:var(--text-secondary);font-weight:500;margin-top:2px;">' + n + ' rekening · ' + rupiah(d.total) + '</div></td>'
                : '';
            return '<tr style="border-top:1px solid var(--border-color);">' + bankCell +
                '<td style="padding:6px 10px;font-variant-numeric:tabular-nums;">' + esc(r.norek) + '</td>' +
                '<td style="padding:6px 10px;text-align:right;font-variant-numeric:tabular-nums;">' + num(r.total) + '</td></tr>';
        }).join('');
    }).join('') : '<tr><td colspan="3" style="padding:10px;text-align:center;color:var(--text-muted);">Tidak ada bank cocok.</td></tr>';
    // nav (pagination) TIDAK berubah — tetap per bank, 5/halaman
    var nav = pages > 1 ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:0.78rem;">' +
        '<button type="button" class="btn" data-sbt="prev" style="padding:4px 10px;"' + (_sbtPage <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button>' +
        '<span>Hal ' + _sbtPage + '/' + pages + ' · ' + list.length + ' bank</span>' +
        '<button type="button" class="btn" data-sbt="next" style="padding:4px 10px;"' + (_sbtPage >= pages ? ' disabled' : '') + '>Berikutnya ›</button></div>' : '';
    box.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;"><thead><tr style="background:#f8fafc;text-align:left;">' +
        '<th style="padding:6px 10px;">Bank Tujuan</th><th style="padding:6px 10px;">Nomor Rekening</th><th style="padding:6px 10px;text-align:right;">Total (Rp)</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' + nav;
```
> Kolom "No" & "Jumlah Rekening" lama dilebur: jumlah rekening kini di sub-teks sel bank ("N rekening · Rp subtotal"). "No" dihapus (grouping rowspan jadi penanda visual; penomoran per-baris norek justru membingungkan). Ini penyederhanaan disengaja yang langsung menjawab keluhan.

**`bindSbt` (1200+):** TIDAK berubah (pagination delegasi + tombol Cari tetap).

### Verify browser
- Bulk Settle >5 bank (mix ada bank multi-norek, mis. BUKOPIN 2 norek) → Konfirmasi: tiap norek jadi 1 baris; sel Bank Tujuan (rowspan) memayungi baris-baris norek bank itu + sub-teks "N rekening · Rp subtotal"; tiap baris norek punya Total sendiri; subtotal bank = jumlah total norek-nya; Grand Total = jumlah semua.
- Pagination tetap 5 bank/halaman ("Hal 1/2 · 9 bank"), prev/next benar.
- Ketik norek TANPA klik Cari → tabel tak berubah; klik Cari → bank pemilik norek muncul dgn barisnya; search nama bank idem; kosong+Cari → semua kembali.
- Console 0 error.

### Risk
- Rowspan + border: pastikan garis antar-baris tak berantakan (pakai border-top per `<tr>`, border-right pemisah sel bank). Uji visual.
- 1 norek per bank → rowspan="1" (sel bank normal). Uji bank single-norek.
- `num()` dipakai untuk total baris norek (konsisten dgn tabel lain), `rupiah()` untuk subtotal/grand (ada prefix Rp) — sama seperti sebelumnya.

## Versi & sinkronisasi
- `VERSION`: 1.21.0 → **1.22.0**.
- `versions.js`: entri 1.22.0 paling atas `deployed:true`; 1.21.0 → `deployed:false`.
- `CHANGELOG.md`: entri 1.22.0 (Changed, Bahasa Indonesia).
- HTML cache-buster (`?v=`) untuk auto-settlement.js — bump.
- **SEED_VER: JANGAN bump.**
- `page-guide.js` `GUIDES['auto-settlement.html']`: sync — tabel breakdown bulk settle kini norek per baris tergroup per bank.
- `SETTLEMENT-REFERENCE.md`: sync bagian Konfirmasi Bulk Settle.

## Cek wajib sebelum lapor
- `node -c auto-settlement.js`, `node -c versions.js`, `node -c page-guide.js` lolos.
- Tidak menyentuh fungsi lain / seed. JANGAN commit/tag/push/deploy — tugas orchestrator.
