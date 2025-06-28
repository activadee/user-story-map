import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';
import { UserJourney } from '@app/core/models';

@Component({
  selector: 'app-edit-journey-modal',
  imports: [Modal, FormsModule],
  templateUrl: './edit-journey-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditJourneyModal {
  readonly journey = input<UserJourney | null>(null);

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

  constructor() {
    effect(() => {
      const journeyToEdit = this.journey();
      if (journeyToEdit) {
        this.formData.set({
          title: journeyToEdit.title,
          description: journeyToEdit.description || '',
        });
      }
    });
  }

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
    this.cancelModal.emit();
  }
}
