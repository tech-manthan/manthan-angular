import { Component, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MN_COMPONENTS } from '@manthan/angular';

const slug = new URLSearchParams(location.search).get('c');

@Component({
  selector: 'app-demo-button',
  imports: [MN_COMPONENTS],
  template: `<button mnButton variant="soft" tone="primary">Click me</button>`,
})
class ButtonDemo {}

@Component({
  selector: 'app-demo-input',
  imports: [MN_COMPONENTS, FormsModule],
  template: `<input mnInput [(ngModel)]="value" placeholder="you@example.com" />`,
})
class InputDemo {
  protected value = '';
}

@Component({
  selector: 'app-demo-dialog',
  imports: [MN_COMPONENTS],
  template: `
    <button mnButton [mnDialogTrigger]="dlg">Open</button>
    <mn-dialog #dlg title="Delete project?" description="This permanently deletes the project.">Are you sure?</mn-dialog>
  `,
})
class DialogDemo {}

@Component({
  selector: 'app-demo-data-table',
  imports: [MN_COMPONENTS],
  template: `<mn-data-table [columns]="columns" [rows]="rows" [pageSize]="3" />`,
})
class DataTableDemo {
  protected rows = [
    { id: 'INV-1001', customer: 'Ada Lovelace', status: 'Paid' },
    { id: 'INV-1002', customer: 'Alan Turing', status: 'Pending' },
    { id: 'INV-1003', customer: 'Grace Hopper', status: 'Overdue' },
  ];
  protected columns = [
    { key: 'id', header: 'Invoice' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status' },
  ];
}

const demos: Record<string, Type<unknown>> = {
  button: ButtonDemo,
  input: InputDemo,
  dialog: DialogDemo,
  'data-table': DataTableDemo,
};

@Component({
  // Reuses App's selector ('app-root'): only one of App/DemoRoot is ever
  // bootstrapped (see main.ts), and bootstrapApplication requires its
  // component's selector to already exist in index.html — index.html only
  // has <app-root>, so DemoRoot must bind to that same host element rather
  // than a second selector index.html was never given.
  selector: 'app-root',
  imports: [MN_COMPONENTS, NgComponentOutlet],
  template: `
    @if (demo) {
      <ng-container *ngComponentOutlet="demo" />
    } @else {
      <p>Demo not found for "{{ slug }}".</p>
    }
  `,
})
export class DemoRoot {
  protected readonly slug = slug;
  protected readonly demo = slug ? demos[slug] : undefined;
}
