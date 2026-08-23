import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sidenav',
  imports: [CommonModule],
  templateUrl: './sidenav.html',
  styleUrls: ['./sidenav.css'],
})
export class Sidenav {
  isDarkTheme = false;

  navItems = [
    { label: 'Dashboard', icon: '⌂', active: true, href: '/dashboard' },
    { label: 'Projects', icon: '▣', active: false, href: '/projects' },
    { label: 'Calculations', icon: '◫', active: false, href: '/calculations' },
    { label: 'Reports', icon: '◌', active: false, href: '/reports' },
  ];

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark', this.isDarkTheme);
  }
}
