import React, { useState } from 'react';
import { X, Upload, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import REG011PaperForm from './REG011PaperForm';
import { useToast } from './Toast';

const NuevaSolicitud = ({ isOpen, onClose, onCreated }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    fechaSolicitud: new Date().toISOString().split('T')[0],
    sectorSolicitante: 'Calidad',
    motivo: [],
    nombreProducto: '',
    codigoProducto: '',
    destino: '',
    vidaUtil: '',
    codigoSenasa: '',
    impresoras: [],
    tipoEtiqueta: [],
    tara: '',
    pesoMinimo: '',
    pesoMaximo: '',
    pesoEstandar: '',
    numCaja: '',
    faja: '',
    codigoExterno: '',
    comentariosSolicitante: '',
    cambioSolicitado: ''
  });

  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validación: todos los campos del REG-SIS-011 son obligatorios.
  const CAMPOS_REQUERIDOS = [
    ['fechaSolicitud', 'Fecha de Solicitud'],
    ['sectorSolicitante', 'Sector Solicitante'],
    ['nombreProducto', 'Nombre Producto'],
    ['codigoProducto', 'Código Producto'],
    ['destino', 'Destino'],
    ['vidaUtil', 'Vida Útil'],
    ['codigoSenasa', 'Código SENASA'],
    ['tara', 'Tara'],
    ['pesoMinimo', 'Peso Mínimo'],
    ['pesoMaximo', 'Peso Máximo'],
    ['pesoEstandar', 'Peso Estándar'],
    ['numCaja', 'N° de Caja'],
    ['faja', 'Faja'],
    ['codigoExterno', 'Código Externo'],
    ['comentariosSolicitante', 'Comentarios del Solicitante'],
    ['cambioSolicitado', 'Cambio Solicitado'],
  ];

  // motivo/impresoras pueden venir como array o como string JSON ('["SENASA"]').
  const cantSeleccionados = (v) => {
    if (Array.isArray(v)) return v.length;
    if (typeof v === 'string' && v.trim()) {
      try { const a = JSON.parse(v); return Array.isArray(a) ? a.length : 1; } catch { return 1; }
    }
    return 0;
  };

  const getFaltantes = () => {
    const faltan = [];
    for (const [campo, label] of CAMPOS_REQUERIDOS) {
      const v = formData[campo];
      if (!v || String(v).trim() === '') faltan.push(label);
    }
    if (cantSeleccionados(formData.motivo) === 0) faltan.push('Motivo del cambio (al menos uno)');
    if (cantSeleccionados(formData.impresoras) === 0) faltan.push('Impresoras afectadas (al menos una)');
    if (cantSeleccionados(formData.tipoEtiqueta) === 0) faltan.push('Tipo de etiqueta a modificar (al menos uno)');
    // El Formato Original (archivo) es OPCIONAL al crear el REG-SIS-011.
    return faltan;
  };

  const handleIntentarGuardar = () => {
    const faltan = getFaltantes();
    if (faltan.length > 0) {
      toast.error('Faltan completar campos obligatorios: ' + faltan.join(', '));
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      // 1. Crear la solicitud base (REG-SIS-011)
      const res = await axios.post('/api/solicitudes', { ...formData });
      const solicitudId = res.data.solicitudId;

      // 2. Si hay archivo inicial (opcional), subirlo
      if (file && solicitudId) {
        const formDataFile = new FormData();
        formDataFile.append('archivo', file);
        await axios.post(`/api/solicitudes/${solicitudId}/adjuntos?tipo=ORIGINAL`, formDataFile);
      }

      toast.success("Registro REG-SIS-011 creado. Pendiente de aprobación por Sistemas.");
      onCreated();
      onClose();
    } catch (err) {
      toast.error("Error al crear el registro REG-SIS-011: " + (err.response?.data?.detalle || err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl my-8 relative">
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-2 shadow-xl hover:bg-red-700 transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="bg-white rounded-xl shadow-2xl p-2 md:p-8">
          <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tighter">Nueva Solicitud de Etiquetas (REG-SIS-011)</h2>
            <div className="flex gap-3">
               <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 font-bold uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                onClick={(e) => { e.preventDefault(); handleIntentarGuardar(); }}
                className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold uppercase text-xs hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Guardar y Enviar a Sistemas
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-2">
            {/* El "Formato Original" se carga con la caja "+" dentro del propio
                formulario (misma experiencia que el REG-SIS-007). El archivo queda
                local y se sube al crear la solicitud. */}
            <REG011PaperForm
              data={formData}
              onChange={handleFieldChange}
              localFile={file}
              onLocalFileChange={setFile}
            />
          </div>
        </div>
      </div>

      {/* Modal de Confirmación DaisyUI */}
      {showConfirm && (
        <div className="modal modal-open z-[100] backdrop-blur-sm">
          <div className="modal-box bg-[#1e293b] text-white border border-slate-700 max-w-md">
            <h3 className="font-bold text-lg text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping"></span>
              Confirmar Registro
            </h3>
            <p className="py-4 text-sm text-slate-300 font-medium">
              ¿Confirma la creación de este nuevo registro de etiquetas (REG-SIS-011) y su envío a Sistemas?
            </p>
            <div className="modal-action">
              <button 
                type="button"
                onClick={() => setShowConfirm(false)} 
                className="btn btn-sm btn-outline border-slate-600 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px]"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }} 
                className="btn btn-sm btn-success text-white font-bold uppercase tracking-wider text-[10px]"
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaSolicitud;
