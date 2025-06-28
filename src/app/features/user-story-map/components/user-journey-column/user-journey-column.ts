import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { UserJourney, UserStep } from '@app/core/models';
import { UserStepCard } from '../user-step-card/user-step-card';
import { AddStepModal } from '../add-step-modal/add-step-modal';
import { EditJourneyModal } from '../edit-journey-modal/edit-journey-modal';

@Component({
  selector: 'app-user-journey-column',
  imports: [UserStepCard, AddStepModal, EditJourneyModal],
  templateUrl: './user-journey-column.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserJourneyColumn {
  readonly journey = input.required<UserJourney>();
  readonly steps = input.required<UserStep[]>();
  readonly loading = input<boolean>(false);

  readonly updateJourney = output<{ id: string; data: Partial<UserJourney> }>();
  readonly deleteJourney = output<{ id: string }>();
  readonly createStep = output<Omit<UserStep, 'id'>>();
  readonly updateStep = output<{ id: string; data: Partial<UserStep> }>();
  readonly deleteStep = output<{ id: string }>();
  readonly reorderSteps = output<{ journeyId: string; stepIds: string[] }>();

  protected readonly sortedSteps = computed(() =>
    this.steps().sort((a, b) => a.order - b.order),
  );

  protected readonly showAddStep = signal(false);
  protected readonly showEditJourney = signal(false);
  protected readonly editingJourney = signal<UserJourney | null>(null);

  protected editJourney(): void {
    this.editingJourney.set(this.journey());
    this.showEditJourney.set(true);
  }

  protected cancelEditJourney(): void {
    this.showEditJourney.set(false);
    this.editingJourney.set(null);
  }

  protected submitEditJourney(data: {
    title: string;
    description: string;
  }): void {
    this.updateJourney.emit({
      id: this.journey().id,
      data: {
        title: data.title,
        description: data.description || undefined,
      },
    });

    this.showEditJourney.set(false);
    this.editingJourney.set(null);
  }

  protected onDeleteJourney(): void {
    const journey = this.journey();
    if (
      confirm(
        `Are you sure you want to delete "${journey.title}" and all its steps?`,
      )
    ) {
      this.deleteJourney.emit({ id: journey.id });
    }
  }

  protected showAddStepDialog(): void {
    this.showAddStep.set(true);
  }

  protected cancelAddStep(): void {
    this.showAddStep.set(false);
  }

  protected submitAddStep(data: {
    title: string;
    description: string;
    journeyId: string;
  }): void {
    const maxOrder = Math.max(...this.steps().map((s) => s.order), -1);

    this.createStep.emit({
      title: data.title,
      description: data.description || undefined,
      journeyId: data.journeyId,
      order: maxOrder + 1,
      assignedIssues: [],
    });

    this.showAddStep.set(false);
  }

  protected onUpdateStep(event: { id: string; data: Partial<UserStep> }): void {
    this.updateStep.emit(event);
  }

  protected onDeleteStep(event: { id: string }): void {
    this.deleteStep.emit(event);
  }
}
