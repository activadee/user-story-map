import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  template: `
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
      (click)="onBackdropClick()"
      (keydown.escape)="onEscape()"
      tabindex="0"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId()"
    >
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
      <div
        [class]="modalClasses()"
        (click)="$event.stopPropagation()"
        role="document"
      >
        <header class="flex justify-between items-center mb-4 sm:mb-6">
          <h3
            [id]="titleId()"
            class="text-lg font-semibold text-gray-800 m-0 sm:text-2xl"
          >
            {{ title() }}
          </h3>
          @if (closable()) {
            <button
              class="bg-transparent border-0 p-2 text-gray-500 hover:text-gray-700 rounded-sm transition-colors duration-200"
              (click)="closeModal.emit()"
              type="button"
              aria-label="Close modal"
            >
              ✕
            </button>
          }
        </header>

        <div class="modal-content">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  private readonly modalService = inject(ModalService);

  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closable = input<boolean>(true);

  readonly closeModal = output<void>();

  readonly titleId = computed(() => `modal-title-${this.id()}`);

  readonly modalClasses = computed(() => {
    const baseClasses =
      'bg-white rounded-lg p-4 shadow-lg max-h-[90vh] overflow-y-auto sm:p-6';
    const sizeClasses = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md sm:max-w-lg',
      lg: 'w-full max-w-lg sm:max-w-2xl',
    };
    return `${baseClasses} ${sizeClasses[this.size()]}`;
  });

  onBackdropClick(): void {
    if (this.closable()) {
      this.closeModal.emit();
    }
  }

  onEscape(): void {
    if (this.closable()) {
      this.closeModal.emit();
    }
  }
}
