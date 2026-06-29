<script>
  let messages = $state([
    { role: 'assistant', content: 'Halo! Saya asisten pengadaan SimpulKop 🗺\n\nTanyakan soal vendor, harga, stok, metode bayar, atau lokasi pemasok di Sleman.' }
  ]);
  let input = $state('');
  let loading = $state(false);
  let chatEl = $state(null);

  const EXAMPLES = [
    'Vendor beras terdekat dari Kopdes Sardonoharjo yang bisa bayar tempo?',
    'Siapa vendor sembako dengan rating tertinggi?',
    'Vendor pupuk di Kecamatan Ngaglik?',
    'Bandingkan CV Berkah Protein dengan Peternakan Telur Donoharjo',
    'Vendor UMKM makanan olahan yang menerima QRIS?'
  ];

  async function send(text = input.trim()) {
    if (!text || loading) return;
    messages = [...messages, { role: 'user', content: text }];
    input = '';
    loading = true;

    // Build API messages: skip initial greeting (role=assistant), keep conversation history
    const apiMsgs = messages
      .slice(1) // drop initial greeting
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs })
      });
      const data = await res.json();
      messages = [...messages, { role: 'assistant', content: data.reply }];
    } catch {
      messages = [...messages, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }];
    }

    loading = false;
    setTimeout(() => chatEl?.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' }), 50);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }
</script>

<div class="flex flex-col flex-1">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 px-6 py-3">
    <h1 class="font-semibold text-slate-800">Asisten AI SimpulKop</h1>
    <p class="text-xs text-slate-500 mt-0.5">Tanya soal vendor, stok, harga, dan rute pengadaan</p>
  </div>

  <!-- Example questions -->
  <div class="bg-green-50 border-b border-green-100 px-6 py-3 flex gap-2 flex-wrap">
    <span class="text-xs text-green-700 font-medium mr-1 self-center">Contoh:</span>
    {#each EXAMPLES as ex}
      <button onclick={() => send(ex)}
        class="text-xs bg-white border border-green-200 text-green-800 px-3 py-1 rounded-full hover:bg-green-100 transition-colors">
        {ex}
      </button>
    {/each}
  </div>

  <!-- Messages -->
  <div bind:this={chatEl} class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    {#each messages as msg}
      <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
        {#if msg.role === 'assistant'}
          <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm shrink-0 mr-2 mt-1">🗺</div>
        {/if}
        <div class="max-w-xl {msg.role === 'user'
          ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm'
          : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'} px-4 py-3 text-sm shadow-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    {/each}

    {#if loading}
      <div class="flex justify-start">
        <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm shrink-0 mr-2">🗺</div>
        <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div class="flex gap-1 items-center h-5">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:0ms"></div>
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:150ms"></div>
            <div class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:300ms"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input -->
  <div class="bg-white border-t border-slate-200 px-6 py-4">
    <div class="flex gap-3 max-w-3xl mx-auto">
      <textarea
        bind:value={input}
        onkeydown={onKey}
        placeholder="Tanya soal vendor, stok, atau rute pengadaan..."
        rows="1"
        class="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      ></textarea>
      <button
        onclick={() => send()}
        disabled={!input.trim() || loading}
        class="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shrink-0">
        Kirim
      </button>
    </div>
    <p class="text-xs text-center text-slate-400 mt-2">Jawaban berdasarkan data 30 vendor & 8 kopdes di Sleman</p>
  </div>
</div>
