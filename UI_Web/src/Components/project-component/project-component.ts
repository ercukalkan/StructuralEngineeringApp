import { CommonModule } from '@angular/common';
import { TestService } from '../../Services/test';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import type { UnitPair } from '../../Types/UnitPair';
import { FormsModule } from '@angular/forms';
import AnalysisResponse2D from '../../Interfaces/AnalysisResponse2D';
import AnalysisRequest2D from '../../Interfaces/AnalysisRequest2D';
import SupportReaction from '../../Interfaces/SupportReaction';

@Component({
  selector: 'app-project-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-component.html',
  styleUrls: ['./project-component.css'],
})
export class ProjectComponent {
  private readonly test = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly forceConversionFactors: Record<string, number> = {
    N: 1,
    kN: 1e-3,
    lb: 0.2248089431,
    tonf: 1.019716213e-4,
  };

  private readonly lengthConversionFactors: Record<string, number> = {
    m: 1,
    cm: 100,
    mm: 1000,
    ft: 3.280839895,
    in: 39.37007874,
  };

  readonly inputUnitOptions: UnitPair[] = [
    ['kN', 'm'],
    ['N', 'm'],
    ['kN', 'cm'],
    ['N', 'cm'],
    ['kN', 'mm'],
    ['N', 'mm'],
    ['lb', 'ft'],
    ['lb', 'in'],
    ['tonf', 'm'],
  ];

  readonly outputUnitOptions: UnitPair[] = [
    ['kN', 'm'],
    ['N', 'm'],
    ['kN', 'cm'],
    ['N', 'cm'],
    ['kN', 'mm'],
    ['N', 'mm'],
    ['lb', 'ft'],
    ['lb', 'in'],
    ['tonf', 'm'],
  ];

  isLoading = false;
  errorMessage = '';
  result: AnalysisResponse2D | null = null;
  convertedResult: AnalysisResponse2D | null = null;
  outputUnits: UnitPair = this.outputUnitOptions[1];

  form: AnalysisRequest2D = {
    length: 8,
    elements: 20,
    uniformLoad: -20,
    pointLoads: null,
    supports: [{ location: 0, degreesOfFreedom: { N: true, V: true, M: true } }],
    inputUnits: this.inputUnitOptions[0],
  };

  addSupport(): void {
    this.form.supports = [
      ...(this.form.supports ?? []),
      {
        location: 0,
        degreesOfFreedom: { N: false, V: true, M: false },
      },
    ];
  }

  removeSupport(index: number): void {
    if (!this.form.supports) {
      return;
    }
    this.form.supports = this.form.supports.filter((_, supportIndex) => supportIndex !== index);
  }

  addPointLoad(): void {
    this.form.pointLoads = [
      ...(this.form.pointLoads ?? []),
      { magnitude: -20, location: Number(this.form.length) / 2 },
    ];
  }

  removePointLoad(index: number): void {
    if (!this.form.pointLoads) {
      return;
    }
    this.form.pointLoads = this.form.pointLoads.filter((_, loadIndex) => loadIndex !== index);
  }

  get hasInvalidSupportLocation(): boolean {
    const length = Number(this.form.length);

    return (
      !Number.isFinite(length) ||
      (this.form.supports?.some((support) => Number(support.location) > length) ?? false) ||
      (this.form.pointLoads?.some((pointLoad) => Number(pointLoad.location) > length) ?? false)
    );
  }

  get analysisRequest(): AnalysisRequest2D {
    return {
      length: Number(this.form.length),
      elements: Number(this.form.elements),
      uniformLoad: Number(this.form.uniformLoad),
      pointLoads: (this.form.pointLoads ?? []).map((pointLoad) => ({
        magnitude: Number(pointLoad.magnitude),
        location: Number(pointLoad.location),
      })),
      supports: (this.form.supports ?? []).map((support) => ({
        location: Number(support.location),
        degreesOfFreedom: {
          N: Boolean(support.degreesOfFreedom.N),
          V: Boolean(support.degreesOfFreedom.V),
          M: Boolean(support.degreesOfFreedom.M),
        },
      })),
      inputUnits: this.form.inputUnits,
    };
  }

  get supportReactionRows(): SupportReaction[] {
    if (!this.convertedResult?.supportReactions) {
      return [];
    }

    if (Array.isArray(this.convertedResult.supportReactions)) {
      return this.convertedResult.supportReactions;
    }

    return [];
  }

  convertResultUnits(): void {
    if (!this.result) {
      return;
    }

    const [forceUnit, lengthUnit] = this.outputUnits;

    const forceFactor = this.forceConversionFactors[forceUnit]; // Get the conversion factor for the selected force unit
    const lengthFactor = this.lengthConversionFactors[lengthUnit]; // Get the conversion factor for the selected length unit

    if (forceFactor === undefined || lengthFactor === undefined) {
      // Check if conversion factors are defined
      this.errorMessage = 'The selected output units are not supported.';
      return;
    }

    // Conversion functions for force, length, and moment values
    const convertForce = (value: number): number => value * forceFactor;
    const convertLength = (value: number): number => value * lengthFactor;
    const convertMoment = (value: number): number => value * forceFactor * lengthFactor;

    // Convert support reactions, beam, and points using the conversion functions
    const supportReactions = Array.isArray(this.result.supportReactions)
      ? this.result.supportReactions.map((supportReaction) => ({
          location: convertLength(supportReaction.location),
          reactions: {
            axial: convertForce(supportReaction.reactions.axial),
            shear: convertForce(supportReaction.reactions.shear),
            moment: convertMoment(supportReaction.reactions.moment),
          },
        }))
      : [];

    const units = {
      length: lengthUnit,
      force: forceUnit,
      moment: `${forceUnit} ${lengthUnit}`,
    };

    const beam = {
      ...this.result.beam,
      length: convertLength(this.result.beam.length),
      distributedLoad: {
        ...this.result.beam.distributedLoad,
        magnitude: convertForce(this.result.beam.distributedLoad.magnitude) / lengthFactor,
        startPosition: convertLength(this.result.beam.distributedLoad.startPosition),
        endPosition: convertLength(this.result.beam.distributedLoad.endPosition),
      },
    };

    const points =
      this.result.points?.map((point) => ({
        ...point,
        x: convertLength(point.location),
        axial: convertForce(point.internalForces.axial),
        shear: convertForce(point.internalForces.shear),
        moment: convertMoment(point.internalForces.moment),
      })) ?? [];

    this.convertedResult = {
      ...this.result,
      units,
      beam,
      points,
      supportReactions,
    };
  }

  runCalculation(): void {
    if (this.hasInvalidSupportLocation) {
      this.errorMessage = 'Support and point-load locations must be within the beam length.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.test.post(this.analysisRequest).subscribe({
      next: (response) => {
        this.result = response;
        this.convertedResult = response;
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
