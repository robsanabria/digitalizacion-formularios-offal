import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Tag, Download, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';

const DetalleSolicitud = ({ solicitudId, isOpen, onClose }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl h-full m-0 rounded-none md:m-4 md:rounded-xl p-8 relative overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white">
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
