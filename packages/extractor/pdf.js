import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse'

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Please provide a PDF file path as an argument.');
  process.exit(1);
}

const fileName = path.basename(filePath);

const dataBuffer = fs.readFileSync(filePath);

pdfParse(dataBuffer).then(function (data) {
  const rawText = data.text.trim();

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const title = lines[0];
  const content = [];

  // Add title
  content.push({
    type: 'title',
    text: title
  });

  // Add paragraphs
  let paragraph = '';
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '' && paragraph) {
      content.push({
        type: 'paragraph',
        text: paragraph.trim()
      });
      paragraph = '';
    } else {
      paragraph += ' ' + lines[i];
    }
  }
  if (paragraph) {
    content.push({
      type: 'paragraph',
      text: paragraph.trim()
    });
  }

  const structured = {
    meta: {
      source: fileName,
      created_at: new Date().toISOString()
    },
    content
  };

  const outputPath = filePath.replace(/\.pdf$/, '.ai.json');
  fs.writeFileSync(outputPath, JSON.stringify(structured, null, 2), 'utf8');

  console.log('✅ Ready for AI/N8N — JSON saved at:', outputPath);
}).catch(function (err) {
  console.error('❌ Error parsing PDF:', err);
});
