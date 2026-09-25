# @manthan/angular

[Manthan UI](https://github.com/tech-manthan/manthan-base) for **Angular 22**: standalone, signal-based, zoneless-friendly directives and components in **11 design styles**, styled with **Tailwind CSS v4**.

Native elements get attribute directives (as Angular Material does with `matInput`), so `ngModel`, reactive forms and validation work unchanged. Composite controls (`mn-checkbox`, `mn-switch`, `mn-radio-group`, `mn-select`) implement `ControlValueAccessor` and also support two-way signal binding.

```bash
npm i @manthan/angular @manthan/base @manthan/icons tailwindcss @tailwindcss/postcss
```

```css
/* styles.css */
@import 'tailwindcss';
@import '@manthan/angular/theme.css';
```

```ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MN_COMPONENTS, toast } from '@manthan/angular';
import { Mail } from '@manthan/icons';

@Component({
  selector: 'app-root',
  imports: [MN_COMPONENTS, FormsModule],
  template: `
    <mn-field label="Email" [error]="email ? null : 'Required'">
      <input mnInput type="email" [(ngModel)]="email" />
    </mn-field>

    <button mnButton tone="danger" [mnDialogTrigger]="confirm">Delete</button>
    <mn-dialog #confirm title="Delete project?" description="This cannot be undone.">
      <div mnDialogFooter><button mnButton mnDialogClose>Cancel</button></div>
    </mn-dialog>

    <button mnButton [mnMenuTrigger]="menu">Account</button>
    <mn-menu #menu><button mnMenuItem (select)="profile()">Profile</button></mn-menu>

    <button mnButton iconOnly mnTooltip="Save" (click)="save()"><svg mnIcon [icon]="Mail"></svg></button>
    <mn-toaster />
  `,
})
export class App {
  email = '';
  Mail = Mail;
  save() { toast.success('Saved'); }
  profile() {}
}
```

Set the style on `<html data-mn-style="fluent" data-mn-theme="dark">`: `default`, `glass`, `neu`, `brutal`, `material`, `fluent`, `clay`, `retro`, `neon`, `minimal`, `skeuo`.

## API

| Group | Selectors |
| --- | --- |
| Actions | `button[mnButton]` / `a[mnButton]` (`variant`, `tone`, `size`, `loading`, `iconOnly`), `[mnButtonGroup]` |
| Forms | `mn-field`, `input[mnInput]`, `mn-input-group` (`[mnStart]` / `[mnEnd]`), `textarea[mnTextarea]`, `input[type=range][mnSlider]`, `mn-select`, `mn-checkbox`, `mn-switch`, `mn-radio-group` + `mn-radio` |
| Display | `[mnCard]` (+ `[mnCardHeader]`, `[mnCardTitle]`, `[mnCardDescription]`, `[mnCardContent]`, `[mnCardFooter]`), `[mnBadge]`, `mn-avatar`, `[mnAvatarGroup]`, `[mnTableContainer]` + `table[mnTable]` parts, `kbd[mnKbd]`, `mn-separator`, `[mnHeading]`, `svg[mnIcon]` |
| Navigation | `[mnTabs]` (+ `[mnTabsList]`, `button[mnTabsTrigger]`, `[mnTabsContent]`), `mn-accordion` + `mn-accordion-item`, `mn-breadcrumb`, `mn-pagination` |
| Overlays | `mn-dialog` + `[mnDialogTrigger]` / `[mnDialogClose]` / `[mnDialogFooter]`, `mn-popover` + `[mnPopoverTrigger]`, `mn-menu` + `[mnMenuTrigger]` + `button[mnMenuItem]`, `[mnTooltip]`, `mn-toaster` + `toast()` |
| Feedback | `mn-alert`, `mn-progress`, `mn-progress-circle`, `mn-spinner`, `mn-skeleton` |
| Advanced | `mn-combobox` (CVA, filtering, groups), `mn-command` + `mn-command-dialog` (⌘K, `[(open)]`), `mn-calendar`, `mn-date-picker` (CVA, ISO `YYYY-MM-DD`, `name` for forms), `mn-toggle-group` + `button[mnToggleGroupItem]` |

Import individual classes (`MnButton`, `MnDialog`…) or `MN_COMPONENTS`. Recipes and helpers from `@manthan/base` are re-exported.

## Development

This is an Angular CLI workspace: `projects/manthan` is the library and `projects/playground` is the demo app. The Angular 22 CLI needs Node ≥ 22.22.3 or ≥ 24.15.

```bash
npm run dev          # ng serve playground
npm test             # ng test (Vitest)
npm run build        # ng-packagr → dist/manthan
```

## License

MIT
