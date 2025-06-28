import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { UserJourneyService } from '../../services/user-journey.service';
import { UserStepService } from '../../services/user-step.service';
import { IssueService } from '@app/features/issues/services/issue.service';
import { UserJourney, UserStep } from '@app/core/models';
import { UserJourneyColumn } from '../user-journey-column/user-journey-column';
import { EmptyState } from '@app/shared/components/empty-state/empty-state';
import { UserStoryMapHeader } from '../user-story-map-header/user-story-map-header';
import { IssueList } from '@app/features/issues/components/issue-list/issue-list';
import { CreateJourneyModal } from '../create-journey-modal/create-journey-modal';
import { ImportExportModal } from '@app/features/import-export/components/import-export-modal/import-export-modal';
import { ModalService } from '@app/shared/services/modal.service';

@Component({
  selector: 'app-user-story-map',
  imports: [
    UserJourneyColumn,
    EmptyState,
    UserStoryMapHeader,
    IssueList,
    CreateJourneyModal,
    ImportExportModal,
  ],
  templateUrl: './user-story-map.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStoryMap {
  protected readonly journeyService = inject(UserJourneyService);
  protected readonly stepService = inject(UserStepService);
  protected readonly issueService = inject(IssueService);
  protected readonly modalService = inject(ModalService);

  protected readonly stepsByJourney = this.stepService.stepsByJourney;
  protected readonly showCreateDialog = signal(false);

  protected showCreateJourneyDialog(): void {
    this.showCreateDialog.set(true);
  }

  protected cancelCreate(): void {
    this.showCreateDialog.set(false);
  }

  protected async submitCreate(data: {
    title: string;
    description: string;
  }): Promise<void> {
    try {
      const maxOrder = Math.max(
        ...this.journeyService.journeys().map((j) => j.order),
        -1,
      );

      await this.journeyService.createJourney({
        title: data.title,
        description: data.description || undefined,
        order: maxOrder + 1,
        userSteps: [],
      });

      this.showCreateDialog.set(false);
    } catch (error) {
      console.error('Failed to create journey:', error);
    }
  }

  protected async onCreateJourney(): Promise<void> {
    this.showCreateJourneyDialog();
  }

  protected async onUpdateJourney(event: {
    id: string;
    data: Partial<UserJourney>;
  }): Promise<void> {
    try {
      await this.journeyService.updateJourney(event.id, event.data);
    } catch (error) {
      console.error('Failed to update journey:', error);
    }
  }

  protected async onDeleteJourney(event: { id: string }): Promise<void> {
    try {
      const steps = this.stepsByJourney()[event.id] || [];
      for (const step of steps) {
        const assignedIssues = this.issueService.getIssuesByStep(step.id);
        for (const issue of assignedIssues) {
          await this.issueService.unassignIssue(issue.id);
        }
      }

      await this.stepService.deleteStepsByJourney(event.id);
      await this.journeyService.deleteJourney(event.id);
    } catch (error) {
      console.error('Failed to delete journey:', error);
    }
  }

  protected async onCreateStep(data: Omit<UserStep, 'id'>): Promise<void> {
    try {
      await this.stepService.createStep(data);
    } catch (error) {
      console.error('Failed to create step:', error);
    }
  }

  protected async onUpdateStep(event: {
    id: string;
    data: Partial<UserStep>;
  }): Promise<void> {
    try {
      await this.stepService.updateStep(event.id, event.data);
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  }

  protected async onDeleteStep(event: { id: string }): Promise<void> {
    try {
      const assignedIssues = this.issueService.getIssuesByStep(event.id);
      for (const issue of assignedIssues) {
        await this.issueService.updateIssue(issue.id, {
          assignedStepId: undefined,
          assignedReleaseId: undefined,
          updatedAt: new Date(),
        });
      }

      await this.stepService.deleteStep(event.id);
    } catch (error) {
      console.error('Failed to delete step:', error);
    }
  }

  protected async onReorderSteps(event: {
    journeyId: string;
    stepIds: string[];
  }): Promise<void> {
    try {
      await this.stepService.reorderSteps(event.journeyId, event.stepIds);
    } catch (error) {
      console.error('Failed to reorder steps:', error);
    }
  }

  protected onImportData(): void {
    this.modalService.open({
      id: 'import-export',
      title: 'Import/Export User Story Map',
      size: 'lg',
    });
  }

  protected onExportData(): void {
    this.modalService.open({
      id: 'import-export',
      title: 'Import/Export User Story Map',
      size: 'lg',
    });
  }
}
