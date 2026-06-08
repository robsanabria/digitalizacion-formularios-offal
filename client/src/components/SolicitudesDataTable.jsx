import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown, Eye, Download, MoreHorizontal, Search,
  ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ── Meta de estados (pills coloridas) ──
const ESTADO_META = {
  'REG-011-PENDIENTE-APROBACION': { label: 'Pendiente Aprob. Sistemas', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'REG-011-OBSERVADO': { label: 'Observado', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  'REG-011-APROBADO': { label: 'Pendiente REG-07', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  'REG-011-PENDIENTE': { label: 'Pendiente REG-07', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  'REG-007-PENDIENTE-APROBACION': { label: 'Pendiente Calidad', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'APROBADO': { label: 'Aprobado', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  'RECHAZADO': { label: 'Rechazado', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

function EstadoPill({ estado }) {
  const meta = ESTADO_META[estado] || { label: estado || '-', cls: 'bg-white/10 text-white/70 border-white/20' };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap', meta.cls)}>
      {meta.label}
    </span>
  );
}

// Fecha relativa simple en español ("hace 2 h", "ayer", "12/3/2026")
function fechaRelativa(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
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

export default function SolicitudesDataTable({ data, focus = 'REG011', onOpen, onPrint }) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const RowActions = ({ s }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onOpen(s.SolicitudId, focus)}>
          <Eye className="h-4 w-4" /> Previsualizar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onPrint(s.SolicitudId, focus)}>
          <Download className="h-4 w-4" /> Descargar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <span className="text-muted-foreground text-sm line-clamp-1 max-w-[260px]">{row.original.Motivo || '—'}</span>
      ),
    },
    {
      accessorKey: 'Estado',
      header: ({ column }) => <SortHeader column={column}>Estado</SortHeader>,
      cell: ({ row }) => <EstadoPill estado={row.original.Estado} />,
    },
    {
      id: 'fecha',
      accessorFn: (s) => getFecha(s),
      header: ({ column }) => <SortHeader column={column}>Fecha</SortHeader>,
      sortingFn: 'datetime',
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400" title="Descargar PDF" onClick={() => onPrint(row.original.SolicitudId, focus)}>
            <Download className="h-4 w-4" />
          </Button>
          <RowActions s={row.original} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
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
    initialState: { pagination: { pageSize: 8 } },
    getRowId: (s) => s.SolicitudId,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: búsqueda rápida + contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la tabla..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {selectedCount > 0
            ? <span className="text-primary font-bold">{selectedCount} seleccionada(s)</span>
            : <>{table.getFilteredRowModel().rows.length} registro(s)</>}
        </div>
      </div>

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
                    // Ignorar clicks sobre controles (checkbox, botones)
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
                <TableCell colSpan={columns.length}>
                  <EmptyState />
                </TableCell>
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
              {s.Motivo && <span className="text-xs text-muted-foreground line-clamp-2">{s.Motivo}</span>}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-muted-foreground">{fechaRelativa(getFecha(s))}</span>
                <span className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); onOpen(s.SolicitudId, focus); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400" onClick={(e) => { e.stopPropagation(); onPrint(s.SolicitudId, focus); }}>
                    <Download className="h-4 w-4" />
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
