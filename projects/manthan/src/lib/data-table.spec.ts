import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MN_COMPONENTS } from './all';

@Component({
  imports: [MN_COMPONENTS],
  template: `
    <mn-data-table [rows]="rows" [columns]="columns" [pageSize]="5" selectable [(selected)]="selected">
      <ng-template mnCell="score" let-value="value"><strong>{{ value }}</strong></ng-template>
    </mn-data-table>
  `,
})
class Host {
  rows = Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), name: `User ${i + 1}`, score: (i * 7) % 10 }));
  columns = [
    { key: 'name', header: 'Name' },
    { key: 'score', header: 'Score', align: 'end' as const, searchable: false },
  ];
  selected = signal<string[]>([]);
}

describe('MnDataTable', () => {
  it('sorts, searches, selects and pages', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const body = () => Array.from(root.querySelectorAll('tbody tr'));
    const text = () => root.textContent ?? '';
    expect(body()).toHaveLength(5);
    expect(text()).toContain('1–5 of 12');

    const scoreButton = Array.from(root.querySelectorAll<HTMLButtonElement>('th button')).find((b) => b.textContent?.includes('Score'))!;
    scoreButton.click();
    await fixture.whenStable();
    expect(scoreButton.closest('th')!.getAttribute('aria-sort')).toBe('ascending');
    expect(body()[0]!.querySelector('strong')!.textContent).toBe('0');

    const search = root.querySelector('input[type=search]') as HTMLInputElement;
    search.value = 'user 1';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(body()).toHaveLength(4);

    (root.querySelector('thead input[type=checkbox]') as HTMLInputElement).click();
    await fixture.whenStable();
    expect([...fixture.componentInstance.selected()].sort()).toEqual(['1', '10', '11', '12']);
    expect(text()).toContain('4 of 12 selected');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (root.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(text()).toContain('6–10 of 12');
  });
});
