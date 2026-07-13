import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Settings, Eye, Printer } from 'lucide-react';
import axios from 'axios';
import NuevaSolicitud from './components/NuevaSolicitud';
import DetalleSolicitud from './components/DetalleSolicitud';
import GestionUsuarios from './components/GestionUsuarios';
import SolicitudesDataTable from './components/SolicitudesDataTable';
import Topbar from './components/Topbar';
import SoporteWidget from './components/SoporteWidget';

function App() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailFocus, setDetailFocus] = useState('REG011');
  const [printSignal, setPrintSignal] = useState(0);

  // Estado(s) preseleccionado(s) para el data grid al navegar desde el dashboard.
  const [presetEstado, setPresetEstado] = useState([]);


  const handleLogout = () => {
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Error al cargar usuario", err);
    }
  };

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/solicitudes');
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      await fetchSolicitudes();
    };
    init();
  }, []);

  // Abre el panel de detalle enfocando el formulario REG-SIS-011 o REG-SIS-007.
  // Si print=true, dispara la impresión robusta dentro de DetalleSolicitud.
  const openDetail = (id, focus = 'REG011', print = false) => {
    setSelectedSolicitudId(id);
    setDetailFocus(focus);
    setIsDetailOpen(true);
    setIsModalOpen(false);
    if (print) setPrintSignal(p => p + 1);
  };

  // Foco por defecto según un registro: si ya tiene REG-SIS-007, mostrarlo; si no, el REG-SIS-011.
  const focusFor = (estado) =>
    (estado === 'REG-007-PENDIENTE-APROBACION' || estado === 'REG-007-PARCIAL' || estado === 'APROBADO' || estado === 'RECHAZADO')
      ? 'REG007' : 'REG011';

  const listFocus = activeTab === 'reg07' ? 'REG007' : 'REG011';

  // Navega a una lista (REG-SIS-011/REG-SIS-007) preseleccionando uno o más estados en el data grid.
  const goToList = (tab, estados = []) => {
    setActiveTab(tab);
    setPresetEstado(estados);
    setIsModalOpen(false);
    setIsDetailOpen(false);
  };

  // Cambia de submenú limpiando cualquier preset de estado.
  const switchTab = (tab) => {
    setActiveTab(tab);
    setPresetEstado([]);
    setIsModalOpen(false);
    setIsDetailOpen(false);
  };

  // Contadores del circuito para el dashboard.
  const rol = user?.Rol;
  const cuenta = (pred) => solicitudes.filter(pred).length;
  const reg11PorAprobar = cuenta(s => s.Estado === 'REG-011-PENDIENTE-APROBACION');
  const reg07PorCompletar = cuenta(s => ['REG-011-APROBADO', 'REG-011-PENDIENTE', 'REG-007-PARCIAL'].includes(s.Estado));
  const reg07PorAprobar = cuenta(s => s.Estado === 'REG-007-PENDIENTE-APROBACION');
  const observados = cuenta(s => s.Estado === 'REG-011-OBSERVADO');
  const enCircuito = cuenta(s => s.Estado !== 'APROBADO' && s.Estado !== 'RECHAZADO');
  const finalizadas = cuenta(s => s.Estado === 'APROBADO');

  // Tarjetas "Pendientes de MI acción" según el rol.
  const misPendientes = [];
  if (rol === 'SISTEMAS' || rol === 'ADMIN') {
    misPendientes.push({ label: 'REG-SIS-011 por aprobar', value: reg11PorAprobar, color: '#f59e0b', hint: 'Revisá y aprobá u observá la solicitud', onClick: () => goToList('reg11', ['REG-011-PENDIENTE-APROBACION']) });
    misPendientes.push({ label: 'REG-SIS-007 por completar', value: reg07PorCompletar, color: '#06b6d4', hint: 'Cargá la respuesta técnica y etiquetas', onClick: () => goToList('reg11', ['REG-011-APROBADO', 'REG-011-PENDIENTE']) });
  }
  if (rol === 'CALIDAD' || rol === 'ADMIN') {
    misPendientes.push({ label: 'REG-SIS-007 por aprobar', value: reg07PorAprobar, color: '#3b82f6', hint: 'Aprobación final de Calidad', onClick: () => goToList('reg07', ['REG-007-PENDIENTE-APROBACION']) });
    misPendientes.push({ label: 'REG-SIS-011 observados', value: observados, color: '#f97316', hint: 'Corregí y reenviá a Sistemas', onClick: () => goToList('reg11', ['REG-011-OBSERVADO']) });
  }

  // Un registro "tiene REG-SIS-007" cuando Sistemas ya respondió (pendiente, aprobado o rechazado).
  const tieneReg07 = (estado) => ['REG-007-PENDIENTE-APROBACION', 'REG-007-PARCIAL', 'APROBADO', 'RECHAZADO'].includes(estado);

  // La vista REG-SIS-007 sólo muestra registros con REG-SIS-007 ya generado. El resto del
  // filtrado (búsqueda, estado, fechas) vive dentro del data grid.
  const listData = activeTab === 'reg07'
    ? solicitudes.filter(s => tieneReg07(s.Estado))
    : solicitudes;

  return (
    <div className="min-h-screen">

      {/* Main Content */}
      <main className="w-full overflow-x-hidden flex flex-col min-w-0">
        {/* Topbar global */}
        <Topbar
          user={user}
          solicitudes={solicitudes}
          pendientes={misPendientes}
          activeTab={activeTab}
          onNavigate={switchTab}
          onOpenDetail={(id, f) => openDetail(id, f)}
          onNuevaSolicitud={() => setIsModalOpen(true)}
          onGestionUsuarios={() => setIsUserMgmtOpen(true)}
          onConfig={() => { setActiveTab('config'); setIsModalOpen(false); setIsDetailOpen(false); }}
          onLogout={handleLogout}
        />

        <div className="p-4 md:p-8">
        <header className="mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold">Hola, {user ? user.NombreUsuario : '...'}</h2>
            <p className="text-text-muted">
              Rol: <span className="text-primary font-bold">{user ? user.Rol : 'Cargando...'}</span>
            </p>
          </motion.div>
        </header>

        {/* Modal de Nueva Solicitud */}
        <NuevaSolicitud 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreated={fetchSolicitudes}
        />

        {/* Panel de Detalle */}
        <DetalleSolicitud
          solicitudId={selectedSolicitudId}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          user={user}
          onUpdated={fetchSolicitudes}
          focusForm={detailFocus}
          printSignal={printSignal}
        />

        {/* Contenido condicional según la pestaña activa */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Pendientes de MI acción (según rol) */}
            {misPendientes.length > 0 && (
              <section className="mb-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-primary" /> Pendientes de tu acción
                  <span className="text-[10px] font-bold text-primary normal-case tracking-normal">({rol})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {misPendientes.map((c, i) => (
                    <ActionCard key={i} {...c} />
                  ))}
                </div>
              </section>
            )}

            {/* Stats Grid generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <StatCard label="Total Solicitudes" value={solicitudes.length} color="var(--primary)" />
              <StatCard label="En circuito" value={enCircuito} color="#fbbf24" />
              <StatCard label="Finalizadas" value={finalizadas} color="#10b981" />
            </div>

            {/* Recent Solicitudes */}
            <section className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Solicitudes Recientes
              </h3>
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-text-muted border-b border-border">
                        <th className="pb-4 font-medium">Producto</th>
                        <th className="pb-4 font-medium">Estado</th>
                        <th className="pb-4 font-medium">Fecha</th>
                        <th className="pb-4 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudes.slice(0, 5).map((s, i) => (
                        <motion.tr 
                          key={s.SolicitudId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="border-b border-border hover:bg-black/[0.04] dark:bg-white/5 transition-colors group"
                        >
                          <td className="py-4 font-medium">{s.NombreProducto || 'Sin nombre'}</td>
                          <td className="py-4">
                            <EstadoBadge estado={s.Estado} />
                          </td>
                          <td className="py-4 text-text-muted">
                              {(
                                s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime
                              ) ? new Date(s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openDetail(s.SolicitudId, focusFor(s.Estado))}
                                className="p-2 hover:bg-primary/20 text-primary rounded-full transition-all"
                                title="Previsualizar Registro"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => openDetail(s.SolicitudId, focusFor(s.Estado), true)}
                                className="p-2 hover:bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full transition-all"
                                title="Imprimir"
                              >
                                <Printer size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : activeTab === 'config' ? (
          <ConfigPanel user={user} />
        ) : (
          <section className="glass-card p-8 min-h-[500px]">
            <h3 className="text-2xl font-bold mb-2">
              {activeTab === 'reg07' ? 'Solicitudes — Vista REG-SIS-007' : 'Solicitudes — Vista REG-SIS-011'}
            </h3>
            <p className="text-text-muted text-sm mb-8">
              {activeTab === 'reg07'
                ? 'Cada registro abre directamente su formulario REG-SIS-007 (respuesta técnica de Sistemas).'
                : 'Cada registro abre directamente su formulario REG-SIS-011 (solicitud original de Calidad).'}
            </p>

            <SolicitudesDataTable
              key={`${activeTab}-${presetEstado.join(',')}`}
              data={listData}
              focus={listFocus}
              initialEstado={presetEstado}
              onOpen={(id, f) => openDetail(id, f)}
              onPrint={(id, f) => openDetail(id, f, true)}
            />
          </section>
        )}
        </div>
      </main>


      <GestionUsuarios
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
      />

      {/* Widget flotante de ayuda / soporte (arma un ticket por mail) */}
      <SoporteWidget user={user} />
    </div>
  );
}


const ESTADO_META = {
  'REG-011-PENDIENTE-APROBACION': { label: 'Pendiente Aprob. Sistemas', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  'REG-011-OBSERVADO': { label: 'Observado', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  'REG-011-APROBADO': { label: 'Aprobado - Pendiente de REG-SIS-007', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' },
  'REG-011-PENDIENTE': { label: 'Aprobado - Pendiente de REG-SIS-007', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' }, // legacy
  'REG-007-PENDIENTE-APROBACION': { label: 'Pendiente Calidad', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  'REG-007-PARCIAL': { label: 'Aprobado Parcialmente (a corregir)', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  'APROBADO': { label: 'Aprobado', cls: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
  'RECHAZADO': { label: 'Rechazado', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
};

function EstadoBadge({ estado }) {
  const meta = ESTADO_META[estado] || { label: estado || '-', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function ActionCard({ label, value, color, hint, onClick }) {
  const tiene = value > 0;
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`glass-card p-6 text-left relative overflow-hidden group shadow-lg transition-all duration-300 border ${
        tiene ? 'border-black/10 dark:border-white/10 hover:shadow-2xl' : 'border-black/10 dark:border-white/10 opacity-60'
      }`}
    >
      <div
        className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</span>
          <span className="text-[11px] text-text-muted/70 font-medium">{hint}</span>
        </div>
        <h4 className="text-4xl font-black tracking-tight shrink-0" style={{ color: tiene ? color : 'var(--text-muted)' }}>{value}</h4>
      </div>
      {tiene && (
        <div className="mt-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color }}>
          Ver lista →
        </div>
      )}
    </motion.button>
  );
}

function ConfigPanel({ user }) {
  return (
    <section className="glass-card p-8 min-h-[400px]">
      <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Settings size={22} className="text-primary" /> Configuración
      </h3>
      <p className="text-text-muted text-sm mb-8">Preferencias de tu cuenta y del sistema.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-5">
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-3">Mi cuenta</p>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              {(user?.NombreUsuario || '?').slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-bold">{user?.NombreUsuario || '—'}</p>
              <p className="text-xs text-text-muted">Rol: <span className="text-primary font-bold">{user?.Rol || '—'}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-2">Próximamente</p>
          <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
            <li>Tema claro / oscuro</li>
            <li>Notificaciones por email</li>
            <li>Preferencias de impresión</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-card p-6 border border-black/10 dark:border-white/10 relative overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Glow effect matching indicator color */}
      <div 
        className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
      <h4 className="text-4xl font-black tracking-tight" style={{ color }}>{value}</h4>
    </motion.div>
  );
}

export default App;
