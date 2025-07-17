import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function extractPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return {
    type: 'pdf',
    content: data.text
  };
}
