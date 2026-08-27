import { Routes } from '@angular/router';
import { ProjectComponent } from '../Components/project-component/project-component';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'projects', component: ProjectComponent },
];
