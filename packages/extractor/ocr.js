import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'eng');
  return result.data.text;
};
