import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReleaseService } from '../../services/release.service';
import { IssueService } from '@app/features/issues/services/issue.service';
import { Release, Issue } from '@app/core/models';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { CreateReleaseModal } from '../create-release-modal/create-release-modal';
import { EditReleaseModal } from '../edit-release-modal/edit-release-modal';

@Component({
  selector: 'app-release-table',
  imports: [DatePipe, PageHeader, CreateReleaseModal, EditReleaseModal],
  templateUrl: './release-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseTable {
  protected readonly releaseService = inject(ReleaseService);
  protected readonly issueService = inject(IssueService);

  protected readonly showCreateDialog = signal(false);
  protected readonly editingRelease = signal<Release | null>(null);

  protected readonly tableData = computed(() => {
    const releases = this.releaseService.sortedReleases();
    const allIssues = this.issueService.issues();

    return releases.map((release) => {
      const assignedIssues = allIssues.filter(
        (issue) => issue.assignedReleaseId === release.id,
      );
      return {
        release,
        assignedIssues,
        issueCount: assignedIssues.length,
      };
    });
  });

  protected readonly availableIssues = computed(() =>
    this.issueService
      .issues()
      .filter((issue) => issue.assignedStepId && !issue.assignedReleaseId),
  );

  protected readonly allAssignedIssues = computed(() =>
    this.issueService.issues().filter((issue) => issue.assignedStepId),
  );

  protected showCreateReleaseDialog(): void {
    this.showCreateDialog.set(true);
  }

  protected cancelCreate(): void {
    this.showCreateDialog.set(false);
  }

  protected async submitCreate(data: {
    name: string;
    description: string;
    selectedIssueIds: Set<string>;
  }): Promise<void> {
    try {
      const releaseId = await this.releaseService.createRelease({
        name: data.name,
        description: data.description || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (const issueId of data.selectedIssueIds) {
        await this.issueService.updateIssue(issueId, {
          assignedReleaseId: releaseId,
          updatedAt: new Date(),
        });
      }

      this.showCreateDialog.set(false);
    } catch (error) {
      console.error('Failed to create release:', error);
    }
  }

  protected editRelease(release: Release): void {
    this.editingRelease.set(release);
  }

  protected cancelEdit(): void {
    this.editingRelease.set(null);
  }

  protected async submitEdit(data: {
    name: string;
    description: string;
    selectedIssueIds: Set<string>;
  }): Promise<void> {
    const release = this.editingRelease();
    if (!release) return;

    try {
      await this.releaseService.updateRelease(release.id, {
        name: data.name,
        description: data.description || undefined,
        updatedAt: new Date(),
      });

      const allIssues = this.issueService.issues();
      const currentlyAssigned = allIssues.filter(
        (issue) => issue.assignedReleaseId === release.id,
      );
      const newlySelected = data.selectedIssueIds;

      for (const issue of currentlyAssigned) {
        if (!newlySelected.has(issue.id)) {
          await this.issueService.updateIssue(issue.id, {
            assignedReleaseId: undefined,
            updatedAt: new Date(),
          });
        }
      }

      for (const issueId of newlySelected) {
        const issue = this.issueService.getIssueById(issueId);
        if (issue && issue.assignedReleaseId !== release.id) {
          await this.issueService.updateIssue(issueId, {
            assignedReleaseId: release.id,
            updatedAt: new Date(),
          });
        }
      }

      this.editingRelease.set(null);
    } catch (error) {
      console.error('Failed to update release:', error);
    }
  }

  protected async deleteRelease(release: Release): Promise<void> {
    if (
      !confirm(
        `Are you sure you want to delete "${release.name}"? All issue assignments will be removed.`,
      )
    ) {
      return;
    }

    try {
      const allIssues = this.issueService.issues();
      const assignedIssues = allIssues.filter(
        (issue) => issue.assignedReleaseId === release.id,
      );

      for (const issue of assignedIssues) {
        await this.issueService.updateIssue(issue.id, {
          assignedReleaseId: undefined,
          updatedAt: new Date(),
        });
      }

      await this.releaseService.deleteRelease(release.id);
    } catch (error) {
      console.error('Failed to delete release:', error);
    }
  }

  protected async unassignIssue(issue: Issue): Promise<void> {
    try {
      await this.issueService.updateIssue(issue.id, {
        assignedReleaseId: undefined,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to unassign issue:', error);
    }
  }
}
