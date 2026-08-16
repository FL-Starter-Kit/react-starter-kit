import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Pagination } from '@/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';

import styles from './DataTable.module.css';

export interface DataTableRow {
  id: string;
}

export type DataTableSortDirection = 'asc' | 'desc';

export interface DataTableSort {
  id: string;
  dir: DataTableSortDirection;
}

export interface DataTableColumn<T> {
  /** Stable key identifying the column (used for URL state and the visibility toggle). */
  id: string;
  /** Header cell content. */
  header: ReactNode;
  /** Optional text-align override for the column. */
  align?: 'left' | 'right' | 'center';
  /** Fixed width for the column (any CSS length). */
  width?: string | number;
  /** Produces the value used for client-side sorting (and the default cell text). */
  accessorFn?: (row: T) => string | number | null | undefined;
  /** Reads the sortable/display value from a row property (alternative to `accessorFn`). */
  accessorKey?: keyof T & string;
  /** Cell renderer. Defaults to the stringified accessor value. */
  render?: (row: T) => ReactNode;
  /** Render a sort button in the header. */
  sortable?: boolean;
  /** Allow hiding this column from the visibility menu. Defaults to true. */
  hideable?: boolean;
}

export interface DataTableProps<T extends DataTableRow> {
  columns: readonly DataTableColumn<T>[];
  data: readonly T[];
  /** Stable key per row; defaults to `row.id`. */
  getRowId?: (row: T) => string;
  /** Readable label used in row-selection ARIA labels; defaults to `row.id`. */
  rowLabel?: (row: T) => string;

  /** Table caption — also names the table for assistive technology. */
  caption?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;

  /** Enable pagination controls. Client-side rows are sliced when `totalPages` is not provided. */
  pagination?: boolean;
  page?: number;
  pageSize?: number;
  pageSizes?: readonly number[];
  /** Server-side total page count. When set, `data` is expected to be the current page only. */
  totalPages?: number;
  /** Total item count; derives `totalPages` when `totalPages` is not provided. */
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  /**
   * Active sort. Managed internally unless controlled; client-side sorting is
   * applied when the active column has an accessor. Supply `onSortChange` to
   * sort server-side and keep the value in sync.
   */
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;

  /** Show row-selection checkboxes and a bulk action bar. */
  enableRowSelection?: boolean;
  selectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (ids: readonly string[]) => void;
  /** Content rendered in the bulk action bar when rows are selected. */
  bulkActions?: (selectedRows: readonly T[]) => ReactNode;

  /** Column visibility map (column id → visible). Managed internally unless controlled. */
  columnVisibility?: Readonly<Record<string, boolean>>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  /** Loading / error / empty states. */
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;

  /**
   * Router-agnostic URL state: initial values are read from `params` and every
   * change is written back through `onParamsChange` (other params preserved).
   */
  params?: URLSearchParams;
  onParamsChange?: (next: URLSearchParams) => void;

  loadingLabel?: string;
  columnsLabel?: string;
  paginationLabel?: string;
  selectAllLabel?: string;
  /** Text after the selected count in the bulk bar (e.g. "selected"). */
  bulkCountLabel?: string;

  className?: string;
}

const DEFAULT_PAGE_SIZE = 10;

function parseSortParam(params: URLSearchParams | undefined): DataTableSort | null {
  const raw = params?.get('sort');
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  const [id, dir] = raw.split(':');
  if (id === undefined || id === '') {
    return null;
  }
  return { id, dir: dir === 'desc' ? 'desc' : 'asc' };
}

function parseHiddenColumnsParam(params: URLSearchParams | undefined): string[] {
  const raw = params?.get('col');
  if (raw === null || raw === undefined || raw === '') {
    return [];
  }
  return raw.split(',').filter((id) => id !== '');
}

function parseIntParam(params: URLSearchParams | undefined, name: string): number | undefined {
  const raw = params?.get(name);
  if (raw === null || raw === undefined) {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined;
}

function normalizeSortValue(value: unknown): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return null;
}

function accessorValue<T extends DataTableRow>(
  column: DataTableColumn<T>,
  row: T,
): string | number | null {
  if (column.accessorFn !== undefined) {
    return column.accessorFn(row) ?? null;
  }
  if (column.accessorKey !== undefined) {
    return normalizeSortValue((row as Record<string, unknown>)[column.accessorKey]);
  }
  return null;
}

function renderCell<T extends DataTableRow>(column: DataTableColumn<T>, row: T): ReactNode {
  if (column.render !== undefined) {
    return column.render(row);
  }
  const value = accessorValue(column, row);
  return value === null ? '' : String(value);
}

/**
 * Accessible, presentational data table: native `<table>` + `<caption>` +
 * `<th scope>` semantics, sortable headers (`aria-sort`), tri-state row
 * selection, a bulk action bar, column-visibility menu (built on Popover),
 * client-side or server-side pagination (reusing `Pagination`), and
 * loading/empty/error states. Router-agnostic URL state via `params` +
 * `onParamsChange`.
 */
export function DataTable<T extends DataTableRow>({
  columns,
  data,
  getRowId,
  rowLabel,
  caption,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  pagination = false,
  page: controlledPage,
  pageSize: controlledPageSize,
  pageSizes = [10, 20, 50],
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  sort: controlledSort,
  onSortChange,
  enableRowSelection = false,
  selectedRowIds: controlledSelected,
  onSelectedRowIdsChange,
  bulkActions,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  loading = false,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There is nothing to show here yet.',
  emptyAction,
  params,
  onParamsChange,
  loadingLabel = 'Loading data…',
  columnsLabel = 'Columns',
  paginationLabel = 'Pagination',
  selectAllLabel = 'Select all rows',
  bulkCountLabel = 'selected',
  className,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState<number>(
    () => controlledPage ?? parseIntParam(params, 'page') ?? 1,
  );
  const [internalPageSize, setInternalPageSize] = useState<number>(
    () =>
      controlledPageSize ?? parseIntParam(params, 'pageSize') ?? pageSizes[0] ?? DEFAULT_PAGE_SIZE,
  );
  const [internalSort, setInternalSort] = useState<DataTableSort | null>(
    () => controlledSort ?? parseSortParam(params),
  );
  const [internalVisibility, setInternalVisibility] = useState<Record<string, boolean>>(() => {
    if (controlledVisibility !== undefined) {
      return { ...controlledVisibility };
    }
    const visibility: Record<string, boolean> = {};
    for (const column of columns) {
      visibility[column.id] = true;
    }
    for (const hiddenId of parseHiddenColumnsParam(params)) {
      visibility[hiddenId] = false;
    }
    return visibility;
  });
  const [internalSelected, setInternalSelected] = useState<readonly string[]>([]);

  // The latest URL params, so sequential writes build on each other even when
  // the consumer is slow to feed an updated `params` prop back down.
  const paramsRef = useRef<URLSearchParams | undefined>(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const sort = controlledSort ?? internalSort;
  const visibility = controlledVisibility ?? internalVisibility;
  const selected = controlledSelected ?? internalSelected;

  const writeParams = (patch: (next: URLSearchParams) => void): void => {
    const current = paramsRef.current;
    if (current === undefined || onParamsChange === undefined) {
      return;
    }
    const next = new URLSearchParams(current);
    patch(next);
    paramsRef.current = next;
    onParamsChange(next);
  };

  const changePage = (next: number): void => {
    if (controlledPage === undefined) {
      setInternalPage(next);
    }
    onPageChange?.(next);
    writeParams((urlParams) => {
      if (next === 1) {
        urlParams.delete('page');
      } else {
        urlParams.set('page', String(next));
      }
    });
  };

  const changePageSize = (next: number): void => {
    if (controlledPageSize === undefined) {
      setInternalPageSize(next);
    }
    if (controlledPage === undefined) {
      setInternalPage(1);
    }
    onPageSizeChange?.(next);
    onPageChange?.(1);
    writeParams((urlParams) => {
      urlParams.set('pageSize', String(next));
      urlParams.delete('page');
    });
  };

  const setSort = (next: DataTableSort | null): void => {
    if (controlledSort === undefined) {
      setInternalSort(next);
    }
    onSortChange?.(next);
    writeParams((urlParams) => {
      if (next === null) {
        urlParams.delete('sort');
      } else {
        urlParams.set('sort', `${next.id}:${next.dir}`);
      }
    });
  };

  const cycleSort = (columnId: string): void => {
    if (sort !== null && sort.id === columnId) {
      setSort(sort.dir === 'asc' ? { id: columnId, dir: 'desc' } : null);
    } else {
      setSort({ id: columnId, dir: 'asc' });
    }
  };

  const setVisibility = (next: Record<string, boolean>): void => {
    if (controlledVisibility === undefined) {
      setInternalVisibility(next);
    }
    onColumnVisibilityChange?.(next);
    writeParams((urlParams) => {
      const hidden = Object.entries(next)
        .filter(([, isVisible]) => !isVisible)
        .map(([id]) => id)
        .sort();
      if (hidden.length === 0) {
        urlParams.delete('col');
      } else {
        urlParams.set('col', hidden.join(','));
      }
    });
  };

  const toggleColumn = (columnId: string): void => {
    setVisibility({ ...visibility, [columnId]: !(visibility[columnId] !== false) });
  };

  const setSelected = (next: readonly string[]): void => {
    if (controlledSelected === undefined) {
      setInternalSelected(next);
    }
    onSelectedRowIdsChange?.(next);
  };

  const rowIdOf = useCallback(
    (row: T): string => (getRowId !== undefined ? getRowId(row) : row.id),
    [getRowId],
  );
  const rowLabelOf = useCallback(
    (row: T): string => (rowLabel !== undefined ? rowLabel(row) : row.id),
    [rowLabel],
  );

  const rows = useMemo(() => {
    const copy = [...data];
    if (sort === null) {
      return copy;
    }
    const column = columns.find((candidate) => candidate.id === sort.id);
    if (column === undefined) {
      return copy;
    }
    const direction = sort.dir === 'desc' ? -1 : 1;
    return copy.sort((a, b) => {
      const aValue = accessorValue(column, a);
      const bValue = accessorValue(column, b);
      if (aValue === bValue) {
        return 0;
      }
      if (aValue === null) {
        return 1;
      }
      if (bValue === null) {
        return -1;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [data, sort, columns]);

  const paginationEnabled =
    pagination === true ||
    controlledPage !== undefined ||
    totalPages !== undefined ||
    totalCount !== undefined ||
    (params !== undefined && (params.get('page') !== null || params.get('pageSize') !== null));

  const effectiveTotalPages =
    totalPages ??
    (totalCount !== undefined
      ? Math.max(1, Math.ceil(totalCount / pageSize))
      : paginationEnabled
        ? Math.max(1, Math.ceil(rows.length / pageSize))
        : undefined);

  const safePage = effectiveTotalPages !== undefined ? Math.min(page, effectiveTotalPages) : page;

  const pageRows = useMemo(() => {
    if (!paginationEnabled || totalPages !== undefined) {
      return rows;
    }
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [paginationEnabled, totalPages, rows, safePage, pageSize]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => visibility[column.id] !== false),
    [columns, visibility],
  );
  const hideableColumns = useMemo(
    () => columns.filter((column) => column.hideable !== false),
    [columns],
  );

  const pageRowIds = useMemo(() => pageRows.map((row) => rowIdOf(row)), [pageRows, rowIdOf]);
  const selectedOnPage = useMemo(
    () => pageRowIds.filter((id) => selected.includes(id)),
    [pageRowIds, selected],
  );
  const selectedRows = useMemo(
    () => data.filter((row) => selected.includes(rowIdOf(row))),
    [data, selected, rowIdOf],
  );

  const hasRows = pageRowIds.length > 0;
  const allOnPageSelected = hasRows && selectedOnPage.length === pageRowIds.length;
  const someOnPageSelected =
    hasRows && selectedOnPage.length > 0 && selectedOnPage.length < pageRowIds.length;

  const toggleAll = (): void => {
    if (!hasRows) {
      return;
    }
    setSelected(
      allOnPageSelected
        ? selected.filter((id) => !pageRowIds.includes(id))
        : [...new Set([...selected, ...pageRowIds])],
    );
  };

  const toggleRow = (rowId: string): void => {
    setSelected(
      selected.includes(rowId) ? selected.filter((id) => id !== rowId) : [...selected, rowId],
    );
  };

  const colSpan = visibleColumns.length + (enableRowSelection ? 1 : 0);
  const skeletonRowCount = Math.min(Math.max(pageSize, 1), 5);

  return (
    <div className={cn(styles.root, className)}>
      {(enableRowSelection && selected.length > 0) || hideableColumns.length > 0 ? (
        <div className={styles.toolbar}>
          {enableRowSelection && selected.length > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkCount} role="status">
                {selected.length} {bulkCountLabel}
              </span>
              {bulkActions?.(selectedRows)}
            </div>
          )}
          {hideableColumns.length > 0 && (
            <div className={styles.toolbarRight}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {columnsLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  aria-label={columnsLabel}
                  align="end"
                  sideOffset={4}
                  showArrow={false}
                  className={styles.columnsMenu}
                >
                  <div className={styles.columnsList}>
                    {hideableColumns.map((column) => (
                      <label key={column.id} className={styles.columnToggle}>
                        <Checkbox
                          checked={visibility[column.id] !== false}
                          onChange={() => {
                            toggleColumn(column.id);
                          }}
                        />
                        <span>{column.header}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      ) : null}

      <div className={styles.scroll}>
        <table
          className={styles.table}
          aria-busy={loading || undefined}
          {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}
          {...(ariaLabelledBy !== undefined && { 'aria-labelledby': ariaLabelledBy })}
        >
          {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
          <thead>
            <tr>
              {enableRowSelection && (
                <th scope="col" className={styles.checkboxCell}>
                  <Checkbox
                    aria-label={selectAllLabel}
                    checked={allOnPageSelected}
                    aria-checked={someOnPageSelected ? 'mixed' : undefined}
                    disabled={!hasRows || loading}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const isSorted = sort !== null && sort.id === column.id;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      column.align === 'right' && styles.alignRight,
                      column.align === 'center' && styles.alignCenter,
                    )}
                    style={column.width !== undefined ? { width: column.width } : undefined}
                    {...(column.sortable
                      ? {
                          'aria-sort': isSorted
                            ? sort.dir === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none',
                        }
                      : {})}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => {
                          cycleSort(column.id);
                        }}
                      >
                        <span>{column.header}</span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            styles.sortIndicator,
                            isSorted && styles.sortIndicatorActive,
                          )}
                        >
                          {isSorted ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className={styles.stateCell}>
                  <div role="status" aria-label={loadingLabel} className={styles.loadingRows}>
                    {Array.from({ length: skeletonRowCount }, (_, index) => (
                      <Skeleton key={index} height="2.75rem" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : error !== undefined && error !== null ? (
              <tr>
                <td colSpan={colSpan} className={styles.stateCell}>
                  <ErrorState description={error} {...(onRetry !== undefined && { onRetry })} />
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className={styles.stateCell}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const rowId = rowIdOf(row);
                return (
                  <tr key={rowId}>
                    {enableRowSelection && (
                      <td className={styles.checkboxCell}>
                        <Checkbox
                          aria-label={`Select ${rowLabelOf(row)}`}
                          checked={selected.includes(rowId)}
                          onChange={() => {
                            toggleRow(rowId);
                          }}
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          column.align === 'right' && styles.alignRight,
                          column.align === 'center' && styles.alignCenter,
                        )}
                      >
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {paginationEnabled && effectiveTotalPages !== undefined && (
        <Pagination
          className={styles.pagination}
          aria-label={paginationLabel}
          page={safePage}
          totalPages={effectiveTotalPages}
          onPageChange={changePage}
          pageSize={pageSize}
          pageSizes={pageSizes}
          onPageSizeChange={changePageSize}
        />
      )}
    </div>
  );
}
