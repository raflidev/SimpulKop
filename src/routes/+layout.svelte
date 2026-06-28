<script>
  import '../app.css';
  import { page } from '$app/stores';

  const NAV = [
    { href: '/', label: 'Peta Vendor' },
    { href: '/klaster', label: 'Klaster & Rute' },
    { href: '/chat', label: 'Chat AI' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/manajemen', label: 'Manajemen' }
  ];
</script>

<div class="min-h-screen flex flex-col bg-slate-50">
  <header class="bg-green-700 text-white shadow-md sticky top-0 z-50">
    <nav class="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
      <a href="/" class="font-bold text-lg tracking-tight flex items-center gap-2 mr-4">
        <span class="text-xl">🗺</span> SimpulKop
      </a>
      {#each NAV as n}
        <a
          href={n.href}
          class="text-sm font-medium transition-colors hover:text-green-200 {$page.url.pathname === n.href ? 'text-white border-b-2 border-white pb-0.5' : 'text-green-100'}"
        >{n.label}</a>
      {/each}
      <div class="ml-auto text-xs text-green-300 hidden sm:block">Sleman, DIY · Demo MVP</div>
    </nav>
  </header>

  <main class="flex-1 flex flex-col">
    <slot />
  </main>
</div>
