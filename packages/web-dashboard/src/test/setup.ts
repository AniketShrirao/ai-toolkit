import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebSocket for tests
global.WebSocket = class MockWebSocket {
  constructor(url: string) {
    // Mock implementation
  }
  
  close() {}
  send() {}
  
  // Mock event handlers
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;
} as any;