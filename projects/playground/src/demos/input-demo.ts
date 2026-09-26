import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MN_COMPONENTS } from '@manthan/angular';

@Component({
  selector: 'app-demo-input',
  imports: [MN_COMPONENTS, FormsModule],
  template: `<input mnInput [(ngModel)]="value" placeholder="you@example.com" />`,
})
export class InputDemo {
  protected value = '';
}
