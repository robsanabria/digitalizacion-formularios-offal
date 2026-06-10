import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, Check, History, Send, RotateCcw, ThumbsUp, ThumbsDown, FileText, FileCheck, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useToast } from './Toast';
import { AnimatePresence, motion } from 'framer-motion';
import REG011PaperForm from './REG011PaperForm';
import REG007PaperForm from './REG007PaperForm';

const ESTADOS_APROBACION = {
  'REG-011-PENDIENTE-APROBACION': { label: 'REG-11: Pendiente Aprob. Sistemas', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'REG-011-OBSERVADO': { label: 'REG-11: Observado (devuelto a Calidad)', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  'REG-011-APROBADO': { label: 'Aprobado - Pendiente de REG-07', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  'REG-011-PENDIENTE': { label: 'Aprobado - Pendiente de REG-07', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' }, // legacy
  'REG-007-PENDIENTE-APROBACION': { label: 'REG-07: Pendiente Calidad', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'APROBADO': { label: '✅ Finalizado / Aprobado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  'RECHAZADO': { label: '❌ Rechazado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const DetalleSolicitud = ({ solicitudId, isOpen, onClose, user, onUpdated, focusForm = 'REG011', printSignal = 0 }) => {
  const toast = useToast();
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [confirmComment, setConfirmComment] = useState('');

  // Estado para la respuesta de Sistemas (REG-007)
  const [isResponding, setIsResponding] = useState(false);
  const [responseData, setResponseData] = useState({
    fechaPresentacion: new Date().toISOString().split('T')[0],
    codigoTwins: '',
    correspondeSolicitud: ''
  });

  // Estado para que Calidad corrija y reenvíe un REG-11 observado
  const [isEditing011, setIsEditing011] = useState(false);
  const [edit011Data, setEdit011Data] = useState({});

  // Documento mostrado en el panel (REG-11 / REG-07). Se inicializa con el foco
  // que pide el submenú, pero el usuario puede alternar dentro de la ventana.
  const [localFocus, setLocalFocus] = useState(focusForm);

  const printedSignalRef = useRef(0);

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
        correspondeSolicitud: rawData.CorrespondeSolicitud,
        solicitanteNombre: rawData.SolicitanteNombre,
        rolSolicitante: rawData.RolSolicitante,
        fechaCreacion: rawData.FechaCreacion
      };

      setSolicitud(normalized);
      setAdjuntos(adjRes.data);
      setHistorial(histRes.data);

      // Copia editable del REG-11 para el flujo de corrección de Calidad
      setEdit011Data({
        fechaSolicitud: normalized.fechaSolicitud ? new Date(normalized.fechaSolicitud).toISOString().split('T')[0] : '',
        sectorSolicitante: normalized.sectorSolicitante || '',
        motivo: normalized.motivo || '[]',
        nombreProducto: normalized.nombreProducto || '',
        codigoProducto: normalized.codigoProducto || '',
        destino: normalized.destino || '',
        vidaUtil: normalized.vidaUtil || '',
        codigoSenasa: normalized.codigoSenasa || '',
        impresoras: normalized.impresoras || '[]',
        tara: normalized.tara || '',
        pesoMinimo: normalized.pesoMinimo || '',
        pesoMaximo: normalized.pesoMaximo || '',
        pesoEstandar: normalized.pesoEstandar || '',
        numCaja: normalized.numCaja || '',
        faja: normalized.faja || '',
        codigoExterno: normalized.codigoExterno || '',
        comentariosSolicitante: normalized.comentariosSolicitante || '',
        cambioSolicitado: normalized.cambioSolicitado || '',
        solicitanteNombre: normalized.solicitanteNombre || '',
        rolSolicitante: normalized.rolSolicitante || '',
        fechaCreacion: normalized.fechaCreacion || ''
      });

      setResponseData({
        fechaPresentacion: normalized.fechaPresentacion ? new Date(normalized.fechaPresentacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        codigoTwins: normalized.codigoTwins || normalized.codigoProducto || '',
        correspondeSolicitud: normalized.correspondeSolicitud || normalized.solicitudId?.slice(0, 8) || ''
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
    setIsEditing011(false);
  }, [isOpen, solicitudId]);

  // Sincronizar el foco local con el que pide el submenú al abrir/cambiar.
  useEffect(() => {
    setLocalFocus(focusForm);
  }, [focusForm, solicitudId, isOpen]);

  // ── Impresión robusta: espera a que todas las imágenes del formulario carguen ──
  const waitForImagesAndPrint = async () => {
    const container = document.getElementById('paper-form-container');
    if (container) {
      const imgs = Array.from(container.querySelectorAll('img'));
      await Promise.all(
        imgs.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(resolve => { img.onload = img.onerror = resolve; })
        )
      );
    }
    window.print();
  };

  // Impresión disparada desde el listado (App incrementa printSignal)
  useEffect(() => {
    if (printSignal && printSignal !== printedSignalRef.current && isOpen && !loading && solicitud) {
      printedSignalRef.current = printSignal;
      waitForImagesAndPrint();
    }
  }, [printSignal, loading, isOpen, solicitud]);

  const handleStatusUpdate = async (action, successMsg, comentario = '') => {
    setStatusLoading(true);
    try {
      await axios.post(`/api/solicitudes/${solicitudId}/transition`, { action, comentario });
      toast.success(successMsg);
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSystemsResponse = async () => {
    // Validación REG-07: campos obligatorios + al menos una etiqueta propuesta.
    const faltan = [];
    if (!responseData.fechaPresentacion?.trim?.()) faltan.push('Fecha de presentación');
    if (!responseData.codigoTwins?.trim?.()) faltan.push('Código TWINS');
    if (!responseData.correspondeSolicitud?.trim?.()) faltan.push('Corresponde a Solicitud');
    const tieneEtiqueta = adjuntos.some(a => a.TipoAdjunto === 'PROPUESTO');
    if (!tieneEtiqueta) faltan.push('al menos una etiqueta técnica (subir en el REG-07)');
    if (faltan.length > 0) {
      toast.error('Faltan completar campos del REG-07: ' + faltan.join(', '));
      return;
    }
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
      toast.error('Error al enviar respuesta: ' + (err.response?.data?.detalle || err.response?.data?.error || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResend011 = async () => {
    // Validación REG-11: todos los campos obligatorios + adjunto original.
    const req = [
      ['fechaSolicitud', 'Fecha de Solicitud'], ['sectorSolicitante', 'Sector Solicitante'],
      ['nombreProducto', 'Nombre Producto'], ['codigoProducto', 'Código Producto'],
      ['destino', 'Destino'], ['vidaUtil', 'Vida Útil'], ['codigoSenasa', 'Código SENASA'],
      ['tara', 'Tara'], ['pesoMinimo', 'Peso Mínimo'], ['pesoMaximo', 'Peso Máximo'],
      ['pesoEstandar', 'Peso Estándar'], ['numCaja', 'N° de Caja'], ['faja', 'Faja'],
      ['codigoExterno', 'Código Externo'], ['comentariosSolicitante', 'Comentarios del Solicitante'],
      ['cambioSolicitado', 'Cambio Solicitado'],
    ];
    const faltan = req.filter(([k]) => !String(edit011Data[k] ?? '').trim()).map(([, l]) => l);
    const parseLen = (v) => { try { return (Array.isArray(v) ? v : JSON.parse(v || '[]')).length; } catch { return 0; } };
    if (parseLen(edit011Data.motivo) === 0) faltan.push('Motivo del cambio (al menos uno)');
    if (parseLen(edit011Data.impresoras) === 0) faltan.push('Impresoras afectadas (al menos una)');
    // El Formato Original (archivo) es OPCIONAL.
    if (faltan.length > 0) {
      toast.error('Faltan completar campos obligatorios: ' + faltan.join(', '));
      return;
    }
    setStatusLoading(true);
    try {
      await axios.put(`/api/solicitudes/${solicitudId}`, {
        ...edit011Data,
        intent: 'reenviar_reg11'
      });
      toast.success("REG-11 corregido y reenviado a Sistemas");
      setIsEditing011(false);
      if (onUpdated) onUpdated();
      await fetchData();
    } catch (err) {
      toast.error('Error al reenviar el REG-11: ' + (err.response?.data?.detalle || err.response?.data?.error || err.message));
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

  const estado = solicitud?.estado;
  const estadoInfo = ESTADOS_APROBACION[estado] || { label: estado, color: 'text-text-muted', bg: 'bg-white/5 border-border' };

  const esSistemas = user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN';
  const esCalidad = user?.Rol === 'CALIDAD' || user?.Rol === 'ADMIN';

  // Etapas del circuito
  const esReg11PendienteAprob = estado === 'REG-011-PENDIENTE-APROBACION';
  const esReg11Observado = estado === 'REG-011-OBSERVADO';
  const esReg11Aprobado = estado === 'REG-011-APROBADO' || estado === 'REG-011-PENDIENTE'; // listo para REG-07 (incl. legacy)
  const esReg07Pendiente = estado === 'REG-007-PENDIENTE-APROBACION';
  const esFinalizado = estado === 'APROBADO' || estado === 'RECHAZADO';

  // ¿Ya existe un REG-07 generado por Sistemas?
  const tieneReg07 = esReg07Pendiente || esFinalizado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
      <div className="bg-[#f3f4f6] w-full max-w-5xl h-full shadow-2xl relative overflow-y-auto flex flex-col">

        {/* Toolbar Superior */}
        <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm no-print">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${estadoInfo.bg} ${estadoInfo.color}`}>
              {estadoInfo.label}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Solicitud #{(solicitud?.solicitudId || '').slice(0, 8).toUpperCase() || '—'}
            </h2>
          </div>
          <div className="flex gap-3 items-center flex-wrap justify-end">

            {/* ── Compuerta REG-11: aprobación de Sistemas ── */}
            {esSistemas && esReg11PendienteAprob && (
              <>
                <button
                  disabled={statusLoading}
                  onClick={() => { setConfirmComment(''); setConfirmConfig({
                    title: "Observar / Devolver REG-11",
                    message: "Indicá el motivo del rechazo. El REG-11 volverá a Calidad como 'Observado' para que lo corrija y reenvíe.",
                    btnClass: "btn-error text-white",
                    withComment: true,
                    commentLabel: "Motivo del rechazo",
                    commentRequired: true,
                    onConfirm: (comentario) => handleStatusUpdate('rechazar_reg11', 'REG-11 observado por Sistemas', comentario)
                  }); }}
                  className="bg-orange-100 text-orange-600 px-5 py-2 rounded-lg font-bold uppercase text-xs hover:bg-orange-200 transition-all flex items-center gap-2 border border-orange-200"
                >
                  <ThumbsDown size={14} /> Observar REG-11
                </button>
                <button
                  disabled={statusLoading}
                  onClick={() => setConfirmConfig({
                    title: "Aprobar REG-11",
                    message: "¿Confirma la aprobación del REG-11? Una vez aprobado, Sistemas podrá completar el REG-07 con las etiquetas técnicas.",
                    btnClass: "btn-success",
                    onConfirm: () => handleStatusUpdate('aprobar_reg11', 'REG-11 aprobado por Sistemas')
                  })}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <ThumbsUp size={14} />}
                  Aprobar REG-11
                </button>
              </>
            )}

            {/* ── Sistemas: completar REG-07 (sólo si el REG-11 ya fue aprobado) ── */}
            {esSistemas && esReg11Aprobado && !isResponding && (
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
                  onClick={() => setConfirmConfig({
                    title: "Enviar REG-SIS-007",
                    message: "¿Confirma el envío de este formulario REG-SIS-007 completo a Calidad para su aprobación final?",
                    btnClass: "btn-success",
                    onConfirm: handleSystemsResponse
                  })}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Enviar REG-007 a Calidad
                </button>
              </>
            )}

            {/* ── Calidad: corregir y reenviar un REG-11 observado ── */}
            {esCalidad && esReg11Observado && !isEditing011 && (
              <button
                onClick={() => setIsEditing011(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-orange-700 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} /> Corregir y Reenviar REG-11
              </button>
            )}

            {isEditing011 && (
              <>
                <button
                  onClick={() => setIsEditing011(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 font-bold uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  disabled={statusLoading}
                  onClick={() => setConfirmConfig({
                    title: "Reenviar REG-11 a Sistemas",
                    message: "¿Confirma el reenvío del REG-11 corregido? Volverá a quedar pendiente de aprobación por parte de Sistemas.",
                    btnClass: "btn-success",
                    onConfirm: handleResend011
                  })}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Reenviar a Sistemas
                </button>
              </>
            )}

            {/* ── Calidad: aprobación final del REG-07 ── */}
            {esCalidad && esReg07Pendiente && (
              <>
                <button
                  disabled={statusLoading}
                  onClick={() => setConfirmConfig({
                    title: "Rechazar Solicitud",
                    message: "¿Está seguro de que desea rechazar esta solicitud de etiqueta? Se registrará la acción y se cancelará el circuito actual.",
                    btnClass: "btn-error text-white",
                    onConfirm: () => handleStatusUpdate('reject', 'Solicitud rechazada')
                  })}
                  className="bg-red-100 text-red-600 px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-red-200 transition-all flex items-center gap-2 border border-red-200"
                >
                  Rechazar
                </button>
                <button
                  disabled={statusLoading}
                  onClick={() => setConfirmConfig({
                    title: "Aprobar Solicitud Final",
                    message: "¿Confirma la aprobación final de esta solicitud de etiquetas? Esto dará por concluido el circuito técnico de Calidad y Sistemas.",
                    btnClass: "btn-success",
                    onConfirm: () => handleStatusUpdate('approve', 'Solicitud aprobada con éxito')
                  })}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Aprobar Solicitud Final
                </button>
              </>
            )}

            <button
              onClick={waitForImagesAndPrint}
              className="p-2 hover:bg-gray-100 rounded-full text-blue-600 transition-colors"
              title="Descargar / Imprimir PDF"
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
          {loading || !solicitud ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-gray-500 font-medium">Cargando registros...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12 max-w-full">

              {/* ── Cabecera de la ventana: documento actual + selector + circuito ── */}
              {!isResponding && !isEditing011 && (
                <div className="no-print flex flex-col gap-5">
                  {/* Cinta identificatoria del documento (color distinto por tipo) */}
                  <div className={`rounded-xl px-5 py-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    localFocus === 'REG007'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${localFocus === 'REG007' ? 'bg-blue-600' : 'bg-amber-500'} text-white`}>
                        {localFocus === 'REG007' ? <FileCheck size={20} /> : <FileText size={20} />}
                      </div>
                      <div>
                        <div className={`text-sm font-black uppercase tracking-wider ${localFocus === 'REG007' ? 'text-blue-700' : 'text-amber-700'}`}>
                          {localFocus === 'REG007' ? 'REG-SIS-007 · Respuesta Técnica' : 'REG-SIS-011 · Solicitud de Etiquetas'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-semibold">
                          {localFocus === 'REG007' ? 'Completado por Sistemas con las etiquetas modificadas en planta.' : 'Documento original creado por Calidad.'}
                        </div>
                      </div>
                    </div>
                    {/* Selector REG-11 / REG-07 */}
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200 self-start sm:self-auto">
                      <button
                        onClick={() => setLocalFocus('REG011')}
                        className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                          localFocus === 'REG011' ? 'bg-amber-500 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <FileText size={14} /> REG-11
                      </button>
                      <button
                        onClick={() => setLocalFocus('REG007')}
                        className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                          localFocus === 'REG007' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <FileCheck size={14} /> REG-07
                      </button>
                    </div>
                  </div>

                  {/* Stepper del circuito de aprobación */}
                  <CircuitStepper estado={estado} />
                </div>
              )}

              {/* Hint de scroll horizontal para móviles */}
              <div className="md:hidden flex items-center justify-center gap-2 mb-3 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 p-2.5 rounded-lg animate-pulse uppercase tracking-wider no-print select-none">
                <span>↔️ Desliza horizontalmente para ver el documento completo</span>
              </div>

              {/* Aviso cuando se pide ver REG-07 pero todavía no fue generado */}
              {!isResponding && !isEditing011 && localFocus === 'REG007' && !tieneReg07 && (
                <div className="no-print bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold p-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-3 text-center uppercase tracking-wide">
                  <span>El REG-07 aún no fue completado por Sistemas. Se muestra una vista previa con los datos disponibles.</span>
                  <button
                    onClick={() => setLocalFocus('REG011')}
                    className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-[11px] font-black flex items-center gap-1.5"
                  >
                    <FileText size={13} /> Ver REG-11 con datos
                  </button>
                </div>
              )}

              {/* Visualizador de Documentos con Scroll Horizontal en móvil */}
              <div className="relative overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[800px] md:min-w-0">

                  {/* CASO 1: Calidad corrige un REG-11 observado */}
                  {isEditing011 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-center mb-4">
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-4 py-1 rounded-full border border-orange-200 uppercase tracking-tighter">
                          Corrigiendo REG-SIS-011 (observado)
                        </span>
                      </div>
                      <REG011PaperForm
                        solicitudId={solicitudId}
                        data={edit011Data}
                        readOnly={false}
                        userRole={user?.Rol}
                        solicitudEstado={estado}
                        adjuntos={adjuntos}
                        historial={historial}
                        onUploadAdjunto={handleUploadEvidencia}
                        onDeleteAdjunto={handleDeleteAdjunto}
                        uploadLoading={uploadLoading}
                        onChange={(field, val) => setEdit011Data(prev => ({ ...prev, [field]: val }))}
                      />
                    </div>
                  ) : isResponding ? (
                    /* CASO 2: Sistemas responde (011 referencia arriba + 007 editable) */
                    <>
                      {/* Referencia REG-11 mientras Sistemas completa: no se imprime (el PDF es sólo el REG-07) */}
                      <div className="animate-in fade-in slide-in-from-bottom-4 mb-12 no-print">
                        <div className="text-center mb-4">
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-4 py-1 rounded-full border border-yellow-200 uppercase tracking-tighter">Documento de Referencia: REG-SIS-011</span>
                        </div>
                        <REG011PaperForm
                          solicitudId={solicitudId}
                          data={solicitud}
                          readOnly={true}
                          userRole={user?.Rol}
                          solicitudEstado={estado}
                          adjuntos={adjuntos}
                          historial={historial}
                          onUploadAdjunto={handleUploadEvidencia}
                          onDeleteAdjunto={handleDeleteAdjunto}
                          uploadLoading={uploadLoading}
                        />
                      </div>
                      <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center mb-4">
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1 rounded-full border border-blue-200 uppercase tracking-tighter">Documento Resultante: REG-SIS-007</span>
                        </div>
                        <REG007PaperForm
                          solicitudId={solicitudId}
                          data={{ ...solicitud, ...responseData }}
                          readOnly={false}
                          userRole={user?.Rol}
                          solicitudEstado={estado}
                          adjuntos={adjuntos}
                          historial={historial}
                          onUploadAdjunto={handleUploadEvidencia}
                          onDeleteAdjunto={handleDeleteAdjunto}
                          uploadLoading={uploadLoading}
                          onChange={(field, val) => setResponseData(prev => ({ ...prev, [field]: val }))}
                        />
                      </div>
                    </>
                  ) : localFocus === 'REG007' ? (
                    /* CASO 3: Submenú REG-07 → mostrar el REG-007 (solo lectura) */
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="text-center mb-4">
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1 rounded-full border border-blue-200 uppercase tracking-tighter">Documento Resultante: REG-SIS-007</span>
                      </div>
                      <REG007PaperForm
                        solicitudId={solicitudId}
                        data={solicitud}
                        readOnly={true}
                        userRole={user?.Rol}
                        solicitudEstado={estado}
                        adjuntos={adjuntos}
                        historial={historial}
                        onUploadAdjunto={handleUploadEvidencia}
                        onDeleteAdjunto={handleDeleteAdjunto}
                        uploadLoading={uploadLoading}
                      />
                    </div>
                  ) : (
                    /* CASO 4 (por defecto): Submenú REG-11 → mostrar el REG-011 */
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-center mb-4">
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-4 py-1 rounded-full border border-yellow-200 uppercase tracking-tighter">Documento: REG-SIS-011</span>
                      </div>
                      <REG011PaperForm
                        solicitudId={solicitudId}
                        data={solicitud}
                        readOnly={true}
                        userRole={user?.Rol}
                        solicitudEstado={estado}
                        adjuntos={adjuntos}
                        historial={historial}
                        onUploadAdjunto={handleUploadEvidencia}
                        onDeleteAdjunto={handleDeleteAdjunto}
                        uploadLoading={uploadLoading}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Documento complementario colapsado como referencia (no se imprime) */}
              {!isEditing011 && !isResponding && (
                <details className="mt-8 opacity-60 hover:opacity-100 transition-opacity no-print">
                  <summary className="cursor-pointer text-xs font-bold text-gray-500 uppercase text-center mb-4">
                    {localFocus === 'REG007' ? 'Ver Solicitud Original (REG-SIS-011)' : 'Ver Respuesta Técnica (REG-SIS-007)'}
                  </summary>
                  {localFocus === 'REG007' ? (
                    <REG011PaperForm
                      solicitudId={solicitudId}
                      data={solicitud}
                      readOnly={true}
                      userRole={user?.Rol}
                      solicitudEstado={estado}
                      adjuntos={adjuntos}
                      historial={historial}
                      onUploadAdjunto={handleUploadEvidencia}
                      onDeleteAdjunto={handleDeleteAdjunto}
                      uploadLoading={uploadLoading}
                    />
                  ) : (
                    <REG007PaperForm
                      solicitudId={solicitudId}
                      data={solicitud}
                      readOnly={true}
                      userRole={user?.Rol}
                      solicitudEstado={estado}
                      adjuntos={adjuntos}
                      historial={historial}
                      onUploadAdjunto={handleUploadEvidencia}
                      onDeleteAdjunto={handleDeleteAdjunto}
                      uploadLoading={uploadLoading}
                    />
                  )}
                </details>
              )}

              {/* Historial / Trazabilidad */}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmConfig(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-hidden"
            >
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

              <p className="text-sm text-slate-300 font-medium mb-4 leading-relaxed">
                {confirmConfig.message}
              </p>

              {confirmConfig.withComment && (
                <div className="mb-6">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {confirmConfig.commentLabel || 'Comentario'}{confirmConfig.commentRequired && <span className="text-rose-400"> *</span>}
                  </label>
                  <textarea
                    autoFocus
                    rows={3}
                    value={confirmComment}
                    onChange={(e) => setConfirmComment(e.target.value)}
                    placeholder="Escribí el motivo..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

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
                    if (confirmConfig.commentRequired && !confirmComment.trim()) {
                      toast.error('Ingresá el motivo del rechazo.');
                      return;
                    }
                    confirmConfig.onConfirm(confirmComment.trim());
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

// ── Stepper visual del circuito ────────────────────────────────────────────────
const stepStatuses = (estado) => {
  const base = [
    { label: 'Solicitud REG-11', role: 'Calidad' },
    { label: 'Aprob. Sistemas', role: 'Sistemas' },
    { label: 'Respuesta REG-07', role: 'Sistemas' },
    { label: 'Aprob. Calidad', role: 'Calidad' },
  ];
  let st;
  switch (estado) {
    case 'REG-011-PENDIENTE-APROBACION': st = ['done', 'active', 'todo', 'todo']; break;
    case 'REG-011-OBSERVADO':            st = ['done', 'warn', 'todo', 'todo']; break;
    case 'REG-011-APROBADO':
    case 'REG-011-PENDIENTE':            st = ['done', 'done', 'active', 'todo']; break;
    case 'REG-007-PENDIENTE-APROBACION': st = ['done', 'done', 'done', 'active']; break;
    case 'APROBADO':                     st = ['done', 'done', 'done', 'done']; break;
    case 'RECHAZADO':                    st = ['done', 'done', 'done', 'error']; break;
    default:                             st = ['active', 'todo', 'todo', 'todo'];
  }
  return base.map((b, i) => ({ ...b, status: st[i] }));
};

const STEP_STYLES = {
  done:   { circle: 'bg-emerald-500 text-white border-emerald-500', label: 'text-emerald-700' },
  active: { circle: 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-200 animate-pulse', label: 'text-indigo-700' },
  warn:   { circle: 'bg-orange-500 text-white border-orange-500', label: 'text-orange-700' },
  error:  { circle: 'bg-rose-600 text-white border-rose-600', label: 'text-rose-700' },
  todo:   { circle: 'bg-white text-gray-400 border-gray-300', label: 'text-gray-400' },
};

const CircuitStepper = ({ estado }) => {
  const steps = stepStatuses(estado);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-x-auto">
      <div className="flex items-start min-w-[480px]">
        {steps.map((s, i) => {
          const stl = STEP_STYLES[s.status];
          const icon = s.status === 'done' ? <Check size={16} />
            : s.status === 'warn' ? <AlertTriangle size={15} />
            : s.status === 'error' ? <X size={16} />
            : <span className="text-xs font-black">{i + 1}</span>;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center text-center flex-1 min-w-[80px]">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${stl.circle}`}>{icon}</div>
                <div className={`mt-2 text-[10px] font-black uppercase tracking-tight leading-tight ${stl.label}`}>{s.label}</div>
                <div className="text-[9px] text-gray-400 font-semibold uppercase">{s.role}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-1 mt-4 mx-1 rounded-full ${s.status === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default DetalleSolicitud;
