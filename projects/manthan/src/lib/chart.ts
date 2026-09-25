import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { ArrowDownRight, ArrowUpRight } from '@manthan/icons';
import { deltaDirection, stat, type ChartCurve, type ChartSeries, type ChartType } from '@manthan/base';
import { createChart, type ChartController, type ChartControllerOptions } from '@manthan/base/dom';
import { MnIcon } from './icon';

/**
 * `<mn-chart type="bar" [data]="rows" x="month" [series]="series" label="Revenue">`:
 * line, area, bar or donut chart drawn by the shared `@manthan/base` controller,
 * so it follows the active design style. `[(hidden)]` tracks toggled series.
 */
@Component({
  selector: 'mn-chart',
  template: '',
})
export class MnChart<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly type = input.required<ChartType>();
  readonly data = input.required<T[]>();
  readonly x = input.required<string>();
  readonly series = input.required<ChartSeries[]>();
  /** Accessible name (a single-series chart needs no legend). */
  readonly label = input<string>();
  readonly height = input<number>();
  readonly stacked = input(false, { transform: booleanAttribute });
  readonly horizontal = input(false, { transform: booleanAttribute });
  readonly curve = input<ChartCurve>();
  readonly markers = input(false, { transform: booleanAttribute });
  readonly sparkline = input(false, { transform: booleanAttribute });
  readonly grid = input(true, { transform: booleanAttribute });
  readonly directLabels = input(true, { transform: booleanAttribute });
  readonly yDomain = input<[number | 'auto', number | 'auto']>();
  readonly xFormat = input<(value: unknown, index: number) => string>();
  readonly yFormat = input<(value: number) => string>();
  readonly valueFormat = input<(value: number) => string>();
  readonly innerRadius = input<number>();
  readonly maxBarSize = input<number>();
  readonly legend = input<boolean | 'auto'>('auto');
  readonly toggleable = input(true, { transform: booleanAttribute });
  readonly tooltip = input(true, { transform: booleanAttribute });
  readonly centerLabel = input<string>();
  readonly xLabel = input<string>();
  readonly hidden = model<string[]>([]);
  readonly activeChange = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private controller?: ChartController<T>;

  private readonly options = computed(
    (): ChartControllerOptions<T> => ({
      type: this.type(),
      data: this.data(),
      x: this.x(),
      series: this.series(),
      title: this.label(),
      height: this.height(),
      stacked: this.stacked(),
      horizontal: this.horizontal(),
      curve: this.curve(),
      markers: this.markers(),
      sparkline: this.sparkline(),
      grid: this.grid(),
      directLabels: this.directLabels(),
      yDomain: this.yDomain(),
      xFormat: this.xFormat(),
      yFormat: this.yFormat(),
      valueFormat: this.valueFormat(),
      innerRadius: this.innerRadius(),
      maxBarSize: this.maxBarSize(),
      legend: this.legend(),
      toggleable: this.toggleable(),
      tooltip: this.tooltip(),
      centerLabel: this.centerLabel(),
      xLabel: this.xLabel(),
      hidden: this.hidden(),
    }),
  );

  constructor() {
    afterNextRender(() => {
      this.controller = createChart<T>(this.host, {
        ...untracked(this.options),
        onHiddenChange: (hidden) => this.hidden.set(hidden),
        onActiveChange: (index) => this.activeChange.emit(index),
      });
    });
    effect(() => {
      const options = this.options();
      untracked(() => this.controller?.update(options));
    });
    inject(DestroyRef).onDestroy(() => this.controller?.destroy());
  }
}

const sparkSeries: ChartSeries[] = [{ key: 'v', color: 'accent' }];

/** Stat tile: label, headline value, delta and an optional sparkline. */
@Component({
  selector: 'mn-stat',
  imports: [MnChart, MnIcon],
  template: `
    <span [class]="s().label()">{{ label() }}</span>
    <span [class]="s().value()"><ng-content>{{ value() }}</ng-content></span>
    @if (delta() !== undefined || caption()) {
      <span [class]="s().footer()">
        @if (delta() !== undefined) {
          <span [class]="s().delta()">
            @if (direction() !== 'flat') {
              <svg mnIcon aria-hidden="true" [icon]="direction() === 'up' ? icons.up : icons.down"></svg>
            }
            {{ delta() }}
          </span>
        }
        {{ caption() ?? '' }}
      </span>
    }
    @if (points().length > 1) {
      <mn-chart [class]="s().trend()" type="area" sparkline [height]="40" x="i" [label]="label() + ' trend'" [data]="points()" [series]="sparkSeries" />
    }
  `,
  host: { '[class]': 's().root()' },
})
export class MnStat {
  readonly label = input.required<string>();
  readonly value = input<string | number>();
  /** Signed change, e.g. "+12.4%". Its sign picks the arrow. */
  readonly delta = input<string | number>();
  /** Whether the change is good; colours the delta. */
  readonly sentiment = input<'positive' | 'negative' | 'neutral'>('neutral');
  /** Comparison period, e.g. "vs last month". */
  readonly caption = input<string>();
  /** Recent values, drawn as a sparkline. */
  readonly trend = input<number[]>();

  protected readonly icons = { up: ArrowUpRight, down: ArrowDownRight };
  protected readonly sparkSeries = sparkSeries;
  protected readonly s = computed(() => stat({ sentiment: this.sentiment() }));
  protected readonly direction = computed(() => deltaDirection(this.delta()));
  protected readonly points = computed(() => this.trend()?.map((v, i) => ({ i, v })) ?? []);
}
