/**
 * MIORA Result Page Controller Module
 * Handles Still (PNG/JPG) and Animated (GIF) Previews and Downloads
 * for both Framed Photostrip and Individual Photos.
 */

import { renderAdjustedPhotoToCanvas } from './filters';
import { generateLivePhotoGif, generateLivePhotostripGif } from './gif';
import { renderPhotostripToCanvas } from './renderer';
import { clearSession, generateSamplePhotos, getDefaultEditorState, loadSession } from './storage';
import { triggerDataUrlDownload } from './zip';

export function initResultPage() {
    const root = document.getElementById('miora-result-app');
    if (!root) {
        return;
    }

    const configEl = document.getElementById('miora-result-config');
    const catalog = configEl ? JSON.parse(configEl.textContent) : {};
    const photoboothUrl = root.dataset.photoboothUrl || '/photobooth';

    // Photostrip Elements
    const stripCanvas = document.getElementById('result-strip-canvas');
    const tabStripStill = document.getElementById('tab-strip-still');
    const tabStripGif = document.getElementById('tab-strip-gif');
    const stripGifWrapper = document.getElementById('result-strip-gif-wrapper');
    const stripGifImg = document.getElementById('result-strip-gif-img');
    const stripGifSpinner = document.getElementById('result-strip-gif-spinner');
    const stripLiveBadge = document.getElementById('result-strip-live-badge');

    const btnDownloadStripGif = document.getElementById('btn-download-strip-gif');
    const btnDownloadStripPng = document.getElementById('btn-download-strip-png');
    const btnDownloadStripJpg = document.getElementById('btn-download-strip-jpg');

    // Individual Photos Elements
    const individualContainer = document.getElementById('individual-photos-container');
    const tabAllPhotosStill = document.getElementById('tab-all-photos-still');
    const tabAllPhotosGif = document.getElementById('tab-all-photos-gif');

    // Download All Group Buttons
    const btnDownloadAllPng = document.getElementById('btn-download-all-png');
    const btnDownloadAllJpg = document.getElementById('btn-download-all-jpg');
    const btnDownloadAllGif = document.getElementById('btn-download-all-gif');
    const btnCreateAnother = document.getElementById('btn-create-another');

    // Toast
    const toast = document.getElementById('download-status-toast');
    const toastText = document.getElementById('download-toast-text');
    const toastIcon = document.getElementById('download-toast-icon');

    // Cache for generated assets
    let cachedStripGifDataUrl = null;
    let isGeneratingStripGif = false;

    let renderedIndividualCanvases = [];
    const cachedPhotoGifs = new Map(); // idx -> dataUrl
    const photoGifGeneratingFlags = new Map();

    function showDownloadToast(message, icon = '✅') {
        if (!toast || !toastText) {
            return;
        }
        if (toastIcon) {
            toastIcon.textContent = icon;
        }
        toastText.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3400);
    }

    let loadedPhotoAssets = [];
    let currentEditorState = null;

    function loadPhotoAssets(photos) {
        return Promise.all(
            photos.map(async (p) => {
                const mainImg = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = p.dataUrl;
                });

                const rawFrames = Array.isArray(p.liveFrames) && p.liveFrames.length > 0
                    ? p.liveFrames
                    : [p.dataUrl];

                const liveImages = (await Promise.all(
                    rawFrames.map(
                        (src) =>
                            new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => resolve(img);
                                img.onerror = () => resolve(null);
                                img.src = src;
                            })
                    )
                )).filter(Boolean);

                return {
                    photo: p,
                    mainImg,
                    liveImages: liveImages.length > 0 ? liveImages : (mainImg ? [mainImg] : []),
                };
            })
        );
    }

    // Helper: Ensure photostrip Live GIF is generated and returns dataUrl
    async function ensurePhotostripGif() {
        if (cachedStripGifDataUrl) {
            return cachedStripGifDataUrl;
        }
        if (!stripCanvas || isGeneratingStripGif || loadedPhotoAssets.length === 0) {
            return null;
        }

        isGeneratingStripGif = true;
        stripGifSpinner?.classList.remove('hidden');

        try {
            const { dataUrl } = await generateLivePhotostripGif(
                loadedPhotoAssets,
                currentEditorState,
                catalog,
                { width: 380, delay: 10 }
            );
            cachedStripGifDataUrl = dataUrl;
            if (stripGifImg) {
                stripGifImg.src = dataUrl;
            }
            return dataUrl;
        } catch (err) {
            console.error('Error generating photostrip Live GIF:', err);
            showDownloadToast('Failed to create Live Photostrip. Try again.', '⚠️');
            return null;
        } finally {
            isGeneratingStripGif = false;
            stripGifSpinner?.classList.add('hidden');
        }
    }

    // Helper: Ensure individual photo Live GIF is generated and returns dataUrl
    async function ensurePhotoGif(idx, canvas, spinnerEl, imgEl) {
        if (cachedPhotoGifs.has(idx)) {
            return cachedPhotoGifs.get(idx);
        }
        if (photoGifGeneratingFlags.get(idx) || !loadedPhotoAssets[idx]) {
            return null;
        }

        photoGifGeneratingFlags.set(idx, true);
        spinnerEl?.classList.remove('hidden');

        try {
            const asset = loadedPhotoAssets[idx];
            const adj = (currentEditorState?.photoAdjustments && currentEditorState.photoAdjustments[idx]) || {
                zoom: 100,
                panX: 0,
                panY: 0,
                brightness: 0,
                contrast: 0,
                postFilter: 'none',
            };

            const adjustedLiveFrames = asset.liveImages.map((img) =>
                renderAdjustedPhotoToCanvas(img, adj, 480, 360)
            );

            const { dataUrl } = await generateLivePhotoGif(adjustedLiveFrames, {
                width: 480,
                height: 360,
                delay: 10,
            });
            cachedPhotoGifs.set(idx, dataUrl);
            if (imgEl) {
                imgEl.src = dataUrl;
            }
            return dataUrl;
        } catch (err) {
            console.error(`Error generating photo Live GIF #${idx + 1}:`, err);
            return null;
        } finally {
            photoGifGeneratingFlags.set(idx, false);
            spinnerEl?.classList.add('hidden');
        }
    }

    // Photostrip Tab Switching (Still vs GIF)
    tabStripStill?.addEventListener('click', () => {
        tabStripStill.className =
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs';
        tabStripGif.className =
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal';
        stripCanvas?.classList.remove('hidden');
        stripGifWrapper?.classList.add('hidden');
        stripLiveBadge?.classList.add('hidden');
    });

    tabStripGif?.addEventListener('click', async () => {
        tabStripGif.className =
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs';
        tabStripStill.className =
            'flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal';
        stripCanvas?.classList.add('hidden');
        stripGifWrapper?.classList.remove('hidden');
        stripLiveBadge?.classList.remove('hidden');

        await ensurePhotostripGif();
    });

    // Photostrip Downloads
    btnDownloadStripPng?.addEventListener('click', () => {
        if (!stripCanvas) return;
        const dataUrl = stripCanvas.toDataURL('image/png');
        triggerDataUrlDownload(dataUrl, 'miora-photostrip.png');
        showDownloadToast('Saved miora-photostrip.png (Lossless HD)!');
    });

    btnDownloadStripJpg?.addEventListener('click', () => {
        if (!stripCanvas) return;
        const dataUrl = stripCanvas.toDataURL('image/jpeg', 0.95);
        triggerDataUrlDownload(dataUrl, 'miora-photostrip.jpg');
        showDownloadToast('Saved miora-photostrip.jpg (High Quality)!');
    });

    btnDownloadStripGif?.addEventListener('click', async () => {
        showDownloadToast('Preparing animated GIF for download...', '✨');
        const dataUrl = await ensurePhotostripGif();
        if (dataUrl) {
            triggerDataUrlDownload(dataUrl, 'miora-photostrip.gif');
            showDownloadToast('Saved miora-photostrip.gif (Animated Looping GIF)!', '✨');
        }
    });

    // Main Session Initialization
    loadSession().then(async (saved) => {
        const photos =
            saved && Array.isArray(saved.photos) && saved.photos.length > 0
                ? saved.photos
                : generateSamplePhotos(4);
        const editorState = saved?.editorState || getDefaultEditorState(photos.length, 'classic-cream');

        currentEditorState = editorState;
        loadedPhotoAssets = await loadPhotoAssets(photos);
        const loadedImages = loadedPhotoAssets.map((a) => a.mainImg).filter(Boolean);

        // 1. Render Final Framed Photostrip Canvas
        if (stripCanvas) {
            renderPhotostripToCanvas(stripCanvas, loadedImages, editorState, catalog);
        }

        // 2. Render Individual Photos
        renderedIndividualCanvases = [];
        if (individualContainer) {
            individualContainer.innerHTML = '';

            loadedImages.forEach((img, idx) => {
                const adj = (editorState.photoAdjustments && editorState.photoAdjustments[idx]) || {
                    zoom: 100,
                    panX: 0,
                    panY: 0,
                    brightness: 0,
                    contrast: 0,
                    postFilter: 'none',
                };

                const photoCanvas = renderAdjustedPhotoToCanvas(img, adj, 1440, 1080);
                renderedIndividualCanvases.push(photoCanvas);

                const pngUrl = photoCanvas.toDataURL('image/png');
                const meta = photos[idx] || {};

                const card = document.createElement('div');
                card.className =
                    'individual-photo-card rounded-2xl bg-miora-cream border border-miora-oat p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all';
                card.dataset.photoIdx = String(idx);

                card.innerHTML = `
                    <div>
                        <!-- Header with Photo index, Filter Name, and Mode Toggle Pill -->
                        <div class="flex items-center justify-between text-xs mb-3 gap-2">
                            <div class="flex items-center gap-1.5">
                                <span class="font-semibold text-miora-charcoal">Photo #${idx + 1}</span>
                                <span class="px-2 py-0.5 rounded-full bg-miora-sand text-[10px] font-medium text-miora-brown truncate max-w-[100px]">
                                    ${meta.filterName || 'Original'}
                                </span>
                            </div>

                            <!-- Single Card Mode Switcher (Still vs GIF) -->
                            <div class="inline-flex p-0.5 rounded-xl bg-miora-sand border border-miora-oat shrink-0" role="tablist">
                                <button type="button"
                                        class="btn-photo-toggle-still px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-miora-ivory text-miora-charcoal shadow-2xs cursor-pointer transition-all">
                                    📷 Still
                                </button>
                                <button type="button"
                                        class="btn-photo-toggle-gif px-2.5 py-1 rounded-lg text-[11px] font-semibold text-miora-muted hover:text-miora-charcoal cursor-pointer transition-all">
                                    ✨ GIF
                                </button>
                            </div>
                        </div>

                        <!-- Preview Container: Still Image or Animated GIF -->
                        <div class="relative aspect-4/3 rounded-xl overflow-hidden bg-miora-charcoal border border-miora-oat flex items-center justify-center">
                            <img src="${pngUrl}" alt="Photo ${idx + 1} Still" class="photo-preview-still w-full h-full object-cover" />
                            <img alt="Photo ${idx + 1} Animated GIF" class="photo-preview-gif hidden w-full h-full object-cover" />

                            <div class="photo-spinner hidden absolute inset-0 bg-miora-ivory/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 space-y-2 z-10">
                                <div class="w-7 h-7 border-2 border-miora-oat border-t-miora-charcoal rounded-full animate-spin"></div>
                                <span class="text-[11px] font-medium text-miora-charcoal">Creating GIF...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Per-Photo Download Buttons (GIF, PNG, JPG) -->
                    <div class="space-y-2 pt-1">
                        <!-- Primary Animated GIF Download -->
                        <button type="button"
                                data-dl-gif-idx="${idx}"
                                class="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-miora-charcoal to-miora-brown hover:opacity-95 text-miora-ivory text-xs font-semibold shadow-2xs transition-all cursor-pointer">
                            <span>✨</span>
                            <span>Download Animated GIF</span>
                        </button>

                        <!-- Still Formats -->
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button"
                                    data-dl-png-idx="${idx}"
                                    class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-miora-sand hover:bg-miora-oat text-miora-charcoal border border-miora-oat text-[11px] font-semibold transition-colors cursor-pointer">
                                <span>Download PNG</span>
                            </button>
                            <button type="button"
                                    data-dl-jpg-idx="${idx}"
                                    class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-miora-sand hover:bg-miora-oat text-miora-charcoal border border-miora-oat text-[11px] font-semibold transition-colors cursor-pointer">
                                <span>Download JPG</span>
                            </button>
                        </div>
                    </div>
                `;

                individualContainer.appendChild(card);

                // Wire Card Controls
                const btnStill = card.querySelector('.btn-photo-toggle-still');
                const btnGif = card.querySelector('.btn-photo-toggle-gif');
                const imgStill = card.querySelector('.photo-preview-still');
                const imgGif = card.querySelector('.photo-preview-gif');
                const spinner = card.querySelector('.photo-spinner');

                const switchToStill = () => {
                    btnStill.className =
                        'btn-photo-toggle-still px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-miora-ivory text-miora-charcoal shadow-2xs cursor-pointer transition-all';
                    btnGif.className =
                        'btn-photo-toggle-gif px-2.5 py-1 rounded-lg text-[11px] font-semibold text-miora-muted hover:text-miora-charcoal cursor-pointer transition-all';
                    imgStill.classList.remove('hidden');
                    imgGif.classList.add('hidden');
                };

                const switchToGif = async () => {
                    btnGif.className =
                        'btn-photo-toggle-gif px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-miora-ivory text-miora-charcoal shadow-2xs cursor-pointer transition-all';
                    btnStill.className =
                        'btn-photo-toggle-still px-2.5 py-1 rounded-lg text-[11px] font-semibold text-miora-muted hover:text-miora-charcoal cursor-pointer transition-all';
                    imgStill.classList.add('hidden');
                    imgGif.classList.remove('hidden');

                    await ensurePhotoGif(idx, photoCanvas, spinner, imgGif);
                };

                btnStill?.addEventListener('click', switchToStill);
                btnGif?.addEventListener('click', switchToGif);

                // Attach Card methods for global toggles
                card._switchToStill = switchToStill;
                card._switchToGif = switchToGif;
            });

            // Bind Individual Download Buttons
            individualContainer.querySelectorAll('[data-dl-png-idx]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.dataset.dlPngIdx);
                    const cnv = renderedIndividualCanvases[idx];
                    if (!cnv) return;
                    const dataUrl = cnv.toDataURL('image/png');
                    triggerDataUrlDownload(dataUrl, `miora-photo-${idx + 1}.png`);
                    showDownloadToast(`Saved miora-photo-${idx + 1}.png (HD PNG)`);
                });
            });

            individualContainer.querySelectorAll('[data-dl-jpg-idx]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.dataset.dlJpgIdx);
                    const cnv = renderedIndividualCanvases[idx];
                    if (!cnv) return;
                    const dataUrl = cnv.toDataURL('image/jpeg', 0.95);
                    triggerDataUrlDownload(dataUrl, `miora-photo-${idx + 1}.jpg`);
                    showDownloadToast(`Saved miora-photo-${idx + 1}.jpg (JPG)`);
                });
            });

            individualContainer.querySelectorAll('[data-dl-gif-idx]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const idx = Number(btn.dataset.dlGifIdx);
                    const cnv = renderedIndividualCanvases[idx];
                    if (!cnv) return;
                    const card = individualContainer.children[idx];
                    const spinner = card?.querySelector('.photo-spinner');
                    const imgGif = card?.querySelector('.photo-preview-gif');

                    showDownloadToast(`Generating animated GIF for Photo #${idx + 1}...`, '✨');
                    const dataUrl = await ensurePhotoGif(idx, cnv, spinner, imgGif);
                    if (dataUrl) {
                        triggerDataUrlDownload(dataUrl, `miora-photo-${idx + 1}.gif`);
                        showDownloadToast(`Saved miora-photo-${idx + 1}.gif (Animated GIF)!`, '✨');
                    }
                });
            });
        }
    });

    // Global Mode Switchers for Individual Photos
    tabAllPhotosStill?.addEventListener('click', () => {
        tabAllPhotosStill.className =
            'py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs';
        tabAllPhotosGif.className =
            'py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal';

        if (individualContainer) {
            Array.from(individualContainer.children).forEach((c) => {
                c._switchToStill?.();
            });
        }
    });

    tabAllPhotosGif?.addEventListener('click', () => {
        tabAllPhotosGif.className =
            'py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-miora-ivory text-miora-charcoal shadow-2xs';
        tabAllPhotosStill.className =
            'py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-miora-muted hover:text-miora-charcoal';

        if (individualContainer) {
            Array.from(individualContainer.children).forEach((c) => {
                c._switchToGif?.();
            });
        }
    });

    // DOWNLOAD ALL AS PNG
    async function downloadAllAsPng() {
        const filesToDownload = [];
        if (stripCanvas) {
            filesToDownload.push({
                dataUrl: stripCanvas.toDataURL('image/png'),
                filename: 'miora-photostrip.png',
            });
        }
        renderedIndividualCanvases.forEach((cnv, idx) => {
            filesToDownload.push({
                dataUrl: cnv.toDataURL('image/png'),
                filename: `miora-photo-${idx + 1}.png`,
            });
        });

        if (filesToDownload.length === 0) return;
        showDownloadToast(`Downloading all ${filesToDownload.length} files as PNG...`);

        for (let i = 0; i < filesToDownload.length; i++) {
            const item = filesToDownload[i];
            triggerDataUrlDownload(item.dataUrl, item.filename);
            if (i < filesToDownload.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        }
    }

    // DOWNLOAD ALL AS JPG
    async function downloadAllAsJpg() {
        const filesToDownload = [];
        if (stripCanvas) {
            filesToDownload.push({
                dataUrl: stripCanvas.toDataURL('image/jpeg', 0.95),
                filename: 'miora-photostrip.jpg',
            });
        }
        renderedIndividualCanvases.forEach((cnv, idx) => {
            filesToDownload.push({
                dataUrl: cnv.toDataURL('image/jpeg', 0.95),
                filename: `miora-photo-${idx + 1}.jpg`,
            });
        });

        if (filesToDownload.length === 0) return;
        showDownloadToast(`Downloading all ${filesToDownload.length} files as JPG...`);

        for (let i = 0; i < filesToDownload.length; i++) {
            const item = filesToDownload[i];
            triggerDataUrlDownload(item.dataUrl, item.filename);
            if (i < filesToDownload.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        }
    }

    // DOWNLOAD ALL AS ANIMATED GIF
    async function downloadAllAsGif() {
        showDownloadToast('Creating animated GIFs for strip and photos...', '✨');

        const filesToDownload = [];

        // 1. Photostrip GIF
        if (stripCanvas) {
            const stripUrl = await ensurePhotostripGif();
            if (stripUrl) {
                filesToDownload.push({
                    dataUrl: stripUrl,
                    filename: 'miora-photostrip.gif',
                });
            }
        }

        // 2. Individual Photos GIFs
        for (let idx = 0; idx < renderedIndividualCanvases.length; idx++) {
            const cnv = renderedIndividualCanvases[idx];
            const card = individualContainer?.children[idx];
            const spinner = card?.querySelector('.photo-spinner');
            const imgGif = card?.querySelector('.photo-preview-gif');

            const gifUrl = await ensurePhotoGif(idx, cnv, spinner, imgGif);
            if (gifUrl) {
                filesToDownload.push({
                    dataUrl: gifUrl,
                    filename: `miora-photo-${idx + 1}.gif`,
                });
            }
        }

        if (filesToDownload.length === 0) return;
        showDownloadToast(`Downloading ${filesToDownload.length} Animated GIFs...`, '✨');

        for (let i = 0; i < filesToDownload.length; i++) {
            const item = filesToDownload[i];
            triggerDataUrlDownload(item.dataUrl, item.filename);
            if (i < filesToDownload.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        }
    }

    btnDownloadAllPng?.addEventListener('click', downloadAllAsPng);
    btnDownloadAllJpg?.addEventListener('click', downloadAllAsJpg);
    btnDownloadAllGif?.addEventListener('click', downloadAllAsGif);

    // Create Another Session
    btnCreateAnother?.addEventListener('click', async () => {
        await clearSession();
        window.location.href = photoboothUrl;
    });
}
