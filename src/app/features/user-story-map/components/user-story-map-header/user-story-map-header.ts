import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-user-story-map-header',
  imports: [PageHeader],
  template: `
    <app-page-header
      title="User Story Map"
      subtitle="Organize your user journeys and steps"
    >
      <button
        class="btn btn-secondary"
        (click)="importData.emit()"
        [disabled]="loading()"
      >
        📁 Import
      </button>
      <button
        class="btn btn-secondary"
        (click)="exportData.emit()"
        [disabled]="loading()"
      >
        📤 Export
      </button>
      <button
        class="btn btn-primary"
        (click)="createJourney.emit()"
        [disabled]="loading()"
      >
        + Add Journey
      </button>
    </app-page-header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStoryMapHeader {
  readonly loading = input<boolean>(false);

  readonly createJourney = output<void>();
  readonly importData = output<void>();
  readonly exportData = output<void>();
}
