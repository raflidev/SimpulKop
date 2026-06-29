<script>
  import { onMount, onDestroy } from 'svelte';
  import { VENDORS, KOPDES, DEMO, CAT_COLORS } from '$lib/data.js';
  import { calcSavings, BIAYA_PER_KM } from '$lib/geo.js';

  let mapEl = $state(null);
  let map;
  let savingsPct = $state(null);

  onMount(async () => {
    const { default: L } = await import('leaflet');
    map = L.map(mapEl, { zoomControl: true }).setView([-7.71, 110.39], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OSM © CARTO' }).addTo(map);

    const vendors = VENDORS.filter(v => DEMO.vendorIds.includes(v.id));
    const kopdes  = KOPDES.filter(k => DEMO.kopdesIds.includes(k.id));
    const result  = calcSavings(vendors, kopdes);
    savingsPct = result.savingsPct;

    // Draw road route via OSRM, fallback to straight-line
    try {
      const coords = result.route.map(p => `${p.lng},${p.lat}`).join(';');
      const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      const osrm = data.routes?.[0];
      if (osrm) {
        const roadKm = osrm.distance / 1000;
        const sepKm  = result.separateKm * (roadKm / result.combinedKm);
        savingsPct = +((sepKm - roadKm) / sepKm * 100).toFixed(1);
        L.polyline(osrm.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          { color: '#f97316', weight: 4, opacity: 0.9 }).addTo(map);
      } else {
        throw new Error('no route');
      }
    } catch {
      L.polyline(result.route.map(p => [p.lat, p.lng]),
        { color: '#f97316', weight: 4, opacity: 0.9 }).addTo(map);
    }

    // Markers
    result.route.forEach((p, i) => {
      if (i === result.route.length - 1) return;
      const isVendor = p.type === 'vendor';
      const color    = isVendor ? (CAT_COLORS[p.kategori] || '#3B82F6') : '#1E40AF';
      const label    = isVendor ? p.nama : p.desa;
      const tooltip = isVendor
        ? `<div style="min-width:200px">
            <div style="font-weight:700;font-size:13px;margin-bottom:5px">${p.nama}</div>
            <span style="background:${color};color:white;padding:2px 7px;border-radius:4px;font-size:10px">${p.kategori}</span>
            <div style="margin-top:8px;font-size:11px;line-height:1.7">
              <div>📍 ${p.alamat}, ${p.desa}</div>
              <div>📦 ${p.produk}</div>
              <div>💳 ${p.metodeBayar.join(', ')} · ⭐ ${p.rating}</div>
              <div>⏰ ${p.jam}</div>
            </div>
          </div>`
        : `<div style="min-width:190px">
            <div style="font-weight:700;font-size:13px;margin-bottom:5px">${p.nama}</div>
            <span style="background:#1E40AF;color:white;padding:2px 7px;border-radius:4px;font-size:10px">Koperasi Desa</span>
            <div style="margin-top:8px;font-size:11px;line-height:1.7">
              <div>📍 ${p.alamat}</div>
              <div>👥 ${p.anggota?.toLocaleString('id-ID')} anggota</div>
              <div>📦 Gudang: ${p.gudang ? 'Tersedia' : 'Tidak ada'}</div>
              <div style="color:#6b7280;margin-top:3px">${p.catatan}</div>
            </div>
          </div>`;

      const iconHtml = isVendor
        ? `<div style="background:${color};width:13px;height:13px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`
        : `<div style="display:flex;align-items:center;gap:5px">
            <div style="background:${color};width:17px;height:17px;border-radius:3px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);shrink:0"></div>
            <span style="background:white;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:700;color:#1e3a8a;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.1)">${p.desa}</span>
          </div>`;

      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          html: iconHtml,
          iconSize: isVendor ? [13,13] : [120, 17],
          iconAnchor: isVendor ? [6,6] : [8,8],
          className: ''
        })
      })
        .bindTooltip(tooltip, { direction: 'top', offset: [0, isVendor ? -6 : -10], className: 'hero-tooltip' })
        .addTo(map);
    });

    map.fitBounds(
      L.latLngBounds(result.route.map(p => [p.lat, p.lng])),
      { padding: [36, 36] }
    );
  });

  onDestroy(() => map?.remove());
</script>

<svelte:head>
  <title>SimpulKop - Pengadaan Bersama, Hemat Lebih</title>
  <meta name="description" content="Platform pemetaan vendor dan optimasi rute kolektif untuk koperasi desa di Sleman, DIY." />
</svelte:head>

<div class="bg-white text-slate-800 antialiased">

  <!-- NAV -->
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
    <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
      <a href="/" class="font-bold text-slate-900 mr-auto shrink-0">SimpulKop</a>
      <div class="hidden lg:flex items-center gap-5 text-sm text-slate-500">
        <a href="/peta" class="hover:text-slate-800 transition-colors">Peta Vendor</a>
        <a href="/klaster" class="hover:text-slate-800 transition-colors">Klaster &amp; Rute</a>
        <a href="/chat" class="hover:text-slate-800 transition-colors">Chat AI</a>
        <a href="/dashboard" class="hover:text-slate-800 transition-colors">Dashboard</a>
      </div>
      <a href="/peta" class="shrink-0 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors">
        Buka Aplikasi
      </a>
    </nav>
  </header>

  <!-- HERO: Asymmetric Split -->
  <section class="min-h-[100dvh] flex items-center">
    <div class="max-w-7xl mx-auto px-6 w-full py-24 lg:py-0">
      <div class="grid lg:grid-cols-[1fr_460px] gap-12 lg:gap-16 items-center min-h-[100dvh]">

        <!-- Left: Copy -->
        <div class="max-w-xl">
          <h1 class="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Peta Vendor & Rute Optimal<br>
            <span class="text-green-700">untuk Koperasi Desa</span>
          </h1>
          <p class="text-lg text-slate-500 leading-relaxed mb-10 max-w-[46ch]">
            Platform GIS untuk memetakan vendor UMKM, mengoptimalkan rute distribusi kolektif, dan mengelola koperasi desa di Sleman, DIY.
          </p>
          <div class="flex flex-wrap gap-3">
            <a href="/peta"
              class="bg-green-700 text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-green-800 active:scale-[0.98] transition-all shadow-sm shadow-green-900/10">
              Buka Peta Vendor
            </a>
            <a href="/dashboard"
              class="bg-white text-slate-700 px-7 py-3.5 rounded-xl font-semibold text-base border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all">
              Lihat Demo
            </a>
          </div>
        </div>

        <!-- Right: Live Map -->
        <div class="flex items-center justify-center lg:justify-end">
          <div class="relative w-full max-w-[460px] h-[380px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <div bind:this={mapEl} class="absolute inset-0"></div>

            <!-- Savings badge -->
            {#if savingsPct !== null}
              <div class="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow border border-slate-100 pointer-events-none">
                <div class="text-[10px] font-bold text-green-700 uppercase tracking-widest">Rute Optimal</div>
                <div class="text-2xl font-black text-green-700 leading-tight">Hemat {savingsPct}%</div>
              </div>
            {/if}

            <!-- Legend -->
            <div class="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-slate-100 pointer-events-none space-y-1">
              <div class="flex items-center gap-1.5">
                <div class="w-3.5 h-3.5 rounded-[3px] bg-blue-800 shrink-0"></div>
                <span class="text-[11px] text-slate-600">Koperasi Desa</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>
                <span class="text-[11px] text-slate-600">Vendor UMKM</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="h-[3px] w-4 bg-orange-400 rounded shrink-0"></div>
                <span class="text-[11px] text-slate-600">Rute Optimal</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- STATS BAR -->
  <section class="bg-green-700">
    <div class="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      <div>
        <div class="text-4xl font-bold text-white">33</div>
        <div class="text-green-200 text-sm mt-1.5">Vendor Aktif</div>
      </div>
      <div class="lg:border-l lg:border-green-600/50">
        <div class="text-4xl font-bold text-white">8</div>
        <div class="text-green-200 text-sm mt-1.5">Koperasi Desa</div>
      </div>
      <div class="lg:border-l lg:border-green-600/50">
        <div class="text-4xl font-bold text-white">&gt;40%</div>
        <div class="text-green-200 text-sm mt-1.5">Hemat Biaya Logistik</div>
      </div>
      <div class="lg:border-l lg:border-green-600/50">
        <div class="text-4xl font-bold text-white">3</div>
        <div class="text-green-200 text-sm mt-1.5">Kecamatan di Sleman</div>
      </div>
    </div>
  </section>

  <!-- FEATURES: Bento 2+1 -->
  <section class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-xs font-bold uppercase tracking-[0.2em] text-green-700 mb-3">Fitur Utama</div>
      <h2 class="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-12 max-w-lg">
        Manajemen vendor, rute optimal, koperasi desa dalam satu platform
      </h2>

      <!-- Top row: asymmetric 2 cards -->
      <div class="grid lg:grid-cols-[1.2fr_1fr] gap-5 mb-5">

        <!-- Feature 1: Peta Vendor (dark green) -->
        <div class="bg-green-700 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-green-600/50"></div>
          <div class="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-green-800/40"></div>
          <div class="relative z-10">
            <div class="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center mb-6">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">Peta Vendor Interaktif</h3>
            <p class="text-green-200 text-base leading-relaxed mb-6 max-w-sm">
              Temukan 33 vendor UMKM terdekat dengan filter kategori, metode bayar, dan ketersediaan stok secara real-time.
            </p>
            <a href="/peta" class="inline-flex items-center gap-2 text-white font-semibold text-sm hover:text-green-200 transition-colors">
              Buka Peta
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Feature 2: Klaster & Rute (white with border) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
          <!-- Decorative route SVG -->
          <div class="absolute bottom-0 right-0 opacity-[0.06]" aria-hidden="true">
            <svg viewBox="0 0 200 160" class="w-44 h-36">
              <polyline points="20,140 60,80 100,120 140,50 180,90" fill="none" stroke="#15803d" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
              <circle cx="20" cy="140" r="10" fill="#15803d"/>
              <circle cx="180" cy="90" r="10" fill="#15803d"/>
            </svg>
          </div>
          <div class="relative z-10">
            <div class="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-6">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3">Optimasi Rute Kolektif</h3>
            <p class="text-slate-500 text-base leading-relaxed mb-6 max-w-sm">
              Algoritma TSP menghitung rute pengadaan bersama paling efisien antar koperasi desa dan vendor. Hemat jarak dan biaya.
            </p>
            <a href="/klaster" class="inline-flex items-center gap-2 text-green-700 font-semibold text-sm hover:text-green-800 transition-colors">
              Hitung Rute
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom row: Chat AI full-width -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-8 lg:p-10 grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        <div>
          <div class="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">Asisten AI Pengadaan</h3>
          <p class="text-slate-500 text-base leading-relaxed mb-6 max-w-md">
            Tanya soal vendor, stok, harga, dan rute distribusi dalam bahasa natural. Dijawab langsung berdasarkan data 33 vendor di Sleman.
          </p>
          <a href="/chat" class="inline-flex items-center gap-2 text-green-700 font-semibold text-sm hover:text-green-800 transition-colors">
            Coba Chat AI
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/>
            </svg>
          </a>
        </div>

        <!-- Chat demo (real UI elements, same styling as /chat) -->
        <div class="space-y-3">
          <div class="flex justify-end">
            <div class="bg-green-700 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed">
              Vendor beras terbaik di Ngaglik yang terima tempo?
            </div>
          </div>
          <div class="flex gap-2.5">
            <div class="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">SK</div>
            <div class="bg-white border border-slate-200 text-slate-700 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed max-w-[85%]">
              UD Makmur Jaya, Jl. Kaliurang km 7. Rating 4.8, kapasitas 2 ton/minggu, terima tempo 30 hari.
            </div>
          </div>
          <div class="flex justify-end">
            <div class="bg-green-700 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed">
              Ada alternatif lain?
            </div>
          </div>
          <div class="flex gap-2.5">
            <div class="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">SK</div>
            <div class="bg-white border border-slate-200 text-slate-700 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed max-w-[85%]">
              Toko Damai Makmur di Sinduharjo, rating 4.5, lebih dekat ke Kopdes Sardonoharjo.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS: 3 Steps -->
  <section class="py-24 bg-white border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-6">
      <h2 class="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-4">Cara Kerja</h2>
      <p class="text-slate-500 text-lg mb-16 max-w-[44ch]">
        Dari pendaftaran hingga penghematan, semua dalam satu platform.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div class="flex lg:block gap-5 items-start">
          <div class="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center shrink-0 lg:mb-6">
            <span class="text-2xl font-black text-green-700">1</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Daftarkan</h3>
            <p class="text-slate-500 text-base leading-relaxed">
              Masukkan data koperasi desa dan daftar vendor UMKM di wilayahnya, mulai dari sembako, pupuk, hingga peralatan pertanian.
            </p>
          </div>
        </div>

        <div class="flex lg:block gap-5 items-start">
          <div class="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center shrink-0 lg:mb-6">
            <span class="text-2xl font-black text-orange-600">2</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Cocokkan</h3>
            <p class="text-slate-500 text-base leading-relaxed">
              Sistem memetakan vendor terdekat dan menghitung rute distribusi kolektif paling efisien antar koperasi desa dengan algoritma TSP.
            </p>
          </div>
        </div>

        <div class="flex lg:block gap-5 items-start">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0 lg:mb-6">
            <span class="text-2xl font-black text-slate-700">3</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Hemat</h3>
            <p class="text-slate-500 text-base leading-relaxed">
              Jalankan rute bersama, kurangi biaya transportasi lebih dari 40%, dan dapatkan laporan pengadaan otomatis setiap siklus.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA BANNER -->
  <section class="bg-green-700 py-20">
    <div class="max-w-3xl mx-auto px-6 text-center">
      <h2 class="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
        Siap kelola vendor dan optimalkan rute koperasi desa Anda?
      </h2>
      <p class="text-green-200 text-lg mb-10 max-w-[38ch] mx-auto">
        Tersedia gratis untuk demo. Data vendor real di Sleman sudah tersedia.
      </p>
      <a href="/peta"
        class="inline-flex items-center bg-white text-green-800 px-8 py-4 rounded-xl font-bold text-base hover:bg-green-50 active:scale-[0.98] transition-all shadow-lg shadow-green-900/20">
        Buka Peta Vendor
      </a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="border-t border-slate-100 py-8">
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="font-bold text-slate-600">SimpulKop</div>
      <div class="text-sm text-slate-400">&copy; 2026 Hackathon MVP - Sleman, Daerah Istimewa Yogyakarta</div>
    </div>
  </footer>

</div>
