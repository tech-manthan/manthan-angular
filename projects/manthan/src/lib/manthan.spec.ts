import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { createToaster } from '@manthan/base';
import { MN_COMPONENTS } from './all';

@Component({
  imports: [MN_COMPONENTS, FormsModule],
  template: `
    <button mnButton variant="soft" tone="danger" loading>Delete</button>
    <mn-field label="Email" error="Required" required>
      <input mnInput type="email" [(ngModel)]="email" />
    </mn-field>
    <mn-checkbox label="Accept" [(checked)]="agree" />
    <mn-radio-group [(ngModel)]="plan">
      <mn-radio value="a" label="A" />
      <mn-radio value="b" label="B" />
    </mn-radio-group>
    <input type="range" mnSlider aria-label="Volume" max="200" [value]="20" />
    <div mnTabs [(value)]="tab">
      <div mnTabsList>
        <button mnTabsTrigger="one">One</button>
        <button mnTabsTrigger="two">Two</button>
      </div>
      <div mnTabsContent="one">First</div>
      <div mnTabsContent="two">Second</div>
    </div>
    <mn-pagination [total]="10" [(page)]="page" />
    <button mnButton [mnDialogTrigger]="dlg">Open dialog</button>
    <mn-dialog #dlg title="Edit" [(open)]="open">Body</mn-dialog>
    <mn-alert tone="warning" title="Careful">Details</mn-alert>
    <mn-toaster [toaster]="store" />
  `,
})
class Host {
  email = '';
  agree = signal(false);
  plan = 'a';
  tab = signal('one');
  page = signal(5);
  open = signal(false);
  store = createToaster();
}

describe('@manthan/angular', () => {
  it('renders, binds and wires every control', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as unknown as T;
    const byText = (sel: string, text: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(sel)).find((el) => el.textContent?.trim() === text)!;

    const del = byText('button', 'Delete');
    expect(del.className).toContain('mn-btn-soft');
    expect(del.getAttribute('aria-busy')).toBe('true');

    const email = q<HTMLInputElement>('input[type=email]');
    const label = byText('label', 'Email');
    expect(label.getAttribute('for')).toBe(email.id);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    email.value = 'ada@example.com';
    email.dispatchEvent(new Event('input'));

    (byText('label', 'Accept').querySelector('input') as HTMLInputElement).click();
    (byText('label', 'B').querySelector('input') as HTMLInputElement).click();

    const one = byText('[role=tab]', 'One');
    one.focus();
    one.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    (root.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click();
    byText('button', 'Open dialog').click();
    await fixture.whenStable();

    expect(host.email).toBe('ada@example.com');
    expect(host.agree()).toBe(true);
    expect(host.plan).toBe('b');
    expect(host.tab()).toBe('two');
    expect(byText('[role=tabpanel]', 'Second').hidden).toBe(false);
    expect(host.page()).toBe(6);
    expect(host.open()).toBe(true);
    expect(q<HTMLDialogElement>('dialog').open).toBe(true);
    expect(q<HTMLInputElement>('input[type=range]').style.getPropertyValue('--mn-fill')).toBe('10%');

    host.store.success({ title: 'Saved', description: 'All good' });
    await fixture.whenStable();
    expect(byText('[role=status] div', 'All good')).toBeTruthy();
    expect(q('mn-alert').textContent).toContain('Careful');
  });
});
