import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { rules } from '@manthan/base';
import { MN_COMPONENTS } from './all';
import { injectForm, mnError, mnValidator } from './forms-files';

@Component({
  imports: [MN_COMPONENTS, ReactiveFormsModule],
  template: `
    <form id="signal" (submit)="form.handleSubmit($event)">
      <mn-field label="Email" [error]="form.errors().email">
        <input mnInput [mnFormField]="form" name="email" />
      </mn-field>
      <label><input type="checkbox" [mnFormField]="form" name="terms" /> I agree</label>
      @if (form.errors().terms) {
        <p>{{ form.errors().terms }}</p>
      }
      <button type="submit">Send</button>
    </form>
    <form id="reactive" [formGroup]="group">
      <mn-field label="Website" [error]="mnError(group.controls.site)">
        <input mnInput formControlName="site" />
      </mn-field>
    </form>
    <mn-file-upload multiple accept=".pdf" [(files)]="files" />
  `,
})
class Host {
  submitted = signal<unknown>(null);
  form = injectForm({
    initialValues: { email: '', terms: false },
    rules: { email: [rules.required('Enter your email.'), rules.email()], terms: rules.required('Accept the terms.') },
    onSubmit: (v) => this.submitted.set(v),
  });
  group = new FormGroup({ site: new FormControl('', mnValidator(rules.required(), rules.url())) });
  mnError = mnError;
  files = signal<File[]>([]);
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('forms and uploads', () => {
  it('validates signal forms, bridges reactive forms and handles files', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const root: HTMLElement = fixture.nativeElement;

    const email = root.querySelector('#signal input[name=email]') as HTMLInputElement;
    email.value = 'nope';
    email.dispatchEvent(new Event('input'));
    email.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(root.textContent).toContain('valid email');
    expect(email.getAttribute('aria-invalid')).toBe('true');

    (root.querySelector('#signal button') as HTMLButtonElement).click();
    await tick();
    await fixture.whenStable();
    expect(root.textContent).toContain('Accept the terms.');
    expect(host.submitted()).toBeNull();

    email.value = 'ada@example.com';
    email.dispatchEvent(new Event('input'));
    (root.querySelector('#signal input[name=terms]') as HTMLInputElement).click();
    (root.querySelector('#signal button') as HTMLButtonElement).click();
    await tick();
    expect(host.submitted()).toEqual({ email: 'ada@example.com', terms: true });

    const site = root.querySelector('#reactive input') as HTMLInputElement;
    site.value = 'ftp://example.com';
    site.dispatchEvent(new Event('input'));
    site.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(root.querySelector('#reactive')!.textContent).toContain('starting with https://');

    const zone = root.querySelector('mn-file-upload [role=button]')!;
    const drop = new Event('drop', { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown };
    drop.dataTransfer = { files: [new File(['1'], 'a.pdf', { type: 'application/pdf' }), new File(['2'], 'b.png', { type: 'image/png' })], types: ['Files'] };
    zone.dispatchEvent(drop);
    await fixture.whenStable();
    expect(host.files().map((f) => f.name)).toEqual(['a.pdf']);
    expect(root.querySelector('mn-file-upload [role=alert]')!.textContent).toContain("b.png: this file type isn't allowed.");
    (root.querySelector('[aria-label="Remove a.pdf"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(host.files()).toEqual([]);
  });
});
