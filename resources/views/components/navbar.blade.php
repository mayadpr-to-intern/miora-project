@props([
    'activePage' => 'home',
])

<header {{ $attributes->merge(['class' => 'sticky top-0 z-40 bg-miora-cream/90 backdrop-blur-md border-b border-miora-oat/80']) }}>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
            <!-- Brand Logo -->
            <a href="{{ route('home') }}" class="flex items-center gap-3 group focus:outline-none">
                <div class="w-10 h-10 rounded-2xl bg-miora-ivory border-2 border-miora-brown/30 shadow-xs flex items-center justify-center group-hover:border-miora-rose transition-colors">
                    <svg class="w-5 h-5 text-miora-brown group-hover:text-miora-rose transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <circle cx="12" cy="12" r="3.5" fill="#F2B8C6" />
                        <circle cx="17.5" cy="8.5" r="1" fill="currentColor" />
                    </svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl font-semibold tracking-[0.18em] text-miora-charcoal">MIORA</span>
                    <span class="text-[10px] tracking-wider uppercase text-miora-muted -mt-1 hidden sm:block">Digital Photobooth</span>
                </div>
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center gap-8" aria-label="Main Navigation">
                <a href="{{ route('home') }}"
                   class="text-sm font-medium transition-colors {{ $activePage === 'home' ? 'text-miora-brown font-semibold' : 'text-miora-muted hover:text-miora-charcoal' }}">
                    Home
                </a>
                <a href="{{ route('photobooth') }}"
                   class="text-sm font-medium transition-colors {{ in_array($activePage, ['photobooth', 'editor', 'result'], true) ? 'text-miora-brown font-semibold' : 'text-miora-muted hover:text-miora-charcoal' }}">
                    Photobooth
                </a>
                <a href="{{ route('home') }}#how-it-works"
                   class="text-sm font-medium text-miora-muted hover:text-miora-charcoal transition-colors">
                    How It Works
                </a>
                <a href="{{ route('home') }}#about"
                   class="text-sm font-medium text-miora-muted hover:text-miora-charcoal transition-colors">
                    About
                </a>
            </nav>

            <!-- Primary CTA Button -->
            <div class="hidden md:flex items-center gap-3">
                <a href="{{ route('photobooth') }}"
                   class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-miora-charcoal text-miora-ivory text-sm font-medium shadow-xs hover:bg-miora-brown transition-all duration-200 hover:-translate-y-0.5">
                    <span>Start Creating</span>
                    <svg class="w-4 h-4 text-miora-blush" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>

            <!-- Mobile Menu Button -->
            <button type="button"
                    id="miora-mobile-menu-btn"
                    class="md:hidden inline-flex items-center justify-center p-2.5 rounded-xl text-miora-charcoal hover:bg-miora-sand border border-miora-oat transition-colors"
                    aria-expanded="false"
                    aria-label="Toggle navigation menu">
                <svg class="w-6 h-6" id="miora-menu-icon-open" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <svg class="w-6 h-6 hidden" id="miora-menu-icon-close" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <div id="miora-mobile-menu" class="hidden md:hidden border-t border-miora-oat bg-miora-ivory px-4 pt-3 pb-6 space-y-2 shadow-lg">
        <a href="{{ route('home') }}" class="block px-4 py-2.5 rounded-xl text-base font-medium {{ $activePage === 'home' ? 'bg-miora-blush-soft text-miora-charcoal' : 'text-miora-muted hover:bg-miora-sand' }}">
            Home
        </a>
        <a href="{{ route('photobooth') }}" class="block px-4 py-2.5 rounded-xl text-base font-medium {{ $activePage === 'photobooth' ? 'bg-miora-blush-soft text-miora-charcoal' : 'text-miora-muted hover:bg-miora-sand' }}">
            Photobooth
        </a>
        <a href="{{ route('home') }}#how-it-works" class="block px-4 py-2.5 rounded-xl text-base font-medium text-miora-muted hover:bg-miora-sand">
            How It Works
        </a>
        <a href="{{ route('home') }}#about" class="block px-4 py-2.5 rounded-xl text-base font-medium text-miora-muted hover:bg-miora-sand">
            About
        </a>
        <div class="pt-2">
            <a href="{{ route('photobooth') }}" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-miora-charcoal text-miora-ivory text-sm font-medium shadow-xs">
                <span>Start Creating</span>
                <svg class="w-4 h-4 text-miora-blush" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
                </svg>
            </a>
        </div>
    </div>
</header>
