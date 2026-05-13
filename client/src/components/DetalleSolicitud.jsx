import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Tag, Download, ExternalLink, Loader2, Check, X as XIcon, Upload, Clock, History } from 'lucide-react';
import axios from 'axios';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ESTADOS_APROBACION = {
  'Pendiente': { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'En revisión': { label: 'En revisión', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Aprobado por calidad': { label: 'Aprobado por Calidad', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  'Aprobado por sistemas': { label: 'Aprobado por Sistemas', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  'Aprobado por Sistemas y Calidad': { label: '✅ Aprobado Final', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  'rechazado': { label: '❌ Rechazado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

/** Dado el estado actual y el rol del usuario, devuelve si YA aprobó */
const yaAprobo = (estado, rol) => {
  if (estado === 'Aprobado por Sistemas y Calidad') return true;
  if (estado === 'rechazado') return true;
  if (rol === 'CALIDAD' && (estado === 'Aprobado por calidad')) return true;
  if (rol === 'SISTEMAS' && (estado === 'Aprobado por sistemas')) return true;
  return false;
};

/** Devuelve el chip de estado de aprobación pendiente */
const AprobacionPendienteChip = ({ estado }) => {
  const calidad = estado === 'Aprobado por sistemas' || estado === 'Pendiente' || estado === 'En revisión';
  const sistemas = estado === 'Aprobado por calidad' || estado === 'Pendiente' || estado === 'En revisión';

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${estado === 'Aprobado por calidad' || estado === 'Aprobado por Sistemas y Calidad' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/5 border-border text-text-muted'}`}>
        {estado === 'Aprobado por calidad' || estado === 'Aprobado por Sistemas y Calidad' ? '✓' : '○'} Calidad
      </span>
      <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${estado === 'Aprobado por sistemas' || estado === 'Aprobado por Sistemas y Calidad' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/5 border-border text-text-muted'}`}>
        {estado === 'Aprobado por sistemas' || estado === 'Aprobado por Sistemas y Calidad' ? '✓' : '○'} Sistemas
      </span>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const DetalleSolicitud = ({ solicitudId, isOpen, onClose, user, onUpdated }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [evidenciaFile, setEvidenciaFile] = useState(null);
  const [comentario, setComentario] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [confirmReason, setConfirmReason] = useState('');

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
    } catch (err) {
      console.error('Error al cargar datos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && solicitudId) fetchData();
  }, [isOpen, solicitudId]);

  // ── Acción de transición (approve / reject) ──────────────────────────────
  const handleTransition = (action) => {
    // Abrir modal de confirmación DaisyUI en lugar de window.confirm
    setConfirmAction(action);
    setConfirmReason(comentario || '');
    setConfirmOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (!confirmAction) return;
    setStatusLoading(true);
    try {
      const res = await axios.post(`/api/solicitudes/${solicitudId}/transition`, {
        action: confirmAction === 'approve' ? 'approve' : 'reject',
        comentario: confirmReason.trim() || undefined,
      });
      setSolicitud(prev => ({ ...prev, Estado: res.data.nuevoEstado }));
      setComentario('');
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmReason('');
      if (onUpdated) onUpdated();
      await fetchData(); // refresca historial y adjuntos
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert('Error: ' + msg);
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Upload de evidencias (solo SISTEMAS) ─────────────────────────────────
  const handleUploadEvidencia = async () => {
    if (!evidenciaFile) return alert('Selecciona un archivo primero.');
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', evidenciaFile);
      await axios.post(`/api/solicitudes/${solicitudId}/adjuntos`, fd);
      setEvidenciaFile(null);
      await fetchData();
    } catch (err) {
      alert('Error al subir evidencia: ' + (err.response?.data?.detalle || err.message));
    } finally {
      setUploadLoading(false);
    }
  };

  if (!isOpen) return null;

  const estadoInfo = ESTADOS_APROBACION[solicitud?.Estado] || { label: solicitud?.Estado, color: 'text-text-muted', bg: 'bg-white/5 border-border' };
  const puedeAprobar = solicitud && !yaAprobo(solicitud.Estado, user?.Rol) && solicitud.Estado !== 'rechazado';
  const esSistemas = user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN';
  const estadoPermiteEvidencias = solicitud && ['Pendiente', 'En revisión', 'Aprobado por calidad'].includes(solicitud.Estado);

  const getDecisionMotivo = () => {
    // Preferir campos explícitos en la solicitud
    if (solicitud?.MotivoDecision) return solicitud.MotivoDecision;
    if (solicitud?.MotivoRechazo) return solicitud.MotivoRechazo;
    // Buscar última entrada relevante en historial
    const relevant = (historial || []).slice().reverse().find(h => /aprobar|rechaz/i.test(h.Accion || ''));
    return relevant?.Comentario || null;
  };

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

            {/* ── Header con estado ── */}
            <header>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider mb-3 ${estadoInfo.bg} ${estadoInfo.color}`}>
                <Tag size={12} />
                {estadoInfo.label}
              </div>
              <h2 className="text-3xl font-bold">{solicitud.NombreProducto}</h2>
              <p className="text-text-muted mt-2">{solicitud.Motivo}</p>
              {/* Chips de aprobación */}
              {!['rechazado', 'Aprobado por Sistemas y Calidad'].includes(solicitud.Estado) && (
                <AprobacionPendienteChip estado={solicitud.Estado} />
              )}
            </header>

            {/* ── Info grid ── */}
            <div className="grid grid-cols-2 gap-6">
              <InfoItem
                icon={<Calendar size={18} />}
                label="Fecha Presentación"
                value={(solicitud.FechaPresentacion || solicitud.PresentationDate || solicitud.FechaCreacion) ? new Date(solicitud.FechaPresentacion || solicitud.PresentationDate || solicitud.FechaCreacion).toLocaleDateString() : '-'}
              />
              <InfoItem icon={<User size={18} />} label="Solicitado por" value={solicitud.RolSolicitante} />
              <InfoItem icon={<FileText size={18} />} label="Tipo SENASA" value={solicitud.TipoSenasa} />
              <InfoItem icon={<Tag size={18} />} label="Código" value={solicitud.Codigo || '-'} />
            </div>

            {/* ── Sección upload evidencias (solo SISTEMAS) ── */}
            {esSistemas && estadoPermiteEvidencias && (
              <section className="bg-cyan-500/5 p-6 rounded-xl border border-cyan-500/20">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
                  <Upload size={16} /> Subir Evidencias (Sistemas)
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  Sube las fotos o documentos de las etiquetas modificadas/creadas antes de aprobar.
                </p>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 transition-all">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setEvidenciaFile(e.target.files[0])}
                    />
                    <Upload size={20} className="text-cyan-400" />
                    <span className="text-sm text-text-muted">
                      {evidenciaFile ? evidenciaFile.name : 'Selecciona archivo de evidencia'}
                    </span>
                  </label>
                  <button
                    onClick={handleUploadEvidencia}
                    disabled={!evidenciaFile || uploadLoading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white disabled:opacity-40"
                  >
                    {uploadLoading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    Subir Evidencia
                  </button>
                </div>
              </section>
            )}

            {/* ── Acciones de Aprobación ── */}
            {(user?.Rol === 'CALIDAD' || user?.Rol === 'SISTEMAS' || user?.Rol === 'ADMIN') && (
              <section className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Validación de Solicitud</h3>

                {/* Comentario opcional */}
                <textarea
                  rows={2}
                  className="input-field w-full mb-4 text-sm resize-none"
                  placeholder="Comentario (opcional)..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />

                {yaAprobo(solicitud.Estado, user?.Rol) ? (
                  <div className="flex flex-col gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                      <Check size={16} /> Tu aprobación ya fue registrada
                    </div>
                    {getDecisionMotivo() && <div className="text-text-muted text-sm">Motivo: {getDecisionMotivo()}</div>}
                  </div>
                ) : solicitud.Estado === 'rechazado' ? (
                  <div className="flex flex-col gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-red-400 text-sm font-semibold">Esta solicitud fue rechazada.</div>
                    {getDecisionMotivo() && <div className="text-text-muted text-sm">Motivo: {getDecisionMotivo()}</div>}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      disabled={statusLoading || !puedeAprobar}
                      onClick={() => handleTransition('approve')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white shadow-lg shadow-green-500/10 disabled:opacity-40"
                    >
                      {statusLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      Aprobar
                    </button>
                    <button
                      disabled={statusLoading}
                      onClick={() => handleTransition('reject')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10 disabled:opacity-40"
                    >
                      {statusLoading ? <Loader2 className="animate-spin" size={20} /> : <XIcon size={20} />}
                      Rechazar
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ── Descripción ── */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary" /> Descripción
              </h3>
              <div className="bg-white/5 p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed">{solicitud.DescripcionCorta || 'Sin descripción adicional'}</p>
              </div>
            </section>

            {/* ── Adjuntos ── */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ExternalLink size={20} className="text-primary" /> Archivos Adjuntos
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

            {/* ── Historial ── */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History size={20} className="text-primary" /> Historial de Cambios
              </h3>
              {historial.length === 0 ? (
                <p className="text-text-muted text-sm italic p-4 border border-dashed border-border rounded-lg text-center">No hay historial de cambios</p>
              ) : (
                <div className="flow-root">
                  <div className="-mb-8">
                    <ol className="relative border-l border-border">
                      {historial.map((evt, i) => (
                        <li key={i} className="mb-8 ml-6">
                          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-8 ring-background">
                            <Clock size={12} />
                          </span>
                          <div className="pl-2">
                            <p className="font-medium">{evt.Accion}</p>
                            {evt.Comentario && <p className="text-text-muted text-xs mt-1">"{evt.Comentario}"</p>}
                            <p className="text-text-muted text-xs mt-1">{evt.NombreUsuario || evt.UsuarioId} · {new Date(evt.FechaEvento).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </section>

            {/* Modal de confirmación DaisyUI */}
            <div className={`modal ${confirmOpen ? 'modal-open' : ''}`}>
              <div className="modal-box">
                <h3 className="font-bold text-lg">{confirmAction === 'reject' ? 'Confirmar rechazo' : 'Confirmar aprobación'}</h3>
                <p className="py-2 text-text-muted">Por favor confirma la acción e ingresa un motivo (opcional).</p>
                <textarea
                  rows={3}
                  className="input-field w-full mb-4 text-sm resize-none"
                  placeholder="Motivo (opcional)"
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                />
                <div className="modal-action">
                  <button className="btn" onClick={() => { setConfirmOpen(false); setConfirmAction(null); setConfirmReason(''); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleConfirmTransition} disabled={statusLoading}>{statusLoading ? 'Procesando...' : 'Confirmar'}</button>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 flex gap-3">
              <button onClick={onClose} className="px-6 py-2 border border-border rounded-lg hover:bg-white/5 transition-all flex-1">
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
