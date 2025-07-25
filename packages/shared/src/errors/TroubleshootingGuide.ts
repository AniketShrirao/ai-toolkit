/**
 * Troubleshooting guide system for the AI Toolkit
 * Provides user-friendly error messages and step-by-step troubleshooting
 */

import { BaseError, ErrorCategory, TroubleshootingStep } from "./ErrorTypes.js";

export interface TroubleshootingGuide {
  title: string;
  description: string;
  category: ErrorCategory;
  steps: TroubleshootingStep[];
  additionalResources: ResourceLink[];
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface ResourceLink {
  title: string;
  url: string;
  type: "documentation" | "video" | "forum" | "github";
}

export class TroubleshootingGuideManager {
  private guides: Map<string, TroubleshootingGuide> = new Map();

  constructor() {
    this.initializeBuiltInGuides();
  }

  /**
   * Get troubleshooting guide for an error
   */
  getGuideForError(error: BaseError): TroubleshootingGuide | null {
    return (
      this.guides.get(error.code) || this.guides.get(error.category) || null
    );
  }

  /**
   * Get all available guides
   */
  getAllGuides(): TroubleshootingGuide[] {
    return Array.from(this.guides.values());
  }

  /**
   * Get guides by category
   */
  getGuidesByCategory(category: ErrorCategory): TroubleshootingGuide[] {
    return Array.from(this.guides.values()).filter(
      (guide) => guide.category === category
    );
  }

  /**
   * Register a custom troubleshooting guide
   */
  registerGuide(key: string, guide: TroubleshootingGuide): void {
    this.guides.set(key, guide);
  }

  /**
   * Generate user-friendly error message with troubleshooting steps
   */
  generateUserMessage(error: BaseError): string {
    const guide = this.getGuideForError(error);

    let message = error.userMessage;

    if (guide) {
      message += "\n\nTroubleshooting Steps:\n";
      guide.steps.forEach((step, index) => {
        message += `${index + 1}. ${step.description}\n`;
        message += `   Action: ${step.action}\n`;
        message += `   Expected: ${step.expected}\n\n`;
      });

      if (guide.additionalResources.length > 0) {
        message += "Additional Resources:\n";
        guide.additionalResources.forEach((resource) => {
          message += `• ${resource.title}: ${resource.url}\n`;
        });
      }
    }

    return message;
  }

  /**
   * Generate HTML troubleshooting guide
   */
  generateHtmlGuide(error: BaseError): string {
    const guide = this.getGuideForError(error);

    if (!guide) {
      return `
        <div class="troubleshooting-guide">
          <h3>Error: ${error.code}</h3>
          <p>${error.userMessage}</p>
          <p><em>No specific troubleshooting guide available for this error.</em></p>
        </div>
      `;
    }

    let html = `
      <div class="troubleshooting-guide">
        <h3>${guide.title}</h3>
        <p class="description">${guide.description}</p>
        <div class="metadata">
          <span class="difficulty difficulty-${guide.difficulty}">${guide.difficulty}</span>
          <span class="time">Estimated time: ${guide.estimatedTime}</span>
        </div>
        
        <h4>Troubleshooting Steps:</h4>
        <ol class="troubleshooting-steps">
    `;

    guide.steps.forEach((step) => {
      html += `
        <li class="step">
          <h5>Step ${step.step}: ${step.description}</h5>
          <p><strong>Action:</strong> ${step.action}</p>
          <p><strong>Expected Result:</strong> ${step.expected}</p>
        </li>
      `;
    });

    html += `</ol>`;

    if (guide.additionalResources.length > 0) {
      html += `
        <h4>Additional Resources:</h4>
        <ul class="resources">
      `;

      guide.additionalResources.forEach((resource) => {
        html += `
          <li class="resource resource-${resource.type}">
            <a href="${resource.url}" target="_blank">${resource.title}</a>
          </li>
        `;
      });

      html += `</ul>`;
    }

    html += `</div>`;

    return html;
  }

  /**
   * Initialize built-in troubleshooting guides
   */
  private initializeBuiltInGuides(): void {
    // Ollama Connection Guide
    this.registerGuide("OLLAMA_CONNECTION_FAILED", {
      title: "Ollama Connection Failed",
      description:
        "The AI Toolkit cannot connect to the Ollama service. This is required for AI-powered document analysis and processing.",
      category: ErrorCategory.OLLAMA_CONNECTION,
      estimatedTime: "5-10 minutes",
      difficulty: "beginner",
      steps: [
        {
          step: 1,
          description: "Check if Ollama is installed",
          action: "Open a terminal and run: ollama --version",
          expected:
            "Version information should be displayed (e.g., ollama version is 0.1.0)",
        },
        {
          step: 2,
          description: "Install Ollama if not present",
          action:
            "Visit https://ollama.ai and follow installation instructions for your operating system",
          expected: "Ollama should be successfully installed",
        },
        {
          step: 3,
          description: "Start the Ollama service",
          action: "Run: ollama serve",
          expected:
            "Ollama should start and display 'Ollama is running on http://localhost:11434'",
        },
        {
          step: 4,
          description: "Verify the service is accessible",
          action:
            "Open http://localhost:11434 in your browser or run: curl http://localhost:11434",
          expected: "Should receive a response from the Ollama API",
        },
        {
          step: 5,
          description: "Test with a basic model",
          action: "Run: ollama pull llama2 (this may take several minutes)",
          expected: "Model should download successfully",
        },
      ],
      additionalResources: [
        {
          title: "Ollama Official Documentation",
          url: "https://github.com/jmorganca/ollama",
          type: "documentation",
        },
        {
          title: "Ollama Installation Guide",
          url: "https://ollama.ai/download",
          type: "documentation",
        },
      ],
    });

    // Model Error Guide
    this.registerGuide("OLLAMA_MODEL_ERROR", {
      title: "Ollama Model Error",
      description:
        "The requested AI model is not available or failed to respond. This may be due to the model not being downloaded or insufficient system resources.",
      category: ErrorCategory.AI_MODEL,
      estimatedTime: "10-15 minutes",
      difficulty: "beginner",
      steps: [
        {
          step: 1,
          description: "List available models",
          action: "Run: ollama list",
          expected: "Should display a list of installed models",
        },
        {
          step: 2,
          description: "Download required model if missing",
          action: "Run: ollama pull [model-name] (e.g., ollama pull llama2)",
          expected:
            "Model should download successfully (may take 10+ minutes for large models)",
        },
        {
          step: 3,
          description: "Test model functionality",
          action: "Run: ollama run [model-name] 'Hello, how are you?'",
          expected: "Model should respond with a greeting",
        },
        {
          step: 4,
          description: "Check system resources",
          action:
            "Monitor RAM usage - models require 4-8GB+ of available memory",
          expected: "Sufficient memory should be available for the model",
        },
        {
          step: 5,
          description: "Try a smaller model if resources are limited",
          action: "Consider using 'llama2:7b' instead of larger variants",
          expected: "Smaller model should load and run successfully",
        },
      ],
      additionalResources: [
        {
          title: "Ollama Model Library",
          url: "https://ollama.ai/library",
          type: "documentation",
        },
        {
          title: "System Requirements",
          url: "https://github.com/jmorganca/ollama#system-requirements",
          type: "documentation",
        },
      ],
    });

    // Document Processing Guide
    this.registerGuide("DOCUMENT_PROCESSING_FAILED", {
      title: "Document Processing Failed",
      description:
        "The system failed to process your document. This could be due to file format issues, corruption, or processing limitations.",
      category: ErrorCategory.DOCUMENT_PROCESSING,
      estimatedTime: "5-10 minutes",
      difficulty: "beginner",
      steps: [
        {
          step: 1,
          description: "Check file format",
          action:
            "Verify the file is in a supported format (PDF, DOCX, TXT, MD)",
          expected: "File should have a supported extension and be readable",
        },
        {
          step: 2,
          description: "Test file integrity",
          action:
            "Try opening the file in its native application (e.g., Adobe Reader for PDF)",
          expected: "File should open without errors",
        },
        {
          step: 3,
          description: "Check file size",
          action: "Ensure file is under 100MB and has reasonable page count",
          expected: "File should be within processing limits",
        },
        {
          step: 4,
          description: "Try with a simpler document",
          action: "Test with a basic text document to isolate the issue",
          expected: "Simple document should process successfully",
        },
        {
          step: 5,
          description: "Convert to supported format",
          action: "If using an unsupported format, convert to PDF or DOCX",
          expected: "Converted file should process successfully",
        },
      ],
      additionalResources: [
        {
          title: "Supported File Formats",
          url: "#",
          type: "documentation",
        },
      ],
    });

    // Workflow Execution Guide
    this.registerGuide("WORKFLOW_EXECUTION_FAILED", {
      title: "Workflow Execution Failed",
      description:
        "An automated workflow failed to complete. This may be due to configuration issues, dependency failures, or resource constraints.",
      category: ErrorCategory.WORKFLOW_EXECUTION,
      estimatedTime: "10-20 minutes",
      difficulty: "intermediate",
      steps: [
        {
          step: 1,
          description: "Check workflow configuration",
          action:
            "Review the workflow definition for syntax errors or missing parameters",
          expected:
            "Configuration should be valid JSON/YAML with all required fields",
        },
        {
          step: 2,
          description: "Verify dependencies",
          action: "Ensure Ollama and other required services are running",
          expected: "All dependencies should be accessible and healthy",
        },
        {
          step: 3,
          description: "Check input data",
          action:
            "Verify that input files and parameters are valid and accessible",
          expected: "All input data should be present and in correct format",
        },
        {
          step: 4,
          description: "Review logs",
          action: "Check application logs for specific error messages",
          expected: "Logs should provide details about the failure point",
        },
        {
          step: 5,
          description: "Test individual steps",
          action:
            "Try running workflow steps individually to isolate the problem",
          expected: "Individual steps should complete successfully",
        },
      ],
      additionalResources: [
        {
          title: "Workflow Configuration Guide",
          url: "#",
          type: "documentation",
        },
      ],
    });

    // File System Guide
    this.registerGuide("FILE_SYSTEM_ERROR", {
      title: "File System Error",
      description:
        "A file operation failed. This is typically due to permission issues, disk space, or file locks.",
      category: ErrorCategory.FILE_SYSTEM,
      estimatedTime: "5-15 minutes",
      difficulty: "beginner",
      steps: [
        {
          step: 1,
          description: "Check file permissions",
          action: "Verify you have read/write access to the file and directory",
          expected: "You should have appropriate permissions for the operation",
        },
        {
          step: 2,
          description: "Check disk space",
          action:
            "Ensure sufficient free disk space (at least 1GB recommended)",
          expected: "Adequate disk space should be available",
        },
        {
          step: 3,
          description: "Check if file is in use",
          action: "Close any applications that might have the file open",
          expected: "File should not be locked by other processes",
        },
        {
          step: 4,
          description: "Verify file path",
          action: "Check that the file path exists and is correctly specified",
          expected: "Path should be valid and accessible",
        },
        {
          step: 5,
          description: "Try with a different location",
          action: "Test the operation with a file in a different directory",
          expected: "Operation should succeed with different location",
        },
      ],
      additionalResources: [
        {
          title: "File Permission Guide",
          url: "#",
          type: "documentation",
        },
      ],
    });

    // Configuration Error Guide
    this.registerGuide("CONFIGURATION_ERROR", {
      title: "Configuration Error",
      description:
        "The application configuration is invalid or missing required settings.",
      category: ErrorCategory.CONFIGURATION,
      estimatedTime: "5-10 minutes",
      difficulty: "intermediate",
      steps: [
        {
          step: 1,
          description: "Check configuration file exists",
          action:
            "Verify the configuration file is present in the expected location",
          expected: "Configuration file should exist and be readable",
        },
        {
          step: 2,
          description: "Validate configuration syntax",
          action: "Check that the configuration file is valid JSON/YAML",
          expected: "Configuration should parse without syntax errors",
        },
        {
          step: 3,
          description: "Verify required settings",
          action: "Ensure all required configuration keys are present",
          expected: "All mandatory settings should be configured",
        },
        {
          step: 4,
          description: "Check setting values",
          action: "Verify configuration values are within valid ranges",
          expected: "All values should be appropriate for their settings",
        },
        {
          step: 5,
          description: "Reset to defaults",
          action: "If issues persist, reset configuration to default values",
          expected: "Application should work with default configuration",
        },
      ],
      additionalResources: [
        {
          title: "Configuration Reference",
          url: "#",
          type: "documentation",
        },
      ],
    });
  }
}
