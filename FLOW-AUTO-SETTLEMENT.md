# Flow End-to-End — Auto Settlement

Dokumen ini menggambarkan alur data settlement dari pertama masuk **Tab Checker**, melalui **Approver**, hingga hasil akhir di **Hold / Settle / Reject**. Mencakup happy flow, negative flow, dan edge case untuk setiap kemungkinan keputusan. Semua aksi yang tersedia di halaman ikut dipetakan.

Aksi yang tercakup: Auto-hold, Hold (Semua / Partial / Dibawah Min), Reject, Settle, Bulk Settle, Lihat Detail, Lihat Catatan, Approve/Reject request, Reject by Bank, Retry Settlement, Export, Export Segregasi, serta status Settle (Pending / Success / Fail / Reject by Bank).

---

## 0. Flowchart Ringkas — Satu Chart End-to-End

Ringkasan seluruh fitur Auto Settlement dalam satu diagram: dari data masuk, tahap Checker → Approver, hasil Hold / Settle / Reject, siklus status Settle, hingga Retry, Reject by Bank, dan Export.

```mermaid
flowchart TD
    A([Settlement masuk]) --> B{"Bank Lainnya dan Total kurang dari Rp10.000?"}
    B -->|Ya| HOLD[[Tab Hold]]
    B -->|Tidak| CHK[[Tab Checker]]

    CHK --> ACT{Aksi Checker}
    ACT -->|Lihat Detail| DET[Lihat Detail ID Settlement]
    ACT -->|Hold Semua / Partial / Min| AH[Ajukan Hold]
    ACT -->|Reject| AR[Ajukan Reject]
    ACT -->|Settle / Bulk Settle| AS[Ajukan Settle - Metode, Channel, Transfer]
    DET --> Z([End])

    AH --> APV[[Tab Approver]]
    AR --> APV
    AS --> APV

    APV --> DEC{Keputusan Approver}
    DEC -->|Reject request| CHK
    DEC -->|Approve Hold| HOLD
    DEC -->|Approve Reject| REJ[[Tab Reject]]
    DEC -->|Approve Settle| SET[[Tab Settle]]

    HOLD -->|Aksi: Reject / Settle| APV
    REJ -->|Aksi: Hold / Settle| APV

    SET --> MET{Metode Settlement}
    MET -->|Manual| MSUC[Status Success - catat saja, tidak kirim ke bank]
    MET -->|Otomatis| BANK[Kirim ke Bank - status Pending]
    BANK --> RESP{Respons Bank}
    RESP -->|Sukses| SUC[Status Success]
    RESP -->|Gagal sistem| FAIL[Status Fail]
    RESP -->|Ditolak| RBB[Status Reject by Bank]

    MSUC --> RbB{Reject by Bank - Manual saja}
    RbB -->|Ya| RBB
    RbB -->|Tidak| EXP[Export / Export Segregasi]
    FAIL --> RTR{Retry Settlement - Otomatis}
    RTR -->|Ya| BANK
    RTR -->|Tidak| EXP
    SUC --> EXP
    RBB --> EXP
    EXP --> Z
```

> Tombol Export tersedia di tab Checker/Hold/Reject/Settle; Export Segregasi khusus tab Settle. Detail validasi tiap aksi ada di diagram berikutnya.

---

## 1. Flowchart — Alur High-Level End-to-End

```mermaid
flowchart TD
    A([Settlement masuk sistem]) --> B{"Bank tujuan Lainnya dan Total kurang dari Rp10.000?"}
    B -->|Ya| H[[Tab Hold - auto-hold]]
    B -->|Tidak| C[[Tab Checker]]
    C --> D{Aksi Checker?}
    D -->|Hold| E[Ajukan Hold]
    D -->|Reject| F[Ajukan Reject]
    D -->|Settle / Bulk Settle| G[Ajukan Settle]
    E --> P[[Tab Approver]]
    F --> P
    G --> P
    P --> Q{Keputusan Approver?}
    Q -->|Reject request| C
    Q -->|Approve Hold| H
    Q -->|Approve Reject| R[[Tab Reject]]
    Q -->|Approve Settle| S[[Tab Settle]]
    H --> T([End])
    R --> T
    S --> T
```

---

## 2. Flowchart — Aksi di Tab Checker + Validasi

```mermaid
flowchart TD
    A([User di Tab Checker]) --> B{Pilih aksi baris}
    B -->|Lihat Detail| B1[Tampilkan Detail ID Settlement]
    B -->|Hold| C{Cakupan Hold?}
    B -->|Reject| D[Isi catatan + bukti opsional]
    B -->|Settle / Bulk| E[Pilih Metode Settlement, Channel Payment, Metode Transfer]

    C -->|Hold Semua / Dibawah Min| F[Isi catatan wajib]
    C -->|Hold Partial| G[Pilih MID + catatan + upload bukti]

    F --> FV{Catatan terisi?}
    FV -->|Tidak| X[Toast error - tetap di form]
    FV -->|Ya| OK1[Ajukan Hold ke Approver]

    G --> GV{MID dipilih dan bukti valid?}
    GV -->|Tidak| X
    GV -->|Ya| OK2[Pecah MID jadi settlement baru ke Approver, sisa MID tetap di Checker]

    D --> DV{Catatan terisi?}
    DV -->|Tidak| X
    DV -->|Ya| OK3[Ajukan Reject ke Approver]

    E --> EV{Semua field wajib terisi dan bukti valid?}
    EV -->|Tidak| X
    EV -->|Ya| OK4[Ajukan Settle ke Approver]

    B1 --> Z([Selesai])
    X --> Z
    OK1 --> Y([Menunggu Approver])
    OK2 --> Y
    OK3 --> Y
    OK4 --> Y
```

> Edge case bukti: format selain PDF/JPG/JPEG/PNG atau ukuran lebih dari 25 MB dianggap tidak valid → masuk cabang "Toast error - tetap di form".

---

## 3. Flowchart — Keputusan Approver

```mermaid
flowchart TD
    A([Tab Approver]) --> B[Review Detail Request, Catatan, Bukti]
    B --> C{Approve atau Reject?}
    C -->|Reject request| D[Kembalikan ke status sebelumnya - umumnya Checker]
    C -->|Approve| E{Tipe request?}
    E -->|Hold| F[[Tab Hold]]
    E -->|Reject| G[[Tab Reject]]
    E -->|Settle| H[Simpan Metode dan Channel. Manual jadi Success, Otomatis jadi Pending]
    H --> I[[Tab Settle]]
    D --> J([Selesai])
    F --> J
    G --> J
    I --> J
```

> Tab Approver tidak memiliki tombol Export. Aksi hanya Approve, Reject, dan Lihat bukti.

---

## 4. Flowchart — Aksi di Tab Hold / Reject / Settle

```mermaid
flowchart TD
    A([Hasil di tab akhir]) --> B{Tab mana?}
    B -->|Hold| H{Aksi Hold?}
    B -->|Reject| R{Aksi Reject?}
    B -->|Settle| S{Aksi Settle?}

    H -->|Reject| H1[Ajukan Reject ke Approver]
    H -->|Settle| H2[Ajukan Settle ke Approver]
    H -->|Lihat Catatan| H3[Tampilkan catatan dan bukti]

    R -->|Hold| R1[Ajukan Hold ke Approver]
    R -->|Settle| R2[Ajukan Settle ke Approver]
    R -->|Lihat Catatan| R3[Tampilkan catatan dan bukti]

    S -->|Lihat Detail| S1[Tampilkan Request/Response, status, Disetujui Oleh]
    S -->|Reject by Bank| S2{Metode Settlement Manual?}
    S -->|Retry Settlement| S3[Pilih tanggal retry]
    S -->|Export / Export Segregasi| S4[Simulasi hasil export]

    S2 -->|Tidak| S2X[Aksi tidak tersedia]
    S2 -->|Ya| S2Y[Tandai status Reject by Bank]

    S3 --> S3D{Ada data Otomatis dan status Gagal?}
    S3D -->|Tidak| S3X[0 transaksi di-retry]
    S3D -->|Ya| S3Y[Kirim ulang ke bank, status kembali Pending]

    H1 --> Z([Selesai])
    H2 --> Z
    H3 --> Z
    R1 --> Z
    R2 --> Z
    R3 --> Z
    S1 --> Z
    S2X --> Z
    S2Y --> Z
    S3X --> Z
    S3Y --> Z
    S4 --> Z
```

> Export Segregasi hanya muncul di Tab Settle dan hanya memuat data Metode Settlement Manual.

---

## 5. Flowchart — Siklus Status di Tab Settle

```mermaid
flowchart TD
    A([Settle disetujui Approver]) --> B{Metode Settlement?}
    B -->|Manual| M[Status Success - catat saja, tanpa Request/Response]
    B -->|Otomatis| K[Kirim data ke bank - status Pending]
    M --> Z([End])
    K --> C{Respons bank?}
    C -->|Belum ada| P[Status Pending - Response data kosong]
    C -->|Berhasil| SU[Status Success]
    C -->|Gagal sistem - timeout atau server| FA[Status Fail]
    C -->|Ditolak bank - norek invalid atau dibekukan| RB[Status Reject by Bank]
    P --> Z
    SU --> Z
    RB --> Z
    FA --> D{Retry Settlement Otomatis?}
    D -->|Ya| K
    D -->|Tidak| Z
```

> Reject by Bank per baris hanya untuk item Manual; item Otomatis yang gagal ditangani lewat Retry Settlement.

---

## 6. Sequence Diagram — Alur Settle (Checker → Approver → Bank)

```mermaid
sequenceDiagram
    actor C as Checker
    participant S as Sistem Auto Settlement
    actor A as Approver
    participant B as Bank
    C->>S: Ajukan Settle - Metode, Channel, Metode Transfer
    S->>S: Validasi field wajib dan bukti
    alt Field tidak lengkap / bukti invalid
        S-->>C: Toast error, tetap di form
    else Valid
        S->>S: Pindah ke Tab Approver
        A->>S: Buka detail request
        alt Approver Reject
            S->>S: Kembalikan ke status sebelumnya
            S-->>C: Settlement kembali ke Checker
        else Approver Approve
            alt Metode Otomatis
                S->>S: Status = Pending
                S->>B: Kirim data transfer
                alt Bank sukses
                    B-->>S: Success
                    S->>S: Status = Success
                else Bank gagal sistem
                    B-->>S: Timeout / server error
                    S->>S: Status = Fail
                else Bank menolak
                    B-->>S: Norek invalid / dibekukan
                    S->>S: Status = Reject by Bank
                end
            else Metode Manual
                S->>S: Status = Success - catat saja, tanpa Request/Response
            end
        end
    end
```

---

## 7. Sequence Diagram — Hold Partial (Pecah Settlement)

```mermaid
sequenceDiagram
    actor C as Checker
    participant S as Sistem Auto Settlement
    actor A as Approver
    C->>S: Hold Partial - pilih sebagian MID, catatan, bukti
    S->>S: Validasi MID terpilih dan bukti wajib
    alt MID kosong / bukti invalid
        S-->>C: Toast error, tetap di form
    else Valid
        S->>S: Buat settlement baru berisi MID terpilih
        S->>S: Settlement lama sisakan MID lain di Checker
        S->>A: Kirim request Hold Partial - settlement baru
        alt Approver Approve
            S->>S: Settlement baru pindah ke Tab Hold
        else Approver Reject
            S->>S: Settlement baru kembali ke Checker
        end
    end
```

---

## 8. Sequence Diagram — Retry Settlement

```mermaid
sequenceDiagram
    actor U as Operator - Tab Settle
    participant S as Sistem Auto Settlement
    participant B as Bank
    U->>S: Klik Retry Settlement, pilih Tanggal
    alt Tanggal kosong
        S-->>U: Toast - Tanggal wajib
    else Tanggal dipilih
        S->>S: Cari data Metode Otomatis dan status Gagal
        alt Tidak ada data
            S-->>U: 0 transaksi di-retry
        else Ada data
            S->>B: Kirim ulang data transfer
            S->>S: Status kembali ke Pending
            S-->>U: N transaksi dikirim ulang ke bank
        end
    end
```
