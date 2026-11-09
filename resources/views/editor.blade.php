<x-layouts.app title="MIORA Photo Editor — Customize Your Photostrip" active-page="editor" :step="2">
    <div id="miora-editor-app"
         data-preselected-frame="{{ $preselectedFrame }}"
         data-photobooth-url="{{ route('photobooth') }}"
         data-result-url="{{ route('result') }}"
         class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <!-- Embedded Configuration Data for Editor Canvas Engine -->
        <script id="miora-editor-config" type="application/json">
            {!! json_encode([
                'frames' => $frames,
                'layouts' => $layouts,
                'stickers' => $stickers,
                'editorFilters' => $editorFilters,
                'fonts' => $fonts,
                'textColors' => $textColors,
            ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) !!}
        </script>

        <!-- Top Header & Action Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl sm:text-3xl font-serif text-miora-charcoal">Customize Your Photostrip</h1>
                <p class="text-sm text-miora-muted mt-0.5">
                    Pick a frame, adjust your layout, add cute stickers, or write a personal note.
                </p>
            </div>

            <!-- Undo, Reset, Back, and Continue Controls -->
            <div class="flex flex-wrap items-center gap-2.5">
                <a href="{{ route('photobooth') }}"
                   class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-ivory hover:bg-miora-sand text-miora-charcoal border border-miora-oat text-xs font-semibold transition-colors">
                    <span>← Back</span>
                </a>

                <button type="button"
                        id="btn-editor-undo"
                        disabled
                        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-ivory hover:bg-miora-sand text-miora-charcoal border border-miora-oat text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <span>↩ Undo</span>
                </button>

                <button type="button"
                        id="btn-editor-reset"
                        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-miora-ivory hover:bg-miora-blush-soft text-miora-brown border border-miora-oat text-xs font-semibold transition-colors cursor-pointer">
                    <span>Reset Editing</span>
                </button>

                <button type="button"
                        id="btn-editor-continue"
                        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-miora-charcoal hover:bg-miora-brown text-miora-ivory text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer">
                    <span>Continue to Result</span>
                    <span>→</span>
                </button>
            </div>
        </div>

        <!-- Empty Session Notice (If user navigated directly to /editor without taking photos) -->
        <div id="editor-empty-banner" class="hidden mb-6 p-4 rounded-2xl bg-miora-blush-soft border border-miora-blush flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🎞️</span>
                <div>
                    <p class="text-sm font-semibold text-miora-charcoal">Showing studio sample portraits so you can preview the Editor</p>
                    <p class="text-xs text-miora-muted">Want to use your own webcam photos? Head back to the Photobooth anytime.</p>
                </div>
            </div>
            <a href="{{ route('photobooth') }}" class="shrink-0 px-4 py-2 rounded-full bg-miora-charcoal text-miora-ivory text-xs font-semibold">
                Take My Own Photos
            </a>
        </div>

        <!-- Main Editor Workspace: Left Live Photostrip Canvas Preview (5 cols), Right Tabbed Controls (7 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            <!-- LEFT: Interactive Photostrip Canvas Stage -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center rounded-3xl bg-miora-sand/70 border border-miora-oat p-6 sm:p-8 shadow-inner lg:sticky lg:top-24">
                <div class="w-full flex items-center justify-between text-xs text-miora-muted mb-4">
                    <span class="font-medium">Live Strip Preview</span>
                    <span id="editor-canvas-hint" class="text-[11px] bg-miora-ivory px-2.5 py-1 rounded-full border border-miora-oat">
                        Drag stickers directly on strip
                    </span>
                </div>

                <!-- High-Res Photostrip Canvas Container -->
                <div class="relative flex items-center justify-center w-full overflow-hidden py-2">
                    <canvas id="editor-strip-canvas"
                            width="600"
                            height="1500"
                            class="max-h-[640px] w-auto max-w-full rounded-xl shadow-2xl transition-all duration-200 cursor-grab active:cursor-grabbing"></canvas>
                </div>

                <div class="mt-5 w-full pt-4 border-t border-miora-oat/80 flex items-center justify-between gap-3">
                    <div class="text-xs text-miora-muted">
                        Frame: <strong id="current-frame-label" class="text-miora-charcoal">Miora Signature Cream</strong>
                    </div>
                    <button type="button"
                            id="btn-editor-continue-bottom"
                            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-miora-charcoal hover:bg-miora-brown text-miora-ivory text-xs font-semibold shadow-sm transition-colors cursor-pointer">
                        <span>Continue to Result</span>
                        <span>→</span>
                    </button>
                </div>
            </div>

            <!-- RIGHT: Grouped Tabbed Editing Panel -->
            <div class="lg:col-span-7 rounded-3xl bg-miora-ivory border border-miora-oat p-5 sm:p-7 shadow-2xs space-y-6">
                <!-- Category Navigation Tabs (4 Clear Sections) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-miora-sand p-1.5 rounded-2xl" role="tablist">
                    <button type="button"
                            data-editor-tab="frames"
                            class="editor-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs">
                        <span>🖼️</span>
                        <span>Frames</span>
                    </button>
                    <button type="button"
                            data-editor-tab="layout"
                            class="editor-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        <span>📐</span>
                        <span>Layout</span>
                    </button>
                    <button type="button"
                            data-editor-tab="adjust"
                            class="editor-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        <span>🎚️</span>
                        <span>Photo Adjust</span>
                    </button>
                    <button type="button"
                            data-editor-tab="decorate"
                            class="editor-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal">
                        <span>🎀</span>
                        <span>Stickers & Text</span>
                    </button>
                </div>

                <!-- TAB 1: FRAME SELECTION -->
                <div id="editor-panel-frames" class="editor-tab-panel space-y-5">
                    <div>
                        <h2 class="text-base font-semibold text-miora-charcoal">Choose a Frame Style</h2>
                        <p class="text-xs text-miora-muted">Filter by mood or browse all {{ count($frames) }} handcrafted photobooth frames.</p>
                    </div>

                    <!-- Frame Category Filter Pills -->
                    <div class="flex items-center gap-2 overflow-x-auto miora-scroll pb-1.5">
                        @foreach ($frameCategories as $catKey => $catLabel)
                            <button type="button"
                                    data-editor-frame-cat="{{ $catKey }}"
                                    class="editor-frame-cat-btn shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer {{ $catKey === 'all' ? 'bg-miora-charcoal text-miora-ivory' : 'bg-miora-cream text-miora-muted border border-miora-oat hover:border-miora-brown' }}">
                                {{ $catLabel }}
                            </button>
                        @endforeach
                    </div>

                    <!-- Frame Cards Grid (Full Photostrip Preview) -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto miora-scroll pr-1" id="editor-frames-grid">
                        @foreach ($frames as $frame)
                            <button type="button"
                                    data-frame-id="{{ $frame['id'] }}"
                                    data-frame-category="{{ $frame['category'] }}"
                                    class="editor-frame-card group rounded-2xl p-2.5 sm:p-3 border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-between {{ $loop->first ? 'border-miora-charcoal bg-miora-blush-soft/40 shadow-xs' : 'border-miora-oat bg-miora-cream hover:border-miora-taupe' }}">
                                <!-- Full Miniature Photostrip Canvas Preview -->
                                <div class="w-full flex items-center justify-center py-1">
                                    <canvas class="editor-frame-thumbnail w-auto h-[210px] sm:h-[235px] rounded-lg shadow-md transition-transform duration-200 group-hover:scale-[1.02] pointer-events-none"
                                            data-frame-id="{{ $frame['id'] }}"
                                            width="{{ ($frame['default_layout'] ?? '') === 'grid-4' ? 960 : 560 }}"
                                            height="{{ ($frame['default_layout'] ?? '') === 'grid-4' ? 920 : (($frame['default_layout'] ?? '') === 'strip-2' ? 1020 : (($frame['default_layout'] ?? '') === 'strip-3' ? 1380 : 1740)) }}"></canvas>
                                </div>
                                <div class="w-full mt-2.5 text-center">
                                    <p class="text-xs font-semibold text-miora-charcoal truncate">{{ $frame['name'] }}</p>
                                    <p class="text-[10px] text-miora-muted capitalize mt-0.5">{{ $frame['category'] }}</p>
                                </div>
                            </button>
                        @endforeach

                        <!-- Empty State when a category has no frames -->
                        <div id="editor-frames-empty" class="hidden col-span-2 sm:col-span-3 py-14 flex flex-col items-center justify-center text-center px-4">
                            <div class="w-14 h-14 rounded-2xl bg-miora-sand/60 border border-miora-oat flex items-center justify-center text-2xl mb-3 shadow-2xs">
                                🖼️
                            </div>
                            <p class="text-sm font-semibold text-miora-charcoal">No Frames in This Category</p>
                            <p class="text-xs text-miora-muted mt-1 max-w-xs">Try selecting a different category or click "All" to browse all available frames.</p>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: LAYOUT SELECTION -->
                <div id="editor-panel-layout" class="editor-tab-panel hidden space-y-5">
                    <div>
                        <h2 class="text-base font-semibold text-miora-charcoal">Select Photostrip Layout</h2>
                        <p class="text-xs text-miora-muted">Switch between a single Polaroid frame, vertical strips, or a 2×2 grid collage.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        @foreach ($layouts as $layout)
                            <button type="button"
                                    data-layout-id="{{ $layout['id'] }}"
                                    class="editor-layout-card flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer {{ $layout['id'] === 'strip-4' ? 'border-miora-charcoal bg-miora-blush-soft/40' : 'border-miora-oat bg-miora-cream hover:border-miora-taupe' }}">
                                <!-- Mini Layout Icon -->
                                <div class="w-12 h-16 rounded-lg bg-miora-ivory border border-miora-taupe p-1.5 shrink-0 flex flex-col justify-center gap-1">
                                    @if ($layout['id'] === 'single')
                                        <div class="w-full h-9 rounded-xs bg-miora-blush"></div>
                                    @elseif ($layout['id'] === 'strip-2')
                                        <div class="w-full h-5 rounded-xs bg-miora-blush"></div>
                                        <div class="w-full h-5 rounded-xs bg-miora-blue"></div>
                                    @elseif ($layout['id'] === 'strip-3')
                                        <div class="w-full h-3.5 rounded-xs bg-miora-blush"></div>
                                        <div class="w-full h-3.5 rounded-xs bg-miora-blue"></div>
                                        <div class="w-full h-3.5 rounded-xs bg-miora-taupe"></div>
                                    @elseif ($layout['id'] === 'strip-4')
                                        <div class="w-full h-2.5 rounded-xs bg-miora-blush"></div>
                                        <div class="w-full h-2.5 rounded-xs bg-miora-blue"></div>
                                        <div class="w-full h-2.5 rounded-xs bg-miora-taupe"></div>
                                        <div class="w-full h-2.5 rounded-xs bg-miora-blush"></div>
                                    @else
                                        <div class="grid grid-cols-2 gap-1 h-10">
                                            <div class="rounded-xs bg-miora-blush"></div>
                                            <div class="rounded-xs bg-miora-blue"></div>
                                            <div class="rounded-xs bg-miora-taupe"></div>
                                            <div class="rounded-xs bg-miora-blush"></div>
                                        </div>
                                    @endif
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-semibold text-miora-charcoal">{{ $layout['name'] }}</span>
                                        <span class="px-2 py-0.5 rounded-full bg-miora-sand text-[10px] font-semibold text-miora-brown">{{ $layout['badge'] }}</span>
                                    </div>
                                    <p class="text-xs text-miora-muted mt-1">{{ $layout['description'] }}</p>
                                </div>
                            </button>
                        @endforeach
                    </div>
                </div>

                <!-- TAB 3: PHOTO CUSTOMIZATION (CROP, POSITION, BRIGHTNESS, CONTRAST, FILTER) -->
                <div id="editor-panel-adjust" class="editor-tab-panel hidden space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 class="text-base font-semibold text-miora-charcoal">Adjust Photos & Tone</h2>
                            <p class="text-xs text-miora-muted">Fine-tune crop, framing position, brightness, contrast, and extra color filters.</p>
                        </div>

                        <!-- Target Photo Selector (Apply to All or Specific Photo Slot) -->
                        <div class="flex items-center gap-1.5">
                            <label for="adjust-photo-target" class="text-xs font-medium text-miora-muted">Target:</label>
                            <select id="adjust-photo-target" class="rounded-xl bg-miora-cream border border-miora-oat px-3 py-1.5 text-xs font-semibold text-miora-charcoal focus:outline-none">
                                <option value="all">All Photos</option>
                                <option value="0">Photo #1</option>
                                <option value="1">Photo #2</option>
                                <option value="2">Photo #3</option>
                                <option value="3">Photo #4</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-miora-cream border border-miora-oat">
                        <!-- Crop / Zoom Scale -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs">
                                <label for="editor-zoom-slider" class="font-medium text-miora-charcoal">Crop / Zoom</label>
                                <span id="editor-zoom-val" class="font-semibold text-miora-brown">100%</span>
                            </div>
                            <input type="range" id="editor-zoom-slider" min="100" max="200" value="100" class="miora-slider w-full" />
                        </div>

                        <!-- Horizontal Position (Pan X) -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs">
                                <label for="editor-panx-slider" class="font-medium text-miora-charcoal">Horizontal Position (X)</label>
                                <span id="editor-panx-val" class="font-semibold text-miora-brown">0</span>
                            </div>
                            <input type="range" id="editor-panx-slider" min="-100" max="100" value="0" class="miora-slider w-full" />
                        </div>

                        <!-- Vertical Position (Pan Y) -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs">
                                <label for="editor-pany-slider" class="font-medium text-miora-charcoal">Vertical Position (Y)</label>
                                <span id="editor-pany-val" class="font-semibold text-miora-brown">0</span>
                            </div>
                            <input type="range" id="editor-pany-slider" min="-100" max="100" value="0" class="miora-slider w-full" />
                        </div>

                        <!-- Brightness -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs">
                                <label for="editor-brightness-slider" class="font-medium text-miora-charcoal">Brightness</label>
                                <span id="editor-brightness-val" class="font-semibold text-miora-brown">0</span>
                            </div>
                            <input type="range" id="editor-brightness-slider" min="-50" max="50" value="0" class="miora-slider w-full" />
                        </div>

                        <!-- Contrast -->
                        <div class="space-y-1.5 sm:col-span-2">
                            <div class="flex justify-between text-xs">
                                <label for="editor-contrast-slider" class="font-medium text-miora-charcoal">Contrast</label>
                                <span id="editor-contrast-val" class="font-semibold text-miora-brown">0</span>
                            </div>
                            <input type="range" id="editor-contrast-slider" min="-50" max="50" value="0" class="miora-slider w-full" />
                        </div>
                    </div>

                    <!-- Post-Capture Additional Filter -->
                    <div class="space-y-2.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-miora-brown">Additional Photo Filter</label>
                        <div class="flex flex-wrap gap-2">
                            @foreach ($editorFilters as $ef)
                                <button type="button"
                                        data-post-filter="{{ $ef['id'] }}"
                                        class="editor-post-filter-btn px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer {{ $ef['id'] === 'none' ? 'bg-miora-charcoal text-miora-ivory border-miora-charcoal' : 'bg-miora-cream text-miora-charcoal border-miora-oat hover:border-miora-brown' }}">
                                    {{ $ef['name'] }}
                                </button>
                            @endforeach
                        </div>
                    </div>
                </div>

                <!-- TAB 4: STICKERS, CAPTION & DATE STAMP -->
                <div id="editor-panel-decorate" class="editor-tab-panel hidden space-y-6">
                    <!-- Stickers Section -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-base font-semibold text-miora-charcoal">Add Cute Stickers</h2>
                                <p class="text-xs text-miora-muted">Click any sticker to place it on your strip, then drag it anywhere on the preview.</p>
                            </div>
                            <button type="button"
                                    id="btn-clear-stickers"
                                    class="px-3 py-1.5 rounded-xl bg-miora-sand hover:bg-miora-oat text-xs font-medium text-miora-charcoal cursor-pointer">
                                Clear Stickers
                            </button>
                        </div>

                        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                            @foreach ($stickers as $sticker)
                                <button type="button"
                                        data-sticker-id="{{ $sticker['id'] }}"
                                        data-sticker-symbol="{{ $sticker['symbol'] }}"
                                        class="editor-sticker-btn flex flex-col items-center justify-center p-2.5 rounded-2xl bg-miora-cream hover:bg-miora-blush-soft border border-miora-oat hover:border-miora-blush transition-all cursor-pointer">
                                    <span class="text-2xl">{{ $sticker['symbol'] }}</span>
                                    <span class="text-[10px] font-medium text-miora-muted mt-1 truncate max-w-full">{{ $sticker['label'] }}</span>
                                </button>
                            @endforeach
                        </div>
                    </div>

                    <!-- Caption & Date Stamp Section -->
                    <div class="pt-4 border-t border-miora-oat space-y-4">
                        <h3 class="text-base font-semibold text-miora-charcoal">Caption & Date Stamp</h3>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2 space-y-1.5">
                                <label for="editor-caption-input" class="block text-xs font-medium text-miora-charcoal">Custom Strip Caption</label>
                                <input type="text"
                                       id="editor-caption-input"
                                       maxlength="42"
                                       value="Little moments, forever yours."
                                       placeholder="Write a sweet memory or caption..."
                                       class="w-full rounded-xl bg-miora-cream border border-miora-oat px-4 py-2.5 text-sm text-miora-charcoal focus:outline-none focus:border-miora-brown" />
                            </div>

                            <!-- Date Stamp Toggle & Format -->
                            <div class="space-y-1.5">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="editor-date-toggle" checked class="rounded text-miora-brown focus:ring-0" />
                                    <span class="text-xs font-medium text-miora-charcoal">Show Date Stamp</span>
                                </label>
                                <select id="editor-date-format" class="w-full rounded-xl bg-miora-cream border border-miora-oat px-3 py-2 text-xs text-miora-charcoal">
                                    <option value="classic">{{ strtoupper(date('M d, Y')) }}</option>
                                    <option value="dots">{{ date('d.m.Y') }}</option>
                                    <option value="iso">{{ date('Y / m / d') }}</option>
                                </select>
                            </div>

                            <!-- Font Style Selector -->
                            <div class="space-y-1.5">
                                <label for="editor-font-select" class="block text-xs font-medium text-miora-charcoal">Text Font Style</label>
                                <select id="editor-font-select" class="w-full rounded-xl bg-miora-cream border border-miora-oat px-3 py-2 text-xs text-miora-charcoal">
                                    @foreach ($fonts as $font)
                                        <option value="{{ $font['id'] }}" {{ $font['id'] === 'serif' ? 'selected' : '' }}>
                                            {{ $font['name'] }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <!-- Text Color Presets -->
                        <div class="space-y-2">
                            <span class="block text-xs font-medium text-miora-charcoal">Caption Color</span>
                            <div class="flex flex-wrap items-center gap-2.5">
                                @foreach ($textColors as $tc)
                                    <button type="button"
                                            data-text-color="{{ $tc['hex'] }}"
                                            class="editor-textcolor-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer {{ $tc['id'] === 'auto' ? 'border-miora-charcoal bg-miora-blush-soft/50' : 'border-miora-oat bg-miora-cream' }}">
                                        @if ($tc['hex'] !== 'auto')
                                            <span class="w-3 h-3 rounded-full border border-black/20" style="background-color: {{ $tc['hex'] }};"></span>
                                        @endif
                                        <span>{{ $tc['name'] }}</span>
                                    </button>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-layouts.app>

