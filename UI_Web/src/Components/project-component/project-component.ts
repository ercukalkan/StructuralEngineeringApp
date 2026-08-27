import { CommonModule } from '@angular/common';
import { TestService } from '../../Services/test';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisRequest, AnalysisResponse } from '../../Interfaces/test';

interface BeamFormValues {
  length: number;
  elements: number;
  uniformLoad: number;
}

@Component({
  selector: 'app-project-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-component.html',
  styleUrl: './project-component.css',
})
export class ProjectComponent {
  private readonly test = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';
  result: any = null;

  form: BeamFormValues = {
    length: 8,
    elements: 20,
    uniformLoad: -20,
  };

  get analysisRequest(): AnalysisRequest {
    return {
      length: Number(this.form.length),
      elements: Number(this.form.elements),
      uniformLoad: Number(this.form.uniformLoad),
    };
  }

  runCalculation(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.test.post<AnalysisResponse>({ ...this.analysisRequest }).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage =
          'The calculation service could not be reached. Please verify the server is running.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
