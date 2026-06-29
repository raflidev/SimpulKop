# SimpulKop
> **Vendor Mapping & Logistics Route Optimization — Rural Cooperatives Supply Chain**
> 
> *One map. One route. Rural cooperative procurement made cheaper.*

---

Pilih Bahasa / Choose Language: 
[![Bahasa Indonesia](https://img.shields.io/badge/Language-Indonesia_🇮🇩-green.svg)](README.md)

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase (PostGIS & Vector)](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Groq AI Llama 3](https://img.shields.io/badge/AI-Groq%20Llama%203-orange?logo=meta&logoColor=white)](https://groq.com)

This application was developed as a **Minimum Viable Product (MVP)** for the **Digital Cooperatives Expo 2026 Hackathon** organized by **Kementerian Koperasi RI × PEBS FEB UI**.
The primary focus of this project is to address challenges within the **Real-Time Supply Chain Optimization of KDKMP (Koperasi Desa/Kelurahan Merah Putih)**.

---

## Table of Contents
* [1. Executive Summary](#1-executive-summary)
* [2. Pilot Project & Nationwide Scalability](#2-pilot-project--nationwide-scalability)
* [3. Background & Problem Statement](#3-background--problem-statement)
* [4. Key Features & Workflow](#4-key-features--workflow)
* [5. Architecture & Tech Stack](#5-architecture--tech-stack)
* [6. Database Schema (PostgreSQL + PostGIS + pgvector)](#6-database-schema-postgresql--postgis--pgvector)
* [7. Installation & Usage Guide](#7-installation--usage-guide)
* [8. Demo Scenario & Disruption Rerouting Simulation](#8-demo-scenario--disruption-rerouting-simulation)
* [Project Structure](#project-structure)

---

## 1. Executive Summary
The Red & White Village Cooperatives program (KDKMP) aims to connect tens of thousands of rural cooperatives into a unified national economic digital ecosystem. In the field, village cooperatives still frequently procure goods independently and separately. This results in bloated logistics costs, low fuel efficiency, and weak purchasing power against wholesalers/producers. On the other hand, local MSMEs surrounding the villages are often invisible or overlooked.

**SimpulKop** is a smart GIS (Geographic Information System) platform designed to aggregate the procurement needs of neighboring village cooperatives, match them with the nearest local vendors/MSMEs, and calculate the most efficient combined distribution route (solving the *Traveling Salesperson Problem* / TSP).

Featuring two interactive AI pillars:
1. **AI Procurement Assistant**: Vendor lookup using natural language queries integrated with RAG (*Retrieval-Augmented Generation*).
2. **Dynamic Rerouting Engine**: Real-time simulation of supply chain disruptions (such as stockout events) to instantly compute alternative routes and evaluate their cost implications.

---

## 2. Pilot Project & Nationwide Scalability
Although the MVP's default dataset (*seed data*) is mapped around **Sleman Regency, Yogyakarta** (specifically Ngaglik, Mlati, and Depok districts) to simulate real-world road routing for the hackathon judges, **SimpulKop is designed to be fully scalable nationwide**:
* **Geospatial Scalability**: The spatial database schema (PostGIS) in `supabase/schema.sql` relies on the standard global coordinate system `EPSG:4326`. You can import cooperative and MSME datasets from any region in Indonesia (e.g., Garut, Malang, Bone, or Deli Serdang).
* **Global Routing**: The Leaflet map engine and OSRM (Open Source Routing Machine) API are global. As soon as coordinates for a new region are loaded, the map auto-focuses on the new area and calculates local road routes automatically.
* **Easy Customization**: To deploy SimpulKop in a new region, administrators only need to swap the geographical records in `data_kopdes.csv` and `data_pemasok_umkm.csv` in the `docs/` folder with coordinates of the new target region.

---

## 3. Background & Problem Statement
Aligned with the Digital Cooperatives Expo 2026 objectives, SimpulKop addresses three operational bottlenecks of village cooperatives:
1. **Fragmented Logistics**: Each cooperative sends separate vehicles to identical distributors. This wastes time and fuel.
2. **Unmapped Suppliers**: Cooperative managers face challenges comparing prices, capacities, distances, and credit terms (payment tempo) across nearby vendors.
3. **Local MSME Exclusion**: Local suppliers lack simple channels to advertise bulk produce directly to rural cooperative hubs.

SimpulKop answers these challenges with the slogan: **"One map. One route. Shared procurement made cheaper."** demonstrating up to **40%+** shipping cost savings per cycle.

---

## 4. Key Features & Workflow

### A. Interactive GIS Map Interface
* Maps the locations of **8 Village Cooperatives** (blue nodes) and **33 Vendors/MSMEs** (color-coded by category) in Sleman, Yogyakarta.
* Filters by product categories, payment modes (Cash, Transfer, Credit/Tempo, QRIS), and stock status.
* **Buyer Reachability Heatmap**: Renders heatmaps weighted by cooperative membership size to pinpoint areas of highest market demand.
* 4 map layer styles (*Lite*, *Standard*, *Dark*, and *Satellite*).

### B. Demand Aggregation & TSP Route Optimization
* **Demand Aggregation**: Combines purchase quantities from multiple cooperatives (e.g., rice orders from KOP-01, KOP-02, and KOP-04).
* **Greedy TSP Solver**: Calculates the shortest route sequence starting from the hub cooperative, visiting selected suppliers, delivering to destination cooperatives, and returning.
* **OSRM Integration**: Computes real-time road geometries via the Open Source Routing Machine API rather than flat straight-line approximations.
* **Google Maps Export**: Generates multi-stop Google Maps directions instantly, ready to be sent to the delivery driver's mobile device.

### C. AI Procurement Assistant
* Natural language chatbot powered by Groq's Llama-3.3-70b-versatile model.
* System prompts are dynamically injected with Sleman's cooperative profile data and vendor lists.
* Allows queries like: *"Which rice supplier in Ngaglik supports 30-day payment tempo?"* or *"What is the closest fertilizer vendor to Sardonoharjo with available stock?"*

### D. Data Management Dashboard (CRUD)
* Seamlessly add, edit, or remove cooperatives and suppliers.
* Utilizes reactive Svelte Stores backed by `localStorage` persistence, ensuring simulated changes are saved across browser refreshes.

---

## 5. Architecture & Tech Stack
* **Frontend Framework**: Svelte 5 (relying on svelte-kit and stores) for high-performance reactive UI states via `$state` and `$derived`.
* **CSS Framework**: Tailwind CSS v4 powered by Vite compilation.
* **GIS & Routing**:
  - Leaflet.js for interactive mapping.
  - Leaflet.heat for membership-density heatmaps.
  - OSRM API for road-distance calculations.
* **Database & PostGIS (Production Phase)**: Supabase PostgreSQL with PostGIS for spatial operations and `pgvector` for upcoming RAG vector search modules. Ready-to-use schema is provided in `supabase/schema.sql`.
* **Data Storage (MVP)**: Local state management based on Svelte Stores and `localStorage` persistence, enabling easy demonstration without external database dependencies.
* **AI API**: Groq SDK (`groq-sdk`) interfacing with `llama-3.3-70b-versatile`.

---

## 6. Database Schema (PostgreSQL + PostGIS + pgvector)
> **Important Note**: This MVP application runs independently (*standalone*) using local seed data in `src/lib/data.js` and persistence in the browser's `localStorage`. The schema below is the PostgreSQL database blueprint designed for production server (Supabase) migration in the next phase.

The database features the `vendors_in_radius` SQL function to speed up proximity queries:
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

## 7. Installation & Usage Guide

### Requirements:
* Node.js v18 or newer.
* NPM or Yarn.
* A Groq Cloud API Key.

### Steps:
1. **Clone this repository**:
   ```bash
   git clone https://github.com/[your-username]/SimpulKop.git
   cd SimpulKop
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Add your Groq API Key to the `.env` file:
   ```env
   GROQ_API_KEY=gsk_YourActualGroqApiKey
   ```
4. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 8. Demo Scenario & Disruption Rerouting Simulation
To test the features in Ngaglik district:
1. **Select Cooperatives & Suppliers**:
   * Cooperatives: **Sardonoharjo (KOP-01)**, **Donoharjo (KOP-02)**, and **Sukoharjo (KOP-04)**.
   * Aggregated Needs: **1,200 kg Rice** and **300 kg NPK Fertilizer**.
2. **Calculated Shared Route**:
   * Initial path: Sardonoharjo (Start) -> **Kulino Tani (VND-032)** -> **Mina Swalayan Gentan (VND-031)** -> Sukoharjo -> Donoharjo -> Sardonoharjo (End).
   * Distance: **~19.6 km** (saving **47.5%** over separate round-trips totalling **~37.3 km**).
3. **Simulate a Supply Chain Disruption**:
   * Check the box: *"Mina Swalayan stockout -> replace with Damai Makmur"*.
   * The optimization engine automatically flags Mina Swalayan as unavailable, searches for the nearest alternative, and selects **Toko Sembako Damai Makmur (VND-001)**.
   * The OSRM API instantly recalculates the road path, updates cost metrics, and plots the new route on the map.

---

## Project Structure
Here is the folder hierarchy of the SimpulKop project:
```text
SimpulKop/
├── docs/                   # PRD documents and seed CSV data
│   ├── PRD_SimpulKop.docx  # Product Requirements Document
│   ├── data_kopdes.csv     # Seed data for Village Cooperatives
│   └── data_pemasok_umkm.csv # Seed data for Sleman Vendors/MSMEs
├── src/
│   ├── lib/
│   │   ├── data.js         # Fallback static datasets for vendors & co-ops
│   │   ├── geo.js          # Geospatial logic (Haversine, greedy TSP, calcSavings)
│   │   └── store.js        # Writable stores with localStorage persistence
│   ├── routes/
│   │   ├── (landing)/      # Landing Page routes
│   │   ├── (app)/          # Application routes (Dashboard, Map, Clusters, AI Chat, Manage)
│   │   └── api/
│   │       └── chat/       # Server-side endpoint integrating Groq SDK
│   ├── app.css             # Tailwind CSS v4 styling sheet
│   └── app.html            # Core HTML template file
├── supabase/
│   └── schema.sql          # DB schema for PostgreSQL + PostGIS + pgvector
├── .env.example            # Sample environment configurations
├── package.json            # Script triggers and dependency metadata
├── svelte.config.js        # SvelteKit adapter setups (Vercel)
└── vite.config.js          # Vite bundler configurations
```
