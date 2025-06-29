import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _isDarkMode = signal(false);

  readonly isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;

    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this._isDarkMode.set(isDark);

    // Apply theme effect
    effect(() => {
      const isDark = this._isDarkMode();
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  toggleTheme(): void {
    this._isDarkMode.update((current) => !current);
  }

  setDarkMode(isDark: boolean): void {
    this._isDarkMode.set(isDark);
  }
}
