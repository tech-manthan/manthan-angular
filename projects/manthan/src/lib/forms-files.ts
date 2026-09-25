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
import { NG_VALUE_ACCESSOR, type AbstractControl, type ControlValueAccessor, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { File as FileIcon, Upload, X } from '@manthan/icons';
import {
  closeButton,
  createForm,
  fileUpload,
  formatBytes,
  runRules,
  validateFiles,
  type FileRejection,
  type FormOptions,
  type FormStore,
  type FormValues,
  type Rule,
} from '@manthan/base';
import { createDropzone, setInputFiles } from '@manthan/base/dom';
import { MnField } from './form';
import { MnIcon } from './icon';

// ── Reactive Forms bridge ──

/**
 * Use Manthan rules as an Angular validator:
 * `new FormControl('', mnValidator(rules.required(), rules.email()))`.
 * The first message is stored under `errors.mn`, ready for `<mn-field [error]>`.
 */
export function mnValidator(...list: Rule[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const values = control.parent?.getRawValue?.() ?? {};
    const result = runRules(control.value, values, list);
    if (result instanceof Promise) return null; // use an async validator for async rules
    return result ? { mn: result } : null;
  };
}

/** The Manthan error message of a control once it was touched: `mnError(form.controls.email)`. */
export const mnError = (control: AbstractControl | null | undefined): string | null =>
  control && (control.touched || control.dirty) && control.errors?.['mn'] ? (control.errors['mn'] as string) : null;

// ── Signal forms ──

export interface FormHandle<V extends FormValues> {
  store: FormStore<V>;
  values: () => V;
  /** Errors that should be shown now (field visited or form submitted). */
  errors: () => { [K in keyof V]?: string };
  submitting: () => boolean;
  dirty: () => boolean;
  setValue<K extends keyof V>(name: K, value: V[K]): void;
  blur(name: keyof V): void;
  reset(values?: V): void;
  handleSubmit(event?: Event): void;
}

/** Manthan's `createForm` store as Angular signals. Call in an injection context. */
export function injectForm<V extends FormValues>(options: FormOptions<V>): FormHandle<V> {
  const store = createForm<V>(options);
  const state = signal(store.getSnapshot());
  inject(DestroyRef).onDestroy(store.subscribe(() => state.set(store.getSnapshot())));
  const errors = computed(() => {
    const s = state();
    return Object.fromEntries(Object.keys({ ...s.values, ...options.rules }).map((k) => [k, store.visibleError(k as keyof V)])) as {
      [K in keyof V]?: string;
    };
  });
  return {
    store,
    values: () => state().values,
    errors,
    submitting: () => state().submitting,
    dirty: () => state().dirty,
    setValue: store.setValue,
    blur: store.blur,
    reset: store.reset,
    handleSubmit: (event) => void store.submit(event),
  };
}

/** Bind a native control to an `injectForm` handle: `<input mnInput [mnFormField]="form" name="email">`. */
@Directive({
  selector: 'input[mnFormField][name], textarea[mnFormField][name], select[mnFormField][name]',
  host: {
    '[attr.aria-invalid]': 'error() ? "true" : null',
    '(input)': 'write($event)',
    '(change)': 'write($event)',
    '(blur)': 'form().blur(name())',
  },
})
export class MnFormField<V extends FormValues = FormValues> {
  readonly form = input.required<FormHandle<V>>({ alias: 'mnFormField' });
  readonly name = input.required<keyof V & string>();
  protected readonly error = computed(() => this.form().errors()[this.name()]);
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  constructor() {
    effect(() => {
      const value = this.form().values()[this.name()];
      if (this.el.type === 'checkbox') this.el.checked = !!value;
      else if (this.el.value !== String(value ?? '')) this.el.value = String(value ?? '');
    });
  }
  protected write(event: Event) {
    const target = event.target as HTMLInputElement;
    this.form().setValue(this.name(), (target.type === 'checkbox' ? target.checked : target.value) as V[keyof V & string]);
    if (target.type === 'checkbox') this.form().blur(this.name());
  }
}

// ── File upload ──

@Component({
  selector: 'mn-file-upload',
  imports: [MnIcon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MnFileUpload), multi: true }],
  template: `
    <div
      #zone
      [id]="field?.controlId() ?? null"
      [attr.aria-label]="label()"
      [attr.aria-describedby]="field?.describedBy() ?? null"
      [attr.aria-disabled]="disabled() || formDisabled() || null"
      [attr.aria-invalid]="errors().length > 0 || field?.error() ? 'true' : null"
      [class]="s().dropzone()"
    >
      <span [class]="s().icon()"><svg mnIcon [icon]="icons.upload"></svg></span>
      <p [class]="s().title()">{{ label() }}</p>
      @if (hint()) {
        <p [class]="s().hint()">{{ hint() }}</p>
      }
    </div>
    <input #input type="file" class="sr-only" tabindex="-1" aria-hidden="true" [attr.name]="name() ?? null" [attr.accept]="accept() ?? null" [multiple]="multiple()" [disabled]="disabled()" />
    @if (errors().length) {
      <div role="alert" [class]="s().errors()">
        @for (e of errors(); track e) {
          <p>{{ e }}</p>
        }
      </div>
    }
    @if (files().length) {
      <ul [class]="s().list()">
        @for (file of files(); track $index) {
          <li [class]="s().item()">
            <span [class]="s().itemIcon()"><svg mnIcon [icon]="icons.file"></svg></span>
            <div [class]="s().itemBody()">
              <span [class]="s().itemName()">{{ file.name }}</span>
              <span [class]="s().itemMeta()">{{ fileSize(file) }}</span>
            </div>
            <button type="button" [attr.aria-label]="'Remove ' + file.name" [class]="closeClass" (click)="removeAt($index)"><svg mnIcon [icon]="icons.x"></svg></button>
          </li>
        }
      </ul>
    }
  `,
  host: { '[class]': 's().root()' },
})
export class MnFileUpload implements ControlValueAccessor {
  readonly files = model<File[]>([]);
  /** Same syntax as `<input accept>`, e.g. `".pdf,image/*"`. */
  readonly accept = input<string>();
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Bytes. */
  readonly maxSize = input<number>();
  readonly maxFiles = input<number>();
  /** Posts the files with the surrounding form. */
  readonly name = input<string>();
  readonly label = input('Drop files here, or click to browse');
  readonly hint = input<string>();
  readonly size = input<'sm' | 'md'>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly reject = output<FileRejection<File>[]>();

  protected readonly field = inject(MnField, { optional: true });
  protected readonly icons = { upload: Upload, file: FileIcon, x: X };
  protected readonly closeClass = closeButton();
  protected readonly s = computed(() => fileUpload({ size: this.size() }));
  protected readonly errors = signal<string[]>([]);
  protected readonly formDisabled = signal(false);
  private readonly zone = viewChild.required<ElementRef<HTMLElement>>('zone');
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private onChange: (files: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      destroyRef.onDestroy(createDropzone({ zone: this.zone().nativeElement, input: this.inputEl().nativeElement, onFiles: (f) => this.add(f) }));
    });
    effect(() => {
      const files = this.files();
      const el = this.inputEl();
      setInputFiles(el.nativeElement, files);
    });
  }

  protected fileSize(file: File) {
    return formatBytes(file.size);
  }
  private set(files: File[]) {
    this.files.set(files);
    this.onChange(files);
    this.onTouched();
  }
  private add(incoming: File[]) {
    const multiple = this.multiple();
    const current = this.files();
    const { accepted, rejected } = validateFiles(incoming, {
      accept: this.accept(),
      maxSize: this.maxSize(),
      maxFiles: multiple ? this.maxFiles() : 1,
      existing: multiple ? current.length : 0,
    });
    this.errors.set(rejected.map((r) => r.message));
    if (rejected.length) this.reject.emit(rejected);
    if (accepted.length) this.set(multiple ? [...current, ...accepted] : accepted);
  }
  protected removeAt(index: number) {
    this.set(this.files().filter((_, i) => i !== index));
  }
  writeValue(value: File[] | null) {
    this.files.set(value ?? []);
  }
  registerOnChange(fn: (files: File[]) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean) {
    this.formDisabled.set(disabled);
  }
}
