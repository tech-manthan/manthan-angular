import { Component } from '@angular/core';
import { MN_COMPONENTS } from '@manthan/angular';

@Component({
  selector: 'app-demo-chart',
  imports: [MN_COMPONENTS],
  template: `<mn-chart type="area" [data]="data" x="month" [series]="series" [height]="200" />`,
})
export class ChartDemo {
  protected data = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({ month, revenue: 30 + i * 3 }));
  protected series = [{ key: 'revenue', label: 'Revenue' }];
}
