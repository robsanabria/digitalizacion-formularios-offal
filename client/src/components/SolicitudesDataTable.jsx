import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown, Eye, Printer, MoreHorizontal, Search, ListFilter, Calendar,
  ChevronLeft, ChevronRight, Inbox, X, Check,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ── Meta de estados (pills coloridas + label legible) ──
const ESTADO_META = {
  'REG-011-PENDIENTE-APROBACION': { label: 'Pendiente Aprob. Sistemas', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30', dot: 'bg-amber-400' },
  'REG-011-OBSERVADO': { label: 'Observado', cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30', dot: 'bg-orange-400' },
  'REG-011-APROBADO': { label: 'Aprobado - Pendiente de REG-SIS-007', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30', dot: 'bg-cyan-400' },
  'REG-011-PENDIENTE': { label: 'Aprobado - Pendiente de REG-SIS-007', cls: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30', dot: 'bg-cyan-400' },
  'REG-007-PENDIENTE-APROBACION': { label: 'Pendiente Calidad', cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30', dot: 'bg-blue-400' },
  'REG-007-PARCIAL': { label: 'Aprobado Parcialmente (a corregir)', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30', dot: 'bg-amber-400' },
  'APROBADO': { label: 'Aprobado', cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30', dot: 'bg-green-400' },
  'RECHAZADO': { label: 'Rechazado', cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', dot: 'bg-red-400' },
};
const estadoLabel = (e) => ESTADO_META[e]?.label || e;

// El Motivo se guarda como array en JSON (p.ej. '["SENASA"]'); a veces quedó
// vacío o doble-anidado ('[[]]'). Lo mostramos legible, separado por " / ".
function motivosLegibles(val) {
  if (val == null || val === '') return '';
  let parsed = val;
  if (typeof val === 'string') {
    try { parsed = JSON.parse(val); } catch { return val; }
  }
  const flat = Array.isArray(parsed) ? parsed.flat(Infinity) : [parsed];
  return flat.filter((x) => x != null && String(x).trim() !== '').map(String).join(' / ');
}

function EstadoPill({ estado }) {
  const meta = ESTADO_META[estado] || { label: estado || '-', cls: 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-white/10 dark:text-white/70 dark:border-white/20' };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap', meta.cls)}>
      {meta.label}
    </span>
  );
}

// Fecha relativa simple en español
function fechaRelativa(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return d.toLocaleDateString();
}

const getFecha = (s) => s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime;

// ── Filtros ──
const estadoFilterFn = (row, id, value) =>
  !value || value.length === 0 || value.includes(row.getValue(id));

const fechaFilterFn = (row, id, value) => {
  if (!value || (!value.from && !value.to)) return true;
  const raw = row.getValue(id);
  if (!raw) return false;
  const d = new Date(raw); d.setHours(0, 0, 0, 0);
  if (value.from) { const f = new Date(value.from); f.setHours(0, 0, 0, 0); if (d < f) return false; }
  if (value.to) { const t = new Date(value.to); t.setHours(0, 0, 0, 0); if (d > t) return false; }
  return true;
};

function SortHeader({ column, children }) {
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
    </button>
  );
}

export default function SolicitudesDataTable({ data, focus = 'REG011', onOpen, onPrint, initialEstado = [] }) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState(
    initialEstado?.length ? [{ id: 'Estado', value: initialEstado }] : []
  );

  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'NombreProducto',
      header: ({ column }) => <SortHeader column={column}>Producto</SortHeader>,
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.NombreProducto || 'Sin nombre'}</span>,
    },
    {
      accessorKey: 'Motivo',
      header: 'Motivo',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm line-clamp-1 max-w-[260px]">{motivosLegibles(row.original.Motivo) || '—'}</span>
      ),
    },
    {
      accessorKey: 'Estado',
      header: ({ column }) => <SortHeader column={column}>Estado</SortHeader>,
      filterFn: estadoFilterFn,
      cell: ({ row }) => <EstadoPill estado={row.original.Estado} />,
    },
    {
      id: 'fecha',
      accessorFn: (s) => getFecha(s),
      header: ({ column }) => <SortHeader column={column}>Fecha</SortHeader>,
      sortingFn: 'datetime',
      filterFn: fechaFilterFn,
      cell: ({ row }) => <span className="text-muted-foreground text-sm whitespace-nowrap">{fechaRelativa(getFecha(row.original))}</span>,
    },
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Previsualizar" onClick={() => onOpen(row.original.SolicitudId, focus)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 dark:text-green-400" title="Imprimir" onClick={() => onPrint(row.original.SolicitudId, focus)}>
            <Printer className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOpen(row.original.SolicitudId, focus)}><Eye className="h-4 w-4" /> Previsualizar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onPrint(row.original.SolicitudId, focus)}><Printer className="h-4 w-4" /> Imprimir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase();
      const s = row.original;
      return [s.NombreProducto, s.Motivo, s.CodigoProducto, s.CodigoTwins, s.Estado]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 8 } },
    getRowId: (s) => s.SolicitudId,
  });

  const estadoCol = table.getColumn('Estado');
  const fechaCol = table.getColumn('fecha');
  const estadoSel = (estadoCol?.getFilterValue()) ?? [];
  const fechaSel = (fechaCol?.getFilterValue()) ?? {};
  const facetCounts = estadoCol?.getFacetedUniqueValues() ?? new Map();
  const estadoOptions = Array.from(facetCounts.keys()).sort((a, b) => estadoLabel(a).localeCompare(estadoLabel(b)));

  const toggleEstado = (e) => {
    const cur = new Set(estadoSel);
    cur.has(e) ? cur.delete(e) : cur.add(e);
    estadoCol?.setFilterValue(cur.size ? Array.from(cur) : undefined);
  };

  const hayFiltros = globalFilter || estadoSel.length || fechaSel.from || fechaSel.to;
  const resetFiltros = () => {
    setGlobalFilter('');
    setColumnFilters([]);
  };

  const selectedCount = Object.keys(rowSelection).length;
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar de filtros ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto, código, motivo..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Facet de Estado */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-dashed">
                <ListFilter className="h-4 w-4" /> Estado
                {estadoSel.length > 0 && (
                  <span className="ml-1 rounded bg-primary/20 text-primary px-1.5 text-[10px] font-bold">{estadoSel.length}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Filtrar por estado</p>
              <div className="flex flex-col">
                {estadoOptions.length === 0 && <p className="text-xs text-muted-foreground px-2 py-2">Sin estados</p>}
                {estadoOptions.map((e) => {
                  const checked = estadoSel.includes(e);
                  return (
                    <button
                      key={e}
                      onClick={() => toggleEstado(e)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
                    >
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded border', checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs flex-1">
                        <span className={cn('h-1.5 w-1.5 rounded-full', ESTADO_META[e]?.dot || 'bg-gray-400')} />
                        {estadoLabel(e)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">{facetCounts.get(e)}</span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Rango de fechas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-dashed">
                <Calendar className="h-4 w-4" /> Fecha
                {(fechaSel.from || fechaSel.to) && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Rango de fechas</p>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-muted-foreground">Desde
                  <Input type="date" value={fechaSel.from || ''} onChange={(e) => fechaCol?.setFilterValue({ ...fechaSel, from: e.target.value })} className="mt-1" />
                </label>
                <label className="text-[11px] text-muted-foreground">Hasta
                  <Input type="date" value={fechaSel.to || ''} onChange={(e) => fechaCol?.setFilterValue({ ...fechaSel, to: e.target.value })} className="mt-1" />
                </label>
                {(fechaSel.from || fechaSel.to) && (
                  <Button variant="ghost" size="sm" onClick={() => fechaCol?.setFilterValue(undefined)}>Limpiar fechas</Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {hayFiltros ? (
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={resetFiltros}>
              <X className="h-4 w-4" /> Limpiar
            </Button>
          ) : null}
        </div>

        <div className="lg:ml-auto text-xs text-muted-foreground font-medium">
          {selectedCount > 0
            ? <span className="text-primary font-bold">{selectedCount} seleccionada(s)</span>
            : <>{table.getFilteredRowModel().rows.length} registro(s)</>}
        </div>
      </div>

      {/* ── Chips de filtros activos ── */}
      {(estadoSel.length > 0 || fechaSel.from || fechaSel.to) && (
        <div className="flex flex-wrap items-center gap-2">
          {estadoSel.map((e) => (
            <button key={e} onClick={() => toggleEstado(e)}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors">
              <span className={cn('h-1.5 w-1.5 rounded-full', ESTADO_META[e]?.dot || 'bg-gray-400')} />
              {estadoLabel(e)}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
          {(fechaSel.from || fechaSel.to) && (
            <button onClick={() => fechaCol?.setFilterValue(undefined)}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors">
              <Calendar className="h-3 w-3 opacity-70" />
              {fechaSel.from ? new Date(fechaSel.from).toLocaleDateString() : '…'} – {fechaSel.to ? new Date(fechaSel.to).toLocaleDateString() : '…'}
              <X className="h-3 w-3 opacity-60" />
            </button>
          )}
        </div>
      )}

      {/* ── Vista de tabla (desktop) ── */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (e.target.closest('button, [role="checkbox"], [role="menu"]')) return;
                    onOpen(row.original.SolicitudId, focus);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}><EmptyState /></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Vista de tarjetas (mobile) ── */}
      <div className="md:hidden flex flex-col gap-3">
        {rows.length ? rows.map((row) => {
          const s = row.original;
          return (
            <button
              key={row.id}
              onClick={() => onOpen(s.SolicitudId, focus)}
              className="text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-foreground">{s.NombreProducto || 'Sin nombre'}</span>
                <EstadoPill estado={s.Estado} />
              </div>
              {motivosLegibles(s.Motivo) && <span className="text-xs text-muted-foreground line-clamp-2">{motivosLegibles(s.Motivo)}</span>}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-muted-foreground">{fechaRelativa(getFecha(s))}</span>
                <span className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); onOpen(s.SolicitudId, focus); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 dark:text-green-400" onClick={(e) => { e.stopPropagation(); onPrint(s.SolicitudId, focus); }}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            </button>
          );
        }) : <EmptyState />}
      </div>

      {/* ── Paginación ── */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="p-4 rounded-full bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">No hay solicitudes para mostrar</p>
      <p className="text-xs text-muted-foreground max-w-xs">Ajustá los filtros de búsqueda o creá una nueva solicitud para verla acá.</p>
    </div>
  );
}
