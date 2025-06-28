import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="py-4 border-b border-gray-200 sm:py-6">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800 m-0 sm:text-3xl">
            {{ title() }}
          </h1>
          @if (subtitle()) {
            <p class="text-gray-600 text-sm m-0 sm:text-base">
              {{ subtitle() }}
            </p>
          }
        </div>
        @if (hasActions) {
          <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <ng-content />
          </div>
        }
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();

  protected readonly hasActions = true;
}
