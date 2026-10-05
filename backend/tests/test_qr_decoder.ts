import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import QRCode from 'qrcode';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { decodeQrFromImage } from '../src/engine/payment/qrDecoder.js';

const UPI_PAYLOAD = 'upi://pay?pa=fees.collect@okbank&pn=Internship%20Desk&am=2999&cu=INR';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scamcheck-qr-test-'));

describe('QR decoder (real images)', () => {
  let pngPath: string;
  let jpgPath: string;
  let blankPath: string;

  before(async () => {
    delete process.env.ENABLE_MOCK_QR_DECODER;

    const pngBuffer = await QRCode.toBuffer(UPI_PAYLOAD, { type: 'png', margin: 4, scale: 6 });
    pngPath = path.join(tmpDir, 'upi.png');
    fs.writeFileSync(pngPath, pngBuffer);

    // Re-encode the same code as a JPEG, as phone screenshots often are
    const png = PNG.sync.read(pngBuffer);
    const jpg = jpeg.encode({ data: png.data, width: png.width, height: png.height }, 90);
    jpgPath = path.join(tmpDir, 'upi.jpg');
    fs.writeFileSync(jpgPath, jpg.data);

    const blank = new PNG({ width: 64, height: 64 });
    blank.data.fill(255);
    blankPath = path.join(tmpDir, 'blank.png');
    fs.writeFileSync(blankPath, PNG.sync.write(blank));
  });

  it('decodes a UPI QR code from a PNG', async () => {
    const result = await decodeQrFromImage(pngPath);
    assert.ok(result);
    assert.strictEqual(result.payload, UPI_PAYLOAD);
    assert.strictEqual(result.metadata.decoder, 'jsQR');
  });

  it('decodes the same QR code from a JPEG', async () => {
    const result = await decodeQrFromImage(jpgPath);
    assert.strictEqual(result?.payload, UPI_PAYLOAD);
  });

  it('returns null for an image without a QR code', async () => {
    assert.strictEqual(await decodeQrFromImage(blankPath), null);
  });

  it('returns null (never throws) for corrupt or missing files', async () => {
    const corrupt = path.join(tmpDir, 'corrupt.png');
    fs.writeFileSync(corrupt, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from('broken')]));
    assert.strictEqual(await decodeQrFromImage(corrupt), null);
    assert.strictEqual(await decodeQrFromImage(path.join(tmpDir, 'missing.png')), null);
  });

  it('refuses images that declare an absurd canvas size (decompression bomb)', async () => {
    const header = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
    header.writeUInt32BE(13, 8);
    header.write('IHDR', 12);
    header.writeUInt32BE(100_000, 16);
    header.writeUInt32BE(100_000, 20);
    const bomb = path.join(tmpDir, 'bomb.png');
    fs.writeFileSync(bomb, header);
    assert.strictEqual(await decodeQrFromImage(bomb), null);
  });
});
