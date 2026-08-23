import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { TestService } from '../../Services/test';

@Component({
  selector: 'app-test-component',
  imports: [],
  templateUrl: './test-component.html',
  styleUrls: ['./test-component.css'],
})
export class TestComponent implements OnInit {
  private readonly testService = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  data: any | null = null;

  ngOnInit() {
    this.testService.get().subscribe({
      next: (response) => {
        this.data = response?.result ?? null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch simple supported beam data.', error);
        this.data = null;
      },
    });
  }
}
