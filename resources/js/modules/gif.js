/**
 * MIORA Live Photo & GIF89a Engine
 * Encodes authentic, genuine camera-recorded video motion into looping Live Photo GIFs
 * for both Individual Photos and Framed Photostrips.
 */

import { renderPhotostripToCanvas } from './renderer';

class NeuQuant {
    constructor(pixels, samplefac = 10) {
        this.network = [];
        this.netindex = new Int32Array(256);
        this.bias = new Int32Array(256);
        this.freq = new Int32Array(256);
        this.radpower = new Int32Array(32);
        this.pixels = pixels;
        this.samplefac = samplefac;
        this.init();
    }

    init() {
        for (let i = 0; i < 256; i++) {
            const v = i << 4;
            this.network[i] = [v, v, v];
            this.freq[i] = 256;
            this.bias[i] = 0;
        }
    }

    learn() {
        const lengthcount = this.pixels.length;
        const samplepixels = lengthcount / (4 * this.samplefac);
        const delta = Math.max(1, Math.floor(samplepixels / 100));
        let alpha = 1024;
        let radius = 2048;
        let rad = radius >> 6;
        if (rad <= 1) rad = 0;
        for (let i = 0; i < rad; i++) {
            this.radpower[i] = Math.floor(alpha * (((rad * rad - i * i) * 256) / (rad * rad)));
        }

        let step = 499;
        if (lengthcount < 499 * 4) step = 1;
        let pix = 0;

        for (let i = 0; i < samplepixels; i++) {
            const b = this.pixels[pix] << 4;
            const g = this.pixels[pix + 1] << 4;
            const r = this.pixels[pix + 2] << 4;
            const j = this.contest(b, g, r);

            this.altersingle(alpha, j, b, g, r);
            if (rad !== 0) this.alterneigh(rad, j, b, g, r);

            pix += step * 4;
            if (pix >= lengthcount) pix -= lengthcount;

            if (i % delta === 0) {
                alpha -= alpha / 30;
                radius -= radius / 16;
                rad = radius >> 6;
                if (rad <= 1) rad = 0;
                for (let k = 0; k < rad; k++) {
                    this.radpower[k] = Math.floor(alpha * (((rad * rad - k * k) * 256) / (rad * rad)));
                }
            }
        }
    }

    contest(b, g, r) {
        let bestd = ~0 >>> 1;
        let bestbiasd = bestd;
        let best = -1;
        let bestbiaspos = best;

        for (let i = 0; i < 256; i++) {
            const n = this.network[i];
            const dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
            if (dist < bestd) {
                bestd = dist;
                best = i;
            }
            const biasdist = dist - (this.bias[i] >> 12);
            if (biasdist < bestbiasd) {
                bestbiasd = biasdist;
                bestbiaspos = i;
            }
            const betafreq = this.freq[i] >> 10;
            this.freq[i] -= betafreq;
            this.bias[i] += betafreq << 10;
        }
        this.freq[best] += 64;
        this.bias[best] -= 64 << 10;
        return bestbiaspos;
    }

    altersingle(alpha, i, b, g, r) {
        const n = this.network[i];
        n[0] -= (alpha * (n[0] - b)) / 1024;
        n[1] -= (alpha * (n[1] - g)) / 1024;
        n[2] -= (alpha * (n[2] - r)) / 1024;
    }

    alterneigh(rad, i, b, g, r) {
        const lo = Math.max(0, i - rad);
        const hi = Math.min(255, i + rad);
        let j = i + 1;
        let k = i - 1;
        let m = 1;
        while (j <= hi || k >= lo) {
            const a = this.radpower[m++];
            if (j <= hi) {
                const n = this.network[j++];
                n[0] -= (a * (n[0] - b)) / 262144;
                n[1] -= (a * (n[1] - g)) / 262144;
                n[2] -= (a * (n[2] - r)) / 262144;
            }
            if (k >= lo) {
                const n = this.network[k--];
                n[0] -= (a * (n[0] - b)) / 262144;
                n[1] -= (a * (n[1] - g)) / 262144;
                n[2] -= (a * (n[2] - r)) / 262144;
            }
        }
    }

    buildColormap() {
        this.learn();
        const map = new Uint8Array(256 * 3);
        for (let i = 0; i < 256; i++) {
            map[i * 3] = Math.max(0, Math.min(255, this.network[i][2] >> 4));
            map[i * 3 + 1] = Math.max(0, Math.min(255, this.network[i][1] >> 4));
            map[i * 3 + 2] = Math.max(0, Math.min(255, this.network[i][0] >> 4));
        }
        return map;
    }

    lookup(r, g, b) {
        let bestd = 10000000;
        let best = 0;
        for (let i = 0; i < 256; i++) {
            const n = this.network[i];
            const dr = (n[2] >> 4) - r;
            const dg = (n[1] >> 4) - g;
            const db = (n[0] >> 4) - b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < bestd) {
                bestd = dist;
                best = i;
            }
        }
        return best;
    }
}

function lzwEncode(indexedPixels, colorDepth = 8) {
    const initCodeSize = Math.max(2, colorDepth);
    const clearCode = 1 << initCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = initCodeSize + 1;
    let maxCode = (1 << codeSize) - 1;
    let nextCode = eoiCode + 1;

    const HASH_SIZE = 5003;
    const htab = new Int32Array(HASH_SIZE).fill(-1);
    const codetab = new Int32Array(HASH_SIZE).fill(-1);

    const outBytes = [];
    let curAccum = 0;
    let curBits = 0;

    function output(code) {
        curAccum |= code << curBits;
        curBits += codeSize;
        while (curBits >= 8) {
            outBytes.push(curAccum & 0xff);
            curAccum >>= 8;
            curBits -= 8;
        }
        if (nextCode > maxCode) {
            codeSize++;
            if (codeSize === 12) {
                maxCode = 4096;
            } else {
                maxCode = (1 << codeSize) - 1;
            }
        }
    }

    function clearTable() {
        htab.fill(-1);
        codetab.fill(-1);
        nextCode = eoiCode + 1;
        codeSize = initCodeSize + 1;
        maxCode = (1 << codeSize) - 1;
    }

    output(clearCode);

    if (indexedPixels.length > 0) {
        let ent = indexedPixels[0];
        for (let i = 1; i < indexedPixels.length; i++) {
            const c = indexedPixels[i];
            const fkey = (c << 12) ^ ent;
            let h = fkey % HASH_SIZE;
            if (h < 0) h += HASH_SIZE;

            const disp = HASH_SIZE - 1 - h === 0 ? 1 : HASH_SIZE - 1 - h;
            let found = false;

            while (htab[h] !== -1) {
                if (htab[h] === fkey) {
                    ent = codetab[h];
                    found = true;
                    break;
                }
                h = h - disp;
                if (h < 0) h += HASH_SIZE;
            }

            if (!found) {
                output(ent);
                if (nextCode < 4096) {
                    codetab[h] = nextCode++;
                    htab[h] = fkey;
                } else {
                    output(clearCode);
                    clearTable();
                }
                ent = c;
            }
        }
        output(ent);
    }

    output(eoiCode);
    if (curBits > 0) {
        outBytes.push(curAccum & 0xff);
    }

    // Packetize into 255-byte sub-blocks
    const stream = [initCodeSize];
    let offset = 0;
    while (offset < outBytes.length) {
        const chunkLen = Math.min(255, outBytes.length - offset);
        stream.push(chunkLen);
        for (let i = 0; i < chunkLen; i++) {
            stream.push(outBytes[offset + i]);
        }
        offset += chunkLen;
    }
    stream.push(0x00);
    return stream;
}

export class GifEncoder {
    constructor(width, height) {
        this.width = Math.round(width);
        this.height = Math.round(height);
        this.bytes = [];
        this.writeHeader();
    }

    writeHeader() {
        // GIF89a
        const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
        for (const b of header) this.bytes.push(b);

        // Logical Screen Descriptor
        this.bytes.push(this.width & 0xff, (this.width >> 8) & 0xff);
        this.bytes.push(this.height & 0xff, (this.height >> 8) & 0xff);
        this.bytes.push(0x70, 0x00, 0x00); // 256 colors, no global table

        // Netscape Application Extension for infinite loop
        this.bytes.push(
            0x21, 0xff, 0x0b,
            0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
            0x03, 0x01, 0x00, 0x00, 0x00
        );
    }

    addFrame(canvasOrCtx, delayCentiseconds = 10) {
        const ctx = canvasOrCtx.getContext ? canvasOrCtx.getContext('2d') : canvasOrCtx;
        const imgData = ctx.getImageData(0, 0, this.width, this.height);
        const pixels = imgData.data;

        // NeuQuant quantization
        const nq = new NeuQuant(pixels, 10);
        const palette = nq.buildColormap();

        const numPixels = this.width * this.height;
        const indexed = new Uint8Array(numPixels);
        for (let i = 0; i < numPixels; i++) {
            indexed[i] = nq.lookup(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]);
        }

        // Graphics Control Extension
        this.bytes.push(0x21, 0xf9, 0x04);
        this.bytes.push(0x00); // disposal method (do not dispose / 0)
        this.bytes.push(delayCentiseconds & 0xff, (delayCentiseconds >> 8) & 0xff);
        this.bytes.push(0x00, 0x00); // transparent color index (none), block terminator

        // Image Descriptor
        this.bytes.push(0x2c);
        this.bytes.push(0, 0, 0, 0); // x, y (0, 0)
        this.bytes.push(this.width & 0xff, (this.width >> 8) & 0xff);
        this.bytes.push(this.height & 0xff, (this.height >> 8) & 0xff);
        this.bytes.push(0x87); // Local Color Table Present, 256 colors

        // Local Color Table
        for (let i = 0; i < palette.length; i++) {
            this.bytes.push(palette[i]);
        }

        // LZW Compressed Raster Data
        const lzw = lzwEncode(indexed, 8);
        for (let i = 0; i < lzw.length; i++) {
            this.bytes.push(lzw[i]);
        }
    }

    finish() {
        this.bytes.push(0x3b); // Trailer
        return new Uint8Array(this.bytes);
    }

    renderBlob() {
        const u8 = this.finish();
        return new Blob([u8], { type: 'image/gif' });
    }

    async renderDataUrl() {
        const blob = this.renderBlob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

/**
 * Generates an authentic Live Photo animated GIF for an individual photo
 * using real camera-recorded video frames.
 * @param {HTMLImageElement[]} liveFrameImages
 * @param {Object} options
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function generateLivePhotoGif(liveFrameImages, options = {}) {
    const width = options.width || 480;
    const height = options.height || 360;
    const delay = options.delay || 10; // 100ms per frame (10 FPS natural camera motion)

    const encoder = new GifEncoder(width, height);
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    const ctx = frameCanvas.getContext('2d');

    const frames = Array.isArray(liveFrameImages) && liveFrameImages.length > 0
        ? liveFrameImages
        : [];

    for (let i = 0; i < frames.length; i++) {
        const img = frames[i];
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        encoder.addFrame(ctx, delay);
    }

    const dataUrl = await encoder.renderDataUrl();
    const blob = encoder.renderBlob();
    return { blob, dataUrl };
}

/**
 * Generates an authentic Live Photo animated GIF for the complete Framed Photostrip.
 * Renders the full photostrip frame with live camera motions playing inside each photo slot.
 * @param {Array<{ mainImg: HTMLImageElement, liveImages: HTMLImageElement[] }>} photosWithLiveImages
 * @param {Object} editorState
 * @param {Object} catalog
 * @param {Object} options
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function generateLivePhotostripGif(photosWithLiveImages, editorState, catalog, options = {}) {
    // Determine maximum number of recorded motion frames across all photos (typically 12-14 frames)
    const frameCount = Math.max(
        ...photosWithLiveImages.map((p) => (p.liveImages && p.liveImages.length > 0 ? p.liveImages.length : 1)),
        10
    );

    // Create high-res stage canvas for photostrip rendering
    const stageCanvas = document.createElement('canvas');
    // Initial dummy render to determine aspect ratio and layout spec
    const initialSlotImgs = photosWithLiveImages.map((p) => p.mainImg);
    renderPhotostripToCanvas(stageCanvas, initialSlotImgs, editorState, catalog);

    const origW = stageCanvas.width;
    const origH = stageCanvas.height;

    // Output target resolution optimized for smooth GIF playback and mobile sharing
    const targetW = options.width || 380;
    const targetH = Math.round((origH / origW) * targetW);
    const delay = options.delay || 10; // 100ms per frame (10 FPS)

    const encoder = new GifEncoder(targetW, targetH);
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = targetW;
    frameCanvas.height = targetH;
    const ctx = frameCanvas.getContext('2d');

    for (let f = 0; f < frameCount; f++) {
        // Pick the f-th authentic camera frame for each photo slot
        const currentSlotImages = photosWithLiveImages.map((p) => {
            if (p.liveImages && p.liveImages.length > 0) {
                return p.liveImages[f % p.liveImages.length];
            }
            return p.mainImg;
        });

        // Render complete photostrip with the moving photo frames
        renderPhotostripToCanvas(stageCanvas, currentSlotImages, editorState, catalog);

        // Scale onto output target canvas
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(stageCanvas, 0, 0, targetW, targetH);

        encoder.addFrame(ctx, delay);
    }

    const dataUrl = await encoder.renderDataUrl();
    const blob = encoder.renderBlob();
    return { blob, dataUrl };
}
