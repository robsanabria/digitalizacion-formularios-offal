import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, PlusCircle, List, Activity, Settings, User, Plus, Users, LogOut, Eye, Download, Search, Calendar, Filter, XCircle, ChevronDown, FileText, FileCheck } from 'lucide-react';
import axios from 'axios';
import NuevaSolicitud from './components/NuevaSolicitud';
import DetalleSolicitud from './components/DetalleSolicitud';
import GestionUsuarios from './components/GestionUsuarios';
// Quitamos el import estático para que el build no falle
const logoEmpresa = "/logo.png"; 

function App() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [solicitudesOpen, setSolicitudesOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailFocus, setDetailFocus] = useState('REG011');
  const [printSignal, setPrintSignal] = useState(0);

  const [filterProducto, setFilterProducto] = useState('');
  const [filterCodigoTwins, setFilterCodigoTwins] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');

  const [logoError, setLogoError] = useState(false);

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

  // Abre el panel de detalle enfocando el formulario REG-11 o REG-07.
  // Si print=true, dispara la impresión robusta dentro de DetalleSolicitud.
  const openDetail = (id, focus = 'REG011', print = false) => {
    setSelectedSolicitudId(id);
    setDetailFocus(focus);
    setIsDetailOpen(true);
    setIsModalOpen(false);
    if (print) setPrintSignal(p => p + 1);
  };

  // Foco por defecto según un registro: si ya tiene REG-07, mostrarlo; si no, el REG-11.
  const focusFor = (estado) =>
    (estado === 'REG-007-PENDIENTE-APROBACION' || estado === 'APROBADO' || estado === 'RECHAZADO')
      ? 'REG007' : 'REG011';

  const listFocus = activeTab === 'reg07' ? 'REG007' : 'REG011';

  // Navega a una lista (REG-11/REG-07) con un filtro de estado preaplicado.
  const goToList = (tab, estadoFilter = 'TODOS') => {
    setActiveTab(tab);
    setFilterEstado(estadoFilter);
    setIsModalOpen(false);
    setIsDetailOpen(false);
  };

  // Contadores del circuito para el dashboard.
  const rol = user?.Rol;
  const cuenta = (pred) => solicitudes.filter(pred).length;
  const reg11PorAprobar = cuenta(s => s.Estado === 'REG-011-PENDIENTE-APROBACION');
  const reg07PorCompletar = cuenta(s => ['REG-011-APROBADO', 'REG-011-PENDIENTE'].includes(s.Estado));
  const reg07PorAprobar = cuenta(s => s.Estado === 'REG-007-PENDIENTE-APROBACION');
  const observados = cuenta(s => s.Estado === 'REG-011-OBSERVADO');
  const enCircuito = cuenta(s => s.Estado !== 'APROBADO' && s.Estado !== 'RECHAZADO');
  const finalizadas = cuenta(s => s.Estado === 'APROBADO');

  // Tarjetas "Pendientes de MI acción" según el rol.
  const misPendientes = [];
  if (rol === 'SISTEMAS' || rol === 'ADMIN') {
    misPendientes.push({ label: 'REG-11 por aprobar', value: reg11PorAprobar, color: '#f59e0b', hint: 'Revisá y aprobá u observá la solicitud', onClick: () => goToList('reg11', 'PENDIENTE_APROB_SISTEMAS') });
    misPendientes.push({ label: 'REG-07 por completar', value: reg07PorCompletar, color: '#06b6d4', hint: 'Cargá la respuesta técnica y etiquetas', onClick: () => goToList('reg11', 'PENDIENTE_REG07') });
  }
  if (rol === 'CALIDAD' || rol === 'ADMIN') {
    misPendientes.push({ label: 'REG-07 por aprobar', value: reg07PorAprobar, color: '#3b82f6', hint: 'Aprobación final de Calidad', onClick: () => goToList('reg07', 'PENDIENTE_CALIDAD') });
    misPendientes.push({ label: 'REG-11 observados', value: observados, color: '#f97316', hint: 'Corregí y reenviá a Sistemas', onClick: () => goToList('reg11', 'OBSERVADO') });
  }

  // Un registro "tiene REG-07" cuando Sistemas ya respondió (pendiente, aprobado o rechazado).
  const tieneReg07 = (estado) => ['REG-007-PENDIENTE-APROBACION', 'APROBADO', 'RECHAZADO'].includes(estado);

  const filteredSolicitudes = solicitudes.filter(s => {
    // 0. La vista REG-07 sólo muestra registros con REG-07 ya generado por Sistemas.
    if (activeTab === 'reg07' && !tieneReg07(s.Estado)) return false;

    // 1. Filtro Producto
    if (filterProducto && !s.NombreProducto?.toLowerCase().includes(filterProducto.toLowerCase())) {
      return false;
    }

    // 2. Filtro Código Twins o Producto
    if (filterCodigoTwins) {
      const query = filterCodigoTwins.toLowerCase();
      const codeTwins = (s.CodigoTwins || '').toLowerCase();
      const codeProd = (s.CodigoProducto || '').toLowerCase();
      if (!codeTwins.includes(query) && !codeProd.includes(query)) {
        return false;
      }
    }

    // 3. Filtro Fechas
    const itemDateStr = s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime;
    if (itemDateStr) {
      const itemDate = new Date(itemDateStr);
      itemDate.setHours(0,0,0,0);

      if (filterFechaDesde) {
        const desde = new Date(filterFechaDesde);
        desde.setHours(0,0,0,0);
        if (itemDate < desde) return false;
      }

      if (filterFechaHasta) {
        const hasta = new Date(filterFechaHasta);
        hasta.setHours(0,0,0,0);
        if (itemDate > hasta) return false;
      }
    } else if (filterFechaDesde || filterFechaHasta) {
      return false;
    }

    // 4. Filtro Estado
    if (filterEstado !== 'TODOS') {
      if (filterEstado === 'PENDIENTE_APROB_SISTEMAS' && s.Estado !== 'REG-011-PENDIENTE-APROBACION') return false;
      if (filterEstado === 'OBSERVADO' && s.Estado !== 'REG-011-OBSERVADO') return false;
      if (filterEstado === 'PENDIENTE_REG07' && !['REG-011-APROBADO', 'REG-011-PENDIENTE'].includes(s.Estado)) return false;
      if (filterEstado === 'PENDIENTE_CALIDAD' && s.Estado !== 'REG-007-PENDIENTE-APROBACION') return false;
      if (filterEstado === 'APROBADO' && s.Estado !== 'APROBADO') return false;
      if (filterEstado === 'RECHAZADO' && s.Estado !== 'RECHAZADO') return false;
    }

    return true;
  });

  return (
    <div className="flex min-h-screen pb-20 md:pb-0">
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 mr-0 p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white rounded-lg overflow-hidden flex items-center justify-center w-12 h-12">
            {!logoError ? (
              <img 
                src={logoEmpresa} 
                alt="Logo" 
                className="w-full h-full object-contain" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="p-2 bg-primary w-full h-full flex items-center justify-center">
                <Layout className="text-white" size={24} />
              </div>
            )}
          </div>
          <h1 className="font-bold text-xl tracking-tight">Sistemas Offal</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem 
            icon={<Activity size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsModalOpen(false); setIsDetailOpen(false); }}
          />
          {/* Grupo Solicitudes con submenús REG-11 / REG-07 */}
          <div>
            <NavItem
              icon={<List size={20} />}
              label="Solicitudes"
              active={activeTab === 'reg11' || activeTab === 'reg07'}
              onClick={() => setSolicitudesOpen(o => !o)}
              trailing={<ChevronDown size={16} className={`transition-transform duration-300 ${solicitudesOpen ? 'rotate-180' : ''}`} />}
            />
            {solicitudesOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <NavItem
                  icon={<FileText size={18} />}
                  label="REG-11"
                  active={activeTab === 'reg11'}
                  onClick={() => { setActiveTab('reg11'); setIsModalOpen(false); setIsDetailOpen(false); }}
                />
                <NavItem
                  icon={<FileCheck size={18} />}
                  label="REG-07"
                  active={activeTab === 'reg07'}
                  onClick={() => { setActiveTab('reg07'); setIsModalOpen(false); setIsDetailOpen(false); }}
                />
              </div>
            )}
          </div>
          {user?.Rol === 'CALIDAD' && (
            <NavItem 
              icon={<PlusCircle size={20} />} 
              label="Nueva Solicitud" 
              onClick={() => setIsModalOpen(true)} 
            />
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <NavItem icon={<Settings size={20} />} label="Configuración" />
          <NavItem 
            icon={<LogOut size={20} />} 
            label="Cerrar Sesión" 
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl font-bold">Hola, {user ? user.NombreUsuario : '...'}</h2>
            <p className="text-text-muted">
              Rol: <span className="text-primary font-bold">{user ? user.Rol : 'Cargando...'}</span>
            </p>
          </motion.div>
          
          <div className="flex gap-3 flex-wrap mt-2 md:mt-0">
            {user && user.Rol === 'ADMIN' && (
              <button 
                onClick={() => setIsUserMgmtOpen(true)}
                className="btn btn-outline btn-info gap-2"
              >
                <Users size={20} />
                Gestionar Usuarios
              </button>
            )}
            {user?.Rol === 'CALIDAD' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Solicitud
              </button>
            )}
          </div>
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
                          className="border-b border-border hover:bg-white/5 transition-colors group"
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
                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-full transition-all"
                                title="Descargar PDF"
                              >
                                <Download size={18} />
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
        ) : (
          <section className="glass-card p-8 min-h-[500px]">
            <h3 className="text-2xl font-bold mb-2">
              {activeTab === 'reg07' ? 'Solicitudes — Vista REG-SIS-007' : 'Solicitudes — Vista REG-SIS-011'}
            </h3>
            <p className="text-text-muted text-sm mb-8">
              {activeTab === 'reg07'
                ? 'Cada registro abre directamente su formulario REG-07 (respuesta técnica de Sistemas).'
                : 'Cada registro abre directamente su formulario REG-11 (solicitud original de Calidad).'}
            </p>

            {/* Panel de Filtros */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 mb-8 flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Filter size={14} /> Filtros de Búsqueda
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Filtro Producto */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Producto</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Buscar producto..."
                      value={filterProducto}
                      onChange={e => setFilterProducto(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-white/30" size={14} />
                  </div>
                </div>

                {/* Filtro Código Twins */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Código Twins / Prod</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ej: Twins..."
                      value={filterCodigoTwins}
                      onChange={e => setFilterCodigoTwins(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-white/30" size={14} />
                  </div>
                </div>

                {/* Filtro Fecha Desde */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Fecha Desde</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={filterFechaDesde}
                      onChange={e => setFilterFechaDesde(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-primary transition-colors scheme-dark"
                    />
                    <Calendar className="absolute left-2.5 top-2.5 text-white/30" size={14} />
                  </div>
                </div>

                {/* Filtro Fecha Hasta */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Fecha Hasta</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={filterFechaHasta}
                      onChange={e => setFilterFechaHasta(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-primary transition-colors scheme-dark"
                    />
                    <Calendar className="absolute left-2.5 top-2.5 text-white/30" size={14} />
                  </div>
                </div>

                {/* Filtro Estado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Estado</label>
                  <select
                    value={filterEstado}
                    onChange={e => setFilterEstado(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="TODOS" className="bg-slate-900 text-white">Todos</option>
                    <option value="PENDIENTE_APROB_SISTEMAS" className="bg-slate-900 text-white">Pendiente Aprob. Sistemas</option>
                    <option value="OBSERVADO" className="bg-slate-900 text-white">Observadas</option>
                    <option value="PENDIENTE_REG07" className="bg-slate-900 text-white">Pendiente REG-07</option>
                    <option value="PENDIENTE_CALIDAD" className="bg-slate-900 text-white">Pendiente Calidad</option>
                    <option value="APROBADO" className="bg-slate-900 text-white">Aprobadas</option>
                    <option value="RECHAZADO" className="bg-slate-900 text-white">Rechazadas</option>
                  </select>
                </div>
              </div>

              {/* Botón de limpiar si hay filtros activos */}
              {(filterProducto || filterCodigoTwins || filterFechaDesde || filterFechaHasta || filterEstado !== 'TODOS') && (
                <div className="flex justify-end mt-2 animate-in fade-in slide-in-from-right-2 duration-200">
                  <button 
                    onClick={() => {
                      setFilterProducto('');
                      setFilterCodigoTwins('');
                      setFilterFechaDesde('');
                      setFilterFechaHasta('');
                      setFilterEstado('TODOS');
                    }}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors uppercase tracking-wider"
                  >
                    <XCircle size={14} /> Limpiar Filtros
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="pb-4 font-medium">Producto</th>
                    <th className="pb-4 font-medium">Motivo</th>
                    <th className="pb-4 font-medium">Estado</th>
                    <th className="pb-4 font-medium">Fecha</th>
                    <th className="pb-4 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-muted font-medium uppercase tracking-wider text-xs">
                        No se encontraron solicitudes que coincidan con los filtros de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredSolicitudes.map((s, i) => (
                      <motion.tr 
                        key={s.SolicitudId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-border hover:bg-white/5 transition-colors group"
                      >
                        <td className="py-4 font-medium">{s.NombreProducto || 'Sin nombre'}</td>
                        <td className="py-4 text-text-muted text-sm truncate max-w-[250px]">{s.Motivo}</td>
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
                              onClick={() => openDetail(s.SolicitudId, listFocus)}
                              className="p-2 hover:bg-primary/20 text-primary rounded-full transition-all"
                              title="Previsualizar"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openDetail(s.SolicitudId, listFocus, true)}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-full transition-all"
                              title="Descargar PDF"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card m-0 rounded-t-2xl rounded-b-none border-t border-border flex justify-around items-center p-2 z-40 pb-4">
        <button onClick={() => { setActiveTab('dashboard'); setIsModalOpen(false); setIsDetailOpen(false); }} className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-primary' : 'text-text-muted'}`}>
          <Activity size={20} />
          <span className="text-[10px] mt-1 font-medium">Dashboard</span>
        </button>
        <button onClick={() => { setActiveTab('reg11'); setIsModalOpen(false); setIsDetailOpen(false); }} className={`flex flex-col items-center p-2 ${activeTab === 'reg11' ? 'text-primary' : 'text-text-muted'}`}>
          <FileText size={20} />
          <span className="text-[10px] mt-1 font-medium">REG-11</span>
        </button>
        <button onClick={() => { setActiveTab('reg07'); setIsModalOpen(false); setIsDetailOpen(false); }} className={`flex flex-col items-center p-2 ${activeTab === 'reg07' ? 'text-primary' : 'text-text-muted'}`}>
          <FileCheck size={20} />
          <span className="text-[10px] mt-1 font-medium">REG-07</span>
        </button>
        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center p-2 text-text-muted hover:text-primary transition-colors">
          <PlusCircle size={20} />
          <span className="text-[10px] mt-1 font-medium">Nueva</span>
        </button>
        {user && user.Rol === 'ADMIN' && (
          <button onClick={() => setIsUserMgmtOpen(true)} className="flex flex-col items-center p-2 text-text-muted hover:text-primary transition-colors">
            <Users size={20} />
            <span className="text-[10px] mt-1 font-medium">Usuarios</span>
          </button>
        )}
        <button onClick={handleLogout} className="flex flex-col items-center p-2 text-text-muted hover:text-primary transition-colors">
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">Salir</span>
        </button>
      </nav>

      <GestionUsuarios 
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
      />
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, className = "", trailing = null }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, x: 6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-all duration-300 relative overflow-hidden group ${
        active
          ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/30 shadow-[0_4px_20px_rgba(99,102,241,0.25)]'
          : 'text-text-muted hover:bg-white/5 hover:text-white'
      } ${className}`}
    >
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-indigo-400 rounded-r-md"
        />
      )}
      <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-primary' : 'text-text-muted group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="font-semibold text-sm tracking-wide">{label}</span>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </motion.div>
  );
}

const ESTADO_META = {
  'REG-011-PENDIENTE-APROBACION': { label: 'Pendiente Aprob. Sistemas', cls: 'bg-amber-500/20 text-amber-400' },
  'REG-011-OBSERVADO': { label: 'Observado', cls: 'bg-orange-500/20 text-orange-400' },
  'REG-011-APROBADO': { label: 'Pendiente REG-07', cls: 'bg-cyan-500/20 text-cyan-400' },
  'REG-011-PENDIENTE': { label: 'Pendiente REG-07', cls: 'bg-cyan-500/20 text-cyan-400' }, // legacy
  'REG-007-PENDIENTE-APROBACION': { label: 'Pendiente Calidad', cls: 'bg-blue-500/20 text-blue-400' },
  'APROBADO': { label: 'Aprobado', cls: 'bg-green-500/20 text-green-400' },
  'RECHAZADO': { label: 'Rechazado', cls: 'bg-red-500/20 text-red-400' },
};

function EstadoBadge({ estado }) {
  const meta = ESTADO_META[estado] || { label: estado || '-', cls: 'bg-yellow-500/20 text-yellow-400' };
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
        tiene ? 'border-white/10 hover:shadow-2xl' : 'border-white/5 opacity-60'
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

function StatCard({ label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-card p-6 border border-white/5 relative overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300"
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
