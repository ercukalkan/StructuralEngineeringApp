import { Component, Input } from '@angular/core';
import Support from '../../../Interfaces/Support';
import TooltipDetail from '../../../Interfaces/TooltipDetail';

@Component({
  selector: 'app-structural-model-component',
  imports: [],
  templateUrl: './structural-model-component.html',
  styleUrls: ['./structural-model-component.css'],
})
export class StructuralModelComponent {
  tooltip: { title: string; details: TooltipDetail[]; x: number; y: number } | null = null;
  @Input() calculatedModel: any;
  @Input() convertedResult: any;
  @Input() diagram: any;
  @Input() result: any;

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

  supportType(support: Support): 'fixed' | 'pinned' | 'roller' | 'custom' {
    const { N, V, M } = support.degreesOfFreedom;

    if (N && V && M) return 'fixed';
    if (N && V && !M) return 'pinned';
    if (!N && V && !M) return 'roller';
    return 'custom';
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
}
