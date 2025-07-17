import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { extractPDF } from './packages/extractor/pdf.js';
import { extractMarkdown } from './packages/extractor/markdown.js';
import { extractOCR } from './packages/extractor/ocr.js';
import { normalizeData } from './packages/formatter/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'data/input');
const outputDir = path.join(__dirname, 'data/output');
const cachePath = path.join(__dirname, '.cache.json');

// Utility to get formatted timestamp
const getFormattedTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 15);
};

// Load cache if exists
async function loadCache() {
  try {
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save cache back to file
async function saveCache(cache) {
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

// Delete cache
async function clearCache() {
  try {
    await fs.unlink(cachePath);
    console.log('🗑️  Cache cleared because output folder did not exist.');
  } catch {
    // Ignore if cache file doesn't exist
  }
}

// Create a hash from file contents
async function getFileHash(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Compare JSON deeply
function isSameJson(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Main runner
async function convert() {
  const cliArg = process.argv[2];
  const files = cliArg ? [cliArg] : await fs.readdir(inputDir);

  // Check and clear cache if outputDir doesn't exist
  let outputExists = false;
  try {
    await fs.access(outputDir);
    outputExists = true;
  } catch {
    await clearCache();
  }

  const cache = await loadCache();
  let somethingWritten = false;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(inputDir, file);
    const fileStat = await fs.stat(filePath);
    const lastModified = fileStat.mtimeMs;
    const hash = await getFileHash(filePath);

    const cacheKey = `${file}`;
    if (
      cache[cacheKey] &&
      cache[cacheKey].hash === hash &&
      cache[cacheKey].lastModified === lastModified
    ) {
      console.log(`⚠️  Skipped (unchanged): ${file}`);
      continue;
    }

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
      } else if (ext === '.txt') {
        const text = await fs.readFile(filePath, 'utf8');
        extractedData = { type: 'text', content: text };
        sourceType = 'text';
      } else {
        console.log(`⛔ Unsupported file type: ${file}`);
        continue;
      }

      const normalized = normalizeData(extractedData, file);
      const outputFileNameBase = `${sourceType}_${path.parse(file).name}`;
      const timestamp = getFormattedTimestamp();
      const outputFileName = `${timestamp}_${outputFileNameBase}.json`;
      const outputPath = path.join(outputDir, outputFileName);

      const existingFile = outputExists
        ? (await fs.readdir(outputDir)).find(f =>
            f.endsWith(`_${outputFileNameBase}.json`)
          )
        : null;

      if (existingFile) {
        const existingPath = path.join(outputDir, existingFile);
        const existingData = JSON.parse(await fs.readFile(existingPath, 'utf8'));

        if (isSameJson(normalized, existingData)) {
          console.log(`⚠️  Skipped (same data exists): ${file}`);
          continue;
        }
      }

      // Create outputDir only when we're about to write something
      if (!outputExists) {
        await fs.mkdir(outputDir, { recursive: true });
        outputExists = true;
      }

      await fs.writeFile(outputPath, JSON.stringify(normalized, null, 2), 'utf8');
      console.log(`✅ Written: ${outputPath}`);

      cache[cacheKey] = {
        hash,
        lastModified,
        outputFile: outputFileName
      };

      somethingWritten = true;
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err);
    }
  }

  if (somethingWritten) {
    await saveCache(cache);
  }
}

convert();
