import fs from 'fs/promises';
import { marked } from 'marked';
import matter from 'gray-matter';

export const extractTextFromText = async (filePath) => {
  return await fs.readFile(filePath, 'utf-8');
};

export const extractTextFromMarkdown = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf-8');
  const { content } = matter(raw);
  return marked.parse(content);
};
