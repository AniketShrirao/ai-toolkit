export function buildTaggingPrompt(data) {
  const text = data.content
    .map(block => block.text)
    .join('\n');

  return `Analyze the content below and return 5 to 7 relevant tags (single words or short phrases):\n\n${text}`;
}
