import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        font-family:
          'Inter',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          sans-serif;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = 'User Story Map';
}
