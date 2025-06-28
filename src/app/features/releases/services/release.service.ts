import { Injectable, inject, signal, computed } from '@angular/core';
import { DatabaseService } from '@app/core/services/database.service';
import { Release } from '@app/core/models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseService {
  private readonly db = inject(DatabaseService);
  private readonly _releases = signal<Release[]>([]);
  private readonly _loading = signal(false);

  readonly releases = this._releases.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly sortedReleases = computed(() =>
    this._releases().sort((a, b) => a.name.localeCompare(b.name)),
  );

  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    await this.loadReleases();
  }

  private async loadReleases(): Promise<void> {
    try {
      this._loading.set(true);
      const releases = await this.db.getAll<Release>('releases');
      this._releases.set(releases);
    } catch (error) {
      console.error('Failed to load releases:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createRelease(data: Omit<Release, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const release: Release = {
      ...data,
      id,
    };

    try {
      await this.db.put('releases', release);
      this._releases.update((releases) => [...releases, release]);
      return id;
    } catch (error) {
      console.error('Failed to create release:', error);
      throw error;
    }
  }

  async updateRelease(id: string, data: Partial<Release>): Promise<void> {
    const currentReleases = this._releases();
    const index = currentReleases.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Release with id ${id} not found`);
    }

    const updatedRelease = { ...currentReleases[index], ...data, id };

    try {
      await this.db.put('releases', updatedRelease);
      this._releases.update((releases) =>
        releases.map((r) => (r.id === id ? updatedRelease : r)),
      );
    } catch (error) {
      console.error('Failed to update release:', error);
      throw error;
    }
  }

  async deleteRelease(id: string): Promise<void> {
    try {
      await this.db.delete('releases', id);
      this._releases.update((releases) => releases.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to delete release:', error);
      throw error;
    }
  }

  getReleaseById(id: string): Release | undefined {
    return this._releases().find((r) => r.id === id);
  }
}
