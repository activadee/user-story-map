import { Injectable, signal } from '@angular/core';
import { Issue, UserStep } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  private readonly _draggedItem = signal<Issue | null>(null);
  private readonly _dropTarget = signal<UserStep | null>(null);
  private readonly _isDragging = signal(false);

  readonly draggedItem = this._draggedItem.asReadonly();
  readonly dropTarget = this._dropTarget.asReadonly();
  readonly isDragging = this._isDragging.asReadonly();

  startDrag(issue: Issue): void {
    this._draggedItem.set(issue);
    this._isDragging.set(true);
  }

  endDrag(): void {
    this._draggedItem.set(null);
    this._dropTarget.set(null);
    this._isDragging.set(false);
  }

  setDropTarget(step: UserStep | null): void {
    this._dropTarget.set(step);
  }

  canDrop(step: UserStep): boolean {
    const draggedItem = this._draggedItem();
    return draggedItem !== null && draggedItem.assignedStepId !== step.id;
  }

  getDraggedItem(): Issue | null {
    return this._draggedItem();
  }
}
