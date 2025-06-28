import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { DatabaseService } from '@app/core/services/database.service';

import { routes } from './app.routes';

function initializeDatabase() {
  const db = inject(DatabaseService);
  return (): Promise<void> => db.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDatabase,
      multi: true,
    },
  ],
};
