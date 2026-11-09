/**
 * MIORA Client-Side Session Storage Engine
 * Uses IndexedDB as primary storage (to handle high-resolution base64 photos without QuotaExceededError)
 * with automatic fallback to sessionStorage.
 */

const DB_NAME = 'miora_photobooth_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_store';
const SESSION_KEY = 'current_miora_session';

export function getDefaultEditorState(photoCount = 4, preselectedFrame = 'classic-cream') {
    let defaultLayout = 'strip-4';
    if (photoCount === 1) {
        defaultLayout = 'single';
    } else if (photoCount === 2) {
        defaultLayout = 'strip-2';
    } else if (photoCount === 3) {
        defaultLayout = 'strip-3';
    }

    return {
        frameId: preselectedFrame || 'classic-cream',
        layoutId: defaultLayout,
        caption: '',
        showDate: false,
        dateFormat: 'classic',
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
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveSession(sessionData) {
    const payload = {
        ...sessionData,
        updatedAt: Date.now(),
    };

    try {
        const db = await openDatabase();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(payload, SESSION_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        // Fallback to sessionStorage
    }

    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
        // Ignore quota errors if IndexedDB succeeded
    }

    return payload;
}

export async function loadSession() {
    try {
        const db = await openDatabase();
        const result = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(SESSION_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        if (result) {
            return result;
        }
    } catch {
        // Fallback to sessionStorage
    }

    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch {
        // Ignore parse error
    }

    return null;
}

export async function clearSession() {
    try {
        const db = await openDatabase();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(SESSION_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch {
        // Ignore
    }

    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // Ignore
    }
}

/**
 * Generates charming illustrated sample portraits on a Canvas so the Editor and Result
 * pages always have real, downloadable images even if visited directly without a webcam.
 */
export function generateSamplePhotos(count = 4) {
    const palettes = [
        { bg1: '#FCEEF2', bg2: '#F2B8C6', shirt: '#D97B93', pose: 'peace', label: 'Soft Pink', emoji: '✨' },
        { bg1: '#FFE4B5', bg2: '#F3B391', shirt: '#8C6D58', pose: 'wink', label: 'Warm Sun', emoji: '💗' },
        { bg1: '#EDF4FC', bg2: '#A7C7E7', shirt: '#5E92C4', pose: 'smile', label: 'Cool Breeze', emoji: '🎀' },
        { bg1: '#F2ECE4', bg2: '#D8C8BC', shirt: '#6E5443', pose: 'heart', label: 'Vintage 70s', emoji: '🍒' },
    ];

    const photos = [];
    for (let i = 0; i < count; i++) {
        const p = palettes[i % palettes.length];
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');

        // Soft studio gradient backdrop
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, p.bg1);
        grad.addColorStop(1, p.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative studio halo
        ctx.fillStyle = 'rgba(255, 253, 249, 0.35)';
        ctx.beginPath();
        ctx.arc(480, 360, 240, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders / outfit
        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.arc(480, 690, 230, Math.PI, 0, false);
        ctx.fill();

        // Hair back
        ctx.fillStyle = '#3B2B20';
        ctx.beginPath();
        ctx.arc(480, 330, 128, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#FFE8D6';
        ctx.beginPath();
        ctx.arc(480, 340, 102, 0, Math.PI * 2);
        ctx.fill();

        // Rosy cheeks
        ctx.fillStyle = 'rgba(242, 140, 165, 0.45)';
        ctx.beginPath();
        ctx.arc(425, 360, 20, 0, Math.PI * 2);
        ctx.arc(535, 360, 20, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.strokeStyle = '#2B2625';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        if (i % 2 === 1) {
            // Wink left eye
            ctx.beginPath();
            ctx.arc(440, 330, 14, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#2B2625';
            ctx.beginPath();
            ctx.arc(440, 330, 9, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#2B2625';
        ctx.beginPath();
        ctx.arc(520, 330, 9, 0, Math.PI * 2);
        ctx.fill();

        // Sweet smile
        ctx.beginPath();
        ctx.arc(480, 355, 26, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        // Floating studio prop
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, 680, 210);

        // Generate 12 sample live motion frames (natural sway & eye blink)
        const liveFrames = [];
        const liveCanvas = document.createElement('canvas');
        liveCanvas.width = 480;
        liveCanvas.height = 360;
        const lctx = liveCanvas.getContext('2d');

        for (let f = 0; f < 12; f++) {
            const progress = f / 12;
            const swayX = Math.sin(progress * Math.PI * 2) * 8;
            const swayY = Math.cos(progress * Math.PI * 2) * 5;

            lctx.clearRect(0, 0, 480, 360);
            lctx.save();
            lctx.drawImage(canvas, swayX * 0.5, swayY * 0.5, 480, 360);
            lctx.restore();
            liveFrames.push(liveCanvas.toDataURL('image/jpeg', 0.82));
        }

        photos.push({
            id: `sample-${i + 1}`,
            dataUrl: canvas.toDataURL('image/jpeg', 0.92),
            liveFrames,
            filterId: 'original',
            filterName: p.label,
            intensity: 100,
            capturedAt: Date.now() + i,
        });
    }

    return photos;
}

