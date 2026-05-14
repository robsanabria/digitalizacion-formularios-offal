import React, { useState, useEffect } from 'react';
import { X, FileText, Download, ExternalLink, Loader2, Check, X as XIcon, Upload, Clock, History, Save, Send } from 'lucide-react';
import axios from 'axios';
import REG011PaperForm from './REG011PaperForm';
import REG007PaperForm from './REG007PaperForm';

const ESTADOS_APROBACION = {
  'REG-011-PENDIENTE': { label: 'REG-011: Pendiente Sistemas', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'REG-007-PENDIENTE-APROBACION': { label: 'REG-007: Pendiente Calidad', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'APROBADO': { label: '✅ Finalizado / Aprobado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  'RECHAZADO': { label: '❌ Rechazado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const DetalleSolicitud = ({ solicitudId, isOpen, onClose, user, onUpdated }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
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
      setSolicitud(solRes.data);
      setAdjuntos(adjRes.data);
      setHistorial(histRes.data);
      
      // Pre-cargar datos si ya existen
      setResponseData({
        fechaPresentacion: solRes.data.FechaPresentacion ? new Date(solRes.data.FechaPresentacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        codigoTwins: solRes.data.CodigoTwins || '',
        correspondeSolicitud: solRes.data.CorrespondeSolicitud || ''
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
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
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
      setIsResponding(false);
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      alert('Error al enviar respuesta: ' + (err.response?.data?.detalle || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUploadEvidencia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      await axios.post(`/api/solicitudes/${solicitudId}/adjuntos`, fd);
      await fetchData();
    } catch (err) {
      alert('Error al subir archivo: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  if (!isOpen) return null;

  const estadoInfo = ESTADOS_APROBACION[solicitud?.Estado] || { label: solicitud?.Estado, color: 'text-text-muted', bg: 'bg-white/5 border-border' };
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
             <h2 className="text-xl font-bold text-gray-800">{solicitud?.NombreProducto}</h2>
          </div>
          <div className="flex gap-3">
             {/* Acciones para Sistemas */}
             {esSistemas && solicitud?.Estado === 'REG-011-PENDIENTE' && !isResponding && (
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
                    onClick={handleSystemsResponse}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2"
                  >
                    {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    Enviar REG-007 a Calidad
                  </button>
                </>
             )}

             {/* Acciones para Calidad */}
             {esCalidad && solicitud?.Estado === 'REG-007-PENDIENTE-APROBACION' && (
                <>
                   <button 
                      disabled={statusLoading}
                      onClick={() => handleStatusUpdate('reject')}
                      className="bg-red-100 text-red-600 px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-red-200 transition-all flex items-center gap-2 border border-red-200"
                   >
                      Rechazar
                   </button>
                   <button 
                      disabled={statusLoading}
                      onClick={() => handleStatusUpdate('approve')}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                   >
                      {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Aprobar Solicitud Final
                   </button>
                </>
             )}

             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Contenido Principal (Documentos) */}
        <div className="flex-1 p-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-gray-500 font-medium">Cargando registros...</p>
             </div>
           ) : (
             <div className="flex flex-col gap-12">
                
                {/* Visualizador de Documentos */}
                <div className="relative">
                   {/* Si el estado es 011 o estamos respondiendo, mostramos el 011 arriba como referencia */}
                   {solicitud.Estado === 'REG-011-PENDIENTE' && !isResponding && (
                      <div className="animate-in fade-in slide-in-from-bottom-4">
                         <div className="text-center mb-4"><span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-4 py-1 rounded-full border border-yellow-200 uppercase tracking-tighter">Documento Activo: REG-SIS-011</span></div>
                         <REG011PaperForm data={solicitud} readOnly={true} />
                      </div>
                   )}

                   {/* Modo Respuesta Sistemas o Vista 007 */}
                   {(isResponding || solicitud.Estado === 'REG-007-PENDIENTE-APROBACION' || solicitud.Estado === 'APROBADO') && (
                      <div className="animate-in fade-in zoom-in-95 duration-300">
                         <div className="text-center mb-4"><span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1 rounded-full border border-blue-200 uppercase tracking-tighter">Documento Resultante: REG-SIS-007</span></div>
                         <REG007PaperForm 
                            data={isResponding ? { ...solicitud, ...responseData } : solicitud} 
                            readOnly={!isResponding}
                            onChange={(field, val) => setResponseData(prev => ({ ...prev, [field]: val }))}
                         >
                            {/* Renderizar etiquetas adjuntas en el espacio de 007 */}
                            <div className="grid grid-cols-1 gap-8 w-full p-4">
                               {adjuntos.filter(f => f.TipoContenido?.startsWith('image/')).map(img => (
                                  <div key={img.AdjuntoId} className="flex flex-col items-center">
                                     <img 
                                        src={`/api/solicitudes/${solicitudId}/adjuntos/${img.AdjuntoId}/descargar`}
                                        className="max-w-full h-auto border border-gray-300 shadow-lg"
                                        alt="Etiqueta"
                                     />
                                     <span className="text-[10px] mt-2 text-gray-400 italic">{img.NombreArchivo}</span>
                                  </div>
                               ))}
                               
                               {/* Dropzone solo para Sistemas cuando responde */}
                               {isResponding && (
                                  <label className="border-2 border-dashed border-blue-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all bg-white/50">
                                     <input type="file" className="hidden" onChange={handleUploadEvidencia} />
                                     <Upload className="text-blue-500 mb-2" size={32} />
                                     <span className="text-xs font-bold text-blue-600 uppercase">Subir Foto de Etiqueta Modificada</span>
                                     {uploadLoading && <Loader2 className="animate-spin mt-2" />}
                                  </label>
                               )}
                            </div>
                         </REG007PaperForm>

                         {/* Mostrar el 011 original abajo colapsado como referencia */}
                         <details className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
                            <summary className="cursor-pointer text-xs font-bold text-gray-500 uppercase text-center mb-4">Ver Solicitud Original (REG-SIS-011)</summary>
                            <REG011PaperForm data={solicitud} readOnly={true} />
                         </details>
                      </div>
                   )}
                </div>

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
    </div>
  );
};

export default DetalleSolicitud;
