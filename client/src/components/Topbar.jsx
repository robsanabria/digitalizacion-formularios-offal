import React from 'react';
import { Bell, Settings, Users, LogOut, Plus, ChevronDown, Menu, Activity, FileText, FileCheck } from 'lucide-react';
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

// Secciones: en línea en desktop, hamburguesa en mobile.
const SECCIONES = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'reg11', label: 'REG-011', icon: FileText },
  { key: 'reg07', label: 'REG-007', icon: FileCheck },
];

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

// ── Menú de secciones (solo mobile → hamburguesa) ──
function SeccionesMobile({ activeTab, onNavigate, esCalidad, onNuevaSolicitud }) {
  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Menú de secciones">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {SECCIONES.map((s) => (
            <DropdownMenuItem key={s.key} className={cn('gap-2', activeTab === s.key && 'text-primary font-semibold')} onClick={() => onNavigate(s.key)}>
              <s.icon className="h-4 w-4" /> {s.label}
            </DropdownMenuItem>
          ))}
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
    </div>
  );
}

export default function Topbar({
  user, pendientes = [], activeTab, onNavigate = () => {},
  onNuevaSolicitud, onGestionUsuarios, onConfig, onLogout,
}) {
  const esCalidad = user?.Rol === 'CALIDAD' || user?.Rol === 'ADMIN';
  const esAdmin = user?.Rol === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Navegación mobile (hamburguesa) */}
      <SeccionesMobile activeTab={activeTab} onNavigate={onNavigate} esCalidad={esCalidad} onNuevaSolicitud={onNuevaSolicitud} />

      {/* Marca */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1 bg-white rounded-md w-8 h-8 flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Offal" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <span className="font-bold text-sm md:text-base whitespace-nowrap">Control de Etiquetas</span>
      </div>

      {/* Menús en línea: solo desktop */}
      <nav className="hidden md:flex items-center gap-1 ml-3">
        {SECCIONES.map((s) => {
          const activo = activeTab === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onNavigate(s.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Acciones derecha */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {esCalidad && (
          <Button onClick={onNuevaSolicitud} className="hidden sm:inline-flex" size="sm">
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Button>
        )}

        <Notifications pendientes={pendientes} />

        {/* Chip de usuario (avatar + nombre + rol). Menú: Configuración / Usuarios. */}
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
          <DropdownMenuContent align="end" className="w-56">
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cerrar sesión: visible (como proveedores) */}
        <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
