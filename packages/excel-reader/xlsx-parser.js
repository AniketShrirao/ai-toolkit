import * as xlsx from 'xlsx';
import fs from 'fs';

export function extractXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const result = {};

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  });

  return {
    type: 'excel',
    content: result
  };
}
