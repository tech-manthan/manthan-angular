import { Component } from '@angular/core';
import { MN_COMPONENTS } from '@manthan/angular';

@Component({
  selector: 'app-demo-data-table',
  imports: [MN_COMPONENTS],
  template: `<mn-data-table [columns]="columns" [rows]="rows" [pageSize]="3" />`,
})
export class DataTableDemo {
  protected rows = [
    { id: 'INV-1001', customer: 'Ada Lovelace', status: 'Paid' },
    { id: 'INV-1002', customer: 'Alan Turing', status: 'Pending' },
    { id: 'INV-1003', customer: 'Grace Hopper', status: 'Overdue' },
  ];
  protected columns = [
    { key: 'id', header: 'Invoice' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status' },
  ];
}
