import { Issue, UserJourney, Release, IssueAssignment } from '@app/core/models';

export interface UserStoryMapSnapshot {
  version: string;
  metadata: ExportMetadata;
  data: UserStoryMapData;
}

export interface ExportMetadata {
  exportedAt: string;
  exportedBy?: string;
  source: 'user-story-map';
  version: string;
  description?: string;
}

export interface UserStoryMapData {
  journeys: UserJourney[];
  issues: Issue[];
  releases: Release[];
  assignments: IssueAssignment[];
}

export interface ImportOptions {
  strategy: ImportStrategy;
  conflictResolution: ConflictResolution;
  validateReferences: boolean;
}

export type ImportStrategy = 'replace' | 'merge' | 'append';
export type ConflictResolution = 'skip' | 'overwrite' | 'rename';

export interface ImportResult {
  success: boolean;
  imported: ImportStats;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportStats {
  journeys: number;
  steps: number;
  issues: number;
  releases: number;
}

export interface ImportError {
  code: ImportErrorCode;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ImportWarning {
  code: string;
  message: string;
  field?: string;
}

export enum ImportErrorCode {
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  DUPLICATE_ID = 'DUPLICATE_ID',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  strategy: 'merge',
  conflictResolution: 'skip',
  validateReferences: true,
};
