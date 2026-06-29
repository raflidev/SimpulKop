# SimpulKop
> **Pemetaan Vendor & Optimasi Rute Logistik — Rantai Pasok Koperasi Desa Merah Putih**
> 
> *Satu peta. Satu rute. Pengadaan koperasi desa jadi lebih hemat.*

---

Choose Language: 
[![English](https://img.shields.io/badge/Language-English_🇺🇸-blue.svg)](README_EN.md)

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase (PostGIS & Vector)](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Groq AI Llama 3](https://img.shields.io/badge/AI-Groq%20Llama%203-orange?logo=meta&logoColor=white)](https://groq.com)

Aplikasi ini dikembangkan sebagai **Minimum Viable Product (MVP)** untuk **Hackathon Digital Cooperatives Expo 2026** oleh **Kementerian Koperasi RI × PEBS FEB UI**.
Fokus utama proyek ini adalah menyelesaikan tantangan pada pilar **Optimalisasi Rantai Pasok KDKMP (Koperasi Desa/Kelurahan Merah Putih)** secara real-time.

---

## Daftar Isi
* [1. Ringkasan Eksekutif](#1-ringkasan-eksekutif)
* [2. Wilayah Percontohan & Skalabilitas Nasional](#2-wilayah-percontohan--skalabilitas-nasional)
* [3. Latar Belakang & Pernyataan Masalah](#3-latar-belakang--pernyataan-masalah)
* [4. Fitur Utama & Cara Kerja](#4-fitur-utama--cara-kerja)
* [5. Arsitektur & Teknologi](#5-arsitektur--teknologi)
* [6. Skema Database (PostgreSQL + PostGIS + pgvector)](#6-skema-database-postgresql--postgis--pgvector)
* [7. Panduan Instalasi & Penggunaan](#7-panduan-instalasi--penggunaan)
* [8. Skenario Demo & Simulasi Gangguan Rerouting](#8-skenario-demo--simulasi-gangguan-rerouting)
* [Struktur Proyek](#struktur-proyek)

---

## 1. Ringkasan Eksekutif
Program Koperasi Desa/Kelurahan Merah Putih (KDKMP) bertujuan menghubungkan puluhan ribu koperasi desa ke dalam satu ekosistem ekonomi nasional. Di lapangan, koperasi desa masih sering melakukan pengadaan barang secara mandiri dan terpisah. Hal ini menyebabkan biaya logistik membengkak, efisiensi BBM rendah, dan daya tawar terhadap grosir/produsen lemah. Di sisi lain, UMKM lokal di sekitar desa sering kali tidak terlihat atau terabaikan.

**SimpulKop** adalah platform GIS (Geographic Information System) cerdas yang dirancang untuk mengagregasi kebutuhan pengadaan beberapa koperasi desa yang berdekatan, mencocokkannya dengan vendor/UMKM lokal terdekat, dan menghitung rute distribusi gabungan paling efisien (menyelesaikan *Traveling Salesperson Problem* / TSP).

Dengan dua pilar AI interaktif:
1. **Asisten AI Pengadaan**: Pencarian vendor menggunakan percakapan alami (Natural Language Query) terintegrasi RAG (*Retrieval-Augmented Generation*).
2. **Mesin Rerouting Dinamis**: Simulasi penanganan gangguan rantai pasok secara langsung (seperti kehabisan stok) dengan merancang rute alternatif secara instan beserta analisis dampaknya pada biaya logistik.

---

## 2. Wilayah Percontohan & Skalabilitas Nasional
Meskipun data bawaan (*seed data*) MVP saat ini dipetakan di **Kabupaten Sleman, Yogyakarta** (khususnya kecamatan Ngaglik, Mlati, dan Depok) untuk simulasi rute jalan raya riil di depan juri hackathon, platform **SimpulKop dirancang sepenuhnya untuk skala nasional**:
* **Skalabilitas Lokasi (Geospasial)**: Arsitektur database spasial (PostGIS) di `supabase/schema.sql` menggunakan standar global koordinat `EPSG:4326`. Anda dapat mengimpor data koperasi dan UMKM dari wilayah mana saja di Indonesia (misalnya Garut, Malang, Bone, atau Deli Serdang).
* **Routing Global**: Mesin routing Leaflet & OSRM (Open Source Routing Machine) bersifat global. Begitu koordinat daerah baru dimuat, peta akan otomatis bergeser (*auto-focus*) dan menghitung rute navigasi jalan raya lokal daerah tersebut secara otomatis.
* **Kemudahan Kustomisasi**: Untuk menerapkan di wilayah baru, pengurus cukup mengganti data geografis pada berkas `data_kopdes.csv` dan `data_pemasok_umkm.csv` di folder `docs/` dengan koordinat wilayah sasaran baru.

---

## 3. Latar Belakang & Pernyataan Masalah
Sesuai dengan arahan Digital Cooperatives Expo 2026, terdapat beberapa masalah inti operasional koperasi desa:
1. **Logistik Terfragmentasi**: Setiap koperasi mengirim kendaraan terpisah ke distributor yang sama. Hal ini membuang waktu dan BBM.
2. **Pemasok Tidak Terpetakan**: Pengurus kesulitan membandingkan harga, kapasitas, jarak, serta opsi pembayaran tempo (kredit usaha) antar-vendor.
3. **Penyisihan UMKM Lokal**: UMKM lokal tidak memiliki sarana untuk mengiklankan produk mereka langsung ke koperasi desa terdekat.

SimpulKop menjawab tantangan ini dengan slogan: **"Satu peta. Satu rute. Pengadaan bersama jadi lebih hemat."** platform ini mendemokan penghematan ongkos kirim hingga **40%+** per siklus belanja.

---

## 4. Fitur Utama & Cara Kerja

### A. Peta GIS Interaktif (GIS Map Interface)
* Memetakan lokasi **8 Koperasi Desa** (titik biru) dan **33 Vendor/UMKM** (titik berwarna sesuai kategori) di Sleman, Yogyakarta.
* Filter dinamis berdasarkan kategori produk, metode pembayaran (Tunai, Transfer, Tempo/Kredit, QRIS), dan status ketersediaan stok.
* **Buyer Reachability Heatmap**: Peta panas berdasarkan jumlah anggota koperasi desa untuk menganalisis area dengan permintaan pasar tertinggi.
* 4 pilihan gaya peta (*Lite*, *Standard*, *Gelap*, dan *Satelit*).

### B. Klasterisasi & Optimasi Rute (Clustering & Logistics Route)
* **Agregasi Kebutuhan**: Sistem menggabungkan kuantitas belanja dari beberapa koperasi (misalnya beras dari KOP-01, KOP-02, KOP-04).
* **Solusi Rute TSP (Traveling Salesperson Problem)**: Algoritma Greedy Nearest-Neighbor menghitung urutan perjalanan terpendek dari gudang utama/hub, melewati vendor, koperasi tujuan, dan kembali ke hub.
* **Integrasi OSRM (Open Source Routing Machine)**: Mengambil rute aktual berdasarkan jaringan jalan raya riil, bukan sekadar garis lurus (geodesik).
* **Ekspor Google Maps**: Menghasilkan tautan Google Maps navigasi multi-stop secara instan yang siap dikirim langsung ke ponsel driver armada logistik.

### C. Asisten AI Pengadaan (Procurement AI Chat)
* Mesin tanya-jawab berbasis Llama-3.3-70b-versatile via Groq SDK.
* Context-Aware: Sistem menyuntikkan data spasial 8 koperasi dan 33 vendor Sleman ke dalam prompt system.
* Pengurus dapat mengajukan pertanyaan seperti: *"Siapa vendor beras termurah di Ngaglik yang bisa bayar tempo?"* atau *"Rekomendasikan pemasok pupuk terdekat dari Sardonoharjo yang stoknya tersedia."*

### D. Manajemen Data (CRUD Interface)
* Pengelolaan data vendor dan koperasi desa secara real-time.
* Perubahan data langsung disimpan ke Svelte Store dan dipersistensikan pada `localStorage` browser sehingga data simulasi tidak hilang ketika halaman dimuat ulang.

---

## 5. Arsitektur & Teknologi

* **Frontend Framework**: Svelte 5 (menggunakan svelte-kit & svelte/store) untuk antarmuka yang sangat responsif dan reactivity model berbasis `$state` dan `$derived`.
* **CSS Framework**: Tailwind CSS v4 dengan performa kompilasi berbasis Vite yang cepat.
* **Pemetaan & Routing**: 
  - Leaflet.js untuk rendering peta interaktif.
  - Leaflet.heat untuk kalkulasi spasial visual jangkauan pembeli.
  - OSRM (Open Source Routing Machine) API untuk kalkulasi navigasi jalan raya.
* **Database & PostGIS (Fase Produksi)**: Supabase PostgreSQL dengan ekstensi PostGIS (untuk pencarian radius spasial) dan `pgvector` (untuk skenario pencarian RAG kedepannya). Skema siap pakai telah disediakan di folder `supabase/schema.sql`.
* **Penyimpanan Data (MVP)**: Local state management berbasis Svelte Store dan persistensi `localStorage` untuk mempermudah demo tanpa dependensi database eksternal.
* **AI Model API**: Groq SDK (`groq-sdk`) mengakses model open-source terbaik (`llama-3.3-70b-versatile`).

---

## 6. Skema Database (PostgreSQL + PostGIS + pgvector)
> **Catatan Penting**: Aplikasi MVP ini berjalan secara mandiri (*standalone*) menggunakan data seed lokal di `src/lib/data.js` dan persistensi di `localStorage` browser. Skema di bawah ini adalah cetak biru (*blueprint*) database PostgreSQL yang telah dirancang untuk migrasi ke server produksi (Supabase) pada fase berikutnya.

Skema ini memetakan tipe data spasial PostGIS untuk koordinat latitude/longitude agar dapat menghitung jarak geometris secara akurat di sisi database server.

### Struktur Tabel Utama:
1. **`vendors`**: Menyimpan profil pemasok, koordinat lokasi (`GEOGRAPHY(POINT, 4326)`), kapasitas, metode bayar, rating, dan kolom `embedding` (`VECTOR(1536)`) untuk integrasi RAG lanjutan.
2. **`kopdes`**: Menyimpan profil koperasi desa, kapasitas gudang, kebutuhan barang, serta koordinat lokasi.
3. **`kebutuhan`**: Menyimpan list permintaan item (kuantitas, satuan, status) per koperasi desa.
4. **`rute_log`**: Menyimpan riwayat logistik gabungan, total jarak tempuh rute bersama vs rute terpisah, persentase penghematan jarak, dan estimasi biaya logistik.

### Helper Spasial (PostGIS Function):
Terdapat fungsi SQL `vendors_in_radius` untuk mempercepat query pencarian vendor dalam radius tertentu:
```sql
CREATE OR REPLACE FUNCTION vendors_in_radius(p_lat FLOAT, p_lng FLOAT, p_km FLOAT)
RETURNS TABLE(id TEXT, nama TEXT, kategori TEXT, dist_km FLOAT) AS $$
  SELECT
    id, nama, kategori,
    ST_Distance(location, ST_MakePoint(p_lng, p_lat)::GEOGRAPHY) / 1000 AS dist_km
  FROM vendors
  WHERE ST_DWithin(location, ST_MakePoint(p_lng, p_lat)::GEOGRAPHY, p_km * 1000)
    AND stok = 'tersedia'
  ORDER BY dist_km;
$$ LANGUAGE SQL STABLE;
```

---

## 7. Panduan Instalasi & Penggunaan

### Persyaratan Sistem:
* Node.js v18 atau lebih baru.
* NPM atau Yarn.
* Akun Groq Cloud (gratis) untuk mendapatkan API Key.

### Langkah-Langkah:

1. **Clone repositori proyek**:
   ```bash
   git clone https://github.com/[username-Anda]/SimpulKop.git
   cd SimpulKop
   ```

2. **Instalasi Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Variabel Lingkungan (Environment Variables)**:
   Buat file `.env` di root folder proyek (salin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` tersebut dan masukkan Groq API Key Anda:
   ```env
   GROQ_API_KEY=gsk_IsilahDenganApiKeyGroqAndaYangAktif
   ```

4. **Jalankan Aplikasi Mode Development**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`. Buka URL tersebut di browser Anda.

5. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 8. Skenario Demo & Simulasi Gangguan Rerouting
Untuk presentasi juri atau demo interaktif, skenario demo diatur di Kecamatan Ngaglik menggunakan data riil:
1. **Agregasi Pengadaan Kolektif**:
   * Tiga Koperasi Desa terpilih: **Sardonoharjo (KOP-01)**, **Donoharjo (KOP-02)**, dan **Sukoharjo (KOP-04)**.
   * Total belanja yang digabungkan: **1.200 kg Beras** dan **300 kg Pupuk NPK**.
2. **Rute Awal (Optimal)**:
   * Armada logistik berangkat dari Gudang Hub (Sardonoharjo) -> Mengambil Pupuk di **Kulino Tani (VND-032)** -> Mengambil Beras di **Mina Swalayan Gentan (VND-031)** -> Mengirim ke Sukoharjo -> Mengirim ke Donoharjo -> Kembali ke Sardonoharjo.
   * Jarak Rute Bersama: **~19.6 km** (Penghematan jarak mencapai **47.5%** dibandingkan jika masing-masing koperasi jalan sendiri-sendiri sejauh **~37.3 km**).
3. **Simulasi Gangguan (Disruption Simulation)**:
   * Centang opsi *"Mina Swalayan stok habis -> ganti Damai Makmur"* pada panel kiri.
   * Sistem mendeteksi kegagalan pasokan di Mina Swalayan secara real-time.
   * Mesin optimasi langsung mencari alternatif beras terdekat dan memilih **Toko Sembako Damai Makmur (VND-001)**.
   * Rute jalan raya segera dihitung ulang melalui OSRM secara otomatis, memperbarui jarak, rincian biaya logistik, dan menghasilkan visualisasi rute jalan yang baru pada peta secara instan.

---

## Struktur Proyek
Berikut adalah struktur folder utama dari proyek SimpulKop:
```text
SimpulKop/
├── docs/                   # Dokumen PRD dan berkas data seed (CSV)
│   ├── PRD_SimpulKop.docx  # Product Requirements Document
│   ├── data_kopdes.csv     # Seed data Koperasi Desa
│   └── data_pemasok_umkm.csv # Seed data Vendor UMKM Sleman
├── src/
│   ├── lib/
│   │   ├── data.js         # Data statis fallback untuk vendor & kopdes
│   │   ├── geo.js          # Fungsi geospasial (Haversine, greedy TSP, calcSavings)
│   │   └── store.js        # Writable stores dengan persistensi localStorage
│   ├── routes/
│   │   ├── (landing)/      # Rute Landing Page utama
│   │   ├── (app)/          # Rute Aplikasi (Dashboard, Peta, Klaster/Rute, Chat, Manajemen)
│   │   └── api/
│   │       └── chat/       # Server-side endpoint untuk integrasi Groq SDK
│   ├── app.css             # Konfigurasi style global Tailwind CSS v4
│   └── app.html            # File template HTML utama
├── supabase/
│   └── schema.sql          # Skema database PostgreSQL + PostGIS + pgvector
├── .env.example            # Contoh file konfigurasi environment
├── package.json            # Daftar dependensi npm dan skrip perintah
├── svelte.config.js        # Konfigurasi SvelteKit adapter (Vercel)
└── vite.config.js          # Konfigurasi bundler Vite
```
