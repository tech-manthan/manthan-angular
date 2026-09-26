import { Component } from '@angular/core';
import { MN_COMPONENTS } from '@manthan/angular';

@Component({
  selector: 'app-demo-button',
  imports: [MN_COMPONENTS],
  template: `<button mnButton variant="soft" tone="primary">Click me</button>`,
})
export class ButtonDemo {}
