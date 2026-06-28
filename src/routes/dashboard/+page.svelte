<script>
  import { onMount, onDestroy } from 'svelte';
  import { VENDORS, KOPDES, CAT_COLORS } from '$lib/data.js';
  import { calcSavings, formatRp, haversineKm } from '$lib/geo.js';

  // Demo stats
  const demo = calcSavings(
    VENDORS.filter(v => ['VND-001','VND-004'].includes(v.id)),
    KOPDES.filter(k => ['KOP-01','KOP-02','KOP-04'].includes(k.id))
  );

  const totalAnggota = KOPDES.reduce((s, k) => s + k.anggota, 0);
  const avgRating = (VENDORS.reduce((s,v) => s+v.rating,0)/VENDORS.length).toFixed(1);

  // Per-kategori breakdown
  const byKat = Object.entries(
    VENDORS.reduce((acc, v) => { acc[v.kategori] = (acc[v.kategori]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]);

  // Mock route history
  const history = [
    { tanggal:'28 Jun 2026', klaster:'Ngaglik', kopdes:3, vendor:2, km:demo.combinedKm, hemat:`${demo.savingsPct}%` },
    { tanggal:'21 Jun 2026', klaster:'Mlati', kopdes:2, vendor:3, km:14.2, hemat:'54%' },
    { tanggal:'14 Jun 2026', klaster:'Depok', kopdes:2, vendor:2, km:8.7, hemat:'48%' }
  ];

  let mapEl = $state(null);
  let map;

  onMount(async () => {
    const mod = await import('leaflet');
    const L = mod.default;
    map = L.map(mapEl, { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([-7.715, 110.38], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    VENDORS.forEach(v => {
      const color = CAT_COLORS[v.kategori] || '#9CA3AF';
      L.circleMarker([v.lat, v.lng], { radius: 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85 })
        .bindTooltip(v.nama, { permanent: false }).addTo(map);
    });
    KOPDES.forEach(k => {
      L.circleMarker([k.lat, k.lng], { radius: 7, fillColor: '#1E40AF', color: '#fff', weight: 2, fillOpacity: 0.9 })
        .bindTooltip(k.desa, { permanent: false }).addTo(map);
    });
  });

  onDestroy(() => map?.remove());
</script>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-800">Dashboard SimpulKop</h1>
    <p class="text-slate-500 text-sm mt-1">Kabupaten Sleman · Data seed MVP · Demo Hackathon 2026</p>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div class="text-3xl font-bold text-green-600">{VENDORS.length}</div>
      <div class="text-sm text-slate-600 mt-1">Vendor Terdaftar</div>
      <div class="text-xs text-slate-400 mt-0.5">{Object.keys(CAT_COLORS).length} kategori</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div class="text-3xl font-bold text-blue-600">{KOPDES.length}</div>
      <div class="text-sm text-slate-600 mt-1">Koperasi Aktif</div>
      <div class="text-xs text-slate-400 mt-0.5">{totalAnggota.toLocaleString('id-ID')} total anggota</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div class="text-3xl font-bold text-orange-500">{demo.savingsPct}%</div>
      <div class="text-sm text-slate-600 mt-1">Rata-rata Penghematan</div>
      <div class="text-xs text-slate-400 mt-0.5">vs. pengadaan terpisah</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div class="text-3xl font-bold text-purple-600">{avgRating}★</div>
      <div class="text-sm text-slate-600 mt-1">Rata-rata Rating</div>
      <div class="text-xs text-slate-400 mt-0.5">dari semua vendor</div>
    </div>
  </div>

  <!-- Row 2: Map + Stats -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Mini Map -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800 text-sm">Sebaran Vendor & Kopdes</div>
      <div bind:this={mapEl} style="height: 280px"></div>
      <div class="px-4 py-2 flex gap-4 text-xs text-slate-500">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-800 inline-block"></span>Kopdes</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Vendor</span>
      </div>
    </div>

    <!-- Category breakdown -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div class="font-semibold text-slate-800 text-sm mb-3">Vendor per Kategori</div>
      <div class="space-y-2">
        {#each byKat as [kat, count]}
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full shrink-0" style="background:{CAT_COLORS[kat]||'#9CA3AF'}"></span>
            <div class="flex-1 text-sm text-slate-700 truncate">{kat}</div>
            <div class="text-xs text-slate-500 w-6 text-right">{count}</div>
            <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width:{(count/VENDORS.length*100).toFixed(0)}%;background:{CAT_COLORS[kat]||'#9CA3AF'}"></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Demo scenario savings -->
  <div class="bg-green-50 rounded-xl border border-green-200 p-5">
    <div class="font-semibold text-green-900 mb-3">Skenario Demo: Klaster Ngaglik</div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div>
        <div class="text-xl font-bold text-green-700">{demo.combinedKm} km</div>
        <div class="text-xs text-green-600 mt-0.5">Rute Bersama</div>
      </div>
      <div>
        <div class="text-xl font-bold text-slate-500 line-through">{demo.separateKm} km</div>
        <div class="text-xs text-slate-500 mt-0.5">Rute Terpisah</div>
      </div>
      <div>
        <div class="text-xl font-bold text-green-800">{formatRp(demo.hematRupiah)}</div>
        <div class="text-xs text-green-600 mt-0.5">Hemat / Siklus</div>
      </div>
      <div>
        <div class="text-xl font-bold text-green-800">{formatRp(demo.hematRupiah * 12)}</div>
        <div class="text-xs text-green-600 mt-0.5">Hemat / Tahun (12 siklus)</div>
      </div>
    </div>
  </div>

  <!-- Route History -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800 text-sm">Riwayat Pengadaan</div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
        <tr>
          <th class="px-4 py-2 text-left">Tanggal</th>
          <th class="px-4 py-2 text-left">Klaster</th>
          <th class="px-4 py-2 text-center">Kopdes</th>
          <th class="px-4 py-2 text-center">Vendor</th>
          <th class="px-4 py-2 text-right">Jarak</th>
          <th class="px-4 py-2 text-right">Hemat</th>
        </tr>
      </thead>
      <tbody>
        {#each history as h}
          <tr class="border-t border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-600">{h.tanggal}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{h.klaster}</td>
            <td class="px-4 py-3 text-center text-slate-600">{h.kopdes}</td>
            <td class="px-4 py-3 text-center text-slate-600">{h.vendor}</td>
            <td class="px-4 py-3 text-right text-slate-600">{h.km} km</td>
            <td class="px-4 py-3 text-right font-semibold text-green-600">{h.hemat}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
