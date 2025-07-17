import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import { extractTextFromPDF } from './packages/extractor/pdf.js';
import { extractTextFromText, extractTextFromMarkdown } from './extractor/data.js';
import { extractTextFromImage } from './extractor/ocr.js';
import { normalizeToJSON } from './formatter/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convertFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let rawText = '';
  let type = '';

  if (ext === '.pdf') {
    rawText = await extractTextFromPDF(filePath);
    type = 'pdf';
  } else if (ext === '.txt') {
    rawText = await extractTextFromText(filePath);
    type = 'text';
  } else if (ext === '.md') {
    rawText = await extractTextFromMarkdown(filePath);
    type = 'markdown';
  } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    rawText = await extractTextFromImage(filePath);
    type = 'image';
  } else {
    throw new Error(`❌ Unsupported file format: ${ext}`);
  }

  const jsonData = normalizeToJSON(rawText, type);
  const outputPath = `${filePath}.ai.json`;
  await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ ${type.toUpperCase()} converted → JSON saved to: ${outputPath}`);
};

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('❌ Provide a file path.\n👉 Usage: node convert.mjs sample.pdf');
  process.exit(1);
}

convertFile(fileArg).catch((err) => {
  console.error('💥 Failed:', err.message);
});
