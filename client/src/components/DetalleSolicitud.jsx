import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Tag, Download, ExternalLink, Loader2, Check, X as XIcon } from 'lucide-react';
import axios from 'axios';

const DetalleSolicitud = ({ solicitudId, isOpen, onClose, user, onUpdated }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (isOpen && solicitudId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [solRes, adjRes] = await Promise.all([
            axios.get(`/api/solicitudes/${solicitudId}`),
            axios.get(`/api/solicitudes/${solicitudId}/adjuntos`)
          ]);
          setSolicitud(solRes.data);
          setAdjuntos(adjRes.data);
        } catch (err) {
          console.error("Error al cargar datos", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, solicitudId]);

  const handleEstadoChange = async (nuevoEstado) => {
    // 1. Preguntar confirmación
    const confirmacion = window.confirm(`¿Está seguro que desea ${nuevoEstado === 'rechazado' ? 'rechazar' : 'aprobar'} esta solicitud?`);
    if (!confirmacion) return;

    setStatusLoading(true);
    try {
      let estadoFinal = nuevoEstado;
      
      if (nuevoEstado === 'aprobado') {
        if (user?.Rol === 'CALIDAD' || user?.Rol === 'ADMIN') {
          estadoFinal = solicitud.Estado === 'Aprobado por sistemas' ? 'Aprobado por Sistemas y Calidad' : 'Aprobado por calidad';
        }
        if (user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN') {
          // Si es ADMIN y ya estaba aprobado por calidad, lo pasa a final. Si es Sistemas, hace su parte.
          estadoFinal = (solicitud.Estado === 'Aprobado por calidad' || estadoFinal === 'Aprobado por calidad' && user.Rol === 'ADMIN') 
            ? 'Aprobado por Sistemas y Calidad' 
            : 'Aprobado por sistemas';
        }
      }

      await axios.put(`/api/solicitudes/${solicitudId}`, { 
        ...solicitud,
        Estado: estadoFinal 
      });
      
      setSolicitud({ ...solicitud, Estado: estadoFinal });
      if (onUpdated) onUpdated();
      
      alert(`Solicitud actualizada a: ${estadoFinal}`);
    } catch (err) {
      console.error("Error en handleEstadoChange:", err);
      alert("Error al actualizar el estado");
    } finally {
      setStatusLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl h-full m-0 rounded-none md:m-4 md:rounded-xl p-8 relative overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors">
          <X size={24} />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-text-muted">Cargando detalles...</p>
          </div>
        ) : solicitud ? (
          <div className="flex flex-col gap-8">
            <header>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Tag size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">{solicitud.Estado}</span>
              </div>
              <h2 className="text-3xl font-bold">{solicitud.NombreProducto}</h2>
              <p className="text-text-muted mt-2">{solicitud.Motivo}</p>
            </header>

            <div className="grid grid-cols-2 gap-6">
              <InfoItem icon={<Calendar size={18} />} label="Fecha Presentación" value={solicitud.FechaPresentacion ? new Date(solicitud.FechaPresentacion).toLocaleDateString() : '-'} />
              <InfoItem icon={<User size={18} />} label="Solicitado por" value={solicitud.RolSolicitante} />
              <InfoItem icon={<FileText size={18} />} label="Tipo SENASA" value={solicitud.TipoSenasa} />
              <InfoItem icon={<Tag size={18} />} label="Código" value={solicitud.Codigo || '-'} />
            </div>

            {/* Acciones de Aprobación para Calidad/Sistemas/Admin */}
            {(user?.Rol === 'CALIDAD' || user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN') && (
              <section className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Validación de Solicitud</h3>
                <div className="flex gap-4">
                  <button 
                    disabled={statusLoading || solicitud.Estado === 'Aprobado por Sistemas y Calidad' || (solicitud.Estado === 'Aprobado por calidad' && user?.Rol === 'CALIDAD') || (solicitud.Estado === 'Aprobado por sistemas' && user?.Rol === 'SISTEMAS')}
                    onClick={() => handleEstadoChange('aprobado')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                      solicitud.Estado === 'Aprobado por Sistemas y Calidad' || (solicitud.Estado === 'Aprobado por calidad' && user?.Rol === 'CALIDAD') || (solicitud.Estado === 'Aprobado por sistemas' && user?.Rol === 'SISTEMAS')
                      ? 'bg-green-500 text-white opacity-50' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white shadow-lg shadow-green-500/10'
                    }`}
                  >
                    {statusLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Aprobar
                  </button>
                  <button 
                    disabled={statusLoading || solicitud.Estado === 'rechazado'}
                    onClick={() => handleEstadoChange('rechazado')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                      solicitud.Estado === 'rechazado' 
                      ? 'bg-red-500 text-white opacity-50' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10'
                    }`}
                  >
                    {statusLoading ? <Loader2 className="animate-spin" size={20} /> : <XIcon size={20} />}
                    Rechazar
                  </button>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Descripción
              </h3>
              <div className="bg-white/5 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed">{solicitud.DescripcionCorta || 'Sin descripción adicional'}</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ExternalLink size={20} className="text-primary" />
                Archivos Adjuntos
              </h3>
              <div className="flex flex-col gap-3">
                {adjuntos.length > 0 ? adjuntos.map((file) => (
                  <div key={file.AdjuntoId} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.NombreArchivo}</p>
                        <p className="text-[10px] text-text-muted uppercase">{file.TipoContenido}</p>
                      </div>
                    </div>
                    <a 
                      href={`/api/solicitudes/${solicitudId}/adjuntos/${file.AdjuntoId}/descargar`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-primary/20 rounded-full text-primary transition-colors"
                      title="Descargar"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                )) : (
                  <p className="text-text-muted text-sm italic p-4 border border-dashed border-border rounded-lg text-center">
                    No hay archivos adjuntos
                  </p>
                )}
              </div>
            </section>

            <div className="mt-auto pt-8 flex gap-3">
              <button className="btn-primary flex-1">Editar Solicitud</button>
              <button onClick={onClose} className="px-6 py-2 border border-border rounded-lg hover:bg-white/5 transition-all">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-12">
            <p>No se encontró la solicitud</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold tracking-widest">
      {icon}
      {label}
    </div>
    <div className="text-base font-medium">{value}</div>
  </div>
);

export default DetalleSolicitud;
