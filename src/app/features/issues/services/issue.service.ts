import { Injectable, inject, signal, computed } from '@angular/core';
import { DatabaseService } from '@app/core/services/database.service';
import { Issue, IssueStatus, IssuePriority } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private readonly db = inject(DatabaseService);
  private readonly _issues = signal<Issue[]>([]);
  private readonly _loading = signal(false);

  readonly issues = this._issues.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly unassignedIssues = computed(() =>
    this._issues().filter((issue) => !issue.assignedStepId),
  );

  readonly assignedIssues = computed(() =>
    this._issues().filter((issue) => issue.assignedStepId),
  );

  readonly issuesByStep = computed(() => {
    const assigned = this.assignedIssues();
    return assigned.reduce(
      (acc, issue) => {
        if (!acc[issue.assignedStepId!]) {
          acc[issue.assignedStepId!] = [];
        }
        acc[issue.assignedStepId!].push(issue);
        return acc;
      },
      {} as Record<string, Issue[]>,
    );
  });

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    await this.loadIssues();

    if (this._issues().length === 0) {
      await this.initializeMockData();
    }
  }

  private async loadIssues(): Promise<void> {
    try {
      this._loading.set(true);
      const issues = await this.db.getAll<Issue>('issues');
      this._issues.set(issues);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createIssue(data: Omit<Issue, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const issue: Issue = {
      ...data,
      id,
    };

    try {
      await this.db.put('issues', issue);
      this._issues.update((issues) => [...issues, issue]);
      return id;
    } catch (error) {
      console.error('Failed to create issue:', error);
      throw error;
    }
  }

  async updateIssue(id: string, data: Partial<Issue>): Promise<void> {
    const currentIssues = this._issues();
    const index = currentIssues.findIndex((i) => i.id === id);

    if (index === -1) {
      throw new Error(`Issue with id ${id} not found`);
    }

    const updatedIssue = { ...currentIssues[index], ...data, id };

    try {
      await this.db.put('issues', updatedIssue);
      this._issues.update((issues) =>
        issues.map((i) => (i.id === id ? updatedIssue : i)),
      );
    } catch (error) {
      console.error('Failed to update issue:', error);
      throw error;
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      await this.db.delete('issues', id);
      this._issues.update((issues) => issues.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete issue:', error);
      throw error;
    }
  }

  async assignIssueToStep(issueId: string, stepId: string): Promise<void> {
    const issue = this.getIssueById(issueId);
    if (!issue) throw new Error(`Issue ${issueId} not found`);

    await this.updateIssue(issueId, {
      assignedStepId: stepId,
      updatedAt: new Date(),
    });
  }

  async unassignIssue(issueId: string): Promise<void> {
    const issue = this.getIssueById(issueId);
    if (!issue) throw new Error(`Issue ${issueId} not found`);

    await this.updateIssue(issueId, {
      assignedStepId: undefined,
      assignedReleaseId: undefined,
      updatedAt: new Date(),
    });
  }

  getIssueById(id: string): Issue | undefined {
    return this._issues().find((i) => i.id === id);
  }

  getIssuesByStep(stepId: string): Issue[] {
    return this.issuesByStep()[stepId] || [];
  }

  private async initializeMockData(): Promise<void> {
    const mockIssues = this.generateMockIssues();

    try {
      await Promise.all(mockIssues.map((issue) => this.createIssue(issue)));
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
    }
  }

  private generateMockIssues(): Omit<Issue, 'id'>[] {
    return [
      {
        title: 'User login authentication fails',
        description:
          'Users unable to login with correct credentials. The authentication service returns a 401 error even with valid username and password combinations.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        labels: ['bug', 'authentication', 'backend'],
        gitlabId: 1001,
        author: 'john.doe',
        milestone: 'v1.2.0',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        title: 'Add password reset functionality',
        description:
          'Users need the ability to reset forgotten passwords via email. Should include secure token generation and expiration.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        labels: ['feature', 'user-experience', 'security'],
        gitlabId: 1002,
        author: 'jane.smith',
        milestone: 'v1.3.0',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
      {
        title: 'Profile page loading performance',
        description:
          'Profile page takes 5+ seconds to load. Need to optimize database queries and implement caching.',
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.MEDIUM,
        labels: ['performance', 'frontend', 'optimization'],
        gitlabId: 1003,
        author: 'mike.wilson',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        title: 'Email verification not working',
        description:
          'Email verification links are not being sent to users after registration. SMTP configuration needs review.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        labels: ['bug', 'email', 'registration'],
        gitlabId: 1004,
        author: 'sarah.jones',
        milestone: 'v1.2.0',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        title: 'Dark mode toggle implementation',
        description:
          'Add dark mode support with user preference persistence. Should respect system theme by default.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        labels: ['feature', 'ui', 'accessibility'],
        gitlabId: 1005,
        author: 'alex.brown',
        milestone: 'v1.4.0',
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-19'),
      },
      {
        title: 'API rate limiting not enforced',
        description:
          'API endpoints are vulnerable to abuse. Implement rate limiting with proper error responses.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.CRITICAL,
        labels: ['security', 'api', 'backend'],
        gitlabId: 1006,
        author: 'chris.taylor',
        milestone: 'v1.2.0',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        title: 'Mobile responsive design issues',
        description:
          'Several pages are not properly responsive on mobile devices. Navigation menu breaks below 768px width.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        labels: ['bug', 'responsive', 'css', 'mobile'],
        gitlabId: 1007,
        author: 'emma.davis',
        createdAt: new Date('2024-01-21'),
        updatedAt: new Date('2024-01-21'),
      },
      {
        title: 'Add user activity logging',
        description:
          'Implement comprehensive user activity logging for audit purposes. Should include login, logout, and key actions.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        labels: ['feature', 'logging', 'audit', 'compliance'],
        gitlabId: 1008,
        author: 'david.garcia',
        milestone: 'v1.3.0',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
      },
      {
        title: 'Database connection pool exhaustion',
        description:
          'Application crashes during high load due to database connection pool exhaustion. Need to optimize connection management.',
        status: IssueStatus.BLOCKED,
        priority: IssuePriority.CRITICAL,
        labels: ['bug', 'database', 'performance', 'infrastructure'],
        gitlabId: 1009,
        author: 'lisa.martinez',
        milestone: 'v1.2.0',
        createdAt: new Date('2024-01-23'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        title: 'File upload validation bypass',
        description:
          'File upload security validation can be bypassed. Need to implement proper file type validation and virus scanning.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        labels: ['security', 'file-upload', 'validation'],
        gitlabId: 1010,
        author: 'ryan.rodriguez',
        milestone: 'v1.2.0',
        createdAt: new Date('2024-01-24'),
        updatedAt: new Date('2024-01-24'),
      },
      {
        title: 'Search functionality improvements',
        description:
          "Current search is too slow and doesn't handle partial matches well. Consider implementing Elasticsearch integration.",
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        labels: ['feature', 'search', 'performance', 'user-experience'],
        gitlabId: 1011,
        author: 'anna.lee',
        milestone: 'v1.3.0',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        title: 'Export data functionality',
        description:
          'Users need ability to export their data in various formats (CSV, JSON, PDF). Should include data filtering options.',
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        labels: ['feature', 'export', 'data', 'user-request'],
        gitlabId: 1012,
        author: 'tom.anderson',
        milestone: 'v1.4.0',
        createdAt: new Date('2024-01-26'),
        updatedAt: new Date('2024-01-26'),
      },
    ];
  }
}
