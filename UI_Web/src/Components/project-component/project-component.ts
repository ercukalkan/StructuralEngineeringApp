import { CommonModule } from '@angular/common';
import { TestService } from '../../Services/test';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import type { UnitPair } from '../../Types/UnitPair';
import { inputUnitPairs, outputUnitPairs } from '../../Types/UnitPair';
import { FormsModule } from '@angular/forms';
import AnalysisResponse2D from '../../Interfaces/AnalysisResponse2D';
import AnalysisRequest2D from '../../Interfaces/AnalysisRequest2D';
import Support from '../../Interfaces/Support';
import SupportReaction from '../../Interfaces/SupportReaction';
import { UnitConverter as UC } from '../../util/UnitConverter';

type InternalForce = 'axial' | 'shear' | 'moment';

interface TooltipDetail {
  label: string;
  value: string | number;
}

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
  calculatedModel: AnalysisRequest2D | null = null;
  tooltip: { title: string; details: TooltipDetail[]; x: number; y: number } | null = null;
  outputUnits: UnitPair = this.outputUnitOptions[1];

  readonly diagram = {
    left: 110,
    width: 830,
    beamY: 130,
  };
  readonly internalForceDiagrams: {
    force: InternalForce;
    label: string;
    color: string;
    top: number;
  }[] = [
    { force: 'axial', label: 'Axial force', color: '#38bdf8', top: 26 },
    { force: 'shear', label: 'Shear force', color: '#fb923c', top: 140 },
    { force: 'moment', label: 'Bending moment', color: '#a3e635', top: 254 },
  ];

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

  get elementSegments(): number[] {
    const elements = Number(this.result?.beam.elements);
    return Number.isInteger(elements) && elements > 0 ? Array.from({ length: elements }) : [];
  }

  get distributedLoadXs(): number[] {
    return Array.from(
      { length: 13 },
      (_, index) => this.diagram.left + (this.diagram.width * index) / 12,
    );
  }

  beamX(location: number, length: number | null | undefined = this.result?.beam.length): number {
    const beamLength = Number(length);

    if (!Number.isFinite(beamLength) || beamLength <= 0) {
      return this.diagram.left;
    }

    const boundedLocation = Math.max(0, Math.min(Number(location), beamLength));
    return this.diagram.left + (boundedLocation / beamLength) * this.diagram.width;
  }

  supportLabel(support: Support): string {
    const { N, V, M } = support.degreesOfFreedom;

    if (N && V && M) return 'Fixed support';
    if (N && V && !M) return 'Pinned support';
    if (!N && V && !M) return 'Roller support';
    return 'Custom restraint';
  }

  showTooltip(event: MouseEvent, title: string, details: TooltipDetail[]): void {
    this.tooltip = { title, details, x: event.clientX + 14, y: event.clientY + 14 };
  }

  moveTooltip(event: MouseEvent): void {
    if (!this.tooltip) return;

    this.tooltip = { ...this.tooltip, x: event.clientX + 14, y: event.clientY + 14 };
  }

  hideTooltip(): void {
    this.tooltip = null;
  }

  beamTooltipDetails(): TooltipDetail[] {
    return [
      { label: 'Elements', value: this.result?.beam.elements ?? 0 },
      {
        label: 'Length',
        value: `${this.convertedResult?.beam.length ?? 0} ${this.convertedResult?.units.length ?? ''}`,
      },
    ];
  }

  internalForcePath(force: InternalForce, top: number): string {
    const points = this.convertedResult?.points ?? [];
    const length = this.convertedResult?.beam.length;
    if (!points.length) return '';

    return points
      .map((point, index) => {
        const x = this.beamX(point.location, length);
        const y = this.internalForceY(point.internalForces[force], force, top);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  internalForceY(value: number, force: InternalForce, top: number): number {
    const values = (this.convertedResult?.points ?? []).map((point) =>
      Math.abs(Number(point.internalForces[force])),
    );
    const maximum = Math.max(...values, 1);
    const baseline = top + 38;
    return baseline - (Number(value) / maximum) * 31;
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
        location: UC.ConvertLength(point.location, lengthUnit),
        internalForces: {
          axial: UC.ConvertForce(point.internalForces.axial, forceUnit),
          shear: UC.ConvertForce(point.internalForces.shear, forceUnit),
          moment: UC.ConvertMoment(point.internalForces.moment, this.outputUnits),
        },
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
    const request = this.analysisRequest;
    this.calculatedModel = request;

    this.test.post(request).subscribe({
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
