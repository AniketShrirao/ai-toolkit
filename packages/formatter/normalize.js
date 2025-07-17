export function normalizeData(raw, filename) {
  const lines = raw.content.split(/\r?\n/);
  const blocks = [];
  
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

  return {
    filename,
    sourceType: raw.type,
    wordCount: raw.content.split(/\s+/).length,
    content: blocks
  };
}
