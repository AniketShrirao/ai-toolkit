import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { Badge } from '@components/UI/Badge';
import { useSettings } from '@hooks/useSettings';
export const WorkflowConfiguration = () => {
    const { workflows, createWorkflow, updateWorkflow, deleteWorkflow, toggleWorkflow } = useSettings();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [newWorkflow, setNewWorkflow] = useState({
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
        if (!newWorkflow.name.trim())
            return;
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
        }
        catch (error) {
            console.error('Failed to create workflow:', error);
        }
    };
    const handleDeleteWorkflow = async (id) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            try {
                await deleteWorkflow(id);
            }
            catch (error) {
                console.error('Failed to delete workflow:', error);
            }
        }
    };
    const addStep = () => {
        const newStep = {
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
    const removeStep = (stepId) => {
        setNewWorkflow({
            ...newWorkflow,
            steps: newWorkflow.steps.filter((step) => step.id !== stepId),
        });
    };
    const updateStep = (stepId, updates) => {
        setNewWorkflow({
            ...newWorkflow,
            steps: newWorkflow.steps.map((step) => step.id === stepId ? { ...step, ...updates } : step),
        });
    };
    const getTriggerLabel = (trigger) => {
        switch (trigger.type) {
            case 'manual': return 'Manual';
            case 'folder-watch': return 'Folder Watch';
            case 'schedule': return 'Scheduled';
            default: return 'Unknown';
        }
    };
    const getStepTypeLabel = (type) => {
        switch (type) {
            case 'document-analysis': return 'Document Analysis';
            case 'estimation': return 'Project Estimation';
            case 'communication': return 'Communication Generation';
            case 'custom': return 'Custom';
            default: return 'Unknown';
        }
    };
    return (_jsx("div", { className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { children: "Workflow Management" }), _jsx(Button, { variant: "primary", onClick: () => setShowCreateForm(true), disabled: showCreateForm, children: "Create Workflow" })] }) }), _jsxs(CardContent, { children: [showCreateForm && (_jsxs("div", { className: "workflow-form mb-6 p-4 border rounded-lg", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Create New Workflow" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Name" }), _jsx(Input, { type: "text", value: newWorkflow.name, onChange: (e) => setNewWorkflow({ ...newWorkflow, name: e.target.value }), placeholder: "Workflow name" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Trigger Type" }), _jsxs("select", { className: "setting-select", value: newWorkflow.trigger.type, onChange: (e) => setNewWorkflow({
                                                                ...newWorkflow,
                                                                trigger: { type: e.target.value, config: {} }
                                                            }), children: [_jsx("option", { value: "manual", children: "Manual" }), _jsx("option", { value: "folder-watch", children: "Folder Watch" }), _jsx("option", { value: "schedule", children: "Scheduled" })] })] })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Description" }), _jsx("textarea", { className: "setting-input", value: newWorkflow.description, onChange: (e) => setNewWorkflow({ ...newWorkflow, description: e.target.value }), placeholder: "Workflow description", rows: 3 })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "setting-label", children: "Steps" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: addStep, children: "Add Step" })] }), newWorkflow.steps.map((step, index) => (_jsxs("div", { className: "step-item p-3 border rounded mb-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "font-medium", children: ["Step ", index + 1] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => removeStep(step.id), children: "Remove" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Input, { type: "text", value: step.name, onChange: (e) => updateStep(step.id, { name: e.target.value }), placeholder: "Step name" }), _jsxs("select", { className: "setting-select", value: step.type, onChange: (e) => updateStep(step.id, { type: e.target.value }), children: [_jsx("option", { value: "document-analysis", children: "Document Analysis" }), _jsx("option", { value: "estimation", children: "Project Estimation" }), _jsx("option", { value: "communication", children: "Communication Generation" }), _jsx("option", { value: "custom", children: "Custom" })] })] })] }, step.id)))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "primary", onClick: handleCreateWorkflow, children: "Create Workflow" }), _jsx(Button, { variant: "secondary", onClick: () => setShowCreateForm(false), children: "Cancel" })] })] })] })), workflows.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No workflows configured. Create your first workflow to get started." })) : (_jsx("div", { className: "workflows-list space-y-4", children: workflows.map((workflow) => (_jsxs("div", { className: "workflow-item p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: workflow.name }), _jsx("p", { className: "text-sm text-gray-600", children: workflow.description })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: workflow.enabled ? 'success' : 'default', children: workflow.enabled ? 'Enabled' : 'Disabled' }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => toggleWorkflow(workflow.id, !workflow.enabled), children: workflow.enabled ? 'Disable' : 'Enable' }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => handleDeleteWorkflow(workflow.id), children: "Delete" })] })] }), _jsxs("div", { className: "workflow-details", children: [_jsxs("div", { className: "flex items-center gap-4 mb-2", children: [_jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: "Trigger:" }), " ", getTriggerLabel(workflow.trigger)] }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: "Steps:" }), " ", workflow.steps.length] })] }), workflow.steps.length > 0 && (_jsx("div", { className: "steps-preview", children: _jsx("div", { className: "flex flex-wrap gap-2", children: workflow.steps.map((step, index) => (_jsxs(Badge, { variant: "default", children: [index + 1, ". ", getStepTypeLabel(step.type)] }, step.id))) }) }))] })] }, workflow.id))) }))] })] }) }));
};
//# sourceMappingURL=WorkflowConfiguration.js.map