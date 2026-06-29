<script>
  import '../../app.css';
  import { page } from '$app/stores';

  const NAV = [
    { href: '/peta',       icon: '🗺',  label: 'Peta Vendor' },
    { href: '/klaster',    icon: '🔗',  label: 'Klaster & Rute' },
    { href: '/chat',       icon: '💬',  label: 'Chat AI' },
    { href: '/dashboard',  icon: '📊',  label: 'Dashboard' },
    { href: '/manajemen',  icon: '⚙️',  label: 'Manajemen' },
  ];

  let open = $state(false);
  let collapsed = $state(false);
</script>

<div class="flex h-screen overflow-hidden bg-slate-50">
  <!-- Mobile overlay -->
  {#if open}
    <button
      class="fixed inset-0 z-20 bg-black/40 lg:hidden"
      onclick={() => open = false}
      aria-label="Tutup sidebar"
    ></button>
  {/if}

  <!-- Sidebar -->
  <aside class="
    fixed lg:static inset-y-0 left-0 z-30 shrink-0
    flex flex-col bg-white border-r border-slate-200 shadow-sm
    transition-all duration-200
    {collapsed ? 'w-16' : 'w-60'}
    {open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  ">
    <!-- Logo + collapse toggle -->
    <div class="h-14 flex items-center border-b border-slate-200 shrink-0 overflow-hidden
      {collapsed ? 'justify-center px-0' : 'px-4'}">
      <span class="text-xl shrink-0">🗺</span>
      {#if !collapsed}
        <span class="font-bold text-slate-800 tracking-tight whitespace-nowrap ml-2 flex-1">SimpulKop</span>
        <button
          onclick={() => collapsed = true}
          class="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Perkecil sidebar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
        </button>
      {:else}
        <button
          onclick={() => collapsed = false}
          class="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-1"
          aria-label="Perluas sidebar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2">
      {#each NAV as n}
        <a
          href={n.href}
          onclick={() => open = false}
          title={collapsed ? n.label : undefined}
          class="flex items-center rounded-lg mb-0.5 text-sm font-medium transition-colors overflow-hidden
            {collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'}
            {$page.url.pathname === n.href
              ? 'bg-green-50 text-green-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}"
        >
          <span class="text-base shrink-0 {collapsed ? '' : 'w-5 text-center'}">{n.icon}</span>
          {#if !collapsed}
            <span class="whitespace-nowrap">{n.label}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Footer + collapse toggle -->
    <div class="border-t border-slate-200 shrink-0">
      {#if !collapsed}
        <div class="px-5 pt-3 pb-1">
          <div class="text-xs text-slate-400">Sleman, DIY</div>
          <span class="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Demo MVP</span>
        </div>
      {/if}
    </div>
  </aside>

  <!-- Main area -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Mobile top bar -->
    <header class="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">
      <button
        onclick={() => open = !open}
        class="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <span class="font-semibold text-slate-800">
        {NAV.find(n => n.href === $page.url.pathname)?.label ?? 'SimpulKop'}
      </span>
    </header>

    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>
  </div>
</div>
