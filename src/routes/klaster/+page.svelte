<script>
  import { onMount, onDestroy } from 'svelte';
  import { VENDORS, KOPDES, CAT_COLORS, DEMO } from '$lib/data.js';
  import { calcSavings, formatRp, BIAYA_PER_KM } from '$lib/geo.js';

  const STYLES = {
    lite:     { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', label: 'Lite' },
    standard: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',             label: 'Standard' },
    gelap:    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',  label: 'Gelap' },
    satelit:  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satelit' },
  };

  let mapEl = $state(null);
  let map, routeLayer, markersLayer, tileLayer;
  let L;
  let mapStyle = $state('lite');

  function setStyle(key) {
    mapStyle = key;
    if (!map || !L) return;
    tileLayer?.remove();
    tileLayer = L.tileLayer(STYLES[key].url, { attribution: '© OSM © CARTO' }).addTo(map);
  }

  // State - pre-loaded with demo scenario
  let selKopdesIds = $state([...DEMO.kopdesIds]);
  let selVendorIds = $state([...DEMO.vendorIds]);
  let result = $state(null);
  let loadingRoute = $state(false);
  let showAlt = $state(false); // alternative route demo

  // Alternative: Mina Swalayan habis → ganti Damai Makmur
  const ALT_VENDOR_ID = 'VND-001';

  const selKopdes = $derived(KOPDES.filter(k => selKopdesIds.includes(k.id)));
  const selVendors = $derived(VENDORS.filter(v => selVendorIds.includes(v.id)));

  // Vendor suggestions per kebutuhan kategori in demo
  const demoKategori = ['Sembako', 'Pupuk & Pertanian'];
  function suggestVendors(kat) {
    const hub = selKopdes[0];
    return VENDORS
      .filter(v => v.kategori === kat && v.stok !== 'kosong')
      .sort((a,b) => {
        const da = Math.hypot(a.lat - hub.lat, a.lng - hub.lng);
        const db = Math.hypot(b.lat - hub.lat, b.lng - hub.lng);
        return da - db;
      })
      .slice(0, 3);
  }

  async function fetchRoadRoute(points) {
    // OSRM uses {lng},{lat} order (reversed from Leaflet)
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    return data.routes?.[0]; // { geometry.coordinates: [[lng,lat],...], distance (m) }
  }

  async function hitungRute() {
    if (!selKopdes.length || !selVendors.length) return;
    loadingRoute = true;
    const vendors = showAlt
      ? [...selVendors.filter(v => v.id !== 'VND-031'), VENDORS.find(v => v.id === ALT_VENDOR_ID)]
      : selVendors;

    // Step 1: TSP ordering via Haversine (instant) - shows straight-line preview
    result = calcSavings(vendors, selKopdes);

    // Step 2: Fetch actual road geometry & update stats
    try {
      const osrm = await fetchRoadRoute(result.route);
      if (osrm) {
        const roadKm = +(osrm.distance / 1000).toFixed(1);
        // Scale separate distance by road/haversine ratio so savings % stays consistent
        const ratio = roadKm / result.combinedKm;
        const separateKm = +(result.separateKm * ratio).toFixed(1);
        const savingsPct = +((separateKm - roadKm) / separateKm * 100).toFixed(1);
        result = {
          ...result,
          roadCoords: osrm.geometry.coordinates,
          combinedKm: roadKm,
          separateKm,
          savingsPct,
          biayaBersama: Math.round(roadKm * BIAYA_PER_KM),
          biayaTerpisah: Math.round(separateKm * BIAYA_PER_KM),
          hematRupiah: Math.round((separateKm - roadKm) * BIAYA_PER_KM)
        };
      }
    } catch {
      // network error or rate limit - straight-line result stays
    }
    loadingRoute = false;
  }

  function drawRoute() {
    if (!map || !result) return;
    routeLayer?.remove();
    markersLayer?.clearLayers();

    // Road geometry from OSRM if available, else straight-line fallback
    if (result.roadCoords) {
      const roadPts = result.roadCoords.map(([lng, lat]) => [lat, lng]);
      routeLayer = L.polyline(roadPts, { color: '#f97316', weight: 4, opacity: 0.85 }).addTo(map);
    } else {
      routeLayer = L.polyline(result.route.map(p => [p.lat, p.lng]),
        { color: '#f97316', weight: 4, opacity: 0.85 }).addTo(map);
    }

    // Numbered waypoint markers (always from TSP-ordered route points)
    result.route.forEach((p, i) => {
      if (i === result.route.length - 1) return; // skip return-to-start duplicate
      const isVendor = p.type === 'vendor';
      const color = isVendor ? (CAT_COLORS[p.kategori] || '#3B82F6') : '#1E40AF';
      const icon = L.divIcon({
        html: `<div style="background:${color};width:${isVendor?14:18}px;height:${isVendor?14:18}px;border-radius:${isVendor?'50%':'3px'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700">${i+1}</div>`,
        iconSize: [isVendor?14:18, isVendor?14:18],
        iconAnchor: [isVendor?7:9, isVendor?7:9],
        className: ''
      });
      L.marker([p.lat, p.lng], { icon }).bindPopup(`<b>${p.nama}</b><br>${isVendor?'Vendor/UMKM':'Koperasi Desa'}`).addTo(markersLayer);
    });

    // fitBounds using waypoint coords (road geometry can be too wide)
    map.fitBounds(L.latLngBounds(result.route.map(p => [p.lat, p.lng])), { padding: [40, 40] });
  }

  $effect(() => {
    // re-draw when result changes
    result;
    if (map && result) drawRoute();
  });

  onMount(async () => {
    const mod = await import('leaflet');
    L = mod.default;
    map = L.map(mapEl).setView([-7.69, 110.39], 12);
    tileLayer = L.tileLayer(STYLES.lite.url, { attribution: '© OSM © CARTO' }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    // Auto-run demo
    hitungRute();
  });

  onDestroy(() => map?.remove());

  function toggleKopdes(id) {
    selKopdesIds = selKopdesIds.includes(id)
      ? selKopdesIds.filter(x => x !== id)
      : [...selKopdesIds, id];
    result = null;
  }

  function toggleVendor(id) {
    selVendorIds = selVendorIds.includes(id)
      ? selVendorIds.filter(x => x !== id)
      : [...selVendorIds, id];
    result = null;
  }

  function bukaGoogleMaps() {
    const pts = result.route.filter((_, i) => i < result.route.length - 1);
    const coord = p => `${p.lat},${p.lng}`;
    const origin = coord(pts[0]);
    const dest = coord(pts[pts.length - 1]);
    const waypoints = pts.slice(1, -1).map(coord).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
    window.open(url, '_blank');
  }
</script>

<div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 56px)">
  <!-- Panel Kiri -->
  <aside class="w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
    <div class="p-4 bg-green-50 border-b border-green-100">
      <div class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Demo Skenario</div>
      <div class="text-sm text-green-900 font-medium">Klaster Ngaglik - 3 Kopdes, 2 Vendor</div>
    </div>

    <!-- Step 1: Pilih Kopdes -->
    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
        <span class="font-semibold text-slate-800 text-sm">Pilih Koperasi Desa</span>
      </div>
      <div class="space-y-2">
        {#each KOPDES as k}
          <label class="flex items-start gap-2 cursor-pointer group">
            <input type="checkbox" checked={selKopdesIds.includes(k.id)} onchange={() => toggleKopdes(k.id)}
              class="mt-0.5 rounded accent-green-600" />
            <div>
              <div class="text-sm text-slate-800 group-hover:text-green-700">{k.desa}</div>
              <div class="text-xs text-slate-500">{k.anggota} anggota · {k.kecamatan}</div>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Step 2: Vendor -->
    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
        <span class="font-semibold text-slate-800 text-sm">Pilih Vendor</span>
      </div>

      {#each demoKategori as kat}
        <div class="mb-3">
          <div class="text-xs font-semibold text-slate-500 uppercase mb-1.5">{kat}</div>
          {#each suggestVendors(kat) as v}
            <label class="flex items-start gap-2 cursor-pointer mb-1.5 group">
              <input type="checkbox" checked={selVendorIds.includes(v.id)} onchange={() => toggleVendor(v.id)}
                class="mt-0.5 rounded accent-green-600" />
              <div>
                <div class="text-sm text-slate-800 group-hover:text-green-700">{v.nama}
                  {#if v.metodeBayar.includes('Tempo')}
                    <span class="text-xs bg-amber-100 text-amber-700 px-1 rounded ml-1">Tempo</span>
                  {/if}
                </div>
                <div class="text-xs text-slate-500">{v.desa} · ★ {v.rating} · {v.kapasitas}</div>
              </div>
            </label>
          {/each}
        </div>
      {/each}
    </div>

    <!-- Step 3: Hitung -->
    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
        <span class="font-semibold text-slate-800 text-sm">Optimasi Rute</span>
      </div>
      <button
        onclick={hitungRute}
        disabled={!selKopdes.length || !selVendors.length || loadingRoute}
        class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
        {#if loadingRoute}
          <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Mengambil Rute Jalan...
        {:else}
          Hitung Rute Optimal
        {/if}
      </button>
    </div>

    <!-- Demo: Rute Alternatif -->
    <div class="p-4 bg-red-50 border-b border-red-100">
      <div class="text-xs font-semibold text-red-700 uppercase mb-2">Simulasi Gangguan</div>
      <label class="flex items-center gap-2 cursor-pointer mb-2">
        <input type="checkbox" bind:checked={showAlt} onchange={hitungRute} class="rounded accent-red-600" />
        <span class="text-sm text-red-800">Mina Swalayan stok habis → ganti Damai Makmur</span>
      </label>
      {#if showAlt}
        <div class="text-xs text-red-700 bg-red-100 rounded p-2">
          Sistem merekomendasikan <b>Toko Sembako Damai Makmur</b> (Jl. Damai No.1, Sinduharjo) sebagai pengganti terdekat. Rute disesuaikan otomatis.
        </div>
      {/if}
    </div>

    <!-- Ringkasan kebutuhan -->
    <div class="p-4">
      <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Agregasi Kebutuhan</div>
      <div class="space-y-1.5">
        {#each DEMO.kebutuhan.reduce((acc, k) => {
          const ex = acc.find(a => a.item === k.item);
          if (ex) ex.jumlah += k.jumlah; else acc.push({...k});
          return acc;
        }, []) as kb}
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">{kb.item}</span>
            <span class="font-semibold text-green-700">{kb.jumlah.toLocaleString('id-ID')} {kb.satuan}</span>
          </div>
        {/each}
      </div>
      <div class="mt-2 text-xs text-slate-500">Gabungan dari {selKopdes.length} koperasi desa</div>
    </div>
  </aside>

  <!-- Peta + Hasil -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="relative flex-1">
      <div bind:this={mapEl} class="absolute inset-0"></div>

      <!-- Map style switcher -->
      <div class="absolute bottom-6 left-3 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-slate-200 p-1">
        {#each Object.entries(STYLES) as [key, s]}
          <button onclick={() => setStyle(key)}
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors
              {mapStyle === key ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            {s.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Savings Card -->
    {#if result}
      <div class="bg-white border-t border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{result.savingsPct}%</div>
          <div class="text-xs text-slate-500 mt-0.5">Hemat Jarak</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-slate-800">{result.combinedKm} km</div>
          <div class="text-xs text-slate-500 mt-0.5">Rute Bersama</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-slate-400 line-through">{result.separateKm} km</div>
          <div class="text-xs text-slate-500 mt-0.5">Rute Terpisah</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-green-700">{formatRp(result.hematRupiah)}</div>
          <div class="text-xs text-slate-500 mt-0.5">Hemat / Siklus</div>
        </div>
      </div>

      <!-- Route detail -->
      <div class="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs text-slate-600 whitespace-nowrap">
        <span class="font-semibold text-slate-800">Urutan:</span>
        {#each result.route as p, i}
          {#if i > 0}<span class="text-slate-400">→</span>{/if}
          <span class="{p.type === 'kopdes' ? 'text-blue-700 font-semibold' : 'text-orange-700'}">{p.nama?.split(' ').slice(0,3).join(' ')}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>
