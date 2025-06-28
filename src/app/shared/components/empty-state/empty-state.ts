import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  template: `
    <div
      class="flex flex-col items-center gap-2 text-gray-500 py-8 px-4 text-center sm:py-12 sm:px-8"
    >
      <div class="text-3xl mb-3 opacity-50 sm:text-4xl sm:mb-4">📋</div>
      <h3 class="text-lg font-semibold text-gray-600 m-0 mb-2 sm:text-2xl">
        {{ title() }}
      </h3>
      <p
        class="text-sm max-w-[300px] leading-relaxed m-0 mb-6 sm:text-base sm:max-w-[400px] sm:mb-8"
      >
        {{ message() }}
      </p>
      <button class="btn btn-primary" (click)="createAction.emit()">
        {{ actionText() }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionText = input.required<string>();

  readonly createAction = output<void>();
}
