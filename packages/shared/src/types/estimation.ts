import { BaseEntity, Priority } from './common.js';
import { Requirement } from './document.js';

export interface ComplexityScore {
  overall: number;
  technical: number;
  business: number;
  integration: number;
  factors: ComplexityFactor[];
}

export interface ComplexityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface TimeEstimate {
  totalHours: number;
  breakdown: EstimateBreakdown[];
  confidence: number;
  assumptions: string[];
}

export interface EstimateBreakdown {
  category: string;
  hours: number;
  description: string;
  requirements: string[];
}

export interface RiskFactor {
  id: string;
  name: string;
  probability: number;
  impact: Priority;
  description: string;
  mitigation: string;
}

export interface RiskAssessment {
  overall: Priority;
  factors: RiskFactor[];
  recommendations: string[];
}

export interface ProjectEstimate extends BaseEntity {
  totalHours: number;
  totalCost: number;
  breakdown: EstimateBreakdown[];
  risks: RiskFactor[];
  assumptions: string[];
  confidence: number;
  requirements: Requirement[];
}

export interface RateConfiguration {
  hourlyRate: number;
  currency: string;
  overhead: number;
  profitMargin: number;
}

export interface ComplexityFactors {
  technical: number;
  business: number;
  integration: number;
  testing: number;
  documentation: number;
}

export interface ProjectData {
  id: string;
  name: string;
  actualHours: number;
  estimatedHours: number;
  requirements: Requirement[];
  completedAt: Date;
}