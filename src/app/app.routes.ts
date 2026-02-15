import { Routes } from '@angular/router';

export const routes: Routes = [
  {
	path: '',
	loadChildren: () =>
  	import('./features/landing/landing.routes').then(m => m.LANDING_ROUTES),
  },
  {
	path: 'test',
	loadChildren: () =>
  	import('./features/test/test.routes').then(m => m.TEST_ROUTES),
  },
{
  path: 'results',
  loadComponent: () =>
    import('./features/results/results.component')
      .then(m => m.ResultsComponent),
},
  {
	path: '**',
	redirectTo: '',
  },
];


