import { createWorker } from 'tesseract.js';

export async function extractOCR(imagePath) {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();

  return {
    type: 'ocr',
    content: text
  };
}
