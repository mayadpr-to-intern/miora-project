/**
 * MIORA Photostrip & Collage High-Resolution Canvas Renderer
 */

import { drawAdjustedPhotoInRect } from './filters';

const LAYOUT_DIMENSIONS = {
    single: { width: 640, height: 780, slots: 1, cols: 1 },
    'strip-2': { width: 560, height: 1020, slots: 2, cols: 1 },
    'strip-3': { width: 560, height: 1380, slots: 3, cols: 1 },
    'strip-4': { width: 560, height: 1740, slots: 4, cols: 1 },
    'grid-4': { width: 960, height: 920, slots: 4, cols: 2 },
};

const FONT_FAMILIES = {
    sans: '"Instrument Sans", system-ui, -apple-system, sans-serif',
    serif: 'Georgia, "Playfair Display", "Times New Roman", serif',
    cursive: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
    mono: '"Courier New", Courier, monospace',
};

/**
 * Formats the current date according to the selected date stamp format
 */
export function formatMioraDate(format = 'classic') {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const dayNum = String(now.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    if (format === 'dots') {
        return `${dayNum}.${monthNum}.${year}`;
    }
    if (format === 'iso') {
        return `${year} / ${monthNum} / ${dayNum}`;
    }
    return `${months[now.getMonth()]} ${dayNum}, ${year}`;
}

/**
 * Renders the complete framed photostrip onto targetCanvas
 */
export function renderPhotostripToCanvas(targetCanvas, loadedImages, editorState, catalog = {}) {
    const layoutKey = editorState.layoutId || 'strip-4';
    const spec = LAYOUT_DIMENSIONS[layoutKey] || LAYOUT_DIMENSIONS['strip-4'];

    if (targetCanvas.width !== spec.width || targetCanvas.height !== spec.height) {
        targetCanvas.width = spec.width;
        targetCanvas.height = spec.height;
    }

    const ctx = targetCanvas.getContext('2d');
    const w = spec.width;
    const h = spec.height;

    const frames = catalog.frames || [];
    const activeFrame = frames.find((f) => f.id === editorState.frameId) || {
        id: 'classic-cream',
        name: 'Miora Signature Cream',
        bg_color: '#FAF7F2',
        border_color: '#E5DDD3',
        text_color: '#2B2625',
        accent_color: '#8C6D58',
        pattern: 'none',
    };

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 1. Frame Background Fill
    ctx.fillStyle = activeFrame.bg_color;
    ctx.fillRect(0, 0, w, h);

    // 2. Frame Decorative Pattern
    drawFramePattern(ctx, w, h, activeFrame);

    // 3. Studio Watermark (Mandatory MIORA Branding, subtle & clean)
    const headerHeight = 62;
    drawMioraWatermark(ctx, w, h, headerHeight, activeFrame, editorState);

    // 4. Calculate Photo Slots Geometry
    const footerAreaHeight = 148;
    const sidePadding = activeFrame.pattern === 'film-strip' ? 56 : 42;
    const gap = 22;
    const usableW = w - sidePadding * 2;
    const usableH = h - headerHeight - footerAreaHeight;

    const cols = spec.cols;
    const rows = Math.ceil(spec.slots / cols);
    const slotW = (usableW - gap * (cols - 1)) / cols;
    const slotH = (usableH - gap * (rows - 1)) / rows;

    // 6. Draw Each Photo Slot
    for (let i = 0; i < spec.slots; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sx = sidePadding + col * (slotW + gap);
        const sy = headerHeight + row * (slotH + gap);

        // Subtle slot shadow/border
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(sx - 2, sy - 2, slotW + 4, slotH + 4, 14);
        } else {
            ctx.rect(sx - 2, sy - 2, slotW + 4, slotH + 4);
        }
        ctx.fill();

        const img = loadedImages[i % Math.max(1, loadedImages.length)];
        const adj = (editorState.photoAdjustments && editorState.photoAdjustments[i]) || {
            zoom: 100,
            panX: 0,
            panY: 0,
            brightness: 0,
            contrast: 0,
            postFilter: 'none',
        };

        const isHeartSlot = activeFrame.pattern === 'chibi-taiyaki' && i === 0;
        const isPillSlot = activeFrame.pattern === 'leopard-ribbon' || activeFrame.pattern === 'red-capturing-moments';
        const isDoodleGrid = activeFrame.pattern === 'doodle-pink-grid';
        const cornerR = isPillSlot ? Math.floor(slotH * 0.44) : (activeFrame.pattern === 'red-receiptify' ? 22 : 12);

        if (isHeartSlot) {
            ctx.save();
            drawHeartPath(ctx, sx + slotW / 2, sy + 6, slotW - 16, slotH - 16);
            ctx.clip();
            if (img) {
                drawAdjustedPhotoInRect(ctx, img, sx, sy, slotW, slotH, adj, 0);
            } else {
                ctx.fillStyle = '#E6DDD2';
                ctx.fillRect(sx, sy, slotW, slotH);
            }
            ctx.restore();

            // Crisp decorative heart stroke
            ctx.save();
            ctx.strokeStyle = activeFrame.accent_color || '#E8B878';
            ctx.lineWidth = 4.5;
            drawHeartPath(ctx, sx + slotW / 2, sy + 6, slotW - 16, slotH - 16);
            ctx.stroke();
            ctx.restore();
        } else if (isDoodleGrid) {
            // White card matting behind photo with soft shadow
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(sx, sy, slotW, slotH);
            ctx.strokeStyle = '#E8DEC8';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(sx, sy, slotW, slotH);

            // Inset photo with clean white polaroid matting so loops & waves never clip photo
            const inX = sx + 12;
            const inY = sy + 12;
            const inW = slotW - 24;
            const inH = slotH - 24;

            if (img) {
                drawAdjustedPhotoInRect(ctx, img, inX, inY, inW, inH, adj, 3);
            } else {
                ctx.fillStyle = '#F4EDE4';
                ctx.fillRect(inX, inY, inW, inH);
            }

            ctx.strokeStyle = 'rgba(216, 203, 182, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(inX, inY, inW, inH);
        } else {
            if (img) {
                drawAdjustedPhotoInRect(ctx, img, sx, sy, slotW, slotH, adj, cornerR);
            } else {
                ctx.fillStyle = '#E6DDD2';
                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(sx, sy, slotW, slotH, cornerR);
                    ctx.fill();
                } else {
                    ctx.fillRect(sx, sy, slotW, slotH);
                }
            }

            // Crisp inner frame stroke around each slot
            ctx.strokeStyle = activeFrame.border_color;
            ctx.lineWidth = isPillSlot ? 3.5 : 2.5;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(sx, sy, slotW, slotH, cornerR);
            } else {
                ctx.rect(sx, sy, slotW, slotH);
            }
            ctx.stroke();
        }

        // Optional Washi Tape corners for scrapbook-kraft frame
        if (activeFrame.pattern === 'washi-tape') {
            drawWashiTapeCorners(ctx, sx, sy, slotW, slotH, activeFrame.accent_color);
        }

        // Custom bespoke frame decorations (pearls, Victorian lace scallops, ribbons, florals, stamps, etc.)
        drawSlotDecorations(ctx, sx, sy, slotW, slotH, i, spec.slots, activeFrame);
    }

    // 7. Draw Footer Area (Bespoke Signature & Non-Overlapping Custom Caption / Date)
    const chosenFont = FONT_FAMILIES[editorState?.fontId] || FONT_FAMILIES.serif;
    const textColor = !editorState?.textColor || editorState.textColor === 'auto'
        ? activeFrame.text_color
        : editorState.textColor;
    drawFooterArea(ctx, w, h, footerAreaHeight, activeFrame, editorState, chosenFont, textColor);

    // 8. Draw Placed Stickers
    const stickers = Array.isArray(editorState.stickers) ? editorState.stickers : [];
    for (const st of stickers) {
        const px = st.x * w;
        const py = st.y * h;
        const size = Math.round(48 * (st.scale || 1));

        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#000000';
        ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.symbol, px, py);
        ctx.restore();
    }

    ctx.restore();
}

/**
 * Draws mandatory MIORA watermark with adaptive position, high-contrast palette, and artwork protection
 */
function drawMioraWatermark(ctx, w, h, headerHeight, frame, editorState) {
    ctx.save();
    const pattern = frame.pattern || '';
    const isDark = isColorDark(frame.bg_color || '#FAF7F2');

    // Clean, legible bold watermark with letter spacing — NO ugly boxes or pink lines!
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 18px "Instrument Sans", "Montserrat", sans-serif';

    if (pattern === 'cow-print-pink') {
        ctx.font = '700 17px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#241018';
        ctx.fillText('M I O R A', w / 2, 30);
    } else if (pattern === 'cherry-chrome') {
        ctx.font = '800 18px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowBlur = 8;
        ctx.fillText('M I O R A', w / 2 + 16, 32);
    } else if (pattern === 'chibi-taiyaki') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#5C3A1E';
        ctx.fillText('M I O R A', 62, 32);
    } else if (pattern === 'film-strip') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FBBF24';
        ctx.fillText('MIORA • 35MM', w / 2, 32);
    } else if (pattern === 'bakery-stand') {
        ctx.font = '800 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 5;
        ctx.fillText('M I O R A', w / 2, 24);
    } else if (pattern === 'bakery-doodle') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#C43D4B';
        ctx.fillText('M I O R A', 60, 28);
    } else if (pattern === 'bakery-kawaii') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#52341D';
        ctx.fillText('M I O R A', 58, 26);
    } else if (pattern === 'red-ticket') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#5A1B22';
        ctx.fillText('M I O R A', w / 2, 28);
    } else if (pattern === 'red-kisses-cat') {
        ctx.font = '700 18px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FAF0E4';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 5;
        ctx.fillText('M I O R A', w / 2, 28);
    } else if (pattern === 'red-airmail') {
        ctx.font = '700 17px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FAF0E4';
        ctx.fillText('M I O R A', w / 2, 24);
    } else if (pattern === 'red-capturing-moments') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#42121A';
        ctx.fillText('M I O R A', w - 62, 26);
    } else if (pattern === 'red-receiptify') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FAF0EA';
        ctx.fillText('M I O R A', w - 58, 26);
    } else if (pattern === 'brown-polka-grid') {
        ctx.font = '700 18px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#FAF0E1';
        ctx.fillText('M I O R A', w / 2, 28);
    } else if (pattern === 'blue-gingham-star') {
        ctx.font = '700 17px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#2A4E74';
        ctx.fillText('M I O R A', w / 2, 28);
    } else if (pattern === 'cupid-love-blooming') {
        ctx.font = '700 16px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#3E141E';
        ctx.fillText('M I O R A', w / 2, 20);
    } else if (pattern === 'doodle-pink-grid') {
        ctx.font = '700 17px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#6B4726';
        ctx.fillText('M I O R A', w / 2, 28);
    } else if (pattern === 'lily-polka-pink') {
        ctx.font = '700 17px "Instrument Sans", sans-serif';
        ctx.fillStyle = '#221518';
        ctx.fillText('M I O R A', w / 2 + 32, 28);
    } else {
        ctx.fillStyle = isDark ? '#FAF2EB' : '#4A3B32';
        ctx.fillText('M I O R A', w / 2, 33);
    }

    ctx.restore();
}

/**
 * Checks if a hex color is dark
 */
function isColorDark(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const clean = hex.replace('#', '');
    if (clean.length < 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
}

/**
 * Draws footer area ensuring custom caption and date NEVER cover illustrations
 */
function drawFooterArea(ctx, w, h, footerAreaHeight, frame, editorState, chosenFont, defaultTextColor) {
    const pattern = frame.pattern || '';
    const footerCenterY = h - footerAreaHeight / 2 - 4;
    const captionText = (editorState?.caption || '').trim();
    const hasBottomDesign = [
        'pearl-bow',
        'victorian-lace',
        'wine-lace-ruffle',
        'tartan-floral',
        'cherry-chrome',
        'cats-postage',
        'velvet-roses',
        'chibi-taiyaki',
        'polka-chibi',
        'cow-print-pink',
        'bakery-stand',
        'bakery-doodle',
        'bakery-kawaii',
        'red-ticket',
        'red-kisses-cat',
        'red-airmail',
        'red-capturing-moments',
        'red-receiptify',
        'brown-polka-grid',
        'blue-gingham-star',
        'cupid-love-blooming',
        'doodle-pink-grid',
        'lily-polka-pink',
    ].includes(pattern);

    ctx.save();

    if (hasBottomDesign) {
        // Render ONLY the frame's authentic design/signature at the bottom (NO extra text/words!)
        drawFrameFooterSignature(ctx, w, h, footerCenterY, frame);

        // ONLY if user explicitly typed a custom caption, place it safely above the design
        if (captionText) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `italic 600 20px ${chosenFont}`;
            const isDark = isColorDark(frame.bg_color || '#FAF7F2');
            ctx.fillStyle = isDark ? '#FAF4EE' : '#2B2625';
            ctx.shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(captionText, w / 2, h - footerAreaHeight + 22);
        }
    } else {
        // Bottom is empty: "jika di paling bawah kosong kasi kata kata kalo misalkan di bawah ada design gausah"
        const text = captionText || 'Little moments, forever yours.';
        const isDark = isColorDark(frame.bg_color || '#FAF7F2');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `italic 600 24px ${chosenFont}`;
        ctx.fillStyle = isDark ? '#FAF4EE' : '#2B2625';
        ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
        ctx.shadowBlur = 3;
        ctx.fillText(text, w / 2, footerCenterY);

        if (editorState?.showDate) {
            const dateStr = formatMioraDate(editorState.dateFormat || 'classic');
            ctx.font = `500 12px ${FONT_FAMILIES.mono}`;
            ctx.fillStyle = isDark ? 'rgba(250, 244, 238, 0.75)' : 'rgba(43, 38, 37, 0.75)';
            ctx.fillText(`— ${dateStr} • MIORA —`, w / 2, footerCenterY + 34);
        }
    }

    ctx.restore();
}

/**
 * Draws bespoke decorative patterns for each frame category
 */
function drawFramePattern(ctx, w, h, frame) {
    const pattern = frame.pattern || 'none';
    ctx.save();

    if (pattern === 'thin-line') {
        ctx.strokeStyle = frame.border_color;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, w - 40, h - 40);
    } else if (pattern === 'soft-dots') {
        ctx.fillStyle = frame.border_color;
        ctx.globalAlpha = 0.45;
        for (let y = 24; y < h; y += 36) {
            for (let x = 24; x < w; x += 36) {
                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else if (pattern === 'checkered') {
        ctx.fillStyle = frame.border_color;
        ctx.globalAlpha = 0.35;
        const sq = 20;
        for (let x = 0; x < w; x += sq) {
            if ((x / sq) % 2 === 0) {
                ctx.fillRect(x, 0, sq, sq);
                ctx.fillRect(x, h - sq, sq, sq);
            }
        }
    } else if (pattern === 'grid-paper') {
        ctx.strokeStyle = frame.border_color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.45;
        for (let x = 0; x < w; x += 28) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 28) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    } else if (pattern === 'film-strip') {
        // 35mm cinema sprocket perforations along left and right edges
        ctx.fillStyle = '#FAF7F2';
        ctx.globalAlpha = 0.85;
        for (let y = 30; y < h - 30; y += 44) {
            if (typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(16, y, 18, 24, 4);
                ctx.roundRect(w - 34, y, 18, 24, 4);
                ctx.fill();
            } else {
                ctx.fillRect(16, y, 18, 24);
                ctx.fillRect(w - 34, y, 18, 24);
            }
        }
    } else if (pattern === 'bows' || pattern === 'cherries' || pattern === 'florals' || pattern === 'stars' || pattern === 'clouds') {
        const motifMap = {
            bows: '🎀',
            cherries: '🍒',
            florals: '🌸',
            stars: '⭐',
            clouds: '☁️',
        };
        const icon = motifMap[pattern] || '✨';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.75;
        ctx.fillText(icon, 26, 36);
        ctx.fillText(icon, w - 26, 36);
        ctx.fillText(icon, 26, h - 26);
        ctx.fillText(icon, w - 26, h - 26);
    } else if (pattern === 'vintage-stamp') {
        ctx.strokeStyle = frame.accent_color;
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.strokeRect(22, 22, w - 44, h - 44);
        ctx.setLineDash([]);
    } else if (pattern === 'wine-lace-ruffle') {
        // Tilted cursive "Made of love" calligraphy script repeating across background
        ctx.save();
        ctx.rotate(-0.22);
        ctx.fillStyle = 'rgba(255, 240, 245, 0.16)';
        ctx.font = 'italic 500 25px Georgia, "Playfair Display", serif';
        for (let y = -h * 0.25; y < h * 1.5; y += 64) {
            for (let x = -w * 0.3; x < w * 1.5; x += 180) {
                ctx.fillText('Made of love', x, y);
            }
        }
        ctx.restore();
    } else if (pattern === 'leopard-ribbon') {
        // Chic dark leopard rosette pattern
        ctx.save();
        for (let y = 30; y < h; y += 46) {
            for (let x = 24; x < w; x += 48) {
                const ox = ((Math.floor(y / 46)) % 2) * 24;
                const px = x + ox;
                // Rosette spots cluster
                ctx.fillStyle = '#140409';
                ctx.beginPath();
                ctx.arc(px - 5, y - 4, 4.5, 0, Math.PI * 2);
                ctx.arc(px + 5, y - 5, 4, 0, Math.PI * 2);
                ctx.arc(px + 4, y + 4, 5, 0, Math.PI * 2);
                ctx.arc(px - 5, y + 5, 3.8, 0, Math.PI * 2);
                ctx.fill();
                // Warmer center spot
                ctx.fillStyle = '#3F1826';
                ctx.beginPath();
                ctx.arc(px, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    } else if (pattern === 'tartan-floral') {
        // Houndstooth tartan checks in burgundy, deep wine & warm oat
        ctx.save();
        // Base wide stripes
        ctx.lineWidth = 22;
        ctx.strokeStyle = 'rgba(110, 42, 54, 0.45)';
        for (let x = 0; x < w; x += 68) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 68) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        // Cream accent pinstripes
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(242, 222, 204, 0.48)';
        for (let x = 34; x < w; x += 68) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 34; y < h; y += 68) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.restore();
    } else if (pattern === 'cherry-chrome') {
        // Metallic crimson-to-noir gradient and liquid chrome star accents
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#5A1221');
        grad.addColorStop(0.35, '#350B14');
        grad.addColorStop(1, '#110206');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Chrome stars scattered along margins
        const starPositions = [
            [26, 120], [w - 26, 180], [22, h * 0.42], [w - 22, h * 0.54],
            [26, h * 0.74], [w - 26, h * 0.86]
        ];
        for (const [sx, sy] of starPositions) {
            drawChromeStar(ctx, sx, sy, 8);
        }
        // Top-left chrome star charm with chain links
        drawChromeStarCharm(ctx, 42, 40, 20);
    } else if (pattern === 'velvet-roses') {
        // Gingham check ribbon across the top 54px header
        const sq = 12;
        ctx.fillStyle = '#3A141C';
        ctx.fillRect(0, 0, w, 54);
        ctx.fillStyle = '#6E2432';
        for (let x = 0; x < w; x += sq * 2) {
            for (let y = 0; y < 54; y += sq * 2) {
                ctx.fillRect(x, y, sq, sq);
                ctx.fillRect(x + sq, y + sq, sq, sq);
            }
        }
        ctx.fillStyle = '#FAF0E6';
        ctx.globalAlpha = 0.28;
        for (let x = 0; x < w; x += sq * 2) {
            for (let y = 0; y < 54; y += sq * 2) {
                ctx.fillRect(x + sq, y, sq, sq);
            }
        }
        ctx.globalAlpha = 1;
    } else if (pattern === 'chibi-taiyaki') {
        // Butter cream starry sprinkles & "BUTTER" label in top corner
        ctx.save();
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#8C6A4A';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 3;
        ctx.fillText('★ BUTTER', w - 48, 34);

        // Golden twinkling stars
        drawGoldenStar(ctx, 32, 95, 7);
        drawGoldenStar(ctx, w - 32, 115, 6);
        drawGoldenStar(ctx, 28, h * 0.48, 8);
        drawGoldenStar(ctx, w - 28, h * 0.72, 7);
        ctx.restore();
    } else if (pattern === 'polka-chibi') {
        // Crisp white polka dots along left and right borders
        ctx.fillStyle = '#FAF0F2';
        for (let y = 26; y < h; y += 32) {
            ctx.beginPath();
            ctx.arc(22, y, 3.8, 0, Math.PI * 2);
            ctx.arc(w - 22, y, 3.8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (pattern === 'cow-print-pink') {
        // Organic Holstein cow print header banner
        drawOrganicCowPrintHeader(ctx, w, 62);
    } else if (pattern === 'bakery-stand') {
        // Striped awning roof canopy and wooden pillars
        drawBakeryAwning(ctx, w, 56);
        // Subtle pastry sketches in background
        ctx.save();
        ctx.strokeStyle = 'rgba(140, 86, 39, 0.08)';
        ctx.lineWidth = 1.5;
        // Background wheat sprig
        ctx.beginPath();
        ctx.moveTo(34, h * 0.45);
        ctx.quadraticCurveTo(24, h * 0.48, 30, h * 0.52);
        ctx.stroke();
        ctx.restore();
    } else if (pattern === 'bakery-doodle') {
        // Retro crimson cursive Bakers header & faint pencil sketches
        drawRetroBakersHeader(ctx, w, 42);
        // Faint bread doodle sketches in margins
        ctx.save();
        ctx.strokeStyle = 'rgba(196, 61, 75, 0.09)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(20, h * 0.38, 14, 18);
        ctx.beginPath();
        ctx.arc(w - 26, h * 0.62, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    } else if (pattern === 'bakery-kawaii') {
        // Pastel yellow highlight & life is better with bread header
        ctx.save();
        ctx.fillStyle = '#FEF3C7';
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(w / 2 - 105, 18, 140, 34, 17);
            ctx.fill();
        } else {
            ctx.fillRect(w / 2 - 105, 18, 140, 34);
        }
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillStyle = '#52341D';
        ctx.fillText('life is better', w / 2 - 36, 30);
        ctx.font = 'bold 16px Georgia, serif';
        ctx.fillText('with. bread.', w / 2 - 34, 45);
        ctx.restore();
        // Kawaii Toast character at top-right
        drawKawaiiToast(ctx, w - 46, 36, 38);
    } else if (pattern === 'red-ticket') {
        // Semicircular ticket punch-out notches on left/right borders
        drawTicketNotches(ctx, w, h);
        // Cream ticket stub paper overlay
        ctx.save();
        ctx.fillStyle = '#FAF0E4';
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(16, 16, w - 32, h - 32, 14);
            ctx.fill();
        } else {
            ctx.fillRect(16, 16, w - 32, h - 32);
        }
        ctx.restore();
        // Ticket header: Spesial Day & vintage camera doodle
        drawSpecialDayTicketHeader(ctx, 16, 16, w - 32);
    } else if (pattern === 'red-kisses-cat') {
        // Crimson lipstick kiss mark prints scattered across margins
        drawLipstickKissMark(ctx, 28, 68, 15, -0.22, '#9F1239');
        drawLipstickKissMark(ctx, w - 28, 86, 16, 0.35, '#BE123C');
        drawLipstickKissMark(ctx, 22, h * 0.35, 14, 0.12, '#9F1239');
        drawLipstickKissMark(ctx, w - 24, h * 0.44, 15, -0.32, '#881337');
        drawLipstickKissMark(ctx, 26, h * 0.68, 14, 0.28, '#BE123C');
        drawLipstickKissMark(ctx, w - 26, h * 0.74, 15, -0.18, '#9F1239');
    } else if (pattern === 'red-airmail') {
        // Torn manuscript paper scrap with vintage cursive manuscript
        drawTornManuscriptHeader(ctx, w, 62);
    } else if (pattern === 'red-capturing-moments') {
        // Cream oat ticket paper card overlay
        ctx.save();
        ctx.fillStyle = '#F5ECE1';
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(16, 16, w - 32, h - 32, 14);
            ctx.fill();
        } else {
            ctx.fillRect(16, 16, w - 32, h - 32);
        }
        // Elegant cursive script on top right
        ctx.font = 'italic 700 17px Georgia, serif';
        ctx.fillStyle = '#3B141C';
        ctx.fillText('Capturing Moments ✦', w / 2 + 36, 40);
        ctx.restore();
        // Silver metallic binder clip clamped over ticket top
        drawSilverBinderClip(ctx, 58, 20, 26);
    } else if (pattern === 'red-receiptify') {
        // Thermal paper receipt pinned at top
        drawReceiptifyThermalPaper(ctx, w, h);
        // Rose-pink metallic clipboard clamp
        drawPinkClipboardClamp(ctx, w / 2, 22, 64);
        // Silver chrome cherries charm at top-left
        drawChromeCherriesCharm(ctx, 36, 32);
    } else if (pattern === 'brown-polka-grid') {
        // Large retro cream polka dots on chocolate background
        drawRetroBrownPolkaDots(ctx, w, h);
    } else if (pattern === 'blue-gingham-star') {
        // Sky blue & white gingham check pattern
        drawBlueGinghamBackground(ctx, w, h);
    } else if (pattern === 'cupid-love-blooming') {
        // Top vintage scroll flourish banner and calligraphy
        drawCupidRomanticHeader(ctx, w, 62);
    } else if (pattern === 'doodle-pink-grid') {
        // Diagonal lattice diamond grid
        drawCreamLatticeGrid(ctx, w, h);
    } else if (pattern === 'lily-polka-pink') {
        // Black polka dots & blooming pink Stargazer lilies
        drawLilyPolkaBackground(ctx, w, h);
    }

    ctx.restore();
}

/**
 * Draws bespoke frame slot decorations (pearls, lace scallops, bows, florals, stamps, etc.)
 */
function drawSlotDecorations(ctx, sx, sy, slotW, slotH, slotIndex, totalSlots, frame) {
    const pattern = frame.pattern || '';

    if (pattern === 'pearl-bow') {
        // Full beaded pearl border around slot
        drawPearlBeadedBorder(ctx, sx, sy, slotW, slotH);
        // Realistic illustrated pink satin bow pinned at bottom center
        drawSatinBow(ctx, sx + slotW / 2, sy + slotH + 2, 52, 28, '#F7B5C6', '#D66A87');
    } else if (pattern === 'victorian-lace') {
        // Detailed antique Victorian crochet doily frame
        drawVictorianLaceBorder(ctx, sx, sy, slotW, slotH);
    } else if (pattern === 'wine-lace-ruffle') {
        // Ruffled crochet lace scallop border
        drawRuffledLaceBorder(ctx, sx, sy, slotW, slotH);
        // Dainty white satin bow with trailing ribbons at top-left
        drawSatinBow(ctx, sx + 14, sy + 6, 44, 24, '#FFFFFF', '#D1D5DB');
    } else if (pattern === 'leopard-ribbon') {
        // Wine-red thin satin ribbon bows alternating top-left and top-right
        const isRight = slotIndex % 2 === 1;
        const rx = isRight ? sx + slotW - 14 : sx + 14;
        drawWineRibbon(ctx, rx, sy + 10, isRight);
    } else if (pattern === 'tartan-floral') {
        // Realistic pressed botanical flowers
        if (slotIndex === 0) {
            drawDriedFlower(ctx, sx - 2, sy + slotH + 12, 26, 'orchid');
        } else if (slotIndex === 1) {
            drawDriedFlower(ctx, sx + slotW + 4, sy + slotH + 12, 22, 'blossom');
        } else if (slotIndex === totalSlots - 1) {
            drawDriedFlower(ctx, sx - 4, sy + slotH + 18, 30, 'cluster');
        }
    } else if (pattern === 'cherry-chrome') {
        // 3D glossy cherries and liquid chrome stars
        if (slotIndex === 0) {
            drawGlossyCherries(ctx, sx + slotW + 12, sy + 32, 17);
        } else if (slotIndex === 1) {
            drawGlossyCherries(ctx, sx - 12, sy + slotH - 18, 17);
        }
        drawChromeStar(ctx, sx + (slotIndex % 2 === 0 ? -12 : slotW + 12), sy + slotH / 2, 9);
    } else if (pattern === 'cats-postage') {
        // Scalloped postage stamp punch holes
        drawPostageStampBorder(ctx, sx, sy, slotW, slotH, '#200910');
        // Washi tape & stamp seals
        if (slotIndex === 0) {
            drawWashiLabel(ctx, sx + 22, sy - 9, 'love today; love tomorrow', '#E8DEC8', '#2D1117');
        } else if (slotIndex === 1) {
            drawPostageStampBadge(ctx, sx + slotW - 68, sy + 12, "You're mine 💕");
        }
    } else if (pattern === 'velvet-roses') {
        // Cascading dark red velvet roses
        if (slotIndex === 0) {
            drawVelvetRose(ctx, sx + slotW + 8, sy + 18, 20);
            drawVelvetRose(ctx, sx + slotW - 2, sy - 6, 16);
        } else if (slotIndex === totalSlots - 1) {
            drawVelvetRose(ctx, sx - 8, sy + slotH + 8, 22);
            drawVelvetRose(ctx, sx + slotW + 6, sy + slotH - 10, 18);
        } else {
            drawVelvetRose(ctx, sx - 8, sy + 24, 18);
        }
    } else if (pattern === 'bakery-stand') {
        // Fresh pastries on slot sides: pancakes, croissant, cinnamon roll
        if (slotIndex === 0) {
            drawPancakeStack(ctx, sx - 10, sy + 30, 22);
        } else if (slotIndex === 1) {
            drawFlakyCroissant(ctx, sx + slotW + 12, sy + slotH * 0.55, 24, 0.25);
        } else if (slotIndex === 2) {
            drawCinnamonRoll(ctx, sx - 12, sy + slotH * 0.65, 18);
        }
    } else if (pattern === 'bakery-doodle') {
        // 3 distinct slot borders: blue corner flourishes, red dashed stitch, blue wavy ruffle
        if (slotIndex === 0) {
            drawVictorianCornerFlourishes(ctx, sx, sy, slotW, slotH, '#3B6E8C');
        } else if (slotIndex === 1) {
            drawDashedStitchBorder(ctx, sx, sy, slotW, slotH, '#C43D4B');
        } else if (slotIndex === 2) {
            drawWavyRuffleBorder(ctx, sx, sy, slotW, slotH, '#4A7B9D');
        }
    } else if (pattern === 'bakery-kawaii') {
        // Smiling waving Kawaii Croissant, chocolate chip cookies & heart
        if (slotIndex === 0) {
            drawChocolateChipCookie(ctx, sx - 12, sy + slotH * 0.45, 12);
        } else if (slotIndex === 1) {
            drawKawaiiCroissant(ctx, sx - 16, sy + slotH + 10, 26);
        } else if (slotIndex === 2) {
            drawChocolateChipCookie(ctx, sx + slotW + 14, sy - 8, 11);
            drawPastelHeart(ctx, sx + slotW - 24, sy + slotH + 20, 16, '#F6D06F');
        }
    } else if (pattern === 'red-kisses-cat') {
        // "You're mine" tape seal & lipstick marks
        if (slotIndex === 0) {
            drawWashiLabel(ctx, sx + 24, sy - 10, "You're mine 💕", '#E5CFD3', '#5A121F');
            drawLipstickKissMark(ctx, sx + slotW - 14, sy + 10, 12, 0.2, '#9F1239');
        } else if (slotIndex === 1) {
            drawLipstickKissMark(ctx, sx - 14, sy + slotH * 0.7, 13, -0.3, '#9F1239');
        }
    } else if (pattern === 'red-airmail') {
        // Diagonal red/white/navy airmail candy-stripe chevron ribbons between slots
        if (slotIndex < totalSlots - 1) {
            drawAirmailChevronRibbon(ctx, sx - 12, sy + slotH + 5, slotW + 24, 12);
        }
    } else if (pattern === 'red-capturing-moments') {
        // Botanical star anise flower, mini vintage camera, thread bow
        if (slotIndex === 0) {
            drawStarAniseFlower(ctx, sx + slotW + 14, sy + slotH * 0.65, 20);
        } else if (slotIndex === 1) {
            drawMiniVintageCamera(ctx, sx - 14, sy + slotH * 0.7, 24);
        } else if (slotIndex === 2) {
            drawThreadBow(ctx, sx + slotW + 12, sy + slotH * 0.75, 20);
        }
    } else if (pattern === 'red-receiptify') {
        // Smartwatch/wristwatch bezel frames with gold lugs & side crown
        drawWatchBezelFrame(ctx, sx, sy, slotW, slotH);
    } else if (pattern === 'blue-gingham-star') {
        // Polaroid white border with Blue color system badge and denim stitched star
        drawBlueColorSystemDecoration(ctx, sx, sy, slotW, slotH);
    } else if (pattern === 'cupid-love-blooming') {
        // Metallic pink heart, Cupid angel, skeleton key & heart padlock
        if (slotIndex === 0) {
            drawPuffyPinkHeart(ctx, sx - 8, sy - 8, 22);
        } else if (slotIndex === 1) {
            drawCupidAngelSilhouette(ctx, sx + slotW + 4, sy - 4, 38);
        } else if (slotIndex === 2) {
            drawAntiqueSkeletonKey(ctx, sx - 16, sy - 2, 42);
        }
        if (slotIndex === totalSlots - 1) {
            drawHeartPadlock(ctx, sx + slotW - 14, sy + slotH + 8, 24);
        }
    } else if (pattern === 'doodle-pink-grid') {
        // 4 hand-drawn pink doodle borders
        if (slotIndex === 0) {
            drawPinkLoopBorder(ctx, sx, sy, slotW, slotH);
        } else if (slotIndex === 1) {
            drawPinkWavyBorder(ctx, sx, sy, slotW, slotH);
        } else if (slotIndex === 2) {
            drawPinkPencilBorder(ctx, sx, sy, slotW, slotH);
        } else {
            drawPinkCloudPillBorder(ctx, sx, sy, slotW, slotH);
        }
    } else if (pattern === 'lily-polka-pink') {
        // Dusty rose beveled picture frame around slot
        drawDustyRosePictureFrame(ctx, sx, sy, slotW, slotH);
    }
}

/**
 * Procedural Vector Graphics Functions for High-Resolution Photostrips
 */

function drawHeartPath(ctx, cx, cy, w, h) {
    ctx.beginPath();
    const topY = cy + h * 0.28;
    ctx.moveTo(cx, topY);
    // Left lobe
    ctx.bezierCurveTo(cx, cy, cx - w / 2, cy, cx - w / 2, topY);
    // Left bottom to tip
    ctx.bezierCurveTo(cx - w / 2, cy + h * 0.62, cx, cy + h * 0.82, cx, cy + h);
    // Right bottom from tip
    ctx.bezierCurveTo(cx, cy + h * 0.82, cx + w / 2, cy + h * 0.62, cx + w / 2, topY);
    // Right lobe
    ctx.bezierCurveTo(cx + w / 2, cy, cx, cy, cx, topY);
    ctx.closePath();
}

function drawPearlBeadedBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    const beadR = 6;
    const step = 15;

    // Top & Bottom rows
    for (let x = sx - 4; x <= sx + slotW + 4; x += step) {
        drawSinglePearl(ctx, x, sy - 4, beadR);
        drawSinglePearl(ctx, x, sy + slotH + 4, beadR);
    }
    // Left & Right columns
    for (let y = sy + step - 4; y < sy + slotH; y += step) {
        drawSinglePearl(ctx, sx - 4, y, beadR);
        drawSinglePearl(ctx, sx + slotW + 4, y, beadR);
    }
    ctx.restore();
}

function drawSinglePearl(ctx, x, y, r) {
    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;

    // Specular gradient
    const grad = ctx.createRadialGradient(x - r * 0.38, y - r * 0.38, r * 0.08, x, y, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#FFF7F0');
    grad.addColorStop(0.7, '#EADCCB');
    grad.addColorStop(1, '#9C8572');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle pearlescent glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Realistic illustrated satin ribbon bow
 */
function drawSatinBow(ctx, cx, cy, w, h, mainColor, shadeColor) {
    ctx.save();
    const hw = w / 2;
    const hh = h / 2;

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // 1. Ribbon Tails
    ctx.fillStyle = mainColor;
    ctx.strokeStyle = shadeColor;
    ctx.lineWidth = 1;

    // Left tail
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 4);
    ctx.bezierCurveTo(cx - 10, cy + 12, cx - 18, cy + 18, cx - 20, cy + 26);
    ctx.lineTo(cx - 12, cy + 22);
    ctx.lineTo(cx - 6, cy + 27);
    ctx.bezierCurveTo(cx - 4, cy + 18, cx - 2, cy + 10, cx - 1, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right tail
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + 4);
    ctx.bezierCurveTo(cx + 10, cy + 12, cx + 18, cy + 18, cx + 20, cy + 26);
    ctx.lineTo(cx + 12, cy + 22);
    ctx.lineTo(cx + 6, cy + 27);
    ctx.bezierCurveTo(cx + 4, cy + 18, cx + 2, cy + 10, cx + 1, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Left Loop
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy);
    ctx.bezierCurveTo(cx - hw * 0.5, cy - hh, cx - hw, cy - hh * 0.8, cx - hw, cy);
    ctx.bezierCurveTo(cx - hw, cy + hh * 0.8, cx - hw * 0.5, cy + hh, cx - 3, cy + 2);
    ctx.closePath();
    const leftGrad = ctx.createLinearGradient(cx - hw, cy, cx, cy);
    leftGrad.addColorStop(0, shadeColor);
    leftGrad.addColorStop(0.5, mainColor);
    leftGrad.addColorStop(1, shadeColor);
    ctx.fillStyle = leftGrad;
    ctx.fill();
    ctx.stroke();

    // Inner fold shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx - hw * 0.55, cy, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Right Loop
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy);
    ctx.bezierCurveTo(cx + hw * 0.5, cy - hh, cx + hw, cy - hh * 0.8, cx + hw, cy);
    ctx.bezierCurveTo(cx + hw, cy + hh * 0.8, cx + hw * 0.5, cy + hh, cx + 3, cy + 2);
    ctx.closePath();
    const rightGrad = ctx.createLinearGradient(cx + hw, cy, cx, cy);
    rightGrad.addColorStop(0, shadeColor);
    rightGrad.addColorStop(0.5, mainColor);
    rightGrad.addColorStop(1, shadeColor);
    ctx.fillStyle = rightGrad;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx + hw * 0.55, cy, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center Knot
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.stroke();

    // Knot highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx - 1.5, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Skinny wine-red ribbon bow with long flowing tails
 */
function drawWineRibbon(ctx, x, y, isRight) {
    ctx.save();
    ctx.translate(x, y);
    if (isRight) {
        ctx.scale(-1, 1);
    }
    drawSatinBow(ctx, 0, 0, 36, 18, '#6B1120', '#3D0710');

    // Long graceful flowing wavy tail
    ctx.strokeStyle = '#6B1120';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-14, 18, 4, 34, -12, 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.bezierCurveTo(12, 20, -6, 36, 8, 52);
    ctx.stroke();
    ctx.restore();
}

/**
 * Ornate Victorian crochet doily frame
 */
function drawVictorianLaceBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#EFE4D6';
    ctx.fillStyle = 'rgba(239, 228, 214, 0.35)';
    ctx.lineWidth = 2.2;

    const r = 8;
    const step = 16;

    // Top scallops
    for (let x = sx; x <= sx + slotW; x += step) {
        ctx.beginPath();
        ctx.arc(x, sy - 2, r, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Picot tip
        ctx.beginPath();
        ctx.arc(x, sy - 2 - r, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FAF2E8';
        ctx.fill();
        ctx.fillStyle = 'rgba(239, 228, 214, 0.35)';
    }
    // Bottom scallops
    for (let x = sx; x <= sx + slotW; x += step) {
        ctx.beginPath();
        ctx.arc(x, sy + slotH + 2, r, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, sy + slotH + 2 + r, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FAF2E8';
        ctx.fill();
        ctx.fillStyle = 'rgba(239, 228, 214, 0.35)';
    }
    // Left scallops
    for (let y = sy; y <= sy + slotH; y += step) {
        ctx.beginPath();
        ctx.arc(sx - 2, y, r, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.stroke();
    }
    // Right scallops
    for (let y = sy; y <= sy + slotH; y += step) {
        ctx.beginPath();
        ctx.arc(sx + slotW + 2, y, r, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Ruffled crochet lace border
 */
function drawRuffledLaceBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#FAF6F0';
    ctx.fillStyle = 'rgba(250, 246, 240, 0.42)';
    ctx.lineWidth = 2;

    const r = 6;
    const step = 12;

    for (let x = sx - 2; x <= sx + slotW + 2; x += step) {
        ctx.beginPath();
        ctx.arc(x, sy - 3, r, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, sy + slotH + 3, r, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
    }
    for (let y = sy; y <= sy + slotH; y += step) {
        ctx.beginPath();
        ctx.arc(sx - 3, y, r, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx + slotW + 3, y, r, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Scalloped postage stamp punch holes
 */
function drawPostageStampBorder(ctx, sx, sy, slotW, slotH, bgColor) {
    ctx.save();
    ctx.strokeStyle = '#FAF4EE';
    ctx.lineWidth = 3.5;
    const m = 6;
    ctx.strokeRect(sx - m, sy - m, slotW + m * 2, slotH + m * 2);

    const holeR = 4;
    const step = 13;
    ctx.fillStyle = bgColor || '#200910';
    for (let x = sx; x <= sx + slotW; x += step) {
        ctx.beginPath();
        ctx.arc(x, sy - m, holeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, sy + slotH + m, holeR, 0, Math.PI * 2);
        ctx.fill();
    }
    for (let y = sy; y <= sy + slotH; y += step) {
        ctx.beginPath();
        ctx.arc(sx - m, y, holeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + slotW + m, y, holeR, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/**
 * Washi tape badge label
 */
function drawWashiLabel(ctx, x, y, text, bg, color) {
    ctx.save();
    ctx.font = '600 12px "Courier New", monospace';
    const textW = ctx.measureText(text).width;
    ctx.fillStyle = bg;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 4;
    ctx.fillRect(x - 8, y - 9, textW + 16, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.strokeRect(x - 8, y - 9, textW + 16, 20);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 5);
    ctx.restore();
}

function drawPostageStampBadge(ctx, x, y, text) {
    ctx.save();
    ctx.fillStyle = '#F8D2DD';
    ctx.strokeStyle = '#B33C5A';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 6, y - 8, 86, 22);
    ctx.strokeRect(x - 6, y - 8, 86, 22);
    ctx.fillStyle = '#5A1A28';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(text, x + 2, y + 6);
    ctx.restore();
}

/**
 * Botanical pressed flowers (orchid, blossom, cluster)
 */
function drawDriedFlower(ctx, cx, cy, r, type) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 5;

    if (type === 'orchid') {
        // Deep velvet burgundy orchid
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / 5);
            ctx.fillStyle = i % 2 === 0 ? '#4F121E' : '#6A192A';
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.6, r * 0.45, r * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dried petal veins
            ctx.strokeStyle = 'rgba(235, 175, 185, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -r * 0.85);
            ctx.stroke();
            ctx.restore();
        }
        // Dried center
        ctx.fillStyle = '#E8A342';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'blossom') {
        // Soft pink pressed blossom
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / 5);
            ctx.fillStyle = '#EFA5B8';
            ctx.beginPath();
            ctx.arc(0, -r * 0.5, r * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = '#8A3448';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Dried floral cluster
        drawDriedFlower(ctx, -8, -6, r * 0.7, 'orchid');
        drawDriedFlower(ctx, 10, 8, r * 0.8, 'blossom');
    }
    ctx.restore();
}

/**
 * 3D Dark velvet roses
 */
function drawVelvetRose(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 5;

    // Green leaves
    ctx.fillStyle = '#264228';
    ctx.beginPath();
    ctx.ellipse(-r * 0.8, -r * 0.5, r * 0.3, r * 0.6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(r * 0.8, r * 0.5, r * 0.3, r * 0.6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Layered rose petals
    const petalColors = ['#450B14', '#6A1020', '#8E172C', '#B5233E', '#450B14'];
    for (let i = 0; i < petalColors.length; i++) {
        ctx.fillStyle = petalColors[i];
        ctx.beginPath();
        ctx.arc(0, 0, r * (1 - i * 0.18), 0, Math.PI * 2);
        ctx.fill();

        // Inner swirl curve
        ctx.strokeStyle = 'rgba(240, 160, 175, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.8 - i * 0.16), i * 1.2, i * 1.2 + Math.PI);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * 3D Glossy cherries with curved silver stems
 */
function drawGlossyCherries(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 5;

    // Silver chrome stems
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.bezierCurveTo(-14, -14, -6, -26, 0, -32);
    ctx.moveTo(10, 12);
    ctx.bezierCurveTo(8, -10, -2, -26, 0, -32);
    ctx.stroke();

    // Chrome leaf at stem joint
    ctx.fillStyle = '#9CA3AF';
    ctx.beginPath();
    ctx.ellipse(4, -30, 4, 9, Math.PI / 3, 0, Math.PI * 2);
    ctx.fill();

    // Cherry 1 (Left)
    drawSingleGlossyCherry(ctx, -10, 8, r);
    // Cherry 2 (Right)
    drawSingleGlossyCherry(ctx, 10, 12, r * 0.95);

    ctx.restore();
}

function drawSingleGlossyCherry(ctx, x, y, r) {
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#FF4D6D');
    grad.addColorStop(0.3, '#C9184A');
    grad.addColorStop(0.75, '#800F2F');
    grad.addColorStop(1, '#3B0414');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Curved specular glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.32, r * 0.28, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * 3D Liquid chrome star
 */
function drawChromeStar(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.38;
        const angle = (i * Math.PI) / 4;
        const x = Math.cos(angle) * rad;
        const y = Math.sin(angle) * rad;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, '#9CA3AF');
    grad.addColorStop(0.65, '#E5E7EB');
    grad.addColorStop(1, '#4B5563');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawChromeStarCharm(ctx, cx, cy, r) {
    ctx.save();
    // Chain links
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - r - 12, 3, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - r - 4, 3, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawChromeStar(ctx, cx, cy, r);
    ctx.restore();
}

function drawGoldenStar(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = '#E8B342';
    ctx.shadowColor = 'rgba(232, 179, 66, 0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

/**
 * Organic Holstein cow print header banner
 */
function drawOrganicCowPrintHeader(ctx, w, h) {
    ctx.save();
    // Crisp white banner
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Realistic organic cow spots
    ctx.fillStyle = '#1A1718';
    const spots = [
        [24, 18, 16, 11], [68, 38, 20, 14], [130, 18, 24, 15], [195, 42, 18, 12],
        [270, 20, 26, 16], [350, 40, 22, 14], [430, 22, 25, 16], [500, 38, 18, 12],
        [540, 14, 14, 10]
    ];
    for (const [cx, cy, rx, ry] of spots) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
    }
    // Bottom border line
    ctx.strokeStyle = '#D9A1AF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.stroke();
    ctx.restore();
}

/**
 * Illustrated Two Cats sitting side-by-side (Black Cat & Fluffy White Kitten)
 */
function drawTwoCatsIllustrated(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // 1. BLACK CAT (Left)
    ctx.save();
    ctx.translate(-38, 6);
    // Body & Chest
    ctx.fillStyle = '#150A0E';
    ctx.beginPath();
    ctx.ellipse(0, 14, 22, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(0, -18, 20, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(-16, -26);
    ctx.lineTo(-22, -44);
    ctx.lineTo(-4, -34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -26);
    ctx.lineTo(22, -44);
    ctx.lineTo(4, -34);
    ctx.closePath();
    ctx.fill();
    // Inner ear pink
    ctx.fillStyle = '#D98295';
    ctx.beginPath();
    ctx.moveTo(-14, -28);
    ctx.lineTo(-19, -40);
    ctx.lineTo(-6, -33);
    ctx.closePath();
    ctx.fill();
    // Luminous cat eyes (Yellow-green)
    ctx.fillStyle = '#E5D648';
    ctx.beginPath();
    ctx.ellipse(-7, -19, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -19, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupils
    ctx.fillStyle = '#100508';
    ctx.beginPath();
    ctx.ellipse(-7, -19, 1.6, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -19, 1.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // White eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-8, -21, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -21, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // White whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -13); ctx.lineTo(-28, -16);
    ctx.moveTo(-12, -10); ctx.lineTo(-28, -10);
    ctx.moveTo(12, -13); ctx.lineTo(28, -16);
    ctx.moveTo(12, -10); ctx.lineTo(28, -10);
    ctx.stroke();
    ctx.restore();

    // 2. WHITE CAT (Right)
    ctx.save();
    ctx.translate(34, 10);
    // Fluffy body
    ctx.fillStyle = '#FDFBF9';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 12, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fluffy Head
    ctx.beginPath();
    ctx.arc(0, -16, 19, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(-15, -24);
    ctx.lineTo(-20, -42);
    ctx.lineTo(-4, -32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -24);
    ctx.lineTo(20, -42);
    ctx.lineTo(4, -32);
    ctx.closePath();
    ctx.fill();
    // Inner ear
    ctx.fillStyle = '#F5B0C0';
    ctx.beginPath();
    ctx.moveTo(13, -26);
    ctx.lineTo(17, -38);
    ctx.lineTo(6, -31);
    ctx.closePath();
    ctx.fill();
    // Sky blue eyes
    ctx.fillStyle = '#5EA8E6';
    ctx.beginPath();
    ctx.ellipse(-6, -17, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -17, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#103254';
    ctx.beginPath();
    ctx.arc(-6, -17, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -17, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // White eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-7, -19, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -19, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Pink nose
    ctx.fillStyle = '#F38C9E';
    ctx.beginPath();
    ctx.ellipse(0, -12, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Whiskers
    ctx.strokeStyle = '#D1C8C0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -11); ctx.lineTo(-24, -14);
    ctx.moveTo(-10, -8); ctx.lineTo(-24, -8);
    ctx.moveTo(10, -11); ctx.lineTo(24, -14);
    ctx.moveTo(10, -8); ctx.lineTo(24, -8);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

/**
 * Bé Yuyu Chibi Taiyaki Girl
 */
function drawChibiTaiyakiGirl(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // Hair back
    ctx.fillStyle = '#1A1416';
    ctx.beginPath();
    ctx.arc(0, -12, 34, 0, Math.PI * 2);
    ctx.fill();

    // Round face
    ctx.fillStyle = '#FFEEDB';
    ctx.beginPath();
    ctx.arc(0, -8, 27, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blushing cheeks
    ctx.fillStyle = 'rgba(255, 140, 160, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-16, -4, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(16, -4, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big anime eyes
    ctx.fillStyle = '#1D1316';
    ctx.beginPath();
    ctx.ellipse(-11, -12, 6, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(11, -12, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Starburst eye glints
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-12, -14, 2.5, 0, Math.PI * 2);
    ctx.arc(-9, -9, 1.4, 0, Math.PI * 2);
    ctx.arc(10, -14, 2.5, 0, Math.PI * 2);
    ctx.arc(13, -9, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Hair bangs & clips
    ctx.fillStyle = '#1A1416';
    ctx.beginPath();
    ctx.arc(-14, -24, 18, 0, Math.PI);
    ctx.arc(14, -24, 18, 0, Math.PI);
    ctx.fill();
    // Yellow hair clip
    ctx.fillStyle = '#F2C94C';
    ctx.fillRect(-24, -22, 8, 4);

    // Golden Taiyaki waffle in hands
    ctx.save();
    ctx.translate(0, 14);
    ctx.fillStyle = '#D99842';
    ctx.strokeStyle = '#8C561E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Fish tail
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.lineTo(24, -10);
    ctx.lineTo(20, 0);
    ctx.lineTo(24, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Fish eye & waffle scale lines
    ctx.fillStyle = '#3A1E08';
    ctx.beginPath();
    ctx.arc(-10, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#A86C2B';
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(-4, 6);
    ctx.moveTo(4, -6); ctx.lineTo(4, 6);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

/**
 * Bé Yuyu Chibi Girl with Oversized Round Glasses
 */
function drawChibiGlassesGirl(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dark wavy hair
    ctx.fillStyle = '#221518';
    ctx.beginPath();
    ctx.arc(0, -10, 36, 0, Math.PI * 2);
    ctx.fill();

    // Round face
    ctx.fillStyle = '#FFEEDB';
    ctx.beginPath();
    ctx.arc(0, -6, 28, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blush
    ctx.fillStyle = 'rgba(245, 125, 150, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-18, -2, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(18, -2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big anime eyes
    ctx.fillStyle = '#221316';
    ctx.beginPath();
    ctx.ellipse(-12, -9, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -9, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-13, -11, 2.4, 0, Math.PI * 2);
    ctx.arc(11, -11, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Big Oversized Round Glasses (Crimson/Burgundy)
    ctx.strokeStyle = '#6E1423';
    ctx.lineWidth = 3.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    // Left lens
    ctx.beginPath();
    ctx.arc(-13, -8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right lens
    ctx.beginPath();
    ctx.arc(13, -8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(-1, -8);
    ctx.lineTo(1, -8);
    ctx.stroke();

    // Hair bangs
    ctx.fillStyle = '#221518';
    ctx.beginPath();
    ctx.arc(-12, -26, 16, 0, Math.PI);
    ctx.arc(12, -26, 16, 0, Math.PI);
    ctx.fill();

    ctx.restore();
}

/**
 * Bé Yuyu Chibi Girl with Pink Cap
 */
function drawChibiPinkCapGirl(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // Hair
    ctx.fillStyle = '#3E241E';
    ctx.beginPath();
    ctx.arc(0, -6, 32, 0, Math.PI * 2);
    ctx.fill();

    // Round Face
    ctx.fillStyle = '#FFEEDB';
    ctx.beginPath();
    ctx.arc(0, -2, 26, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Blush
    ctx.fillStyle = 'rgba(255, 120, 145, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-16, 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(16, 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#221412';
    ctx.beginPath();
    ctx.ellipse(-11, -4, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.ellipse(11, -4, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-12, -6, 2.2, 0, Math.PI * 2);
    ctx.arc(10, -6, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Pink Baseball Cap
    ctx.fillStyle = '#F4AEC0';
    ctx.strokeStyle = '#D9738D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -18, 26, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cap Visor
    ctx.beginPath();
    ctx.ellipse(0, -17, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Little Red Heart Badge on Cap
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.arc(-2, -26, 2.5, 0, Math.PI * 2);
    ctx.arc(2, -26, 2.5, 0, Math.PI * 2);
    ctx.lineTo(0, -22);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * Draws bespoke frame signature when no custom caption is typed
 */
function drawFrameFooterSignature(ctx, w, h, footerCenterY, frame) {
    const pattern = frame.pattern || '';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pattern === 'pearl-bow') {
        ctx.font = '600 20px Georgia, "Playfair Display", serif';
        ctx.fillStyle = '#FAF2EB';
        ctx.letterSpacing = '4px';
        ctx.fillText('F O R E V E R M O R E', w / 2, footerCenterY);
    } else if (pattern === 'victorian-lace') {
        ctx.font = '600 21px Georgia, "Playfair Display", serif';
        ctx.fillStyle = '#D9C5B2';
        ctx.fillText('M E M O R I E S', w / 2, footerCenterY);
    } else if (pattern === 'wine-lace-ruffle') {
        ctx.font = 'italic 600 28px Georgia, "Playfair Display", serif';
        ctx.fillStyle = '#FAF6F0';
        ctx.fillText('Made of love', w / 2, footerCenterY);
    } else if (pattern === 'tartan-floral') {
        // Plaque banner with "Little Miss Delulu"
        ctx.fillStyle = '#381219';
        ctx.strokeStyle = '#E2B19F';
        ctx.lineWidth = 1.8;
        ctx.fillRect(w / 2 - 110, footerCenterY - 18, 220, 36);
        ctx.strokeRect(w / 2 - 110, footerCenterY - 18, 220, 36);
        ctx.font = 'italic 600 22px Georgia, serif';
        ctx.fillStyle = '#FAF2EB';
        ctx.fillText('Little Miss Delulu', w / 2, footerCenterY);
    } else if (pattern === 'cherry-chrome') {
        // Chunky Y2K stacked bubble typography with metallic glow
        ctx.font = '900 22px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowBlur = 10;
        ctx.fillText('Good things are coming ✦', w / 2, footerCenterY);
    } else if (pattern === 'cats-postage') {
        // Two Cats sitting side-by-side
        drawTwoCatsIllustrated(ctx, w / 2, footerCenterY - 12);
    } else if (pattern === 'velvet-roses') {
        // Lush white satin bow & velvet roses signature
        drawSatinBow(ctx, w / 2, footerCenterY, 68, 36, '#FAF7F2', '#D1D5DB');
    } else if (pattern === 'chibi-taiyaki') {
        // Bé Yuyu chibi girl with taiyaki
        drawChibiTaiyakiGirl(ctx, w / 2, footerCenterY - 10);
    } else if (pattern === 'polka-chibi') {
        // Bé Yuyu round glasses chibi girl
        drawChibiGlassesGirl(ctx, w / 2, footerCenterY - 8);
    } else if (pattern === 'cow-print-pink') {
        // Bé Yuyu pink cap chibi girl
        drawChibiPinkCapGirl(ctx, w / 2, footerCenterY - 6);
    } else if (pattern === 'bakery-stand') {
        // Wooden bakery shop counter with menu chalkboard, succulents & puffy Bakery text
        drawBakeryCounterFooter(ctx, w, h, footerCenterY);
    } else if (pattern === 'bakery-doodle') {
        // Delicate vintage bakery signature
        ctx.font = 'italic 500 13px Georgia, serif';
        ctx.fillStyle = '#8C6044';
        ctx.fillText('Freshly baked moments • MIORA', w / 2, footerCenterY);
    } else if (pattern === 'bakery-kawaii') {
        // Yellow & white pastel gingham tablecloth border with chocolate chip cookie
        drawYellowGinghamFooter(ctx, w, h, footerCenterY);
    } else if (pattern === 'red-ticket') {
        // Authentic ticket barcode stub
        drawBarcodeStub(ctx, w / 2, footerCenterY, 180, 52, '0 123456 789111');
    } else if (pattern === 'red-kisses-cat') {
        // Fluffy bouquet-holding kitten with pink ear ribbon
        drawBouquetKitten(ctx, w / 2, footerCenterY);
    } else if (pattern === 'red-airmail') {
        // Vintage circular airmail cancellation postmark stamp
        drawAirmailPostmarkFooter(ctx, w / 2, footerCenterY);
    } else if (pattern === 'red-capturing-moments') {
        // Perforated tear dots & barcode stub
        ctx.fillStyle = '#8C5627';
        for (let x = 32; x < w - 32; x += 16) {
            ctx.beginPath();
            ctx.arc(x, footerCenterY - 24, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        drawBarcodeStub(ctx, w / 2, footerCenterY + 12, 170, 48, '0 123456 789111');
    } else if (pattern === 'red-receiptify') {
        // Thermal receipt footer with tracklist lines & mini barcode
        ctx.font = '500 11px monospace';
        ctx.fillStyle = '#262626';
        ctx.fillText('01 SWEET MEMORIES ..... 3:42', w / 2, footerCenterY - 20);
        ctx.fillText('02 SPECIAL MOMENTS .... 4:15', w / 2, footerCenterY - 6);
        ctx.fillText('TOTAL: 100% HAPPINESS', w / 2, footerCenterY + 10);
        drawBarcodeStub(ctx, w / 2, footerCenterY + 32, 140, 26, 'MIORA-REC-9021');
    } else if (pattern === 'brown-polka-grid') {
        // Retro cursive Miora Photo Booth with sparkle stars
        drawRetroLidiPhotoBooth(ctx, w, footerCenterY);
    } else if (pattern === 'blue-gingham-star') {
        // Soft blue brand caption
        ctx.font = 'italic 700 13px Georgia, serif';
        ctx.fillStyle = '#2A4E74';
        ctx.fillText('Blue color system • MIORA', w / 2, footerCenterY);
    } else if (pattern === 'cupid-love-blooming') {
        // Grand romantic flourished script: Love is Blooming
        drawLoveIsBloomingFooter(ctx, w, footerCenterY);
    } else if (pattern === 'doodle-pink-grid') {
        ctx.font = 'italic 700 15px Georgia, cursive, sans-serif';
        ctx.fillStyle = '#EC4899';
        ctx.fillText('~ Sweet Memories • MIORA ~', w / 2, footerCenterY);
    } else if (pattern === 'lily-polka-pink') {
        ctx.font = 'italic 600 15px Georgia, serif';
        ctx.fillStyle = '#262626';
        ctx.textAlign = 'left';
        ctx.fillText('Miora Parisienne • Lily', 34, footerCenterY + 14);
    }
    ctx.restore();
}

function drawWashiTapeCorners(ctx, sx, sy, sw, sh, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.45;

    // Top-left diagonal tape strip
    ctx.translate(sx + 12, sy + 6);
    ctx.rotate(-Math.PI / 6);
    ctx.fillRect(-26, -8, 52, 16);
    ctx.restore();

    // Bottom-right diagonal tape strip
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.translate(sx + sw - 12, sy + sh - 6);
    ctx.rotate(-Math.PI / 6);
    ctx.fillRect(-26, -8, 52, 16);
    ctx.restore();
}

function drawBakeryAwning(ctx, w, h) {
    ctx.save();
    const scallopCount = 10;
    const stripeW = w / scallopCount;
    for (let i = 0; i < scallopCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#7C431D' : '#FFF9F0';
        ctx.fillRect(i * stripeW, 0, stripeW + 0.5, h - 10);
        ctx.beginPath();
        ctx.arc(i * stripeW + stripeW / 2, h - 10, stripeW / 2, 0, Math.PI);
        ctx.fill();
    }
    ctx.strokeStyle = '#5A2E12';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < scallopCount; i++) {
        ctx.arc(i * stripeW + stripeW / 2, h - 10, stripeW / 2, 0, Math.PI);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(74, 38, 15, 0.12)';
    ctx.fillRect(0, h, w, 6);

    ctx.fillStyle = '#C8935C';
    ctx.fillRect(10, h, 7, 720);
    ctx.fillRect(w - 17, h, 7, 720);
    ctx.restore();
}

function drawPancakeStack(ctx, x, y, size) {
    ctx.save();
    const cakes = [
        { dy: 14, rx: size, ry: size * 0.42, fill: '#E89748' },
        { dy: 7, rx: size * 0.94, ry: size * 0.39, fill: '#F5AB5A' },
        { dy: 0, rx: size * 0.88, ry: size * 0.36, fill: '#FBBE74' },
    ];
    for (const c of cakes) {
        ctx.fillStyle = c.fill;
        ctx.strokeStyle = '#9A4C16';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(x, y + c.dy, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180, 83, 9, 0.75)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.65, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 4, y + 2, 4, 12);
    ctx.beginPath();
    ctx.arc(x - 2, y + 14, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(x - 5, y - 9, 10, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawFlakyCroissant(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);

    ctx.fillStyle = '#E8933C';
    ctx.strokeStyle = '#944714';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, size * 0.3);
    ctx.quadraticCurveTo(-size * 0.4, -size * 0.7, 0, -size * 0.75);
    ctx.quadraticCurveTo(size * 0.4, -size * 0.7, size * 0.9, size * 0.3);
    ctx.quadraticCurveTo(size * 0.5, size * 0.1, 0, size * 0.45);
    ctx.quadraticCurveTo(-size * 0.5, size * 0.1, -size * 0.9, size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#7C3408';
    ctx.lineWidth = 1.4;
    [-0.45, -0.15, 0.15, 0.45].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(size * offset, -size * 0.65);
        ctx.quadraticCurveTo(size * (offset * 1.1), 0, size * (offset * 0.8), size * 0.35);
        ctx.stroke();
    });

    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.3, size * 0.28, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawCinnamonRoll(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#D97724';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#5B2508';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4.2; a += 0.2) {
        const r = (size * 0.18) + (a / (Math.PI * 4.2)) * (size * 0.65);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * (r * 0.85);
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 253, 248, 0.88)';
    ctx.beginPath();
    ctx.ellipse(0, -2, size * 0.55, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3, 0, 4, 10);
    ctx.fillRect(4, -1, 3, 8);

    ctx.restore();
}

function drawBakeryCounterFooter(ctx, w, h, footerCenterY) {
    ctx.save();
    const counterW = w - 36;
    const counterX = 18;
    const topY = footerCenterY - 26;
    const counterH = 68;

    ctx.fillStyle = '#8C5627';
    ctx.strokeStyle = '#5C381E';
    ctx.lineWidth = 1.5;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(counterX, topY, counterW, 14, 4);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(counterX, topY, counterW, 14);
        ctx.strokeRect(counterX, topY, counterW, 14);
    }

    ctx.fillStyle = '#C2673D';
    ctx.beginPath();
    ctx.moveTo(counterX + 30, topY);
    ctx.lineTo(counterX + 26, topY - 11);
    ctx.lineTo(counterX + 40, topY - 11);
    ctx.lineTo(counterX + 36, topY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38A169';
    ctx.beginPath();
    ctx.arc(counterX + 33, topY - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#48BB78';
    ctx.beginPath();
    ctx.arc(counterX + 33, topY - 16, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F7FAFC';
    ctx.strokeStyle = '#CBD5E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(counterX + 50, topY - 10, 10, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2F855A';
    ctx.beginPath();
    ctx.arc(counterX + 55, topY - 13, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2D3748';
    ctx.strokeStyle = '#975A16';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(counterX + counterW - 46, topY - 18, 22, 18);
    ctx.fillRect(counterX + counterW - 45, topY - 17, 20, 16);
    ctx.fillStyle = '#FAF5FF';
    ctx.font = '600 7px sans-serif';
    ctx.fillText('MENU', counterX + counterW - 35, topY - 8);

    ctx.fillStyle = '#5A3215';
    ctx.fillRect(counterX + 3, topY + 14, counterW - 6, counterH);
    ctx.strokeStyle = '#42240E';
    ctx.lineWidth = 1.4;
    for (let x = counterX + 16; x < counterX + counterW - 10; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, topY + 14);
        ctx.lineTo(x, topY + 14 + counterH);
        ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px "Arial Rounded MT Bold", "Nunito", sans-serif';
    ctx.fillStyle = '#321606';
    ctx.fillText('Bakery', w / 2, topY + 44);
    ctx.fillStyle = '#FFF7ED';
    ctx.fillText('Bakery', w / 2, topY + 41);

    ctx.font = '600 9px system-ui, sans-serif';
    ctx.fillStyle = '#D4A373';
    ctx.fillText('@Memoiré', counterX + 28, topY + 14 + counterH - 6);

    ctx.restore();
}

function drawRetroBakersHeader(ctx, w, y) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 700 36px Georgia, "Brush Script MT", cursive, serif';

    ctx.shadowColor = 'rgba(196, 61, 75, 0.3)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Bakers', w / 2 + 1, y + 1);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#C43D4B';
    ctx.fillText('Bakers', w / 2, y);

    ctx.strokeStyle = '#C43D4B';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 85, y + 2);
    ctx.quadraticCurveTo(w / 2 - 105, y - 6, w / 2 - 115, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 + 85, y + 2);
    ctx.quadraticCurveTo(w / 2 + 105, y - 6, w / 2 + 115, y);
    ctx.stroke();

    ctx.restore();
}

function drawVictorianCornerFlourishes(ctx, sx, sy, slotW, slotH, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;

    const corners = [
        { x: sx - 4, y: sy - 4, sx: 1, sy: 1 },
        { x: sx + slotW + 4, y: sy - 4, sx: -1, sy: 1 },
        { x: sx - 4, y: sy + slotH + 4, sx: 1, sy: -1 },
        { x: sx + slotW + 4, y: sy + slotH + 4, sx: -1, sy: -1 },
    ];

    for (const c of corners) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.sx, c.sy);
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(0, 6);
        ctx.quadraticCurveTo(0, 0, 6, 0);
        ctx.lineTo(16, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(8, 8, 3.5, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function drawDashedStitchBorder(ctx, sx, sy, slotW, slotH, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(sx - 4, sy - 4, slotW + 8, slotH + 8);
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    [
        [sx - 4, sy - 4],
        [sx + slotW + 4, sy - 4],
        [sx - 4, sy + slotH + 4],
        [sx + slotW + 4, sy + slotH + 4],
    ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawWavyRuffleBorder(ctx, sx, sy, slotW, slotH, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    const waveSize = 10;
    const ox = sx - 4;
    const oy = sy - 4;
    const ow = slotW + 8;
    const oh = slotH + 8;

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (let x = ox; x < ox + ow; x += waveSize) {
        ctx.arc(x + waveSize / 2, oy, waveSize / 2, Math.PI, 0);
    }
    for (let y = oy; y < oy + oh; y += waveSize) {
        ctx.arc(ox + ow, y + waveSize / 2, waveSize / 2, -Math.PI / 2, Math.PI / 2);
    }
    for (let x = ox + ow; x > ox; x -= waveSize) {
        ctx.arc(x - waveSize / 2, oy + oh, waveSize / 2, 0, Math.PI);
    }
    for (let y = oy + oh; y > oy; y -= waveSize) {
        ctx.arc(ox, y - waveSize / 2, waveSize / 2, Math.PI / 2, -Math.PI / 2);
    }
    ctx.stroke();
    ctx.restore();
}

function drawKawaiiToast(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#92400E';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.6;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 2, size, size, 7);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(-size / 2, -size / 2, size, size);
    }

    ctx.fillStyle = '#FEF3C7';
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6, 5);
        ctx.fill();
    } else {
        ctx.fillRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6);
    }

    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-size * 0.22, -size * 0.08, 3.5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.22, -size * 0.08, 3.5, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.28, size * 0.1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.28, size * 0.1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, size * 0.08, 3.5, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size / 2);
    ctx.lineTo(-size * 0.2, size / 2 + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size / 2);
    ctx.lineTo(size * 0.2, size / 2 + 5);
    ctx.stroke();

    ctx.restore();
}

function drawKawaiiCroissant(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, size * 0.2);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.65, 0, -size * 0.7);
    ctx.quadraticCurveTo(size * 0.3, -size * 0.65, size * 0.9, size * 0.2);
    ctx.quadraticCurveTo(size * 0.45, size * 0.05, 0, size * 0.4);
    ctx.quadraticCurveTo(-size * 0.45, size * 0.05, -size * 0.9, size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-size * 0.18, -size * 0.12, 3, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size * 0.18, -size * 0.12, 3, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.24, size * 0.04, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.24, size * 0.04, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(size * 0.65, -size * 0.1);
    ctx.lineTo(size * 0.95, -size * 0.35);
    ctx.stroke();

    ctx.restore();
}

function drawChocolateChipCookie(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#451A03';
    const chips = [
        [cx - r * 0.4, cy - r * 0.3],
        [cx + r * 0.35, cy - r * 0.2],
        [cx, cy + r * 0.1],
        [cx - r * 0.25, cy + r * 0.45],
        [cx + r * 0.35, cy + r * 0.35],
    ];
    for (const [chx, chy] of chips) {
        ctx.beginPath();
        ctx.arc(chx, chy, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPastelHeart(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    drawHeartPath(ctx, cx, cy - r / 2, r, r);
    ctx.fill();
    ctx.restore();
}

function drawYellowGinghamFooter(ctx, w, h, footerCenterY) {
    ctx.save();
    const gHeight = 50;
    const gy = h - gHeight;
    ctx.fillStyle = '#FFFDF5';
    ctx.fillRect(0, gy, w, gHeight);

    const sq = 14;
    for (let x = 0; x < w; x += sq) {
        for (let y = gy; y < h; y += sq) {
            const isCol = Math.floor(x / sq) % 2 === 0;
            const isRow = Math.floor((y - gy) / sq) % 2 === 0;
            if (isCol && isRow) {
                ctx.fillStyle = '#F59E0B';
                ctx.globalAlpha = 0.45;
            } else if (isCol || isRow) {
                ctx.fillStyle = '#FDE68A';
                ctx.globalAlpha = 0.55;
            } else {
                ctx.globalAlpha = 0;
            }
            if (ctx.globalAlpha > 0) {
                ctx.fillRect(x, y, sq, sq);
            }
        }
    }
    ctx.globalAlpha = 1;

    drawChocolateChipCookie(ctx, w - 36, gy + 14, 15);

    ctx.textAlign = 'left';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = '#78350F';
    ctx.fillText('MIORA • Memoiré', 24, gy + 32);

    ctx.restore();
}

function drawTicketNotches(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = '#FAF7F2';
    const notchYs = [68, h * 0.35, h * 0.62, h - 74];
    for (const ny of notchYs) {
        ctx.beginPath();
        ctx.arc(0, ny, 11, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w, ny, 11, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawSpecialDayTicketHeader(ctx, sx, sy, w) {
    ctx.save();
    ctx.font = 'italic 700 24px Georgia, "Brush Script MT", cursive, serif';
    ctx.fillStyle = '#3D161C';
    ctx.fillText('Spesial Day!', sx + 20, sy + 32);

    const camX = sx + w - 48;
    const camY = sy + 24;
    ctx.strokeStyle = '#3D161C';
    ctx.lineWidth = 1.6;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(camX - 16, camY - 10, 32, 20, 3);
        ctx.stroke();
    } else {
        ctx.strokeRect(camX - 16, camY - 10, 32, 20);
    }
    ctx.beginPath();
    ctx.arc(camX, camY, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(camX + 6, camY - 13, 6, 3);

    ctx.restore();
}

function drawBarcodeStub(ctx, cx, cy, w, h, code) {
    ctx.save();
    ctx.translate(cx - w / 2, cy - h / 2);

    const barWidths = [2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3];
    let curX = 10;
    const barH = h - 16;
    ctx.fillStyle = '#200A10';
    for (let i = 0; i < barWidths.length && curX < w - 10; i++) {
        const bw = barWidths[i];
        if (i % 2 === 0) {
            ctx.fillRect(curX, 0, bw, barH);
        }
        curX += bw + 2;
    }

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#200A10';
    ctx.fillText(code, w / 2, h - 2);

    ctx.restore();
}

function drawLipstickKissMark(ctx, cx, cy, r, angle, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle || 0);
    ctx.fillStyle = color || '#9F1239';
    ctx.globalAlpha = 0.88;

    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.1);
    ctx.bezierCurveTo(-r * 0.7, -r * 0.75, -r * 0.2, -r * 0.8, 0, -r * 0.4);
    ctx.bezierCurveTo(r * 0.2, -r * 0.8, r * 0.7, -r * 0.75, r, -r * 0.1);
    ctx.bezierCurveTo(r * 0.5, -r * 0.2, -r * 0.5, -r * 0.2, -r, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.1);
    ctx.bezierCurveTo(-r * 0.6, r * 0.85, r * 0.6, r * 0.85, r * 0.9, r * 0.1);
    ctx.bezierCurveTo(r * 0.4, r * 0.2, -r * 0.4, r * 0.2, -r * 0.9, r * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawBouquetKitten(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.ellipse(0, -14, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(-14, -36);
    ctx.lineTo(-4, -28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -22);
    ctx.lineTo(14, -36);
    ctx.lineTo(4, -28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(-18, -23);
    ctx.lineTo(-14, -31);
    ctx.lineTo(-7, -27);
    ctx.closePath();
    ctx.fill();

    drawSatinBow(ctx, 16, -30, 20, 12, '#F472B6', '#DB2777');

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, -9, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(-9, -15, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -15, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-8, -17, 1.8, 0, Math.PI * 2);
    ctx.arc(10, -17, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.moveTo(-2.5, -9);
    ctx.lineTo(2.5, -9);
    ctx.lineTo(0, -6.5);
    ctx.closePath();
    ctx.fill();

    const bqY = 16;
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(-16, bqY + 22);
    ctx.lineTo(-24, bqY);
    ctx.lineTo(24, bqY);
    ctx.lineTo(16, bqY + 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(-8, bqY - 4, 7, 0, Math.PI * 2);
    ctx.arc(8, bqY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(0, bqY - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-15, bqY - 2, 4, 0, Math.PI * 2);
    ctx.arc(15, bqY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.ellipse(-18, bqY - 8, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(18, bqY - 9, 5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-13, bqY + 6, 5, 0, Math.PI * 2);
    ctx.arc(13, bqY + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawTornManuscriptHeader(ctx, w, h) {
    ctx.save();
    const px = 20;
    const py = 14;
    const pw = w - 40;
    const ph = 50;

    ctx.fillStyle = '#FDF6EC';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pw, py);
    ctx.lineTo(px + pw, py + ph - 8);
    for (let x = px + pw; x > px; x -= 12) {
        ctx.lineTo(x - 6, py + ph + (Math.sin(x) * 4));
        ctx.lineTo(x - 12, py + ph - 4);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(88, 28, 36, 0.55)';
    ctx.lineWidth = 1.2;
    for (let y = py + 14; y < py + ph - 6; y += 11) {
        ctx.beginPath();
        ctx.moveTo(px + 12, y);
        for (let x = px + 12; x < px + pw - 14; x += 16) {
            ctx.quadraticCurveTo(x + 4, y - 2.5, x + 8, y);
            ctx.quadraticCurveTo(x + 12, y + 2.5, x + 16, y);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawAirmailChevronRibbon(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const colors = ['#C42535', '#FFFFFF', '#1E3A8A'];
    const bandW = 12;
    let ci = 0;
    for (let bx = x - h; bx < x + w + h; bx += bandW) {
        ctx.fillStyle = colors[ci % 3];
        ci++;
        ctx.beginPath();
        ctx.moveTo(bx, y + h);
        ctx.lineTo(bx + bandW, y + h);
        ctx.lineTo(bx + bandW + h, y);
        ctx.lineTo(bx + h, y);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawAirmailPostmarkFooter(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#FAF0E4';
    ctx.fillStyle = '#FAF0E4';
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.arc(-24, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-24, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAR AVION', -24, -4);
    ctx.fillText('1928', -24, 6);

    ctx.lineWidth = 1.4;
    for (const dy of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(2, dy);
        for (let x = 2; x < 48; x += 12) {
            ctx.quadraticCurveTo(x + 3, dy - 3, x + 6, dy);
            ctx.quadraticCurveTo(x + 9, dy + 3, x + 12, dy);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawSilverBinderClip(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 0.2);
    ctx.lineTo(size * 0.6, -size * 0.2);
    ctx.lineTo(size * 0.45, size * 0.55);
    ctx.lineTo(-size * 0.45, size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.15);
    ctx.lineTo(-size * 0.2, -size * 0.85);
    ctx.quadraticCurveTo(0, -size * 1.1, size * 0.2, -size * 0.85);
    ctx.lineTo(size * 0.25, -size * 0.15);
    ctx.stroke();

    ctx.restore();
}

function drawStarAniseFlower(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    const petals = 8;
    for (let i = 0; i < petals; i++) {
        const a = (i * Math.PI * 2) / petals;
        ctx.save();
        ctx.rotate(a);

        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.2, size * 0.5, 0, size);
        ctx.quadraticCurveTo(-size * 0.2, size * 0.5, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.5, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    ctx.restore();
}

function drawMiniVintageCamera(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-size * 0.6, -size * 0.4, size * 1.2, size * 0.8);
    ctx.strokeRect(-size * 0.6, -size * 0.4, size * 1.2, size * 0.8);

    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-size * 0.6, -size * 0.4, size * 1.2, size * 0.2);

    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, size * 0.05, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.fillRect(size * 0.25, -size * 0.52, size * 0.16, size * 0.12);

    ctx.restore();
}

function drawThreadBow(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.bezierCurveTo(-size * 0.2, -size * 0.6, -size, -size * 0.4, 0, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.bezierCurveTo(size * 0.2, -size * 0.6, size, -size * 0.4, 0, 0);
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.4, size * 0.4, -size * 0.3, size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.4, size * 0.4, size * 0.3, size * 0.7);
    ctx.stroke();

    ctx.restore();
}

function drawPinkClipboardClamp(ctx, cx, cy, w) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#E594A5';
    ctx.strokeStyle = '#9D174D';
    ctx.lineWidth = 1.8;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -10, w, 22, 5);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(-w / 2, -10, w, 22);
        ctx.strokeRect(-w / 2, -10, w, 22);
    }

    ctx.fillStyle = '#48111A';
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E594A5';
    ctx.beginPath();
    ctx.arc(0, -16, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawReceiptifyThermalPaper(ctx, w, h) {
    ctx.save();
    const rw = w - 54;
    const rx = 27;
    const ry = 22;
    const rh = h - 44;

    ctx.fillStyle = '#FAF9F6';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 8;
    ctx.fillRect(rx, ry, rw, rh);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#18181B';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText('RECEIPTIFY', w / 2, ry + 24);

    ctx.font = '500 9px monospace';
    ctx.fillText('LAST MONTH • TRACKLIST', w / 2, ry + 36);

    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 12, ry + 42);
    ctx.lineTo(rx + rw - 12, ry + 42);
    ctx.stroke();

    ctx.restore();
}

function drawChromeCherriesCharm(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#CBD5E1';
    for (let cy = y - 18; cy < y; cy += 4) {
        ctx.beginPath();
        ctx.arc(x, cy, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
    drawGlossyCherries(ctx, x, y, 12);
    ctx.restore();
}

function drawWatchBezelFrame(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.fillStyle = '#CA8A04';
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 1.4;

    ctx.fillRect(sx + 16, sy - 8, 12, 9);
    ctx.strokeRect(sx + 16, sy - 8, 12, 9);
    ctx.fillRect(sx + slotW - 28, sy - 8, 12, 9);
    ctx.strokeRect(sx + slotW - 28, sy - 8, 12, 9);

    ctx.fillRect(sx + 16, sy + slotH - 1, 12, 9);
    ctx.strokeRect(sx + 16, sy + slotH - 1, 12, 9);
    ctx.fillRect(sx + slotW - 28, sy + slotH - 1, 12, 9);
    ctx.strokeRect(sx + slotW - 28, sy + slotH - 1, 12, 9);

    ctx.fillStyle = '#EAB308';
    ctx.strokeRect(sx + slotW + 1, sy + slotH / 2 - 8, 6, 16);
    ctx.fillRect(sx + slotW + 1, sy + slotH / 2 - 8, 6, 16);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3.5;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(sx - 3, sy - 3, slotW + 6, slotH + 6, 24);
        ctx.stroke();
    } else {
        ctx.strokeRect(sx - 3, sy - 3, slotW + 6, slotH + 6);
    }

    ctx.restore();
}

function drawRetroBrownPolkaDots(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = '#FAF0E1';
    const radius = 13;
    const stepX = 46;
    const stepY = 46;
    for (let y = 0; y <= h + stepY; y += stepY) {
        const row = Math.floor(y / stepY);
        const offsetX = (row % 2 === 0) ? 0 : stepX / 2;
        for (let x = -stepX / 2; x <= w + stepX; x += stepX) {
            ctx.beginPath();
            ctx.arc(x + offsetX, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawFourPointStar(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawRetroLidiPhotoBooth(ctx, w, footerCenterY) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'italic 700 46px Georgia, "Brush Script MT", cursive, serif';
    ctx.fillStyle = '#FAF0E1';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText('Miora', w / 2, footerCenterY - 12);

    drawFourPointStar(ctx, w / 2 - 82, footerCenterY - 6, 8, '#FAF0E1');
    drawFourPointStar(ctx, w / 2 + 78, footerCenterY - 18, 10, '#FAF0E1');

    ctx.shadowBlur = 0;
    ctx.font = '800 13px "Instrument Sans", sans-serif';
    ctx.fillText('P H O T O   B O O T H', w / 2, footerCenterY + 22);

    ctx.restore();
}

function drawBlueGinghamBackground(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    const sq = 15;
    for (let x = 0; x < w; x += sq) {
        for (let y = 0; y < h; y += sq) {
            const isCol = Math.floor(x / sq) % 2 === 0;
            const isRow = Math.floor(y / sq) % 2 === 0;
            if (isCol && isRow) {
                ctx.fillStyle = '#7CAAD8';
                ctx.globalAlpha = 0.65;
                ctx.fillRect(x, y, sq, sq);
            } else if (isCol || isRow) {
                ctx.fillStyle = '#B4D3F2';
                ctx.globalAlpha = 0.55;
                ctx.fillRect(x, y, sq, sq);
            }
        }
    }
    ctx.restore();
}

function drawStitchedDenimStar(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);

    // 5-pointed denim star
    ctx.fillStyle = '#3B6899';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const innerA = outerA + (2 * Math.PI) / 10;
        const ox = Math.cos(outerA) * r;
        const oy = Math.sin(outerA) * r;
        const ix = Math.cos(innerA) * (r * 0.48);
        const iy = Math.sin(innerA) * (r * 0.48);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();

    // White dashed stitching
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

function drawBlueColorSystemDecoration(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    // Scalloped badge at bottom center
    const badgeW = 110;
    const badgeH = 20;
    const bx = sx + slotW / 2 - badgeW / 2;
    const by = sy + slotH + 8;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#B3D4F5';
    ctx.lineWidth = 1.2;
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.strokeRect(bx, by, badgeW, badgeH);

    ctx.font = 'italic 600 11px Georgia, serif';
    ctx.fillStyle = '#6E98C2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Blue color system', bx + badgeW / 2, by + badgeH / 2);

    // Denim stitched star at bottom right
    const starX = sx + slotW - 12;
    const starY = sy + slotH + 18;
    drawStitchedDenimStar(ctx, starX, starY, 15);

    ctx.restore();
}

function drawCupidRomanticHeader(ctx, w, headerH) {
    ctx.save();
    // Top ornamental scroll flourish
    ctx.strokeStyle = '#3E141E';
    ctx.lineWidth = 1.6;
    const cy = 24;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, cy);
    ctx.bezierCurveTo(w / 2 - 60, cy - 8, w / 2 - 30, cy + 6, w / 2, cy);
    ctx.bezierCurveTo(w / 2 + 30, cy + 6, w / 2 + 60, cy - 8, w / 2 + 120, cy);
    ctx.stroke();
    // Tiny center scroll loops
    ctx.beginPath();
    ctx.arc(w / 2 - 12, cy + 4, 3, 0, Math.PI * 2);
    ctx.arc(w / 2, cy + 5, 3.5, 0, Math.PI * 2);
    ctx.arc(w / 2 + 12, cy + 4, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Calligraphy lines
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 700 17px Georgia, cursive, serif';
    ctx.fillStyle = '#2E141B';
    ctx.fillText('To be in love', w / 2, cy + 18);
    ctx.font = 'italic 500 13px Georgia, cursive, serif';
    ctx.fillStyle = '#4A242E';
    ctx.fillText('To touch with a lover\'s hand', w / 2, cy + 34);

    ctx.restore();
}

function drawPuffyPinkHeart(ctx, cx, cy, size) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#F2BAC9';
    drawHeartPath(ctx, cx, cy - size / 2, size, size);
    ctx.fill();

    // Shading highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(cx - size * 0.2, cy - size * 0.2, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawCupidAngelSilhouette(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#3E141E';
    ctx.strokeStyle = '#3E141E';
    ctx.lineWidth = 1.4;

    // Head
    ctx.beginPath();
    ctx.arc(0, -size * 0.45, size * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.lineTo(-size * 0.12, size * 0.15);
    ctx.lineTo(size * 0.15, size * 0.12);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.beginPath();
    ctx.moveTo(-size * 0.05, -size * 0.2);
    ctx.quadraticCurveTo(-size * 0.5, -size * 0.6, -size * 0.45, -size * 0.2);
    ctx.quadraticCurveTo(-size * 0.35, -size * 0.05, -size * 0.05, -size * 0.1);
    ctx.closePath();
    ctx.fill();

    // Drawn bow
    ctx.beginPath();
    ctx.arc(size * 0.25, -size * 0.05, size * 0.35, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    // Arrow
    ctx.beginPath();
    ctx.moveTo(size * 0.05, -size * 0.05);
    ctx.lineTo(size * 0.55, -size * 0.05);
    ctx.stroke();

    ctx.restore();
}

function drawAntiqueSkeletonKey(ctx, cx, cy, len) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#3E1E25';
    ctx.fillStyle = '#3E1E25';
    ctx.lineWidth = 2.2;

    // Trefoil / heart shaped bow handle on left
    ctx.beginPath();
    ctx.arc(-len * 0.4, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-len * 0.4, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Key stem
    ctx.beginPath();
    ctx.moveTo(-len * 0.25, 0);
    ctx.lineTo(len * 0.45, 0);
    ctx.stroke();

    // Key collar
    ctx.fillRect(len * 0.2, -3.5, 3, 7);

    // Key bit teeth on right
    ctx.fillRect(len * 0.35, 0, 3.5, 8);
    ctx.fillRect(len * 0.42, 0, 3.5, 6);

    ctx.restore();
}

function drawHeartPadlock(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    // Shackle loop
    ctx.strokeStyle = '#4A202A';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -size * 0.32, size * 0.26, Math.PI, 0);
    ctx.stroke();

    // Heart body
    ctx.fillStyle = '#F4BAC7';
    ctx.strokeStyle = '#3E141E';
    ctx.lineWidth = 1.6;
    drawHeartPath(ctx, 0, -size * 0.4, size, size);
    ctx.fill();
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = '#3E141E';
    ctx.beginPath();
    ctx.arc(0, size * 0.08, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.8, size * 0.08);
    ctx.lineTo(-2.5, size * 0.24);
    ctx.lineTo(2.5, size * 0.24);
    ctx.lineTo(1.8, size * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawLoveIsBloomingFooter(ctx, w, footerCenterY) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'italic 700 42px Georgia, "Brush Script MT", cursive, serif';
    ctx.fillStyle = '#220A10';
    ctx.fillText('Love', w / 2 - 20, footerCenterY - 18);

    ctx.font = 'italic 500 16px Georgia, serif';
    ctx.fillStyle = '#3A141E';
    ctx.fillText('is', w / 2 + 42, footerCenterY - 14);

    ctx.font = 'italic 700 44px Georgia, "Brush Script MT", cursive, serif';
    ctx.fillStyle = '#220A10';
    ctx.fillText('Blooming', w / 2, footerCenterY + 22);

    ctx.restore();
}

function drawCreamLatticeGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = '#D4C4AA';
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.55;
    const spacing = 135;

    for (let x = -h; x < w + h; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
    }
    for (let x = -h; x < w + h; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPinkLoopBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const loopStep = 14;
    const loopH = 9;

    ctx.beginPath();
    ctx.moveTo(sx, sy);

    // Top edge: moving from left to right (sx -> sx + slotW)
    for (let x = sx; x < sx + slotW; x += loopStep) {
        const seg = Math.min(loopStep, sx + slotW - x);
        ctx.bezierCurveTo(x + seg * 0.2, sy - loopH * 1.2, x + seg * 0.9, sy - loopH * 1.2, x + seg * 0.6, sy);
        ctx.bezierCurveTo(x + seg * 0.4, sy + loopH * 0.4, x + seg * 0.8, sy + loopH * 0.2, x + seg, sy);
    }

    // Right edge: moving top to bottom (sy -> sy + slotH)
    for (let y = sy; y < sy + slotH; y += loopStep) {
        const seg = Math.min(loopStep, sy + slotH - y);
        const rx = sx + slotW;
        ctx.bezierCurveTo(rx + loopH * 1.2, y + seg * 0.2, rx + loopH * 1.2, y + seg * 0.9, rx, y + seg * 0.6);
        ctx.bezierCurveTo(rx - loopH * 0.4, y + seg * 0.4, rx - loopH * 0.2, y + seg * 0.8, rx, y + seg);
    }

    // Bottom edge: moving right to left (sx + slotW -> sx)
    for (let x = sx + slotW; x > sx; x -= loopStep) {
        const seg = Math.min(loopStep, x - sx);
        const by = sy + slotH;
        ctx.bezierCurveTo(x - seg * 0.2, by + loopH * 1.2, x - seg * 0.9, by + loopH * 1.2, x - seg * 0.6, by);
        ctx.bezierCurveTo(x - seg * 0.4, by - loopH * 0.4, x - seg * 0.8, by - loopH * 0.2, x - seg, by);
    }

    // Left edge: moving bottom to top (sy + slotH -> sy)
    for (let y = sy + slotH; y > sy; y -= loopStep) {
        const seg = Math.min(loopStep, y - sy);
        ctx.bezierCurveTo(sx - loopH * 1.2, y - seg * 0.2, sx - loopH * 1.2, y - seg * 0.9, sx, y - seg * 0.6);
        ctx.bezierCurveTo(sx + loopH * 0.4, y - seg * 0.4, sx + loopH * 0.2, y - seg * 0.8, sx, y - seg);
    }

    ctx.stroke();
    ctx.restore();
}

function drawPinkWavyBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#F06595';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const wave = 14;
    const amp = 4.5;

    ctx.beginPath();
    ctx.moveTo(sx, sy);

    // Top edge
    for (let x = sx; x < sx + slotW; x += wave) {
        const seg = Math.min(wave, sx + slotW - x);
        ctx.quadraticCurveTo(x + seg * 0.25, sy - amp, x + seg * 0.5, sy);
        ctx.quadraticCurveTo(x + seg * 0.75, sy + amp, x + seg, sy);
    }

    // Right edge
    for (let y = sy; y < sy + slotH; y += wave) {
        const seg = Math.min(wave, sy + slotH - y);
        const rx = sx + slotW;
        ctx.quadraticCurveTo(rx + amp, y + seg * 0.25, rx, y + seg * 0.5);
        ctx.quadraticCurveTo(rx - amp, y + seg * 0.75, rx, y + seg);
    }

    // Bottom edge
    for (let x = sx + slotW; x > sx; x -= wave) {
        const seg = Math.min(wave, x - sx);
        const by = sy + slotH;
        ctx.quadraticCurveTo(x - seg * 0.25, by + amp, x - seg * 0.5, by);
        ctx.quadraticCurveTo(x - seg * 0.75, by - amp, x - seg, by);
    }

    // Left edge
    for (let y = sy + slotH; y > sy; y -= wave) {
        const seg = Math.min(wave, y - sy);
        ctx.quadraticCurveTo(sx - amp, y - seg * 0.25, sx, y - seg * 0.5);
        ctx.quadraticCurveTo(sx + amp, y - seg * 0.75, sx, y - seg);
    }

    ctx.stroke();
    ctx.restore();
}

function drawPinkPencilBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    // Primary hand-drawn rectangle with crossed corners
    const overshoot = 8;
    ctx.beginPath();
    // Top line
    ctx.moveTo(sx - overshoot, sy);
    ctx.lineTo(sx + slotW + overshoot, sy);
    // Right line
    ctx.moveTo(sx + slotW, sy - overshoot);
    ctx.lineTo(sx + slotW, sy + slotH + overshoot);
    // Bottom line
    ctx.moveTo(sx + slotW + overshoot, sy + slotH);
    ctx.lineTo(sx - overshoot, sy + slotH);
    // Left line
    ctx.moveTo(sx, sy + slotH + overshoot);
    ctx.lineTo(sx, sy - overshoot);
    ctx.stroke();

    // Secondary subtle parallel sketchy stroke
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(sx - 2, sy - 2, slotW + 4, slotH + 4);

    ctx.restore();
}

function drawPinkCloudPillBorder(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const r = 26;
    const wave = 18;
    const amp = 3.5;

    ctx.beginPath();
    // Start at top-left after rounded corner
    ctx.moveTo(sx + r, sy);

    // Top edge with subtle bubbly cloud waves
    for (let x = sx + r; x < sx + slotW - r; x += wave) {
        const seg = Math.min(wave, sx + slotW - r - x);
        ctx.quadraticCurveTo(x + seg * 0.5, sy - amp, x + seg, sy);
    }

    // Top-right rounded bubbly corner
    ctx.arcTo(sx + slotW + amp, sy, sx + slotW + amp, sy + r, r);

    // Right edge
    for (let y = sy + r; y < sy + slotH - r; y += wave) {
        const seg = Math.min(wave, sy + slotH - r - y);
        const rx = sx + slotW;
        ctx.quadraticCurveTo(rx + amp, y + seg * 0.5, rx, y + seg);
    }

    // Bottom-right rounded corner
    ctx.arcTo(sx + slotW, sy + slotH + amp, sx + slotW - r, sy + slotH + amp, r);

    // Bottom edge
    for (let x = sx + slotW - r; x > sx + r; x -= wave) {
        const seg = Math.min(wave, x - (sx + r));
        const by = sy + slotH;
        ctx.quadraticCurveTo(x - seg * 0.5, by + amp, x - seg, by);
    }

    // Bottom-left rounded corner
    ctx.arcTo(sx - amp, sy + slotH, sx - amp, sy + slotH - r, r);

    // Left edge
    for (let y = sy + slotH - r; y > sy + r; y -= wave) {
        const seg = Math.min(wave, y - (sy + r));
        ctx.quadraticCurveTo(sx - amp, y - seg * 0.5, sx, y - seg);
    }

    // Top-left rounded corner
    ctx.arcTo(sx, sy - amp, sx + r, sy - amp, r);

    ctx.stroke();
    ctx.restore();
}

function drawLilyPolkaBackground(ctx, w, h) {
    ctx.save();
    // Crisp black polka dots
    ctx.fillStyle = '#181818';
    const dotR = 3.2;
    const step = 26;
    for (let y = 14; y < h; y += step) {
        for (let x = 14; x < w; x += step) {
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Top-left blooming Stargazer lily flowers
    drawStargazerLily(ctx, 36, 40, 68, -0.2);
    drawStargazerLily(ctx, 24, 105, 52, 0.35);

    // Bottom-right blooming lily petals
    drawStargazerLily(ctx, w - 24, h - 34, 82, -0.4);

    ctx.restore();
}

function drawStargazerLily(ctx, cx, cy, size, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle || 0);

    // Green leaves behind petals
    ctx.fillStyle = '#4D7C0F';
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 1.2;
    [-0.8, -0.4, 0.4, 0.8].forEach((la) => {
        ctx.save();
        ctx.rotate(la);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.25, size * 0.6, 0, size * 1.1);
        ctx.quadraticCurveTo(-size * 0.25, size * 0.6, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });

    // 6 Stargazer lily petals
    const petalAngles = [0, 1.05, 2.09, 3.14, 4.19, 5.24];
    petalAngles.forEach((pa, idx) => {
        ctx.save();
        ctx.rotate(pa);

        // Petal base (pale pink to white gradient)
        ctx.fillStyle = idx % 2 === 0 ? '#FCE7F3' : '#FDF2F8';
        ctx.strokeStyle = '#DB2777';
        ctx.lineWidth = 1.4;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.35, size * 0.45, 0, size);
        ctx.quadraticCurveTo(-size * 0.35, size * 0.45, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crimson magenta center streak along midrib
        ctx.strokeStyle = '#BE185D';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.15);
        ctx.lineTo(0, size * 0.7);
        ctx.stroke();

        // Dark speckles / freckles
        ctx.fillStyle = '#831843';
        [-size * 0.1, size * 0.1].forEach((dx) => {
            ctx.beginPath();
            ctx.arc(dx, size * 0.35, 1.4, 0, Math.PI * 2);
            ctx.arc(dx * 0.7, size * 0.5, 1.4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    });

    // Pale green center throat
    ctx.fillStyle = '#BBF7D0';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // White stamens with brown anthers
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.fillStyle = '#78350F';
    for (let i = 0; i < 5; i++) {
        const sa = (i * Math.PI * 2) / 5;
        const sx = Math.cos(sa) * (size * 0.36);
        const sy = Math.sin(sa) * (size * 0.36);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }

    ctx.restore();
}

function drawDustyRosePictureFrame(ctx, sx, sy, slotW, slotH) {
    ctx.save();
    // Frame molding
    ctx.strokeStyle = '#C492A0';
    ctx.lineWidth = 4.5;
    ctx.strokeRect(sx - 3, sy - 3, slotW + 6, slotH + 6);

    // Inner bevel highlight
    ctx.strokeStyle = '#F2DFE5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy, slotW, slotH);

    ctx.restore();
}

/**
 * Hit-tests whether a normalized coordinate (nx, ny in 0..1) on the strip canvas hits a sticker
 */
export function findStickerIndexAtPoint(stickers, nx, ny, canvasWidth, canvasHeight) {
    if (!Array.isArray(stickers)) {
        return -1;
    }
    const px = nx * canvasWidth;
    const py = ny * canvasHeight;

    for (let i = stickers.length - 1; i >= 0; i--) {
        const st = stickers[i];
        const sx = st.x * canvasWidth;
        const sy = st.y * canvasHeight;
        const radius = 34 * (st.scale || 1);
        const dist = Math.hypot(px - sx, py - sy);
        if (dist <= radius) {
            return i;
        }
    }
    return -1;
}

