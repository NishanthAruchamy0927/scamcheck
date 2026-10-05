import path from 'path';
import { createWorker } from 'tesseract.js';

/**
 * Normalizes common OCR artifacts:
 * - Spacing in currency tokens (e.g., '₹ 2 , 999' -> '₹2,999', 'INR 2, 999' -> 'INR 2,999')
 * - Spacing in email addresses (e.g., 'hr . google @ gmail . com' -> 'hr.google@gmail.com')
 * - Spacing in URLs and phone numbers
 */
export function normalizeOcrText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize currency spacing
  text = text.replace(/(₹|Rs\.?|INR|\$|USD|EUR|€|£|GBP)\s*([\d,]+)\s*(?:,\s*([\d]+))?/gi, (m, curr, p1, p2) => {
    const num = p2 ? `${p1},${p2}` : p1;
    return `${curr}${num.replace(/\s+/g, '')}`;
  });
  text = text.replace(/([\d,]+)\s*(?:INR|USD|EUR|GBP|Rs|₹|\$)/gi, (m) => m.replace(/\s+/g, ' '));

  // 2. Normalize email addresses
  text = text.replace(/([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1@$2.$3');

  // 3. Normalize common OCR typos in keywords
  text = text.replace(/c\s*o\s*n\s*g\s*r\s*a\s*t\s*u\s*l\s*a\s*t\s*i\s*o\s*n\s*s/gi, 'Congratulations');
  text = text.replace(/i\s*n\s*t\s*e\s*r\s*n\s*s\s*h\s*i\s*p/gi, 'Internship');
  text = text.replace(/r\s*e\s*g\s*i\s*s\s*t\s*r\s*a\s*t\s*i\s*o\s*n/gi, 'Registration');

  // 4. Normalize excessive newlines and spaces
  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// Language data ships with the backend (backend/eng.traineddata); both src/parsers and
// dist/parsers sit two levels below it, so this resolves the same in dev and production.
const OCR_LANG_DIR = path.resolve(__dirname, '..', '..');
const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS) || 60_000;
const OCR_MAX_CONCURRENCY = Number(process.env.OCR_MAX_CONCURRENCY) || 2;

// Each OCR job is CPU-heavy; cap how many run at once so a burst of uploads
// queues instead of starving every other request.
let activeJobs = 0;
const waiting: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  if (activeJobs < OCR_MAX_CONCURRENCY) {
    activeJobs++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}

function releaseSlot(): void {
  const next = waiting.shift();
  if (next) next(); // hand the slot straight to the next waiting job
  else activeJobs--;
}

export async function extractTextFromImage(filePath: string): Promise<string> {
  await acquireSlot();
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let timer: NodeJS.Timeout | undefined;
  try {
    // Without an errorHandler, tesseract.js re-throws worker failures (e.g. corrupt
    // or non-image uploads) from an event listener, which crashes the whole process.
    // The failure is still delivered to us as a rejected recognize() promise.
    worker = await createWorker('eng', 1, {
      cachePath: OCR_LANG_DIR,
      errorHandler: (err: unknown) => console.error('OCR worker error:', err)
    });
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`OCR timed out after ${OCR_TIMEOUT_MS / 1000}s`)), OCR_TIMEOUT_MS);
    });
    const ret = await Promise.race([worker.recognize(filePath), timeout]);
    return normalizeOcrText(ret.data.text || '');
  } catch (error) {
    console.error('OCR Extraction error:', error);
    throw new Error('Unable to extract readable content from this image.');
  } finally {
    if (timer) clearTimeout(timer);
    if (worker) {
      // Terminating also stops a recognize() that is still running after a timeout
      await worker.terminate().catch(() => undefined);
    }
    releaseSlot();
  }
}
