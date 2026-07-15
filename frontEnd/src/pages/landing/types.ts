export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  klStage: number;
  jointSpaceNarrowing: 'None' | 'Mild' | 'Moderate' | 'Severe';
  osteophyteSpurs: 'None' | 'Doubtful' | 'Definite' | 'Severe';
  sclerosis: 'None' | 'Mild' | 'Moderate' | 'Severe';
  flexionRange: number; // in degrees, e.g. 110 (normal is 135)
  extensionLag: number; // in degrees, e.g. 5 (normal is 0)
  crepitusLevel: 'None' | 'Occasional' | 'Frequent' | 'Continuous';
  acousticFrequencies: number[]; // representative sensor logs
  acousticDecibels: number; // peak noise intensity
}

export interface KlStageDetails {
  stage: number;
  label: string;
  category: 'HEALTHY' | 'Early Stage' | 'Progressing' | 'Critical';
  badgeColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  xrayFeatures: string[];
}

export interface AiDiagnosticReport {
  diagnosis: string;
  severityExplanation: string;
  findings: string[];
  rehabilitationPlan: string[];
  precautions: string[];
  prognosis: string;
  generatedAt: string;
}
