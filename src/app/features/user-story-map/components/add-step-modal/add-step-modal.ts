import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';

@Component({
  selector: 'app-add-step-modal',
  imports: [Modal, FormsModule],
  templateUrl: './add-step-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStepModal {
  readonly journeyId = input.required<string>();

  readonly submitStep = output<{
    title: string;
    description: string;
    journeyId: string;
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
      this.submitStep.emit({
        title: data.title.trim(),
        description: data.description.trim(),
        journeyId: this.journeyId(),
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
