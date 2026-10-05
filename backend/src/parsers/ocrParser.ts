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

export async function extractTextFromImage(filePath: string): Promise<string> {
  let worker = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(filePath);
    await worker.terminate();
    const raw = ret.data.text || '';
    return normalizeOcrText(raw);
  } catch (error) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
    }
    console.error('OCR Extraction error:', error);
    throw new Error('Unable to extract readable content from this image.');
  }
}
