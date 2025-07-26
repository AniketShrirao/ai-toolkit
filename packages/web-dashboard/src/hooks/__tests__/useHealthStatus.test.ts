import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHealthStatus } from '../useHealthStatus';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockHealthStatus = {
  status: 'healthy' as const,
  timestamp: '2024-01-01T00:00:00.000Z',
  environment: 'test',
  uptime: 3600,
  version: '1.0.0',
  components: {
    ollama: {
      status: 'healthy' as const,
      connected: true,
      availableModels: ['llama2:7b', 'codellama:7b'],
      loadedModel: 'llama2:7b',
      responseTime: 100,
    },
    database: {
      status: 'healthy' as const,
      connected: true,
      path: './test.db',
      exists: true,
      size: 1024,
    },
    redis: {
      status: 'healthy' as const,
      connected: true,
      host: 'localhost',
      port: 6379,
      responseTime: 50,
    },
    storage: {
      status: 'healthy' as const,
      paths: {
        input: { exists: true, writable: true, path: './input' },
        output: { exists: true, writable: true, path: './output' },
        temp: { exists: true, writable: true, path: './temp' },
      },
    },
    system: {
      status: 'healthy' as const,
      memory: {
        total: 8589934592,
        free: 4294967296,
        used: 4294967296,
        percentage: 50,
      },
      cpu: {
        usage: 25,
        loadAverage: [1.0, 1.5, 2.0],
      },
      platform: 'linux',
      nodeVersion: 'v18.0.0',
    },
  },
  diagnostics: [
    {
      category: 'environment' as const,
      level: 'info' as const,
      message: 'Running in test mode',
      suggestion: 'Use production mode for deployment',
    },
  ],
};

describe('useHealthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch health status on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    });

    const { result } = renderHook(() => useHealthStatus(1000));

    expect(result.current.loading).toBe(true);
    expect(result.current.healthStatus).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.healthStatus).toEqual(mockHealthStatus);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
    expect(mockFetch).toHaveBeenCalledWith('/api/health');
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useHealthStatus(1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.healthStatus).toBe(null);
    expect(result.current.error).toBe('Network error');
    expect(result.current.lastUpdated).toBe(null);
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    const { result } = renderHook(() => useHealthStatus(1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.healthStatus).toBe(null);
    expect(result.current.error).toBe('Health check failed: 503 Service Unavailable');
  });

  it('should refresh health status at specified interval', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    });

    renderHook(() => useHealthStatus(1000));

    // Initial call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Advance timer by another second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should allow manual refresh', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    });

    const { result } = renderHook(() => useHealthStatus(10000));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Manual refresh
    result.current.refresh();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should cleanup interval on unmount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    });

    const { unmount } = renderHook(() => useHealthStatus(1000));

    // Initial call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    unmount();

    // Advance timer - should not trigger additional calls
    vi.advanceTimersByTime(2000);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should update lastUpdated timestamp on successful fetch', async () => {
    const fixedDate = new Date('2024-01-01T12:00:00.000Z');
    vi.setSystemTime(fixedDate);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    });

    const { result } = renderHook(() => useHealthStatus(1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lastUpdated).toEqual(fixedDate);
  });

  it('should not update lastUpdated on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useHealthStatus(1000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lastUpdated).toBe(null);
  });
});