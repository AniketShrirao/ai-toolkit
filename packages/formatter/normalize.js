export function normalizeData(raw, filename) {
  const blocks = [];

  if (raw.type === 'excel') {
    for (const [sheetName, rows] of Object.entries(raw.content)) {
      blocks.push({ type: 'title', text: `Sheet: ${sheetName}` });

      rows.forEach((row, idx) => {
        blocks.push({
          type: 'tableRow',
          index: idx,
          text: JSON.stringify(row)
        });
      });
    }
  } else {
    const lines = raw.content.split(/\r?\n/);

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('# ')) {
        blocks.push({ type: 'title', text: line.replace(/^# /, '') });
      } else if (line.startsWith('## ')) {
        blocks.push({ type: 'heading', level: 2, text: line.replace(/^## /, '') });
      } else if (line.startsWith('### ')) {
        blocks.push({ type: 'heading', level: 3, text: line.replace(/^### /, '') });
      } else if (line.startsWith('* ')) {
        blocks.push({ type: 'bullet', text: line.replace(/^\* /, '') });
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }
    }
  }

  return {
    filename,
    sourceType: raw.type,
    wordCount: typeof raw.content === 'string' ? raw.content.split(/\s+/).length : 0,
    content: blocks
  };
}
