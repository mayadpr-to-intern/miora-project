/**
 * MIORA Photo Editor Page Controller Module
 */

import { findStickerIndexAtPoint, renderPhotostripToCanvas } from './renderer';
import { generateSamplePhotos, getDefaultEditorState, loadSession, saveSession } from './storage';

export function initEditorPage() {
    const root = document.getElementById('miora-editor-app');
    if (!root) {
        return;
    }

    const configEl = document.getElementById('miora-editor-config');
    const catalog = configEl ? JSON.parse(configEl.textContent) : {};
    const preselectedFrame = root.dataset.preselectedFrame || '';
    const resultUrl = root.dataset.resultUrl || '/result';

    const stripCanvas = document.getElementById('editor-strip-canvas');
    const emptyBanner = document.getElementById('editor-empty-banner');
    const currentFrameLabel = document.getElementById('current-frame-label');

    const btnUndo = document.getElementById('btn-editor-undo');
    const btnReset = document.getElementById('btn-editor-reset');
    const btnContinue = document.getElementById('btn-editor-continue');
    const btnContinueBottom = document.getElementById('btn-editor-continue-bottom');

    // Adjustment Controls
    const adjustTargetSelect = document.getElementById('adjust-photo-target');
    const zoomSlider = document.getElementById('editor-zoom-slider');
    const zoomVal = document.getElementById('editor-zoom-val');
    const panXSlider = document.getElementById('editor-panx-slider');
    const panXVal = document.getElementById('editor-panx-val');
    const panYSlider = document.getElementById('editor-pany-slider');
    const panYVal = document.getElementById('editor-pany-val');
    const brightnessSlider = document.getElementById('editor-brightness-slider');
    const brightnessVal = document.getElementById('editor-brightness-val');
    const contrastSlider = document.getElementById('editor-contrast-slider');
    const contrastVal = document.getElementById('editor-contrast-val');

    // Decorate Controls
    const btnClearStickers = document.getElementById('btn-clear-stickers');
    const captionInput = document.getElementById('editor-caption-input');
    const dateToggle = document.getElementById('editor-date-toggle');
    const dateFormatSelect = document.getElementById('editor-date-format');
    const fontSelect = document.getElementById('editor-font-select');

    // Frame Categories and Cards
    const frameCatButtons = document.querySelectorAll('.editor-frame-cat-btn');
    const frameCards = document.querySelectorAll('.editor-frame-card');
    let currentFrameCategory = 'all';

    function applyFrameCategoryFilter() {
        frameCatButtons.forEach((b) => {
            const active = b.dataset.editorFrameCat === currentFrameCategory;
            b.classList.toggle('bg-miora-charcoal', active);
            b.classList.toggle('text-miora-ivory', active);
            b.classList.toggle('bg-miora-cream', !active);
            b.classList.toggle('text-miora-muted', !active);
            b.classList.toggle('border', !active);
            b.classList.toggle('border-miora-oat', !active);
            b.classList.toggle('hover:border-miora-brown', !active);
        });

        let visibleCount = 0;
        frameCards.forEach((card) => {
            const show = currentFrameCategory === 'all' || card.dataset.frameCategory === currentFrameCategory;
            card.classList.toggle('hidden', !show);
            if (show) visibleCount++;
        });

        const emptyEl = document.getElementById('editor-frames-empty');
        if (emptyEl) {
            emptyEl.classList.toggle('hidden', visibleCount > 0);
        }
    }

    let sessionData = null;
    let editorState = getDefaultEditorState(4, preselectedFrame || 'classic-cream');
    let loadedImages = [];
    const undoStack = [];
    let draggingStickerIdx = -1;

    function cloneState(st) {
        return JSON.parse(JSON.stringify(st));
    }

    function pushUndoSnapshot() {
        undoStack.push(cloneState(editorState));
        if (undoStack.length > 25) {
            undoStack.shift();
        }
        if (btnUndo) {
            btnUndo.disabled = undoStack.length === 0;
        }
    }

    async function persistEditorState() {
        if (!sessionData) {
            return;
        }
        sessionData.editorState = cloneState(editorState);
        await saveSession(sessionData);
    }

    function loadHtmlImages(photos) {
        return Promise.all(
            photos.map(
                (p) =>
                    new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = () => resolve(null);
                        img.src = p.dataUrl;
                    })
            )
        );
    }

    function renderPreview() {
        if (!stripCanvas) {
            return;
        }
        renderPhotostripToCanvas(stripCanvas, loadedImages.filter(Boolean), editorState, catalog);

        const activeFrame = (catalog.frames || []).find((f) => f.id === editorState.frameId);
        if (activeFrame && currentFrameLabel) {
            currentFrameLabel.textContent = activeFrame.name;
        }
    }

    function getSampleThumbnailImages() {
        if (window._mioraSampleThumbImages) {
            return window._mioraSampleThumbImages;
        }
        const samples = [];
        const colors = [
            ['#FFE8D6', '#D4A373'],
            ['#E8D8C8', '#A5A58D'],
            ['#F0E6DF', '#C6AC8F'],
            ['#EAD7D1', '#9A8C98'],
        ];
        for (let i = 0; i < 4; i++) {
            const sc = document.createElement('canvas');
            sc.width = 400;
            sc.height = 300;
            const sctx = sc.getContext('2d');
            const [c1, c2] = colors[i % colors.length];
            const g = sctx.createLinearGradient(0, 0, 400, 300);
            g.addColorStop(0, c1);
            g.addColorStop(1, c2);
            sctx.fillStyle = g;
            sctx.fillRect(0, 0, 400, 300);

            // Minimalist studio portrait silhouette
            sctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            sctx.beginPath();
            sctx.arc(200, 115, 46, 0, Math.PI * 2);
            sctx.fill();
            sctx.beginPath();
            sctx.arc(200, 260, 82, Math.PI, 0);
            sctx.fill();
            samples.push(sc);
        }
        window._mioraSampleThumbImages = samples;
        return samples;
    }

    let hasRenderedThumbnails = false;
    function renderAllFrameThumbnails(force = false) {
        if (hasRenderedThumbnails && !force) {
            return;
        }
        const thumbCanvases = document.querySelectorAll('.editor-frame-thumbnail');
        if (thumbCanvases.length === 0) {
            return;
        }
        const imagesToUse = (loadedImages && loadedImages.filter(Boolean).length > 0)
            ? loadedImages.filter(Boolean)
            : getSampleThumbnailImages();

        thumbCanvases.forEach((c) => {
            try {
                const card = c.closest('.editor-frame-card');
                // If filtering is active and card is hidden, skip rendering until it becomes visible
                if (card && card.classList.contains('hidden') && !force) {
                    return;
                }

                const frameId = c.dataset.frameId;
                const frame = (catalog.frames || []).find((f) => f.id === frameId);
                if (!frame) {
                    return;
                }

                const thumbState = {
                    frameId: frame.id,
                    layoutId: frame.default_layout || 'strip-4',
                    caption: '',
                    showDate: false,
                    fontId: 'serif',
                    textColor: 'auto',
                    stickers: [],
                    photoAdjustments: [
                        { zoom: 100, panX: 0, panY: 0, brightness: 0, contrast: 0, postFilter: 'none' },
                        { zoom: 100, panX: 0, panY: 0, brightness: 0, contrast: 0, postFilter: 'none' },
                        { zoom: 100, panX: 0, panY: 0, brightness: 0, contrast: 0, postFilter: 'none' },
                        { zoom: 100, panX: 0, panY: 0, brightness: 0, contrast: 0, postFilter: 'none' },
                    ],
                };

                renderPhotostripToCanvas(c, imagesToUse, thumbState, catalog);
            } catch (err) {
                console.error('Thumbnail render error for frame:', err);
            }
        });
        hasRenderedThumbnails = true;
    }

    // Render initial placeholder thumbnails immediately so cards are never blank while photos load
    renderAllFrameThumbnails(false);

    function syncControlsFromState() {
        // Frame highlight
        frameCards.forEach((card) => {
            const active = card.dataset.frameId === editorState.frameId;
            card.classList.toggle('border-miora-charcoal', active);
            card.classList.toggle('bg-miora-blush-soft/40', active);
            card.classList.toggle('border-miora-oat', !active);
            card.classList.toggle('bg-miora-cream', !active);
            card.classList.toggle('hover:border-miora-taupe', !active);
        });

        // Maintain active category filter
        applyFrameCategoryFilter();

        // Layout highlight
        document.querySelectorAll('.editor-layout-card').forEach((card) => {
            const active = card.dataset.layoutId === editorState.layoutId;
            card.classList.toggle('border-miora-charcoal', active);
            card.classList.toggle('bg-miora-blush-soft/40', active);
            card.classList.toggle('border-miora-oat', !active);
            card.classList.toggle('bg-miora-cream', !active);
            card.classList.toggle('hover:border-miora-taupe', !active);
        });

        // Adjustment Sliders for current target
        const targetVal = adjustTargetSelect ? adjustTargetSelect.value : 'all';
        const refIdx = targetVal === 'all' ? 0 : Number(targetVal);
        const adj = (editorState.photoAdjustments && editorState.photoAdjustments[refIdx]) || {
            zoom: 100,
            panX: 0,
            panY: 0,
            brightness: 0,
            contrast: 0,
            postFilter: 'none',
        };

        if (zoomSlider) {
            zoomSlider.value = String(adj.zoom);
            zoomVal.textContent = `${adj.zoom}%`;
        }
        if (panXSlider) {
            panXSlider.value = String(adj.panX);
            panXVal.textContent = String(adj.panX);
        }
        if (panYSlider) {
            panYSlider.value = String(adj.panY);
            panYVal.textContent = String(adj.panY);
        }
        if (brightnessSlider) {
            brightnessSlider.value = String(adj.brightness);
            brightnessVal.textContent = String(adj.brightness);
        }
        if (contrastSlider) {
            contrastSlider.value = String(adj.contrast);
            contrastVal.textContent = String(adj.contrast);
        }

        document.querySelectorAll('.editor-post-filter-btn').forEach((btn) => {
            const active = btn.dataset.postFilter === adj.postFilter;
            btn.className = `editor-post-filter-btn px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                active
                    ? 'bg-miora-charcoal text-miora-ivory border-miora-charcoal'
                    : 'bg-miora-cream text-miora-charcoal border-miora-oat hover:border-miora-brown'
            }`;
        });

        // Caption & Date
        if (captionInput) {
            captionInput.value = editorState.caption ?? '';
        }
        if (dateToggle) {
            dateToggle.checked = Boolean(editorState.showDate);
        }
        if (dateFormatSelect && editorState.dateFormat) {
            dateFormatSelect.value = editorState.dateFormat;
        }
        if (fontSelect && editorState.fontId) {
            fontSelect.value = editorState.fontId;
        }

        document.querySelectorAll('.editor-textcolor-btn').forEach((btn) => {
            const active = btn.dataset.textColor === (editorState.textColor || 'auto');
            btn.className = `editor-textcolor-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                active ? 'border-miora-charcoal bg-miora-blush-soft/50' : 'border-miora-oat bg-miora-cream'
            }`;
        });
    }

    // Initialize Session Data
    loadSession().then(async (saved) => {
        if (saved && Array.isArray(saved.photos) && saved.photos.length > 0) {
            sessionData = saved;
            editorState = saved.editorState || getDefaultEditorState(saved.photos.length, preselectedFrame || 'classic-cream');
            if (preselectedFrame) {
                editorState.frameId = preselectedFrame;
            }
        } else {
            emptyBanner?.classList.remove('hidden');
            const samples = generateSamplePhotos(4);
            editorState = getDefaultEditorState(4, preselectedFrame || 'classic-cream');
            sessionData = {
                photos: samples,
                captureMode: 'photostrip',
                targetPhotoCount: 4,
                editorState: cloneState(editorState),
            };
            await saveSession(sessionData);
        }

        // Clean up any auto-generated stickers (stickers only appear when explicitly added by user)
        if (Array.isArray(editorState.stickers)) {
            editorState.stickers = editorState.stickers.filter(
                (s) => s.id !== 'sparkles-1' && s.id !== 'heart-1'
            );
        } else {
            editorState.stickers = [];
        }

        // Clean up default placeholder caption so design is not covered
        if (editorState.caption === 'Little moments, forever yours.') {
            editorState.caption = '';
        }

        loadedImages = await loadHtmlImages(sessionData.photos);
        syncControlsFromState();
        renderPreview();
        renderAllFrameThumbnails(true);
    });

    // Main Tab Switching (Frames, Layout, Photo Adjust, Stickers & Text)
    const tabButtons = document.querySelectorAll('.editor-tab-btn');
    const tabPanels = {
        frames: document.getElementById('editor-panel-frames'),
        layout: document.getElementById('editor-panel-layout'),
        adjust: document.getElementById('editor-panel-adjust'),
        decorate: document.getElementById('editor-panel-decorate'),
    };

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.editorTab;
            if (target === 'frames') {
                renderAllFrameThumbnails(false);
            }
            tabButtons.forEach((b) => {
                const active = b.dataset.editorTab === target;
                b.className = `editor-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    active
                        ? 'bg-miora-ivory text-miora-charcoal shadow-2xs'
                        : 'text-miora-muted hover:text-miora-charcoal'
                }`;
            });
            Object.entries(tabPanels).forEach(([key, panel]) => {
                panel?.classList.toggle('hidden', key !== target);
            });
        });
    });

    // Frame Category Filter Pills
    frameCatButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            currentFrameCategory = btn.dataset.editorFrameCat;
            applyFrameCategoryFilter();
            renderAllFrameThumbnails(true);
        });
    });

    // Frame Card Selection
    frameCards.forEach((card) => {
        card.addEventListener('click', () => {
            pushUndoSnapshot();
            editorState.frameId = card.dataset.frameId;
            syncControlsFromState();
            renderPreview();
            persistEditorState();
        });
    });

    // Layout Card Selection
    document.querySelectorAll('.editor-layout-card').forEach((card) => {
        card.addEventListener('click', () => {
            pushUndoSnapshot();
            editorState.layoutId = card.dataset.layoutId;
            syncControlsFromState();
            renderPreview();
            persistEditorState();
        });
    });

    // Photo Adjustment Helper
    function applyPhotoAdjustmentChange(key, value) {
        const target = adjustTargetSelect ? adjustTargetSelect.value : 'all';
        if (!Array.isArray(editorState.photoAdjustments)) {
            editorState.photoAdjustments = getDefaultEditorState().photoAdjustments;
        }

        if (target === 'all') {
            for (let i = 0; i < 4; i++) {
                editorState.photoAdjustments[i][key] = value;
            }
        } else {
            const idx = Number(target);
            if (editorState.photoAdjustments[idx]) {
                editorState.photoAdjustments[idx][key] = value;
            }
        }
        renderPreview();
        persistEditorState();
    }

    adjustTargetSelect?.addEventListener('change', () => syncControlsFromState());

    [zoomSlider, panXSlider, panYSlider, brightnessSlider, contrastSlider].forEach((slider) => {
        slider?.addEventListener('mousedown', () => pushUndoSnapshot());
        slider?.addEventListener('touchstart', () => pushUndoSnapshot(), { passive: true });
    });

    zoomSlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        zoomVal.textContent = `${val}%`;
        applyPhotoAdjustmentChange('zoom', val);
    });

    panXSlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        panXVal.textContent = String(val);
        applyPhotoAdjustmentChange('panX', val);
    });

    panYSlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        panYVal.textContent = String(val);
        applyPhotoAdjustmentChange('panY', val);
    });

    brightnessSlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        brightnessVal.textContent = String(val);
        applyPhotoAdjustmentChange('brightness', val);
    });

    contrastSlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        contrastVal.textContent = String(val);
        applyPhotoAdjustmentChange('contrast', val);
    });

    document.querySelectorAll('.editor-post-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            pushUndoSnapshot();
            applyPhotoAdjustmentChange('postFilter', btn.dataset.postFilter);
            syncControlsFromState();
        });
    });

    // Stickers: Add & Clear & Interactive Drag on Canvas
    document.querySelectorAll('.editor-sticker-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            pushUndoSnapshot();
            if (!Array.isArray(editorState.stickers)) {
                editorState.stickers = [];
            }
            const count = editorState.stickers.length;
            const sideX = count % 2 === 0 ? 0.14 : 0.86;
            const posY = Math.min(0.88, 0.14 + ((count * 0.17) % 0.72));

            editorState.stickers.push({
                id: `${btn.dataset.stickerId}-${Date.now()}`,
                symbol: btn.dataset.stickerSymbol,
                x: sideX,
                y: posY,
                scale: 1.05,
            });
            renderPreview();
            persistEditorState();
        });
    });

    btnClearStickers?.addEventListener('click', () => {
        pushUndoSnapshot();
        editorState.stickers = [];
        renderPreview();
        persistEditorState();
    });

    // Pointer Dragging of Stickers Directly on Strip Canvas
    function getCanvasNormalizedCoords(evt) {
        const rect = stripCanvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return {
            nx: Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width)),
            ny: Math.max(0.04, Math.min(0.96, (clientY - rect.top) / rect.height)),
        };
    }

    stripCanvas?.addEventListener('mousedown', (evt) => {
        const { nx, ny } = getCanvasNormalizedCoords(evt);
        const hitIdx = findStickerIndexAtPoint(editorState.stickers, nx, ny, stripCanvas.width, stripCanvas.height);
        if (hitIdx !== -1) {
            pushUndoSnapshot();
            draggingStickerIdx = hitIdx;
        }
    });

    window.addEventListener('mousemove', (evt) => {
        if (draggingStickerIdx === -1 || !stripCanvas) {
            return;
        }
        const { nx, ny } = getCanvasNormalizedCoords(evt);
        if (editorState.stickers[draggingStickerIdx]) {
            editorState.stickers[draggingStickerIdx].x = nx;
            editorState.stickers[draggingStickerIdx].y = ny;
            renderPreview();
        }
    });

    window.addEventListener('mouseup', () => {
        if (draggingStickerIdx !== -1) {
            draggingStickerIdx = -1;
            persistEditorState();
        }
    });

    // Caption, Date Stamp, Font & Text Color
    captionInput?.addEventListener('focus', () => pushUndoSnapshot());
    captionInput?.addEventListener('input', (e) => {
        editorState.caption = e.target.value;
        renderPreview();
        persistEditorState();
    });

    dateToggle?.addEventListener('change', (e) => {
        pushUndoSnapshot();
        editorState.showDate = e.target.checked;
        renderPreview();
        persistEditorState();
    });

    dateFormatSelect?.addEventListener('change', (e) => {
        pushUndoSnapshot();
        editorState.dateFormat = e.target.value;
        renderPreview();
        persistEditorState();
    });

    fontSelect?.addEventListener('change', (e) => {
        pushUndoSnapshot();
        editorState.fontId = e.target.value;
        renderPreview();
        persistEditorState();
    });

    document.querySelectorAll('.editor-textcolor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            pushUndoSnapshot();
            editorState.textColor = btn.dataset.textColor;
            syncControlsFromState();
            renderPreview();
            persistEditorState();
        });
    });

    // Undo & Reset Editing Buttons
    btnUndo?.addEventListener('click', () => {
        if (undoStack.length === 0) {
            return;
        }
        editorState = undoStack.pop();
        btnUndo.disabled = undoStack.length === 0;
        syncControlsFromState();
        renderPreview();
        persistEditorState();
    });

    btnReset?.addEventListener('click', () => {
        pushUndoSnapshot();
        const photoCount = sessionData?.photos?.length || 4;
        editorState = getDefaultEditorState(photoCount, 'classic-cream');
        syncControlsFromState();
        renderPreview();
        persistEditorState();
    });

    // Continue to Result Page
    const proceedToResult = async () => {
        await persistEditorState();
        window.location.href = resultUrl;
    };

    btnContinue?.addEventListener('click', proceedToResult);
    btnContinueBottom?.addEventListener('click', proceedToResult);
}

