# Diagram Sistem Presensi Otomatis

**Aplikasi:** Sistem Presensi Otomatis Mahasiswa Menggunakan Face Recognition dan Geolocation Berbasis Web

---

## 1. Use Case Diagram

```mermaid
flowchart TB
    subgraph system["🎓 Sistem Presensi Otomatis"]
        direction TB

        subgraph student_uc["Use Case Mahasiswa"]
            UC1["🔐 Login"]
            UC2["📸 Registrasi Wajah"]
            UC3["✅ Tandai Kehadiran"]
            UC4["📋 Lihat Riwayat Absensi"]
            UC5["📚 Lihat Daftar Kelas"]
        end

        subgraph lecturer_uc["Use Case Dosen"]
            UC6["🔐 Login"]
            UC7["📊 Lihat Daftar Kehadiran"]
            UC8["👥 Lihat Daftar Mahasiswa"]
            UC9["📚 Lihat Detail Kelas"]
        end

        subgraph core_features["Fitur Inti Absensi"]
            UC3_1["🤖 Face Recognition"]
            UC3_2["👁️ Liveness Detection"]
            UC3_3["📍 Geolocation Verification"]
        end
    end

    Student(("👨‍🎓 Mahasiswa"))
    Lecturer(("👨‍🏫 Dosen"))

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5

    Lecturer --> UC6
    Lecturer --> UC7
    Lecturer --> UC8
    Lecturer --> UC9

    UC3 -.->|include| UC3_1
    UC3 -.->|include| UC3_2
    UC3 -.->|include| UC3_3

    UC3_1 -.->|extend| UC2

    style system fill:#e8f4fd,stroke:#1e88e5,stroke-width:2px
    style student_uc fill:#e8f5e9,stroke:#43a047,stroke-width:1px
    style lecturer_uc fill:#fff3e0,stroke:#fb8c00,stroke-width:1px
    style core_features fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style Student fill:#4caf50,color:#fff
    style Lecturer fill:#ff9800,color:#fff
```

### Deskripsi Use Case

| ID  | Use Case               | Aktor     | Deskripsi                                                       |
| --- | ---------------------- | --------- | --------------------------------------------------------------- |
| UC1 | Login Mahasiswa        | Mahasiswa | Mahasiswa login menggunakan NIM                                 |
| UC2 | Registrasi Wajah       | Mahasiswa | Capture dan simpan data embedding wajah                         |
| UC3 | Tandai Kehadiran       | Mahasiswa | Proses absensi dengan Face Recognition + Liveness + Geolocation |
| UC4 | Lihat Riwayat Absensi  | Mahasiswa | Melihat catatan kehadiran                                       |
| UC5 | Lihat Daftar Kelas     | Mahasiswa | Melihat kelas yang diikuti                                      |
| UC6 | Login Dosen            | Dosen     | Dosen login dengan kode dan password                            |
| UC7 | Lihat Daftar Kehadiran | Dosen     | Melihat rekap kehadiran mahasiswa                               |
| UC8 | Lihat Daftar Mahasiswa | Dosen     | Melihat mahasiswa yang terdaftar                                |
| UC9 | Lihat Detail Kelas     | Dosen     | Melihat informasi detail kelas                                  |

---

## 2. Data Flow Diagram (DFD)

### DFD Level 0 (Context Diagram)

```mermaid
flowchart LR
    Student(("👨‍🎓 Mahasiswa"))
    Lecturer(("👨‍🏫 Dosen"))

    subgraph System["⚙️ Sistem Presensi Otomatis"]
        P0["Proses<br/>Presensi<br/>Otomatis"]
    end

    Student -->|"NIM, Data Wajah, Lokasi"| P0
    P0 -->|"Status Kehadiran, Riwayat"| Student

    Lecturer -->|"Kode Dosen, Password"| P0
    P0 -->|"Data Kehadiran, Daftar Mahasiswa"| Lecturer

    style System fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style P0 fill:#1976d2,color:#fff,stroke:#0d47a1
    style Student fill:#4caf50,color:#fff
    style Lecturer fill:#ff9800,color:#fff
```

### DFD Level 1

```mermaid
flowchart TB
    Student(("👨‍🎓 Mahasiswa"))
    Lecturer(("👨‍🏫 Dosen"))

    subgraph Processes["Proses Sistem"]
        P1["1.0<br/>Autentikasi<br/>User"]
        P2["2.0<br/>Registrasi<br/>Wajah"]
        P3["3.0<br/>Proses<br/>Absensi"]
        P4["4.0<br/>Kelola<br/>Kehadiran"]
    end

    subgraph DataStores["Data Store"]
        D1[("D1: Students")]
        D2[("D2: Lecturers")]
        D3[("D3: Face Data")]
        D4[("D4: Attendance")]
        D5[("D5: Classes")]
        D6[("D6: Enrollments")]
    end

    Student -->|"NIM"| P1
    Lecturer -->|"Kode, Password"| P1
    P1 <-->|"Validasi"| D1
    P1 <-->|"Validasi"| D2
    P1 -->|"Token Auth"| Student
    P1 -->|"Token Auth"| Lecturer

    Student -->|"Foto Wajah"| P2
    P2 -->|"Face Descriptor"| D3
    P2 -->|"Status Registrasi"| Student

    Student -->|"Foto, Lokasi GPS"| P3
    P3 <-->|"Match Face"| D3
    P3 <-->|"Validasi Kelas"| D5
    P3 <-->|"Validasi Enrollment"| D6
    P3 -->|"Rekam Kehadiran"| D4
    P3 -->|"Status Absensi"| Student

    Lecturer -->|"Request Data"| P4
    P4 <-->|"Data Kehadiran"| D4
    P4 <-->|"Data Mahasiswa"| D1
    P4 -->|"Laporan"| Lecturer

    style Processes fill:#e8f5e9,stroke:#43a047
    style DataStores fill:#fff3e0,stroke:#ff9800
    style P1 fill:#2196f3,color:#fff
    style P2 fill:#9c27b0,color:#fff
    style P3 fill:#f44336,color:#fff
    style P4 fill:#4caf50,color:#fff
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    STUDENTS {
        uuid id PK "Primary Key"
        varchar nim UK "NIM Mahasiswa (Unique)"
        varchar name "Nama Lengkap"
        varchar email UK "Email (Unique)"
        varchar program_study "Program Studi"
        text photo "URL Foto Profil"
        timestamp created_at "Tanggal Dibuat"
    }

    LECTURERS {
        uuid id PK "Primary Key"
        varchar name "Nama Dosen"
        varchar code UK "Kode Dosen (Unique)"
        varchar password_hash "Hash Password"
        timestamp created_at "Tanggal Dibuat"
    }

    CLASSES {
        uuid id PK "Primary Key"
        varchar class_code UK "Kode Kelas (Unique)"
        varchar class_name "Nama Mata Kuliah"
        varchar schedule "Jadwal Kuliah"
        uuid lecturer_id FK "ID Dosen"
        decimal location_latitude "Latitude Lokasi"
        decimal location_longitude "Longitude Lokasi"
        integer location_radius "Radius Validasi (meter)"
        timestamp created_at "Tanggal Dibuat"
    }

    ENROLLMENTS {
        uuid id PK "Primary Key"
        uuid student_id FK "ID Mahasiswa"
        uuid class_id FK "ID Kelas"
        timestamp enrolled_at "Tanggal Pendaftaran"
    }

    ATTENDANCE {
        uuid id PK "Primary Key"
        uuid student_id FK "ID Mahasiswa"
        uuid class_id FK "ID Kelas"
        varchar status "Status: Present/Absent/Late"
        decimal location_latitude "Latitude Saat Absen"
        decimal location_longitude "Longitude Saat Absen"
        varchar face_recognition_status "Status: Matched/Unmatched"
        timestamp recorded_at "Waktu Pencatatan"
    }

    FACE_DATA {
        uuid id PK "Primary Key"
        uuid student_id FK,UK "ID Mahasiswa (Unique)"
        text face_descriptor "Embedding Wajah (JSON)"
        decimal confidence_score "Skor Kepercayaan"
        integer photos_count "Jumlah Foto Training"
        timestamp registered_at "Tanggal Registrasi"
    }

    SCHEDULES {
        uuid id PK "Primary Key"
        uuid class_id FK "ID Kelas"
        date date "Tanggal Pertemuan"
        time start_time "Waktu Mulai"
        time end_time "Waktu Selesai"
        varchar room "Ruangan"
        timestamp created_at "Tanggal Dibuat"
    }

    ACTIVITY_LOGS {
        uuid id PK "Primary Key"
        uuid student_id FK "ID Mahasiswa (nullable)"
        uuid lecturer_id FK "ID Dosen (nullable)"
        varchar activity_type "Jenis Aktivitas"
        text details "Detail Aktivitas"
        timestamp created_at "Waktu Aktivitas"
    }

    STUDENTS ||--o{ ENROLLMENTS : "mendaftar"
    STUDENTS ||--o| FACE_DATA : "memiliki"
    STUDENTS ||--o{ ATTENDANCE : "mencatat"
    STUDENTS ||--o{ ACTIVITY_LOGS : "melakukan"

    LECTURERS ||--o{ CLASSES : "mengajar"
    LECTURERS ||--o{ ACTIVITY_LOGS : "melakukan"

    CLASSES ||--o{ ENROLLMENTS : "memiliki"
    CLASSES ||--o{ ATTENDANCE : "mencatat"
    CLASSES ||--o{ SCHEDULES : "memiliki"
```

### Kamus Data (Data Dictionary)

#### Tabel: STUDENTS

| Kolom         | Tipe Data    | Constraint       | Deskripsi                 |
| ------------- | ------------ | ---------------- | ------------------------- |
| id            | UUID         | PK, NOT NULL     | Identifier unik mahasiswa |
| nim           | VARCHAR(20)  | UNIQUE, NOT NULL | Nomor Induk Mahasiswa     |
| name          | VARCHAR(100) | NOT NULL         | Nama lengkap mahasiswa    |
| email         | VARCHAR(100) | UNIQUE, NOT NULL | Alamat email              |
| program_study | VARCHAR(100) | NOT NULL         | Program studi             |
| photo         | TEXT         | NULL             | URL foto profil           |
| created_at    | TIMESTAMP    | DEFAULT NOW()    | Waktu pembuatan record    |

#### Tabel: LECTURERS

| Kolom         | Tipe Data    | Constraint       | Deskripsi                 |
| ------------- | ------------ | ---------------- | ------------------------- |
| id            | UUID         | PK, NOT NULL     | Identifier unik dosen     |
| name          | VARCHAR(100) | NOT NULL         | Nama lengkap dosen        |
| code          | VARCHAR(20)  | UNIQUE, NOT NULL | Kode identifikasi dosen   |
| password_hash | VARCHAR(255) | NOT NULL         | Hash password untuk login |
| created_at    | TIMESTAMP    | DEFAULT NOW()    | Waktu pembuatan record    |

#### Tabel: CLASSES

| Kolom              | Tipe Data     | Constraint        | Deskripsi                   |
| ------------------ | ------------- | ----------------- | --------------------------- |
| id                 | UUID          | PK, NOT NULL      | Identifier unik kelas       |
| class_code         | VARCHAR(20)   | UNIQUE, NOT NULL  | Kode kelas                  |
| class_name         | VARCHAR(100)  | NOT NULL          | Nama mata kuliah            |
| schedule           | VARCHAR(100)  | NOT NULL          | Jadwal perkuliahan          |
| lecturer_id        | UUID          | FK → lecturers.id | Referensi ke dosen pengajar |
| location_latitude  | DECIMAL(10,8) | NOT NULL          | Latitude lokasi kelas       |
| location_longitude | DECIMAL(11,8) | NOT NULL          | Longitude lokasi kelas      |
| location_radius    | INTEGER       | DEFAULT 50        | Radius validasi dalam meter |
| created_at         | TIMESTAMP     | DEFAULT NOW()     | Waktu pembuatan record      |

#### Tabel: FACE_DATA

| Kolom            | Tipe Data    | Constraint    | Deskripsi                        |
| ---------------- | ------------ | ------------- | -------------------------------- |
| id               | UUID         | PK, NOT NULL  | Identifier unik                  |
| student_id       | UUID         | FK, UNIQUE    | Referensi ke mahasiswa           |
| face_descriptor  | TEXT         | NOT NULL      | Face embedding dalam format JSON |
| confidence_score | DECIMAL(4,3) | DEFAULT 0.95  | Skor confidence minimum          |
| photos_count     | INTEGER      | DEFAULT 5     | Jumlah foto yang digunakan       |
| registered_at    | TIMESTAMP    | DEFAULT NOW() | Waktu registrasi wajah           |

#### Tabel: ATTENDANCE

| Kolom                   | Tipe Data     | Constraint                        | Deskripsi              |
| ----------------------- | ------------- | --------------------------------- | ---------------------- |
| id                      | UUID          | PK, NOT NULL                      | Identifier unik        |
| student_id              | UUID          | FK → students.id                  | Referensi ke mahasiswa |
| class_id                | UUID          | FK → classes.id                   | Referensi ke kelas     |
| status                  | VARCHAR(20)   | CHECK (Present/Absent/Late)       | Status kehadiran       |
| location_latitude       | DECIMAL(10,8) | NULL                              | Latitude saat absensi  |
| location_longitude      | DECIMAL(11,8) | NULL                              | Longitude saat absensi |
| face_recognition_status | VARCHAR(20)   | CHECK (Matched/Unmatched/Pending) | Hasil face recognition |
| recorded_at             | TIMESTAMP     | DEFAULT NOW()                     | Waktu pencatatan       |

#### Tabel: ENROLLMENTS

| Kolom       | Tipe Data | Constraint                   | Deskripsi                          |
| ----------- | --------- | ---------------------------- | ---------------------------------- |
| id          | UUID      | PK, NOT NULL                 | Identifier unik pendaftaran        |
| student_id  | UUID      | FK → students.id, NOT NULL   | Referensi ke mahasiswa             |
| class_id    | UUID      | FK → classes.id, NOT NULL    | Referensi ke kelas                 |
| enrolled_at | TIMESTAMP | DEFAULT NOW()                | Waktu pendaftaran                  |
|             |           | UNIQUE(student_id, class_id) | Kombinasi unik mahasiswa dan kelas |

#### Tabel: SCHEDULES

| Kolom      | Tipe Data   | Constraint      | Deskripsi                 |
| ---------- | ----------- | --------------- | ------------------------- |
| id         | UUID        | PK, NOT NULL    | Identifier unik jadwal    |
| class_id   | UUID        | FK → classes.id | Referensi ke kelas        |
| date       | DATE        | NOT NULL        | Tanggal pertemuan         |
| start_time | TIME        | NOT NULL        | Waktu mulai perkuliahan   |
| end_time   | TIME        | NOT NULL        | Waktu selesai perkuliahan |
| room       | VARCHAR(50) | NULL            | Nama/kode ruangan         |
| created_at | TIMESTAMP   | DEFAULT NOW()   | Waktu pembuatan record    |

#### Tabel: ACTIVITY_LOGS

| Kolom         | Tipe Data   | Constraint              | Deskripsi                                  |
| ------------- | ----------- | ----------------------- | ------------------------------------------ |
| id            | UUID        | PK, NOT NULL            | Identifier unik log aktivitas              |
| student_id    | UUID        | FK → students.id, NULL  | Referensi ke mahasiswa (nullable)          |
| lecturer_id   | UUID        | FK → lecturers.id, NULL | Referensi ke dosen (nullable)              |
| activity_type | VARCHAR(50) | NOT NULL                | Jenis aktivitas (Login, Attendance, dll)   |
| details       | TEXT        | NULL                    | Detail tambahan aktivitas dalam teks bebas |
| created_at    | TIMESTAMP   | DEFAULT NOW()           | Waktu aktivitas dicatat                    |

**Nilai activity_type yang Digunakan:**
| Nilai | Deskripsi |
|-------|-----------|
| `Login` | User berhasil login ke sistem |
| `FaceRegistration` | Mahasiswa mendaftarkan wajah |
| `Attendance` | Mahasiswa melakukan absensi |
| `Logout` | User keluar dari sistem |

---

## 4. Class Diagram

```mermaid
classDiagram
    direction TB

    class Student {
        -id: UUID
        -nim: string
        -name: string
        -email: string
        -program_study: string
        -photo: string
        +login(nim): AuthResult
        +registerFace(photos): FaceData
        +markAttendance(classId, location): Attendance
        +getAttendanceHistory(): Attendance[]
        +getEnrolledClasses(): Class[]
    }

    class Lecturer {
        -id: UUID
        -name: string
        -code: string
        -password_hash: string
        +login(code, password): AuthResult
        +getClasses(): Class[]
        +getClassAttendance(classId): Attendance[]
        +getStudents(): Student[]
    }

    class Class {
        -id: UUID
        -class_code: string
        -class_name: string
        -schedule: string
        -lecturer_id: UUID
        -location_latitude: number
        -location_longitude: number
        -location_radius: number
        +getEnrolledStudents(): Student[]
        +getAttendanceRecords(): Attendance[]
        +validateLocation(lat, lon): boolean
    }

    class FaceData {
        -id: UUID
        -student_id: UUID
        -face_descriptor: string
        -confidence_score: number
        -photos_count: number
        +compareFace(descriptor): MatchResult
        +updateDescriptor(newDescriptor): void
    }

    class Attendance {
        -id: UUID
        -student_id: UUID
        -class_id: UUID
        -status: AttendanceStatus
        -location_latitude: number
        -location_longitude: number
        -face_recognition_status: FaceStatus
        -recorded_at: DateTime
        +create(): Attendance
        +getByStudent(studentId): Attendance[]
        +getByClass(classId): Attendance[]
    }

    class FaceRecognitionService {
        -model: TensorFlowModel
        +loadModel(): void
        +detectFace(image): FaceDetection
        +extractDescriptor(face): Float32Array
        +compareFaces(desc1, desc2): number
        +performLivenessCheck(frames): boolean
    }

    class GeolocationService {
        +getCurrentPosition(): GeoPosition
        +calculateDistance(lat1, lon1, lat2, lon2): number
        +isWithinRadius(target, current, radius): boolean
    }

    class AuthService {
        +loginStudent(nim): AuthResult
        +loginLecturer(code, password): AuthResult
        +logout(): void
        +getCurrentUser(): User
        +isAuthenticated(): boolean
    }

    class AttendanceService {
        -faceService: FaceRecognitionService
        -geoService: GeolocationService
        +processAttendance(studentId, classId, photo, location): AttendanceResult
        +validateFace(photo, studentFaceData): boolean
        +validateLocation(location, classLocation): boolean
        +performLivenessCheck(video): boolean
    }

    Student "1" --> "0..1" FaceData : memiliki
    Student "1" --> "*" Attendance : mencatat
    Student "*" --> "*" Class : mendaftar

    Lecturer "1" --> "*" Class : mengajar

    Class "1" --> "*" Attendance : memiliki

    AttendanceService --> FaceRecognitionService : menggunakan
    AttendanceService --> GeolocationService : menggunakan
    AttendanceService --> Attendance : membuat

    AuthService --> Student : mengautentikasi
    AuthService --> Lecturer : mengautentikasi
```

---

## 5. Flowchart

### 5.1 Flowchart Registrasi Wajah

```mermaid
flowchart TD
    A([🚀 Mulai]) --> B{Sudah Login?}
    B -->|Tidak| C[Redirect ke Login]
    C --> Z([🔴 Selesai])

    B -->|Ya| D[Tampilkan Halaman Registrasi Wajah]
    D --> E[Muat Model TensorFlow.js]
    E --> F{Model Berhasil Dimuat?}

    F -->|Tidak| G[Tampilkan Error]
    G --> Z

    F -->|Ya| H[Aktifkan Kamera]
    H --> I{Kamera Aktif?}

    I -->|Tidak| J[Tampilkan Error Kamera]
    J --> Z

    I -->|Ya| K[Tampilkan Preview Kamera]
    K --> L[Deteksi Wajah Real-time]
    L --> M{Wajah Terdeteksi?}

    M -->|Tidak| L
    M -->|Ya| N[Tampilkan Bounding Box]
    N --> O{User Klik Capture?}

    O -->|Tidak| L
    O -->|Ya| P[Capture 5 Foto dari Sudut Berbeda]
    P --> Q[Ekstrak Face Descriptors]
    Q --> R[Hitung Rata-rata Descriptor]
    R --> S[Simpan ke Database Supabase]
    S --> T{Berhasil?}

    T -->|Tidak| U[Tampilkan Error]
    U --> K

    T -->|Ya| V[✅ Tampilkan Sukses]
    V --> W[Update Status Face Registered]
    W --> X[Redirect ke Dashboard]
    X --> Z([🟢 Selesai])

    style A fill:#4caf50,color:#fff
    style Z fill:#f44336,color:#fff
    style V fill:#4caf50,color:#fff
    style G fill:#ff9800,color:#fff
    style J fill:#ff9800,color:#fff
    style U fill:#ff9800,color:#fff
```

### 5.2 Flowchart Proses Absensi (Core Feature)

```mermaid
flowchart TD
    A([🚀 Mulai Absensi]) --> B{Sudah Registrasi Wajah?}

    B -->|Tidak| C[Redirect ke Registrasi Wajah]
    C --> Z1([🔴 Selesai])

    B -->|Ya| D[Muat Data Kelas]
    D --> E{Ada Jadwal Aktif?}

    E -->|Tidak| F[Tampilkan: Tidak Ada Kelas Aktif]
    F --> Z1

    E -->|Ya| G[Tampilkan Halaman Absensi]
    G --> H[Aktifkan Kamera + GPS]

    H --> I{Kamera & GPS Aktif?}
    I -->|Tidak| J[Tampilkan Error Perizinan]
    J --> Z1

    I -->|Ya| K[Mulai Deteksi Real-time]

    subgraph validation["🔒 Proses Validasi 3 Tahap"]
        direction TB
        K --> L[📍 TAHAP 1: Validasi Geolocation]
        L --> M{Dalam Radius Lokasi?}
        M -->|Tidak| N[❌ Error: Lokasi Tidak Valid]

        M -->|Ya| O[🤖 TAHAP 2: Face Recognition]
        O --> P[Capture Foto]
        P --> Q[Ekstrak Face Descriptor]
        Q --> R[Bandingkan dengan Data Tersimpan]
        R --> S{Wajah Cocok?<br/>Threshold > 0.6}
        S -->|Tidak| T[❌ Error: Wajah Tidak Dikenali]

        S -->|Ya| U[👁️ TAHAP 3: Liveness Detection]
        U --> V[Analisis Gerakan & Kedipan]
        V --> W{Lolos Liveness Check?}
        W -->|Tidak| X[❌ Error: Gagal Liveness Check]
    end

    N --> K
    T --> K
    X --> K

    W -->|Ya| Y[✅ Semua Validasi Lolos]
    Y --> AA[Simpan Record Absensi]
    AA --> AB[Update Status: Present]
    AB --> AC[Log Aktivitas]
    AC --> AD[🎉 Tampilkan Sukses]
    AD --> Z2([🟢 Selesai])

    style A fill:#2196f3,color:#fff
    style Z1 fill:#f44336,color:#fff
    style Z2 fill:#4caf50,color:#fff
    style validation fill:#e8f5e9,stroke:#43a047,stroke-width:2px
    style Y fill:#4caf50,color:#fff
    style N fill:#f44336,color:#fff
    style T fill:#f44336,color:#fff
    style X fill:#f44336,color:#fff
```

### 5.3 Flowchart Login System

```mermaid
flowchart TD
    A([🚀 Mulai]) --> B[Tampilkan Halaman Login]
    B --> C{Pilih Tipe User}

    C -->|Mahasiswa| D[Form Login Mahasiswa]
    D --> E[Input NIM]
    E --> F[Klik Login]
    F --> G[/API: POST /api/login/]
    G --> H{NIM Valid di Database?}

    H -->|Tidak| I[❌ Tampilkan Error: Student Not Found]
    I --> D

    H -->|Ya| J[Generate Session Token]
    J --> K[Simpan ke LocalStorage]
    K --> L[Log Aktivitas Login]
    L --> M[Redirect ke Student Dashboard]
    M --> Z([🟢 Selesai])

    C -->|Dosen| N[Form Login Dosen]
    N --> O[Input Kode Dosen]
    O --> P[Input Password]
    P --> Q[Klik Login]
    Q --> R[/API: POST /api/login/]
    R --> S{Kode Valid?}

    S -->|Tidak| T[❌ Error: Lecturer Not Found]
    T --> N

    S -->|Ya| U{Password Valid?}
    U -->|Tidak| V[❌ Error: Invalid Password]
    V --> N

    U -->|Ya| W[Generate Session Token]
    W --> X[Simpan ke LocalStorage]
    X --> Y[Log Aktivitas Login]
    Y --> AA[Redirect ke Lecturer Dashboard]
    AA --> Z

    style A fill:#2196f3,color:#fff
    style Z fill:#4caf50,color:#fff
    style I fill:#f44336,color:#fff
    style T fill:#f44336,color:#fff
    style V fill:#f44336,color:#fff
```

---

## Ringkasan Fitur Inti

| Komponen               | Teknologi                     | Fungsi                                          |
| ---------------------- | ----------------------------- | ----------------------------------------------- |
| **Face Recognition**   | TensorFlow.js + face-api.js   | Mengenali identitas mahasiswa dari wajah        |
| **Liveness Detection** | TensorFlow.js BlazeFace       | Mendeteksi apakah wajah asli (bukan foto/video) |
| **Geolocation**        | Browser Geolocation API       | Memvalidasi lokasi mahasiswa dalam radius kelas |
| **Database**           | Supabase (PostgreSQL)         | Menyimpan semua data aplikasi                   |
| **Frontend**           | Next.js + React + TailwindCSS | User interface responsif                        |

---

> **Catatan:** Semua diagram menggunakan sintaks Mermaid yang kompatibel dengan GitHub, GitLab, dan sebagian besar platform dokumentasi modern.
