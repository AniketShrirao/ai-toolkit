import { useState, useEffect, useCallback } from 'react';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  uptime: number;
  version: string;
  components: {
    ollama: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      connected: boolean;
      availableModels: string[];
      loadedModel?: string;
      responseTime: number;
      error?: string;
    };
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      connected: boolean;
      path: string;
      exists: boolean;
      size?: number;
      error?: string;
    };
    redis: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      connected: boolean;
      host: string;
      port: number;
      responseTime: number;
      error?: string;
    };
    storage: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      paths: {
        input: { exists: boolean; writable: boolean; path: string };
        output: { exists: boolean; writable: boolean; path: string };
        temp: { exists: boolean; writable: boolean; path: string };
      };
      error?: string;
    };
    system: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      memory: {
        total: number;
        free: number;
        used: number;
        percentage: number;
      };
      cpu: {
        usage: number;
        loadAverage: number[];
      };
      platform: string;
      nodeVersion: string;
      error?: string;
    };
  };
  diagnostics: Array<{
    category: 'configuration' | 'connectivity' | 'performance' | 'security' | 'environment';
    level: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
  }>;
}

export const useHealthStatus = (refreshInterval: number = 30000) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/health');
      if (!response.ok && response.status !== 503) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setHealthStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch health status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchHealthStatus();
  }, [fetchHealthStatus]);

  useEffect(() => {
    // Initial fetch
    fetchHealthStatus();

    // Set up interval for periodic updates
    const interval = setInterval(fetchHealthStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchHealthStatus, refreshInterval]);

  return {
    healthStatus,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

export default useHealthStatus;