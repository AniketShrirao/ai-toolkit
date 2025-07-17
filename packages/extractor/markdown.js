import fs from 'fs';

export async function extractMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    type: 'markdown',
    content
  };
}
