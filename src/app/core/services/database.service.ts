import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private readonly dbName = 'UserStoryMapDB';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly isReady = new BehaviorSubject<boolean>(false);

  readonly isReady$ = this.isReady.asObservable();

  async initialize(): Promise<void> {
    return this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (): void => reject(request.error);
      request.onsuccess = (): void => {
        this.db = request.result;
        this.isReady.next(true);
        resolve();
      };

      request.onupgradeneeded = (event): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('userJourneys')) {
          db.createObjectStore('userJourneys', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('userSteps')) {
          const stepStore = db.createObjectStore('userSteps', {
            keyPath: 'id',
          });
          stepStore.createIndex('journeyId', 'journeyId', { unique: false });
        }

        if (!db.objectStoreNames.contains('issues')) {
          const issueStore = db.createObjectStore('issues', { keyPath: 'id' });
          issueStore.createIndex('assignedStepId', 'assignedStepId', {
            unique: false,
          });
          issueStore.createIndex('assignedReleaseId', 'assignedReleaseId', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('releases')) {
          db.createObjectStore('releases', { keyPath: 'id' });
        }
      };
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = (): void => resolve();
      request.onerror = (): void => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string,
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = (): void => resolve(request.result);
      request.onerror = (): void => reject(request.error);
    });
  }
}
