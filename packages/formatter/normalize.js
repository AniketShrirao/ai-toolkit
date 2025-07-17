export const normalizeToJSON = (text, sourceType) => {
  const paragraphs = text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    meta: {
      source_type: sourceType,
      created_at: new Date().toISOString(),
    },
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      text: p,
    })),
  };
};
