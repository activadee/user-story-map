import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';
import { IssueService } from '@app/features/issues/services/issue.service';

@Component({
  selector: 'app-create-release-modal',
  imports: [Modal, FormsModule],
  templateUrl: './create-release-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateReleaseModal {
  private readonly issueService = inject(IssueService);

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

  protected readonly availableIssues = computed(() =>
    this.issueService
      .issues()
      .filter((issue) => issue.assignedStepId && !issue.assignedReleaseId),
  );

  protected readonly isFormValid = computed(() => {
    const data = this.formData();
    return data.name.trim().length > 0;
  });

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
    this.formData.set({
      name: '',
      description: '',
      selectedIssueIds: new Set<string>(),
    });
    this.cancelModal.emit();
  }

  reset(): void {
    this.formData.set({
      name: '',
      description: '',
      selectedIssueIds: new Set<string>(),
    });
  }
}
