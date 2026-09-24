import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogOut, Mail, Settings, Trash, User } from '@manthan/icons';
import { MN_COMPONENTS, designStyles, toast } from '@manthan/angular';

const params = new URLSearchParams(location.search);

@Component({
  selector: 'app-root',
  imports: [MN_COMPONENTS, FormsModule],
  template: `
    <main class="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <header class="flex flex-wrap items-center gap-3">
        <h1 mnHeading [size]="3" class="me-auto">&#64;manthan/angular</h1>
        <mn-select class="w-44" size="sm" ariaLabel="Style" [options]="styles" [(value)]="style" />
        <mn-switch label="Dark" [(checked)]="dark" />
      </header>
      <div class="grid gap-6 md:grid-cols-2">
        <div mnCard>
          <div mnCardHeader>
            <h3 mnCardTitle>Create account</h3>
            <p mnCardDescription>Directives on native elements, so ngModel just works.</p>
          </div>
          <div mnCardContent class="flex flex-col gap-4">
            <mn-field label="Email" description="We never share it." required>
              <mn-input-group>
                <svg mnStart mnIcon [icon]="icons.Mail"></svg>
                <input mnInput withStart type="email" placeholder="you@example.com" [(ngModel)]="email" />
              </mn-input-group>
            </mn-field>
            <mn-radio-group orientation="horizontal" [(value)]="plan">
              <mn-radio value="hobby" label="Hobby" /><mn-radio value="pro" label="Pro" /><mn-radio value="team" label="Team" />
            </mn-radio-group>
            <mn-checkbox label="I agree to the terms" [(checked)]="agree" />
            <mn-field [label]="'Volume: ' + volume">
              <input type="range" mnSlider [(ngModel)]="volume" />
            </mn-field>
          </div>
          <div mnCardFooter>
            <button mnButton (click)="signUp()">Sign up</button>
            <button mnButton variant="ghost" tone="neutral">Cancel</button>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div mnCard>
            <div class="flex flex-wrap items-center gap-3">
              <button mnButton tone="danger" variant="soft" [mnDialogTrigger]="dlg"><svg mnIcon [icon]="icons.Trash"></svg> Delete</button>
              <mn-dialog #dlg title="Delete project?" description="This permanently deletes the project.">
                <div mnDialogFooter>
                  <button mnButton variant="surface" tone="neutral" mnDialogClose>Cancel</button>
                  <button mnButton tone="danger" mnDialogClose (click)="deleted()">Delete</button>
                </div>
              </mn-dialog>
              <button mnButton variant="surface" tone="neutral" [mnMenuTrigger]="menu"><svg mnIcon [icon]="icons.User"></svg> Account</button>
              <mn-menu #menu>
                <mn-menu-label>ada&#64;example.com</mn-menu-label>
                <button mnMenuItem shortcut="⇧⌘P"><svg mnIcon [icon]="icons.User"></svg> Profile</button>
                <button mnMenuItem (select)="settings()"><svg mnIcon [icon]="icons.Settings"></svg> Settings</button>
                <mn-menu-separator />
                <button mnMenuItem tone="danger"><svg mnIcon [icon]="icons.LogOut"></svg> Log out</button>
              </mn-menu>
              <button mnButton variant="outline" [mnPopoverTrigger]="pop">Popover</button>
              <mn-popover #pop title="Dimensions" description="Anchored with flip & shift.">
                <input mnInput size="sm" value="100%" aria-label="Width" class="mt-3" />
              </mn-popover>
              <button mnButton iconOnly variant="ghost" aria-label="Settings" mnTooltip="Settings"><svg mnIcon [icon]="icons.Settings"></svg></button>
            </div>
          </div>
          <div mnTabs variant="segmented" [(value)]="tab">
            <div mnTabsList>
              <button mnTabsTrigger="overview">Overview</button>
              <button mnTabsTrigger="analytics">Analytics</button>
            </div>
            <div mnTabsContent="overview" class="flex items-center gap-4">
              <mn-progress-circle [value]="72" size="lg" tone="success" />
              <div class="flex flex-1 flex-col gap-2"><mn-progress [value]="volume" /><mn-progress indeterminate tone="info" size="sm" /></div>
            </div>
            <div mnTabsContent="analytics">Analytics panel</div>
          </div>
          <mn-alert tone="success" title="Deployed">Your site is live.</mn-alert>
          <div class="flex items-center gap-2">
            <mn-avatar alt="Grace Hopper" /><mn-avatar alt="Alan Turing" tone="success" /><span mnBadge>New</span>
          </div>
        </div>
      </div>
      <mn-accordion>
        <mn-accordion-item title="Is it accessible?" [open]="true">Yes: native elements and WAI-ARIA patterns.</mn-accordion-item>
        <mn-accordion-item title="Can I theme it?">Eleven styles plus your own tokens.</mn-accordion-item>
      </mn-accordion>
      <mn-pagination [total]="12" [(page)]="page" />
      <mn-toaster />
    </main>
  `,
})
export class App {
  protected readonly icons = { Mail, Settings, Trash, User, LogOut };
  protected readonly styles = designStyles.map((s) => ({ value: s.id, label: s.label }));
  protected readonly style = signal(params.get('style') ?? 'default');
  protected readonly dark = signal(params.get('theme') === 'dark');
  protected readonly plan = signal('pro');
  protected readonly agree = signal(true);
  protected readonly tab = signal('overview');
  protected readonly page = signal(4);
  protected email = '';
  protected volume = 40;

  constructor() {
    effect(() => {
      document.documentElement.dataset['mnStyle'] = this.style();
      document.documentElement.dataset['mnTheme'] = this.dark() ? 'dark' : 'light';
    });
  }
  protected signUp() {
    toast.success({ title: 'Account created', description: `Plan: ${this.plan()}` });
  }
  protected deleted() {
    toast.error('Project deleted');
  }
  protected settings() {
    toast.info('Settings');
  }
}
