import { JsonPipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../Services/test';
import { AnalysisResponse } from '../../Interfaces/test';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-test-component',
  imports: [JsonPipe, FormsModule, MatSelectModule],
  templateUrl: './test-component.html',
  styleUrls: ['./test-component.css'],
})
export class TestComponent implements OnInit {
  private readonly testService = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly response = signal<AnalysisResponse | null>(null);
  loading = false;

  forceSelectOptions = [
    { value: 'N', viewValue: 'N' },
    { value: 'kN', viewValue: 'kN' },
    { value: 'lbf', viewValue: 'lbf' },
  ];

  lengthSelectOptions = [
    { value: 'm', viewValue: 'm' },
    { value: 'cm', viewValue: 'cm' },
    { value: 'mm', viewValue: 'mm' },
    { value: 'in', viewValue: 'in' },
    { value: 'ft', viewValue: 'ft' },
  ];

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.testService.get<AnalysisResponse>().subscribe({
      next: (response) => {
        this.response.set(response ? structuredClone(response) : null);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch simple supported beam data.', error);
        this.response.set(null);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
