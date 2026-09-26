import { Component, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MN_COMPONENTS } from '@manthan/angular';

const slug = new URLSearchParams(location.search).get('c');

@Component({
  selector: 'app-demo-button',
  imports: [MN_COMPONENTS],
  template: `<button mnButton variant="soft" tone="primary">Click me</button>`,
})
class ButtonDemo {}

const demos: Record<string, Type<unknown>> = { button: ButtonDemo };

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
