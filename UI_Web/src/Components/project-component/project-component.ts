import { CommonModule } from '@angular/common';
import { TestService } from '../../Services/test';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import type { UnitPair } from '../../Types/UnitPair';
import { inputUnitPairs, outputUnitPairs } from '../../Types/UnitPair';
import { FormsModule } from '@angular/forms';
import AnalysisResponse2D from '../../Interfaces/AnalysisResponse2D';
import AnalysisRequest2D from '../../Interfaces/AnalysisRequest2D';
import SupportReaction from '../../Interfaces/SupportReaction';
import { UnitConverter as UC } from '../../util/UnitConverter';

@Component({
  selector: 'app-project-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-component.html',
  styleUrls: ['./project-component.css'],
})
export class ProjectComponent {
  private readonly test = inject(TestService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly inputUnitOptions: UnitPair[] = inputUnitPairs;
  readonly outputUnitOptions: UnitPair[] = outputUnitPairs;

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

    // Convert support reactions, beam, and points using the conversion functions
    const supportReactions = Array.isArray(this.result.supportReactions)
      ? this.result.supportReactions.map((supportReaction) => ({
          location: UC.ConvertLength(supportReaction.location, lengthUnit),
          reactions: {
            axial: UC.ConvertForce(supportReaction.reactions.axial, forceUnit),
            shear: UC.ConvertForce(supportReaction.reactions.shear, forceUnit),
            moment: UC.ConvertMoment(supportReaction.reactions.moment, this.outputUnits),
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
      length: UC.ConvertLength(this.result.beam.length, lengthUnit),
      distributedLoad: {
        ...this.result.beam.distributedLoad,
        magnitude:
          UC.ConvertForce(this.result.beam.distributedLoad.magnitude, forceUnit) /
          UC.ConvertLength(1, lengthUnit),
        startPosition: UC.ConvertLength(this.result.beam.distributedLoad.startPosition, lengthUnit),
        endPosition: UC.ConvertLength(this.result.beam.distributedLoad.endPosition, lengthUnit),
      },
    };

    const points =
      this.result.points?.map((point) => ({
        ...point,
        x: UC.ConvertLength(point.location, lengthUnit),
        axial: UC.ConvertForce(point.internalForces.axial, forceUnit),
        shear: UC.ConvertForce(point.internalForces.shear, forceUnit),
        moment: UC.ConvertMoment(point.internalForces.moment, this.outputUnits),
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
