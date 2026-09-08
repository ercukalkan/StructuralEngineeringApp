import { Component } from '@angular/core';
import { Input } from '@angular/core';
import TooltipDetail from '../../../Interfaces/TooltipDetail';
import { InternalForce } from '../../../Types/InternalForce';
import AnalysisResponse2D from '../../../Interfaces/AnalysisResponse2D';

@Component({
  selector: 'app-internal-forces-diagram-component',
  imports: [],
  templateUrl: './internal-forces-diagram-component.html',
  styleUrls: ['./internal-forces-diagram-component.css'],
})
export class InternalForcesDiagramComponent {
  tooltip: { title: string; details: TooltipDetail[]; x: number; y: number } | null = null;
  @Input() diagram: any;
  @Input() result: AnalysisResponse2D | null = null;
  @Input() internalForceDiagrams: {
    force: InternalForce;
    label: string;
    color: string;
    top: number;
  }[] = [];

  get convertedResult(): AnalysisResponse2D | null {
    return this.result;
  }

  beamX(location: number, length: number | null | undefined = this.result?.beam.length): number {
    const beamLength = Number(length);

    if (!Number.isFinite(beamLength) || beamLength <= 0) {
      return this.diagram.left;
    }

    const boundedLocation = Math.max(0, Math.min(Number(location), beamLength));
    return this.diagram.left + (boundedLocation / beamLength) * this.diagram.width;
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
    const maximum = this.forceMaximum(force);
    const baseline = top + 38;
    return baseline - (Number(value) / maximum) * 40;
  }

  forceMaximum(force: InternalForce): number {
    const values = (this.convertedResult?.points ?? []).map((point) =>
      Math.abs(Number(point.internalForces[force])),
    );
    return Math.max(...values, 1);
  }

  formatAxisValue(value: number): string {
    return `${Math.round(value * 100) / 100}`;
  }

  readonly verticalAxisTickOffsets = [0, 19.5, 39, 58.5, 78];

  get horizontalAxisY(): number {
    const lowestDiagramTop = Math.max(...this.internalForceDiagrams.map((item) => item.top), 0);
    return lowestDiagramTop + 78 + 24;
  }

  get horizontalAxisTicks(): { x: number; label: string }[] {
    const length = Number(this.convertedResult?.beam.length);
    if (!Number.isFinite(length) || length <= 0) return [];

    const divisions = 4;
    return Array.from({ length: divisions + 1 }, (_, index) => {
      const location = (length * index) / divisions;
      return { x: this.beamX(location, length), label: `${Math.round(location * 100) / 100}` };
    });
  }
}
