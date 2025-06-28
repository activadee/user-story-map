export interface Issue {
  id: string;
  title: string;
  description: string;
  assignedStepId?: string;
  assignedReleaseId?: string;
  status: IssueStatus;
  priority: IssuePriority;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  gitlabId: number;
  author: string;
  milestone?: string;
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
  BLOCKED = 'blocked',
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface IssueAssignment {
  issueId: string;
  stepId: string;
  assignedAt: Date;
}
