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
  inputUnits: UnitPair;
}

type UnitPair = [force: string, length: string];

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
  result: AnalysisResponse | null = null;
  convertedResult: AnalysisResponse | null = null;
  outputUnits: UnitPair = this.outputUnitOptions[1];

  form: BeamFormValues = {
    length: 8,
    elements: 20,
    uniformLoad: -20,
    pointLoads: [],
    supports: [{ location: 0, degreesOfFreedom: { N: true, V: true, M: false } }],
    inputUnits: this.inputUnitOptions[1],
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
      inputUnits: this.form.inputUnits,
    };
  }

  get supportReactionRows(): SupportReactionEntry[] {
    if (!this.convertedResult?.supportReactions) {
      return [];
    }

    if (Array.isArray(this.convertedResult.supportReactions)) {
      return this.convertedResult.supportReactions;
    }

    return [
      { location: 0, reactions: this.convertedResult.supportReactions.left },
      {
        location: Number(this.convertedResult.beam.length),
        reactions: this.convertedResult.supportReactions.right,
      },
    ];
  }

  convertResultUnits(): void {
    if (!this.result) {
      return;
    }

    const [forceUnit, lengthUnit] = this.outputUnits;
    const forceFactor = this.forceConversionFactors[forceUnit];
    const lengthFactor = this.lengthConversionFactors[lengthUnit];

    if (forceFactor === undefined || lengthFactor === undefined) {
      this.errorMessage = 'The selected output units are not supported.';
      return;
    }

    const convertForce = (value: number): number => value * forceFactor;
    const convertLength = (value: number): number => value * lengthFactor;
    const convertMoment = (value: number): number => value * forceFactor * lengthFactor;

    const supportReactions = Array.isArray(this.result.supportReactions)
      ? this.result.supportReactions.map((supportReaction) => ({
          location: convertLength(supportReaction.location),
          reactions: {
            horizontal: convertForce(supportReaction.reactions.horizontal),
            vertical: convertForce(supportReaction.reactions.vertical),
            moment: convertMoment(supportReaction.reactions.moment),
          },
        }))
      : {
          left: {
            horizontal: convertForce(this.result.supportReactions.left.horizontal),
            vertical: convertForce(this.result.supportReactions.left.vertical),
            moment: convertMoment(this.result.supportReactions.left.moment),
          },
          right: {
            horizontal: convertForce(this.result.supportReactions.right.horizontal),
            vertical: convertForce(this.result.supportReactions.right.vertical),
            moment: convertMoment(this.result.supportReactions.right.moment),
          },
        };

    this.convertedResult = {
      ...this.result,
      units: {
        length: lengthUnit,
        force: forceUnit,
        moment: `${forceUnit} ${lengthUnit}`,
      },
      beam: {
        ...this.result.beam,
        length: convertLength(this.result.beam.length),
        distributedLoad: {
          ...this.result.beam.distributedLoad,
          magnitude: convertForce(this.result.beam.distributedLoad.magnitude) / lengthFactor,
          startPosition: convertLength(this.result.beam.distributedLoad.startPosition),
          endPosition: convertLength(this.result.beam.distributedLoad.endPosition),
        },
      },
      points: this.result.points?.map((point) => ({
        ...point,
        x: convertLength(point.x),
        axial: convertForce(point.axial),
        shear: convertForce(point.shear),
        moment: convertMoment(point.moment),
      })),
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

    this.test.post<AnalysisResponse>({ ...this.analysisRequest }).subscribe({
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
