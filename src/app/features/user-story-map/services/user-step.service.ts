import { Injectable, inject, signal, computed } from '@angular/core';
import { DatabaseService } from '@app/core/services/database.service';
import { UserStep } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class UserStepService {
  private readonly db = inject(DatabaseService);
  private readonly _steps = signal<UserStep[]>([]);
  private readonly _loading = signal(false);

  readonly steps = this._steps.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly stepsByJourney = computed(() => {
    const steps = this._steps();
    const grouped = steps.reduce(
      (acc, step) => {
        if (!acc[step.journeyId]) {
          acc[step.journeyId] = [];
        }
        acc[step.journeyId].push(step);
        return acc;
      },
      {} as Record<string, UserStep[]>,
    );

    Object.keys(grouped).forEach((journeyId) => {
      grouped[journeyId].sort((a, b) => a.order - b.order);
    });

    return grouped;
  });

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    this.loadSteps();
  }

  private async loadSteps(): Promise<void> {
    try {
      this._loading.set(true);
      const steps = await this.db.getAll<UserStep>('userSteps');
      this._steps.set(steps);
    } catch (error) {
      console.error('Failed to load steps:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createStep(data: Omit<UserStep, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const step: UserStep = {
      ...data,
      id,
      assignedIssues: data.assignedIssues || [],
    };

    try {
      await this.db.put('userSteps', step);
      this._steps.update((steps) => [...steps, step]);
      return id;
    } catch (error) {
      console.error('Failed to create step:', error);
      throw error;
    }
  }

  async updateStep(id: string, data: Partial<UserStep>): Promise<void> {
    const currentSteps = this._steps();
    const index = currentSteps.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Step with id ${id} not found`);
    }

    const updatedStep = { ...currentSteps[index], ...data, id };

    try {
      await this.db.put('userSteps', updatedStep);
      this._steps.update((steps) =>
        steps.map((s) => (s.id === id ? updatedStep : s)),
      );
    } catch (error) {
      console.error('Failed to update step:', error);
      throw error;
    }
  }

  async deleteStep(id: string): Promise<void> {
    try {
      await this.db.delete('userSteps', id);
      this._steps.update((steps) => steps.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete step:', error);
      throw error;
    }
  }

  async deleteStepsByJourney(journeyId: string): Promise<void> {
    const stepsToDelete = this._steps().filter(
      (s) => s.journeyId === journeyId,
    );

    try {
      await Promise.all(
        stepsToDelete.map((step) => this.db.delete('userSteps', step.id)),
      );
      this._steps.update((steps) =>
        steps.filter((s) => s.journeyId !== journeyId),
      );
    } catch (error) {
      console.error('Failed to delete steps for journey:', error);
      throw error;
    }
  }

  async reorderSteps(journeyId: string, stepIds: string[]): Promise<void> {
    const currentSteps = this._steps();
    const journeySteps = currentSteps.filter((s) => s.journeyId === journeyId);

    const reorderedSteps = stepIds.map((id, index) => {
      const step = journeySteps.find((s) => s.id === id);
      if (!step) throw new Error(`Step with id ${id} not found`);
      return { ...step, order: index };
    });

    try {
      await Promise.all(
        reorderedSteps.map((step) => this.db.put('userSteps', step)),
      );

      this._steps.update((steps) =>
        steps.map((step) => {
          const reordered = reorderedSteps.find((rs) => rs.id === step.id);
          return reordered || step;
        }),
      );
    } catch (error) {
      console.error('Failed to reorder steps:', error);
      throw error;
    }
  }

  getStepById(id: string): UserStep | undefined {
    return this._steps().find((s) => s.id === id);
  }

  getStepsByJourney(journeyId: string): UserStep[] {
    return this.stepsByJourney()[journeyId] || [];
  }

  async assignIssueToStep(stepId: string, issueId: string): Promise<void> {
    const step = this.getStepById(stepId);
    if (!step) throw new Error(`Step with id ${stepId} not found`);

    const updatedIssues = [...step.assignedIssues];
    if (!updatedIssues.includes(issueId)) {
      updatedIssues.push(issueId);
      await this.updateStep(stepId, { assignedIssues: updatedIssues });
    }
  }

  async removeIssueFromStep(stepId: string, issueId: string): Promise<void> {
    const step = this.getStepById(stepId);
    if (!step) throw new Error(`Step with id ${stepId} not found`);

    const updatedIssues = step.assignedIssues.filter((id) => id !== issueId);
    await this.updateStep(stepId, { assignedIssues: updatedIssues });
  }
}
