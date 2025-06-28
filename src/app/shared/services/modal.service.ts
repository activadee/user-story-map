import { Injectable, signal, computed } from '@angular/core';

export interface ModalConfig {
  id: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private readonly modals = signal<ModalConfig[]>([]);

  readonly openModals = computed(() => this.modals());
  readonly hasOpenModals = computed(() => this.modals().length > 0);

  open(config: ModalConfig): void {
    const existingIndex = this.modals().findIndex((m) => m.id === config.id);
    if (existingIndex === -1) {
      this.modals.update((modals) => [
        ...modals,
        { closable: true, size: 'md', ...config },
      ]);
    }
  }

  close(id: string): void {
    this.modals.update((modals) => modals.filter((m) => m.id !== id));
  }

  closeAll(): void {
    this.modals.set([]);
  }

  isOpen(id: string): boolean {
    return this.modals().some((m) => m.id === id);
  }

  getModal(id: string): ModalConfig | undefined {
    return this.modals().find((m) => m.id === id);
  }
}
