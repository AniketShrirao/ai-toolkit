import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { extractPDF } from './packages/extractor/pdf.js';
import { extractMarkdown } from './packages/extractor/markdown.js';
import { extractOCR } from './packages/extractor/ocr.js';
import { normalizeData } from './packages/formatter/normalize.js';

// Resolve __dirname in ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'data/input');
const outputDir = path.join(__dirname, 'data/output');

// Format timestamp as YYYYMMDD-HHmmss
const getFormattedTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
};

async function convert() {
  const cliArg = process.argv[2]; // e.g., node convert.js file.pdf
  const files = cliArg ? [cliArg] : await fs.readdir(inputDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(inputDir, file);
    let extractedData, sourceType;

    try {
      if (ext === '.pdf') {
        extractedData = await extractPDF(filePath);
        sourceType = 'pdf';
      } else if (ext === '.md') {
        extractedData = await extractMarkdown(filePath);
        sourceType = 'markdown';
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        extractedData = await extractOCR(filePath);
        sourceType = 'image';
      } else {
        console.log(`⛔ Unsupported file type: ${file}`);
        continue;
      }

      const normalized = normalizeData(extractedData, file);

      const timestamp = getFormattedTimestamp();
      const outputFileName = `${timestamp}_${sourceType}_${path.parse(file).name}.json`;
      const outputPath = path.join(outputDir, outputFileName);

      await fs.writeFile(outputPath, JSON.stringify(normalized, null, 2), 'utf8');
      console.log(`✅ Written: ${outputPath}`);
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err);
    }
  }
}

convert();
