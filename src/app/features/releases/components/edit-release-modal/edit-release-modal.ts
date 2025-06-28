import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';
import { IssueService } from '@app/features/issues/services/issue.service';
import { Release } from '@app/core/models';

@Component({
  selector: 'app-edit-release-modal',
  imports: [Modal, FormsModule],
  templateUrl: './edit-release-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditReleaseModal {
  private readonly issueService = inject(IssueService);

  readonly release = input<Release | null>(null);
  readonly submitRelease = output<{
    name: string;
    description: string;
    selectedIssueIds: Set<string>;
  }>();
  readonly cancelModal = output<void>();

  protected readonly formData = signal({
    name: '',
    description: '',
    selectedIssueIds: new Set<string>(),
  });

  protected readonly allAssignedIssues = computed(() => {
    const currentReleaseId = this.release()?.id;
    return this.issueService
      .issues()
      .filter(
        (issue) =>
          issue.assignedStepId &&
          (!issue.assignedReleaseId ||
            issue.assignedReleaseId === currentReleaseId),
      );
  });

  protected readonly isFormValid = computed(() => {
    const data = this.formData();
    return data.name.trim().length > 0;
  });

  constructor() {
    effect(() => {
      const releaseToEdit = this.release();
      if (releaseToEdit) {
        const assignedIssues = this.issueService
          .issues()
          .filter((issue) => issue.assignedReleaseId === releaseToEdit.id);

        this.formData.set({
          name: releaseToEdit.name,
          description: releaseToEdit.description || '',
          selectedIssueIds: new Set(assignedIssues.map((issue) => issue.id)),
        });
      }
    });
  }

  protected updateName(name: string): void {
    this.formData.update((current) => ({ ...current, name }));
  }

  protected updateDescription(description: string): void {
    this.formData.update((current) => ({ ...current, description }));
  }

  protected toggleIssueSelection(issueId: string): void {
    const data = this.formData();
    const newSet = new Set(data.selectedIssueIds);
    if (newSet.has(issueId)) {
      newSet.delete(issueId);
    } else {
      newSet.add(issueId);
    }
    this.formData.update((current) => ({
      ...current,
      selectedIssueIds: newSet,
    }));
  }

  protected isIssueSelected(issueId: string): boolean {
    return this.formData().selectedIssueIds.has(issueId);
  }

  protected onSubmit(): void {
    const data = this.formData();
    if (data.name.trim().length > 0) {
      this.submitRelease.emit({
        name: data.name.trim(),
        description: data.description.trim(),
        selectedIssueIds: data.selectedIssueIds,
      });
    }
  }

  protected onCancel(): void {
    this.cancelModal.emit();
  }
}
