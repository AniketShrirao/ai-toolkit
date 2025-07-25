import {
  GeneratedCommunication,
  OutputFormat,
} from "../types/communication.js";

export interface FormatOptions {
  includeMetadata?: boolean;
  styling?: "minimal" | "standard" | "professional";
  pageSize?: "A4" | "Letter";
  margins?: "narrow" | "normal" | "wide";
}

export interface FormattedOutput {
  format: OutputFormat;
  content: string;
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    fileSize?: number;
    mimeType: string;
  };
}

export class MultiFormatOutputService {
  /**
   * Convert communication to multiple output formats
   */
  public async generateMultipleFormats(
    communication: GeneratedCommunication,
    formats: OutputFormat[],
    options: FormatOptions = {}
  ): Promise<Record<OutputFormat, FormattedOutput>> {
    const results: Record<string, FormattedOutput> = {};

    for (const format of formats) {
      try {
        const formatted = await this.formatCommunication(
          communication,
          format,
          options
        );
        results[format] = formatted;
      } catch (error) {
        console.warn(`Failed to format communication as ${format}:`, error);
        // Provide fallback
        results[format] = {
          format,
          content: this.getFallbackContent(communication, format),
          metadata: {
            wordCount: communication.wordCount,
            estimatedReadTime: communication.estimatedReadTime,
            mimeType: this.getMimeType(format),
          },
        };
      }
    }

    return results as Record<OutputFormat, FormattedOutput>;
  }

  /**
   * Format communication for specific output format
   */
  public async formatCommunication(
    communication: GeneratedCommunication,
    format: OutputFormat,
    options: FormatOptions = {}
  ): Promise<FormattedOutput> {
    let content: string;

    switch (format) {
      case "email":
        content = this.formatAsEmail(communication, options);
        break;
      case "pdf":
        content = this.formatAsPDF(communication, options);
        break;
      case "markdown":
        content = this.formatAsMarkdown(communication, options);
        break;
      case "html":
        content = this.formatAsHTML(communication, options);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      format,
      content,
      metadata: {
        wordCount: this.countWords(content),
        estimatedReadTime: Math.ceil(this.countWords(content) / 200),
        fileSize: new Blob([content]).size,
        mimeType: this.getMimeType(format),
      },
    };
  }

  private formatAsEmail(
    communication: GeneratedCommunication,
    options: FormatOptions
  ): string {
    const { includeMetadata = false } = options;

    let email = `Subject: ${communication.subject}\n\n`;
    email += communication.content;

    if (includeMetadata) {
      email += `\n\n---\nGenerated: ${communication.createdAt.toISOString()}`;
      email += `\nType: ${communication.type}`;
      email += `\nAudience: ${communication.audienceType}`;
      email += `\nWord Count: ${communication.wordCount}`;
      email += `\nEstimated Read Time: ${communication.estimatedReadTime} minutes`;
    }

    return email;
  }

  private formatAsPDF(
    communication: GeneratedCommunication,
    options: FormatOptions
  ): string {
    const { styling = "professional", includeMetadata = true } = options;

    // Generate HTML that can be converted to PDF
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${communication.subject}</title>
    <style>
        ${this.getPDFStyles(styling)}
    </style>
</head>
<body>
    <div class="document">
        <header class="document-header">
            <h1>${communication.subject}</h1>
            ${
              includeMetadata
                ? `
            <div class="metadata">
                <p><strong>Type:</strong> ${this.formatCommunicationType(communication.type)}</p>
                <p><strong>Generated:</strong> ${communication.createdAt.toLocaleDateString()}</p>
                <p><strong>Audience:</strong> ${this.formatAudienceType(communication.audienceType)}</p>
            </div>
            `
                : ""
            }
        </header>
        
        <main class="document-content">
            ${this.convertToHTML(communication.content)}
        </main>
        
        ${
          includeMetadata
            ? `
        <footer class="document-footer">
            <p>Word Count: ${communication.wordCount} | Estimated Read Time: ${communication.estimatedReadTime} minutes</p>
        </footer>
        `
            : ""
        }
    </div>
</body>
</html>`;

    return html;
  }

  private formatAsMarkdown(
    communication: GeneratedCommunication,
    options: FormatOptions
  ): string {
    const { includeMetadata = false } = options;

    let markdown = `# ${communication.subject}\n\n`;

    if (includeMetadata) {
      markdown += `---\n`;
      markdown += `**Type:** ${this.formatCommunicationType(communication.type)}\n`;
      markdown += `**Audience:** ${this.formatAudienceType(communication.audienceType)}\n`;
      markdown += `**Generated:** ${communication.createdAt.toLocaleDateString()}\n`;
      markdown += `**Word Count:** ${communication.wordCount}\n`;
      markdown += `**Estimated Read Time:** ${communication.estimatedReadTime} minutes\n`;
      markdown += `---\n\n`;
    }

    // Convert content to proper markdown
    markdown += this.convertToMarkdown(communication.content);

    return markdown;
  }

  private formatAsHTML(
    communication: GeneratedCommunication,
    options: FormatOptions
  ): string {
    const { styling = "standard", includeMetadata = false } = options;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${communication.subject}</title>
    <style>
        ${this.getHTMLStyles(styling)}
    </style>
</head>
<body>
    <div class="communication">
        <header>
            <h1>${communication.subject}</h1>
            ${
              includeMetadata
                ? `
            <div class="metadata">
                <span class="badge type">${this.formatCommunicationType(communication.type)}</span>
                <span class="badge audience">${this.formatAudienceType(communication.audienceType)}</span>
                <span class="date">${communication.createdAt.toLocaleDateString()}</span>
            </div>
            `
                : ""
            }
        </header>
        
        <main>
            ${this.convertToHTML(communication.content)}
        </main>
        
        ${
          includeMetadata
            ? `
        <footer>
            <div class="stats">
                <span>${communication.wordCount} words</span>
                <span>${communication.estimatedReadTime} min read</span>
            </div>
        </footer>
        `
            : ""
        }
    </div>
</body>
</html>`;

    return html;
  }

  private getPDFStyles(styling: string): string {
    const baseStyles = `
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20mm;
            color: #333;
        }
        
        .document {
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .document-header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .document-header h1 {
            margin: 0 0 15px 0;
            font-size: 24px;
            color: #2c3e50;
        }
        
        .metadata {
            font-size: 12px;
            color: #666;
        }
        
        .metadata p {
            margin: 5px 0;
        }
        
        .document-content {
            margin-bottom: 40px;
        }
        
        .document-footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            font-size: 11px;
            color: #666;
            text-align: center;
        }
        
        h2 {
            color: #34495e;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        h3 {
            color: #34495e;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        ul, ol {
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                padding: 15mm;
            }
            
            .document-header {
                page-break-after: avoid;
            }
        }
    `;

    if (styling === "minimal") {
      return (
        baseStyles +
        `
        .document-header {
            border-bottom: 1px solid #ddd;
        }
        
        .document-header h1 {
            font-size: 20px;
        }
      `
      );
    }

    return baseStyles;
  }

  private getHTMLStyles(styling: string): string {
    const baseStyles = `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        
        .communication {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }
        
        header h1 {
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .metadata {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .date {
            font-size: 14px;
            opacity: 0.9;
        }
        
        main {
            padding: 40px;
        }
        
        footer {
            background: #f8f9fa;
            padding: 20px 40px;
            border-top: 1px solid #e9ecef;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
        }
        
        h2 {
            color: #495057;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        
        h3 {
            color: #6c757d;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        ul, ol {
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            header, main, footer {
                padding: 20px;
            }
            
            .metadata {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    `;

    if (styling === "minimal") {
      return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        
        .communication {
            max-width: 800px;
            margin: 0 auto;
        }
        
        header h1 {
            margin: 0 0 20px 0;
            font-size: 24px;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        main {
            margin: 20px 0;
        }
      `;
    }

    return baseStyles;
  }

  private convertToHTML(content: string): string {
    // Convert markdown-like content to HTML
    return content
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^\* (.+)$/gm, "<li>$1</li>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.+)$/gm, "<p>$1</p>")
      .replace(/<p><li>/g, "<ul><li>")
      .replace(/<\/li><\/p>/g, "</li></ul>")
      .replace(/<p><h/g, "<h")
      .replace(/<\/h([1-6])><\/p>/g, "</h$1>");
  }

  private convertToMarkdown(content: string): string {
    // Ensure content is properly formatted as markdown
    return content
      .replace(/^([^#\n])/gm, "$1") // Ensure regular text doesn't start with #
      .replace(/\n{3,}/g, "\n\n"); // Normalize line breaks
  }

  private formatCommunicationType(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatAudienceType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private getMimeType(format: OutputFormat): string {
    const mimeTypes: Record<OutputFormat, string> = {
      email: "text/plain",
      pdf: "application/pdf",
      markdown: "text/markdown",
      html: "text/html",
    };

    return mimeTypes[format] || "text/plain";
  }

  private getFallbackContent(
    communication: GeneratedCommunication,
    format: OutputFormat
  ): string {
    return `Subject: ${communication.subject}\n\n${communication.content}`;
  }
}
