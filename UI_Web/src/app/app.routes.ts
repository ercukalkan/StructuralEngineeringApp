import { Routes } from '@angular/router';
import { ProjectComponent } from '../Components/project-component/project-component';
import { TestComponent } from '../Components/test-component/test-component';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'dashboard', component: TestComponent },
  { path: 'projects', component: ProjectComponent },
];
