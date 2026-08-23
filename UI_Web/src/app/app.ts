import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TestComponent } from '../Components/test-component/test-component';
import { Sidenav } from '../layout/sidenav/sidenav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidenav],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('streng_app_web');
}
