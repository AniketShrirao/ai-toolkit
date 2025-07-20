import { AnalysisType } from './common.js';
import { DocumentAnalysis } from './document.js';
import { ProjectEstimate } from './estimation.js';

export interface AnalysisResult {
  type: AnalysisType;
  confidence: number;
  data: any;
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  model: string;
  processingTime: number;
  tokensUsed: number;
  version: string;
}

export interface CodebaseAnalysis {
  structure: ProjectStructure;
  dependencies: Dependency[];
  metrics: CodeMetrics;
  issues: CodeIssue[];
  documentation: DocumentationGap[];
  recommendations: Recommendation[];
}

export interface ProjectStructure {
  rootPath: string;
  directories: DirectoryInfo[];
  files: FileInfo[];
  totalFiles: number;
  totalLines: number;
  languages: LanguageStats[];
}

export interface DirectoryInfo {
  path: string;
  fileCount: number;
  subdirectories: number;
  purpose?: string;
}

export interface FileInfo {
  path: string;
  size: number;
  lines: number;
  language: string;
  lastModified: Date;
  complexity?: number;
}

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  vulnerabilities?: SecurityVulnerability[];
  outdated?: boolean;
  license?: string;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  duplicateCode: number;
  technicalDebt: number;
}

export interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code-smell' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cwe?: string;
  cvss?: number;
  fixAvailable: boolean;
}

export interface DocumentationGap {
  type: 'missing' | 'outdated' | 'incomplete';
  file: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  id: string;
  category: 'performance' | 'security' | 'maintainability' | 'architecture';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}