import { Component } from '@angular/core';
import { MN_COMPONENTS } from '@manthan/angular';

@Component({
  selector: 'app-demo-dialog',
  imports: [MN_COMPONENTS],
  template: `
    <button mnButton [mnDialogTrigger]="dlg">Open</button>
    <mn-dialog #dlg title="Delete project?" description="This permanently deletes the project.">Are you sure?</mn-dialog>
  `,
})
export class DialogDemo {}
