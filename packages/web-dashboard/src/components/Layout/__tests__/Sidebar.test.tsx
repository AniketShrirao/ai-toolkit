import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

describe('Sidebar Component', () => {
  const defaultProps = {
    activeView: 'dashboard' as const,
    onViewChange: vi.fn(),
    isOpen: false,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active view', () => {
    render(<Sidebar {...defaultProps} activeView="documents" />);
    
    const documentsButton = screen.getByRole('button', { name: /documents/i });
    expect(documentsButton).toHaveClass('active');
    
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).not.toHaveClass('active');
  });

  it('handles navigation clicks', () => {
    const onViewChange = vi.fn();
    const onClose = vi.fn();
    
    render(
      <Sidebar
        {...defaultProps}
        onViewChange={onViewChange}
        onClose={onClose}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /documents/i }));
    
    expect(onViewChange).toHaveBeenCalledWith('documents');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows overlay when open on mobile', () => {
    render(<Sidebar {...defaultProps} isOpen={true} />);
    
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');
    
    const overlay = document.querySelector('.sidebar-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('handles overlay click to close', () => {
    const onClose = vi.fn();
    
    render(<Sidebar {...defaultProps} isOpen={true} onClose={onClose} />);
    
    const overlay = document.querySelector('.sidebar-overlay');
    fireEvent.click(overlay!);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with correct icons', () => {
    render(<Sidebar {...defaultProps} />);
    
    // Check that icons are present (emojis in this case)
    expect(screen.getByText('📊')).toBeInTheDocument(); // Dashboard
    expect(screen.getByText('📄')).toBeInTheDocument(); // Documents
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings
  });
});