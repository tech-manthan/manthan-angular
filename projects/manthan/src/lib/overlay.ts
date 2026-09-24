import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { X } from '@manthan/icons';
import {
  button,
  closeButton,
  dialog,
  menu,
  popover,
  spinner,
  toast as defaultToaster,
  toastRecipe,
  tooltip,
  type Placement,
  type ToastRecord,
  type ToastStore,
  type Tone,
} from '@manthan/base';
import {
  createDialog,
  createMenu,
  createPopover,
  createTooltip,
  toastIcons,
  type DialogController,
  type PopoverController,
} from '@manthan/base/dom';
import { MnIcon } from './icon';

let nextId = 0;

// ── Dialog / Drawer ──

@Component({
  selector: 'mn-dialog',
  imports: [MnIcon],
  template: `
    <dialog
      #el
      [attr.aria-labelledby]="title() ? id + '-title' : null"
      [attr.aria-describedby]="description() ? id + '-description' : null"
      [class]="slots().content()"
    >
      @if (title() || description()) {
        <div [class]="slots().header()">
          @if (title()) {
            <h2 [id]="id + '-title'" [class]="slots().title()">{{ title() }}</h2>
          }
          @if (description()) {
            <p [id]="id + '-description'" [class]="slots().description()">{{ description() }}</p>
          }
        </div>
      }
      <div [class]="slots().body()"><ng-content /></div>
      <div [class]="slots().footer('empty:hidden')"><ng-content select="[mnDialogFooter]" /></div>
      @if (showClose()) {
        <button type="button" aria-label="Close" [class]="closeClass()" (click)="close()"><svg mnIcon [icon]="X"></svg></button>
      }
    </dialog>
  `,
  host: { class: 'contents' },
})
export class MnDialog {
  readonly open = model(false);
  readonly title = input<string>();
  readonly description = input<string>();
  readonly placement = input<'center' | 'left' | 'right' | 'top' | 'bottom'>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>();
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly showClose = input(true, { transform: booleanAttribute });

  protected readonly id = `mn-dialog-${++nextId}`;
  protected readonly X = X;
  protected readonly slots = computed(() => dialog({ placement: this.placement(), size: this.size() }));
  protected readonly closeClass = computed(() => closeButton({ class: this.slots().close() }));
  private controller?: DialogController;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.controller = createDialog(host.querySelector('dialog')!, {
        closeOnBackdrop: this.closeOnBackdrop(),
        closeOnEscape: this.closeOnEscape(),
        onOpenChange: (open) => this.open.set(open),
      });
      if (this.open()) this.controller.open();
      destroyRef.onDestroy(() => this.controller?.destroy());
    });
    effect(() => {
      if (this.open()) this.controller?.open();
      else this.controller?.close();
    });
  }

  show() {
    this.open.set(true);
  }
  close() {
    this.open.set(false);
  }
}

/** Opens a dialog: `<button mnButton [mnDialogTrigger]="dlg">` … `<mn-dialog #dlg>`. */
@Directive({ selector: '[mnDialogTrigger]', host: { '(click)': 'dialog().show()', 'aria-haspopup': 'dialog' } })
export class MnDialogTrigger {
  readonly dialog = input.required<MnDialog>({ alias: 'mnDialogTrigger' });
}

/** Closes the enclosing `mn-dialog` when clicked. */
@Directive({ selector: '[mnDialogClose]', host: { '(click)': 'dialog?.close()' } })
export class MnDialogClose {
  protected readonly dialog = inject(MnDialog, { optional: true });
}

// ── Popover ──

@Component({
  selector: 'mn-popover',
  template: `
    @if (title()) {
      <h3 [class]="s.title()">{{ title() }}</h3>
    }
    @if (description()) {
      <p [class]="s.description()">{{ description() }}</p>
    }
    <ng-content />
  `,
  host: { popover: 'auto', '[class]': 's.content()' },
})
export class MnPopover {
  readonly title = input<string>();
  readonly description = input<string>();
  readonly placement = input<Placement>();
  readonly offset = input<number>();
  readonly openChange = output<boolean>();
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly s = popover();
  controller?: PopoverController;

  open() {
    this.controller?.open();
  }
  close() {
    this.controller?.close();
  }
}

/** `<button mnButton [mnPopoverTrigger]="pop">` … `<mn-popover #pop>`. */
@Directive({ selector: '[mnPopoverTrigger]' })
export class MnPopoverTrigger {
  readonly popover = input.required<MnPopover>({ alias: 'mnPopoverTrigger' });
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const target = this.popover();
      const ctl = createPopover({
        trigger: el,
        content: target.element,
        placement: target.placement(),
        offset: target.offset(),
        onOpenChange: (open) => target.openChange.emit(open),
      });
      target.controller = ctl;
      destroyRef.onDestroy(ctl.destroy);
    });
  }
}

// ── Menu ──

@Component({
  selector: 'mn-menu',
  template: `<ng-content />`,
  host: { popover: 'auto', role: 'menu', tabindex: '-1', '[class]': 'slots.content()' },
})
export class MnMenu {
  readonly placement = input<Placement>();
  readonly openChange = output<boolean>();
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly slots = menu();
}

/** `<button mnButton [mnMenuTrigger]="menu">` … `<mn-menu #menu>`. */
@Directive({ selector: '[mnMenuTrigger]' })
export class MnMenuTrigger {
  readonly menu = input.required<MnMenu>({ alias: 'mnMenuTrigger' });
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const target = this.menu();
      const ctl = createMenu({
        trigger: el,
        content: target.element,
        placement: target.placement(),
        onOpenChange: (open) => target.openChange.emit(open),
      });
      destroyRef.onDestroy(ctl.destroy);
    });
  }
}

@Component({
  selector: 'button[mnMenuItem]',
  template: `<ng-content />
    @if (shortcut()) {
      <span [class]="slots().shortcut()">{{ shortcut() }}</span>
    }`,
  host: {
    type: 'button',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-keep-open]': 'keepOpen() || null',
    '[class]': 'classes()',
    '(click)': 'disabled() || select.emit()',
  },
})
export class MnMenuItem {
  readonly tone = input<Tone>();
  readonly shortcut = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly keepOpen = input(false, { transform: booleanAttribute });
  readonly select = output<void>();
  private readonly parent = inject(MnMenu, { optional: true });
  protected readonly slots = computed(() => (this.tone() ? menu({ tone: this.tone() }) : (this.parent?.slots ?? menu())));
  protected readonly classes = computed(() => this.slots().item(this.tone() ? 'text-accent-11' : undefined));
}

@Directive({ selector: 'mn-menu-label', host: { '[class]': 'cls' } })
export class MnMenuLabel {
  protected readonly cls = `block ${(inject(MnMenu, { optional: true })?.slots ?? menu()).label()}`;
}

@Directive({ selector: 'mn-menu-separator', host: { role: 'separator', '[class]': 'cls' } })
export class MnMenuSeparator {
  protected readonly cls = `block ${(inject(MnMenu, { optional: true })?.slots ?? menu()).separator()}`;
}

// ── Tooltip ──

/** `<button mnButton mnTooltip="Copy">` */
@Directive({ selector: '[mnTooltip]' })
export class MnTooltip {
  readonly text = input.required<string>({ alias: 'mnTooltip' });
  readonly placement = input<Placement>(undefined, { alias: 'mnTooltipPlacement' });
  readonly openDelay = input<number>(undefined, { alias: 'mnTooltipOpenDelay' });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    const tip = document.createElement('div');
    tip.className = tooltip();
    effect(() => (tip.textContent = this.text()));
    afterNextRender(() => {
      document.body.append(tip);
      const ctl = createTooltip({ trigger: el, content: tip, placement: this.placement(), openDelay: this.openDelay() });
      destroyRef.onDestroy(() => {
        ctl.destroy();
        tip.remove();
      });
    });
  }
}

// ── Toaster ──

@Component({
  selector: 'mn-toaster',
  imports: [MnIcon],
  template: `
    <section
      [attr.aria-label]="label()"
      aria-live="polite"
      [class]="regionClass()"
      (pointerenter)="store().pause()"
      (pointerleave)="store().resume()"
    >
      @for (t of toasts(); track t.id) {
        <div [attr.role]="t.tone === 'danger' ? 'alert' : 'status'" [attr.data-state]="t.state" [class]="slotsFor(t).root()">
          @if (t.loading) {
            <span [class]="spinnerClass" aria-hidden="true"></span>
          } @else if (t.icon !== false && iconFor(t)) {
            <svg mnIcon [icon]="iconFor(t)!" [class]="slotsFor(t).icon()"></svg>
          }
          <div [class]="slotsFor(t).content()">
            @if (t.title) {
              <div [class]="slotsFor(t).title()">{{ t.title }}</div>
            }
            @if (t.description) {
              <div [class]="slotsFor(t).description()">{{ t.description }}</div>
            }
            @if (t.action) {
              <div [class]="slotsFor(t).actions()">
                <button type="button" [class]="actionClass" (click)="act(t)">{{ t.action.label }}</button>
              </div>
            }
          </div>
          <button type="button" aria-label="Dismiss notification" [class]="closeClass(t)" (click)="store().dismiss(t.id)">
            <svg mnIcon [icon]="X"></svg>
          </button>
        </div>
      }
    </section>
  `,
  host: { class: 'contents' },
})
export class MnToaster {
  readonly toaster = input<ToastStore>();
  readonly placement = input<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>(
    'bottom-right',
  );
  readonly label = input('Notifications');

  protected readonly store = computed(() => this.toaster() ?? defaultToaster);
  protected readonly toasts = signal<readonly ToastRecord[]>([]);
  protected readonly X = X;
  protected readonly spinnerClass = spinner({ size: 'sm', class: 'mt-0.5 text-accent-11' });
  protected readonly actionClass = button({ size: 'xs', variant: 'soft' });
  protected readonly regionClass = computed(() => toastRecipe({ placement: this.placement() }).region());

  constructor() {
    effect((onCleanup) => {
      const store = this.store();
      this.toasts.set(store.getSnapshot());
      onCleanup(store.subscribe(() => this.toasts.set(store.getSnapshot())));
    });
  }

  protected slotsFor(t: ToastRecord) {
    return toastRecipe({ placement: this.placement(), tone: t.tone });
  }
  protected iconFor(t: ToastRecord) {
    return t.tone ? toastIcons[t.tone] : undefined;
  }
  protected closeClass(t: ToastRecord) {
    return closeButton({ class: this.slotsFor(t).close() });
  }
  protected act(t: ToastRecord) {
    t.action?.onClick();
    this.store().dismiss(t.id);
  }
}
