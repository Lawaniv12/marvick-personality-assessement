import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { QuestionsComponent } from './questions/questions.component';
import { ReviewComponent } from './review/review.component';

export const TEST_ROUTES: Routes = [
  // { path: '', component: WelcomeComponent },
  { path: '', component: QuestionsComponent },
  { path: 'review', component: ReviewComponent },
];
