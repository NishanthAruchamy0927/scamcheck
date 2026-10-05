import fs from 'fs';
import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

/**
 * Pure-JavaScript QR decoder (jsQR + pngjs/jpeg-js, no native dependencies).
 * Decodes UPI / URL / text QR codes from uploaded PNG and JPEG screenshots.
 */
export interface QRExtractionResult {
  payload: string;
  confidence: number | null;
  metadata: {
    sourceType: string;
    decoder: string;
    environment: string;
  };
}

// Guards against decompression bombs: a tiny file can declare a huge canvas
const MAX_PIXELS = 40_000_000;
const MAX_JPEG_MEMORY_MB = 512;

interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function decodeImage(buffer: Buffer): RgbaImage | null {
  const isPng = buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (isPng) {
    // IHDR width/height live at bytes 16-23; check before inflating the pixel data
    if (buffer.length < 24 || buffer.readUInt32BE(16) * buffer.readUInt32BE(20) > MAX_PIXELS) return null;
    const png = PNG.sync.read(buffer);
    return { data: new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length), width: png.width, height: png.height };
  }
  if (isJpeg) {
    const img = jpeg.decode(buffer, {
      useTArray: true,
      formatAsRGBA: true,
      maxResolutionInMP: MAX_PIXELS / 1_000_000,
      maxMemoryUsageInMB: MAX_JPEG_MEMORY_MB
    });
    return { data: new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.length), width: img.width, height: img.height };
  }
  return null;
}

/** Box-downscales by an integer factor; large phone photos decode faster and often more reliably. */
function downscale(img: RgbaImage, factor: number): RgbaImage {
  const width = Math.floor(img.width / factor);
  const height = Math.floor(img.height / factor);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = ((y * factor) * img.width + x * factor) * 4;
      const dst = (y * width + x) * 4;
      out[dst] = img.data[src];
      out[dst + 1] = img.data[src + 1];
      out[dst + 2] = img.data[src + 2];
      out[dst + 3] = 255;
    }
  }
  return { data: out, width, height };
}

function mockDecode(imagePath: string): QRExtractionResult | null {
  const mock = (payload: string): QRExtractionResult => ({
    payload,
    confidence: null,
    metadata: { sourceType: 'SYNTHETIC_TEST_ONLY', decoder: 'MOCK', environment: 'TEST/DEVELOPMENT' }
  });
  if (imagePath.includes('fake_internship') || imagePath.includes('scam_qr') || imagePath.includes('test_upi_qr')) {
    return mock('upi://pay?pa=testmerchant@example&pn=Test%20Merchant&am=499&cu=INR');
  }
  if (imagePath.includes('test_url_qr')) return mock('https://example.test/payment');
  if (imagePath.includes('test_text_qr')) return mock('SCAMCHECK TEST QR');
  return null;
}

export async function decodeQrFromImage(imagePath: string): Promise<QRExtractionResult | null> {
  // Test-only synthetic payloads; never enable in production
  if (process.env.ENABLE_MOCK_QR_DECODER === 'true') {
    return mockDecode(imagePath);
  }

  try {
    const buffer = await fs.promises.readFile(imagePath);
    const image = decodeImage(buffer);
    if (!image) return null;

    const attempts: RgbaImage[] = [image];
    if (image.width * image.height > 4_000_000) attempts.push(downscale(image, 2));

    for (const attempt of attempts) {
      const result = jsQR(attempt.data, attempt.width, attempt.height, { inversionAttempts: 'attemptBoth' });
      if (result && result.data) {
        return {
          payload: result.data.slice(0, 4096),
          // QR payloads are Reed-Solomon error-corrected: a successful decode is exact
          confidence: 1,
          metadata: { sourceType: 'IMAGE', decoder: 'jsQR', environment: 'PRODUCTION' }
        };
      }
    }
    return null;
  } catch (err) {
    // Unreadable or hostile image: QR extraction is best-effort and must never fail the investigation
    console.error('QR decode failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
