import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Issue } from '@app/core/models';
import { DragDropService } from '@app/shared/services/drag-drop.service';

@Component({
  selector: 'app-issue-card',
  imports: [DatePipe],
  templateUrl: './issue-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueCard {
  readonly issue = input.required<Issue>();

  protected readonly dragDropService = inject(DragDropService);

  protected readonly isDraggedItem = computed(
    () => this.dragDropService.draggedItem()?.id === this.issue().id,
  );

  protected onDragStart(event: DragEvent): void {
    this.dragDropService.startDrag(this.issue());
    event.dataTransfer?.setData('text/plain', this.issue().id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDragEnd(): void {
    this.dragDropService.endDrag();
  }

  protected viewInGitlab(): void {
    // TODO: In a real app, this would open the GitLab issue URL
  }
}
