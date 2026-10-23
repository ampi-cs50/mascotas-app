import { Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { CheckInComponent } from './views/check-in/check-in.component';
import { ToxicityComponent } from './views/toxicity/toxicity.component';
import { PainAssessmentComponent } from './views/pain-assessment/pain-assessment.component';
import { InsightsComponent } from './views/insights/insights.component';
import { VaccinesComponent } from './views/vaccines/vaccines.component';
import { AuthComponent } from './views/auth/auth.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: AuthComponent, title: 'Acceso - Cuidado Preventivo' },
  { path: 'auth', component: AuthComponent, title: 'Acceso - Cuidado Preventivo' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'Inicio - Cuidado Preventivo' },
  { path: 'check-in', component: CheckInComponent, canActivate: [authGuard], title: 'Check-in Diario' },
  { path: 'vaccines', component: VaccinesComponent, canActivate: [authGuard], title: 'Cartilla de Vacunación' },
  { path: 'toxicity', component: ToxicityComponent, canActivate: [authGuard], title: 'Buscador de Toxicidad' },
  { path: 'pain-assessment', component: PainAssessmentComponent, canActivate: [authGuard], title: 'Evaluador de Dolor Facial' },
  { path: 'insights', component: InsightsComponent, canActivate: [authGuard], title: 'Tendencias e Informes' },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
