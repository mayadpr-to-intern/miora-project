<footer {{ $attributes->merge(['class' => 'bg-miora-sand/70 border-t border-miora-oat mt-auto']) }}>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <!-- Brand & Tagline -->
            <div class="space-y-2 max-w-sm">
                <a href="{{ route('home') }}" class="inline-flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-miora-ivory border border-miora-brown/30 flex items-center justify-center">
                        <span class="w-3 h-3 rounded-full bg-miora-blush border border-miora-charcoal"></span>
                    </span>
                    <span class="text-lg font-semibold tracking-[0.18em] text-miora-charcoal">MIORA</span>
                </a>
                <p class="text-sm font-serif italic text-miora-brown">“Little moments, forever yours.”</p>
                <p class="text-xs text-miora-muted leading-relaxed">
                    Digital photobooth studio crafted for spontaneous smiles, aesthetic camera filters, and keepsake photostrips.
                </p>
            </div>

            <!-- Navigation Links -->
            <div class="flex flex-wrap items-center gap-6 sm:gap-8 text-sm font-medium text-miora-muted">
                <a href="{{ route('home') }}" class="hover:text-miora-charcoal transition-colors">Home</a>
                <a href="{{ route('photobooth') }}" class="hover:text-miora-charcoal transition-colors">Photobooth</a>
                <a href="{{ route('home') }}#how-it-works" class="hover:text-miora-charcoal transition-colors">How It Works</a>
                <a href="{{ route('home') }}#about" class="hover:text-miora-charcoal transition-colors">About</a>
                <a href="https://instagram.com/vvygyy"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-miora-cream/80 hover:bg-miora-blush-soft border border-miora-oat hover:border-miora-rose text-xs text-miora-charcoal transition-all">
                    <svg class="w-3.5 h-3.5 text-miora-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                    <span>DM @vvygyy</span>
                </a>
            </div>
        </div>

        <div class="mt-8 pt-6 border-t border-miora-oat/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-miora-muted">
            <p>&copy; {{ date('Y') }} MIORA Digital Photobooth. All rights reserved.</p>
            <p class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>100% Private Browser Processing — Your photos stay on your device.</span>
            </p>
        </div>
    </div>
</footer>
