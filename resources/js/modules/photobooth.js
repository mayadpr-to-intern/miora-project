/**
 * MIORA Photobooth Page Controller Module
 */

import { renderFilteredFrame } from './filters';
import { getDefaultEditorState, loadSession, saveSession } from './storage';

export function initPhotoboothPage() {
    const root = document.getElementById('miora-photobooth-app');
    if (!root) {
        return;
    }

    const preselectedFrame = root.dataset.preselectedFrame || 'classic-cream';
    const editorUrl = root.dataset.editorUrl || '/editor';

    const videoEl = document.getElementById('booth-video');
    const canvasEl = document.getElementById('booth-canvas');
    const stageContainer = document.getElementById('camera-stage-container');
    const permissionOverlay = document.getElementById('camera-permission-overlay');
    const overlayTitle = document.getElementById('camera-overlay-title');
    const overlayDesc = document.getElementById('camera-overlay-desc');
    const helpBox = document.getElementById('camera-help-box');
    const instructionText = document.getElementById('booth-instruction-text');

    const btnRequestCamera = document.getElementById('btn-request-camera');
    const btnUseDemoCamera = document.getElementById('btn-use-demo-camera');
    const cameraDeviceSelect = document.getElementById('camera-device-select');
    const btnMirrorCamera = document.getElementById('btn-mirror-camera');
    const mirrorStatusLabel = document.getElementById('mirror-status-label');
    const btnFullscreenCamera = document.getElementById('btn-fullscreen-camera');
    const btnMacbookIsp = document.getElementById('btn-macbook-isp');
    const macbookIspLabel = document.getElementById('macbook-isp-label');
    const btnStudioLight = document.getElementById('btn-studio-light');
    const studioLightLabel = document.getElementById('studio-light-label');
    const studioRinglightOverlay = document.getElementById('studio-ringlight-overlay');

    const activeFilterBadge = document.getElementById('active-filter-badge');
    const intensitySlider = document.getElementById('filter-intensity-slider');
    const intensityValue = document.getElementById('filter-intensity-value');
    const btnResetEffect = document.getElementById('btn-reset-effect');

    const btnCaptureShutter = document.getElementById('btn-capture-shutter');
    const shutterBtnLabel = document.getElementById('shutter-btn-label');
    const stripCountGroup = document.getElementById('strip-count-group');
    const progressBanner = document.getElementById('capture-progress-banner');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownMessage = document.getElementById('countdown-message');
    const shutterFlashOverlay = document.getElementById('shutter-flash-overlay');

    const capturedPhotosGrid = document.getElementById('captured-photos-grid');
    const trayStatusSubtitle = document.getElementById('tray-status-subtitle');
    const sessionModePill = document.getElementById('session-mode-pill');
    const btnContinueEditor = document.getElementById('btn-continue-editor');
    const btnRetakeAll = document.getElementById('btn-retake-all');

    const inspectModal = document.getElementById('photo-inspect-modal');
    const inspectModalTitle = document.getElementById('inspect-modal-title');
    const inspectModalImg = document.getElementById('inspect-modal-img');
    const btnCloseInspect = document.getElementById('btn-close-inspect');
    const btnInspectDone = document.getElementById('btn-inspect-done');
    const btnInspectRetake = document.getElementById('btn-inspect-retake');

    // Internal Booth State
    const state = {
        stream: null,
        usingDemoCamera: false,
        demoCanvas: document.createElement('canvas'),
        demoTick: 0,
        isMirrored: true,
        macbookIsp: true,
        studioLight: false,
        activeFilterId: 'original',
        activeFilterName: 'Original',
        filterIntensity: 100,
        captureMode: 'photostrip', // 'single' | 'photostrip'
        targetPhotoCount: 4, // 1 | 2 | 3 | 4
        countdownSeconds: 3, // 3 | 5 | 10
        isCapturing: false,
        photos: [],
        inspectIndex: null,
        rafId: null,
    };

    state.demoCanvas.width = 1440;
    state.demoCanvas.height = 1080;

    // Collect all filter thumbnail canvases and pre-render initial illustrated previews immediately
    const thumbCanvases = Array.from(document.querySelectorAll('.filter-thumb-canvas'));
    let thumbUpdateCursor = 0;

    function renderAllThumbnailsFromSource(sourceCanvasOrVideo, isMirrored = false) {
        thumbCanvases.forEach((tc) => {
            const fId = tc.dataset.thumbFilter || 'original';
            renderFilteredFrame(sourceCanvasOrVideo, tc, fId, 100, isMirrored, {
                macbookIsp: fId === 'macbook-hd',
                studioLight: false,
                preview: true,
            });
        });
    }

    // Draw initial illustrated preview on all filter thumbnails right away
    drawAnimatedDemoCameraFrame(state.demoCanvas, 12);
    renderAllThumbnailsFromSource(state.demoCanvas, false);

    // Restore any existing photos from session if user clicked "Back" from Editor
    loadSession().then((saved) => {
        if (saved && Array.isArray(saved.photos) && saved.photos.length > 0) {
            state.photos = saved.photos;
            if (saved.captureMode) {
                state.captureMode = saved.captureMode;
            }
            if (saved.targetPhotoCount) {
                state.targetPhotoCount = saved.targetPhotoCount;
            }
            syncModeButtonsUI();
            renderSessionTray();
        } else {
            renderSessionTray();
        }
    });

    // Start Real-Time Render Loop (Silky-Smooth 60 FPS Camera Pipeline)
    function startRenderLoop() {
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
        }

        const loop = () => {
            const ispOpts = { macbookIsp: state.macbookIsp, studioLight: state.studioLight };
            let activeSource = null;

            if (state.usingDemoCamera) {
                drawAnimatedDemoCameraFrame(state.demoCanvas, state.demoTick++);
                renderFilteredFrame(
                    state.demoCanvas,
                    canvasEl,
                    state.activeFilterId,
                    state.filterIntensity,
                    state.isMirrored,
                    ispOpts
                );
                activeSource = state.demoCanvas;
            } else if (videoEl && videoEl.readyState >= 2 && !videoEl.paused) {
                renderFilteredFrame(
                    videoEl,
                    canvasEl,
                    state.activeFilterId,
                    state.filterIntensity,
                    state.isMirrored,
                    ispOpts
                );
                activeSource = videoEl;
            }

            // Live-update filter thumbnail previews at a gentle, non-intrusive cadence
            // (1 thumbnail every 30 frames, paused during capture so 100% of GPU power goes to live preview)
            if (activeSource && thumbCanvases.length > 0 && !state.isCapturing) {
                state.thumbTick = (state.thumbTick || 0) + 1;
                if (state.thumbTick % 30 === 0) {
                    const tc = thumbCanvases[thumbUpdateCursor % thumbCanvases.length];
                    thumbUpdateCursor = (thumbUpdateCursor + 1) % thumbCanvases.length;
                    if (tc && !tc.closest('.hidden')) {
                        const fId = tc.dataset.thumbFilter || 'original';
                        renderFilteredFrame(activeSource, tc, fId, 100, state.isMirrored, {
                            macbookIsp: fId === 'macbook-hd' || state.macbookIsp,
                            studioLight: false,
                            preview: true,
                        });
                    }
                }
            }

            state.rafId = requestAnimationFrame(loop);
        };

        state.rafId = requestAnimationFrame(loop);
    }

    // Request Webcam via MediaDevices API
    async function initCamera(deviceId = '') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showCameraError(
                'Camera API Not Available',
                'Your browser does not expose webcam access on this connection. You can use the Virtual Studio Camera below to enjoy all features!'
            );
            return;
        }

        try {
            if (state.stream) {
                state.stream.getTracks().forEach((t) => t.stop());
            }

            // Request Full HD native sensor resolution & fluid frame rate
            const hdVideoConstraints = deviceId
                ? {
                      deviceId: { exact: deviceId },
                      width: { ideal: 1920, min: 1280 },
                      height: { ideal: 1080, min: 720 },
                      frameRate: { ideal: 60, min: 30 },
                  }
                : {
                      facingMode: 'user',
                      width: { ideal: 1920, min: 1280 },
                      height: { ideal: 1080, min: 720 },
                      frameRate: { ideal: 60, min: 30 },
                  };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: hdVideoConstraints });
            } catch {
                // Fallback for older 720p/VGA webcams that reject min:1280
                const fallbackVideo = deviceId
                    ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } };
                stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: fallbackVideo });
            }

            // If browser defaulted to a virtual camera (like OBS Virtual Camera) while a real physical webcam exists, auto-switch to the real webcam
            const currentTrack = stream.getVideoTracks()[0];
            if (!deviceId && currentTrack && /obs|virtual|vcam|manycam/i.test(currentTrack.label || '')) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const physicalCam = devices.find(
                        (d) => d.kind === 'videoinput' && d.deviceId && !/obs|virtual|vcam|manycam/i.test(d.label || '')
                    );
                    if (physicalCam) {
                        stream.getTracks().forEach((t) => t.stop());
                        return initCamera(physicalCam.deviceId);
                    }
                } catch {
                    // Ignore device enumeration fallback
                }
            }

            // Apply hardware ISP continuous auto-white-balance, auto-exposure, auto-focus & UVC sharpness when supported
            const [videoTrack] = stream.getVideoTracks();
            if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
                try {
                    const caps = videoTrack.getCapabilities();
                    const adv = {};
                    if (Array.isArray(caps.whiteBalanceMode) && caps.whiteBalanceMode.includes('continuous')) {
                        adv.whiteBalanceMode = 'continuous';
                    }
                    if (Array.isArray(caps.exposureMode) && caps.exposureMode.includes('continuous')) {
                        adv.exposureMode = 'continuous';
                    }
                    if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
                        adv.focusMode = 'continuous';
                    }
                    if (caps.sharpness && typeof caps.sharpness.max === 'number' && typeof caps.sharpness.min === 'number') {
                        adv.sharpness = Math.round(caps.sharpness.min + (caps.sharpness.max - caps.sharpness.min) * 0.72);
                    }
                    if (Object.keys(adv).length > 0) {
                        await videoTrack.applyConstraints({ advanced: [adv] });
                    }
                } catch {
                    // Ignore if driver rejects advanced ISP constraints
                }
            }

            state.stream = stream;
            state.usingDemoCamera = false;
            videoEl.srcObject = stream;
            await videoEl.play();

            permissionOverlay.classList.add('hidden');
            instructionText.textContent = 'Choose your favorite effect, pick a timer, and press the shutter button!';

            // Pre-populate all filter thumbnails once from the live webcam
            setTimeout(() => {
                if (videoEl && videoEl.readyState >= 2) {
                    renderAllThumbnailsFromSource(videoEl, state.isMirrored);
                }
            }, 120);

            startRenderLoop();
        } catch (err) {
            showCameraError(
                'Allow camera access to start taking photos.',
                `We couldn’t access your webcam (${err.name || 'Permission Denied'}). Grant camera permission in your browser address bar, or click Virtual Studio Camera below.`
            );
        }
    }

    function showCameraError(title, desc) {
        permissionOverlay.classList.remove('hidden');
        overlayTitle.textContent = title;
        overlayDesc.textContent = desc;
        helpBox.classList.remove('hidden');
    }

    function enableDemoCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach((t) => t.stop());
            state.stream = null;
        }
        state.usingDemoCamera = true;
        permissionOverlay.classList.add('hidden');
        instructionText.textContent = 'Virtual Studio Camera active! Try any live filter and start taking photos.';
        startRenderLoop();
    }

    async function populateCameraDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return;
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((d) => d.kind === 'videoinput');
            if (videoDevices.length > 1) {
                cameraDeviceSelect.innerHTML = '';
                videoDevices.forEach((dev, idx) => {
                    const opt = document.createElement('option');
                    opt.value = dev.deviceId;
                    const cleanLabel = (dev.label || `Camera ${idx + 1}`).replace(/\s*\([0-9a-fA-F]{4}:[0-9a-fA-F]{4}\)\s*/g, '').trim();
                    opt.textContent = cleanLabel || `Camera ${idx + 1}`;
                    cameraDeviceSelect.appendChild(opt);
                });
                cameraDeviceSelect.classList.remove('hidden');
            } else {
                cameraDeviceSelect.classList.add('hidden');
            }
        } catch {
            // Ignore enumeration errors
        }
    }

    // Attempt auto-start camera on load
    initCamera();

    // Event Listeners: Camera Controls
    btnRequestCamera?.addEventListener('click', () => initCamera());
    btnUseDemoCamera?.addEventListener('click', () => enableDemoCamera());

    cameraDeviceSelect?.addEventListener('change', (e) => {
        if (e.target.value) {
            initCamera(e.target.value);
        }
    });

    btnMirrorCamera?.addEventListener('click', () => {
        state.isMirrored = !state.isMirrored;
        mirrorStatusLabel.textContent = state.isMirrored ? 'Mirrored' : 'Normal';
    });

    btnMacbookIsp?.addEventListener('click', () => {
        state.macbookIsp = true;
        if (macbookIspLabel) {
            macbookIspLabel.textContent = 'Clear Lens: ON';
        }
        btnMacbookIsp.className =
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-blush-soft text-miora-charcoal border border-miora-blush text-xs font-semibold transition-all cursor-pointer';
    });

    btnStudioLight?.addEventListener('click', () => {
        state.studioLight = !state.studioLight;
        studioRinglightOverlay?.classList.toggle('hidden', !state.studioLight);
        if (studioLightLabel) {
            studioLightLabel.textContent = state.studioLight ? 'Ring Light: ON' : 'Ring Light';
        }
        btnStudioLight.className = state.studioLight
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-blush-soft text-miora-charcoal border border-miora-blush text-xs font-semibold transition-all cursor-pointer'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-miora-cream hover:bg-miora-sand text-miora-charcoal border border-miora-oat text-xs font-medium transition-colors cursor-pointer';
    });

    btnFullscreenCamera?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            stageContainer?.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    });

    // Event Listeners: Live Filter Category Tabs
    const filterCatButtons = document.querySelectorAll('.booth-filter-cat-btn');
    const filterButtons = document.querySelectorAll('.booth-filter-btn');

    filterCatButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.filterCat;
            filterCatButtons.forEach((b) => {
                const active = b.dataset.filterCat === cat;
                b.className = `booth-filter-cat-btn shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    active
                        ? 'bg-miora-charcoal text-miora-ivory'
                        : 'bg-miora-cream text-miora-muted border border-miora-oat hover:border-miora-brown'
                }`;
            });

            filterButtons.forEach((fb) => {
                const match = cat === 'all' || fb.dataset.filterCategory === cat;
                fb.classList.toggle('hidden', !match);
            });
        });
    });

    // Event Listeners: Live Filter Selection
    function selectFilter(filterId, filterName) {
        state.activeFilterId = filterId;
        state.activeFilterName = filterName;
        activeFilterBadge.textContent = `Effect: ${filterName}`;

        filterButtons.forEach((fb) => {
            const isSelected = fb.dataset.filterId === filterId;
            fb.className = `booth-filter-btn group shrink-0 w-28 rounded-2xl p-2 border-2 transition-all text-left cursor-pointer ${
                isSelected
                    ? 'border-miora-charcoal bg-miora-blush-soft/60 shadow-2xs'
                    : 'border-miora-oat bg-miora-cream hover:border-miora-taupe'
            }`;
        });
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            selectFilter(btn.dataset.filterId, btn.dataset.filterName);
        });
    });

    intensitySlider?.addEventListener('input', (e) => {
        state.filterIntensity = Number(e.target.value);
        intensityValue.textContent = `${state.filterIntensity}%`;
    });

    btnResetEffect?.addEventListener('click', () => {
        state.filterIntensity = 100;
        if (intensitySlider) {
            intensitySlider.value = '100';
        }
        if (intensityValue) {
            intensityValue.textContent = '100%';
        }
        selectFilter('original', 'Original');
    });

    // Event Listeners: Capture Mode & Photo Count & Timer
    const modeButtons = document.querySelectorAll('.booth-mode-btn');
    const countButtons = document.querySelectorAll('.booth-count-btn');
    const timerButtons = document.querySelectorAll('.booth-timer-btn');

    function syncModeButtonsUI() {
        modeButtons.forEach((b) => {
            const active = b.dataset.captureMode === state.captureMode;
            b.className = `booth-mode-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                active
                    ? 'bg-miora-charcoal text-miora-ivory shadow-2xs'
                    : 'text-miora-muted hover:text-miora-charcoal'
            }`;
        });

        if (state.captureMode === 'single') {
            stripCountGroup?.classList.add('hidden');
            state.targetPhotoCount = 1;
            shutterBtnLabel.textContent = 'Take Single Photo';
            sessionModePill.textContent = 'Single Photo';
        } else {
            stripCountGroup?.classList.remove('hidden');
            if (state.targetPhotoCount === 1) {
                state.targetPhotoCount = 4;
            }
            shutterBtnLabel.textContent = `Take ${state.targetPhotoCount}-Photo Strip`;
            sessionModePill.textContent = `${state.targetPhotoCount}-Photo Strip`;
        }

        countButtons.forEach((cb) => {
            const active = Number(cb.dataset.photoCount) === state.targetPhotoCount;
            cb.className = `booth-count-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                active
                    ? 'bg-miora-ivory text-miora-charcoal shadow-2xs'
                    : 'text-miora-muted hover:text-miora-charcoal'
            }`;
        });

        if (state.photos.length > state.targetPhotoCount) {
            state.photos = state.photos.slice(0, state.targetPhotoCount);
        }
        renderSessionTray();
    }

    modeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (state.isCapturing) {
                return;
            }
            state.captureMode = btn.dataset.captureMode;
            if (state.captureMode === 'photostrip' && state.targetPhotoCount === 1) {
                state.targetPhotoCount = 4;
            }
            syncModeButtonsUI();
        });
    });

    countButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (state.isCapturing) {
                return;
            }
            state.targetPhotoCount = Number(btn.dataset.photoCount);
            syncModeButtonsUI();
        });
    });

    timerButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (state.isCapturing) {
                return;
            }
            state.countdownSeconds = Number(btn.dataset.countdown);
            timerButtons.forEach((tb) => {
                const active = Number(tb.dataset.countdown) === state.countdownSeconds;
                tb.className = `booth-timer-btn px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    active
                        ? 'bg-miora-ivory text-miora-charcoal shadow-2xs'
                        : 'text-miora-muted hover:text-miora-charcoal'
                }`;
            });
        });
    });

    // Sound Generator for Countdown Beep & Camera Shutter Click (Web Audio API)
    function playStudioTone(freq = 800, duration = 0.08) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                return;
            }
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {
            // Audio not permitted or unsupported
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Countdown & Frame Capture Execution
    async function runSingleCountdownAndCapture(labelText) {
        // Ensure a camera source is active; if neither webcam nor demo is running, auto-enable Virtual Studio Camera
        if (!state.stream && !state.usingDemoCamera) {
            enableDemoCamera();
            await sleep(200);
        }

        progressBanner.textContent = labelText;
        progressBanner.classList.remove('hidden');
        countdownOverlay.classList.remove('hidden');
        countdownMessage.textContent = 'Get ready! Your photo will be taken soon.';

        // Setup buffer for recording authentic Live Photo video frames
        const liveFrames = [];
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 480;
        sampleCanvas.height = 360;
        const sampleCtx = sampleCanvas.getContext('2d');

        for (let sec = state.countdownSeconds; sec >= 1; sec--) {
            countdownNumber.textContent = String(sec);
            playStudioTone(660, 0.07);

            if (sec === 1) {
                // Record pre-shutter live motion (8 frames at ~10 FPS over ~840ms)
                for (let k = 0; k < 8; k++) {
                    sampleCtx.drawImage(canvasEl, 0, 0, 480, 360);
                    liveFrames.push(sampleCanvas.toDataURL('image/jpeg', 0.82));
                    await sleep(105);
                }
            } else {
                await sleep(950);
            }
        }

        countdownOverlay.classList.add('hidden');

        // Trigger Shutter Flash
        playStudioTone(1200, 0.12);
        shutterFlashOverlay.classList.remove('hidden', 'animate-shutter-flash');
        void shutterFlashOverlay.offsetWidth;
        shutterFlashOverlay.classList.add('animate-shutter-flash');
        setTimeout(() => {
            shutterFlashOverlay.classList.add('hidden');
        }, 460);

        // 1. Capture current filtered frame from #booth-canvas in crisp High-Bitrate HD (Main Still Photo)
        const dataUrl = canvasEl.toDataURL('image/jpeg', 0.97);

        // Capture shutter moment for live motion sequence
        sampleCtx.drawImage(canvasEl, 0, 0, 480, 360);
        liveFrames.push(sampleCanvas.toDataURL('image/jpeg', 0.82));

        // 2. Record post-shutter live motion (5 frames at ~10 FPS over ~450ms)
        for (let k = 0; k < 5; k++) {
            await sleep(90);
            sampleCtx.drawImage(canvasEl, 0, 0, 480, 360);
            liveFrames.push(sampleCanvas.toDataURL('image/jpeg', 0.82));
        }

        return {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            dataUrl,
            liveFrames,
            filterId: state.activeFilterId,
            filterName: state.activeFilterName,
            intensity: state.filterIntensity,
            capturedAt: Date.now(),
        };
    }

    // Full Session Capture Sequence
    async function startFullSessionCapture() {
        if (state.isCapturing) {
            return;
        }
        state.isCapturing = true;
        btnCaptureShutter.disabled = true;
        state.photos = [];
        renderSessionTray();

        const total = state.targetPhotoCount;
        for (let i = 0; i < total; i++) {
            const label = total === 1 ? 'Capturing Single Photo' : `Photo ${i + 1} of ${total}`;
            instructionText.textContent = `${label} — Strike a pose!`;
            const captured = await runSingleCountdownAndCapture(label);
            state.photos.push(captured);
            renderSessionTray();
            await persistCurrentPhotos();

            if (i < total - 1) {
                await sleep(550);
            }
        }

        progressBanner.classList.add('hidden');
        instructionText.textContent = 'Session complete! Review your photos on the right, retake any single shot, or continue to the Photo Editor.';
        state.isCapturing = false;
        btnCaptureShutter.disabled = false;
    }

    // Retake a Specific Photo Slot (Without redoing the entire session!)
    async function retakeSingleSlot(slotIndex) {
        if (state.isCapturing) {
            return;
        }
        state.isCapturing = true;
        btnCaptureShutter.disabled = true;

        const label = `Retaking Photo ${slotIndex + 1} of ${state.targetPhotoCount}`;
        instructionText.textContent = `${label} — Get ready!`;
        const captured = await runSingleCountdownAndCapture(label);
        state.photos[slotIndex] = captured;

        progressBanner.classList.add('hidden');
        instructionText.textContent = `Photo #${slotIndex + 1} updated! Ready to continue to Photo Editor.`;
        state.isCapturing = false;
        btnCaptureShutter.disabled = false;

        renderSessionTray();
        await persistCurrentPhotos();
    }

    async function persistCurrentPhotos() {
        const existing = (await loadSession()) || {};
        const editorState =
            existing.editorState || getDefaultEditorState(state.targetPhotoCount, preselectedFrame);

        if (state.targetPhotoCount === 1) {
            editorState.layoutId = 'single';
        } else if (state.targetPhotoCount === 2) {
            editorState.layoutId = 'strip-2';
        } else if (state.targetPhotoCount === 3) {
            editorState.layoutId = 'strip-3';
        } else if (state.targetPhotoCount === 4 && editorState.layoutId !== 'grid-4') {
            editorState.layoutId = 'strip-4';
        }

        if (preselectedFrame) {
            editorState.frameId = preselectedFrame;
        }

        await saveSession({
            photos: state.photos,
            captureMode: state.captureMode,
            targetPhotoCount: state.targetPhotoCount,
            editorState,
        });
    }

    // Render Captured Photos Tray & Individual Retake Buttons
    function renderSessionTray() {
        if (!capturedPhotosGrid) {
            return;
        }
        capturedPhotosGrid.innerHTML = '';

        const total = state.targetPhotoCount;
        const capturedCount = state.photos.filter(Boolean).length;
        trayStatusSubtitle.textContent = `${capturedCount} of ${total} photo${total > 1 ? 's' : ''} captured`;

        for (let i = 0; i < total; i++) {
            const photo = state.photos[i];
            const slotEl = document.createElement('div');

            if (photo) {
                slotEl.className =
                    'group relative rounded-2xl overflow-hidden bg-miora-charcoal border-2 border-miora-taupe aspect-4/3 shadow-xs';
                slotEl.innerHTML = `
                    <img src="${photo.dataUrl}" alt="Captured photo ${i + 1}" class="w-full h-full object-cover cursor-pointer" data-inspect-idx="${i}" />
                    <div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/65 text-miora-ivory text-[10px] font-semibold">
                        #${i + 1} • ${photo.filterName}
                    </div>
                    <div class="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
                        <button type="button" data-inspect-idx="${i}" class="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-miora-charcoal text-[10px] font-semibold shadow-xs cursor-pointer">
                            View
                        </button>
                        <button type="button" data-retake-idx="${i}" class="px-2.5 py-1 rounded-lg bg-miora-blush hover:bg-miora-ivory text-miora-charcoal text-[10px] font-semibold shadow-xs cursor-pointer">
                            ↻ Retake #${i + 1}
                        </button>
                    </div>
                `;
            } else {
                slotEl.className =
                    'rounded-2xl border-2 border-dashed border-miora-oat bg-miora-cream aspect-4/3 flex flex-col items-center justify-center p-3 text-center';
                slotEl.innerHTML = `
                    <span class="w-7 h-7 rounded-full bg-miora-sand text-miora-muted text-xs font-semibold flex items-center justify-center mb-1">
                        ${i + 1}
                    </span>
                    <span class="text-[11px] text-miora-muted">Photo ${i + 1} of ${total}</span>
                `;
            }

            capturedPhotosGrid.appendChild(slotEl);
        }

        // Bind Individual Retake & Inspect events
        capturedPhotosGrid.querySelectorAll('[data-retake-idx]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = Number(btn.dataset.retakeIdx);
                retakeSingleSlot(idx);
            });
        });

        capturedPhotosGrid.querySelectorAll('[data-inspect-idx]').forEach((el) => {
            el.addEventListener('click', () => {
                const idx = Number(el.dataset.inspectIdx);
                const photo = state.photos[idx];
                if (!photo) {
                    return;
                }
                state.inspectIndex = idx;
                inspectModalTitle.textContent = `Photo #${idx + 1} (${photo.filterName})`;
                inspectModalImg.src = photo.dataUrl;
                inspectModal.classList.remove('hidden');
            });
        });

        const sessionComplete = capturedCount >= total && total > 0;
        btnContinueEditor.disabled = !sessionComplete;
        btnRetakeAll.disabled = capturedCount === 0;
    }

    // Shutter & Session Buttons
    btnCaptureShutter?.addEventListener('click', () => startFullSessionCapture());

    btnRetakeAll?.addEventListener('click', () => {
        if (state.isCapturing) {
            return;
        }
        startFullSessionCapture();
    });

    btnContinueEditor?.addEventListener('click', async () => {
        await persistCurrentPhotos();
        window.location.href = editorUrl;
    });

    // Lightbox Inspect Modal Controls
    const closeInspect = () => {
        inspectModal?.classList.add('hidden');
        state.inspectIndex = null;
    };
    btnCloseInspect?.addEventListener('click', closeInspect);
    btnInspectDone?.addEventListener('click', closeInspect);
    btnInspectRetake?.addEventListener('click', () => {
        const idx = state.inspectIndex;
        closeInspect();
        if (idx !== null) {
            retakeSingleSlot(idx);
        }
    });
}

/**
 * Renders an animated charming Virtual Studio Camera scene when no hardware webcam is attached
 */
function drawAnimatedDemoCameraFrame(canvas, tick) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const t = tick * 0.035;

    // Warm aesthetic studio backdrop
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#FCEEF2');
    grad.addColorStop(0.5, '#FAF7F2');
    grad.addColorStop(1, '#EDF4FC');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft floating pastel bokeh circles
    ctx.fillStyle = 'rgba(242, 184, 198, 0.35)';
    ctx.beginPath();
    ctx.arc(220 + Math.sin(t) * 35, 190 + Math.cos(t * 0.8) * 25, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(167, 199, 231, 0.35)';
    ctx.beginPath();
    ctx.arc(740 + Math.cos(t * 0.9) * 35, 220 + Math.sin(t) * 25, 125, 0, Math.PI * 2);
    ctx.fill();

    // Animated character subject in studio
    const bobY = Math.sin(t * 1.4) * 8;
    const tilt = Math.sin(t * 0.7) * 0.04;

    ctx.save();
    ctx.translate(w / 2, h / 2 + bobY);
    ctx.rotate(tilt);

    // Shoulders
    ctx.fillStyle = '#D97B93';
    ctx.beginPath();
    ctx.arc(0, 340, 220, Math.PI, 0, false);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3B2B20';
    ctx.beginPath();
    ctx.arc(0, -20, 132, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#FFE8D6';
    ctx.beginPath();
    ctx.arc(0, -10, 104, 0, Math.PI * 2);
    ctx.fill();

    // Blush cheeks
    ctx.fillStyle = 'rgba(242, 140, 165, 0.5)';
    ctx.beginPath();
    ctx.arc(-55, 12, 20, 0, Math.PI * 2);
    ctx.arc(55, 12, 20, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (blink periodically)
    const isBlinking = Math.sin(t * 1.8) > 0.94;
    ctx.fillStyle = '#2B2625';
    ctx.strokeStyle = '#2B2625';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (isBlinking) {
        ctx.beginPath();
        ctx.moveTo(-52, -18);
        ctx.lineTo(-28, -18);
        ctx.moveTo(28, -18);
        ctx.lineTo(52, -18);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(-40, -20, 9, 0, Math.PI * 2);
        ctx.arc(40, -20, 9, 0, Math.PI * 2);
        ctx.fill();
    }

    // Smile
    ctx.beginPath();
    ctx.arc(0, 6, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.restore();
}

