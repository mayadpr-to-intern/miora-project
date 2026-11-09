<x-layouts.app title="MIORA Result & Download — Your Photos Are Ready!" active-page="result" :step="3">
    <div id="miora-result-app"
         data-photobooth-url="{{ route('photobooth') }}"
         data-editor-url="{{ route('editor') }}"
         class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        <!-- Embedded Configuration Data for Result Re-rendering -->
        <script id="miora-result-config" type="application/json">
            {!! json_encode([
                'frames' => $frames,
                'layouts' => $layouts,
                'stickers' => $stickers,
                'editorFilters' => $editorFilters,
                'fonts' => $fonts,
            ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) !!}
        </script>

        <!-- Top Celebration Headline & Action Buttons -->
        <div class="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-miora-blush-soft border border-miora-blush text-xs font-semibold text-miora-brown">
                <span>🎉 Session Complete</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-serif text-miora-charcoal">Your photos are ready!</h1>
            <p class="text-sm sm:text-base text-miora-muted max-w-xl mx-auto">
                Choose how you want to save your memories. Save your framed Photostrip and individual portraits in Still formats (PNG/JPG) or Animated (GIF) Live Photos.
            </p>

            <!-- Quick Navigation Bar: Download All Group, Edit Again, Retake, Create Another -->
            <div class="pt-3 flex flex-wrap items-center justify-center gap-2.5">
                <div class="inline-flex p-1 rounded-full bg-miora-sand border border-miora-oat shadow-xs">
                    <button type="button"
                            id="btn-download-all-png"
                            class="px-4 py-2 rounded-full bg-miora-charcoal hover:bg-miora-brown text-miora-ivory text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-miora-blush" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                        <span>Download All (PNG)</span>
                    </button>
                    <button type="button"
                            id="btn-download-all-jpg"
                            class="px-3.5 py-2 rounded-full hover:bg-miora-ivory text-miora-charcoal text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1">
                        <span>All (JPG)</span>
                    </button>
                    <button type="button"
                            id="btn-download-all-gif"
                            class="px-3.5 py-2 rounded-full bg-gradient-to-r from-red-50 to-miora-blush-soft hover:opacity-90 text-red-950 border border-red-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span>All (GIF)</span>
                        <span class="text-[10px] uppercase font-normal text-red-700">Live</span>
                    </button>
                </div>

                <a href="{{ route('editor') }}"
                   class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-ivory hover:bg-miora-sand text-miora-charcoal border border-miora-taupe text-xs sm:text-sm font-semibold transition-colors">
                    <span>✏️ Edit Again</span>
                </a>
                <a href="{{ route('photobooth') }}"
                   class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-ivory hover:bg-miora-sand text-miora-charcoal border border-miora-taupe text-xs sm:text-sm font-semibold transition-colors">
                    <span>📷 Retake</span>
                </a>
                <button type="button"
                        id="btn-create-another"
                        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-blush/50 hover:bg-miora-blush text-miora-charcoal border border-miora-rose/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer">
                    <span>✨ Create Another</span>
                </button>
            </div>
        </div>

        <!-- Download Toast Notification -->
        <div id="download-status-toast" class="hidden fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-miora-charcoal text-miora-ivory text-xs sm:text-sm font-medium shadow-2xl border border-miora-blush flex items-center gap-2.5 animate-bounce-subtle">
            <span class="text-base" id="download-toast-icon">✅</span>
            <span id="download-toast-text">Your download has started!</span>
        </div>

        <!-- TWO MAIN DOWNLOAD SECTIONS: 1. Photostrip (Left 5 cols) & 2. Individual Photos (Right 7 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            <!-- SECTION B: PHOTOSTRIP DOWNLOAD & LIVE PREVIEW -->
            <div class="lg:col-span-5 rounded-3xl bg-miora-ivory border border-miora-oat p-6 sm:p-8 shadow-xs space-y-6">
                <div class="flex items-center justify-between border-b border-miora-oat pb-4">
                    <div>
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-miora-brown">Format 1</span>
                        <h2 class="text-xl sm:text-2xl font-serif text-miora-charcoal">Framed Photostrip</h2>
                        <p class="text-xs text-miora-muted mt-0.5">Complete strip with your frame, stickers, caption & date.</p>
                    </div>
                    <span class="w-10 h-10 rounded-2xl bg-miora-blush-soft border border-miora-blush flex items-center justify-center text-lg">
                        🎞️
                    </span>
                </div>

                <!-- Photostrip Mode Switcher: Still vs Live Photo -->
                <div class="flex items-center justify-center">
                    <div class="inline-flex p-1 rounded-2xl bg-miora-sand border border-miora-oat w-full max-w-xs" role="tablist">
                        <button type="button"
                                id="tab-strip-still"
                                class="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs">
                            📷 Still Photostrip
                        </button>
                        <button type="button"
                                id="tab-strip-gif"
                                class="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal inline-flex items-center justify-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span>Live Photo</span>
                        </button>
                    </div>
                </div>

                <!-- Photostrip Preview Stage -->
                <div class="rounded-2xl bg-miora-sand/70 border border-miora-oat p-5 sm:p-6 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
                    <!-- Live Badge overlay when Live mode is on -->
                    <div id="result-strip-live-badge" class="hidden absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-white tracking-widest uppercase shadow-md">
                        <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span>LIVE PHOTO</span>
                    </div>

                    <!-- Still Canvas Preview -->
                    <canvas id="result-strip-canvas" width="600" height="1500" class="max-h-[520px] w-auto max-w-full rounded-xl shadow-xl transition-all duration-300"></canvas>

                    <!-- Animated Live Photo Preview -->
                    <div id="result-strip-gif-wrapper" class="hidden flex flex-col items-center justify-center w-full">
                        <img id="result-strip-gif-img" class="max-h-[520px] w-auto max-w-full rounded-xl shadow-xl object-contain cursor-pointer" alt="Animated Live Framed Photostrip" title="Click to replay Live Photo" />
                    </div>

                    <!-- Live Photo Generating Spinner / Progress Overlay -->
                    <div id="result-strip-gif-spinner" class="hidden absolute inset-0 bg-miora-ivory/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
                        <div class="w-10 h-10 border-3 border-miora-oat border-t-miora-charcoal rounded-full animate-spin"></div>
                        <div>
                            <p class="text-sm font-semibold text-miora-charcoal">Generating Live Photostrip...</p>
                            <p class="text-xs text-miora-muted mt-0.5">Encoding real camera motions inside your frame</p>
                        </div>
                    </div>
                </div>

                <!-- Photostrip Download Actions -->
                <div class="space-y-2.5 pt-1">
                    <!-- Primary Live Photo GIF Download -->
                    <button type="button"
                            id="btn-download-strip-gif"
                            class="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-miora-charcoal to-miora-brown hover:opacity-95 text-miora-ivory text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer">
                        <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                        <span>Download Animated Photostrip (GIF)</span>
                        <span class="px-2 py-0.5 rounded-full bg-white/15 text-[10px] text-miora-blush font-normal">Live Motion</span>
                    </button>

                    <!-- Still Formats (PNG / JPG) -->
                    <div class="grid grid-cols-2 gap-2.5">
                        <button type="button"
                                id="btn-download-strip-png"
                                class="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-miora-sand hover:bg-miora-oat text-miora-charcoal border border-miora-oat text-xs font-semibold transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-miora-brown" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                            <span>Download Photostrip (PNG)</span>
                        </button>
                        <button type="button"
                                id="btn-download-strip-jpg"
                                class="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-miora-sand hover:bg-miora-oat text-miora-charcoal border border-miora-oat text-xs font-semibold transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-miora-brown" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                            <span>Download (JPG)</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- SECTION A: INDIVIDUAL PHOTOS DOWNLOAD & LIVE PREVIEW -->
            <div class="lg:col-span-7 rounded-3xl bg-miora-ivory border border-miora-oat p-6 sm:p-8 shadow-xs space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-miora-oat pb-4">
                    <div>
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-miora-sky">Format 2</span>
                        <h2 class="text-xl sm:text-2xl font-serif text-miora-charcoal">Individual Photos</h2>
                        <p class="text-xs text-miora-muted mt-0.5">
                            Every single shot with your camera filter, edits & authentic Live Photo video motion.
                        </p>
                    </div>

                    <!-- Global Mode Switcher for Individual Photos -->
                    <div class="inline-flex p-1 rounded-2xl bg-miora-sand border border-miora-oat shrink-0" role="tablist">
                        <button type="button"
                                id="tab-all-photos-still"
                                class="py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs">
                            📷 Still Photos
                        </button>
                        <button type="button"
                                id="tab-all-photos-gif"
                                class="py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal inline-flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span>Live Photos</span>
                        </button>
                    </div>
                </div>

                <!-- Grid of Individual Photos with Per-Photo Previews and Live Photo Download Options -->
                <div id="individual-photos-container" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <!-- Populated dynamically by Result JS module -->
                </div>
            </div>
        </div>
    </div>
</x-layouts.app>
