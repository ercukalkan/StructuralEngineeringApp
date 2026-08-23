import { Routes } from '@angular/router';
import { TestComponent } from '../Components/test-component/test-component';

export const routes: Routes = [{ path: 'dashboard', pathMatch: 'full', component: TestComponent }];
