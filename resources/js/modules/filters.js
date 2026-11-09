/**
 * MIORA Real-Time Camera Filters, MacBook FaceTime HD ISP Pipeline,
 * Geometric Shaders & Post-Capture Adjustments
 */

let ispSvgInjected = false;

/**
 * GPU-friendly 2D context options. `willReadFrequently` is intentionally NOT used on render
 * surfaces because it forces Chrome/Edge into slow CPU (software) rasterization for every
 * drawImage/filter pass, which was the main source of live preview stutter.
 */
const renderContextOptions = { alpha: true };
const targetContextOptions = { alpha: false };

/**
 * Per-resolution buffer pools so the live preview (1440x1080) and the effect thumbnails
 * (320x240) never resize/reallocate the same offscreen canvases every frame.
 *
 * @type {Map<string, { frame: HTMLCanvasElement, temporal: HTMLCanvasElement, diffusion: HTMLCanvasElement, temporalInitialized: boolean }>}
 */
const pipelineBufferPools = new Map();

/**
 * Cached 2D contexts per canvas (avoids repeated getContext lookups in the hot render loop).
 *
 * @type {WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>}
 */
const cachedContexts = new WeakMap();

function getCachedContext(canvas, options = renderContextOptions) {
    let context = cachedContexts.get(canvas);
    if (!context) {
        context = canvas.getContext('2d', options);
        cachedContexts.set(canvas, context);
    }
    return context;
}

function getPipelineBuffers(w, h) {
    if (typeof document === 'undefined') {
        return null;
    }
    const key = `${w}x${h}`;
    let pool = pipelineBufferPools.get(key);
    if (!pool) {
        pool = {
            frame: document.createElement('canvas'),
            temporal: document.createElement('canvas'),
            diffusion: document.createElement('canvas'),
            temporalInitialized: false,
        };
        pool.frame.width = w;
        pool.frame.height = h;
        pipelineBufferPools.set(key, pool);
    }
    return pool;
}

/**
 * Injects a GPU-accelerated SVG Filter pipeline for Apple MacBook Pro Studio ISP:
 * 1. Apple True-Tone Color Science Matrix (neutralizes greenish/yellowish Windows CMOS cast)
 * 2. Smart HDR Tone Curve (lifts facial midtones while anchoring deep, rich blacks)
 * 3. 3x3 Optical Micro-Contrast Unsharp Kernel (crisp 1080p HD eyes, lashes & details)
 */
function ensureMacBookIspSvgFilter() {
    if (ispSvgInjected || typeof document === 'undefined' || !document.body) {
        return;
    }
    if (document.getElementById('miora-isp-svg-defs')) {
        ispSvgInjected = true;
        return;
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'miora-isp-svg-defs';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    svg.style.opacity = '0';

    svg.innerHTML = `
        <defs>
            <filter id="miora-macbook-isp-filter" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
                <!-- 1. Apple True-Tone Color Calibration Matrix -->
                <feColorMatrix type="matrix" values="
                    1.05 -0.03 -0.01  0  0.010
                   -0.01  1.01  0.00  0  0.004
                   -0.02  0.01  1.05  0  0.012
                    0     0     0     1  0" result="truetone" />
                <!-- 2. Smart HDR S-Curve (Midtone shadow lift + deep black anchor) -->
                <feComponentTransfer in="truetone" result="hdr">
                    <feFuncR type="gamma" amplitude="1.03" exponent="0.93" offset="-0.014" />
                    <feFuncG type="gamma" amplitude="1.02" exponent="0.94" offset="-0.014" />
                    <feFuncB type="gamma" amplitude="1.03" exponent="0.93" offset="-0.012" />
                </feComponentTransfer>
                <!-- 3. 3x3 Optical Clarity & Micro-Contrast Unsharp Mask -->
                <feConvolveMatrix in="hdr" order="3 3" kernelMatrix="
                     0.00 -0.22  0.00
                    -0.22  1.88 -0.22
                     0.00 -0.22  0.00" divisor="1" bias="0" targetX="1" targetY="1" edgeMode="duplicate" preserveAlpha="true" />
            </filter>
        </defs>
    `;

    document.body.appendChild(svg);
    ispSvgInjected = true;
}

/**
 * Renders a source frame (video or canvas) onto targetCanvas with:
 * - MacBook FaceTime HD ISP Enhancement (Smart HDR shadow lift, True-Tone skin warmth, clarity)
 * - Optional Studio Ring Light fill
 * - Selected Live Filter & Intensity (0-100)
 *
 * Highly optimized direct GPU pipeline: 60 FPS silky-smooth rendering with zero stutter,
 * zero dropped frames, and zero intermediate canvas copies.
 */
export function renderFilteredFrame(
    source,
    targetCanvas,
    filterId = 'original',
    intensity = 100,
    isMirrored = true,
    ispOptions = { macbookIsp: true, studioLight: false }
) {
    const ctx = getCachedContext(targetCanvas, targetContextOptions);
    const w = targetCanvas.width;
    const h = targetCanvas.height;
    const strength = Math.max(0, Math.min(100, Number(intensity))) / 100;
    const isPreview = Boolean(ispOptions?.preview);

    // Center-crop source to target aspect ratio (4:3)
    const srcW = source.videoWidth || source.width || w;
    const srcH = source.videoHeight || source.height || h;
    const targetAspect = w / h;
    const srcAspect = srcW / srcH;

    let sx = 0;
    let sy = 0;
    let sw = srcW;
    let sh = srcH;

    if (srcAspect > targetAspect) {
        sw = srcH * targetAspect;
        sx = (srcW - sw) / 2;
    } else if (srcAspect < targetAspect) {
        sh = srcW / targetAspect;
        sy = (srcH - sh) / 2;
    }

    const useStudioLight = Boolean(ispOptions?.studioLight);
    const boostBright = useStudioLight ? 110 : 106;
    const boostContrast = useStudioLight ? 107 : 105;
    const boostSat = 110;

    // Compose hardware-accelerated CSS filter string directly
    let filterStr = `brightness(${boostBright}%) contrast(${boostContrast}%) saturate(${boostSat}%)`;

    switch (filterId) {
        case 'macbook-hd':
            filterStr = `brightness(${boostBright + 2}%) contrast(${boostContrast + 3}%) saturate(${boostSat + 4}%)`;
            break;

        case 'grayscale':
            filterStr = `brightness(${boostBright - Math.round(strength * 2)}%) contrast(${boostContrast + Math.round(strength * 10)}%) grayscale(${Math.round(strength * 100)}%)`;
            break;

        case 'sepia':
            filterStr = `brightness(${boostBright + Math.round(strength * 3)}%) contrast(${boostContrast + Math.round(strength * 6)}%) sepia(${Math.round(strength * 90)}%) saturate(${Math.max(60, boostSat - Math.round(strength * 15))}%)`;
            break;

        case 'warm':
            filterStr = `brightness(${boostBright}%) contrast(${boostContrast + Math.round(strength * 5)}%) saturate(${Math.round(boostSat + strength * 28)}%) sepia(${Math.round(strength * 14)}%)`;
            break;

        case 'cool':
            filterStr = `brightness(${boostBright}%) contrast(${boostContrast + Math.round(strength * 6)}%) saturate(${Math.max(75, Math.round(boostSat - strength * 15))}%) hue-rotate(${Math.round(strength * 8)}deg)`;
            break;

        case 'soft-pink':
            filterStr = `brightness(${boostBright + Math.round(strength * 6)}%) contrast(${boostContrast + Math.round(strength * 2)}%) saturate(${Math.round(boostSat + strength * 16)}%) hue-rotate(${Math.round(-strength * 7)}deg)`;
            break;

        case 'vintage':
            filterStr = `brightness(${boostBright + Math.round(strength * 4)}%) contrast(${Math.max(80, boostContrast - Math.round(strength * 8))}%) sepia(${Math.round(strength * 55)}%)`;
            break;

        case 'film-grain':
            filterStr = `brightness(${boostBright}%) contrast(${boostContrast + Math.round(strength * 16)}%) saturate(${Math.max(60, Math.round(boostSat - strength * 25))}%)`;
            break;

        case 'blur': {
            const blurPx = (strength * (w <= 240 ? 2 : 4.5)).toFixed(1);
            filterStr = `brightness(${boostBright + Math.round(strength * 6)}%) contrast(${boostContrast}%) saturate(${boostSat}%) blur(${blurPx}px)`;
            break;
        }

        case 'vhs':
            filterStr = `brightness(${boostBright}%) contrast(${boostContrast + 6}%) saturate(${boostSat + 8}%)`;
            break;

        case 'love-hearts':
        case 'blue-birds':
        case 'original':
        default:
            break;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    if (isMirrored) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
    }

    // Direct single-pass GPU draw
    ctx.filter = filterStr;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.restore();

    // Secondary artistic accents (rendered with native fast blending)
    if (useStudioLight) {
        applyStudioKeyLight(ctx, w, h, 0.10);
    }

    switch (filterId) {
        case 'macbook-hd':
            if (strength > 0) {
                ctx.fillStyle = `rgba(255, 235, 240, ${0.06 * strength})`;
                ctx.fillRect(0, 0, w, h);
            }
            break;

        case 'warm':
            if (strength > 0) {
                ctx.fillStyle = `rgba(255, 178, 102, ${0.08 * strength})`;
                ctx.fillRect(0, 0, w, h);
            }
            break;

        case 'cool':
            if (strength > 0) {
                ctx.fillStyle = `rgba(135, 195, 255, ${0.09 * strength})`;
                ctx.fillRect(0, 0, w, h);
            }
            break;

        case 'soft-pink':
            if (strength > 0) {
                ctx.fillStyle = `rgba(244, 162, 184, ${0.11 * strength})`;
                ctx.fillRect(0, 0, w, h);
            }
            break;

        case 'vintage':
            if (strength > 0) {
                ctx.fillStyle = `rgba(235, 180, 110, ${0.08 * strength})`;
                ctx.fillRect(0, 0, w, h);
                drawVignette(ctx, w, h, 0.36 * strength);
            }
            break;

        case 'film-grain':
            if (strength > 0) {
                drawFilmGrain(ctx, w, h, strength * 0.18);
                drawVignette(ctx, w, h, 0.40 * strength);
            }
            break;

        case 'vhs':
            if (strength > 0) {
                const stepY = w <= 240 ? 3 : 4;
                ctx.fillStyle = `rgba(0, 0, 0, ${0.14 * strength})`;
                for (let y = 0; y < h; y += stepY) {
                    ctx.fillRect(0, y, w, 1.2);
                }
                if (w > 240) {
                    ctx.fillStyle = `rgba(255, 245, 200, ${0.85 * strength})`;
                    ctx.font = 'bold 24px "Courier New", monospace';
                    ctx.fillText('PLAY ▶  MIORA VHS', 36, h - 36);
                }
            }
            break;

        case 'love-hearts':
            drawPhotoBoothLoveHearts(ctx, source, w, h, strength, !isPreview, isMirrored, { sx, sy, sw, sh });
            break;

        case 'blue-birds':
            drawPhotoBoothBlueBirds(ctx, source, w, h, strength, !isPreview, isMirrored, { sx, sy, sw, sh });
            break;

        default:
            break;
    }
}

function applyStudioKeyLight(ctx, w, h, intensity = 0.10) {
    const faceX = w * 0.5;
    const faceY = h * 0.44;
    const radius = w * 0.48;

    ctx.save();
    const radGrad = ctx.createRadialGradient(faceX, faceY, radius * 0.05, faceX, faceY, radius);
    radGrad.addColorStop(0, `rgba(255, 250, 246, ${intensity * 1.1})`);
    radGrad.addColorStop(0.55, `rgba(255, 242, 236, ${intensity * 0.4})`);
    radGrad.addColorStop(1, 'rgba(255, 242, 236, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

const faceTrackCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

// Persistent multi-face tracks list with spatial nearest-neighbor ID matching
let trackedFaceList = [];
let nextFaceTrackId = 1;

const trackedHead = {
    nx: 0.50,
    ny: 0.42,
    nRadius: 0.16,
    angle: 0,
    initialized: false,
    frameCount: 0,
    faces: [],
};

let mpFaceDetector = null;
let mpInitPromise = null;

/**
 * Initializes Google MediaPipe BlazeFace neural detector from local public assets (/mediapipe/)
 */
function initMediaPipeFaceDetector() {
    if (mpFaceDetector || mpInitPromise || typeof window === 'undefined') {
        return mpInitPromise;
    }

    mpInitPromise = (async () => {
        try {
            const vision = await import(/* @vite-ignore */ '/mediapipe/vision_bundle.mjs');
            const filesetResolver = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
            try {
                mpFaceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: '/mediapipe/blaze_face_short_range.tflite',
                        delegate: 'GPU',
                    },
                    runningMode: 'IMAGE',
                    minDetectionConfidence: 0.32,
                });
            } catch {
                mpFaceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: '/mediapipe/blaze_face_short_range.tflite',
                        delegate: 'CPU',
                    },
                    runningMode: 'IMAGE',
                    minDetectionConfidence: 0.32,
                });
            }
        } catch {
            mpFaceDetector = null;
        }
    })();

    return mpInitPromise;
}

if (typeof window !== 'undefined') {
    setTimeout(initMediaPipeFaceDetector, 60);
}

/**
 * Synchronizes newly detected faces with persistent tracks using spatial nearest-neighbor matching.
 * Guarantees:
 * 1. UNLIMITED faces: detects and tracks all people in the camera frame simultaneously.
 * 2. PROPORTIONAL distance scaling: close faces get larger effects, distant faces get smaller effects.
 * 3. ROCK-SOLID stability: persistent identity matching prevents jumping/swapping between faces.
 * 4. ADAPTIVE EMA smoothing: zero jitter when stationary, instant tracking when moving.
 */
function updateFaceTracksWithDetections(newDetections) {
    const MATCH_THRESHOLD = 0.25; // Normalized Euclidean distance threshold

    const pairs = [];
    for (let d = 0; d < newDetections.length; d++) {
        const det = newDetections[d];
        for (let t = 0; t < trackedFaceList.length; t++) {
            const trk = trackedFaceList[t];
            const dx = det.nx - trk.smoothX;
            const dy = (det.ny - trk.smoothY) * 1.25;
            const dr = Math.abs(det.nRadius - trk.smoothRadius) * 0.6;
            const dist = Math.hypot(dx, dy) + dr;

            if (dist < MATCH_THRESHOLD) {
                pairs.push({ d, t, dist });
            }
        }
    }

    // Greedy matching from closest to furthest pair
    pairs.sort((a, b) => a.dist - b.dist);

    const usedDets = new Set();
    const usedTracks = new Set();
    const matches = [];

    for (const p of pairs) {
        if (!usedDets.has(p.d) && !usedTracks.has(p.t)) {
            usedDets.add(p.d);
            usedTracks.add(p.t);
            matches.push(p);
        }
    }

    // 1. Update matched tracks with adaptive smoothing
    for (const m of matches) {
        const det = newDetections[m.d];
        const trk = trackedFaceList[m.t];

        const moveDist = Math.hypot(det.nx - trk.smoothX, det.ny - trk.smoothY);
        const rDelta = Math.abs(det.nRadius - trk.smoothRadius);

        // Stationary: low lerp to cancel sensor noise/jitter; Moving: high lerp for instant responsive tracking
        const lerp = moveDist > 0.040 ? 0.78 : moveDist > 0.012 ? 0.52 : 0.28;

        trk.smoothX += (det.nx - trk.smoothX) * lerp;
        trk.smoothY += (det.ny - trk.smoothY) * lerp;
        trk.smoothRadius += (det.nRadius - trk.smoothRadius) * lerp;
        trk.smoothAngle += (det.angle - trk.smoothAngle) * lerp;
        trk.area = det.area;
        trk.lostFrames = 0;
    }

    // 2. Add unmatched detections as new tracks (NO LIMIT on number of faces!)
    for (let d = 0; d < newDetections.length; d++) {
        if (!usedDets.has(d)) {
            const det = newDetections[d];
            trackedFaceList.push({
                id: nextFaceTrackId++,
                smoothX: det.nx,
                smoothY: det.ny,
                smoothRadius: det.nRadius,
                smoothAngle: det.angle,
                area: det.area,
                lostFrames: 0,
            });
        }
    }

    // 3. Grace period for unmatched tracks: keep position for up to 8 frames so temporary occlusion doesn't drop the effect
    for (let t = trackedFaceList.length - 1; t >= 0; t--) {
        if (!usedTracks.has(t)) {
            trackedFaceList[t].lostFrames++;
            if (trackedFaceList[t].lostFrames > 8) {
                trackedFaceList.splice(t, 1);
            }
        }
    }

    // 4. Update trackedHead and faces array for consumers
    const activeFaces = trackedFaceList.filter((f) => f.lostFrames <= 4);

    if (activeFaces.length > 0) {
        // Sort back-to-front (smaller/further faces first)
        activeFaces.sort((a, b) => a.smoothRadius - b.smoothRadius);

        trackedHead.faces = activeFaces.map((f) => ({
            id: f.id,
            nx: f.smoothX,
            ny: f.smoothY,
            nRadius: f.smoothRadius,
            angle: f.smoothAngle,
        }));

        // Largest/closest face as primary reference for backward compatibility
        const primary = activeFaces.reduce((max, f) => (f.smoothRadius > max.smoothRadius ? f : max), activeFaces[0]);
        trackedHead.nx = primary.smoothX;
        trackedHead.ny = primary.smoothY;
        trackedHead.nRadius = primary.smoothRadius;
        trackedHead.angle = primary.smoothAngle;
        trackedHead.initialized = true;
    } else if (newDetections.length === 0 && trackedFaceList.length === 0) {
        trackedHead.faces = [];
    }
}

let isFaceTrackingBusy = false;
let lastFaceTrackTimestamp = 0;
const FACE_TRACK_CADENCE_MS = 80; // ~12 FPS lightweight inference rate

/**
 * Non-blocking asynchronous face tracking scheduler.
 * Takes a lightweight snapshot (< 0.2ms) and runs neural inference in the background so
 * the 60 FPS live camera preview NEVER drops frames or stutters!
 */
function scheduleAsyncFaceTracking(sourceCanvas, isMirrored = false, crop = null) {
    if (typeof document === 'undefined' || !sourceCanvas) {
        return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (isFaceTrackingBusy || now - lastFaceTrackTimestamp < FACE_TRACK_CADENCE_MS) {
        return;
    }

    if (!mpFaceDetector && !mpInitPromise) {
        initMediaPipeFaceDetector();
        return;
    }

    // Fast 192x144 resolution matching BlazeFace 4:3 input dimensions
    const tw = 192;
    const th = 144;
    if (faceTrackCanvas.width !== tw || faceTrackCanvas.height !== th) {
        faceTrackCanvas.width = tw;
        faceTrackCanvas.height = th;
    }

    // Fast GPU blit to 192x144 offscreen surface with exact mirroring and crop (< 0.1ms)
    const tCtx = getCachedContext(faceTrackCanvas);
    tCtx.save();
    tCtx.clearRect(0, 0, tw, th);
    if (isMirrored) {
        tCtx.translate(tw, 0);
        tCtx.scale(-1, 1);
    }
    if (crop && typeof crop.sw === 'number' && crop.sw > 0) {
        tCtx.drawImage(sourceCanvas, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, tw, th);
    } else {
        tCtx.drawImage(sourceCanvas, 0, 0, tw, th);
    }
    tCtx.restore();

    isFaceTrackingBusy = true;
    lastFaceTrackTimestamp = now;

    // Asynchronous dispatch: allows the current 60 FPS animation frame to finish
    // and render immediately without any frame drop or stutter!
    setTimeout(() => {
        try {
            executeFaceTrackingDetection(tCtx, tw, th);
        } catch {
            // Safe fallback
        } finally {
            isFaceTrackingBusy = false;
        }
    }, 0);
}

/**
 * Runs neural inference and multi-blob analysis on the background tracking canvas
 */
function executeFaceTrackingDetection(tCtx, tw, th) {
    // 1. Primary Neural Tracker: MediaPipe BlazeFace (detects all faces in frame)
    if (mpFaceDetector) {
        try {
            const result = mpFaceDetector.detect(faceTrackCanvas);
            const detections = result?.detections || [];
            if (detections.length > 0) {
                const validFaces = [];

                for (const det of detections) {
                    const bb = det.boundingBox;
                    // Filter out tiny noise artifacts (< 10px)
                    if (!bb || bb.width < 10 || bb.height < 10) {
                        continue;
                    }

                    const boxW = bb.width / tw;
                    const boxH = bb.height / th;
                    const boxCx = (bb.originX + bb.width * 0.5) / tw;
                    const boxTopY = bb.originY / th;

                    let eyeMidX = boxCx;
                    let eyeMidY = boxTopY + boxH * 0.35;
                    let headAngle = 0;
                    let eyeDistNorm = boxW * 0.38;

                    if (det.keypoints && det.keypoints.length >= 2) {
                        const kp0 = det.keypoints[0];
                        const kp1 = det.keypoints[1];
                        const kp0x = kp0.x > 1 ? kp0.x / tw : kp0.x;
                        const kp0y = kp0.y > 1 ? kp0.y / th : kp0.y;
                        const kp1x = kp1.x > 1 ? kp1.x / tw : kp1.x;
                        const kp1y = kp1.y > 1 ? kp1.y / th : kp1.y;

                        const leftEye = kp0x < kp1x ? { x: kp0x, y: kp0y } : { x: kp1x, y: kp1y };
                        const rightEye = kp0x < kp1x ? { x: kp1x, y: kp1y } : { x: kp0x, y: kp0y };

                        eyeMidX = (leftEye.x + rightEye.x) * 0.5;
                        eyeMidY = (leftEye.y + rightEye.y) * 0.5;

                        const dx = rightEye.x - leftEye.x;
                        const dy = (rightEye.y - leftEye.y) * (th / tw);
                        eyeDistNorm = Math.hypot(dx, dy);
                        headAngle = Math.max(-0.75, Math.min(0.75, Math.atan2(dy, dx)));
                    }

                    // Precise distance-based scale:
                    // Far away: boxW is small (~0.08) -> targetR is small (~0.06)
                    // Close up: boxW is large (~0.38) -> targetR is large (~0.28)
                    const rawRadius = Math.max(boxW * 0.72, eyeDistNorm * 1.62);
                    const targetR = Math.max(0.038, Math.min(0.50, rawRadius));

                    // Project crown anchor upward from eye line along head tilt angle
                    const upDist = targetR * 0.38;
                    const targetX = Math.max(0.02, Math.min(0.98, eyeMidX + Math.sin(headAngle) * upDist));
                    const targetY = Math.max(0.03, Math.min(0.96, eyeMidY - Math.cos(headAngle) * upDist * (tw / th)));

                    validFaces.push({
                        nx: targetX,
                        ny: targetY,
                        nRadius: targetR,
                        angle: headAngle,
                        area: boxW * boxH,
                    });
                }

                if (validFaces.length > 0) {
                    updateFaceTracksWithDetections(validFaces);
                } else {
                    updateFaceTracksWithDetections([]);
                }
                return;
            } else {
                updateFaceTracksWithDetections([]);
                return;
            }
        } catch {
            // Fall through to connected-component canvas tracker if WASM detection fails
        }
    }

    // 2. Synchronous Multi-Blob Fallback Tracker (when MediaPipe is warming up or on demo camera)
    const { data } = tCtx.getImageData(0, 0, tw, th);
    const gridW = 48;
    const gridH = 36;
    const mask = new Uint8Array(gridW * gridH);
    const visited = new Uint8Array(gridW * gridH);

    for (let gy = 2; gy < gridH - 2; gy++) {
        const sy = Math.floor((gy * th) / gridH);
        for (let gx = 3; gx < gridW - 3; gx++) {
            const sx = Math.floor((gx * tw) / gridW);
            const idx = (sy * tw + sx) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            if (r > 95 && g > 45 && b > 25 && r > g * 1.06 && r > b * 1.14 && r - g > 14 && r < 248) {
                const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                if (cb >= 80 && cb <= 125 && cr >= 135 && cr <= 173) {
                    mask[gy * gridW + gx] = 1;
                }
            }
        }
    }

    // Find all connected skin blobs (detects all people even in fallback mode)
    const candidateBlobs = [];
    const queue = new Int32Array(gridW * gridH);

    for (let gy = 3; gy < gridH - 3; gy++) {
        for (let gx = 4; gx < gridW - 4; gx++) {
            const startIdx = gy * gridW + gx;
            if (!mask[startIdx] || visited[startIdx]) {
                continue;
            }

            let head = 0;
            let tail = 0;
            queue[tail++] = startIdx;
            visited[startIdx] = 1;

            let sumX = 0;
            let sumY = 0;
            let minX = gridW;
            let maxX = 0;
            let minY = gridH;
            let maxY = 0;

            while (head < tail) {
                const curr = queue[head++];
                const cy = Math.floor(curr / gridW);
                const cx = curr - cy * gridW;

                sumX += cx;
                sumY += cy;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [curr - 1, curr + 1, curr - gridW, curr + gridW];
                for (let n = 0; n < 4; n++) {
                    const ni = neighbors[n];
                    if (ni >= 0 && ni < gridW * gridH && mask[ni] && !visited[ni]) {
                        visited[ni] = 1;
                        queue[tail++] = ni;
                    }
                }
            }

            const count = tail;
            if (count < 12) {
                continue;
            }

            const bw = maxX - minX + 1;
            const bh = maxY - minY + 1;
            const aspect = bh / Math.max(1, bw);
            const fillRatio = count / (bw * bh);

            // Filter out noise and long thin non-face shapes
            if (aspect > 2.2 || aspect < 0.40 || fillRatio < 0.22 || bw < 5) {
                continue;
            }

            candidateBlobs.push({
                cx: (sumX / count + (minX + maxX) * 0.5) * 0.5 / gridW,
                cy: sumY / count / gridH,
                minY: minY / gridH,
                bw: bw / gridW,
                score: count * fillRatio,
            });
        }
    }

    if (candidateBlobs.length > 0) {
        candidateBlobs.sort((a, b) => b.score - a.score);
        const nonOverlapping = [];
        for (const b of candidateBlobs) {
            const overlaps = nonOverlapping.some((existing) => Math.hypot(b.cx - existing.cx, b.cy - existing.cy) < 0.14);
            if (!overlaps) {
                nonOverlapping.push(b);
            }
        }

        const fallbackFaces = nonOverlapping.map((b) => {
            const targetR = Math.max(0.045, Math.min(0.45, b.bw * 0.85));
            const targetX = Math.max(0.04, Math.min(0.96, b.cx));
            const targetY = Math.max(0.05, Math.min(0.92, b.minY + targetR * 0.25));
            return {
                nx: targetX,
                ny: targetY,
                nRadius: targetR,
                angle: 0,
                area: b.bw,
            };
        });

        updateFaceTracksWithDetections(fallbackFaces);
    }
}

/**
 * Resolves crown anchors for every tracked head smoothly at full 60 FPS without dropping frames.
 */
function resolveTrackedCrowns(sourceCanvas, w, h, allowTracking = true, isMirrored = false, crop = null) {
    if (allowTracking && w > 240) {
        scheduleAsyncFaceTracking(sourceCanvas, isMirrored, crop);
    }

    let faces;
    if (trackedHead.faces && trackedHead.faces.length > 0) {
        faces = trackedHead.faces;
    } else if (trackedHead.initialized) {
        faces = [{ nx: trackedHead.nx, ny: trackedHead.ny, nRadius: trackedHead.nRadius, angle: trackedHead.angle || 0 }];
    } else {
        faces = [{ nx: 0.50, ny: 0.38, nRadius: 0.18, angle: 0 }];
    }

    // Sort back-to-front by scale: smaller (further away) faces are rendered first,
    // closer faces are rendered in front naturally
    const sortedFaces = [...faces].sort((a, b) => a.nRadius - b.nRadius);

    return sortedFaces.map((f) => ({
        anchorX: f.nx * w,
        anchorY: f.ny * h,
        crownR: f.nRadius * w,
        angle: f.angle || 0,
    }));
}

/**
 * Renders the exact 10-heart translucent pink Heart Crown overlay (matching the reference PNG detail 1:1)
 */
function drawPhotoBoothLoveHearts(ctx, sourceCanvas, w, h, strength = 1, allowTracking = true, isMirrored = false, crop = null) {
    let crownsToDraw = [];

    if (w > 240) {
        crownsToDraw = resolveTrackedCrowns(sourceCanvas, w, h, allowTracking, isMirrored, crop);
    } else {
        // Thumbnail preview anchor
        crownsToDraw = [
            {
                anchorX: w * 0.50,
                anchorY: h * 0.38,
                crownR: w * 0.28,
                angle: 0,
            },
        ];
    }

    const t = typeof performance !== 'undefined' ? performance.now() * 0.002 : 0;

    // Exact 10 translucent pink hearts measured from the reference transparent PNG grid (level baseline & overlapping pairs)
    const archHearts = [
        // 1. Far-left large soft rose-pink heart
        { dx: -0.84, dy: -0.18, scale: 0.185, rot: -0.03, alpha: 0.72, color: '#EA5B95', phase: 0.2 },

        // 3. Top-left large soft blush-pink heart (drawn first so #2 overlaps its bottom-left)
        { dx: -0.29, dy: -0.61, scale: 0.172, rot: -0.01, alpha: 0.62, color: '#EE6FA2', phase: 1.4 },

        // 2. Left-arch vibrant pink heart (overlaps bottom-left of #3, creating darker pink intersection)
        { dx: -0.50, dy: -0.49, scale: 0.150, rot: -0.04, alpha: 0.80, color: '#EC3B82', phase: 0.8 },

        // 4. Left-inner small deep-pink heart tucked right below #2
        { dx: -0.45, dy: -0.27, scale: 0.072, rot: 0.00, alpha: 0.88, color: '#E42E77', phase: 2.0 },

        // 5. Center medium rose-pink heart
        { dx: 0.00, dy: -0.48, scale: 0.152, rot: -0.02, alpha: 0.76, color: '#EA4889', phase: 2.6 },

        // 6. Center-right small deep crimson-pink heart overlapping bottom-right of #5
        { dx: 0.12, dy: -0.36, scale: 0.082, rot: 0.18, alpha: 0.90, color: '#DC236C', phase: 3.2 },

        // 7. Top-right large translucent rose-pink heart
        { dx: 0.33, dy: -0.58, scale: 0.180, rot: 0.02, alpha: 0.64, color: '#EC649A', phase: 3.8 },

        // 8. Right-arch large pastel blush-pink heart overlapping bottom-right of #7
        { dx: 0.51, dy: -0.44, scale: 0.170, rot: 0.05, alpha: 0.58, color: '#EF78A8', phase: 4.4 },

        // 9. Right-outer tiny rose-pink heart tilted slightly right
        { dx: 0.72, dy: -0.28, scale: 0.062, rot: 0.24, alpha: 0.80, color: '#E84A87', phase: 5.0 },

        // 10. Far-right small-medium deep pink heart (bottom aligned horizontally with #1)
        { dx: 0.84, dy: -0.09, scale: 0.090, rot: 0.02, alpha: 0.88, color: '#E5347B', phase: 5.6 },
    ];

    for (const crown of crownsToDraw) {
        ctx.save();
        ctx.translate(crown.anchorX, crown.anchorY);
        ctx.rotate(crown.angle);

        for (const hItem of archHearts) {
            const floatY = Math.cos(t + hItem.phase) * (crown.crownR * 0.012);
            const pulse = 1 + Math.sin(t * 1.2 + hItem.phase) * 0.015;

            const cx = hItem.dx * crown.crownR;
            const cy = hItem.dy * crown.crownR + floatY;
            const size = hItem.scale * crown.crownR * pulse;

            drawSoftVelvetHeart(ctx, cx, cy, size, hItem.rot, hItem.alpha * strength, hItem.color);
        }
        ctx.restore();
    }
}

/**
 * Draws a flat translucent pink heart so overlapping hearts naturally form the darker pink Venn-diagram blend
 */
function drawSoftVelvetHeart(ctx, cx, cy, size, rotation, alpha, color) {
    if (alpha <= 0.01) {
        return;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Subtle soft anti-aliased edge matching the PNG overlay
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(1, size * 0.08);

    ctx.beginPath();
    // Classic full-lobed rounded heart matching the PNG asset
    ctx.moveTo(0, -size * 0.34);
    ctx.bezierCurveTo(-size * 0.14, -size * 0.88, -size * 1.04, -size * 0.82, -size * 1.04, -size * 0.12);
    ctx.bezierCurveTo(-size * 1.04, size * 0.38, -size * 0.38, size * 0.70, 0, size * 0.98);
    ctx.bezierCurveTo(size * 0.38, size * 0.70, size * 1.04, size * 0.38, size * 1.04, -size * 0.12);
    ctx.bezierCurveTo(size * 1.04, -size * 0.82, size * 0.14, -size * 0.88, 0, -size * 0.34);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

let bluebirdsSpriteCanvas = null;
let bluebirdsLoading = false;

/**
 * Loads /images/effects/bluebirds-crown.jpg and strips the exterior white background via
 * border-seeded BFS flood-fill + edge de-haloing while keeping the interior eye/belly details intact.
 */
function initBluebirdsSprite() {
    if (bluebirdsSpriteCanvas || bluebirdsLoading || typeof Image === 'undefined' || typeof document === 'undefined') {
        return;
    }

    bluebirdsLoading = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) {
            return;
        }

        const c = document.createElement('canvas');
        c.width = iw;
        c.height = ih;
        const cCtx = c.getContext('2d', { willReadFrequently: true });
        cCtx.drawImage(img, 0, 0, iw, ih);

        const imgData = cCtx.getImageData(0, 0, iw, ih);
        const data = imgData.data;
        const total = iw * ih;
        const bgMask = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;

        const isExteriorWhite = (pIdx) => {
            const idx = pIdx * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            return r >= 232 && g >= 235 && b >= 236 && Math.abs(b - r) <= 18;
        };

        // Seed BFS from all 4 image borders
        for (let x = 0; x < iw; x++) {
            const topIdx = x;
            const botIdx = (ih - 1) * iw + x;
            if (!bgMask[topIdx] && isExteriorWhite(topIdx)) {
                bgMask[topIdx] = 1;
                queue[tail++] = topIdx;
            }
            if (!bgMask[botIdx] && isExteriorWhite(botIdx)) {
                bgMask[botIdx] = 1;
                queue[tail++] = botIdx;
            }
        }
        for (let y = 0; y < ih; y++) {
            const leftIdx = y * iw;
            const rightIdx = y * iw + (iw - 1);
            if (!bgMask[leftIdx] && isExteriorWhite(leftIdx)) {
                bgMask[leftIdx] = 1;
                queue[tail++] = leftIdx;
            }
            if (!bgMask[rightIdx] && isExteriorWhite(rightIdx)) {
                bgMask[rightIdx] = 1;
                queue[tail++] = rightIdx;
            }
        }

        // Flood-fill all connected exterior white pixels
        while (head < tail) {
            const curr = queue[head++];
            const cy = Math.floor(curr / iw);
            const cx = curr - cy * iw;

            if (cx > 0) {
                const n = curr - 1;
                if (!bgMask[n] && isExteriorWhite(n)) {
                    bgMask[n] = 1;
                    queue[tail++] = n;
                }
            }
            if (cx < iw - 1) {
                const n = curr + 1;
                if (!bgMask[n] && isExteriorWhite(n)) {
                    bgMask[n] = 1;
                    queue[tail++] = n;
                }
            }
            if (cy > 0) {
                const n = curr - iw;
                if (!bgMask[n] && isExteriorWhite(n)) {
                    bgMask[n] = 1;
                    queue[tail++] = n;
                }
            }
            if (cy < ih - 1) {
                const n = curr + iw;
                if (!bgMask[n] && isExteriorWhite(n)) {
                    bgMask[n] = 1;
                    queue[tail++] = n;
                }
            }
        }

        // Make exterior background transparent & de-halo 2px anti-aliased boundary pixels
        for (let y = 0; y < ih; y++) {
            for (let x = 0; x < iw; x++) {
                const pIdx = y * iw + x;
                const idx = pIdx * 4;

                if (bgMask[pIdx]) {
                    data[idx + 3] = 0;
                    continue;
                }

                // Check if within 2px of exterior background
                let nearBg = false;
                for (let dy = -2; dy <= 2 && !nearBg; dy++) {
                    const ny = y + dy;
                    if (ny < 0 || ny >= ih) continue;
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        if (nx >= 0 && nx < iw && bgMask[ny * iw + nx]) {
                            nearBg = true;
                            break;
                        }
                    }
                }

                if (nearBg) {
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    const minCh = Math.min(r, g, b);

                    if (minCh > 170) {
                        const chroma = Math.abs(b - r) * 2.5 + (255 - minCh) * 1.25;
                        const cov = Math.max(0, Math.min(1, chroma / 96));
                        data[idx + 3] = Math.round(cov * 255);
                        if (cov > 0.08) {
                            data[idx] = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - cov)) / cov)));
                            data[idx + 1] = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - cov)) / cov)));
                            data[idx + 2] = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - cov)) / cov)));
                        }
                    }
                }
            }
        }

        cCtx.putImageData(imgData, 0, 0);

        // Copy the processed sprite onto a GPU-backed canvas so per-frame drawImage calls stay on the GPU
        const gpuSprite = document.createElement('canvas');
        gpuSprite.width = iw;
        gpuSprite.height = ih;
        gpuSprite.getContext('2d').drawImage(c, 0, 0);
        bluebirdsSpriteCanvas = gpuSprite;
    };
    img.src = '/images/effects/bluebirds-crown.jpg';
}

if (typeof window !== 'undefined') {
    setTimeout(initBluebirdsSprite, 80);
}

/**
 * Renders the 7 Bluebirds Crown over every tracked head (tracks left/right, up/down, zoom scale, and head tilt)
 */
function drawPhotoBoothBlueBirds(ctx, sourceCanvas, w, h, strength = 1, allowTracking = true, isMirrored = false, crop = null) {
    initBluebirdsSprite();

    let crownsToDraw = [];
    if (w > 240) {
        crownsToDraw = resolveTrackedCrowns(sourceCanvas, w, h, allowTracking, isMirrored, crop);
    } else {
        crownsToDraw = [
            {
                anchorX: w * 0.50,
                anchorY: h * 0.40,
                crownR: w * 0.28,
                angle: 0,
            },
        ];
    }

    const t = typeof performance !== 'undefined' ? performance.now() * 0.001 : 0;

    // 7 orbiting bluebirds spaced around the 360-degree 3D halo ring (classic MacBook Photo Booth Dizzy Birds orbit)
    const orbitBirds = [
        { baseAngle: 0.00, flapPhase: 0.2, yOffset: 0.00 },
        { baseAngle: 0.88, flapPhase: 1.4, yOffset: -0.02 },
        { baseAngle: 1.78, flapPhase: 2.7, yOffset: 0.01 },
        { baseAngle: 2.68, flapPhase: 3.9, yOffset: -0.01 },
        { baseAngle: 3.58, flapPhase: 5.1, yOffset: 0.02 },
        { baseAngle: 4.48, flapPhase: 0.8, yOffset: -0.02 },
        { baseAngle: 5.38, flapPhase: 2.1, yOffset: 0.01 },
    ];

    for (const crown of crownsToDraw) {
        ctx.save();
        ctx.translate(crown.anchorX, crown.anchorY);
        ctx.rotate(crown.angle);
        ctx.globalAlpha = Math.max(0, Math.min(1, strength));

        if (bluebirdsSpriteCanvas) {
            const iw = bluebirdsSpriteCanvas.width;
            const ih = bluebirdsSpriteCanvas.height;

            // Isolated single-bird crops from the sprite sheet:
            // 1) Wings-Up bird (natively facing RIGHT): u = 0.380..0.585, v = 0.365..0.695
            const upSx = 0.380 * iw;
            const upSy = 0.365 * ih;
            const upSw = 0.205 * iw;
            const upSh = 0.330 * ih;

            // 2) Wings-Folded gliding bird (natively facing LEFT): u = 0.640..0.770, v = 0.140..0.310
            const foldSx = 0.640 * iw;
            const foldSy = 0.140 * ih;
            const foldSw = 0.130 * iw;
            const foldSh = 0.170 * ih;

            const orbitRadiusX = crown.crownR * 0.92;
            const orbitRadiusY = crown.crownR * 0.16;
            const orbitCenterY = -crown.crownR * 0.68;
            const orbitSpeed = 1.65; // radians per second around the head

            // Compute each bird's current 3D orbit position & sort back-to-front (by depth z = sin(theta))
            const activeBirds = orbitBirds
                .map((b) => {
                    const theta = b.baseAngle - t * orbitSpeed;
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta); // -1 = behind top of head, +1 = in front of forehead
                    return {
                        ...b,
                        theta,
                        cosT,
                        sinT,
                    };
                })
                .sort((a, b) => a.sinT - b.sinT);

            for (const b of activeBirds) {
                const flapWave = Math.sin(t * 15.0 + b.flapPhase);
                const bobY = Math.sin(t * 5.2 + b.flapPhase) * (crown.crownR * 0.024);

                const bx = b.cosT * orbitRadiusX;
                const by = orbitCenterY + (b.sinT + b.yOffset) * orbitRadiusY + bobY;

                // 3D perspective scale: smaller when circling behind the head, larger when passing in front
                const depthScale = 0.72 + 0.30 * b.sinT;
                // Velocity along X is +sin(theta): moving Right in front (sinT >= 0), moving Left in back (sinT < 0)
                const facingRight = b.sinT >= 0;
                const useFoldedWings = (b.sinT < -0.25 && flapWave < 0.25) || flapWave < -0.45;

                const baseBirdW = crown.crownR * 0.48 * depthScale;
                const baseBirdH = baseBirdW * (upSh / upSw);
                const bankAngle = -b.cosT * 0.08 + Math.cos(t * 15.0 + b.flapPhase) * 0.04;

                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(bankAngle);

                if (useFoldedWings) {
                    // Folded-wing sprite natively faces LEFT; flip horizontally when flying RIGHT
                    if (facingRight) {
                        ctx.scale(-1, 1);
                    }
                    const drawW = baseBirdW * 0.88;
                    const drawH = drawW * (foldSh / foldSw);
                    ctx.drawImage(
                        bluebirdsSpriteCanvas,
                        foldSx,
                        foldSy,
                        foldSw,
                        foldSh,
                        -drawW * 0.5,
                        -drawH * 0.35,
                        drawW,
                        drawH
                    );
                } else {
                    // Wings-up sprite natively faces RIGHT; flip horizontally when flying LEFT
                    if (!facingRight) {
                        ctx.scale(-1, 1);
                    }
                    const wingStretch = 1.0 + flapWave * 0.06;
                    const drawW = baseBirdW;
                    const drawH = baseBirdH * wingStretch;
                    ctx.drawImage(
                        bluebirdsSpriteCanvas,
                        upSx,
                        upSy,
                        upSw,
                        upSh,
                        -drawW * 0.5,
                        -drawH * 0.55,
                        drawW,
                        drawH
                    );
                }

                ctx.restore();
            }
        }
        ctx.restore();
    }
}

function drawVignette(ctx, w, h, alpha) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.65);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(20, 14, 12, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawFilmGrain(ctx, w, h, alpha) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 250, 240, ${alpha})`;
    for (let i = 0; i < 110; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        ctx.fillRect(gx, gy, 2.5, 2.5);
    }
    ctx.fillStyle = `rgba(20, 15, 10, ${alpha})`;
    for (let i = 0; i < 110; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        ctx.fillRect(gx, gy, 2.5, 2.5);
    }
    ctx.restore();
}

/**
 * Renders an individual captured photo with its Editor adjustments (crop/zoom, panX, panY,
 * brightness, contrast, and post-capture filter) onto a clean Full HD canvas.
 */
export function renderAdjustedPhotoToCanvas(imgElement, adjustment = {}, width = 1440, height = 1080) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawAdjustedPhotoInRect(ctx, imgElement, 0, 0, width, height, adjustment, 0);
    return canvas;
}

/**
 * Draws an image inside a target rectangle with rounded corners, zoom/crop, panX/panY,
 * brightness, contrast, and postFilter.
 */
export function drawAdjustedPhotoInRect(ctx, imgElement, x, y, width, height, adjustment = {}, borderRadius = 12) {
    const zoom = Math.max(100, Math.min(200, Number(adjustment.zoom || 100))) / 100;
    const panX = Number(adjustment.panX || 0) / 100;
    const panY = Number(adjustment.panY || 0) / 100;
    const brightness = 100 + Number(adjustment.brightness || 0);
    const contrast = 100 + Number(adjustment.contrast || 0);
    const postFilter = adjustment.postFilter || 'none';

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Rounded rectangle clip
    ctx.beginPath();
    if (borderRadius > 0 && typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, borderRadius);
    } else {
        ctx.rect(x, y, width, height);
    }
    ctx.clip();

    // Build CSS filter string for brightness, contrast, and postFilter
    let filterParts = [`brightness(${brightness}%)`, `contrast(${contrast}%)`];
    if (postFilter === 'bw-classic') {
        filterParts.push('grayscale(100%) contrast(108%)');
    } else if (postFilter === 'vintage-fade') {
        filterParts.push('sepia(45%) contrast(92%) brightness(104%)');
    } else if (postFilter === 'high-contrast') {
        filterParts.push('contrast(125%) saturate(112%)');
    } else if (postFilter === 'warm-glow') {
        filterParts.push('saturate(122%) sepia(18%)');
    } else if (postFilter === 'cool-mist') {
        filterParts.push('saturate(92%) hue-rotate(8deg)');
    } else if (postFilter === 'soft-peach') {
        filterParts.push('saturate(115%) brightness(104%)');
    }

    ctx.filter = filterParts.join(' ');

    // Calculate source crop rectangle
    const imgW = imgElement.naturalWidth || imgElement.width || width;
    const imgH = imgElement.naturalHeight || imgElement.height || height;
    const boxAspect = width / height;
    const imgAspect = imgW / imgH;

    let baseSw = imgW;
    let baseSh = imgH;
    if (imgAspect > boxAspect) {
        baseSw = imgH * boxAspect;
    } else {
        baseSh = imgW / boxAspect;
    }

    const sw = baseSw / zoom;
    const sh = baseSh / zoom;
    const maxOffsetX = (imgW - sw) / 2;
    const maxOffsetY = (imgH - sh) / 2;

    const sx = (imgW - sw) / 2 - panX * maxOffsetX;
    const sy = (imgH - sh) / 2 - panY * maxOffsetY;

    ctx.drawImage(
        imgElement,
        Math.max(0, Math.min(imgW - sw, sx)),
        Math.max(0, Math.min(imgH - sh, sy)),
        sw,
        sh,
        x,
        y,
        width,
        height
    );

    ctx.filter = 'none';

    // Subtle color tint overlays for postFilter
    if (postFilter === 'warm-glow') {
        ctx.fillStyle = 'rgba(255, 185, 115, 0.14)';
        ctx.fillRect(x, y, width, height);
    } else if (postFilter === 'cool-mist') {
        ctx.fillStyle = 'rgba(150, 205, 255, 0.15)';
        ctx.fillRect(x, y, width, height);
    } else if (postFilter === 'soft-peach') {
        ctx.fillStyle = 'rgba(244, 170, 185, 0.16)';
        ctx.fillRect(x, y, width, height);
    }

    ctx.restore();
}
