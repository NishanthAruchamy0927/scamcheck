import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseDocumentFile(
  filePath: string,
  mimetype: string,
  originalName: string
): Promise<string> {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';

  try {
    if (mimetype === 'application/pdf' || extension === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text || '';

      if (text.trim().length === 0) {
        throw new Error('PDF contains no selectable text (scanned image or empty document).');
      }

      return text.trim();
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      const text = result.value || '';

      if (text.trim().length === 0) {
        throw new Error('DOCX document contains no readable text.');
      }

      return text.trim();
    }

    // Plain text / Markdown / CSV / JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.trim().length === 0) {
      throw new Error('Document file is empty.');
    }

    return content.trim();
  } catch (err: any) {
    console.error('Document parsing error:', err);
    throw new Error(err.message || 'Unable to extract readable content from this document.');
  }
}
