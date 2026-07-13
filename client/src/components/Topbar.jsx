import React, { useState, useRef } from 'react';
import { Search, Bell, Settings, Users, LogOut, Plus, ChevronDown, Menu, Activity, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const iniciales = (nombre = '') => {
  const parts = String(nombre).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (nombre || '?').slice(0, 2).toUpperCase();
};

const focusFor = (estado) =>
  (estado === 'REG-007-PENDIENTE-APROBACION' || estado === 'APROBADO' || estado === 'RECHAZADO')
    ? 'REG007' : 'REG011';

// ── Buscador global ──
function GlobalSearch({ solicitudes, onOpenDetail }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef(null);

  const matches = q.trim().length >= 2
    ? solicitudes.filter((s) => {
        const t = q.toLowerCase();
        return [s.NombreProducto, s.CodigoProducto, s.CodigoTwins, s.Motivo]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(t));
      }).slice(0, 6)
    : [];

  const pick = (s) => {
    onOpenDetail(s.SolicitudId, focusFor(s.Estado));
    setQ('');
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-md"
      onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
      onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true); }}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        placeholder="Buscar solicitud, producto, código..."
        className="w-full h-9 rounded-lg border border-border bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Sin resultados para “{q}”.</div>
          ) : matches.map((s) => (
            <button
              key={s.SolicitudId}
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
            >
              {focusFor(s.Estado) === 'REG007'
                ? <FileCheck className="h-4 w-4 text-blue-400 shrink-0" />
                : <FileText className="h-4 w-4 text-amber-400 shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{s.NombreProducto || 'Sin nombre'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{s.CodigoProducto || s.CodigoTwins || s.Estado}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notificaciones (pendientes de mi acción) ──
function Notifications({ pendientes = [] }) {
  const activos = pendientes.filter((p) => p.value > 0);
  const total = activos.reduce((a, p) => a + p.value, 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Pendientes de tu acción</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activos.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">🎉 Sin pendientes.</div>
        ) : activos.map((p, i) => (
          <DropdownMenuItem key={i} onClick={p.onClick} className="flex items-center justify-between">
            <span className="flex flex-col">
              <span className="text-sm font-medium">{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.hint}</span>
            </span>
            <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: p.color + '33', color: p.color }}>{p.value}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Menú de secciones (reemplaza al sidebar): navegación principal ──
function SeccionesMenu({ activeTab, onNavigate, esCalidad, onNuevaSolicitud }) {
  const item = (tab) => cn('gap-2', activeTab === tab && 'text-primary font-semibold');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Menú de secciones">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Secciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={item('dashboard')} onClick={() => onNavigate('dashboard')}>
          <Activity className="h-4 w-4" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem className={item('reg11')} onClick={() => onNavigate('reg11')}>
          <FileText className="h-4 w-4" /> REG-SIS-011
        </DropdownMenuItem>
        <DropdownMenuItem className={item('reg07')} onClick={() => onNavigate('reg07')}>
          <FileCheck className="h-4 w-4" /> REG-SIS-007
        </DropdownMenuItem>
        {esCalidad && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={onNuevaSolicitud}>
              <Plus className="h-4 w-4" /> Nueva Solicitud
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Topbar({
  user, solicitudes = [], pendientes = [], activeTab, onNavigate = () => {},
  onOpenDetail, onNuevaSolicitud, onGestionUsuarios, onConfig, onLogout,
}) {
  const esCalidad = user?.Rol === 'CALIDAD' || user?.Rol === 'ADMIN';
  const esAdmin = user?.Rol === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Navegación principal (menú de secciones) */}
      <SeccionesMenu activeTab={activeTab} onNavigate={onNavigate} esCalidad={esCalidad} onNuevaSolicitud={onNuevaSolicitud} />

      {/* Marca */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1 bg-white rounded-md w-8 h-8 flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Offal" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <span className="hidden sm:block font-bold text-sm md:text-base whitespace-nowrap">Control de Etiquetas</span>
      </div>

      {/* Buscador global */}
      <div className="flex-1 flex justify-center px-1">
        <GlobalSearch solicitudes={solicitudes} onOpenDetail={onOpenDetail} />
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {esCalidad && (
          <Button onClick={onNuevaSolicitud} className="hidden sm:inline-flex" size="sm">
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Button>
        )}

        <Notifications pendientes={pendientes} />

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {iniciales(user?.NombreUsuario)}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">{user?.NombreUsuario || '...'}</span>
                <span className="text-[10px] text-muted-foreground">{user?.Rol || ''}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-foreground truncate">{user?.NombreUsuario || '—'}</p>
              <p className="text-[11px] text-muted-foreground">Rol: <span className="text-primary font-bold">{user?.Rol || '—'}</span></p>
            </div>
            <DropdownMenuSeparator />
            {esCalidad && (
              <DropdownMenuItem onClick={onNuevaSolicitud} className="sm:hidden">
                <Plus className="h-4 w-4" /> Nueva Solicitud
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onConfig}>
              <Settings className="h-4 w-4" /> Configuración
            </DropdownMenuItem>
            {esAdmin && (
              <DropdownMenuItem onClick={onGestionUsuarios}>
                <Users className="h-4 w-4" /> Gestionar usuarios
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-400">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
