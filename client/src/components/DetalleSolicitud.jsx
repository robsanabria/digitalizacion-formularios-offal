import React, { useState, useEffect } from 'react';
import { X, FileText, Download, ExternalLink, Loader2, Check, X as XIcon, Upload, Clock, History, Save, Send } from 'lucide-react';
import axios from 'axios';
import { useToast } from './Toast';
import { AnimatePresence, motion } from 'framer-motion';
import REG011PaperForm from './REG011PaperForm';
import REG007PaperForm from './REG007PaperForm';

const ESTADOS_APROBACION = {
  'REG-011-PENDIENTE': { label: 'REG-011: Pendiente Sistemas', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'REG-007-PENDIENTE-APROBACION': { label: 'REG-007: Pendiente Calidad', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'APROBADO': { label: '✅ Finalizado / Aprobado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  'RECHAZADO': { label: '❌ Rechazado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const DetalleSolicitud = ({ solicitudId, isOpen, onClose, user, onUpdated }) => {
  const toast = useToast();
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Estado para la respuesta de Sistemas (REG-007)
  const [isResponding, setIsResponding] = useState(false);
  const [responseData, setResponseData] = useState({
    fechaPresentacion: new Date().toISOString().split('T')[0],
    codigoTwins: '',
    correspondeSolicitud: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [solRes, adjRes, histRes] = await Promise.all([
        axios.get(`/api/solicitudes/${solicitudId}`),
        axios.get(`/api/solicitudes/${solicitudId}/adjuntos`),
        axios.get(`/api/solicitudes/${solicitudId}/historial`).catch(() => ({ data: [] })),
      ]);
      // Normalizar datos (PascalCase de SQL a camelCase de React)
      const rawData = solRes.data;
      const normalized = {
        solicitudId: rawData.SolicitudId,
        fechaSolicitud: rawData.FechaSolicitud || rawData.FechaCreacion,
        sectorSolicitante: rawData.SectorSolicitante,
        motivo: rawData.Motivo,
        nombreProducto: rawData.NombreProducto,
        codigoProducto: rawData.CodigoProducto,
        destino: rawData.Destino,
        vidaUtil: rawData.VidaUtil,
        codigoSenasa: rawData.CodigoSenasa,
        impresoras: rawData.Impresoras,
        tara: rawData.Tara,
        pesoMinimo: rawData.PesoMinimo,
        pesoMaximo: rawData.PesoMaximo,
        pesoEstandar: rawData.PesoEstandar,
        numCaja: rawData.NumCaja,
        faja: rawData.Faja,
        codigoExterno: rawData.CodigoExterno,
        comentariosSolicitante: rawData.ComentariosSolicitante,
        cambioSolicitado: rawData.CambioSolicitado,
        estado: rawData.Estado,
        codigoTwins: rawData.CodigoTwins,
        correspondeSolicitud: rawData.CorrespondeSolicitud
      };

      setSolicitud(normalized);
      setAdjuntos(adjRes.data);
      setHistorial(histRes.data);
      
      setResponseData({
        fechaPresentacion: normalized.fechaPresentacion ? new Date(normalized.fechaPresentacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        codigoTwins: normalized.codigoTwins || normalized.codigoProducto || '',
        correspondeSolicitud: normalized.correspondeSolicitud || normalized.solicitudId?.slice(0,8) || ''
      });
    } catch (err) {
      console.error('Error al cargar datos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && solicitudId) fetchData();
    setIsResponding(false);
  }, [isOpen, solicitudId]);

  const handleStatusUpdate = async (action, comentario = '') => {
    setStatusLoading(true);
    try {
      await axios.post(`/api/solicitudes/${solicitudId}/transition`, { action, comentario });
      toast.success(action === 'approve' ? "Solicitud aprobada con éxito" : "Solicitud rechazada con éxito");
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSystemsResponse = async () => {
    setStatusLoading(true);
    try {
      await axios.put(`/api/solicitudes/${solicitudId}`, {
        ...responseData,
        estado: 'REG-007-PENDIENTE-APROBACION'
      });
      toast.success("Respuesta de Sistemas registrada y enviada a Calidad");
      setIsResponding(false);
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      toast.error('Error al enviar respuesta: ' + (err.response?.data?.detalle || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUploadEvidencia = async (e, tipo = 'PROPUESTO') => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      await axios.post(`/api/solicitudes/${solicitudId}/adjuntos?tipo=${tipo}`, fd);
      toast.success("Archivo subido correctamente");
      await fetchData();
    } catch (err) {
      toast.error('Error al subir archivo: ' + (err.response?.data?.error || err.response?.data?.detalle || err.message));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAdjunto = async (adjuntoId) => {
    setConfirmConfig({
      title: "Eliminar archivo",
      message: "¿Está seguro de que desea eliminar este archivo adjunto? Esta acción no se puede deshacer.",
      btnClass: "btn-error text-white",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/solicitudes/${solicitudId}/adjuntos/${adjuntoId}`);
          toast.success("Archivo eliminado correctamente");
          await fetchData();
        } catch (err) {
          toast.error('Error al eliminar archivo: ' + (err.response?.data?.error || err.message));
        }
      }
    });
  };


  if (!isOpen) return null;

  const estadoInfo = ESTADOS_APROBACION[solicitud?.estado] || { label: solicitud?.estado, color: 'text-text-muted', bg: 'bg-white/5 border-border' };
  const esSistemas = user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN';
  const esCalidad = user?.Rol === 'CALIDAD' || user?.Rol === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
      <div className="bg-[#f3f4f6] w-full max-w-5xl h-full shadow-2xl relative overflow-y-auto flex flex-col">
        
        {/* Toolbar Superior */}
        <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
             <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${estadoInfo.bg} ${estadoInfo.color}`}>
                {estadoInfo.label}
             </div>
             <h2 className="text-xl font-bold text-gray-800">{solicitud?.nombreProducto}</h2>
          </div>
          <div className="flex gap-3">
             {/* Acciones para Sistemas */}
             {esSistemas && solicitud?.estado === 'REG-011-PENDIENTE' && !isResponding && (
                <button 
                   onClick={() => setIsResponding(true)}
                   className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                   Completar REG-SIS-007
                </button>
             )}

             {isResponding && (
                <>
                  <button 
                    onClick={() => setIsResponding(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 font-bold uppercase text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={statusLoading}
                    onClick={() => {
                      setConfirmConfig({
                        title: "Enviar REG-SIS-007",
                        message: "¿Confirma el envío de este formulario REG-SIS-007 completo a Calidad para su aprobación final?",
                        btnClass: "btn-success",
                        onConfirm: handleSystemsResponse
                      });
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2"
                  >
                    {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    Enviar REG-007 a Calidad
                  </button>
                </>
             )}

             {/* Acciones para Calidad */}
             {esCalidad && solicitud?.estado === 'REG-007-PENDIENTE-APROBACION' && (
                <>
                   <button 
                      disabled={statusLoading}
                      onClick={() => {
                        setConfirmConfig({
                          title: "Rechazar Solicitud",
                          message: "¿Está seguro de que desea rechazar esta solicitud de etiqueta? Se registrará la acción y se cancelará el circuito actual.",
                          btnClass: "btn-error text-white",
                          onConfirm: () => handleStatusUpdate('reject')
                        });
                      }}
                      className="bg-red-100 text-red-600 px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-red-200 transition-all flex items-center gap-2 border border-red-200"
                   >
                      Rechazar
                   </button>
                   <button 
                      disabled={statusLoading}
                      onClick={() => {
                        setConfirmConfig({
                          title: "Aprobar Solicitud Final",
                          message: "¿Confirma la aprobación final de esta solicitud de etiquetas? Esto dará por concluido el circuito técnico de Calidad y Sistemas.",
                          btnClass: "btn-success",
                          onConfirm: () => handleStatusUpdate('approve')
                        });
                      }}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                   >
                      {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Aprobar Solicitud Final
                   </button>
                </>
             )}

             <button 
               onClick={() => window.print()}
               className="p-2 hover:bg-gray-100 rounded-full text-blue-600 transition-colors"
               title="Descargar PDF"
             >
               <Download size={24} />
             </button>

             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Contenido Principal (Documentos) */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden" id="paper-form-container">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-gray-500 font-medium">Cargando registros...</p>
             </div>
           ) : (
             <div className="flex flex-col gap-12 max-w-full">
                
                {/* Hint de scroll horizontal para móviles */}
                <div className="md:hidden flex items-center justify-center gap-2 mb-3 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 p-2.5 rounded-lg animate-pulse uppercase tracking-wider no-print select-none">
                  <span>↔️ Desliza horizontalmente para ver el documento completo</span>
                </div>

                {/* Visualizador de Documentos con Scroll Horizontal en móvil */}
                <div className="relative overflow-x-auto pb-4 custom-scrollbar">
                   <div className="min-w-[800px] md:min-w-0">
                      {/* Si el estado es 011 o estamos respondiendo, mostramos el 011 arriba como referencia */}
                      {(solicitud.estado === 'REG-011-PENDIENTE' || isResponding) && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 mb-12">
                            <div className="text-center mb-4"><span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-4 py-1 rounded-full border border-yellow-200 uppercase tracking-tighter">Documento de Referencia: REG-SIS-011</span></div>
                            <REG011PaperForm 
                              solicitudId={solicitudId}
                              data={solicitud} 
                              readOnly={true} 
                              userRole={user?.Rol}
                              solicitudEstado={solicitud?.estado}
                              adjuntos={adjuntos}
                              onUploadAdjunto={handleUploadEvidencia}
                              onDeleteAdjunto={handleDeleteAdjunto}
                              uploadLoading={uploadLoading}
                            />
                         </div>
                      )}

                      {/* Modo Respuesta Sistemas o Vista 007 */}
                      {(isResponding || solicitud.estado === 'REG-007-PENDIENTE-APROBACION' || solicitud.estado === 'APROBADO') && (
                         <div className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="text-center mb-4"><span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1 rounded-full border border-blue-200 uppercase tracking-tighter">Documento Resultante: REG-SIS-007</span></div>
                            <REG007PaperForm 
                               solicitudId={solicitudId}
                               data={isResponding ? { ...solicitud, ...responseData } : solicitud} 
                               readOnly={!isResponding}
                               userRole={user?.Rol}
                               solicitudEstado={solicitud?.estado}
                               adjuntos={adjuntos}
                               historial={historial}
                               onUploadAdjunto={handleUploadEvidencia}
                               onDeleteAdjunto={handleDeleteAdjunto}
                               uploadLoading={uploadLoading}
                               onChange={(field, val) => setResponseData(prev => ({ ...prev, [field]: val }))}
                            />
                         </div>
                      )}
                   </div>
                </div>

                {/* Mostrar el 011 original abajo colapsado como referencia */}
                <details className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
                   <summary className="cursor-pointer text-xs font-bold text-gray-500 uppercase text-center mb-4">Ver Solicitud Original (REG-SIS-011)</summary>
                   <REG011PaperForm 
                      solicitudId={solicitudId}
                      data={solicitud} 
                      readOnly={true} 
                      userRole={user?.Rol}
                      solicitudEstado={solicitud?.estado}
                      adjuntos={adjuntos}
                      onUploadAdjunto={handleUploadEvidencia}
                      onDeleteAdjunto={handleDeleteAdjunto}
                      uploadLoading={uploadLoading}
                    />
                </details>

                {/* Historial (lateral o inferior) */}
                <section className="max-w-4xl mx-auto w-full border-t border-gray-300 pt-8 mt-8">
                   <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                      <History size={16} /> Trazabilidad del Documento
                   </h3>
                   <div className="flex flex-col gap-4">
                      {historial.map((evt, i) => (
                        <div key={i} className="flex gap-4 items-start border-l-2 border-blue-200 pl-4 py-1">
                           <div className="min-w-[100px] text-[10px] text-gray-400 font-bold uppercase">{new Date(evt.FechaEvento).toLocaleString()}</div>
                           <div>
                              <p className="text-xs font-bold text-gray-700">{evt.Accion}</p>
                              <p className="text-[10px] text-gray-500 italic">{evt.NombreUsuario} — {evt.Comentario || 'Sin observaciones'}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              </div>
           )}
        </div>
      </div>

      {/* Modal de Confirmación Premium */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmConfig(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-hidden"
            >
              {/* Top accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-indigo-500" />
              
              <div className="flex items-center gap-3 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-300">
                  {confirmConfig.title}
                </h3>
              </div>

              <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
                {confirmConfig.message}
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setConfirmConfig(null)} 
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }} 
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-lg hover:shadow-xl transition-all ${
                    confirmConfig.btnClass?.includes('btn-error') 
                      ? 'bg-rose-600 hover:bg-rose-500 hover:shadow-rose-600/20' 
                      : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-600/20'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetalleSolicitud;
