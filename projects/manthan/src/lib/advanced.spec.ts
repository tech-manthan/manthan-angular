import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MN_COMPONENTS } from './all';

@Component({
  imports: [MN_COMPONENTS, FormsModule],
  template: `
    <mn-combobox ariaLabel="Framework" [options]="frameworks" [(ngModel)]="framework" />
    <mn-command [options]="commands" (select)="picked.set($event)" />
    <mn-command-dialog [options]="commands" />
    <mn-calendar locale="en-US" [weekStartsOn]="1" [(value)]="day" />
    <mn-date-picker locale="en-US" name="due" [(ngModel)]="due" />
    <mn-toggle-group type="multiple" [(value)]="format">
      <button mnToggleGroupItem="b">B</button>
      <button mnToggleGroupItem="i">I</button>
    </mn-toggle-group>
  `,
})
class Host {
  frameworks = [
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
  ];
  commands = [
    { value: 'open', label: 'Open file' },
    { value: 'save', label: 'Save all' },
  ];
  framework: string | null = null;
  picked = signal('');
  day = signal<string | null>('2026-09-25');
  due: string | null = '2026-09-25';
  format = signal<string | null | string[]>([]);
}

const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));

describe('@manthan/angular advanced', () => {
  it('drives combobox, command, calendar, date picker and toggle group', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;
    const byText = (sel: string, text: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(sel)).find((el) => el.textContent?.trim() === text)!;

    const combo = root.querySelector('mn-combobox input') as HTMLInputElement;
    combo.value = 'sv';
    combo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await frame();
    key(combo, 'Enter');
    await fixture.whenStable();
    expect(host.framework).toBe('svelte');
    expect(combo.value).toBe('Svelte');

    const cmd = root.querySelector('mn-command input') as HTMLInputElement;
    cmd.value = 'save';
    cmd.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await frame();
    key(cmd, 'Enter');
    expect(host.picked()).toBe('save');

    key(document.body, 'k', { metaKey: true });
    key(document.body, 'k', { ctrlKey: true });
    await fixture.whenStable();
    expect((root.querySelector('mn-command-dialog dialog') as HTMLDialogElement).open).toBe(true);

    const day = root.querySelector('mn-calendar [data-date="2026-09-25"]') as HTMLButtonElement;
    expect(day.closest('td')!.getAttribute('aria-selected')).toBe('true');
    day.focus();
    key(day, 'ArrowDown');
    await fixture.whenStable();
    await frame();
    (document.activeElement as HTMLElement).click();
    await fixture.whenStable();
    expect(host.day()).toBe('2026-10-02');

    expect(root.querySelector('mn-date-picker button')!.textContent).toContain('Sep 25, 2026');
    expect((root.querySelector('input[name=due]') as HTMLInputElement).value).toBe('2026-09-25');

    byText('button', 'B').click();
    byText('button', 'I').click();
    await fixture.whenStable();
    expect(host.format()).toEqual(['b', 'i']);
    expect(byText('button', 'B').getAttribute('aria-pressed')).toBe('true');
  });
});
