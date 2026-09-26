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
  selector: 'app-demo-root',
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
