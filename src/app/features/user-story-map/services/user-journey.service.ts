import { Injectable, inject, signal, computed } from '@angular/core';
import { DatabaseService } from '@app/core/services/database.service';
import { UserJourney } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class UserJourneyService {
  private readonly db = inject(DatabaseService);
  private readonly _journeys = signal<UserJourney[]>([]);
  private readonly _loading = signal(false);

  readonly journeys = this._journeys.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly sortedJourneys = computed(() =>
    this._journeys().sort((a, b) => a.order - b.order),
  );

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    this.loadJourneys();
  }

  private async loadJourneys(): Promise<void> {
    try {
      this._loading.set(true);
      const journeys = await this.db.getAll<UserJourney>('userJourneys');
      this._journeys.set(journeys);
    } catch (error) {
      console.error('Failed to load journeys:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createJourney(data: Omit<UserJourney, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const journey: UserJourney = {
      ...data,
      id,
    };

    try {
      await this.db.put('userJourneys', journey);
      this._journeys.update((journeys) => [...journeys, journey]);
      return id;
    } catch (error) {
      console.error('Failed to create journey:', error);
      throw error;
    }
  }

  async updateJourney(id: string, data: Partial<UserJourney>): Promise<void> {
    const currentJourneys = this._journeys();
    const index = currentJourneys.findIndex((j) => j.id === id);

    if (index === -1) {
      throw new Error(`Journey with id ${id} not found`);
    }

    const updatedJourney = { ...currentJourneys[index], ...data, id };

    try {
      await this.db.put('userJourneys', updatedJourney);
      this._journeys.update((journeys) =>
        journeys.map((j) => (j.id === id ? updatedJourney : j)),
      );
    } catch (error) {
      console.error('Failed to update journey:', error);
      throw error;
    }
  }

  async deleteJourney(id: string): Promise<void> {
    try {
      await this.db.delete('userJourneys', id);
      this._journeys.update((journeys) => journeys.filter((j) => j.id !== id));
    } catch (error) {
      console.error('Failed to delete journey:', error);
      throw error;
    }
  }

  async reorderJourneys(journeyIds: string[]): Promise<void> {
    const currentJourneys = this._journeys();
    const reorderedJourneys = journeyIds.map((id, index) => {
      const journey = currentJourneys.find((j) => j.id === id);
      if (!journey) throw new Error(`Journey with id ${id} not found`);
      return { ...journey, order: index };
    });

    try {
      await Promise.all(
        reorderedJourneys.map((journey) =>
          this.db.put('userJourneys', journey),
        ),
      );
      this._journeys.set(reorderedJourneys);
    } catch (error) {
      console.error('Failed to reorder journeys:', error);
      throw error;
    }
  }

  getJourneyById(id: string): UserJourney | undefined {
    return this._journeys().find((j) => j.id === id);
  }
}
