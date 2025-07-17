export function buildQnAPrompt(data) {
  const text = data.content
    .map(block => block.text)
    .join('\n');

  return `Based on the content below, generate 5 detailed technical questions and answers:\n\n${text}`;
}
