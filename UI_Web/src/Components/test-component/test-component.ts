import { JsonPipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { TestService } from '../../Services/test';
import { AnalysisResponse } from '../../Interfaces/test';

@Component({
  selector: 'app-test-component',
  imports: [JsonPipe],
  templateUrl: './test-component.html',
  styleUrls: ['./test-component.css'],
})
export class TestComponent implements OnInit {
  private readonly testService = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  response: AnalysisResponse | null = null;

  ngOnInit() {
    this.testService.get<AnalysisResponse>().subscribe({
      next: (response) => {
        this.response = response ?? null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch simple supported beam data.', error);
        this.response = null;
      },
    });
  }
}
