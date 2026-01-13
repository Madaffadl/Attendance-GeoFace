# Attendance-GeoFace

Sistem absensi mahasiswa berbasis Geolocation dan Face Recognition menggunakan Next.js dan Supabase.

## Fitur Utama

### Mahasiswa

- **Absensi Wajah & Lokasi**: Validasi kehadiran menggunakan pengenalan wajah (face-api.js) dan lokasi GPS.
- **Registrasi Wajah**: Pendaftaran data wajah mandiri dengan panduan visual.
- **Dashboard**: Melihat jadwal kelas dan riwayat kehadiran.

### Dosen

- **Manajemen Kelas**: Melihat daftar kelas dan mahasiswa.
- **Monitoring Real-time**: Memantau kehadiran mahasiswa.
- **Laporan**: Melihat statistik kehadiran.

## Teknologi

- **Frontend**: Next.js 13 (App Router), TypeScript, Tailwind CSS
- **Backend/Database**: Supabase
- **AI/ML**: face-api.js (di browser/client-side)

## Setup Project

1. **Clone Repository**

   ```bash
   git clone https://github.com/username/Attendance-GeoFace.git
   cd Attendance-GeoFace
   ```

2. **Setup Environment Variables**
   Project ini membutuhkan Supabase untuk database.

   Salin file template `.env.example` ke `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Buka file `.env.local` dan isi credentials dari dashboard Supabase Anda:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Jalankan Development Server**

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) di browser.
