import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sidenav',
  imports: [CommonModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.css',
})
export class Sidenav {
  navItems = [
    { label: 'Dashboard', icon: '⌂', active: true },
    { label: 'Projects', icon: '▣', active: false },
    { label: 'Calculations', icon: '◫', active: false },
    { label: 'Reports', icon: '◌', active: false },
  ];
}
