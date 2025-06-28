import {
  ChangeDetectionStrategy,
  Component,
  computed,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';

@Component({
  selector: 'app-create-journey-modal',
  imports: [Modal, FormsModule],
  templateUrl: './create-journey-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateJourneyModal {
  readonly submitJourney = output<{
    title: string;
    description: string;
  }>();
  readonly cancelModal = output<void>();

  protected readonly formData = signal({
    title: '',
    description: '',
  });

  protected readonly isFormValid = computed(() => {
    const data = this.formData();
    return data.title.trim().length > 0;
  });

  protected updateTitle(title: string): void {
    this.formData.update((current) => ({ ...current, title }));
  }

  protected updateDescription(description: string): void {
    this.formData.update((current) => ({ ...current, description }));
  }

  protected onSubmit(): void {
    const data = this.formData();
    if (data.title.trim().length > 0) {
      this.submitJourney.emit({
        title: data.title.trim(),
        description: data.description.trim(),
      });
    }
  }

  protected onCancel(): void {
    this.formData.set({
      title: '',
      description: '',
    });
    this.cancelModal.emit();
  }

  reset(): void {
    this.formData.set({
      title: '',
      description: '',
    });
  }
}
