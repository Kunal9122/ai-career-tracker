const fs = require('fs');
const pdfParse = require('pdf-parse');
const ApiError = require('../utils/ApiError');

/**
 * Extracts raw text from a PDF file on disk.
 * Throws a clear ApiError if the PDF is unreadable/corrupt/empty so the
 * caller can surface a useful message without leaving the DB in a bad state.
 */
async function extractTextFromPdf(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    const text = (result.text || '').trim();
    if (!text) {
      throw new ApiError(422, 'Could not extract any text from this PDF. It may be a scanned image without a text layer.');
    }
    return text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(422, 'Failed to read PDF file. Please upload a valid, unencrypted PDF.');
  }
}

module.exports = { extractTextFromPdf };
