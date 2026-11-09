<x-layouts.app title="MIORA — Digital Photobooth | Little moments, forever yours." active-page="home">
    <!-- B. HERO SECTION -->
    <section class="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
        <!-- Soft decorative pastel background blobs -->
        <div class="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-miora-blush/25 blur-3xl"></div>
        <div class="pointer-events-none absolute top-32 -right-24 w-96 h-96 rounded-full bg-miora-blue/25 blur-3xl"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                <!-- Left Column: Editorial Copy & Primary CTA -->
                <div class="lg:col-span-6 space-y-6 text-center lg:text-left">
                    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-miora-ivory border border-miora-oat shadow-2xs">
                        <span class="w-2 h-2 rounded-full bg-miora-rose animate-pulse"></span>
                        <span class="text-xs font-medium tracking-wide text-miora-brown uppercase">Instant Web Photobooth Studio</span>
                    </div>

                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-miora-charcoal leading-[1.12]">
                        Little moments, <br class="hidden sm:inline" />
                        <span class="italic text-miora-brown">forever yours.</span>
                    </h1>

                    <p class="text-base sm:text-lg text-miora-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Step into <strong class="font-semibold text-miora-charcoal">MIORA</strong>—your personal digital photobooth. Play with 16+ live camera effects, strike a pose with your favorite people, dress your strip in aesthetic frames, and download keepsake memories in seconds.
                    </p>

                    <div class="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <a href="{{ route('photobooth') }}"
                           class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-miora-charcoal text-miora-ivory text-base font-medium shadow-md hover:bg-miora-brown transition-all duration-200 hover:-translate-y-0.5">
                            <svg class="w-5 h-5 text-miora-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                            </svg>
                            <span>Start Photobooth</span>
                        </a>

                        <a href="#how-it-works"
                           class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-miora-ivory text-miora-charcoal border border-miora-taupe text-base font-medium hover:bg-miora-sand transition-colors">
                            <span>How It Works</span>
                        </a>
                    </div>

                    <div class="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-miora-muted">
                        <span class="flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-miora-brown" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            No sign-up required
                        </span>
                        <span class="flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-miora-brown" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            16+ Live camera filters
                        </span>
                        <span class="flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-miora-brown" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            PNG, JPG & Animated GIF downloads
                        </span>
                    </div>
                </div>

                <!-- Right Column: Visual Photostrip Showcase -->
                <div class="lg:col-span-6 flex items-center justify-center relative py-6">
                    <div class="relative w-full max-w-md flex items-center justify-center gap-4 sm:gap-6">
                        <!-- Strip 1: Pastel Blush 3-Photo Strip -->
                        <div class="miora-float-left w-44 sm:w-52 rounded-2xl bg-[#FCEEF2] border-2 border-[#F2B8C6] p-3.5 shadow-xl">
                            <div class="flex items-center justify-between text-[10px] font-medium text-[#D97B93] mb-2">
                                <span>🎀 MIORA BOOTH</span>
                                <span>03.11.26</span>
                            </div>
                            <div class="space-y-2.5">
                                <!-- Illustrated Portrait Slot 1 -->
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#F9D8E2] to-[#E8B4C4] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-[#5C3A42]/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="38" cy="42" r="14" fill="#FFFDF9" />
                                        <circle cx="65" cy="45" r="13" fill="#FAF7F2" />
                                        <path d="M20 85 C20 65, 55 65, 55 85" fill="#D97B93" />
                                        <path d="M46 85 C46 67, 80 67, 80 85" fill="#8C6D58" />
                                        <text x="72" y="28" font-size="14">✨</text>
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-white/70 text-[9px] font-medium text-[#5C3A42]">Soft Pink</span>
                                </div>
                                <!-- Illustrated Portrait Slot 2 -->
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#FFE4B5] to-[#F3B391] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-[#5C3A42]/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="50" cy="40" r="16" fill="#FFFDF9" />
                                        <path d="M26 86 C26 64, 74 64, 74 86" fill="#8C6D58" />
                                        <text x="18" y="34" font-size="15">💗</text>
                                        <text x="70" y="38" font-size="14">✌️</text>
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-white/70 text-[9px] font-medium text-[#5C3A42]">Warm Sun</span>
                                </div>
                                <!-- Illustrated Portrait Slot 3 -->
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#E0F2FE] to-[#A7C7E7] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-[#2C4257]/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="40" cy="42" r="14" fill="#FFFDF9" />
                                        <circle cx="64" cy="42" r="14" fill="#FAF7F2" />
                                        <path d="M22 86 C22 65, 58 65, 58 86" fill="#5E92C4" />
                                        <path d="M44 86 C44 65, 80 65, 80 86" fill="#D97B93" />
                                        <text x="45" y="25" font-size="14">🍒</text>
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-white/70 text-[9px] font-medium text-[#2C4257]">Cool Breeze</span>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <p class="text-xs font-serif italic text-[#5C3A42]">besties forever ♡</p>
                                <p class="text-[9px] tracking-widest uppercase text-[#D97B93] mt-0.5">MIORA STUDIO</p>
                            </div>
                        </div>

                        <!-- Strip 2: Classic Noir Film Strip -->
                        <div class="miora-float-right w-44 sm:w-52 rounded-2xl bg-[#1E1B1A] border-2 border-[#3A3432] p-3.5 shadow-2xl mt-10">
                            <div class="flex items-center justify-between text-[10px] font-mono text-[#FBBF24] mb-2">
                                <span>▪ 35MM FILM</span>
                                <span>#04A</span>
                            </div>
                            <div class="space-y-2.5">
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#525252] to-[#262626] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-white/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="50" cy="40" r="16" fill="#E5E5E5" />
                                        <path d="M26 86 C26 64, 74 64, 74 86" fill="#A3A3A3" />
                                        <text x="68" y="30" font-size="14">⭐</text>
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#FAF7F2]">Film Grain</span>
                                </div>
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#D9B89C] to-[#8C6D58] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-white/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="38" cy="43" r="13" fill="#FAF7F2" />
                                        <circle cx="62" cy="43" r="13" fill="#F2ECE4" />
                                        <path d="M22 86 C22 66, 56 66, 56 86" fill="#3B2B20" />
                                        <path d="M46 86 C46 66, 78 66, 78 86" fill="#6E5443" />
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#FAF7F2]">Vintage 70s</span>
                                </div>
                                <div class="aspect-4/3 rounded-lg overflow-hidden bg-linear-to-br from-[#C4B5FD] to-[#F472B6] relative flex items-center justify-center">
                                    <svg class="w-20 h-20 text-white/80" viewBox="0 0 100 100" fill="none">
                                        <circle cx="50" cy="42" r="18" fill="#FFFDF9" />
                                        <path d="M26 86 C26 64, 74 64, 74 86" fill="#2B2625" />
                                        <text x="20" y="32" font-size="14">🦋</text>
                                    </svg>
                                    <span class="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-[#FAF7F2]">Fish Eye</span>
                                </div>
                            </div>
                            <div class="mt-3 text-center">
                                <p class="text-xs font-serif italic text-[#FAF7F2]">late night memories</p>
                                <p class="text-[9px] tracking-widest uppercase text-[#F2B8C6] mt-0.5">LITTLE MOMENTS</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- C. FEATURES SECTION -->
    <section id="features" class="py-20 bg-miora-ivory border-y border-miora-oat scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span class="text-xs font-semibold tracking-[0.2em] uppercase text-miora-brown">Why Everyone Loves MIORA</span>
                <h2 class="text-3xl sm:text-4xl font-serif text-miora-charcoal">Everything you need for the cutest photostrip</h2>
                <p class="text-sm sm:text-base text-miora-muted">
                    Inspired by the charm of self-photo studios and playful live webcam effects—designed to work effortlessly in your browser.
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <!-- Feature 1: Live Camera Filters -->
                <div class="p-6 rounded-2xl bg-miora-cream border border-miora-oat hover:border-miora-blush transition-all duration-200 flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-2xl bg-miora-blush-soft border border-miora-blush flex items-center justify-center text-xl">
                            ✨
                        </div>
                        <h3 class="text-lg font-semibold text-miora-charcoal">Live Camera Filters</h3>
                        <p class="text-sm text-miora-muted leading-relaxed">
                            Preview Warm Sun, Soft Pink, Vintage 70s, and Grayscale tones directly on your live webcam before taking a single shot.
                        </p>
                    </div>
                    <span class="mt-6 text-xs font-medium text-miora-brown">Real-time preview →</span>
                </div>

                <!-- Feature 2: Creative Photo Effects -->
                <div class="p-6 rounded-2xl bg-miora-cream border border-miora-oat hover:border-miora-blue transition-all duration-200 flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-2xl bg-miora-blue-soft border border-miora-blue flex items-center justify-center text-xl">
                            🌀
                        </div>
                        <h3 class="text-lg font-semibold text-miora-charcoal">Creative Photo Effects</h3>
                        <p class="text-sm text-miora-muted leading-relaxed">
                            Experiment with Film Grain, VHS Tape, Vintage 70s, Soft Pink, In Love, and Studio Glow effects.
                        </p>
                    </div>
                    <span class="mt-6 text-xs font-medium text-miora-sky">Curated studio lenses →</span>
                </div>

                <!-- Feature 3: Custom Photostrips -->
                <div class="p-6 rounded-2xl bg-miora-cream border border-miora-oat hover:border-miora-taupe transition-all duration-200 flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-2xl bg-miora-sand border border-miora-taupe flex items-center justify-center text-xl">
                            🎞️
                        </div>
                        <h3 class="text-lg font-semibold text-miora-charcoal">Custom Photostrips</h3>
                        <p class="text-sm text-miora-muted leading-relaxed">
                            Shoot a single Polaroid portrait, a 2, 3, or 4-photo vertical strip, or arrange your shots into a modern 2×2 grid collage.
                        </p>
                    </div>
                    <span class="mt-6 text-xs font-medium text-miora-brown">5 versatile layouts →</span>
                </div>

                <!-- Feature 4: Personalized Photo Frames -->
                <div class="p-6 rounded-2xl bg-miora-cream border border-miora-oat hover:border-miora-blush transition-all duration-200 flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-2xl bg-miora-blush-soft border border-miora-blush flex items-center justify-center text-xl">
                            🎀
                        </div>
                        <h3 class="text-lg font-semibold text-miora-charcoal">Personalized Frames</h3>
                        <p class="text-sm text-miora-muted leading-relaxed">
                            Pick from 8 curated frame categories, add cute stickers, write custom captions, and stamp the date in your favorite typography.
                        </p>
                    </div>
                    <span class="mt-6 text-xs font-medium text-miora-brown">Stickers & captions →</span>
                </div>

                <!-- Feature 5: Easy Photo Downloads -->
                <div class="p-6 rounded-2xl bg-miora-cream border border-miora-oat hover:border-miora-blue transition-all duration-200 flex flex-col justify-between">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-2xl bg-miora-blue-soft border border-miora-blue flex items-center justify-center text-xl">
                            📥
                        </div>
                        <h3 class="text-lg font-semibold text-miora-charcoal">Easy Photo Downloads</h3>
                        <p class="text-sm text-miora-muted leading-relaxed">
                            Save both your complete framed photostrip and your individual photos in crisp PNG, JPG, or looping Animated GIF.
                        </p>
                    </div>
                    <span class="mt-6 text-xs font-medium text-miora-sky">High-res export →</span>
                </div>
            </div>
        </div>
    </section>

    <!-- D. HOW IT WORKS SECTION -->
    <section id="how-it-works" class="py-20 bg-miora-sand/60 border-y border-miora-oat scroll-mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-2xl mx-auto mb-14 space-y-3">
                <span class="text-xs font-semibold tracking-[0.2em] uppercase text-miora-brown">Simple 3-Step Flow</span>
                <h2 class="text-3xl sm:text-4xl font-serif text-miora-charcoal">How MIORA Works</h2>
                <p class="text-sm sm:text-base text-miora-muted">
                    No complicated tools or accounts. Go from opening your camera to downloading your custom photostrip in under a minute.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Step 1 -->
                <div class="relative rounded-2xl bg-miora-ivory border border-miora-oat p-8 shadow-2xs">
                    <div class="w-11 h-11 rounded-2xl bg-miora-blush text-miora-charcoal font-serif font-semibold text-lg flex items-center justify-center mb-6">
                        1
                    </div>
                    <h3 class="text-xl font-semibold text-miora-charcoal mb-2">Choose Your Style</h3>
                    <p class="text-sm text-miora-muted leading-relaxed">
                        Pick Single Photo or Photostrip mode (2, 3, or 4 shots), set your countdown timer, and test live webcam effects from Soft Pink to Fish Eye.
                    </p>
                </div>

                <!-- Step 2 -->
                <div class="relative rounded-2xl bg-miora-ivory border border-miora-oat p-8 shadow-2xs">
                    <div class="w-11 h-11 rounded-2xl bg-miora-blue text-miora-charcoal font-serif font-semibold text-lg flex items-center justify-center mb-6">
                        2
                    </div>
                    <h3 class="text-xl font-semibold text-miora-charcoal mb-2">Capture Your Moments</h3>
                    <p class="text-sm text-miora-muted leading-relaxed">
                        Strike your poses as the visual countdown ticks down. Not happy with one shot? Retake just that single photo without redoing the whole strip.
                    </p>
                </div>

                <!-- Step 3 -->
                <div class="relative rounded-2xl bg-miora-ivory border border-miora-oat p-8 shadow-2xs">
                    <div class="w-11 h-11 rounded-2xl bg-miora-taupe text-miora-charcoal font-serif font-semibold text-lg flex items-center justify-center mb-6">
                        3
                    </div>
                    <h3 class="text-xl font-semibold text-miora-charcoal mb-2">Download Your Memories</h3>
                    <p class="text-sm text-miora-muted leading-relaxed">
                        Dress your strip with frames, stickers, and captions in the Editor, then download your finished Photostrip plus all individual photos in PNG, JPG, or Animated GIF.
                    </p>
                </div>
            </div>

            <div class="mt-12 text-center">
                <a href="{{ route('photobooth') }}"
                   class="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-miora-charcoal text-miora-ivory text-sm font-medium shadow-sm hover:bg-miora-brown transition-all">
                    <span>Start Photobooth Now</span>
                    <span>→</span>
                </a>
            </div>
        </div>
    </section>

    <!-- E. ABOUT MIORA SECTION -->
    <section id="about" class="py-20 scroll-mt-20">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="rounded-3xl bg-miora-ivory border border-miora-oat p-8 sm:p-12 lg:p-16 shadow-xs">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div class="lg:col-span-7 space-y-4">
                        <span class="text-xs font-semibold tracking-[0.2em] uppercase text-miora-brown">About MIORA</span>
                        <h2 class="text-3xl sm:text-4xl font-serif text-miora-charcoal leading-tight">
                            Crafted for spontaneous smiles and keepsake memories.
                        </h2>
                        <p class="text-sm sm:text-base text-miora-muted leading-relaxed">
                            <strong class="text-miora-charcoal">MIORA</strong> is an aesthetic digital photobooth designed to capture heartfelt, candid moments with friends and loved ones—anytime, anywhere, right from your web browser without needing a physical studio.
                        </p>
                        <p class="text-sm sm:text-base text-miora-muted leading-relaxed">
                            Inspired by the warmth of self-photo studios, MIORA blends live camera filters, customizable strip layouts, cute stickers, and curated frames into a joyful and seamless digital experience.
                        </p>

                        <!-- Creator Attribution & Privacy -->
                        <div class="pt-2 flex flex-wrap items-center gap-3">
                            <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-miora-blush-soft/70 border border-miora-blush text-xs text-miora-charcoal">
                                <span>✨</span>
                                <span>Created with love by <strong>Maya Dwi Putri Ramadhani</strong></span>
                            </div>
                            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-miora-sand border border-miora-oat text-xs text-miora-charcoal">
                                <span>🔒</span>
                                <span>100% Private in your browser</span>
                            </div>
                        </div>

                        <!-- Feedback & Instagram Contact Callout -->
                        <div class="pt-2">
                            <a href="https://instagram.com/vvygyy"
                               target="_blank"
                               rel="noopener noreferrer"
                               class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-miora-oat hover:border-miora-rose text-xs text-miora-charcoal shadow-2xs hover:shadow-xs transition-all duration-200 group">
                                <svg class="w-4 h-4 text-miora-rose group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                                </svg>
                                <span>Ada masukan atau kendala? Boleh langsung DM ke Instagram <strong class="underline decoration-miora-rose/50 group-hover:decoration-miora-rose font-semibold">@vvygyy</strong> 💌</span>
                            </a>
                        </div>
                    </div>

                    <div class="lg:col-span-5 bg-miora-cream rounded-2xl p-6 border border-miora-oat space-y-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-miora-blush-soft border border-miora-blush flex items-center justify-center font-serif font-bold text-miora-charcoal">
                                M
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-miora-charcoal">MIORA Studio Story</h3>
                                <p class="text-xs text-miora-muted">Little moments, forever yours.</p>
                            </div>
                        </div>
                        <ul class="space-y-2.5 text-xs sm:text-sm text-miora-charcoal">
                            <li class="flex items-center gap-2.5">
                                <span class="w-5 h-5 rounded-full bg-miora-blush/50 flex items-center justify-center text-[11px]">✓</span>
                                <span>Instant access with no sign-up or app download</span>
                            </li>
                            <li class="flex items-center gap-2.5">
                                <span class="w-5 h-5 rounded-full bg-miora-blue/50 flex items-center justify-center text-[11px]">✓</span>
                                <span>16+ Live camera filters & aesthetic photo effects</span>
                            </li>
                            <li class="flex items-center gap-2.5">
                                <span class="w-5 h-5 rounded-full bg-miora-taupe/60 flex items-center justify-center text-[11px]">✓</span>
                                <span>100% private in-browser capture, edit & download</span>
                            </li>
                            <li class="flex items-center gap-2.5">
                                <span class="w-5 h-5 rounded-full bg-miora-blush/60 flex items-center justify-center text-[11px]">💬</span>
                                <span>Masukan & kendala: DM <a href="https://instagram.com/vvygyy" target="_blank" rel="noopener noreferrer" class="font-semibold underline hover:text-miora-rose">@vvygyy</a></span>
                            </li>
                        </ul>
                        <div class="pt-2">
                            <a href="{{ route('photobooth') }}"
                               class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-miora-charcoal text-miora-ivory text-xs font-semibold hover:bg-miora-brown transition-colors">
                                Enter the Photobooth
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</x-layouts.app>

