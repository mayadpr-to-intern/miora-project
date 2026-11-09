/**
 * Pure JavaScript Client-Side ZIP Archive Generator (PKZIP 2.0 Store Method + CRC32)
 * Bundles multiple dataURLs / Uint8Arrays into a genuine downloadable .zip Blob.
 */

const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

export function dataUrlToUint8Array(dataUrl) {
    const parts = dataUrl.split(',');
    const base64 = parts[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Creates a valid .zip Blob from an array of { name: string, data: Uint8Array }
 */
export function createZipBlob(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const data = file.data;
        const crc = crc32(data);
        const size = data.length;

        // Local File Header (30 bytes + filename)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const lv = new DataView(localHeader.buffer);
        lv.setUint32(0, 0x04034b50, true); // Local file header signature
        lv.setUint16(4, 20, true); // Version needed to extract (2.0)
        lv.setUint16(6, 0, true); // General purpose bit flag
        lv.setUint16(8, 0, true); // Compression method (0 = store)
        lv.setUint16(10, 0, true); // Last mod file time
        lv.setUint16(12, 0x5663, true); // Last mod file date
        lv.setUint32(14, crc, true); // CRC-32
        lv.setUint32(18, size, true); // Compressed size
        lv.setUint32(22, size, true); // Uncompressed size
        lv.setUint16(26, nameBytes.length, true); // File name length
        lv.setUint16(28, 0, true); // Extra field length
        localHeader.set(nameBytes, 30);

        localParts.push(localHeader, data);

        // Central Directory File Header (46 bytes + filename)
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(centralHeader.buffer);
        cv.setUint32(0, 0x02014b50, true); // Central directory signature
        cv.setUint16(4, 20, true); // Version made by
        cv.setUint16(6, 20, true); // Version needed
        cv.setUint16(8, 0, true); // Bit flag
        cv.setUint16(10, 0, true); // Compression method (0 = store)
        cv.setUint16(12, 0, true); // File time
        cv.setUint16(14, 0x5663, true); // File date
        cv.setUint32(16, crc, true); // CRC-32
        cv.setUint32(20, size, true); // Compressed size
        cv.setUint32(24, size, true); // Uncompressed size
        cv.setUint16(28, nameBytes.length, true); // File name length
        cv.setUint16(30, 0, true); // Extra field length
        cv.setUint16(32, 0, true); // File comment length
        cv.setUint16(34, 0, true); // Disk number start
        cv.setUint16(36, 0, true); // Internal file attributes
        cv.setUint32(38, 0, true); // External file attributes
        cv.setUint32(42, offset, true); // Relative offset of local header
        centralHeader.set(nameBytes, 46);

        centralParts.push(centralHeader);
        offset += localHeader.length + size;
    }

    let centralSize = 0;
    for (const part of centralParts) {
        centralSize += part.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); // EOCD signature
    ev.setUint16(4, 0, true); // Number of this disk
    ev.setUint16(6, 0, true); // Disk where central directory starts
    ev.setUint16(8, files.length, true); // Number of central directory records on this disk
    ev.setUint16(10, files.length, true); // Total number of central directory records
    ev.setUint32(12, centralSize, true); // Size of central directory
    ev.setUint32(16, offset, true); // Offset of start of central directory
    ev.setUint16(20, 0, true); // Comment length

    return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
}

export function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function triggerDataUrlDownload(dataUrl, filename) {
    const bytes = dataUrlToUint8Array(dataUrl);
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const blob = new Blob([bytes], { type: mime });
    triggerBlobDownload(blob, filename);
}

