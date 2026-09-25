import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MN_COMPONENTS } from './all';

@Component({
  imports: [MN_COMPONENTS],
  template: `
    <mn-chart [type]="type()" label="Sales" [data]="data" x="m" [series]="series" [(hidden)]="hidden" />
    <mn-stat label="Revenue" value="$4.2K" delta="-3%" sentiment="negative" caption="vs last week" [trend]="[1, 3, 2]" />
  `,
})
class Host {
  type = signal<'bar' | 'line'>('bar');
  data = [
    { m: 'Jan', a: 3, b: 1 },
    { m: 'Feb', a: 5, b: 2 },
  ];
  series = [
    { key: 'a', label: 'Alpha' },
    { key: 'b', label: 'Beta' },
  ];
  hidden = signal<string[]>([]);
}

describe('MnChart', () => {
  it('renders, binds hidden series, reacts to inputs and renders stat tiles', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const chart = root.querySelector('mn-chart')!;
    expect(chart.querySelector('svg')!.getAttribute('aria-label')).toBe('Sales');
    expect(chart.querySelectorAll('.mn-chart-bar')).toHaveLength(4);
    Array.from(chart.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent === 'Beta')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.hidden()).toEqual(['b']);
    expect(chart.querySelectorAll('.mn-chart-bar')).toHaveLength(2);
    fixture.componentInstance.type.set('line');
    await fixture.whenStable();
    expect(chart.querySelectorAll('.mn-chart-line')).toHaveLength(1);
    expect(root.querySelector('mn-stat svg[aria-label="Revenue trend"]')).toBeTruthy();
    expect(root.querySelector('mn-stat')!.textContent).toContain('$4.2K');
  });
});
