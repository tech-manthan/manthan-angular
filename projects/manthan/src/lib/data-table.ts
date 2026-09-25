import { Component, Directive, TemplateRef, booleanAttribute, computed, contentChildren, inject, input, model, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from '@manthan/icons';
import {
  ariaSort,
  cellAlign,
  dataTable,
  formatCell,
  getSelectionState,
  getTableView,
  nextSort,
  table,
  toggleAll,
  toggleId,
  type ColumnDef,
  type SortState,
} from '@manthan/base';
import { MnCheckbox, MnInput, MnInputGroup } from './form';
import { MnIcon } from './icon';
import { MnPagination } from './navigation';

/** Custom cell content: `<ng-template mnCell="status" let-row let-value="value">…</ng-template>` */
@Directive({ selector: 'ng-template[mnCell]' })
export class MnCellTemplate {
  readonly key = input.required<string>({ alias: 'mnCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown; value: string }>>(TemplateRef);
}

@Component({
  selector: 'mn-data-table',
  imports: [NgTemplateOutlet, MnCheckbox, MnIcon, MnInput, MnInputGroup, MnPagination],
  template: `
    <div [class]="s.toolbar()">
      @if (searchable()) {
        <mn-input-group [class]="s.search()">
          <svg mnStart mnIcon [icon]="icons.search"></svg>
          <input
            mnInput
            withStart
            size="sm"
            type="search"
            aria-label="Search table"
            [placeholder]="searchPlaceholder()"
            [value]="query()"
            (input)="search($any($event.target).value)"
          />
        </mn-input-group>
      }
      <ng-content select="[mnTableToolbar]" />
      <div [class]="s.summary()" aria-live="polite">{{ summary() }}</div>
    </div>
    <div [class]="t().root()">
      <table [class]="t().table()">
        @if (caption()) {
          <caption [class]="t().caption()">{{ caption() }}</caption>
        }
        <thead [class]="t().header()">
          <tr [class]="t().row()">
            @if (selectable()) {
              <th [class]="t().head(s.selectCell())">
                <mn-checkbox
                  size="sm"
                  ariaLabel="Select all rows on this page"
                  [checked]="all() === 'all'"
                  [indeterminate]="all() === 'some'"
                  (checkedChange)="selected.set(toggleAll(selected(), visibleIds()))"
                />
              </th>
            }
            @for (col of columns(); track col.key) {
              <th scope="col" [attr.aria-sort]="ariaSort(sort(), col.key)" [style.width]="col.width ?? null" [class]="t().head(align(col))">
                @if (col.sortable === false) {
                  {{ col.header }}
                } @else {
                  <button type="button" [class]="s.sortButton()" (click)="sort.set(nextSort(sort(), col.key))">
                    {{ col.header }}
                    <svg mnIcon [icon]="sortIcon(col.key)" [attr.data-active]="sort()?.key === col.key ? '' : null" [class]="s.sortIcon()"></svg>
                  </button>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody [class]="t().body()">
          @if (view().rows.length === 0) {
            <tr>
              <td [attr.colspan]="columns().length + (selectable() ? 1 : 0)" [class]="s.empty()">{{ emptyText() }}</td>
            </tr>
          }
          @for (row of view().rows; track idOf(row)) {
            <tr [attr.aria-selected]="selectable() ? selected().includes(idOf(row)) : null" [class]="t().row()">
              @if (selectable()) {
                <td [class]="t().cell(s.selectCell())">
                  <mn-checkbox
                    size="sm"
                    [ariaLabel]="'Select row ' + idOf(row)"
                    [checked]="selected().includes(idOf(row))"
                    (checkedChange)="selected.set(toggleId(selected(), idOf(row)))"
                  />
                </td>
              }
              @for (col of columns(); track col.key) {
                <td [class]="t().cell(align(col))">
                  @if (templates()[col.key]; as tpl) {
                    <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row, value: format(row, col) }" />
                  } @else {
                    {{ format(row, col) }}
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div [class]="s.footer()">
      <span class="tabular-nums">{{ view().total ? view().start + '–' + view().end + ' of ' + view().total : '0 results' }}</span>
      @if (view().pageCount > 1) {
        <mn-pagination size="sm" [total]="view().pageCount" [page]="view().page" (pageChange)="page.set($event)" />
      }
    </div>
  `,
  host: { '[class]': 's.root()' },
})
export class MnDataTable<T = Record<string, unknown>> {
  readonly columns = input.required<ColumnDef<T>[]>();
  readonly rows = input.required<T[]>();
  readonly getRowId = input<(row: T, index: number) => string>((row, i) => String((row as { id?: unknown }).id ?? i));
  /** 0 shows every row. */
  readonly pageSize = input(10);
  readonly searchable = input(true, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Search…');
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly selected = model<string[]>([]);
  readonly sort = model<SortState | null>(null);
  readonly caption = input<string>();
  readonly emptyText = input('No results.');
  readonly striped = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md'>();

  protected readonly s = dataTable();
  protected readonly icons = { search: Search };
  protected readonly ariaSort = ariaSort;
  protected readonly nextSort = nextSort;
  protected readonly toggleAll = toggleAll;
  protected readonly toggleId = toggleId;
  protected readonly query = signal('');
  protected readonly page = signal(1);
  private readonly cellTemplates = contentChildren(MnCellTemplate);
  protected readonly templates = computed(() => Object.fromEntries(this.cellTemplates().map((c) => [c.key(), c.template])));
  protected readonly t = computed(() => table({ striped: this.striped(), size: this.size() }));
  private readonly ids = computed(() => new Map(this.rows().map((row, i) => [row, this.getRowId()(row, i)])));
  protected readonly view = computed(() =>
    getTableView(this.rows(), { columns: this.columns(), sort: this.sort(), query: this.query(), page: this.page(), pageSize: this.pageSize() }),
  );
  protected readonly visibleIds = computed(() => this.view().rows.map((r) => this.idOf(r)));
  protected readonly all = computed(() => getSelectionState(this.visibleIds(), this.selected()));
  protected readonly summary = computed(() => {
    const total = this.view().total;
    return this.selectable() && this.selected().length
      ? `${this.selected().length} of ${this.rows().length} selected`
      : `${total} ${total === 1 ? 'row' : 'rows'}`;
  });

  protected idOf(row: T) {
    return this.ids().get(row)!;
  }
  protected format(row: T, col: ColumnDef<T>) {
    return formatCell(row, col);
  }
  protected align(col: ColumnDef<T>) {
    return cellAlign[col.align ?? 'start'];
  }
  protected sortIcon(key: string) {
    const sort = this.sort();
    return sort?.key === key ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  }
  protected search(value: string) {
    this.query.set(value);
    this.page.set(1);
  }
}
