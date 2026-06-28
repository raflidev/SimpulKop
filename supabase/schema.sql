-- SimpulKop — Schema PostgreSQL + PostGIS
-- Untuk produksi: aktifkan di Supabase (sudah include PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector; -- untuk RAG embeddings

CREATE TABLE vendors (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  kategori    TEXT,
  jenis       TEXT,
  desa        TEXT,
  kecamatan   TEXT,
  alamat      TEXT,
  location    GEOGRAPHY(POINT, 4326),        -- PostGIS spatial
  kontak      TEXT,
  produk      TEXT,
  kapasitas   TEXT,
  min_order   TEXT,
  metode_bayar TEXT[],
  rating      NUMERIC(3,1),
  jam         TEXT,
  catatan     TEXT,
  stok        TEXT DEFAULT 'tersedia',
  embedding   VECTOR(1536),                   -- untuk RAG (opsional fase 2)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX vendors_location_idx ON vendors USING GIST(location);
CREATE INDEX vendors_kategori_idx ON vendors(kategori);

CREATE TABLE kopdes (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  desa        TEXT,
  kecamatan   TEXT,
  alamat      TEXT,
  location    GEOGRAPHY(POINT, 4326),
  anggota     INTEGER,
  gudang      BOOLEAN DEFAULT FALSE,
  kebutuhan   TEXT,
  kontak      TEXT,
  catatan     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kebutuhan (
  id          SERIAL PRIMARY KEY,
  kopdes_id   TEXT REFERENCES kopdes(id) ON DELETE CASCADE,
  kategori    TEXT,
  item        TEXT,
  jumlah      NUMERIC,
  satuan      TEXT,
  tenggat     DATE,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rute_log (
  id              SERIAL PRIMARY KEY,
  klaster_nama    TEXT,
  kopdes_ids      TEXT[],
  vendor_ids      TEXT[],
  titik_urut      JSONB,
  combined_km     NUMERIC(8,2),
  separate_km     NUMERIC(8,2),
  savings_pct     NUMERIC(5,1),
  estimasi_biaya  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial query helper: vendor dalam radius (km) dari suatu titik
-- Contoh: SELECT * FROM vendors_in_radius(-7.6756, 110.3923, 5);
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
