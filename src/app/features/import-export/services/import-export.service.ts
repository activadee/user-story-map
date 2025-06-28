import { Injectable, inject } from '@angular/core';
import {
  UserStoryMapSnapshot,
  ImportOptions,
  ImportResult,
  ValidationResult,
  DEFAULT_IMPORT_OPTIONS,
  ImportErrorCode,
  ImportError,
} from '../interfaces/import-export.interface';
import { SchemaValidationService } from './schema-validation.service';
import { UserJourneyService } from '@app/features/user-story-map/services/user-journey.service';
import { UserStepService } from '@app/features/user-story-map/services/user-step.service';
import { IssueService } from '@app/features/issues/services/issue.service';
import { ReleaseService } from '@app/features/releases/services/release.service';
import { Issue, UserJourney, Release, IssueAssignment } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  private readonly schemaValidationService = inject(SchemaValidationService);
  private readonly journeyService = inject(UserJourneyService);
  private readonly stepService = inject(UserStepService);
  private readonly issueService = inject(IssueService);
  private readonly releaseService = inject(ReleaseService);

  async exportUserStoryMap(): Promise<UserStoryMapSnapshot> {
    try {
      // Get all data concurrently
      const [journeys, issues, releases] = await Promise.all([
        this.getAllJourneys(),
        this.getAllIssues(),
        this.getAllReleases(),
      ]);

      // Extract assignments from issues
      const assignments = this.extractAssignments(issues);

      const snapshot: UserStoryMapSnapshot = {
        version: '1.0.0',
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'user-story-map',
          version: '1.0.0',
          description: 'Complete user story map export',
        },
        data: {
          journeys,
          issues,
          releases,
          assignments,
        },
      };

      return snapshot;
    } catch (error) {
      throw new Error(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async importUserStoryMap(
    snapshot: UserStoryMapSnapshot,
    options: ImportOptions = DEFAULT_IMPORT_OPTIONS,
  ): Promise<ImportResult> {
    // Validate the snapshot
    const validation = this.validateSnapshot(snapshot);
    if (!validation.isValid) {
      return {
        success: false,
        imported: { journeys: 0, steps: 0, issues: 0, releases: 0 },
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    try {
      const result = await this.executeImport(snapshot, options);
      return {
        ...result,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        imported: { journeys: 0, steps: 0, issues: 0, releases: 0 },
        errors: [
          {
            code: ImportErrorCode.TRANSACTION_FAILED,
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        warnings: validation.warnings,
      };
    }
  }

  validateSnapshot(snapshot: unknown): ValidationResult {
    return this.schemaValidationService.validateUserStoryMapSnapshot(snapshot);
  }

  exportToFile(): void {
    this.exportUserStoryMap()
      .then((snapshot) => {
        const jsonString = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user-story-map-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Export failed:', error);
        throw error;
      });
  }

  importFromFile(file: File, options?: ImportOptions): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      if (!file.type.includes('json')) {
        reject(new Error('Please select a valid JSON file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e): Promise<void> => {
        try {
          const content = e.target?.result as string;
          if (!content) {
            throw new Error('File appears to be empty');
          }

          let snapshot: unknown;
          try {
            snapshot = JSON.parse(content);
          } catch {
            reject(new Error('Invalid JSON file format'));
            return;
          }

          const result = await this.importUserStoryMap(
            snapshot as UserStoryMapSnapshot,
            options,
          );
          resolve(result);
        } catch (error) {
          reject(
            new Error(
              `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
          );
        }
      };

      reader.onerror = (): void => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  private async getAllJourneys(): Promise<UserJourney[]> {
    // Get journeys with their steps
    const journeys = this.journeyService.journeys();
    const journeysWithSteps = await Promise.all(
      journeys.map(async (journey) => {
        const steps = this.stepService.getStepsByJourney(journey.id);
        return {
          ...journey,
          userSteps: steps,
        };
      }),
    );
    return journeysWithSteps;
  }

  private async getAllIssues(): Promise<Issue[]> {
    return this.issueService.issues();
  }

  private async getAllReleases(): Promise<Release[]> {
    return this.releaseService.releases();
  }

  private extractAssignments(issues: Issue[]): IssueAssignment[] {
    return issues
      .filter((issue) => issue.assignedStepId)
      .map((issue) => ({
        issueId: issue.id,
        stepId: issue.assignedStepId!,
        assignedAt: issue.updatedAt,
      }));
  }

  private async executeImport(
    snapshot: UserStoryMapSnapshot,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const { data } = snapshot;
    const stats = { journeys: 0, steps: 0, issues: 0, releases: 0 };
    const errors: ImportError[] = [];

    try {
      // Import in dependency order: releases -> journeys -> steps -> issues

      // 1. Import releases
      if (options.strategy === 'replace') {
        // Clear existing releases if replacing
        await this.clearExistingData();
      }

      for (const release of data.releases) {
        try {
          await this.releaseService.createRelease(release);
          stats.releases++;
        } catch {
          if (options.conflictResolution === 'skip') {
            continue;
          } else if (options.conflictResolution === 'overwrite') {
            await this.releaseService.updateRelease(release.id, release);
            stats.releases++;
          }
        }
      }

      // 2. Import journeys
      for (const journey of data.journeys) {
        try {
          // Create journey with empty userSteps first, then add steps separately
          const { userSteps, ...journeyWithoutSteps } = journey;
          const journeyData = { ...journeyWithoutSteps, userSteps: [] };
          await this.journeyService.createJourney(journeyData);
          stats.journeys++;

          // 3. Import steps for this journey
          if (userSteps) {
            for (const step of userSteps) {
              try {
                await this.stepService.createStep(step);
                stats.steps++;
              } catch {
                if (options.conflictResolution === 'overwrite') {
                  await this.stepService.updateStep(step.id, step);
                  stats.steps++;
                }
              }
            }
          }
        } catch {
          if (options.conflictResolution === 'skip') {
            continue;
          } else if (options.conflictResolution === 'overwrite') {
            const journeyData = { ...journey, userSteps: [] };
            await this.journeyService.updateJourney(journey.id, journeyData);
            stats.journeys++;
          }
        }
      }

      // 4. Import issues
      for (const issue of data.issues) {
        try {
          await this.issueService.createIssue(issue);
          stats.issues++;
        } catch {
          if (options.conflictResolution === 'skip') {
            continue;
          } else if (options.conflictResolution === 'overwrite') {
            await this.issueService.updateIssue(issue.id, issue);
            stats.issues++;
          }
        }
      }

      return {
        success: true,
        imported: stats,
        errors,
        warnings: [],
      };
    } catch (error) {
      throw new Error(
        `Import execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async clearExistingData(): Promise<void> {
    // Clear all existing data for replace strategy
    // Note: In a real application, this would be a transaction
    const journeys = this.journeyService.journeys();
    const issues = this.issueService.issues();
    const releases = this.releaseService.releases();

    // Delete in reverse dependency order
    await Promise.all(
      issues.map((issue) => this.issueService.deleteIssue(issue.id)),
    );
    await Promise.all(
      journeys.map((journey) => this.journeyService.deleteJourney(journey.id)),
    );
    await Promise.all(
      releases.map((release) => this.releaseService.deleteRelease(release.id)),
    );
  }
}
