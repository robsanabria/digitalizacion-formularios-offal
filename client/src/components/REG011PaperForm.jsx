import React, { useMemo, useEffect } from 'react';
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
  uploadLoading = false,
  localFile = null,          // archivo seleccionado en modo creación (aún no subido)
  onLocalFileChange = null,  // setter del archivo local (creación)
  printToken = ''            // token para que Puppeteer cargue las imágenes en el PDF
}) => {
  const imgSrc = (adjId) => `/api/solicitudes/${solicitudId}/adjuntos/${adjId}/descargar${printToken ? `?k=${encodeURIComponent(printToken)}` : ''}`;
  // Vista previa del archivo local (creación) sin subirlo todavía.
  const localPreview = useMemo(
    () => (localFile && localFile.type?.startsWith('image/') ? URL.createObjectURL(localFile) : null),
    [localFile]
  );
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);
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
    // Todos los campos (motivo, impresoras, tipo de etiqueta) son de selección MÚLTIPLE.
    // El motivo permite marcar varios en simultáneo (ej: SENASA + Modificación de existente).
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
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
          <div className="p-1 border-b-[2px] border-black text-center">Emisión: 01/07/2026</div>
          <div className="p-1 border-b-[2px] border-black text-center">Revisión 11-26</div>
          <div className="p-1 text-center">Página 1 de 1</div>
        </div>
      </div>

      {/* Row 1: Fecha y Sector */}
      <div className="flex border-b-[2px] border-black text-xs font-bold">
        <div className="w-1/2 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Fecha de Solicitud:</span>
          {/* La fecha NO es editable: la toma del sistema (no se habilita el calendario). */}
          <span className="flex-1 border-b border-black/20 px-2">
            {data.fechaSolicitud ? new Date(String(data.fechaSolicitud).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
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

      {/* "Comentarios Usuario Solicitante" es el título de la sección, y el
          "Cambio Solicitado" es su contenido (una sola sección). */}
      {/* "Comentarios Usuario Solicitante" es SOLO el título de la sección; el
          contenido es el "Cambio Solicitado (Breve Descripción)". */}
      <div className="p-2 min-h-[130px] border-b-[2px] border-black">
        <div className="text-[10px] font-black uppercase mb-1">Comentarios Usuario Solicitante:</div>
        <div className="text-[10px] font-bold mb-1">Cambio Solicitado (Breve Descripción):</div>
        <textarea
          readOnly={readOnly}
          rows={5}
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
                  src={imgSrc(calidadAdjunto.AdjuntoId)}
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
          ) : localFile ? (
            /* Creación: vista previa del archivo local seleccionado (aún no subido) */
            <div className="flex flex-col items-center max-w-full relative group">
              {onLocalFileChange && (
                <button
                  type="button"
                  onClick={() => onLocalFileChange(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 no-print"
                  title="Quitar archivo"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {localPreview ? (
                <img src={localPreview} className="max-h-[290px] max-w-full object-contain border border-gray-300 shadow-md p-1 bg-white" alt="Vista previa" />
              ) : (
                <div className="flex flex-col items-center p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-600 max-w-xs text-center shadow-inner">
                  <span className="font-bold text-xs uppercase truncate max-w-full">{localFile.name}</span>
                  <span className="text-[9px] text-gray-400 mt-1.5 uppercase font-bold tracking-wider">Archivo seleccionado</span>
                </div>
              )}
              <span className="text-[9px] text-green-600 mt-1.5 font-black italic truncate max-w-full">{localFile.name}</span>
            </div>
          ) : onLocalFileChange ? (
            /* Creación: caja "+" para elegir el archivo local (misma experiencia que REG-SIS-007) */
            <label className="no-print border-2 border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer max-w-[210px] w-full h-[180px] active:scale-95 shadow-inner">
              <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => onLocalFileChange(e.target.files[0] || null)} />
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Plus className="text-blue-600 animate-pulse" size={24} />
              </div>
              <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider text-center">Cargar Formato Original</span>
            </label>
          ) : canEditOriginal && onUploadAdjunto ? (
            <label className="no-print border-2 border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer max-w-[210px] w-full h-[180px] active:scale-95 shadow-inner">
              <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => onUploadAdjunto(e, 'ORIGINAL')} />
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Plus className="text-blue-600 animate-pulse" size={24} />
              </div>
              <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider text-center">Cargar Formato Original</span>
              {uploadLoading && <Loader2 className="animate-spin text-blue-600 mt-2" size={16} />}
            </label>
          ) : (
            <div className="text-gray-300 font-bold text-base uppercase opacity-30 select-none border-2 border-dashed border-gray-200 p-8 rounded-lg">Sin archivo de referencia original</div>
          )}
        </div>
      </div>

      {/* Footer / Firmas — fila de encabezados (SOLICITANTE / SISTEMAS) + fila de firmas */}
      <div className="border-t-[3px] border-black">
        {/* Encabezados */}
        <div className="flex text-[9px] font-black uppercase text-center">
          <div className="w-1/2 border-r-[2px] border-black p-1">Solicitante:</div>
          <div className="w-1/2 p-1">Sistemas:</div>
        </div>

        {/* Firmas */}
        <div className="flex border-t-[2px] border-black min-h-[110px] text-[8px]">
          {/* Solicitante (Calidad) — con la firma digital del creador */}
          <div className="w-1/2 border-r-[2px] border-black flex flex-col p-2">
            <div className="flex-1 flex items-center justify-center">
              {solicitanteNombre && (
                <div className="text-center">
                  <div className="font-serif italic text-sm text-blue-900 border-b border-blue-200 px-3 font-black py-0.5 transform rotate-[-2deg]">{solicitanteNombre}</div>
                  <div className="text-[6.5px] text-blue-500 uppercase tracking-widest mt-0.5 font-bold">Generado digitalmente {solicitanteRol ? `· ${solicitanteRol}` : ''}</div>
                </div>
              )}
            </div>
            <div className="border-t border-black/40 pt-1 text-center font-bold">Firma y Aclaración de Personal de calidad</div>
            <div className="text-center text-gray-500 mt-0.5">Fecha: {solicitanteFecha ? new Date(solicitanteFecha).toLocaleDateString() : '____/____/______'}</div>
          </div>

          {/* Sistemas: receptor — se completa al aprobar el REG-SIS-011 */}
          <div className="w-1/2 flex flex-col p-2">
            <div className="flex-1 flex items-center justify-center">
              {sistemasFirma && (
                <div className="text-center">
                  <div className="font-serif italic text-sm text-green-900 border-b border-green-200 px-3 font-black py-0.5 transform rotate-[-2deg]">{sistemasFirma.user}</div>
                  <div className="text-[6.5px] text-green-500 uppercase tracking-widest mt-0.5 font-bold">REG-SIS-011 Aprobado</div>
                </div>
              )}
            </div>
            <div className="border-t border-black/40 pt-1 text-center font-bold">Firma y Aclaración del receptor</div>
            <div className="text-center text-gray-500 mt-0.5">Fecha: {sistemasFirma ? new Date(sistemasFirma.date).toLocaleDateString() : '____/____/______'}</div>
          </div>
        </div>
      </div>

      {/* Referencias / Notas al pie del formulario */}
      <div className="border-t-[2px] border-black p-2 text-[7px] leading-snug text-gray-800 text-justify">
        <span className="font-black">Referencias: </span>
        <sup>1</sup> BIZERBA (Balanza de menudencias), ZEBRA (alto impacto despostada y menudencias, reproceso, congelado, rechazo despostada, pre etiqueta despostada), KETAN (Pre etiquetas de menudencias), VIDEOJET (Balanza dinámica despostada).{' '}
        <sup>2</sup> En el caso de que el cambio no requiera ser completado se colocará N/A = No Aplica.{' '}
        <sup>3</sup> Colocar una cruz (X) en los casilleros correspondientes.{' '}
        <sup>4</sup> Faja: Rellenar con SI/NO/No Aplica = N/A.{' '}
        <sup>5</sup> N° de Caja: 1.Chica OFFAL TAVIL, 2.Mediana OFFAL TAVIL, 3.Grande OFFAL TAVIL, 7.Dragon OFFAL TAVIL, 8.Santa Marta TAVIL, 9.Santa Casilda Marron TAVIL, 10.Santa Casilda Blanca TAVIL, 11.Chica LISA TAVIL, 12.Grande LISA TAVIL, 13.Fondo TAVIL, 14.Tapa OFFAL TAVIL.{' '}
        <sup>6</sup> Vida Útil: Se expresará en meses.
      </div>
    </div>
  );
};

export default REG011PaperForm;
