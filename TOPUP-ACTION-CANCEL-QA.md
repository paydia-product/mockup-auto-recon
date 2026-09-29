# QA perbaikan Action dan Batal Topup

Tanggal: 29 September 2026. Kandidat versi: `1.25.2`.
Status: lulus untuk kandidat lokal. Audit sumber, tes independen, dan pemeriksaan CUA root selesai setelah satu perbaikan Sol.

## Cakupan dan metode

- Auditor Astra Ultra membaca diff akhir `topup-ui.js`, `topup.css`, empat referensi cache HTML, `VERSION`, dan `CHANGELOG.md` terhadap rencana `IMPLEMENTATION-PLAN-topup-action-cancel.md`.
- CUA pada sesi auditor mengembalikan `browsers: []`. Auditor tidak mengendalikan tab root atau Edge pengguna. Tidak ada klaim bahwa auditor menjalankan browser sendiri pada putaran ini.
- Auditor menjalankan skrip UI dan domain yang sebenarnya di Node dengan model DOM/event kecil. Model menguji handler, state, fokus tujuan, dan posisi scroll yang disimpan. Model ini tidak membuktikan layout CSS, rendering browser, atau kesesuaian implementasi Popover API browser.
- Root menjalankan interaksi browser CUA yang dicatat terpisah di bawah. Temuan dari audit diteruskan ke Sol; auditor tidak mengubah kode produk.

## Temuan audit

| Prioritas | Temuan dan reproduksi | Perbaikan / retest |
|---|---|---|
| P2 | Jalur row-action tanpa pemilik menu membaca `tbody` yang tidak dideklarasikan dalam `setupPayin()`. Pemanggilan handler Edit002 tanpa `activeMenu` menghasilkan `ReferenceError: tbody is not defined` dalam model eksekusi. Klik normal dapat lolos karena operand pertama `activeMenu?.button` tersedia. | Sol mengganti akses dengan `$('topup-table-body').querySelectorAll(...)`. Retest independen membuka Edit002 dan Batal kembali fokus Action002. Lulus. |

Tidak ada temuan terkonfirmasi yang masih terbuka pada diff akhir yang diaudit.

## Tes yang dijalankan langsung oleh auditor

Semua perintah berikut selesai dengan exit code 0:

```text
node --check topup-ui.js
node topup-state.test.js
git diff --check
node topup-ui.test.cjs
```

Auditor awalnya menjalankan skrip sementara `/tmp/paydia-topup-qa/action-cancel-lifecycle.test.cjs`. Sol kemudian menyalinnya ke repo sebagai `topup-ui.test.cjs`, dengan satu perubahan: direktori absolut diganti menjadi `__dirname`. Auditor membandingkan kedua berkas dan menjalankan ulang salinan repo; seluruh 19 skenario kembali lulus. Tes ini memuat `topup-ui.js` dan `topup-state.js` tanpa mengubah sumbernya dan dapat dijalankan dari checkout lain:

1. Model native popover: pindah pemilik 004 → 002 → 001, Escape, klik luar, dan sinkronisasi penutupan native.
2. Cabang tanpa Popover API: maksimal satu panel terbuka; Escape dan klik luar menutup.
3. Dua belas kombinasi asal daftar/Detail × Edit/Request Approve × Batal/X/Escape. Setiap kasus memeriksa tujuan kembali, posisi scroll, target fokus, draft kosong saat dibuka kembali, kesamaan seluruh state persisten, nol penulisan bukti, dan pelepasan Blob URL.
4. Dua jalur submit asinkron Edit/Approve dengan operasi penyimpanan ditunda: pembatalan terkunci saat mengirim, satu transaksi dituju, saldo tetap saat request dibuat, hasil sukses dapat ditutup dan fokus pulih.
5. Retest jalur tanpa pemilik menu yang sebelumnya gagal karena `tbody`.
6. Alur lengkap melalui handler UI dan domain: L1 Edit001 → L3 approve → L1 bukti L2 baru → L2 approve → Detail Log → tutup. Nominal Rp123.456, kredit tepat sekali, transaksi lain sama, serta bukti L3/L2 berbeda.
7. Kegagalan penyimpanan: tombol Batal/X aktif kembali dan Batal mengembalikan Detail004.

Penghitungan di atas adalah 2 + 12 + 2 + 1 + 1 + 1 = 19 skenario, bukan 19 pengujian browser.

Suite `topup-state.test.js` juga tetap lulus untuk guard permission, self-approval, keputusan berulang, nominal, bukti baru, saldo, kegagalan Telegram, snapshot, reset, dan aturan CSP rilis sebelumnya.

## Bukti CUA dari root

### Menu dan pembatalan

- Action002 → Action001 menyisakan tepat satu menu terlihat dan hanya Action001 `aria-expanded=true`.
- Klik tombol Action yang sama, klik luar, dan Escape masing-masing menghasilkan nol menu terlihat dan nol tombol expanded.
- Form Edit001 dari daftar → Batal mengembalikan tabel identik, semua menu tertutup, dan fokus Action001.
- Edit002 dari daftar diisi nominal `987654`, alasan, dan PNG, lalu Batal. Tabel tetap identik. Membuka form kembali menunjukkan nominal usulan, alasan, file, dan preview kosong/tersembunyi.
- Detail002 → Edit → Batal/X/Escape mengembalikan teks Detail identik dan fokus tombol Edit002.
- Detail002 → Request Approve → X/Escape dan upload PNG → Batal mengembalikan teks Detail identik dan fokus Request Approve002.
- Menutup Detail setelah rangkaian tersebut mengembalikan tabel awal yang identik.

### Konteks daftar dan layout

- Search `TOPUP-002` mempertahankan tabel, teks search, dan halaman setelah Batal/X/Escape pada Request Approve.
- Halaman 2 → Detail011 → Tutup mempertahankan `11 - 11 of 11` dan fokus Action011.
- Filter Proses tetap Proses dengan sembilan baris yang sama setelah Edit002 → Batal.
- Pergantian halaman dan akun menutup pemilik menu sebelumnya.
- Pada viewport 1280, menu010 berada di x1049/y517 dengan ukuran180×106 dan tetap di dalam viewport. Scroll horizontal132px tetap bekerja dengan satu pemilik menu.
- Pada viewport 1440, menu001 berada di x1206/y338 dengan ukuran180×106 dan tetap di dalam viewport.

### Submit, halaman bersama, dan reset

- Request Edit002 dengan PNG dan usulan Rp1.000.000 berhasil. Seluruh baris tabel tetap identik sebelum keputusan L3; tidak ada menu tertinggal terbuka. Edit/Request Approve001 tetap dapat dipilih.
- Request Approve001 dengan PNG berhasil. Semua baris tabel tetap sama sebelum keputusan L2. Action004 tetap aktif.
- Approval menampilkan hanya request baru yang sesuai: Adjustment002 dan Topup001. Menutup detail request dengan X kembali ke daftar Approval.
- Detail Log seed003 ditutup dengan Escape secara normal.
- Reset simulasi mengembalikan tabel dan saldo awal yang identik.
- Pemeriksaan console terakhir tidak menunjukkan error atau warning.
- Browser lokal sempat memakai cache HTML Approval lama. Membuka URL versi `?v=1.25.2` memuat referensi aset terbaru. Ini dicatat sebagai kondisi pengujian, bukan cacat produk.

## Matriks acceptance

| ID | Kriteria | Bukti / hasil |
|---|---|---|
| AC01 | Satu pemilik saat pindah baris | CUA root dan model independen lulus. |
| AC02 | Tombol sama/klik luar/Escape menutup | CUA root dan model independen lulus. |
| AC03 | Menu tertutup sebelum modal; transaksi benar | CUA root dan model independen lulus. |
| AC04 | Edit dari daftar kembali dengan konteks sama | CUA root dan model independen lulus. |
| AC05 | Request Approve dari daftar kembali sama | CUA root dengan search aktif dan model independen lulus. |
| AC06 | Edit dari Detail kembali ke Detail | CUA root teks Detail identik; model memeriksa scroll/fokus dan state. Lulus. |
| AC07 | Request Approve dari Detail kembali ke Detail | CUA root dan model independen lulus. |
| AC08 | Batal/X/Escape konsisten | Dua belas kombinasi pada model independen lulus; CUA root menguji kedua form dan asal. |
| AC09 | Draft/file tidak terbawa ke pembukaan berikutnya | CUA root Edit002 dan kedua form pada model independen lulus. |
| AC10 | Cancel sebelum submit tidak menulis state/bukti | Seluruh state persisten sama dan nol penulisan bukti pada dua belas kasus model independen. CUA root membuktikan tabel/draft tetap sesuai. |
| AC11 | Ganti halaman/filter/akun/reset membersihkan pemilik | CUA root halaman/akun/filter/reset lulus. Render dan reset memakai helper penutupan yang sama menurut source. |
| AC12 | Baris terakhir/search tunggal/page2/1440/1280 | CUA root lulus pada kasus dan ukuran yang dicatat di atas. |
| AC13 | Submit hanya memengaruhi transaksi terkait | Model independen alur lengkap lulus. CUA root membuat Edit002 dan Approve001; request sesuai dan baris lain tidak berubah. |
| AC14 | Submit berjalan/gagal tidak memberi pembatalan semu | Model independen penundaan dan kegagalan penyimpanan lulus. |
| AC15 | Approval/Log tetap mengikuti perilaku asal | Model independen keputusan/Log lulus. CUA root menutup detail Approval dengan X dan detail Log dengan Escape kembali ke daftar masing-masing. |
| AC16 | Tanpa Popover API tetap satu owner dan hidden | Model independen dan source CSS lulus. Browser lama tanpa API tidak tersedia untuk pengujian visual. |

## Isolasi perubahan

- Diff produk hanya memuat `topup-ui.js`, `topup.css`, dan cache topup pada `payin.html`, `approval.html`, `admin.html`, `log.html`; metadata versi menjadi 1.25.2.
- Domain, CSP, autentikasi, dan data legacy tidak diubah dalam perbaikan ini.
- Auditor membandingkan hash sembilan file terhadap baseline awal sesi `/tmp/paydia-topup-qa/baseline-sha256.json`. Semuanya sama: `app.js`, `index.html`, `page-guide.js`, `settle-recon.html`, `settle-recon.js`, `auto-settlement.html`, `auto-settlement.js`, `styles.css`, `boot.js`.
- Root juga membandingkan baseline khusus tugas `/tmp/paydia-topup-action-cancel/baseline-sha256.json`: sepuluh file terlindungi tetap identik, termasuk `topup-state.js`, `vercel.json`, dan `middleware.js`. Tepat delapan file tracked untuk tugas ini berubah: dua file produk topup, empat referensi cache HTML, dan dua metadata rilis.
- Berkas baru `topup-ui.test.cjs` menyimpan regresi yang dipakai auditor agar pemeriksaan logika dapat diulang bersama perbaikan ini. Perubahan portabilitasnya telah diaudit terpisah; tidak ada perubahan produk tambahan.
- Perubahan lama di lima file dirty tetap utuh. Status dirty tersebut tidak berarti file-file itu merupakan bagian perbaikan ini.

## Batas hasil

- Gejala visual seluruh menu terbuka belum direproduksi pada browser root sebelum perbaikan. Stale `aria-expanded` pada beberapa baris dan kehilangan Detail asal sudah direproduksi dan kini diperbaiki.
- Klaim tanpa penulisan data berlaku untuk pembatalan sebelum submit. Setelah submit valid dimulai, UI menampilkan Mengirim dan mengunci pembatalan sampai operasi selesai atau gagal.
- Model DOM tidak menggantikan CUA untuk layout, fokus native browser, atau perilaku Popover API sesungguhnya.
- Audit ini menilai kandidat lokal 1.25.2. Hasil deployment belum dicakup di sini.

## Pertanyaan untuk Dion

Tidak ada.

## Asumsi yang gue pakai

1. Batal dari daftar kembali ke daftar dengan menu tertutup. Batal dari Detail kembali ke Detail transaksi yang sama.
2. Perubahan domain yang sah dari tab lain tidak diputar balik oleh Batal.
