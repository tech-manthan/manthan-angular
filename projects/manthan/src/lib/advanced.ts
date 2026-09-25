import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from '@manthan/icons';
import {
  addMonths,
  calendar,
  clampToEnabled,
  combobox,
  command,
  commandDialog,
  compareISO,
  datePicker,
  filterOptions,
  formatDate,
  formatHotkey,
  formatMonthYear,
  getCalendarKeyTarget,
  getCalendarWeeks,
  getWeekdayNames,
  getWeekStart,
  groupOptions,
  input as inputRecipe,
  isDateDisabled,
  normalizeOption,
  startOfMonth,
  todayISO,
  toggleGroup,
  type ISODate,
  type ListOption,
  type OptionInput,
  type Placement,
  type Tone,
} from '@manthan/base';
import { createCombobox, createDialog, createPopover, createRovingFocus, onHotkey, type DialogController, type PopoverController } from '@manthan/base/dom';
import { MnField } from './form';
import { MnIcon } from './icon';

let nextId = 0;
const accessor = (type: unknown) => ({ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => type), multi: true });

abstract class ValueAccessor<T> implements ControlValueAccessor {
  protected onChange: (value: T) => void = () => {};
  protected onTouched: () => void = () => {};
  protected readonly formDisabled = signal(false);
  abstract writeValue(value: T): void;
  registerOnChange(fn: (value: T) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean) {
    this.formDisabled.set(disabled);
  }
}

// ── Combobox ──

@Component({
  selector: 'mn-combobox',
  imports: [MnIcon],
  providers: [accessor(MnCombobox)],
  template: `
    <input
      #input
      [id]="inputId() ?? field?.controlId() ?? listId + '-input'"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-describedby]="field?.describedBy() ?? null"
      [attr.aria-invalid]="field?.error() ? 'true' : null"
      [attr.placeholder]="placeholder() ?? null"
      [disabled]="disabled() || formDisabled()"
      [class]="inputClass()"
      [value]="query() ?? selectedLabel()"
      (input)="query.set($any($event.target).value)"
      (blur)="onTouched()"
    />
    <span [class]="s.trigger('pointer-events-none')" aria-hidden="true"><svg mnIcon [icon]="icons.chevrons"></svg></span>
    <div #listbox [id]="listId" popover="manual" [class]="s.listbox()">
      @for (g of groups(); track g.group) {
        <div [attr.role]="g.group ? 'group' : null" [attr.aria-label]="g.group || null" [class]="s.group()">
          @if (g.group) {
            <div [class]="s.groupLabel()" aria-hidden="true">{{ g.group }}</div>
          }
          @for (o of g.options; track o.value) {
            <div role="option" [attr.data-value]="o.value" [attr.aria-selected]="o.value === value()" [attr.aria-disabled]="o.disabled || null" [class]="s.option()">
              {{ o.label }}<svg mnIcon [icon]="icons.check" [class]="s.check()"></svg>
            </div>
          }
        </div>
      }
      @if (visible().length === 0) {
        <div [class]="s.empty()">{{ emptyText() }}</div>
      }
    </div>
  `,
  host: { '[class]': 's.root()' },
})
export class MnCombobox extends ValueAccessor<string | null> {
  readonly options = input.required<OptionInput[]>();
  readonly value = model<string | null>(null);
  readonly placeholder = input<string>();
  readonly emptyText = input('No results');
  readonly size = input<'sm' | 'md' | 'lg'>();
  /** Open the list on focus. */
  readonly openOnFocus = input(true, { transform: booleanAttribute });
  readonly placement = input<Placement>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly ariaLabel = input<string>();

  protected readonly field = inject(MnField, { optional: true });
  protected readonly s = combobox();
  protected readonly icons = { chevrons: ChevronsUpDown, check: Check };
  protected readonly listId = `mn-combobox-${++nextId}`;
  protected readonly query = signal<string | null>(null);
  protected readonly inputClass = computed(() => inputRecipe({ size: this.size(), withEnd: true }));
  private readonly normalized = computed(() => this.options().map(normalizeOption));
  protected readonly selectedLabel = computed(() => this.normalized().find((o) => o.value === this.value())?.label ?? '');
  protected readonly visible = computed(() => {
    const q = this.query();
    return q ? filterOptions(this.normalized(), q) : this.normalized();
  });
  protected readonly groups = computed(() => groupOptions(this.visible()));
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly listEl = viewChild.required<ElementRef<HTMLElement>>('listbox');

  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ctl = createCombobox({
        input: this.inputEl().nativeElement,
        listbox: this.listEl().nativeElement,
        anchor: host,
        openOnFocus: this.openOnFocus(),
        placement: this.placement(),
        onSelect: (value) => {
          this.value.set(value);
          this.query.set(null);
          this.onChange(value);
        },
        onOpenChange: (open) => !open && this.query.set(null),
      });
      destroyRef.onDestroy(ctl.destroy);
    });
  }
  writeValue(value: string | null) {
    this.value.set(value ?? null);
  }
}

// ── Command palette ──

@Component({
  selector: 'mn-command',
  imports: [MnIcon],
  template: `
    <div [class]="s.inputWrap()">
      <svg mnIcon [icon]="icons.search"></svg>
      <input #input [attr.aria-label]="placeholder()" [placeholder]="placeholder()" [class]="s.input()" [value]="query()" (input)="query.set($any($event.target).value)" />
    </div>
    <div #list [class]="s.list()">
      @for (g of groups(); track g.group) {
        <div [attr.role]="g.group ? 'group' : null" [attr.aria-label]="g.group || null">
          @if (g.group) {
            <div [class]="s.groupLabel()" aria-hidden="true">{{ g.group }}</div>
          }
          @for (o of g.options; track o.value) {
            <div role="option" [attr.data-value]="o.value" [attr.aria-disabled]="o.disabled || null" [class]="s.item()">
              <span class="flex min-w-0 flex-col">
                {{ o.label }}
                @if (o.description) {
                  <span [class]="s.itemDescription()">{{ o.description }}</span>
                }
              </span>
              @if (o.shortcut) {
                <span [class]="s.shortcut()">{{ hotkeyLabel(o.shortcut) }}</span>
              }
            </div>
          }
        </div>
      }
      @if (visible().length === 0) {
        <div [class]="s.empty()">{{ emptyText() }}</div>
      }
    </div>
    @if (footer()) {
      <div [class]="s.footer()"><span>↑↓ navigate</span><span>↵ select</span><span>esc close</span></div>
    }
  `,
  host: { '[class]': 's.root()' },
})
export class MnCommand {
  readonly options = input.required<ListOption[]>();
  readonly placeholder = input('Type a command or search…');
  readonly emptyText = input('No results found.');
  readonly footer = input(true, { transform: booleanAttribute });
  readonly select = output<string>();
  readonly query = signal('');

  protected readonly s = command();
  protected readonly icons = { search: Search };
  protected readonly hotkeyLabel = formatHotkey;
  protected readonly visible = computed(() => filterOptions(this.options(), this.query()));
  protected readonly groups = computed(() => groupOptions(this.visible()));
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly listEl = viewChild.required<ElementRef<HTMLElement>>('list');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ctl = createCombobox({
        input: this.inputEl().nativeElement,
        listbox: this.listEl().nativeElement,
        inline: true,
        onSelect: (v) => this.select.emit(v),
      });
      destroyRef.onDestroy(ctl.destroy);
    });
  }
}

@Component({
  selector: 'mn-command-dialog',
  imports: [MnCommand],
  template: `
    <dialog #dialog aria-label="Command palette" [class]="dialogClass">
      <mn-command #cmd [options]="options()" [placeholder]="placeholder()" (select)="choose($event)" />
    </dialog>
  `,
  host: { class: 'contents' },
})
export class MnCommandDialog {
  readonly options = input.required<ListOption[]>();
  readonly open = model(false);
  readonly placeholder = input('Type a command or search…');
  /** Global shortcut that opens the palette; empty string disables it. */
  readonly hotkey = input('mod+k');
  readonly select = output<string>();

  protected readonly dialogClass = commandDialog();
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cmd = viewChild.required<MnCommand>('cmd');
  private controller?: DialogController;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.controller = createDialog(this.dialogEl().nativeElement, {
        onOpenChange: (open) => {
          this.open.set(open);
          if (!open) setTimeout(() => this.cmd().query.set(''), 200);
        },
      });
      const off = this.hotkey() ? onHotkey(this.hotkey(), () => this.open.set(true)) : undefined;
      destroyRef.onDestroy(() => {
        this.controller?.destroy();
        off?.();
      });
      if (this.open()) this.controller.open();
    });
    effect(() => {
      if (this.open()) this.controller?.open();
      else this.controller?.close();
    });
  }
  protected choose(value: string) {
    this.open.set(false);
    this.select.emit(value);
  }
}

// ── Calendar ──

@Component({
  selector: 'mn-calendar',
  imports: [MnIcon],
  providers: [accessor(MnCalendar)],
  template: `
    <div [class]="s().header()">
      <button type="button" [class]="s().nav()" aria-label="Previous month" [disabled]="prevDisabled()" (click)="goMonth(-1)">
        <svg mnIcon [icon]="icons.prev"></svg>
      </button>
      <div [class]="s().title()" aria-live="polite">{{ title() }}</div>
      <button type="button" [class]="s().nav()" aria-label="Next month" [disabled]="nextDisabled()" (click)="goMonth(1)">
        <svg mnIcon [icon]="icons.next"></svg>
      </button>
    </div>
    <table #grid role="grid" [attr.aria-label]="title()" [class]="s().grid()" (keydown)="onKeydown($event)">
      <thead>
        <tr>
          @for (w of weekdays(); track w.long) {
            <th scope="col" [attr.abbr]="w.long" [class]="s().weekday()">{{ w.short }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of weeks(); track week[0]!.date) {
          <tr>
            @for (day of week; track day.date) {
              <td [class]="s().cell()" [attr.aria-selected]="day.date === value() || null">
                <button
                  type="button"
                  [attr.data-date]="day.date"
                  [attr.data-outside]="day.inMonth ? null : ''"
                  [attr.data-today]="day.isToday ? '' : null"
                  [attr.data-selected]="day.date === value() ? '' : null"
                  [attr.aria-current]="day.isToday ? 'date' : null"
                  [attr.aria-label]="label(day.date)"
                  [tabIndex]="day.date === focused() ? 0 : -1"
                  [disabled]="disabledDate(day.date) || formDisabled()"
                  [class]="s().day()"
                  (click)="choose(day.date)"
                >
                  {{ day.day }}
                </button>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { '[class]': 's().root()' },
})
export class MnCalendar extends ValueAccessor<ISODate | null> {
  readonly value = model<ISODate | null>(null);
  readonly min = input<ISODate>();
  readonly max = input<ISODate>();
  readonly isDateDisabled = input<(date: ISODate) => boolean>();
  readonly locale = input<string>();
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's convention. */
  readonly weekStartsOn = input<number>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  readonly autoFocus = input(false, { transform: booleanAttribute });

  protected readonly icons = { prev: ChevronLeft, next: ChevronRight };
  protected readonly s = computed(() => calendar({ size: this.size(), tone: this.tone() }));
  private readonly constraints = computed(() => ({ min: this.min(), max: this.max(), isDateDisabled: this.isDateDisabled() }));
  protected readonly focused = signal<ISODate>(todayISO());
  protected readonly month = signal<ISODate>(startOfMonth(todayISO()));
  private readonly weekStart = computed(() => this.weekStartsOn() ?? getWeekStart(this.locale()));
  protected readonly weeks = computed(() => getCalendarWeeks(this.month(), { weekStartsOn: this.weekStart() }));
  protected readonly weekdays = computed(() => getWeekdayNames({ locale: this.locale(), weekStartsOn: this.weekStart(), format: 'narrow' }));
  protected readonly title = computed(() => formatMonthYear(this.month(), this.locale()));
  protected readonly prevDisabled = computed(() => !!this.min() && compareISO(this.month(), startOfMonth(this.min()!)) <= 0);
  protected readonly nextDisabled = computed(() => !!this.max() && compareISO(addMonths(this.month(), 1), this.max()!) > 0);
  private readonly grid = viewChild.required<ElementRef<HTMLTableElement>>('grid');
  private pendingFocus = false;

  constructor() {
    super();
    effect(() => {
      const v = this.value();
      if (v) {
        this.focused.set(v);
        this.month.set(startOfMonth(v));
      }
    });
    afterNextRender(() => {
      if (!this.value()) {
        const start = clampToEnabled(todayISO(), 1, this.constraints()) ?? todayISO();
        this.focused.set(start);
        this.month.set(startOfMonth(start));
      }
      if (this.autoFocus()) this.focusDay();
    });
  }

  protected label(date: ISODate) {
    return formatDate(date, this.locale(), { dateStyle: 'full' });
  }
  protected disabledDate(date: ISODate) {
    return isDateDisabled(date, this.constraints());
  }
  protected goMonth(delta: number) {
    const next = addMonths(this.month(), delta);
    this.month.set(next);
    this.focused.set(next);
  }
  protected choose(date: ISODate) {
    this.value.set(date);
    this.focused.set(date);
    this.onChange(date);
    this.onTouched();
  }
  protected onKeydown(event: KeyboardEvent) {
    const date = (event.target as HTMLElement).dataset['date'];
    if (!date) return;
    const dir = getComputedStyle(event.currentTarget as Element).direction === 'rtl' ? 'rtl' : 'ltr';
    const target = getCalendarKeyTarget(event.key, date, { weekStartsOn: this.weekStart(), shiftKey: event.shiftKey, dir });
    if (!target) return;
    event.preventDefault();
    const next = clampToEnabled(target, compareISO(target, date) >= 0 ? 1 : -1, this.constraints()) ?? date;
    this.focused.set(next);
    this.month.set(startOfMonth(next));
    this.focusDay();
  }
  private focusDay() {
    if (this.pendingFocus) return;
    this.pendingFocus = true;
    queueMicrotask(() =>
      requestAnimationFrame(() => {
        this.pendingFocus = false;
        this.grid().nativeElement.querySelector<HTMLElement>(`[data-date="${this.focused()}"]`)?.focus();
      }),
    );
  }
  writeValue(value: ISODate | null) {
    this.value.set(value ?? null);
  }
}

// ── Date picker ──

@Component({
  selector: 'mn-date-picker',
  imports: [MnIcon, MnCalendar],
  providers: [accessor(MnDatePicker)],
  template: `
    <button
      #trigger
      type="button"
      [id]="inputId() ?? field?.controlId() ?? null"
      [attr.aria-describedby]="field?.describedBy() ?? null"
      [attr.aria-invalid]="field?.error() ? 'true' : null"
      [disabled]="disabled() || formDisabled()"
      [class]="s().trigger()"
    >
      <svg mnIcon [icon]="icons.calendar"></svg>
      <span [class]="value() ? s().value() : s().placeholder()">{{ display() }}</span>
    </button>
    <div #content popover="auto" aria-label="Choose date" [class]="s().content()">
      @if (open()) {
        <mn-calendar
          autoFocus
          [value]="value()"
          [min]="min()"
          [max]="max()"
          [isDateDisabled]="isDateDisabled()"
          [locale]="locale()"
          [weekStartsOn]="weekStartsOn()"
          (valueChange)="choose($event)"
        />
      }
    </div>
    @if (name()) {
      <input type="hidden" [name]="name()!" [value]="value() ?? ''" />
    }
  `,
  host: { class: 'contents' },
})
export class MnDatePicker extends ValueAccessor<ISODate | null> {
  readonly value = model<ISODate | null>(null);
  readonly placeholder = input('Pick a date');
  /** Form field name; a hidden input carries the ISO value. */
  readonly name = input<string>();
  readonly min = input<ISODate>();
  readonly max = input<ISODate>();
  readonly isDateDisabled = input<(date: ISODate) => boolean>();
  readonly locale = input<string>();
  readonly weekStartsOn = input<number>();
  readonly format = input<Intl.DateTimeFormatOptions>();
  readonly placement = input<Placement>('bottom-start');
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();

  protected readonly field = inject(MnField, { optional: true });
  protected readonly icons = { calendar: CalendarIcon };
  protected readonly s = computed(() => datePicker({ size: this.size() }));
  protected readonly open = signal(false);
  protected readonly display = computed(() => {
    const v = this.value();
    return v ? formatDate(v, this.locale(), this.format()) : this.placeholder();
  });
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  private controller?: PopoverController;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.controller = createPopover({
        trigger: this.trigger().nativeElement,
        content: this.content().nativeElement,
        placement: this.placement(),
        autoFocus: false,
        onOpenChange: (open) => {
          this.open.set(open);
          if (!open) this.onTouched();
        },
      });
      destroyRef.onDestroy(() => this.controller?.destroy());
    });
  }
  protected choose(value: ISODate | null) {
    this.value.set(value);
    if (value) this.onChange(value);
    this.controller?.close();
  }
  writeValue(value: ISODate | null) {
    this.value.set(value ?? null);
  }
}

// ── Toggle group ──

@Component({
  selector: 'mn-toggle-group',
  template: `<ng-content />`,
  host: { role: 'group', '[attr.data-orientation]': 'orientation()', '[class]': 'slots().root()' },
})
export class MnToggleGroup {
  readonly type = input<'single' | 'multiple'>('single');
  /** `string | null` for single, `string[]` for multiple. */
  readonly value = model<string | null | string[]>(null);
  readonly variant = input<'segmented' | 'outline' | 'ghost'>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly slots = computed(() => toggleGroup({ variant: this.variant(), size: this.size(), tone: this.tone() }));
  private readonly list = computed(() => {
    const v = this.value();
    return Array.isArray(v) ? v : v ? [v] : [];
  });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => destroyRef.onDestroy(createRovingFocus(el, { selector: 'button', orientation: this.orientation() }).destroy));
  }
  isPressed(value: string) {
    return this.list().includes(value);
  }
  toggle(value: string) {
    const list = this.list();
    if (this.type() === 'multiple') this.value.set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
    else this.value.set(this.value() === value ? null : value);
  }
}

@Directive({
  selector: 'button[mnToggleGroupItem]',
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'group.isPressed(value())',
    '[disabled]': 'disabled() || group.disabled()',
    '[class]': 'group.slots().item()',
    '(click)': 'group.toggle(value())',
  },
})
export class MnToggleGroupItem {
  readonly value = input.required<string>({ alias: 'mnToggleGroupItem' });
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly group = inject(MnToggleGroup);
}
