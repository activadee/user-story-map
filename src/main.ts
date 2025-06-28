import { bootstrapApplication } from '@angular/platform-browser';
import 'drag-drop-touch';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
