import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowConfiguration } from '../WorkflowConfiguration';
import { SettingsProvider } from '@hooks/useSettings';
import { UIWorkflowDefinition as WorkflowDefinition } from '@ai-toolkit/shared';
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

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  );
};

describe('WorkflowConfiguration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockConfirm.mockReturnValue(true);
  });

  it('should render workflow management interface', async () => {
    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('Workflow Management')).toBeInTheDocument();
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });
  });

  it('should show empty state when no workflows exist', async () => {
    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('No workflows configured. Create your first workflow to get started.')).toBeInTheDocument();
    });
  });

  it('should show create workflow form when create button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Workflow');
      expect(createButton).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Workflow name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Workflow description')).toBeInTheDocument();
    });
  });

  it('should create a new workflow', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    // Open create form
    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Workflow name')).toBeInTheDocument();
    });

    // Fill in workflow details
    await user.type(screen.getByPlaceholderText('Workflow name'), 'Test Workflow');
    await user.type(screen.getByPlaceholderText('Workflow description'), 'Test Description');

    // Create the workflow (click the one in the form, not the header)
    const createButtons = screen.getAllByRole('button', { name: 'Create Workflow' });
    await user.click(createButtons[1]); // Second button is in the form

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-toolkit-workflows',
        expect.stringContaining('Test Workflow')
      );
    });
  });

  it('should add and remove workflow steps', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    // Open create form
    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Add Step')).toBeInTheDocument();
    });

    // Add a step
    await user.click(screen.getByText('Add Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Step name')).toBeInTheDocument();
    });

    // Remove the step
    await user.click(screen.getByText('Remove'));

    await waitFor(() => {
      expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
    });
  });

  it('should display existing workflows', async () => {
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'Existing Workflow',
      description: 'An existing workflow',
      trigger: { type: 'manual', config: {} },
      steps: [
        {
          id: 'step1',
          name: 'Analysis Step',
          type: 'document-analysis',
          config: {},
          order: 0,
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('Existing Workflow')).toBeInTheDocument();
      expect(screen.getByText('An existing workflow')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument();
    });
  });

  it('should toggle workflow enabled state', async () => {
    const user = userEvent.setup();
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'Toggle Test',
      description: 'Test workflow',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('Disable')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Disable'));

    await waitFor(() => {
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('Enable')).toBeInTheDocument();
    });
  });

  it('should delete workflow with confirmation', async () => {
    const user = userEvent.setup();
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'To Delete',
      description: 'Will be deleted',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this workflow?');

    await waitFor(() => {
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });

  it('should not delete workflow if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'To Keep',
      description: 'Will be kept',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('To Keep')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(screen.getByText('To Keep')).toBeInTheDocument();
  });

  it('should display workflow steps as badges', async () => {
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'Multi-step Workflow',
      description: 'Has multiple steps',
      trigger: { type: 'manual', config: {} },
      steps: [
        {
          id: 'step1',
          name: 'Analysis',
          type: 'document-analysis',
          config: {},
          order: 0,
        },
        {
          id: 'step2',
          name: 'Estimation',
          type: 'estimation',
          config: {},
          order: 1,
        }
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    renderWithProvider(<WorkflowConfiguration />);

    await waitFor(() => {
      expect(screen.getByText('1. Document Analysis')).toBeInTheDocument();
      expect(screen.getByText('2. Project Estimation')).toBeInTheDocument();
    });
  });

  it('should handle different trigger types', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    // Open create form
    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      const triggerSelect = screen.getByRole('combobox');
      expect(triggerSelect).toBeInTheDocument();
    });

    const triggerSelect = screen.getByRole('combobox');
    await user.selectOptions(triggerSelect, 'folder-watch');

    expect(triggerSelect).toHaveValue('folder-watch');
  });

  it('should handle different step types', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    // Open create form and add step
    await user.click(screen.getByText('Create Workflow'));
    await user.click(screen.getByText('Add Step'));

    await waitFor(() => {
      const stepTypeSelects = screen.getAllByRole('combobox');
      expect(stepTypeSelects.length).toBeGreaterThan(1); // Should have trigger select and step type select
    });

    const stepTypeSelects = screen.getAllByRole('combobox');
    const stepTypeSelect = stepTypeSelects[1]; // Second select should be the step type
    await user.selectOptions(stepTypeSelect, 'estimation');

    expect(stepTypeSelect).toHaveValue('estimation');
  });

  it('should cancel workflow creation', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    // Open create form
    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
    });

    // Cancel creation
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Create New Workflow')).not.toBeInTheDocument();
    });
  });

  it('should disable create button when form is open', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkflowConfiguration />);

    const createButton = screen.getByRole('button', { name: 'Create Workflow' });
    expect(createButton).not.toBeDisabled();

    await user.click(createButton);

    await waitFor(() => {
      expect(createButton).toBeDisabled();
    });
  });
});