import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import type { IconNode } from '@manthan/icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Renders a Manthan icon into an `<svg>`:
 * `<svg mnIcon [icon]="Check" class="size-4"></svg>`
 */
@Directive({
  selector: 'svg[mnIcon]',
  host: {
    xmlns: SVG_NS,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    '[attr.width]': 'size()',
    '[attr.height]': 'size()',
    '[attr.stroke-width]': 'stroke()',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
  },
})
export class MnIcon {
  readonly icon = input.required<IconNode>();
  readonly size = input<number | string>(24);
  readonly strokeWidth = input<number | string>(2);
  readonly absoluteStrokeWidth = input(false);
  /** Accessible label; unlabelled icons are hidden from assistive tech. */
  readonly label = input<string>();

  private readonly el = inject<ElementRef<SVGSVGElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  protected stroke() {
    return this.absoluteStrokeWidth()
      ? (Number(this.strokeWidth()) * 24) / Number.parseFloat(String(this.size()))
      : this.strokeWidth();
  }

  constructor() {
    effect(() => {
      const node = this.icon();
      for (const child of Array.from(this.el.childNodes)) this.renderer.removeChild(this.el, child);
      for (const [tag, attrs] of node) {
        const child = this.renderer.createElement(tag, 'svg');
        for (const [key, value] of Object.entries(attrs)) this.renderer.setAttribute(child, key, value);
        this.renderer.appendChild(this.el, child);
      }
    });
  }
}
