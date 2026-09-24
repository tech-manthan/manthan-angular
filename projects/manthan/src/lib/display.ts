import { Component, Directive, booleanAttribute, computed, inject, input, signal } from '@angular/core';
import { avatar, avatarGroup, badge, card, heading, kbd, separator, table, type Tone } from '@manthan/base';

@Directive({ selector: '[mnBadge]', host: { '[class]': 'classes()' } })
export class MnBadge {
  readonly variant = input<'solid' | 'soft' | 'surface' | 'outline'>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  protected readonly classes = computed(() => badge({ variant: this.variant(), size: this.size(), tone: this.tone() }));
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

@Component({
  selector: 'mn-avatar',
  template: `
    @if (src() && failed() !== src()) {
      <img [src]="src()" [alt]="alt()" [class]="slots().image()" (error)="failed.set(src())" />
    } @else {
      <span [class]="slots().fallback()" [attr.role]="alt() ? 'img' : null" [attr.aria-label]="alt() || null">
        <ng-content>{{ fallback() ?? initials(alt()) }}</ng-content>
      </span>
    }
  `,
  host: { '[class]': 'slots().root()' },
})
export class MnAvatar {
  readonly src = input<string>();
  readonly alt = input('');
  /** Shown when there is no image; defaults to the initials of `alt`. */
  readonly fallback = input<string>();
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>();
  readonly shape = input<'circle' | 'square'>();
  readonly tone = input<Tone>();
  protected readonly failed = signal<string | undefined>(undefined);
  protected readonly initials = initials;
  protected readonly slots = computed(() => avatar({ size: this.size(), shape: this.shape(), tone: this.tone() }));
}

@Directive({ selector: '[mnAvatarGroup]', host: { '[class]': 'classes' } })
export class MnAvatarGroup {
  protected readonly classes = avatarGroup();
}

@Directive({ selector: '[mnCard], mn-card', host: { '[class]': 'slots().root()', '[attr.tabindex]': 'interactive() ? 0 : null' } })
export class MnCard {
  readonly variant = input<'surface' | 'outline' | 'ghost'>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly slots = computed(() => card({ variant: this.variant(), size: this.size(), interactive: this.interactive() }));
}

/** Must be called in an injection context (a field initializer). */
function cardPart(part: 'header' | 'title' | 'description' | 'content' | 'footer') {
  const parent = inject(MnCard, { optional: true });
  return computed(() => (parent?.slots() ?? card())[part]());
}
@Directive({ selector: '[mnCardHeader]', host: { '[class]': 'cls()' } })
export class MnCardHeader {
  protected readonly cls = cardPart('header');
}
@Directive({ selector: '[mnCardTitle]', host: { '[class]': 'cls()' } })
export class MnCardTitle {
  protected readonly cls = cardPart('title');
}
@Directive({ selector: '[mnCardDescription]', host: { '[class]': 'cls()' } })
export class MnCardDescription {
  protected readonly cls = cardPart('description');
}
@Directive({ selector: '[mnCardContent]', host: { '[class]': 'cls()' } })
export class MnCardContent {
  protected readonly cls = cardPart('content');
}
@Directive({ selector: '[mnCardFooter]', host: { '[class]': 'cls()' } })
export class MnCardFooter {
  protected readonly cls = cardPart('footer');
}

@Directive({ selector: 'kbd[mnKbd]', host: { '[class]': 'classes()' } })
export class MnKbd {
  readonly size = input<'sm' | 'md'>();
  protected readonly classes = computed(() => kbd({ size: this.size() }));
}

@Directive({
  selector: 'mn-separator, [mnSeparator]',
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
  },
})
export class MnSeparator {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly decorative = input(true, { transform: booleanAttribute });
  protected readonly classes = computed(() => `block ${separator({ orientation: this.orientation() })}`);
}

@Directive({ selector: '[mnHeading]', host: { '[class]': 'classes()' } })
export class MnHeading {
  readonly size = input<1 | 2 | 3 | 4 | 5 | 6>(3);
  protected readonly classes = computed(() => heading({ size: this.size() }));
}

// Table: <div mnTableContainer><table mnTable>…</table></div>
@Directive({ selector: '[mnTableContainer]', host: { '[class]': 'slots().root()' } })
export class MnTableContainer {
  readonly striped = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md'>();
  readonly slots = computed(() => table({ striped: this.striped(), size: this.size() }));
}
function tablePart(part: 'table' | 'header' | 'body' | 'row' | 'head' | 'cell' | 'caption') {
  const parent = inject(MnTableContainer, { optional: true });
  return computed(() => (parent?.slots() ?? table())[part]());
}
@Directive({ selector: 'table[mnTable]', host: { '[class]': 'cls()' } })
export class MnTable {
  protected readonly cls = tablePart('table');
}
@Directive({ selector: 'thead[mnTableHeader]', host: { '[class]': 'cls()' } })
export class MnTableHeader {
  protected readonly cls = tablePart('header');
}
@Directive({ selector: 'tbody[mnTableBody]', host: { '[class]': 'cls()' } })
export class MnTableBody {
  protected readonly cls = tablePart('body');
}
@Directive({ selector: 'tr[mnTableRow]', host: { '[class]': 'cls()' } })
export class MnTableRow {
  protected readonly cls = tablePart('row');
}
@Directive({ selector: 'th[mnTableHead]', host: { '[class]': 'cls()' } })
export class MnTableHead {
  protected readonly cls = tablePart('head');
}
@Directive({ selector: 'td[mnTableCell]', host: { '[class]': 'cls()' } })
export class MnTableCell {
  protected readonly cls = tablePart('cell');
}
@Directive({ selector: 'caption[mnTableCaption]', host: { '[class]': 'cls()' } })
export class MnTableCaption {
  protected readonly cls = tablePart('caption');
}
