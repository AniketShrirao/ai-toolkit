export function buildSummaryPrompt(data) {
  const text = data.content
    .map(block => block.text)
    .join('\n');

  return `You are a helpful assistant. Summarize the following content in bullet points:\n\n${text}`;
}
