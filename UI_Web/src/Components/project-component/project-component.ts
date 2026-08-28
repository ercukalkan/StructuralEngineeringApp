import { CommonModule } from '@angular/common';
import { TestService } from '../../Services/test';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisRequest, AnalysisResponse, SupportReactionEntry } from '../../Interfaces/test';

interface BeamSupport {
  location: number;
  degreesOfFreedom: {
    N: boolean;
    V: boolean;
    M: boolean;
  };
}

interface BeamPointLoad {
  magnitude: number;
  location: number;
}

interface BeamFormValues {
  length: number;
  elements: number;
  uniformLoad: number;
  pointLoads: BeamPointLoad[];
  supports: BeamSupport[];
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
  result: AnalysisResponse | null = null;

  form: BeamFormValues = {
    length: 8,
    elements: 20,
    uniformLoad: -20,
    pointLoads: [],
    supports: [
      { location: 0, degreesOfFreedom: { N: true, V: true, M: false } },
      { location: 8, degreesOfFreedom: { N: false, V: true, M: false } },
    ],
  };

  addSupport(): void {
    this.form.supports = [
      ...this.form.supports,
      {
        location: Number(this.form.length) / 2,
        degreesOfFreedom: { N: false, V: true, M: false },
      },
    ];
  }

  removeSupport(index: number): void {
    this.form.supports = this.form.supports.filter((_, supportIndex) => supportIndex !== index);
  }

  addPointLoad(): void {
    this.form.pointLoads = [
      ...this.form.pointLoads,
      { magnitude: -20, location: Number(this.form.length) / 2 },
    ];
  }

  removePointLoad(index: number): void {
    this.form.pointLoads = this.form.pointLoads.filter((_, loadIndex) => loadIndex !== index);
  }

  get hasInvalidSupportLocation(): boolean {
    const length = Number(this.form.length);

    return (
      !Number.isFinite(length) ||
      this.form.supports.some((support) => Number(support.location) > length) ||
      this.form.pointLoads.some((pointLoad) => Number(pointLoad.location) > length)
    );
  }

  get analysisRequest(): AnalysisRequest {
    return {
      length: Number(this.form.length),
      elements: Number(this.form.elements),
      uniformLoad: Number(this.form.uniformLoad),
      pointLoads: this.form.pointLoads.map((pointLoad) => ({
        magnitude: Number(pointLoad.magnitude),
        location: Number(pointLoad.location),
      })),
      supports: this.form.supports.map((support) => ({
        location: Number(support.location),
        degreesOfFreedom: {
          N: Boolean(support.degreesOfFreedom.N),
          V: Boolean(support.degreesOfFreedom.V),
          M: Boolean(support.degreesOfFreedom.M),
        },
      })),
    };
  }

  get supportReactionRows(): SupportReactionEntry[] {
    if (!this.result?.supportReactions) {
      return [];
    }

    if (Array.isArray(this.result.supportReactions)) {
      return this.result.supportReactions;
    }

    return [
      { location: 0, reactions: this.result.supportReactions.left },
      { location: Number(this.result.beam.length), reactions: this.result.supportReactions.right },
    ];
  }

  runCalculation(): void {
    if (this.hasInvalidSupportLocation) {
      this.errorMessage = 'Support and point-load locations must be within the beam length.';
      return;
    }

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
