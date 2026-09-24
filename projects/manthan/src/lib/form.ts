import {
  Component,
  Directive,
  DoCheck,
  ElementRef,
  booleanAttribute,
  computed,

  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Check, ChevronDown, Minus } from '@manthan/icons';
import {
  checkbox,
  field,
  input as inputRecipe,
  radio,
  radioGroup,
  select,
  slider,
  switchRecipe,
  textarea,
  valueToPercent,
  type Tone,
} from '@manthan/base';
import { MnIcon } from './icon';

let nextId = 0;

// ── Field ──

@Component({
  selector: 'mn-field',
  template: `
    @if (label()) {
      <label [attr.for]="controlId()" [class]="slots().label()">{{ label() }}</label>
    }
    <ng-content />
    @if (description()) {
      <p [id]="controlId() + '-description'" [class]="slots().description()">{{ description() }}</p>
    }
    @if (error()) {
      <p [id]="controlId() + '-error'" [class]="slots().error()">{{ error() }}</p>
    }
  `,
  host: { '[class]': 'slots().root()' },
})
export class MnField {
  readonly label = input<string>();
  readonly description = input<string>();
  /** Error message; also marks the control aria-invalid. */
  readonly error = input<string | null>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly for = input<string>();

  private readonly autoId = `mn-field-${++nextId}`;
  readonly controlId = computed(() => this.for() ?? this.autoId);
  readonly describedBy = computed(
    () =>
      [this.description() && `${this.controlId()}-description`, this.error() && `${this.controlId()}-error`]
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly slots = computed(() => field({ required: this.required(), disabled: this.disabled() }));
}

/** Shared host bindings for native controls inside an `mn-field`. */
@Directive({
  host: {
    '[id]': 'id() ?? field?.controlId() ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.error() ? "true" : null',
    '[attr.required]': 'field?.required() ? "" : null',
  },
})
export class MnFieldControl {
  readonly id = input<string>();
  protected readonly field = inject(MnField, { optional: true });
}

// ── Native controls: work with ngModel / reactive forms out of the box ──

@Directive({
  selector: 'input[mnInput]',
  hostDirectives: [{ directive: MnFieldControl, inputs: ['id'] }],
  host: { '[class]': 'classes()' },
})
export class MnInput {
  readonly size = input<'sm' | 'md' | 'lg'>();
  /** Set when an adornment sits at the start/end (see `mn-input-group`). */
  readonly withStart = input(false, { transform: booleanAttribute });
  readonly withEnd = input(false, { transform: booleanAttribute });
  protected readonly classes = computed(() =>
    inputRecipe({ size: this.size(), withStart: this.withStart(), withEnd: this.withEnd() }),
  );
}

@Directive({
  selector: 'textarea[mnTextarea]',
  hostDirectives: [{ directive: MnFieldControl, inputs: ['id'] }],
  host: { '[class]': 'classes()' },
})
export class MnTextarea {
  readonly resize = input<'none' | 'vertical' | 'auto'>();
  protected readonly classes = computed(() => textarea({ resize: this.resize() }));
}

@Directive({
  selector: 'input[type=range][mnSlider]',
  hostDirectives: [{ directive: MnFieldControl, inputs: ['id'] }],
  host: { '[class]': 'classes()' },
})
export class MnSlider implements DoCheck {
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  protected readonly classes = computed(() => slider({ size: this.size(), tone: this.tone() }));
  // ngModel and form controls write `value` without events, so re-sync on every check.
  ngDoCheck() {
    const { value, min, max } = this.el;
    this.el.style.setProperty('--mn-fill', `${valueToPercent(Number(value), Number(min || 0), Number(max || 100))}%`);
  }
}

/** Wrapper for icons at the start/end of an `input[mnInput]`. */
@Component({
  selector: 'mn-input-group',
  template: `
    <span class="pointer-events-none absolute start-3 flex items-center text-fg-subtle [&_svg]:size-4"><ng-content select="[mnStart]" /></span>
    <ng-content />
    <span class="absolute end-3 flex items-center text-fg-subtle [&_svg]:size-4"><ng-content select="[mnEnd]" /></span>
  `,
  host: { class: 'mn-input-group relative flex w-full items-center' },
})
export class MnInputGroup {}

// ── Composite controls (ControlValueAccessor + two-way signals) ──

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

const accessor = (type: unknown) => ({ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => type), multi: true });

@Component({
  selector: 'mn-select',
  imports: [MnIcon],
  providers: [accessor(MnSelect)],
  template: `
    <select
      [class]="slots().select()"
      [id]="inputId() ?? field?.controlId() ?? null"
      [attr.aria-describedby]="field?.describedBy() ?? null"
      [attr.aria-invalid]="field?.error() ? 'true' : null"
      [attr.aria-label]="ariaLabel() ?? null"
      [disabled]="disabled() || formDisabled()"
      (change)="select($event)"
      (blur)="onTouched()"
    >
      @if (placeholder()) {
        <option value="" disabled [selected]="!value()">{{ placeholder() }}</option>
      }
      @for (o of normalized(); track o.value) {
        <option [value]="o.value" [disabled]="o.disabled" [selected]="o.value === value()">{{ o.label ?? o.value }}</option>
      }
    </select>
    <svg mnIcon [icon]="ChevronDown" [class]="slots().icon()"></svg>
  `,
  host: { '[class]': 'slots().root()' },
})
export class MnSelect extends ValueAccessor<string> {
  readonly options = input<Array<string | { value: string; label?: string; disabled?: boolean }>>([]);
  readonly value = model<string>('');
  readonly placeholder = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly ariaLabel = input<string>();
  protected readonly field = inject(MnField, { optional: true });
  protected readonly ChevronDown = ChevronDown;
  protected readonly slots = computed(() => select({ size: this.size() }));
  protected readonly normalized = computed(() =>
    this.options().map((o) => (typeof o === 'string' ? { value: o, label: o, disabled: false } : o)),
  );
  writeValue(value: string) {
    this.value.set(value ?? '');
  }
  protected select(event: Event) {
    const next = (event.target as HTMLSelectElement).value;
    this.value.set(next);
    this.onChange(next);
  }
}

@Component({
  selector: 'mn-checkbox',
  imports: [MnIcon],
  providers: [accessor(MnCheckbox)],
  template: `
    <label [class]="slots().label()">
      <span [class]="slots().root()">
        <input
          type="checkbox"
          [class]="slots().input()"
          [checked]="checked()"
          [indeterminate]="indeterminate()"
          [attr.aria-checked]="indeterminate() ? 'mixed' : null"
          [attr.name]="name() ?? null"
          [attr.aria-label]="ariaLabel() ?? null"
          [disabled]="disabled() || formDisabled()"
          (change)="toggle($event)"
          (blur)="onTouched()"
        />
        <span [class]="slots().control()">
          <svg mnIcon [icon]="Check" [strokeWidth]="3" [class]="slots().check()"></svg>
          <svg mnIcon [icon]="Minus" [strokeWidth]="3" [class]="slots().minus()"></svg>
        </span>
      </span>
      @if (label() || description()) {
        <span [class]="slots().text()">
          {{ label() }}
          @if (description()) {
            <span [class]="slots().description()">{{ description() }}</span>
          }
        </span>
      }
    </label>
  `,
  host: { class: 'contents' },
})
export class MnCheckbox extends ValueAccessor<boolean> {
  readonly checked = model(false);
  readonly indeterminate = model(false);
  readonly label = input<string>();
  readonly description = input<string>();
  readonly name = input<string>();
  readonly ariaLabel = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly Check = Check;
  protected readonly Minus = Minus;
  protected readonly slots = computed(() => checkbox({ size: this.size(), tone: this.tone() }));
  writeValue(value: boolean) {
    this.checked.set(!!value);
  }
  protected toggle(event: Event) {
    const next = (event.target as HTMLInputElement).checked;
    this.indeterminate.set(false);
    this.checked.set(next);
    this.onChange(next);
  }
}

@Component({
  selector: 'mn-switch',
  providers: [accessor(MnSwitch)],
  template: `
    <label [class]="slots().label()">
      <span [class]="slots().root()">
        <input
          type="checkbox"
          role="switch"
          [class]="slots().input()"
          [checked]="checked()"
          [attr.aria-label]="ariaLabel() ?? null"
          [disabled]="disabled() || formDisabled()"
          (change)="toggle($event)"
          (blur)="onTouched()"
        />
        <span [class]="slots().track()"><span [class]="slots().thumb()"></span></span>
      </span>
      {{ label() }}<ng-content />
    </label>
  `,
  host: { class: 'contents' },
})
export class MnSwitch extends ValueAccessor<boolean> {
  readonly checked = model(false);
  readonly label = input<string>();
  readonly ariaLabel = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly slots = computed(() => switchRecipe({ size: this.size(), tone: this.tone() }));
  writeValue(value: boolean) {
    this.checked.set(!!value);
  }
  protected toggle(event: Event) {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
  }
}

@Component({
  selector: 'mn-radio-group',
  providers: [accessor(MnRadioGroup)],
  template: `<ng-content />`,
  host: {
    role: 'radiogroup',
    '[attr.aria-orientation]': 'orientation() ?? null',
    '[class]': 'classes()',
  },
})
export class MnRadioGroup extends ValueAccessor<string> {
  readonly value = model<string>();
  readonly name = input(`mn-radio-${++nextId}`);
  readonly orientation = input<'horizontal' | 'vertical'>();
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly tone = input<Tone>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly classes = computed(() => radioGroup({ orientation: this.orientation() }));
  writeValue(value: string) {
    this.value.set(value);
  }
  choose(value: string) {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}

@Component({
  selector: 'mn-radio',
  template: `
    <label [class]="slots().label()">
      <span [class]="slots().root()">
        <input
          type="radio"
          [class]="slots().input()"
          [value]="value()"
          [attr.name]="group?.name() ?? null"
          [checked]="group?.value() === value()"
          [disabled]="disabled() || group?.isDisabled()"
          (change)="group?.choose(value())"
        />
        <span [class]="slots().control()"><span [class]="slots().dot()"></span></span>
      </span>
      @if (label() || description()) {
        <span [class]="slots().text()">
          {{ label() }}
          @if (description()) {
            <span [class]="slots().description()">{{ description() }}</span>
          }
        </span>
      }
    </label>
  `,
  host: { class: 'contents' },
})
export class MnRadio {
  readonly value = input.required<string>();
  readonly label = input<string>();
  readonly description = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly group = inject(MnRadioGroup, { optional: true });
  protected readonly slots = computed(() => radio({ size: this.group?.size(), tone: this.group?.tone() }));
}

