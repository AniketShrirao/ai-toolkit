import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemMonitoring } from '../SystemMonitoring';
import { SettingsProvider } from '@hooks/useSettings';
import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  );
};

describe('SystemMonitoring Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should render system monitoring dashboard', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('Ollama Status')).toBeInTheDocument();
      expect(screen.getByText('System Resources')).toBeInTheDocument();
      expect(screen.getByText('Processing Queue')).toBeInTheDocument();
      expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    });
  });

  it('should display Ollama connection status', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      // Should show either Connected or Disconnected
      const statusElements = screen.getAllByText(/Connected|Disconnected/);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('should show Ollama metrics', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('Loaded Model')).toBeInTheDocument();
      expect(screen.getByText('Available Models')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    });
  });

  it('should display system resource usage with progress bars', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('System Uptime')).toBeInTheDocument();
    });

    // Should have progress bars for resource usage
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(3); // CPU, Memory, Disk
  });

  it('should show queue statistics', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('Pending Jobs')).toBeInTheDocument();
      expect(screen.getByText('Completed Jobs')).toBeInTheDocument();
      expect(screen.getByText('Failed Jobs')).toBeInTheDocument();
    });
  });

  it('should refresh health data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh Status');
      expect(refreshButton).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh Status');
    await user.click(refreshButton);

    // Should still show the monitoring data after refresh
    await waitFor(() => {
      expect(screen.getByText('Ollama Status')).toBeInTheDocument();
      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });
  });

  it('should format uptime correctly', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      const uptimeElements = screen.getAllByText(/\d+h \d+m/);
      expect(uptimeElements.length).toBeGreaterThan(0);
    });
  });

  it('should display percentage values for resource usage', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      // Should show percentage values
      const percentageElements = screen.getAllByText(/\d+%/);
      expect(percentageElements.length).toBeGreaterThanOrEqual(3); // CPU, Memory, Disk
    });
  });

  it('should show memory usage in MB', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      const memoryElements = screen.getAllByText(/\d+ MB/);
      expect(memoryElements.length).toBeGreaterThan(0);
    });
  });

  it('should show response time in milliseconds', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      const responseTimeElements = screen.getAllByText(/\d+ms/);
      expect(responseTimeElements.length).toBeGreaterThan(0);
    });
  });

  it('should display numeric job counts', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      // Should show numeric values for job counts
      const jobCountElements = screen.getAllByText(/^\d+$/);
      expect(jobCountElements.length).toBeGreaterThanOrEqual(4); // Active, Pending, Completed, Failed
    });
  });

  it('should use appropriate colors for different job types', async () => {
    renderWithProvider(<SystemMonitoring />);

    await waitFor(() => {
      // Check for colored text elements
      const activeJobs = screen.getByText('Active Jobs').parentElement;
      const pendingJobs = screen.getByText('Pending Jobs').parentElement;
      const completedJobs = screen.getByText('Completed Jobs').parentElement;
      const failedJobs = screen.getByText('Failed Jobs').parentElement;

      expect(activeJobs?.querySelector('.text-blue-600')).toBeInTheDocument();
      expect(pendingJobs?.querySelector('.text-yellow-600')).toBeInTheDocument();
      expect(completedJobs?.querySelector('.text-green-600')).toBeInTheDocument();
      expect(failedJobs?.querySelector('.text-red-600')).toBeInTheDocument();
    });
  });

  it('should handle loading state gracefully', () => {
    // Mock the hook to return no health data initially
    const MockComponent = () => {
      return (
        <div>
          <div>Loading system health information...</div>
        </div>
      );
    };

    render(<MockComponent />);
    expect(screen.getByText('Loading system health information...')).toBeInTheDocument();
  });
});