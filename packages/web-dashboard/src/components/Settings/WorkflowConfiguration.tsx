import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { Badge } from '@components/UI/Badge';
import { useSettings } from '@hooks/useSettings';
import { UIWorkflowDefinition as WorkflowDefinition, UIWorkflowStep as WorkflowStep } from '@ai-toolkit/shared';

export const WorkflowConfiguration: React.FC = () => {
  const { workflows, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow } = useSettings();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);

  const [newWorkflow, setNewWorkflow] = useState<Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    trigger: {
      type: 'manual',
      config: {},
    },
    steps: [],
    enabled: true,
  });

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) return;
    
    try {
      await createWorkflow(newWorkflow);
      setNewWorkflow({
        name: '',
        description: '',
        trigger: { type: 'manual', config: {} },
        steps: [],
        enabled: true,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow(id);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      name: 'New Step',
      type: 'document-analysis',
      config: {},
      order: newWorkflow.steps.length,
    };
    setNewWorkflow({
      ...newWorkflow,
      steps: [...newWorkflow.steps, newStep],
    });
  };

  const removeStep = (stepId: string) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.filter((step: WorkflowStep) => step.id !== stepId),
    });
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.map((step: WorkflowStep) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    });
  };

  const getTriggerLabel = (trigger: WorkflowDefinition['trigger']) => {
    switch (trigger.type) {
      case 'manual': return 'Manual';
      case 'folder-watch': return 'Folder Watch';
      case 'schedule': return 'Scheduled';
      default: return 'Unknown';
    }
  };

  const getStepTypeLabel = (type: WorkflowStep['type']) => {
    switch (type) {
      case 'document-analysis': return 'Document Analysis';
      case 'estimation': return 'Project Estimation';
      case 'communication': return 'Communication Generation';
      case 'custom': return 'Custom';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2>Workflow Management</h2>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateForm(true)}
              disabled={showCreateForm}
            >
              Create Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="workflow-form mb-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="setting-group">
                    <label className="setting-label">Name</label>
                    <Input
                      type="text"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="Workflow name"
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label className="setting-label">Trigger Type</label>
                    <select
                      className="setting-select"
                      value={newWorkflow.trigger.type}
                      onChange={(e) => setNewWorkflow({
                        ...newWorkflow,
                        trigger: { type: e.target.value as any, config: {} }
                      })}
                    >
                      <option value="manual">Manual</option>
                      <option value="folder-watch">Folder Watch</option>
                      <option value="schedule">Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Description</label>
                  <textarea
                    className="setting-input"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Workflow description"
                    rows={3}
                  />
                </div>

                <div className="setting-group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="setting-label">Steps</label>
                    <Button variant="secondary" size="sm" onClick={addStep}>
                      Add Step
                    </Button>
                  </div>
                  
                  {newWorkflow.steps.map((step: WorkflowStep, index: number) => (
                    <div key={step.id} className="step-item p-3 border rounded mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Step {index + 1}</span>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => removeStep(step.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          placeholder="Step name"
                        />
                        <select
                          className="setting-select"
                          value={step.type}
                          onChange={(e) => updateStep(step.id, { type: e.target.value as any })}
                        >
                          <option value="document-analysis">Document Analysis</option>
                          <option value="estimation">Project Estimation</option>
                          <option value="communication">Communication Generation</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleCreateWorkflow}>
                    Create Workflow
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {workflows.length === 0 ? (
            <p className="text-gray-500">No workflows configured. Create your first workflow to get started.</p>
          ) : (
            <div className="workflows-list space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="workflow-item p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.enabled ? 'success' : 'default'}>
                        {workflow.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                      >
                        {workflow.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="workflow-details">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm">
                        <strong>Trigger:</strong> {getTriggerLabel(workflow.trigger)}
                      </span>
                      <span className="text-sm">
                        <strong>Steps:</strong> {workflow.steps.length}
                      </span>
                    </div>

                    {workflow.steps.length > 0 && (
                      <div className="steps-preview">
                        <div className="flex flex-wrap gap-2">
                          {workflow.steps.map((step: WorkflowStep, index: number) => (
                            <Badge key={step.id} variant="default">
                              {index + 1}. {getStepTypeLabel(step.type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};