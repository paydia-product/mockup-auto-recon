# Vercel Storage Fix — Runbook

> Panduan nyelesain 2 limit Vercel Hobby yang kena di proyek **algobluedome (BLUEDOME GAP-100)**,
> ditulis biar bisa dipakai ulang ke **proyek Vercel lain** yang kemungkinan kena pola yang sama.
> Tanggal: 2026-06-16.

---

## TL;DR (akar masalahnya satu)

**Jangan pakai Vercel Blob atau Edge Config sebagai "database state aplikasi" yang sering dibaca/ditulis di Hobby plan.**
Keduanya bukan dirancang buat itu:

| Produk | Sebenernya buat apa | Kena limit apa di Hobby |
|---|---|---|
| **Vercel Blob** | File/objek besar (gambar, upload, export) | **Advanced Operations 2.000/bln** (`list`/`put`/`del` dihitung) |
| **Edge Config** | Config kecil read-only (flag, redirect) yang **jarang berubah** | **Ukuran ±8 KB** per config |
| **Upstash Redis (Vercel KV/Marketplace)** | ✅ **State JSON, KV, counter, cache** | 500.000 command/bln (jauh lebih lega) |
| **Vercel Postgres / Neon** | ✅ Data relasional / query | Row & storage cap yang murah hati |

**Solusi umum:** pindahin state aplikasi ke **Upstash Redis (Vercel KV)** kalau bentuknya satu dokumen
JSON / key-value, atau **Postgres** kalau relasional. Pola baca = 1 `GET`, tulis = 1 `SET`.

> ⚠️ Angka limit di atas bisa berubah — selalu cek **vercel.com/docs** + halaman **Usage** tim lu untuk
> nilai terkini. Yang penting polanya, bukan angka persisnya.

---

## Isu A — Vercel Blob: "100% of Advanced Requests (2.000 Operations)"

### Gejala
- Email Vercel: *"used 100% of the included usage ... for Advanced Requests (2,000 Operations) for Vercel Blob"*.
- Aplikasi tiba-tiba "lupa" data: write keliatan sukses dari sisi user (mis. notifikasi/alert terkirim)
  tapi **nggak kesimpen**; dashboard balik ke kondisi awal/seed.
- Saat store diblok, request balikin **HTTP 403 "Your store is blocked"** buat read **dan** write.

### Kenapa kejadian
Vercel Blob menagih operasi sebagai **Simple** (download) vs **Advanced** (`list`, `put`, `copy`, `del`, `head`).
Jebakannya: tiap baca state sering butuh `list()` dulu buat nyari URL blob. Kalau aplikasi:
- punya **dashboard yang polling** tiap beberapa detik, **dan/atau**
- punya **cron / scheduler** yang sering jalan,

maka tiap poll = 1+ Advanced Op. 2.000/bln itu cuma **±66/hari** — habis dalam hitungan jam kalau ada
satu tab dashboard kebuka. Begitu 100%, store diblok → **silent data loss**.

### Cara pastiin proyek lu kena
1. Vercel Dashboard → **Storage** → pilih store → tab **Usage**. Lihat grafik *Advanced Operations*.
2. Grep kode: cari pemakaian `@vercel/blob` —
   ```bash
   grep -rniE "@vercel/blob|\blist\(|\bput\(|\bhead\(|\bdel\(" app lib src 2>/dev/null
   ```
   Kalau ada `list()` / `put()` di **jalur baca yang sering kepanggil** (loader state, healthcheck,
   API yang di-poll) → itu sumbernya.

### Fix (yang dipakai di algobluedome)
1. **Provision Upstash Redis** lewat Vercel Marketplace (lihat "Cara provision KV" di bawah).
2. **Tulis ulang layer storage** jadi REST KV — **tanpa `list()`**:
   ```ts
   const KEY = "app:state:v1";
   const BASE = process.env.KV_REST_API_URL!;
   const TOKEN = process.env.KV_REST_API_TOKEN!;

   export async function loadState() {
     const res = await fetch(`${BASE}/get/${encodeURIComponent(KEY)}`, {
       headers: { Authorization: `Bearer ${TOKEN}` }, cache: "no-store",
     });
     if (!res.ok) throw new Error(`kv get ${res.status}`); // JANGAN diam2 fallback ke seed di write-path
     const j = await res.json();
     return j.result == null ? seedState() : JSON.parse(j.result);
   }

   export async function saveState(state: unknown) {
     const res = await fetch(`${BASE}/set/${encodeURIComponent(KEY)}`, {
       method: "POST", headers: { Authorization: `Bearer ${TOKEN}` },
       body: JSON.stringify(state), cache: "no-store",
     });
     if (!res.ok) throw new Error(`kv set ${res.status}`);
   }
   ```
   - Baca = 1 `GET`, tulis = 1 `SET`. Nggak ada operasi termeter yang boros.
3. **Anti silent-loss (penting):** di jalur yang nulis (cron/engine), **simpan dulu BARU kirim
   notifikasi**. Kalau persist gagal → lempar error (biar scheduler retry) + alarm ke user. Jangan
   pernah ngumumin aksi yang belum kesimpen.
4. **Bedain read-only display path:** dashboard boleh degrade ke seed kalau KV ngadat sesaat (`try/catch`),
   tapi **write path harus throw**, jangan lanjut pakai seed kosong (ini yang dulu bikin "phantom entry").

### Bersih-bersih setelah migrasi
- Hapus dependency `@vercel/blob` dari `package.json` kalau udah nggak dipakai.
- Hapus env `BLOB_READ_WRITE_TOKEN` (boleh ditunda kalau mau coba recover data lama — lihat catatan).
- **Catatan recovery:** blob lama yang keburu diblok **baru bisa kebaca lagi setelah kuota reset**
  (awal bulan berikutnya). Kalau ada data penting di sana, jangan hapus store-nya dulu sampai
  ke-recover.

---

## Isu B — Edge Config: "size limit exceeded"

### Gejala
- Email Vercel: *"an update to Edge Config `<nama>` was rejected for exceeding the Hobby plan size limit"*,
  biasanya nyebut **key** yang kegedean (mis. `state`).

### Kenapa kejadian
Edge Config dioptimasi buat **baca super cepat di edge** atas data **kecil & jarang berubah**
(feature flag, A/B, redirect map). Ada **batas ukuran ±8 KB** di Hobby. Kalau lu coba jejelin
**state aplikasi** (yang bisa puluhan KB dan sering berubah) → write **ditolak**.

> Di algobluedome ini muncul karena ada **percobaan** naruh state (~28 KB) di Edge Config
> `bd-sizetest` waktu eksplorasi storage. Ditolak karena kegedean, lalu ditinggal demi Upstash KV.

### Cara pastiin & fix
1. Cek Edge Config yang ada di tim:
   ```bash
   vercel edge-config ls
   # atau via API:
   # curl -s "https://api.vercel.com/v1/edge-config?teamId=<TEAM_ID>" -H "Authorization: Bearer <TOKEN>"
   ```
2. Grep kode buat referensi:
   ```bash
   grep -rniE "edge.?config|@vercel/edge-config|EDGE_CONFIG" app lib src 2>/dev/null
   ```
3. **Fix:**
   - Kalau cuma **store test/leftover** & nggak ada kode yang make → **hapus Edge Config-nya**
     (`vercel edge-config rm <id>` atau via dashboard). Beres.
   - Kalau aplikasi **beneran** simpan state di situ → **pindahin ke Upstash KV / Postgres** (sama
     kayak Isu A). Edge Config sisain cuma buat config kecil read-only.

---

## Cara provision Upstash KV (Vercel Marketplace)

1. Accept terms (sekali per tim):
   ```bash
   vercel integration accept-terms upstash --yes
   ```
2. Vercel Dashboard → **Storage** → **Create Database** → **Upstash for Redis** → connect ke proyek.
   (CLI: `vercel integration add upstash` lalu ikuti prompt.)
3. Vercel otomatis inject env ke proyek: **`KV_REST_API_URL`**, **`KV_REST_API_TOKEN`**
   (+ `KV_REST_API_READ_ONLY_TOKEN`). Pull ke lokal buat dev:
   ```bash
   vercel env pull .env.local
   ```
4. Seed data awal (kalau perlu migrasi state lama) lewat REST `set`, atau script Node sekali jalan.
5. **Verifikasi** isi store:
   ```bash
   curl -s "$KV_REST_API_URL/get/app:state:v1" -H "Authorization: Bearer $KV_REST_API_TOKEN"
   ```

---

## Checklist audit buat SEMUA proyek Vercel lu

Jalanin per proyek (atau loop):

- [ ] **Usage tim:** Dashboard → Settings → **Usage**. Cek mana yang mendekati 100% (Blob ops,
      Edge Config size, KV commands, Function invocations).
- [ ] **Storage tab:** list semua store. Tandai mana yang **test/leftover** (nama kayak `*-test`,
      `*-sizetest`, `tmp-*`) → kandidat hapus.
- [ ] **Grep tiap repo:**
      ```bash
      grep -rniE "@vercel/blob|@vercel/edge-config|edge.?config|\blist\(" app lib src 2>/dev/null
      ```
      Ada `@vercel/blob` + `list()` di jalur sering-panggil? → migrasi ke KV.
      Ada Edge Config nyimpen data berubah-ubah? → migrasi ke KV/Postgres.
- [ ] **Polling vs ops:** kalau ada dashboard yang `setInterval` fetch ke endpoint yang baca Blob,
      itu pengali utama. Pindah ke KV, atau kurangi frekuensi poll.
- [ ] **Pola save-before-notify** di semua cron/webhook yang nulis state.
- [ ] **Hapus store + dep + env** yang udah nggak dipakai (tunda kalau butuh recovery data).
- [ ] **Pertimbangan upgrade Pro** kalau volume emang gede & legit (limit jauh lebih tinggi + cron presisi).

### Polling hygiene (pencegahan kuota di sisi client)
Dashboard yang `setInterval` fetch ke endpoint yang baca store = penyumbang command terbesar. Pola hemat:
- **Pause saat tab hidden:** stop interval pakai `document.addEventListener("visibilitychange", ...)` →
  tab nganggur di background = **0 command**. Ini penyelamat terbesar di dunia nyata.
- **Cadence bertingkat:** data yang sering berubah (state) di-poll cepat; yang jarang berubah (health/config)
  di-poll jauh lebih jarang (mis. state 60s, health 5 menit).
- **Jangan dobel-baca:** kalau dua endpoint sama-sama baca store tiap tick, gabung atau renggangin.

### Pilih KV vs Postgres
- **Upstash KV (Redis)** → state berbentuk **1 dokumen JSON / key-value**, dibaca-tulis utuh. Simpel,
  serverless-friendly, 1 GET / 1 SET. (Pilihan algobluedome.)
- **Postgres/Neon** → butuh **query relasional** (filter ribuan baris, join, agregasi). Lebih berat
  (koneksi, schema, migration) & tetap punya limit free sendiri (compute-hours, storage).
- Dua-duanya **ADA limit** — nggak ada yang unlimited. Tetap pantau **Usage**.

---

## Status algobluedome (referensi)

| Isu | Status |
|---|---|
| Blob 2.000 Advanced Ops | ✅ Solved — pindah ke Upstash KV (`bluedome:state:v1`), 1 GET / 1 SET, no `list()` |
| Edge Config `bd-sizetest` size | ✅ Solved — store udah dihapus, nggak ada kode yang make (0 Edge Config di tim) |
| Save-before-notify | ✅ `lib/cronrun.ts` |
| Blob lama belum dibersihin | ⏸️ Sengaja ditahan sampai kuota reset (jaga-jaga recovery), boleh dihapus kapan aja |
| Token Stockbit | ⚠️ Manual ~24 jam (isu terpisah; engine fallback ke Yahoo saat mati) |

Lihat juga `HANDOFF.md` di folder ini.
