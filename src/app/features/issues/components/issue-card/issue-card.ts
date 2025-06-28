import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
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
  protected readonly isTouchDevice = signal(false);
  protected readonly touchStartPos = signal<{ x: number; y: number } | null>(null);

  protected readonly isDraggedItem = computed(
    () => this.dragDropService.draggedItem()?.id === this.issue().id,
  );

  constructor() {
    // Detect touch device
    this.isTouchDevice.set('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

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

  // Touch events for mobile support
  protected onTouchStart(event: TouchEvent): void {
    if (!this.isTouchDevice()) return;
    
    const touch = event.touches[0];
    this.touchStartPos.set({ x: touch.clientX, y: touch.clientY });
    
    // Prevent scrolling while starting drag
    event.preventDefault();
  }

  protected onTouchMove(event: TouchEvent): void {
    if (!this.isTouchDevice() || !this.touchStartPos()) return;
    
    const touch = event.touches[0];
    const startPos = this.touchStartPos()!;
    const deltaX = Math.abs(touch.clientX - startPos.x);
    const deltaY = Math.abs(touch.clientY - startPos.y);
    
    // Start drag if moved more than 10px
    if (deltaX > 10 || deltaY > 10) {
      if (!this.dragDropService.isDragging()) {
        this.dragDropService.startDrag(this.issue());
      }
      
      // Update drag visual position
      this.updateDragVisual(touch.clientX, touch.clientY);
    }
    
    event.preventDefault();
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (!this.isTouchDevice()) return;
    
    if (this.dragDropService.isDragging()) {
      // Find drop target at touch position
      const touch = event.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropTarget = elementBelow?.closest('[data-drop-target]');
      
      if (dropTarget) {
        // Trigger drop event
        const dropEvent = new CustomEvent('mobile-drop', {
          detail: { issueId: this.issue().id },
          bubbles: true
        });
        dropTarget.dispatchEvent(dropEvent);
      }
      
      this.dragDropService.endDrag();
    }
    
    this.touchStartPos.set(null);
    this.removeDragVisual();
  }

  private updateDragVisual(x: number, y: number): void {
    // Create or update drag visual element
    let dragVisual = document.getElementById('mobile-drag-visual');
    if (!dragVisual) {
      dragVisual = document.createElement('div');
      dragVisual.id = 'mobile-drag-visual';
      dragVisual.className = 'fixed z-50 pointer-events-none bg-white border border-primary-500 rounded-lg p-3 shadow-xl opacity-80 transform -translate-x-1/2 -translate-y-1/2';
      dragVisual.innerHTML = `
        <div class="text-sm font-semibold text-primary-500">#${this.issue().gitlabId}</div>
        <div class="text-xs text-gray-600 truncate max-w-[200px]">${this.issue().title}</div>
      `;
      document.body.appendChild(dragVisual);
    }
    
    dragVisual.style.left = `${x}px`;
    dragVisual.style.top = `${y}px`;
  }

  private removeDragVisual(): void {
    const dragVisual = document.getElementById('mobile-drag-visual');
    if (dragVisual) {
      dragVisual.remove();
    }
  }

  protected viewInGitlab(): void {
    // TODO: In a real app, this would open the GitLab issue URL
  }
}
