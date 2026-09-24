import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,

  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from '@manthan/icons';
import { accordion, breadcrumb, getPaginationItems, pagination, tabs } from '@manthan/base';
import { createTabs } from '@manthan/base/dom';
import { MnIcon } from './icon';

let nextId = 0;

// ── Tabs ──

@Directive({ selector: 'mn-tabs, [mnTabs]', host: { '[class]': 'slots().root()', '[attr.data-orientation]': 'orientation()' } })
export class MnTabs {
  readonly value = model<string>();
  readonly variant = input<'line' | 'pills' | 'segmented'>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly size = input<'sm' | 'md' | 'lg'>();
  /** `automatic` selects on focus, `manual` on Enter/Space. */
  readonly activation = input<'automatic' | 'manual'>('automatic');
  readonly baseId = `mn-tabs-${++nextId}`;
  readonly slots = computed(() => tabs({ variant: this.variant(), orientation: this.orientation(), size: this.size() }));
}

@Directive({
  selector: '[mnTabsList]',
  host: { role: 'tablist', '[attr.aria-orientation]': 'tabs.orientation()', '[class]': 'tabs.slots().list()' },
})
export class MnTabsList {
  protected readonly tabs = inject(MnTabs);
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ctl = createTabs(el, { orientation: this.tabs.orientation(), activation: this.tabs.activation() });
      destroyRef.onDestroy(ctl.destroy);
    });
  }
}

@Directive({
  selector: 'button[mnTabsTrigger]',
  host: {
    type: 'button',
    role: 'tab',
    '[id]': 'tabs.baseId + "-tab-" + value()',
    '[attr.aria-controls]': 'tabs.baseId + "-panel-" + value()',
    '[attr.aria-selected]': 'selected()',
    '[tabIndex]': 'selected() ? 0 : -1',
    '[class]': 'tabs.slots().trigger()',
    '(click)': 'tabs.value.set(value())',
  },
})
export class MnTabsTrigger {
  readonly value = input.required<string>({ alias: 'mnTabsTrigger' });
  protected readonly tabs = inject(MnTabs);
  protected readonly selected = computed(() => this.tabs.value() === this.value());
}

@Directive({
  selector: '[mnTabsContent]',
  host: {
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'tabs.baseId + "-panel-" + value()',
    '[attr.aria-labelledby]': 'tabs.baseId + "-tab-" + value()',
    '[hidden]': 'tabs.value() !== value()',
    '[class]': 'tabs.slots().panel()',
  },
})
export class MnTabsContent {
  readonly value = input.required<string>({ alias: 'mnTabsContent' });
  protected readonly tabs = inject(MnTabs);
}

// ── Accordion (native <details>) ──

@Directive({ selector: 'mn-accordion', host: { '[class]': 'slots().root()' } })
export class MnAccordion {
  /** `single` keeps at most one item open (native `<details name>`). */
  readonly type = input<'single' | 'multiple'>('single');
  readonly variant = input<'plain' | 'contained' | 'separated'>();
  readonly name = computed(() => (this.type() === 'single' ? `mn-accordion-${this.id}` : null));
  readonly slots = computed(() => accordion({ variant: this.variant() }));
  private readonly id = ++nextId;
}

@Component({
  selector: 'mn-accordion-item',
  imports: [MnIcon],
  template: `
    <details [attr.name]="parent?.name() ?? null" [open]="open()" [class]="slots().item()" (toggle)="onToggle($event)">
      <summary [class]="slots().trigger()">
        {{ title() }}<ng-content select="[mnAccordionTitle]" />
        <svg mnIcon [icon]="ChevronDown" [class]="slots().icon()"></svg>
      </summary>
      <div [class]="slots().content()"><ng-content /></div>
    </details>
  `,
  host: { class: 'contents' },
})
export class MnAccordionItem {
  readonly title = input<string>();
  readonly open = model(false);
  protected readonly parent = inject(MnAccordion, { optional: true });
  protected readonly slots = computed(() => this.parent?.slots() ?? accordion());
  protected readonly ChevronDown = ChevronDown;
  protected onToggle(event: Event) {
    this.open.set((event.target as HTMLDetailsElement).open);
  }
}

// ── Breadcrumb ──

@Component({
  selector: 'mn-breadcrumb',
  imports: [MnIcon],
  template: `
    <nav aria-label="Breadcrumb" [class]="s.root()">
      <ol [class]="s.list()">
        @for (item of items(); track $index; let last = $last) {
          <li [class]="s.item()">
            @if (last || !item.href) {
              <span [attr.aria-current]="last ? 'page' : null" [class]="last ? s.page() : ''">{{ item.label }}</span>
            } @else {
              <a [href]="item.href" [class]="s.link()">{{ item.label }}</a>
            }
            @if (!last) {
              <span role="presentation" aria-hidden="true" [class]="s.separator()"><svg mnIcon [icon]="ChevronRight"></svg></span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  host: { class: 'block' },
})
export class MnBreadcrumb {
  readonly items = input.required<Array<{ label: string; href?: string }>>();
  protected readonly s = breadcrumb();
  protected readonly ChevronRight = ChevronRight;
}

// ── Pagination ──

@Component({
  selector: 'mn-pagination',
  imports: [MnIcon],
  template: `
    <nav aria-label="Pagination" [class]="s().root()">
      <ul [class]="s().list()">
        <li>
          <button type="button" [class]="s().item()" [disabled]="page() <= 1" aria-label="Previous page" (click)="page.set(page() - 1)">
            <svg mnIcon [icon]="icons.prev"></svg>
          </button>
        </li>
        @for (item of items(); track item) {
          @if (isPage(item)) {
            <li>
              <button
                type="button"
                [class]="s().item()"
                [attr.aria-current]="item === page() ? 'page' : null"
                [attr.aria-label]="'Page ' + item"
                (click)="page.set(item)"
              >
                {{ item }}
              </button>
            </li>
          } @else {
            <li [class]="s().ellipsis()" aria-hidden="true"><svg mnIcon [icon]="icons.more" [size]="16"></svg></li>
          }
        }
        <li>
          <button type="button" [class]="s().item()" [disabled]="page() >= total()" aria-label="Next page" (click)="page.set(page() + 1)">
            <svg mnIcon [icon]="icons.next"></svg>
          </button>
        </li>
      </ul>
    </nav>
  `,
  host: { class: 'block' },
})
export class MnPagination {
  readonly total = input.required<number>();
  readonly page = model(1);
  readonly siblings = input<number>();
  readonly boundaries = input<number>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly variant = input<'ghost' | 'outline'>();
  protected readonly icons = { prev: ChevronLeft, next: ChevronRight, more: MoreHorizontal };
  protected readonly s = computed(() => pagination({ size: this.size(), variant: this.variant() }));
  protected readonly items = computed(() =>
    getPaginationItems({ page: this.page(), total: this.total(), siblings: this.siblings(), boundaries: this.boundaries() }),
  );
  protected isPage(item: number | string): item is number {
    return typeof item === 'number';
  }
}

