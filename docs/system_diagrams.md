# System Diagrams - Attendance GeoFace

Dokumen ini berisi diagram pemodelan sistem untuk aplikasi Attendance GeoFace, yang mencakup Use Case Diagram dan Sequence Diagram.

## 1. Use Case Diagram

Use Case diagram menggambarkan interaksi antara pengguna (aktor) dengan sistem.

```mermaid
graph LR
    %% Actors
    M((Mahasiswa))
    D((Dosen))

    subgraph System ["Attendance GeoFace System"]
        direction TB
        UC1([Login])
        UC2([Registrasi Wajah])
        UC3([Bergabung Kelas - Kode])
        UC4([Melakukan Absensi])
        UC5([Lihat Riwayat & Statistik])
        UC6([Kelola Kelas - CRUD])
        UC7([Lihat Daftar Hadir])
        UC8([Export Data - CSV])
    end

    %% Student Relationships
    M --> UC1
    M --> UC2
    M --> UC3
    M --> UC4
    M --> UC5

    %% Lecturer Relationships
    D --> UC1
    D --> UC6
    D --> UC7
    D --> UC8

    %% Internal Dependencies (Includes)
    UC4 -.-> UC1
    UC4 -.-> UC2
    UC6 -.-> UC1
```

### Penjelasan Use Case

#### Aktor: Mahasiswa

1.  **Login**: Mahasiswa masuk ke dashboard menggunakan kredensial (NIM/Email).
2.  **Registrasi Wajah**: Mahasiswa mendaftarkan data biometrik wajah mereka menggunakan webcam sebagai syarat utama sebelum bisa melakukan absensi.
3.  **Bergabung Kelas**: Mahasiswa bergabung ke kelas mata kuliah menggunakan "Kode Kelas" unik yang diberikan dosen.
4.  **Melakukan Absensi**: Proses inti di mana mahasiswa menandai kehadiran. Sistem akan memvalidasi:
    - Waktu (Apakah sesuai jadwal?)
    - Lokasi (Apakah berada dalam radius kampus?)
    - Wajah (Apakah wajah cocok dengan data registrasi?)
    - Duplikasi (Apakah sudah absen hari ini?)
5.  **Lihat Riwayat & Statistik**: Mahasiswa melihat daftar kelas, persentase kehadiran, dan status pertemuan.

#### Aktor: Dosen

1.  **Login**: Dosen masuk menggunakan NIP/Kode Dosen.
2.  **Kelola Kelas**: Dosen dapat membuat kelas baru, mengatur jadwal, dan mengedit informasi kelas.
3.  **Lihat Daftar Hadir**: Dosen memantau siapa saja yang hadir, terlambat, atau alpa pada setiap pertemuan.
4.  **Export Data**: Dosen mengunduh laporan kehadiran dan data mahasiswa dalam format CSV/Excel.

---

## 2. Sequence Diagram

Sequence diagram menggambarkan urutan interaksi antar objek/komponen dalam sistem untuk skenario tertentu.

### 2.1 Sequence Diagram: Proses Absensi Mahasiswa

Diagram ini menunjukkan alur ketika mahasiswa melakukan absensi.

```mermaid
sequenceDiagram
    participant M as Mahasiswa
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    participant FACE as Face Recognition Service

    M->>FE: Buka Halaman Kelas
    FE->>DB: Fetch Jadwal & Status Absensi Hari Ini
    DB-->>FE: Return Data Kelas (Jadwal, Status)

    alt Diluar Jadwal / Sudah Absen
        FE-->>M: Button Disable ("Belum Dimulai" / "Sudah Absensi")
    else Dalam Jadwal & Belum Absen
        FE-->>M: Button Enable ("Tandai Kehadiran")
        M->>FE: Klik "Tandai Kehadiran"

        FE->>FE: Cek Lokasi (Geolocation)
        FE->>FE: Capture Wajah (Webcam)

        FE->>API: POST /api/attendance (Image, Location, ClassID)

        API->>DB: Validasi Radius Lokasi
        API->>FACE: Bandingkan Wajah (Face Match)
        FACE-->>API: Match Success/Fail

        alt Data Valid & Wajah Cocok
            API->>DB: Simpan Record Absensi
            DB-->>API: Success
            API-->>FE: Response OK 200
            FE-->>M: Tampilkan "Berhasil Hadir"
        else Gagal (Lokasi Jauh / Wajah Beda)
            API-->>FE: Response Error
            FE-->>M: Tampilkan Pesan Error
        end
    end
```

### Penjelasan Sequence Absensi

1.  Saat mahasiswa membuka halaman, sistem langsung memeriksa **Jadwal** dan **Status Absensi Harian**. Jika tidak valid, tombol di-disable.
2.  Jika valid, mahasiswa mengklik tombol. Frontend mengambil lokasi GPS dan foto wajah.
3.  Data dikirim ke Backend. Backend melakukan verifikasi bertingkat: Radius Lokasi -> Pencocokan Wajah.
4.  Jika semua valid, data disimpan ke database dan status kehadiran mahasiswa tercatat.

---

### 2.2 Sequence Diagram: Pembuatan Kelas Baru (Dosen)

Diagram ini menunjukkan alur dosen membuat kelas baru.

```mermaid
sequenceDiagram
    participant D as Dosen
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    D->>FE: Klik "Buat Kelas Baru"
    FE-->>D: Tampilkan Form
    D->>FE: Input Data (Nama, Kode, Jadwal)
    D->>FE: Submit Form

    FE->>API: POST /api/classes

    API->>DB: Cek Uniqueness Kode Kelas

    alt Kode Sudah Ada
        DB-->>API: Conflict (Kode Duplicate)
        API-->>FE: Error 409
        FE-->>D: Alert "Kode Kelas Sudah Digunakan"
    else Kode Tersedia
        API->>DB: Insert Data Kelas
        DB-->>API: Success (Created)
        API-->>FE: Response OK
        FE-->>D: Redirect ke Dashboard / List Kelas
    end
```

### Penjelasan Sequence Buat Kelas

1.  Dosen mengisi form pembuatan kelas.
2.  Sistem melakukan validasi **Uniqueness** pada Kode Kelas untuk mencegah duplikasi.
3.  Jika kode unik, kelas dibuat dan dosen diarahkan kembali ke dashboard.

---

### 2.3 Sequence Diagram: Cek Kehadiran (Dosen)

Diagram ini menunjukkan alur dosen melihat riwayat kehadiran mahasiswa di suatu kelas.

```mermaid
sequenceDiagram
    participant D as Dosen
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    D->>FE: Buka Halaman Detail Kelas
    FE->>API: GET /api/classes?classId=...
    API-->>FE: Return Info Kelas (Nama, Kode, Total Mhs)

    D->>FE: Klik Tab "Riwayat Kehadiran"

    par Fetch Attendance & Students
        FE->>API: GET /api/attendance?classId=...
        API->>DB: Query Tabel Attendance
        DB-->>API: Return Records
        API-->>FE: Response JSON (List Kehadiran)

        FE->>API: GET /api/enrollments?classId=...
        API->>DB: Query Daftar Mahasiswa
        DB-->>API: Return Students
        API-->>FE: Response JSON (Data Mahasiswa)
    end

    FE-->>D: Tampilkan Tabel Kehadiran (Nama, Status, Waktu)

    opt Export Data
        D->>FE: Klik "Export Data"
        FE->>FE: Generate CSV dari Data
        FE-->>D: Download File .csv
    end
```

### Penjelasan Sequence Cek Kehadiran

1.  Dosen membuka detail kelas. Aplikasi memuat informasi dasar kelas.
2.  Saat dosen mengakses tab "Riwayat Kehadiran", sistem mengambil data absensi dan data mahasiswa secara paralel.
3.  Data digabungkan dan ditampilkan dalam bentuk tabel yang memudahkan monitoring.
4.  (Opsional) Dosen dapat mengunduh data tersebut sebagai file CSV.
