import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, PlusCircle, List, Activity, Settings, User, Plus, Users, LogOut } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
          <h1 className="font-bold text-xl tracking-tight">REG-SIS-007</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem 
            icon={<Activity size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsModalOpen(false); setIsDetailOpen(false); }}
          />
          <NavItem 
            icon={<List size={20} />} 
            label="Solicitudes" 
            active={activeTab === 'solicitudes'} 
            onClick={() => { setActiveTab('solicitudes'); setIsModalOpen(false); setIsDetailOpen(false); }}
          />
          <NavItem 
            icon={<PlusCircle size={20} />} 
            label="Nueva Solicitud" 
            onClick={() => setIsModalOpen(true)} 
          />
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Solicitud
            </button>
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
        />

        {/* Contenido condicional según la pestaña activa */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <StatCard label="Total Solicitudes" value={solicitudes.length} color="var(--primary)" />
              <StatCard label="Pendientes Acción" value={solicitudes.filter(s => s.Estado !== 'APROBADO' && s.Estado !== 'RECHAZADO').length} color="#fbbf24" />
              <StatCard label="Finalizadas" value={solicitudes.filter(s => s.Estado === 'APROBADO').length} color="#10b981" />
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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              s.Estado === 'APROBADO' ? 'bg-green-500/20 text-green-400' : 
                              s.Estado === 'REG-007-PENDIENTE-APROBACION' ? 'bg-blue-500/20 text-blue-400' : 
                              s.Estado === 'RECHAZADO' ? 'bg-red-500/20 text-red-400' : 
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {s.Estado === 'REG-011-PENDIENTE' ? 'Pendiente Sistemas' : 
                               s.Estado === 'REG-007-PENDIENTE-APROBACION' ? 'Pendiente Calidad' : s.Estado}
                            </span>
                          </td>
                          <td className="py-4 text-text-muted">
                              {(
                                s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime
                              ) ? new Date(s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={() => {
                                setSelectedSolicitudId(s.SolicitudId);
                                setIsDetailOpen(true);
                              }}
                              className="text-primary hover:text-white hover:underline font-medium transition-all"
                            >
                              Ver detalles
                            </button>
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
            <h3 className="text-2xl font-bold mb-8">Listado Completo de Solicitudes</h3>
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
                  {solicitudes.map((s, i) => (
                    <motion.tr 
                      key={s.SolicitudId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-border hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-4 font-medium">{s.NombreProducto || 'Sin nombre'}</td>
                      <td className="py-4 text-text-muted text-sm truncate max-w-[250px]">{s.Motivo}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.Estado === 'APROBADO' ? 'bg-green-500/20 text-green-400' : 
                          s.Estado === 'REG-007-PENDIENTE-APROBACION' ? 'bg-blue-500/20 text-blue-400' : 
                          s.Estado === 'RECHAZADO' ? 'bg-red-500/20 text-red-400' : 
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {s.Estado === 'REG-011-PENDIENTE' ? 'Pendiente Sistemas' : 
                           s.Estado === 'REG-007-PENDIENTE-APROBACION' ? 'Pendiente Calidad' : s.Estado}
                        </span>
                      </td>
                      <td className="py-4 text-text-muted">
                        {(
                          s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime
                        ) ? new Date(s.FechaPresentacion || s.PresentationDate || s.FechaCreacion || s.PresentationDateTime).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => {
                            setSelectedSolicitudId(s.SolicitudId);
                            setIsDetailOpen(true);
                          }}
                          className="text-primary hover:text-white font-medium transition-all"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </motion.tr>
                  ))}
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
        <button onClick={() => { setActiveTab('solicitudes'); setIsModalOpen(false); setIsDetailOpen(false); }} className={`flex flex-col items-center p-2 ${activeTab === 'solicitudes' ? 'text-primary' : 'text-text-muted'}`}>
          <List size={20} />
          <span className="text-[10px] mt-1 font-medium">Solicitudes</span>
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

function NavItem({ icon, label, active = false, onClick, className = "" }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none transition-all duration-200 ${
      active 
        ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
        : 'text-text-muted hover:bg-white/5 hover:text-white'
    } ${className}`}
    >
      <div className={`${active ? 'text-primary' : 'text-text-muted group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </motion.div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6"
    >
      <p className="text-text-muted text-sm font-medium mb-1">{label}</p>
      <h4 className="text-4xl font-bold" style={{ color }}>{value}</h4>
    </motion.div>
  );
}

export default App;
