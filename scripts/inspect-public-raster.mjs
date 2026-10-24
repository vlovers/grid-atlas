import { inspectImageBytes } from './inspect-media-original.mjs';

const MAX_PIXELS = 80_000_000;

function checkedDimensions(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width * height > MAX_PIXELS) {
    throw Error('Published raster has invalid dimensions or exceeds pixel limit');
  }
  return { width, height };
}

/**
 * Bounded structural WebP inspection, not a full decoder or malware scanner.
 * Reject animation, truncated RIFF chunks and inconsistent canvas/frame dimensions.
 */
export function inspectWebpBytes(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 26 ||
      bytes.toString('ascii', 0, 4) !== 'RIFF' ||
      bytes.toString('ascii', 8, 12) !== 'WEBP' ||
      bytes.readUInt32LE(4) + 8 !== bytes.length) {
    throw Error('Invalid WebP RIFF container');
  }
  let position = 12;
  let canvas = null;
  let frame = null;
  let hasExtendedHeader = false;
  while (position < bytes.length) {
    if (position + 8 > bytes.length) throw Error('Truncated WebP chunk header');
    const type = bytes.toString('ascii', position, position + 4);
    const length = bytes.readUInt32LE(position + 4);
    const dataStart = position + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length || dataEnd + (length % 2) > bytes.length) {
      throw Error('Truncated WebP chunk');
    }
    if (!['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ICCP', 'EXIF', 'XMP '].includes(type)) {
      throw Error('Unsupported WebP chunk (including animation)');
    }
    if (type === 'VP8X') {
      if (hasExtendedHeader || frame || canvas || position !== 12 || length !== 10) {
        throw Error('Invalid WebP extended header');
      }
      hasExtendedHeader = true;
      if (bytes[dataStart] & 0x02) throw Error('Animated WebP is not allowed in publication');
      const width = 1 + bytes.readUIntLE(dataStart + 4, 3);
      const height = 1 + bytes.readUIntLE(dataStart + 7, 3);
      canvas = checkedDimensions(width, height);
    }
    if (type === 'VP8 ' || type === 'VP8L') {
      if (frame) throw Error('Multiple WebP image frames are not allowed');
      let width;
      let height;
      if (type === 'VP8 ') {
        if (length < 10 || (bytes[dataStart] & 1) !== 0 ||
            bytes[dataStart + 3] !== 0x9d || bytes[dataStart + 4] !== 0x01 ||
            bytes[dataStart + 5] !== 0x2a) throw Error('Invalid WebP VP8 keyframe');
        width = bytes.readUInt16LE(dataStart + 6) & 0x3fff;
        height = bytes.readUInt16LE(dataStart + 8) & 0x3fff;
      } else {
        if (length < 5 || bytes[dataStart] !== 0x2f) throw Error('Invalid WebP VP8L frame');
        width = 1 + bytes[dataStart + 1] + ((bytes[dataStart + 2] & 0x3f) << 8);
        height = 1 + (bytes[dataStart + 2] >> 6) +
          (bytes[dataStart + 3] << 2) + ((bytes[dataStart + 4] & 0x0f) << 10);
      }
      frame = checkedDimensions(width, height);
    }
    position = dataEnd + (length % 2);
  }
  if (!frame || (canvas && (canvas.width !== frame.width || canvas.height !== frame.height))) {
    throw Error('WebP frame missing or inconsistent with canvas dimensions');
  }
  return { mime: 'image/webp', ...frame };
}

/** Check the actual published bytes, not merely the MIME magic prefix. */
export function inspectPublishedRaster(bytes, expected) {
  const result = expected.mime === 'image/webp'
    ? inspectWebpBytes(bytes)
    : inspectImageBytes(bytes);
  if (result.mime !== expected.mime) throw Error('Published image bytes do not match declared image MIME');
  if (result.width !== expected.width || result.height !== expected.height) {
    throw Error('Published image dimensions do not match reviewed metadata');
  }
  return result;
}
