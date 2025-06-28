import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { UserStep } from '@app/core/models';
import { DragDropService } from '@app/shared/services/drag-drop.service';
import { IssueService } from '@app/features/issues/services/issue.service';

@Component({
  selector: 'app-user-step-card',
  imports: [],
  templateUrl: './user-step-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStepCard {
  readonly step = input.required<UserStep>();

  readonly updateStep = output<{ id: string; data: Partial<UserStep> }>();
  readonly deleteStep = output<{ id: string }>();

  protected readonly dragDropService = inject(DragDropService);
  protected readonly issueService = inject(IssueService);

  protected readonly assignedIssues = computed(() =>
    this.issueService.getIssuesByStep(this.step().id),
  );

  protected readonly hasAssignedIssues = computed(
    () => this.assignedIssues().length > 0,
  );

  protected readonly isDragOver = computed(
    () => this.dragDropService.dropTarget()?.id === this.step().id,
  );

  protected readonly canDrop = computed(() =>
    this.dragDropService.canDrop(this.step()),
  );

  protected editStep(): void {
    // TODO: Implement edit functionality
  }

  protected onDeleteStep(): void {
    if (confirm(`Are you sure you want to delete "${this.step().title}"?`)) {
      this.deleteStep.emit({ id: this.step().id });
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (this.canDrop()) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';
      this.dragDropService.setDropTarget(this.step());
    }
  }

  protected onDragLeave(): void {
    this.dragDropService.setDropTarget(null);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();

    const draggedItem = this.dragDropService.getDraggedItem();
    if (draggedItem && this.canDrop()) {
      try {
        await this.issueService.assignIssueToStep(
          draggedItem.id,
          this.step().id,
        );
        this.dragDropService.endDrag();
      } catch (error) {
        console.error('Failed to assign issue:', error);
        this.dragDropService.endDrag();
      }
    } else {
      this.dragDropService.endDrag();
    }

    this.dragDropService.setDropTarget(null);
  }

  protected async onMobileDrop(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const issueId = customEvent.detail.issueId;
    if (issueId && this.canDrop()) {
      try {
        await this.issueService.assignIssueToStep(issueId, this.step().id);
        this.dragDropService.endDrag();
      } catch (error) {
        console.error('Failed to assign issue:', error);
        this.dragDropService.endDrag();
      }
    }
    this.dragDropService.setDropTarget(null);
  }

  protected async onUnassignIssue(issueId: string): Promise<void> {
    try {
      await this.issueService.unassignIssue(issueId);
    } catch (error) {
      console.error('Failed to unassign issue:', error);
    }
  }
}
