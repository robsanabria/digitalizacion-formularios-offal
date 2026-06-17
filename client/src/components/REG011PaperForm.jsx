import React from 'react';
import { Check, Trash2, Plus, Loader2 } from 'lucide-react';

const REG011PaperForm = ({
  solicitudId,
  data,
  onChange,
  readOnly = false,
  userRole = '',
  solicitudEstado = '',
  adjuntos = [],
  historial = [],
  onUploadAdjunto,
  onDeleteAdjunto,
  uploadLoading = false
}) => {
  // Firma del solicitante: usuario que creó el REG-SIS-011.
  const solicitanteNombre = data.solicitanteNombre || '';
  const solicitanteRol = data.rolSolicitante || '';
  const solicitanteFecha = data.fechaCreacion || data.fechaSolicitud || null;

  // Firma de Sistemas: se completa cuando Sistemas aprueba el REG-SIS-011.
  const sistemasFirma = (() => {
    if (!Array.isArray(historial)) return null;
    // Robusto: coincide con registros nuevos ('REG-SIS-011 aprobado por Sistemas')
    // y con datos previos ('REG-11 aprobado por Sistemas').
    const ev = historial.find(h => h.Accion?.includes('aprobado por Sistemas'));
    return ev ? { user: ev.NombreUsuario, date: ev.FechaEvento } : null;
  })();
  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  const selectedMotivos = parseArray(data.motivo);
  const selectedImpresoras = parseArray(data.impresoras);
  const selectedTipoEtiqueta = parseArray(data.tipoEtiqueta);
  const selectedFor = (field) =>
    field === 'motivo' ? selectedMotivos
    : field === 'impresoras' ? selectedImpresoras
    : selectedTipoEtiqueta;

  const toggleOption = (field, option) => {
    if (readOnly) return;
    const current = parseArray(data[field]);
    let updated;
    if (field === 'motivo') {
      // Motivo del cambio: selección ÚNICA (no se pueden marcar varios/todos).
      updated = current.includes(option) ? [] : [option];
    } else {
      // Impresoras: selección múltiple.
      updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
    }
    onChange(field, JSON.stringify(updated));
  };

  const Checkbox = ({ label, field, option }) => (
    <div 
      className={`flex items-center gap-2 cursor-pointer ${readOnly ? 'cursor-default' : ''}`}
      onClick={() => toggleOption(field, option)}
    >
      <div className={`w-5 h-5 border-2 border-black flex items-center justify-center bg-white`}>
        {selectedFor(field).includes(option) && <Check size={16} strokeWidth={3} className="text-black" />}
      </div>
      <span className="text-xs font-bold uppercase">{label}</span>
    </div>
  );
  // Calidad's uploaded reference
  let calidadAdjunto = adjuntos && adjuntos.find(a => a.TipoAdjunto === 'ORIGINAL');
  if (!calidadAdjunto && adjuntos && adjuntos.length > 0) {
    calidadAdjunto = adjuntos[0];
  }

  // Calidad puede gestionar el adjunto "Formato Original" mientras el circuito no esté finalizado.
  const canEditOriginal = (userRole === 'CALIDAD' || userRole === 'ADMIN') &&
                          !['APROBADO', 'RECHAZADO'].includes(solicitudEstado);

  return (
    <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl mx-auto font-serif shadow-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="flex border-b-[3px] border-black">
        <div className="w-1/4 p-4 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
          <div className="font-bold text-lg leading-tight">OFFAL EXP SA</div>
          <div className="text-[10px]">Establecimiento Oficial Nº 4407</div>
        </div>
        <div className="w-1/2 p-2 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold">SISTEMA DE GESTION DE CALIDAD E INOCUIDAD</div>
          <div className="text-base font-black mt-1">SOLICITUD DE ETIQUETAS</div>
        </div>
        <div className="w-1/4 flex flex-col text-[10px]">
          <div className="p-1 border-b-[2px] border-black text-center font-bold">REG-SIS-011</div>
          <div className="p-1 border-b-[2px] border-black text-center">Emisión: 20-02-2025</div>
          <div className="p-1 border-b-[2px] border-black text-center">Revisión 10-25</div>
          <div className="p-1 text-center">Página 1 de 1</div>
        </div>
      </div>

      {/* Row 1: Fecha y Sector */}
      <div className="flex border-b-[2px] border-black text-xs font-bold">
        <div className="w-1/2 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Fecha de Solicitud:</span>
          {/* La fecha NO es editable: la toma del sistema (no se habilita el calendario). */}
          <span className="flex-1 border-b border-black/20 px-2">
            {data.fechaSolicitud ? new Date(data.fechaSolicitud).toLocaleDateString() : new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="w-1/2 p-2 flex gap-2 items-center">
          <span>Sector Solicitante:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.sectorSolicitante || ''}
            onChange={e => onChange('sectorSolicitante', e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Motivos */}
      <div className="flex border-b-[2px] border-black p-2 gap-6 bg-gray-50">
        <Checkbox label="SENASA" field="motivo" option="SENASA" />
        <Checkbox label="Nuevo producto" field="motivo" option="Nuevo producto" />
        <Checkbox label="Modificación de existente" field="motivo" option="Modificación de existente" />
        <Checkbox label="Reactivación" field="motivo" option="Reactivación" />
      </div>

      {/* Row 2b: Tipo de etiqueta a modificar */}
      <div className="flex border-b-[2px] border-black p-2 gap-4 flex-wrap items-center">
        <span className="text-[10px] font-bold uppercase mr-1">Tipo de etiqueta a modificar:</span>
        <Checkbox label="Alto Impacto" field="tipoEtiqueta" option="Alto Impacto" />
        <Checkbox label="Etiqueta Final" field="tipoEtiqueta" option="Etiqueta Final" />
        <Checkbox label="Pre etiqueta" field="tipoEtiqueta" option="Pre etiqueta" />
        <Checkbox label="Etiqueta Primaria" field="tipoEtiqueta" option="Etiqueta Primaria" />
        <Checkbox label="Etiqueta Interna" field="tipoEtiqueta" option="Etiqueta Interna" />
      </div>

      {/* Row 3: Nombre y Codigo Prod */}
      <div className="flex border-b-[2px] border-black text-xs font-bold">
        <div className="w-2/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Nombre Producto:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 uppercase font-black bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.nombreProducto || ''}
            onChange={e => onChange('nombreProducto', e.target.value)}
          />
        </div>
        <div className="w-1/3 p-2 flex gap-2 items-center">
          <span>Código Producto:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.codigoProducto || ''}
            onChange={e => onChange('codigoProducto', e.target.value)}
          />
        </div>
      </div>

      {/* Row 4: Destino, Vida Util, Codigo Senasa */}
      <div className="flex border-b-[2px] border-black text-[10px] font-bold">
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Destino:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.destino || ''}
            onChange={e => onChange('destino', e.target.value)}
          />
        </div>
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Vida Útil:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.vidaUtil || ''}
            onChange={e => onChange('vidaUtil', e.target.value)}
          />
        </div>
        <div className="w-1/3 p-2 flex gap-2 items-center">
          <span>Código SENASA:</span>
          <input 
            readOnly={readOnly}
            className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
            value={data.codigoSenasa || ''}
            onChange={e => onChange('codigoSenasa', e.target.value)}
          />
        </div>
      </div>

      {/* Row 5: Impresoras */}
      <div className="flex border-b-[2px] border-black p-1 gap-8 justify-around bg-gray-50">
        <Checkbox label="BIZERBA" field="impresoras" option="BIZERBA" />
        <Checkbox label="ZEBRA" field="impresoras" option="ZEBRA" />
        <Checkbox label="KETAN" field="impresoras" option="KETAN" />
        <Checkbox label="VIDEOJET" field="impresoras" option="VIDEOJET" />
      </div>

      {/* Row 6: Pesos */}
      <div className="flex border-b-[2px] border-black text-[10px] font-bold">
        <div className="w-1/4 p-2 border-r-[2px] border-black flex flex-col">
          <span>Tara:</span>
          <input readOnly={readOnly} className={`w-full bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.tara || ''} onChange={e => onChange('tara', e.target.value)} />
        </div>
        <div className="w-1/4 p-2 border-r-[2px] border-black flex flex-col">
          <span>Peso Mínimo:</span>
          <input readOnly={readOnly} className={`w-full bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.pesoMinimo || ''} onChange={e => onChange('pesoMinimo', e.target.value)} />
        </div>
        <div className="w-1/4 p-2 border-r-[2px] border-black flex flex-col">
          <span>Peso Máximo:</span>
          <input readOnly={readOnly} className={`w-full bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.pesoMaximo || ''} onChange={e => onChange('pesoMaximo', e.target.value)} />
        </div>
        <div className="w-1/4 p-2 flex flex-col">
          <span>Peso Estándar:</span>
          <input readOnly={readOnly} className={`w-full bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.pesoEstandar || ''} onChange={e => onChange('pesoEstandar', e.target.value)} />
        </div>
      </div>

      {/* Row 7: Caja, Faja, Cod Ext */}
      <div className="flex border-b-[2px] border-black text-[10px] font-bold">
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>N° de Caja:</span>
          <input readOnly={readOnly} className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.numCaja || ''} onChange={e => onChange('numCaja', e.target.value)} />
        </div>
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Faja:</span>
          <input readOnly={readOnly} className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.faja || ''} onChange={e => onChange('faja', e.target.value)} />
        </div>
        <div className="w-1/3 p-2 flex gap-2 items-center">
          <span>Código Externo:</span>
          <input readOnly={readOnly} className={`flex-1 bg-transparent outline-none px-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} value={data.codigoExterno || ''} onChange={e => onChange('codigoExterno', e.target.value)} />
        </div>
      </div>

      {/* Comentarios */}
      <div className="p-2 border-b-[2px] border-black">
        <div className="text-[10px] font-bold mb-1">Comentarios Usuario Solicitante:</div>
        <textarea 
          readOnly={readOnly}
          rows={2} 
          className={`w-full bg-transparent outline-none text-xs resize-none p-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
          value={data.comentariosSolicitante || ''}
          onChange={e => onChange('comentariosSolicitante', e.target.value)}
        />
      </div>

      {/* Cambio Solicitado */}
      <div className="p-2 min-h-[100px] border-b-[2px] border-black">
        <div className="text-[10px] font-bold mb-1 uppercase">Cambio Solicitado (Breve Descripción):</div>
        <textarea 
          readOnly={readOnly}
          rows={4} 
          className={`w-full bg-transparent outline-none text-xs resize-none p-1 rounded transition-colors ${!readOnly ? 'bg-blue-50/20 focus:bg-blue-50/50' : ''}`} 
          value={data.cambioSolicitado || ''}
          placeholder="Describa aquí el cambio..."
          onChange={e => onChange('cambioSolicitado', e.target.value)}
        />
      </div>

      {/* Formato Original Area */}
      <div className="relative min-h-[350px] flex">
        <div className="w-8 border-r-[2px] border-black flex items-center justify-center bg-gray-50/50 select-none">
          <span className="rotate-[-90deg] text-[9px] font-black uppercase tracking-widest whitespace-nowrap text-gray-500">Formato original</span>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white">
          {calidadAdjunto ? (
            <div className="flex flex-col items-center max-w-full relative group">
              {canEditOriginal && onDeleteAdjunto && (
                <button
                  type="button"
                  onClick={() => onDeleteAdjunto(calidadAdjunto.AdjuntoId)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 no-print"
                  title="Eliminar adjunto original"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {calidadAdjunto.TipoContenido?.startsWith('image/') ? (
                <img 
                  src={`/api/solicitudes/${solicitudId}/adjuntos/${calidadAdjunto.AdjuntoId}/descargar`}
                  className="max-h-[290px] max-w-full object-contain border border-gray-300 shadow-md p-1 bg-white"
                  alt="Referencia Original"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-600 max-w-xs text-center shadow-inner">
                  <span className="font-bold text-xs uppercase truncate max-w-full">{calidadAdjunto.NombreArchivo}</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 uppercase font-bold tracking-wider">Archivo de Referencia Calidad</span>
                </div>
              )}
            </div>
          ) : (
            canEditOriginal && onUploadAdjunto ? (
              <label className="border-2 border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer max-w-[210px] w-full h-[180px] active:scale-95 shadow-inner">
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => onUploadAdjunto(e, 'ORIGINAL')} />
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <Plus className="text-blue-600 animate-pulse" size={24} />
                </div>
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider text-center">Cargar Formato Original</span>
                {uploadLoading && <Loader2 className="animate-spin text-blue-600 mt-2" size={16} />}
              </label>
            ) : (
              <div className="text-gray-300 font-bold text-base uppercase opacity-30 select-none border-2 border-dashed border-gray-200 p-8 rounded-lg">Sin archivo de referencia original</div>
            )
          )}
        </div>
      </div>

      {/* Footer / Signatures Area */}
      <div className="flex border-t-[3px] border-black min-h-[96px]">
        {/* Solicitante: usuario que generó el REG-SIS-011 */}
        <div className="w-2/3 border-r-[2px] border-black flex flex-col p-2">
          <div className="text-[9px] font-bold uppercase">Solicitante (Calidad):</div>
          <div className="flex-1 flex flex-col items-center justify-center py-1">
            {solicitanteNombre ? (
              <div className="text-center">
                <div className="font-serif italic text-sm text-blue-900 border-b border-blue-200 px-4 font-black py-0.5 transform rotate-[-2deg]">{solicitanteNombre}</div>
                <div className="text-[7px] text-blue-500 uppercase tracking-widest mt-1 font-bold">Generado digitalmente {solicitanteRol ? `· ${solicitanteRol}` : ''}</div>
              </div>
            ) : (
              <div className="text-[8px] text-gray-400 italic uppercase">Firma y aclaración del personal de Calidad</div>
            )}
          </div>
          <div className="text-[8px] text-gray-500 border-t border-black/20 pt-1">
            Fecha de generación: {solicitanteFecha ? new Date(solicitanteFecha).toLocaleDateString() : '____/____/______'}
          </div>
        </div>
        {/* Sistemas: se completa al aprobar el REG-SIS-011 */}
        <div className="w-1/3 flex flex-col p-2">
          <div className="text-[9px] font-bold uppercase">Sistemas (Receptor):</div>
          <div className="flex-1 flex flex-col items-center justify-center py-1">
            {sistemasFirma ? (
              <div className="text-center">
                <div className="font-serif italic text-sm text-green-900 border-b border-green-200 px-4 font-black py-0.5 transform rotate-[-2deg]">{sistemasFirma.user}</div>
                <div className="text-[7px] text-green-500 uppercase tracking-widest mt-1 font-bold">REG-SIS-011 Aprobado</div>
              </div>
            ) : (
              <div className="text-[8px] text-gray-400 italic uppercase text-center">Pendiente de aprobación de Sistemas</div>
            )}
          </div>
          <div className="text-[8px] text-gray-500 border-t border-black/20 pt-1">
            Fecha: {sistemasFirma ? new Date(sistemasFirma.date).toLocaleDateString() : '____/____/______'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default REG011PaperForm;
