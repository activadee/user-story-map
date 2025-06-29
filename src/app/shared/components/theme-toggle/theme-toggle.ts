import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '@app/shared/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      class="btn-secondary p-2 min-h-[40px] min-w-[40px]"
      (click)="toggleTheme()"
      [title]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      type="button"
    >
      @if (isDarkMode()) {
        ☀️
      } @else {
        🌙
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  protected readonly isDarkMode = this.themeService.isDarkMode;

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
