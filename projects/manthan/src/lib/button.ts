import { Component, Directive, booleanAttribute, computed, input } from '@angular/core';
import { button, buttonGroup, spinner, type Tone } from '@manthan/base';

/**
 * `<button mnButton variant="soft" tone="danger">` or `<a mnButton href="…">`.
 */
@Component({
  selector: 'button[mnButton], a[mnButton]',
  template: `@if (loading()) {<span [class]="spinnerClass" aria-hidden="true"></span>}<ng-content />`,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.disabled]': 'disabled() || loading() ? "" : null',
  },
})
export class MnButton {
  readonly variant = input<'solid' | 'soft' | 'surface' | 'outline' | 'ghost' | 'link'>();
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>();
  readonly tone = input<Tone>();
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Shows a spinner, sets aria-busy and disables the button. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly spinnerClass = spinner({ size: 'sm' });
  protected readonly classes = computed(() =>
    button({
      variant: this.variant(),
      size: this.size(),
      tone: this.tone(),
      iconOnly: this.iconOnly(),
      fullWidth: this.fullWidth(),
    }),
  );
}

@Directive({ selector: '[mnButtonGroup]', host: { role: 'group', '[class]': 'classes()' } })
export class MnButtonGroup {
  readonly attached = input(false, { transform: booleanAttribute });
  protected readonly classes = computed(() => buttonGroup({ attached: this.attached() }));
}
