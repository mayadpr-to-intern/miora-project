<x-layouts.app title="MIORA Photobooth — Capture Your Moments" active-page="photobooth" :step="1">
    <div id="miora-photobooth-app"
         data-preselected-frame="{{ $preselectedFrame }}"
         data-preselected-mode="{{ $preselectedMode }}"
         data-editor-url="{{ route('editor') }}"
         class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <!-- Top Header & Friendly Instruction -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl sm:text-3xl font-serif text-miora-charcoal">MIORA Photobooth Studio</h1>
                <p id="booth-instruction-text" class="text-sm text-miora-muted mt-0.5">
                    Allow camera access to start taking photos, then choose your favorite effect.
                </p>
            </div>

            <!-- Capture Mode & Countdown Controls Bar -->
            <div class="flex flex-wrap items-center gap-3 bg-miora-ivory p-2 rounded-2xl border border-miora-oat shadow-2xs">
                <!-- Capture Mode Toggle: Single Photo vs Photostrip -->
                <div class="flex items-center bg-miora-sand rounded-xl p-1" role="group" aria-label="Capture Mode">
                    <button type="button"
                            data-capture-mode="single"
                            class="booth-mode-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        Single Photo
                    </button>
                    <button type="button"
                            data-capture-mode="photostrip"
                            class="booth-mode-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-miora-charcoal text-miora-ivory shadow-2xs">
                        Photostrip
                    </button>
                </div>

                <!-- Photostrip Count Selector (2, 3, 4 Photos) -->
                <div id="strip-count-group" class="flex items-center gap-1 bg-miora-sand rounded-xl p-1">
                    <button type="button" data-photo-count="2" class="booth-count-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        2 Photos
                    </button>
                    <button type="button" data-photo-count="3" class="booth-count-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        3 Photos
                    </button>
                    <button type="button" data-photo-count="4" class="booth-count-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs">
                        4 Photos
                    </button>
                </div>

                <!-- Countdown Selector (3s, 5s, 10s) -->
                <div class="flex items-center gap-1.5 pl-1 pr-2">
                    <span class="text-xs text-miora-muted font-medium">Timer:</span>
                    <div class="flex items-center bg-miora-sand rounded-xl p-1">
                        <button type="button" data-countdown="3" class="booth-timer-btn px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs">
                            3s
                        </button>
                        <button type="button" data-countdown="5" class="booth-timer-btn px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer text-miora-muted hover:text-miora-charcoal">
                            5s
                        </button>
                        <button type="button" data-countdown="10" class="booth-timer-btn px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer text-miora-muted hover:text-miora-charcoal">
                            10s
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Studio Grid: Left/Center Camera & Filters (8 cols), Right Captured Photos Tray (4 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <!-- LEFT / CENTER: Live Camera Stage + Live Filters -->
            <div class="lg:col-span-8 space-y-4">
                <!-- External Camera Toolbar (Placed cleanly outside the camera frame) -->
                <div class="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-miora-ivory border border-miora-oat shadow-2xs">
                    <!-- Left Group: Active Filter Pill -->
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-miora-cream border border-miora-oat text-miora-charcoal text-xs font-medium">
                            <span class="w-2 h-2 rounded-full bg-miora-rose"></span>
                            <span id="active-filter-badge">Effect: Original</span>
                        </div>
                    </div>

                    <!-- Right Group: Studio Camera Controls (Clear Lens, Ring Light, Mirror, Fullscreen) -->
                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button"
                                id="btn-macbook-isp"
                                title="Toggle Studio HD Lens Enhancement (Auto Shadow Lift & Natural Skin Tone)"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-blush-soft text-miora-charcoal border border-miora-blush text-xs font-semibold transition-all cursor-pointer">
                            <span>✨</span>
                            <span id="macbook-isp-label">Clear Lens: ON</span>
                        </button>

                        <button type="button"
                                id="btn-studio-light"
                                title="Toggle Front Screen Ring Light for Low-Light Rooms"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-cream hover:bg-miora-sand text-miora-charcoal border border-miora-oat text-xs font-medium transition-colors cursor-pointer">
                            <span>💡</span>
                            <span id="studio-light-label">Ring Light</span>
                        </button>

                        <button type="button"
                                id="btn-mirror-camera"
                                title="Mirror / Flip Camera Horizontally"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-cream hover:bg-miora-sand text-miora-charcoal border border-miora-oat text-xs font-medium transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-miora-brown" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                            <span id="mirror-status-label">Mirrored</span>
                        </button>

                        <button type="button"
                                id="btn-fullscreen-camera"
                                title="Toggle Fullscreen Camera Preview"
                                class="p-1.5 rounded-xl bg-miora-cream hover:bg-miora-sand text-miora-charcoal border border-miora-oat transition-colors cursor-pointer">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Camera Stage Card (Clean & Unobstructed) -->
                <div id="camera-stage-container" class="relative rounded-3xl bg-miora-charcoal overflow-hidden shadow-lg border-4 border-miora-ivory aspect-4/3 flex items-center justify-center">
                    <!-- Hidden raw video element fed into our real-time WebGL/2D Canvas processor -->
                    <video id="booth-video" class="hidden" playsinline autoplay muted></video>

                    <!-- Real-time Filtered & Distorted Output Canvas (Full HD 4:3 Studio Resolution) -->
                    <canvas id="booth-canvas" width="1440" height="1080" class="w-full h-full object-cover"></canvas>

                    <!-- Studio Ring Light Border Glow Overlay -->
                    <div id="studio-ringlight-overlay" class="hidden pointer-events-none absolute inset-0 z-15 rounded-2xl border-[14px] border-[#FFFDF9]/85 shadow-[inset_0_0_80px_rgba(255,248,240,0.65)] transition-opacity duration-300"></div>

                    <!-- Capture Progress Pill (e.g., Photo 1 of 4) -->
                    <div id="capture-progress-banner" class="hidden absolute top-5 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-miora-charcoal/90 border border-miora-blush text-miora-ivory text-xs font-semibold tracking-wide shadow-md">
                        Photo 1 of 4
                    </div>

                    <!-- Visual Countdown Overlay -->
                    <div id="countdown-overlay" class="hidden absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] pointer-events-none">
                        <span id="countdown-number" class="text-7xl sm:text-9xl font-serif font-bold text-miora-ivory drop-shadow-lg scale-100 transition-transform">
                            3
                        </span>
                        <p id="countdown-message" class="mt-3 px-4 py-1.5 rounded-full bg-black/60 text-miora-ivory text-xs sm:text-sm font-medium">
                            Get ready! Your photo will be taken soon.
                        </p>
                    </div>

                    <!-- White Shutter Flash Layer -->
                    <div id="shutter-flash-overlay" class="hidden absolute inset-0 z-40 bg-white pointer-events-none"></div>

                    <!-- Camera Permission / Unavailable Guidance Overlay -->
                    <div id="camera-permission-overlay" class="absolute inset-0 z-25 bg-miora-charcoal/95 flex flex-col items-center justify-center p-6 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-miora-blush/20 border border-miora-blush/40 flex items-center justify-center text-3xl mb-4">
                            📷
                        </div>
                        <h2 id="camera-overlay-title" class="text-xl font-serif text-miora-ivory mb-2">
                            Allow camera access to start taking photos.
                        </h2>
                        <p id="camera-overlay-desc" class="text-xs sm:text-sm text-miora-oat/80 max-w-md mb-6 leading-relaxed">
                            Click the button below and select <strong>“Allow”</strong> when your browser asks for webcam permission. Your camera feed stays 100% private in your browser.
                        </p>
                        <div class="flex flex-wrap items-center justify-center gap-3">
                            <button type="button"
                                    id="btn-request-camera"
                                    class="px-6 py-3 rounded-full bg-miora-blush text-miora-charcoal text-sm font-semibold shadow-md hover:bg-miora-ivory transition-colors cursor-pointer">
                                Enable Webcam Access
                            </button>
                            <button type="button"
                                    id="btn-use-demo-camera"
                                    class="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-miora-ivory border border-white/20 text-xs font-medium transition-colors cursor-pointer">
                                Use Virtual Studio Camera (No Webcam Needed)
                            </button>
                        </div>
                        <div id="camera-help-box" class="hidden mt-5 p-4 rounded-2xl bg-white/5 border border-white/15 text-left max-w-md text-xs text-miora-oat space-y-1.5">
                            <p class="font-semibold text-miora-blush">Camera Troubleshooting Guide:</p>
                            <p>1. Click the lock or camera icon in your browser’s address bar and set Camera to <strong>Allow</strong>.</p>
                            <p>2. Make sure no other app (Zoom, Teams, OBS) is locking your webcam.</p>
                            <p>3. Or click <strong>Use Virtual Studio Camera</strong> above to test all filters, countdowns, and photostrips right away!</p>
                        </div>
                    </div>

                    <!-- Bottom Shutter Action Bar Inside Stage -->
                    <div class="absolute bottom-4 inset-x-4 flex items-center justify-center z-20">
                        <button type="button"
                                id="btn-capture-shutter"
                                class="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-miora-ivory text-miora-charcoal font-semibold text-sm sm:text-base shadow-xl border-2 border-miora-blush hover:bg-miora-blush transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="w-4 h-4 rounded-full bg-miora-rose group-hover:bg-miora-charcoal transition-colors"></span>
                            <span id="shutter-btn-label">Take 4-Photo Strip</span>
                        </button>
                    </div>
                </div>

                <!-- B. LIVE CAMERA FILTERS PANEL -->
                <div class="rounded-3xl bg-miora-ivory border border-miora-oat p-5 shadow-2xs space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-base font-semibold text-miora-charcoal flex items-center gap-2">
                            <span>Choose Your Favorite Effect</span>
                            <span class="text-xs font-normal text-miora-muted">(Live Preview)</span>
                        </h2>
                    </div>

                    <!-- Filter Category Tabs -->
                    <div class="flex items-center gap-2 overflow-x-auto miora-scroll pb-1.5" id="booth-filter-categories">
                        @foreach ($filterCategories as $catKey => $catName)
                            <button type="button"
                                    data-filter-cat="{{ $catKey }}"
                                    class="booth-filter-cat-btn shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer {{ $catKey === 'all' ? 'bg-miora-charcoal text-miora-ivory' : 'bg-miora-cream text-miora-muted border border-miora-oat hover:border-miora-brown' }}">
                                {{ $catName }}
                            </button>
                        @endforeach
                    </div>

                    <!-- Horizontal Scrollable Filter Thumbnails -->
                    <div class="flex items-center gap-3 overflow-x-auto miora-scroll pb-2 pt-1" id="booth-filters-list">
                        @foreach ($filters as $filter)
                            <button type="button"
                                    data-filter-id="{{ $filter['id'] }}"
                                    data-filter-name="{{ $filter['name'] }}"
                                    data-filter-category="{{ $filter['category'] }}"
                                    class="booth-filter-btn group shrink-0 w-28 rounded-2xl p-2 border-2 transition-all text-left cursor-pointer {{ $filter['id'] === 'original' ? 'border-miora-charcoal bg-miora-blush-soft/60 shadow-2xs' : 'border-miora-oat bg-miora-cream hover:border-miora-taupe' }}">
                                <div class="w-full aspect-4/3 rounded-xl mb-2 relative overflow-hidden bg-miora-charcoal border border-black/10 shadow-2xs">
                                    <canvas width="160"
                                            height="120"
                                            data-thumb-filter="{{ $filter['id'] }}"
                                            class="filter-thumb-canvas w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"></canvas>
                                    <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[8px] font-semibold text-miora-ivory tracking-wide">
                                        {{ $filter['badge'] }}
                                    </span>
                                </div>
                                <p class="text-xs font-semibold text-miora-charcoal truncate">{{ $filter['name'] }}</p>
                                <p class="text-[10px] text-miora-muted capitalize">{{ $filter['category'] }}</p>
                            </button>
                        @endforeach
                    </div>
                </div>
            </div>

            <!-- RIGHT: SESSION PHOTO PREVIEW & RETAKE TRAY -->
            <div class="lg:col-span-4 rounded-3xl bg-miora-ivory border border-miora-oat p-5 sm:p-6 shadow-2xs space-y-5 sticky top-24">
                <div class="flex items-center justify-between border-b border-miora-oat pb-3">
                    <div>
                        <h2 class="text-lg font-serif text-miora-charcoal">Session Tray</h2>
                        <p id="tray-status-subtitle" class="text-xs text-miora-muted">
                            0 of 4 photos captured
                        </p>
                    </div>
                    <span id="session-mode-pill" class="px-3 py-1 rounded-full bg-miora-blush-soft text-miora-brown text-xs font-semibold">
                        4-Photo Strip
                    </span>
                </div>

                <!-- Dynamic Slots Grid -->
                <div id="captured-photos-grid" class="grid grid-cols-2 gap-3">
                    <!-- Populated dynamically by photobooth JS -->
                </div>

                <!-- Helpful Retake Tip -->
                <div class="p-3.5 rounded-2xl bg-miora-cream border border-miora-oat text-xs text-miora-muted leading-relaxed">
                    💡 <strong class="text-miora-charcoal">Tip:</strong> Not happy with just one pose? Click <strong>Retake</strong> on any individual photo card above without redoing your whole session.
                </div>

                <!-- Primary & Secondary Session Actions -->
                <div class="space-y-2.5 pt-1">
                    <button type="button"
                            id="btn-continue-editor"
                            disabled
                            class="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-miora-charcoal text-miora-ivory text-sm font-semibold shadow-md hover:bg-miora-brown transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        <span>Continue to Photo Editor</span>
                        <svg class="w-4 h-4 text-miora-blush" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
                        </svg>
                    </button>

                    <button type="button"
                            id="btn-retake-all"
                            disabled
                            class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-miora-cream hover:bg-miora-sand text-miora-charcoal border border-miora-taupe text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        <span>Retake Entire Session</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Lightbox Modal for Inspecting a Single Captured Photo -->
        <div id="photo-inspect-modal" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-miora-ivory rounded-3xl max-w-lg w-full p-5 border border-miora-oat shadow-2xl space-y-4">
                <div class="flex items-center justify-between">
                    <h3 id="inspect-modal-title" class="text-base font-semibold text-miora-charcoal">Photo Preview</h3>
                    <button type="button" id="btn-close-inspect" class="p-1.5 rounded-full hover:bg-miora-sand text-miora-muted cursor-pointer">
                        ✕
                    </button>
                </div>
                <div class="rounded-2xl overflow-hidden bg-miora-charcoal aspect-4/3">
                    <img id="inspect-modal-img" src="" alt="Captured photo preview" class="w-full h-full object-contain" />
                </div>
                <div class="flex items-center justify-end gap-3">
                    <button type="button" id="btn-inspect-retake" class="px-4 py-2 rounded-full bg-miora-blush text-miora-charcoal text-xs font-semibold cursor-pointer">
                        Retake This Photo
                    </button>
                    <button type="button" id="btn-inspect-done" class="px-4 py-2 rounded-full bg-miora-charcoal text-miora-ivory text-xs font-semibold cursor-pointer">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</x-layouts.app>

