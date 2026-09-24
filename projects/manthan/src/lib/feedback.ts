import { Component, booleanAttribute, computed, input } from '@angular/core';
import type { IconNode } from '@manthan/icons';
import { alert, progress, progressCircle, skeleton, spinner, valueToPercent, type Tone } from '@manthan/base';
import { toastIcons } from '@manthan/base/dom';
import { MnIcon } from './icon';

@Component({
  selector: 'mn-alert',
  imports: [MnIcon],
  template: `
    @if (node(); as icon) {
      <svg mnIcon [icon]="icon" [class]="s().icon()"></svg>
    }
    <div [class]="s().content()">
      @if (title()) {
        <div [class]="s().title()">{{ title() }}</div>
      }
      <div [class]="s().description('empty:hidden')"><ng-content /></div>
    </div>
  `,
  host: { role: 'alert', '[class]': 's().root()' },
})
export class MnAlert {
  readonly tone = input<Tone>('info');
  readonly variant = input<'soft' | 'surface' | 'outline' | 'solid'>();
  readonly title = input<string>();
  /** Custom icon, or `false` to hide it. */
  readonly icon = input<IconNode | false>();
  protected readonly s = computed(() => alert({ tone: this.tone(), variant: this.variant() }));
  protected readonly node = computed(() => (this.icon() === false ? undefined : (this.icon() || toastIcons[this.tone()])));
}

@Component({
  selector: 'mn-progress',
  template: `<div [class]="s().indicator()" [style.translate]="indeterminate() ? null : '-' + (100 - percent()) + '% 0'"></div>`,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : value()',
    '[class]': '"block " + s().root()',
  },
})
export class MnProgress {
  readonly value = input(0);
  readonly max = input(100);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  protected readonly s = computed(() => progress({ size: this.size(), tone: this.tone(), indeterminate: this.indeterminate() }));
  protected readonly percent = computed(() => valueToPercent(this.value(), 0, this.max()));
}

@Component({
  selector: 'mn-progress-circle',
  template: `
    <svg viewBox="0 0 40 40" [class]="s().svg()" aria-hidden="true">
      <circle cx="20" cy="20" [attr.r]="r()" [attr.stroke-width]="thickness()" [class]="s().track()" />
      <circle
        cx="20"
        cy="20"
        [attr.r]="r()"
        [attr.stroke-width]="thickness()"
        [attr.stroke-dasharray]="c()"
        [attr.stroke-dashoffset]="c() * (1 - percent() / 100)"
        [class]="s().indicator()"
      />
    </svg>
    @if (showLabel()) {
      <span [class]="s().label()">{{ round(percent()) }}%</span>
    }
  `,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : value()',
    '[class]': 's().root()',
  },
})
export class MnProgressCircle {
  readonly value = input(0);
  readonly max = input(100);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly tone = input<Tone>();
  readonly showValue = input<boolean | undefined>(undefined);
  readonly thickness = input(4);
  protected readonly s = computed(() =>
    progressCircle({ size: this.size(), tone: this.tone(), indeterminate: this.indeterminate() }),
  );
  protected readonly r = computed(() => 20 - this.thickness() / 2);
  protected readonly c = computed(() => 2 * Math.PI * this.r());
  protected readonly percent = computed(() => (this.indeterminate() ? 25 : valueToPercent(this.value(), 0, this.max())));
  protected readonly round = Math.round;
  protected readonly showLabel = computed(() => (this.showValue() ?? this.size() !== 'sm') && !this.indeterminate());
}

@Component({
  selector: 'mn-spinner',
  template: ``,
  host: { role: 'status', '[attr.aria-label]': 'label()', '[class]': 'classes()' },
})
export class MnSpinner {
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>();
  readonly tone = input<Tone | 'current'>();
  readonly label = input('Loading');
  protected readonly classes = computed(() => spinner({ size: this.size(), tone: this.tone() }));
}

@Component({
  selector: 'mn-skeleton',
  template: ``,
  host: { 'aria-hidden': 'true', '[class]': 'classes()' },
})
export class MnSkeleton {
  readonly shape = input<'text' | 'rect' | 'circle'>();
  protected readonly classes = computed(() => skeleton({ shape: this.shape() }));
}
