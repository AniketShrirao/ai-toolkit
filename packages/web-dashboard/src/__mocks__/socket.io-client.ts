import { vi } from 'vitest';

export const io = vi.fn(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  close: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));