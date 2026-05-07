import React, { useState } from 'react';
import { X, Upload, Save, Loader2 } from 'lucide-react';
import axios from 'axios';

const NuevaSolicitud = ({ isOpen, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreProducto: '',
    motivo: '',
    tipoSenasa: 'SENASA',
    destino: '',
    codigo: '',
    codigoSenasa: '',
    descripcionCorta: '',
    impresoras: []
  });
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Crear la solicitud base
      const res = await axios.post('/api/solicitudes', {
        ...formData,
        solicitadoPor: '00000000-0000-0000-0000-000000000000', // GUID temporal hasta tener Auth
        rolSolicitante: 'CALIDAD'
      });

      const solicitudId = res.data.id || res.data.solicitudId;

      // 2. Si hay archivo, subirlo
      if (file && solicitudId) {
        const formDataFile = new FormData();
        formDataFile.append('archivo', file);
        await axios.post(`/api/solicitudes/${solicitudId}/adjuntos`, formDataFile);
      }

      onCreated();
      onClose();
    } catch (err) {
      alert("Error al crear la solicitud: " + (err.response?.data?.detalle || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Nueva Solicitud</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Nombre del Producto</label>
              <input 
                required
                className="input-field"
                value={formData.nombreProducto}
                onChange={(e) => setFormData({...formData, nombreProducto: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Tipo SENASA</label>
              <select 
                className="input-field"
                value={formData.tipoSenasa}
                onChange={(e) => setFormData({...formData, tipoSenasa: e.target.value})}
              >
                <option value="SENASA">SENASA</option>
                <option value="Nuevo producto">Nuevo producto</option>
                <option value="Modificación">Modificación</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Motivo del Cambio</label>
            <textarea 
              required
              rows={3}
              className="input-field"
              value={formData.motivo}
              onChange={(e) => setFormData({...formData, motivo: e.target.value})}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Destino</label>
              <input 
                className="input-field"
                value={formData.destino}
                onChange={(e) => setFormData({...formData, destino: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Código Interno</label>
              <input 
                className="input-field"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Adjuntar Evidencia (PDF/Imagen)</label>
            <div className="relative group">
              <input 
                type="file" 
                className="hidden" 
                id="file-upload"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label 
                htmlFor="file-upload"
                className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer group-hover:border-primary group-hover:bg-primary/5 transition-all"
              >
                <Upload size={24} className="text-text-muted group-hover:text-primary" />
                <span className="text-text-muted group-hover:text-primary font-medium">
                  {file ? file.name : "Selecciona o arrastra un archivo"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-text-muted hover:text-white font-medium">
              Cancelar
            </button>
            <button disabled={loading} type="submit" className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Crear Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaSolicitud;
