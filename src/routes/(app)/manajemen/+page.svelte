<script>
  import { vendors, kopdes } from '$lib/store.js';
  import { CAT_COLORS } from '$lib/data.js';

  let tab = $state('vendor');
  let search = $state('');
  let modal = $state(null); // { mode:'add'|'edit', type:'vendor'|'kopdes', data:{} }

  const KATEGORI = Object.keys(CAT_COLORS);
  const JENIS = ['Distributor', 'Petani/Poktan', 'Grosir', 'Produsen', 'UMKM'];
  const BAYAR = ['Tunai', 'Transfer', 'Tempo', 'QRIS'];
  const KEC = ['Ngaglik', 'Mlati', 'Depok'];

  const emptyVendor = () => ({
    nama: '', kategori: KATEGORI[0], jenis: JENIS[0],
    desa: '', kecamatan: KEC[0], alamat: '',
    lat: -7.71, lng: 110.38, kontak: '', produk: '',
    kapasitas: '', minOrder: '', metodeBayar: ['Tunai'],
    rating: 4.5, jam: '08.00-17.00', catatan: '', stok: 'tersedia'
  });

  const emptyKopdes = () => ({
    nama: '', desa: '', kecamatan: KEC[0], alamat: '',
    lat: -7.71, lng: 110.38, anggota: 0, gudang: false,
    kebutuhan: '', kontak: '', catatan: ''
  });

  function nextId(list, prefix, pad) {
    const max = list.reduce((m, item) => {
      const n = parseInt(item.id.replace(prefix + '-', ''));
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `${prefix}-${String(max + 1).padStart(pad, '0')}`;
  }

  function openAdd() {
    search = '';
    modal = { mode: 'add', type: tab, data: tab === 'vendor' ? emptyVendor() : emptyKopdes() };
  }

  function openEdit(item) {
    const data = { ...item };
    if (data.metodeBayar) data.metodeBayar = [...data.metodeBayar];
    modal = { mode: 'edit', type: tab, data };
  }

  function save() {
    const d = modal.data;
    if (modal.type === 'vendor') {
      vendors.update(list => {
        if (modal.mode === 'add') return [...list, { ...d, id: nextId(list, 'VND', 3) }];
        return list.map(v => v.id === d.id ? { ...d } : v);
      });
    } else {
      kopdes.update(list => {
        if (modal.mode === 'add') return [...list, { ...d, id: nextId(list, 'KOP', 2) }];
        return list.map(k => k.id === d.id ? { ...d } : k);
      });
    }
    modal = null;
  }

  function del(id) {
    if (!confirm('Hapus data ini?')) return;
    if (tab === 'vendor') vendors.update(l => l.filter(v => v.id !== id));
    else kopdes.update(l => l.filter(k => k.id !== id));
  }

  function toggleBayar(m) {
    const mb = modal.data.metodeBayar;
    modal.data.metodeBayar = mb.includes(m) ? mb.filter(x => x !== m) : [...mb, m];
  }

  let filteredVendors = $derived(
    $vendors.filter(v => !search ||
      v.nama.toLowerCase().includes(search.toLowerCase()) ||
      v.kategori.toLowerCase().includes(search.toLowerCase()) ||
      v.desa.toLowerCase().includes(search.toLowerCase())
    )
  );

  let filteredKopdes = $derived(
    $kopdes.filter(k => !search ||
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.desa.toLowerCase().includes(search.toLowerCase())
    )
  );
</script>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-4">
  <div>
    <h1 class="text-2xl font-bold text-slate-800">Manajemen Data</h1>
    <p class="text-slate-500 text-sm mt-1">Kelola data Vendor/UMKM dan Koperasi Desa</p>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
    <button
      onclick={() => { tab = 'vendor'; search = ''; }}
      class="px-4 py-2 rounded-md text-sm font-medium transition-all {tab === 'vendor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}"
    >
      Vendor/UMKM ({$vendors.length})
    </button>
    <button
      onclick={() => { tab = 'kopdes'; search = ''; }}
      class="px-4 py-2 rounded-md text-sm font-medium transition-all {tab === 'kopdes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}"
    >
      Koperasi Desa ({$kopdes.length})
    </button>
  </div>

  <!-- Controls -->
  <div class="flex gap-3 items-center">
    <input
      type="text"
      bind:value={search}
      placeholder={tab === 'vendor' ? 'Cari nama, kategori, desa...' : 'Cari nama, desa...'}
      class="flex-1 max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    <button
      onclick={openAdd}
      class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
    >
      + Tambah {tab === 'vendor' ? 'Vendor' : 'Koperasi'}
    </button>
  </div>

  <!-- Vendor Table -->
  {#if tab === 'vendor'}
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nama</th>
            <th class="px-4 py-3 text-left">Kategori</th>
            <th class="px-4 py-3 text-left">Jenis</th>
            <th class="px-4 py-3 text-left">Desa / Kec.</th>
            <th class="px-4 py-3 text-center">Rating</th>
            <th class="px-4 py-3 text-center">Stok</th>
            <th class="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredVendors as v (v.id)}
          <tr class="border-t border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-400 text-xs font-mono">{v.id}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{v.nama}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs text-white" style="background:{CAT_COLORS[v.kategori]||'#9CA3AF'}">{v.kategori}</span>
            </td>
            <td class="px-4 py-3 text-slate-600">{v.jenis}</td>
            <td class="px-4 py-3 text-slate-600">{v.desa}, {v.kecamatan}</td>
            <td class="px-4 py-3 text-center text-amber-500 font-medium">{v.rating}★</td>
            <td class="px-4 py-3 text-center">
              <span class="px-2 py-0.5 rounded-full text-xs {v.stok === 'tersedia' ? 'bg-green-100 text-green-700' : v.stok === 'terbatas' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">{v.stok}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button onclick={() => openEdit(v)} class="text-blue-500 hover:text-blue-700 mr-3 text-xs font-medium">Edit</button>
              <button onclick={() => del(v.id)} class="text-red-400 hover:text-red-600 text-xs font-medium">Hapus</button>
            </td>
          </tr>
          {/each}
          {#if filteredVendors.length === 0}
          <tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">Tidak ada data</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
  {/if}

  <!-- Kopdes Table -->
  {#if tab === 'kopdes'}
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nama</th>
            <th class="px-4 py-3 text-left">Desa / Kec.</th>
            <th class="px-4 py-3 text-center">Anggota</th>
            <th class="px-4 py-3 text-center">Gudang</th>
            <th class="px-4 py-3 text-left">Kebutuhan</th>
            <th class="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredKopdes as k (k.id)}
          <tr class="border-t border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-400 text-xs font-mono">{k.id}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{k.nama}</td>
            <td class="px-4 py-3 text-slate-600">{k.desa}, {k.kecamatan}</td>
            <td class="px-4 py-3 text-center font-medium">{k.anggota.toLocaleString('id-ID')}</td>
            <td class="px-4 py-3 text-center text-slate-500">{k.gudang ? '✓' : '—'}</td>
            <td class="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{k.kebutuhan}</td>
            <td class="px-4 py-3 text-right">
              <button onclick={() => openEdit(k)} class="text-blue-500 hover:text-blue-700 mr-3 text-xs font-medium">Edit</button>
              <button onclick={() => del(k.id)} class="text-red-400 hover:text-red-600 text-xs font-medium">Hapus</button>
            </td>
          </tr>
          {/each}
          {#if filteredKopdes.length === 0}
          <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Tidak ada data</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
  {/if}
</div>

<!-- Modal -->
{#if modal}
<div
  class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  onclick={(e) => e.target === e.currentTarget && (modal = null)}
  role="dialog"
  aria-modal="true"
>
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <h2 class="font-semibold text-slate-800">
        {modal.mode === 'add' ? 'Tambah' : 'Edit'} {modal.type === 'vendor' ? 'Vendor/UMKM' : 'Koperasi Desa'}
      </h2>
      <button onclick={() => modal = null} class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
    </div>

    <div class="overflow-y-auto p-6">
      {#if modal.type === 'vendor'}
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="lbl">Nama Vendor</label>
          <input bind:value={modal.data.nama} class="inp" placeholder="UD Sumber Rejeki" />
        </div>
        <div>
          <label class="lbl">Kategori</label>
          <select bind:value={modal.data.kategori} class="inp">
            {#each KATEGORI as k}<option>{k}</option>{/each}
          </select>
        </div>
        <div>
          <label class="lbl">Jenis</label>
          <select bind:value={modal.data.jenis} class="inp">
            {#each JENIS as j}<option>{j}</option>{/each}
          </select>
        </div>
        <div>
          <label class="lbl">Desa</label>
          <input bind:value={modal.data.desa} class="inp" placeholder="Sardonoharjo" />
        </div>
        <div>
          <label class="lbl">Kecamatan</label>
          <select bind:value={modal.data.kecamatan} class="inp">
            {#each KEC as kc}<option>{kc}</option>{/each}
          </select>
        </div>
        <div class="col-span-2">
          <label class="lbl">Alamat</label>
          <input bind:value={modal.data.alamat} class="inp" placeholder="Jl. Kaliurang KM 12 No. 8" />
        </div>
        <div>
          <label class="lbl">Kontak (HP)</label>
          <input bind:value={modal.data.kontak} class="inp" placeholder="0812-xxxx-xxxx" />
        </div>
        <div>
          <label class="lbl">Jam Operasional</label>
          <input bind:value={modal.data.jam} class="inp" placeholder="07.00-17.00" />
        </div>
        <div class="col-span-2">
          <label class="lbl">Produk</label>
          <input bind:value={modal.data.produk} class="inp" placeholder="Beras, gula, minyak goreng" />
        </div>
        <div>
          <label class="lbl">Kapasitas</label>
          <input bind:value={modal.data.kapasitas} class="inp" placeholder="18 ton/bln" />
        </div>
        <div>
          <label class="lbl">Min. Order</label>
          <input bind:value={modal.data.minOrder} class="inp" placeholder="5 karung" />
        </div>
        <div>
          <label class="lbl">Rating (0–5)</label>
          <input type="number" bind:value={modal.data.rating} min="0" max="5" step="0.1" class="inp" />
        </div>
        <div>
          <label class="lbl">Stok</label>
          <select bind:value={modal.data.stok} class="inp">
            <option value="tersedia">Tersedia</option>
            <option value="terbatas">Terbatas</option>
            <option value="habis">Habis</option>
          </select>
        </div>
        <div>
          <label class="lbl">Latitude</label>
          <input type="number" bind:value={modal.data.lat} step="0.0001" class="inp" />
        </div>
        <div>
          <label class="lbl">Longitude</label>
          <input type="number" bind:value={modal.data.lng} step="0.0001" class="inp" />
        </div>
        <div class="col-span-2">
          <label class="lbl">Metode Bayar</label>
          <div class="flex gap-4 flex-wrap mt-1">
            {#each BAYAR as m}
            <label class="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" checked={modal.data.metodeBayar.includes(m)} onchange={() => toggleBayar(m)} />
              {m}
            </label>
            {/each}
          </div>
        </div>
        <div class="col-span-2">
          <label class="lbl">Catatan</label>
          <textarea bind:value={modal.data.catatan} class="inp resize-none" rows="2" placeholder="Info tambahan..."></textarea>
        </div>
      </div>

      {:else}
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="lbl">Nama Koperasi</label>
          <input bind:value={modal.data.nama} class="inp" placeholder="Kopdes Merah Putih ..." />
        </div>
        <div>
          <label class="lbl">Desa</label>
          <input bind:value={modal.data.desa} class="inp" placeholder="Sardonoharjo" />
        </div>
        <div>
          <label class="lbl">Kecamatan</label>
          <select bind:value={modal.data.kecamatan} class="inp">
            {#each KEC as kc}<option>{kc}</option>{/each}
          </select>
        </div>
        <div class="col-span-2">
          <label class="lbl">Alamat</label>
          <input bind:value={modal.data.alamat} class="inp" placeholder="Balai Desa ..." />
        </div>
        <div>
          <label class="lbl">Kontak (HP)</label>
          <input bind:value={modal.data.kontak} class="inp" placeholder="0812-xxxx-xxxx" />
        </div>
        <div>
          <label class="lbl">Jumlah Anggota</label>
          <input type="number" bind:value={modal.data.anggota} min="0" class="inp" />
        </div>
        <div>
          <label class="lbl">Latitude</label>
          <input type="number" bind:value={modal.data.lat} step="0.0001" class="inp" />
        </div>
        <div>
          <label class="lbl">Longitude</label>
          <input type="number" bind:value={modal.data.lng} step="0.0001" class="inp" />
        </div>
        <div class="col-span-2">
          <label class="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input type="checkbox" bind:checked={modal.data.gudang} />
            Punya Gudang
          </label>
        </div>
        <div class="col-span-2">
          <label class="lbl">Kebutuhan Utama</label>
          <input bind:value={modal.data.kebutuhan} class="inp" placeholder="Sembako, pupuk, pakan ternak" />
        </div>
        <div class="col-span-2">
          <label class="lbl">Catatan</label>
          <textarea bind:value={modal.data.catatan} class="inp resize-none" rows="2" placeholder="Info tambahan..."></textarea>
        </div>
      </div>
      {/if}
    </div>

    <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
      <button onclick={() => modal = null} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Batal</button>
      <button onclick={save} class="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Simpan</button>
    </div>
  </div>
</div>
{/if}

<style>
  .lbl { display: block; font-size: 0.75rem; font-weight: 500; color: #475569; margin-bottom: 0.25rem; }
  .inp { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; background: white; }
  .inp:focus { outline: none; box-shadow: 0 0 0 2px #16a34a40; border-color: #16a34a; }
</style>
