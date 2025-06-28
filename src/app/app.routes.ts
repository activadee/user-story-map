import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/user-story-map/components/user-story-map/user-story-map'
      ).then((m) => m.UserStoryMap),
  },
  {
    path: 'releases',
    loadComponent: () =>
      import('./features/releases/components/releases/releases').then(
        (m) => m.Releases,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
