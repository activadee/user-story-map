import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '@app/shared/components/modal/modal';
import { ImportExportService } from '../../services/import-export.service';
import {
  ImportOptions,
  ImportResult,
  DEFAULT_IMPORT_OPTIONS,
} from '../../interfaces/import-export.interface';

@Component({
  selector: 'app-import-export-modal',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './import-export-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportModal {
  private readonly importExportService = inject(ImportExportService);

  readonly closeModal = output<void>();

  // State
  protected readonly isExporting = signal(false);
  protected readonly isImporting = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly importOptions = signal<ImportOptions>({
    ...DEFAULT_IMPORT_OPTIONS,
  });
  protected readonly resultMessage = signal<{
    type: 'success' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  protected onClose(): void {
    this.resetState();
    this.closeModal.emit();
  }

  private resetState(): void {
    this.selectedFile.set(null);
    this.resultMessage.set(null);
    this.importOptions.set({ ...DEFAULT_IMPORT_OPTIONS });
    this.isExporting.set(false);
    this.isImporting.set(false);
  }

  protected async exportData(): Promise<void> {
    this.isExporting.set(true);
    this.resultMessage.set(null);

    try {
      this.importExportService.exportToFile();
      this.resultMessage.set({
        type: 'success',
        message: 'User story map exported successfully!',
      });
    } catch (error) {
      this.resultMessage.set({
        type: 'error',
        message: 'Export failed',
        details: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      });
    } finally {
      this.isExporting.set(false);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile.set(file);
      this.resultMessage.set(null);
    }
  }

  protected async importData(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isImporting.set(true);
    this.resultMessage.set(null);

    try {
      const result: ImportResult =
        await this.importExportService.importFromFile(
          file,
          this.importOptions(),
        );

      if (result.success) {
        const details = [
          `Journeys: ${result.imported.journeys}`,
          `Steps: ${result.imported.steps}`,
          `Issues: ${result.imported.issues}`,
          `Releases: ${result.imported.releases}`,
        ];

        if (result.warnings.length > 0) {
          details.push(`Warnings: ${result.warnings.length}`);
        }

        this.resultMessage.set({
          type: 'success',
          message: 'Import completed successfully!',
          details,
        });

        // Reset file selection after successful import
        this.selectedFile.set(null);
      } else {
        this.resultMessage.set({
          type: 'error',
          message: 'Import failed with errors',
          details: result.errors.map((error) => error.message),
        });
      }
    } catch (error) {
      this.resultMessage.set({
        type: 'error',
        message: 'Import failed',
        details: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      });
    } finally {
      this.isImporting.set(false);
    }
  }

  protected updateImportStrategy(
    strategy: 'replace' | 'merge' | 'append',
  ): void {
    this.importOptions.update((options) => ({ ...options, strategy }));
  }

  protected updateConflictResolution(
    conflictResolution: 'skip' | 'overwrite' | 'rename',
  ): void {
    this.importOptions.update((options) => ({
      ...options,
      conflictResolution,
    }));
  }
}
