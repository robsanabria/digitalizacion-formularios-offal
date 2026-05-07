import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, PlusCircle, List, Activity, Settings, User } from 'lucide-react';
import axios from 'axios';
import NuevaSolicitud from './components/NuevaSolicitud';
import DetalleSolicitud from './components/DetalleSolicitud';

function App() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    fetchSolicitudes();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 mr-0 p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Layout className="text-white" size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">REG-SIS-007</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<Activity size={20} />} label="Dashboard" active />
          <NavItem icon={<List size={20} />} label="Solicitudes" />
          <NavItem icon={<PlusCircle size={20} />} label="Nueva Solicitud" onClick={() => setIsModalOpen(true)} />
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <NavItem icon={<Settings size={20} />} label="Configuración" />
          <NavItem icon={<User size={20} />} label="Perfil" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl font-bold">Bienvenido de nuevo</h2>
            <p className="text-text-muted">Gestiona tus solicitudes de cambio de etiquetas</p>
          </motion.div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Nueva Solicitud
          </button>
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
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total Solicitudes" value={solicitudes.length} color="var(--primary)" />
          <StatCard label="Pendientes" value={solicitudes.filter(s => s.Estado === 'pendiente').length} color="#fbbf24" />
          <StatCard label="Aprobadas" value={solicitudes.filter(s => s.Estado === 'aprobado').length} color="#10b981" />
        </div>

        {/* Recent Solicitudes */}
        <section className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6">Solicitudes Recientes</h3>
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
                  {solicitudes.map((s, i) => (
                    <motion.tr 
                      key={s.SolicitudId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-border hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 font-medium">{s.NombreProducto || 'Sin nombre'}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.Estado === 'aprobado' ? 'bg-green-500/20 text-green-400' : 
                          s.Estado === 'borrador' ? 'bg-slate-500/20 text-slate-400' : 
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {s.Estado}
                        </span>
                      </td>
                      <td className="py-4 text-text-muted">
                        {s.FechaCreacion ? new Date(s.FechaCreacion).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => {
                            setSelectedSolicitudId(s.SolicitudId);
                            setIsDetailOpen(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {solicitudes.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-text-muted">
                        No hay solicitudes registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
      active ? 'bg-primary/20 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'
    }`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
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
