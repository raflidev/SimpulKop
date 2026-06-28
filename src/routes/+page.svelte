<script>
  import { onMount, onDestroy } from 'svelte';
  import { VENDORS, KOPDES, CAT_COLORS } from '$lib/data.js';

  let mapEl = $state(null);
  let map, markersLayer;

  let filterKategori = $state(Object.keys(CAT_COLORS));
  let filterBayar = $state([]);
  let filterStok = $state(false);
  let search = $state('');

  const KATEGORI_LIST = Object.keys(CAT_COLORS);
  const BAYAR_LIST = ['Tunai', 'Transfer', 'Tempo', 'QRIS'];

  function vendorIcon(L, kategori) {
    const color = CAT_COLORS[kategori] || '#9CA3AF';
    return L.divIcon({
      html: `<div style="background:${color};width:13px;height:13px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
      iconSize: [13,13], iconAnchor: [6,6], popupAnchor: [0,-8], className: ''
    });
  }

  function kopdesIcon(L) {
    return L.divIcon({
      html: `<div style="background:#1E40AF;width:16px;height:16px;border-radius:3px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
      iconSize: [16,16], iconAnchor: [8,8], popupAnchor: [0,-10], className: ''
    });
  }

  function vendorPopup(v) {
    const color = CAT_COLORS[v.kategori] || '#9CA3AF';
    return `<div style="min-width:210px">
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">${v.nama}</div>
      <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px">${v.kategori}</span>
      <div style="margin-top:10px;font-size:12px;line-height:1.7">
        <div><b>Produk:</b> ${v.produk}</div>
        <div><b>Kapasitas:</b> ${v.kapasitas} | Min: ${v.minOrder}</div>
        <div><b>Bayar:</b> ${v.metodeBayar.join(', ')}</div>
        <div><b>Jam:</b> ${v.jam}</div>
        <div><b>Rating:</b> ${'★'.repeat(Math.round(v.rating))} ${v.rating}</div>
        <div style="color:#6b7280;margin-top:4px">${v.catatan}</div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:#374151">📞 ${v.kontak}</div>
    </div>`;
  }

  function kopdesPopup(k) {
    return `<div style="min-width:200px">
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">${k.nama}</div>
      <span style="background:#1E40AF;color:white;padding:2px 8px;border-radius:4px;font-size:11px">Koperasi Desa</span>
      <div style="margin-top:10px;font-size:12px;line-height:1.7">
        <div>📍 ${k.alamat}</div>
        <div>👥 ${k.anggota.toLocaleString('id-ID')} anggota</div>
        <div>📦 Gudang: ${k.gudang ? 'Tersedia' : 'Tidak ada'}</div>
        <div><b>Kebutuhan:</b> ${k.kebutuhan}</div>
        <div style="color:#6b7280;margin-top:4px">${k.catatan}</div>
      </div>
    </div>`;
  }

  let L;

  function renderMarkers() {
    if (!map || !L) return;
    markersLayer?.clearLayers();

    const q = search.toLowerCase();
    const filtered = VENDORS.filter(v =>
      filterKategori.includes(v.kategori) &&
      (!filterStok || v.stok === 'tersedia') &&
      (!filterBayar.length || filterBayar.some(b => v.metodeBayar.includes(b))) &&
      (!q || v.nama.toLowerCase().includes(q) || v.produk.toLowerCase().includes(q))
    );

    filtered.forEach(v => {
      L.marker([v.lat, v.lng], { icon: vendorIcon(L, v.kategori) })
        .bindPopup(vendorPopup(v))
        .addTo(markersLayer);
    });

    KOPDES.forEach(k => {
      L.marker([k.lat, k.lng], { icon: kopdesIcon(L) })
        .bindPopup(kopdesPopup(k))
        .addTo(markersLayer);
    });
  }

  $effect(() => {
    // react to filter changes
    filterKategori; filterBayar; filterStok; search;
    renderMarkers();
  });

  onMount(async () => {
    const mod = await import('leaflet');
    L = mod.default;
    map = L.map(mapEl, { zoomControl: true }).setView([-7.715, 110.38], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    renderMarkers();
  });

  onDestroy(() => map?.remove());

  function toggleKategori(k) {
    filterKategori = filterKategori.includes(k)
      ? filterKategori.filter(x => x !== k)
      : [...filterKategori, k];
  }

  function toggleBayar(b) {
    filterBayar = filterBayar.includes(b)
      ? filterBayar.filter(x => x !== b)
      : [...filterBayar, b];
  }
</script>

<div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 56px)">
  <!-- Sidebar Filter -->
  <aside class="w-72 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
    <div class="p-4 border-b border-slate-100">
      <h2 class="font-semibold text-slate-800 mb-3">Filter Vendor</h2>
      <input
        type="search"
        placeholder="Cari nama / produk..."
        bind:value={search}
        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-700">Kategori</span>
        <button onclick={() => filterKategori = filterKategori.length ? [] : [...KATEGORI_LIST]}
          class="text-xs text-green-600 hover:underline">
          {filterKategori.length ? 'Hapus' : 'Semua'}
        </button>
      </div>
      <div class="space-y-1.5">
        {#each KATEGORI_LIST as k}
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filterKategori.includes(k)} onchange={() => toggleKategori(k)}
              class="rounded accent-green-600" />
            <span class="w-3 h-3 rounded-full shrink-0" style="background:{CAT_COLORS[k]}"></span>
            <span class="text-sm text-slate-700">{k}</span>
          </label>
        {/each}
      </div>
    </div>

    <div class="p-4 border-b border-slate-100">
      <div class="text-sm font-medium text-slate-700 mb-2">Metode Bayar</div>
      <div class="flex flex-wrap gap-2">
        {#each BAYAR_LIST as b}
          <button onclick={() => toggleBayar(b)}
            class="text-xs px-2.5 py-1 rounded-full border transition-colors {filterBayar.includes(b) ? 'bg-green-600 text-white border-green-600' : 'border-slate-300 text-slate-600 hover:border-green-400'}">
            {b}
          </button>
        {/each}
      </div>
    </div>

    <div class="p-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={filterStok} class="rounded accent-green-600" />
        <span class="text-sm text-slate-700">Hanya stok tersedia</span>
      </label>
    </div>

    <!-- Legend -->
    <div class="mt-auto p-4 bg-slate-50 border-t border-slate-200">
      <div class="text-xs font-medium text-slate-500 mb-2">LEGENDA</div>
      <div class="flex items-center gap-2 mb-1.5">
        <div class="w-4 h-4 bg-blue-800 rounded-sm border-2 border-white shadow-sm shrink-0"></div>
        <span class="text-xs text-slate-600">Koperasi Desa</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white shadow-sm shrink-0"></div>
        <span class="text-xs text-slate-600">Vendor / UMKM</span>
      </div>
    </div>
  </aside>

  <!-- Map -->
  <div bind:this={mapEl} class="flex-1"></div>
</div>
