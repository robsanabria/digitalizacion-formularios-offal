import React from 'react';
import { Check, Upload, Plus, Loader2, Trash2 } from 'lucide-react';

const REG007PaperForm = ({ 
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
  printToken = ''
}) => {
  const imgSrc = (adjId) => `/api/solicitudes/${solicitudId}/adjuntos/${adjId}/descargar${printToken ? `?k=${encodeURIComponent(printToken)}` : ''}`;

  const canEditOriginal = (userRole === 'CALIDAD' || userRole === 'ADMIN') &&
                          !['APROBADO', 'RECHAZADO'].includes(solicitudEstado);
  const canEditProposed = !readOnly && (userRole === 'SISTEMAS' || userRole === 'ADMIN');

  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  const selectedMotivos = parseArray(data.motivo);
  const selectedImpresoras = parseArray(data.impresoras);
  const selectedTipoEtiqueta = parseArray(data.tipoEtiqueta);

  // Calidad's uploaded reference
  let calidadAdjunto = adjuntos && adjuntos.find(a => a.TipoAdjunto === 'ORIGINAL');
  if (!calidadAdjunto && adjuntos && adjuntos.length > 0) {
    calidadAdjunto = adjuntos[0];
  }
  
  // Sistemas' modified label samples
  let sistemasAdjuntos = adjuntos ? adjuntos.filter(a => a.TipoAdjunto === 'PROPUESTO') : [];
  if (sistemasAdjuntos.length === 0 && adjuntos && adjuntos.length > 1) {
    sistemasAdjuntos = adjuntos.slice(1);
  }

  // Buscar firmas en el historial de trazabilidad de la base de datos
  const parseHistorialFirmas = () => {
    let sistemasFirma = null;
    let calidadFirma = null;

    if (historial && Array.isArray(historial)) {
      // 1. Firma Sistemas: el evento donde Sistemas completó el REG-SIS-007
      // (no confundir con 'REG-SIS-011 aprobado por Sistemas', que es la compuerta previa).
      const evSistemas = historial.find(h =>
        h.Accion?.includes('Respuesta Sistemas') || h.EstadoNuevo === 'REG-007-PENDIENTE-APROBACION'
      );
      if (evSistemas) {
        sistemasFirma = {
          user: evSistemas.NombreUsuario,
          date: evSistemas.FechaEvento
        };
      }

      // 2. Firma Calidad: buscar el evento donde aprobó Calidad
      const evCalidad = historial.find(h => 
        h.Accion?.includes('Aprobado por Calidad') || h.Accion?.includes('Finalizado') || h.EstadoNuevo === 'APROBADO'
      );
      if (evCalidad) {
        calidadFirma = {
          user: evCalidad.NombreUsuario,
          date: evCalidad.FechaEvento
        };
      }
    }

    return { sistemasFirma, calidadFirma };
  };

  const { sistemasFirma, calidadFirma } = parseHistorialFirmas();

  const Checkbox = ({ label, checked }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center bg-white`}>
        {checked && <Check size={11} strokeWidth={4} className="text-black" />}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tight text-gray-800">{label}</span>
    </div>
  );

  const PageHeader = ({ pageNum, totalPages = 4 }) => (
    <div className="flex border-b-[3px] border-black text-black">
      <div className="w-1/4 p-3 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
        <div className="font-serif font-black text-sm leading-tight">OFFAL EXP SA</div>
        <div className="text-[7.5px] font-bold tracking-tight mt-0.5 uppercase">Establecimiento Oficial Nº 4407</div>
      </div>
      <div className="w-1/2 p-2 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
        <div className="text-[8.5px] font-black uppercase tracking-wider text-gray-700">SISTEMA DE GESTION DE CALIDAD E INOCUIDAD</div>
        <div className="text-sm font-black mt-0.5 uppercase tracking-tighter border-t border-black/20 pt-0.5 w-full">MODIFICACIÓN DE ETIQUETAS</div>
      </div>
      <div className="w-1/4 flex flex-col text-[7.5px] font-bold">
        <div className="p-1 border-b border-black text-center font-black bg-gray-50">REG-SIS-007</div>
        <div className="p-1 border-b border-black text-center">Emisión: 08-10-2024</div>
        <div className="p-1 border-b border-black text-center">Revisión 04-24</div>
        <div className="p-1 text-center font-black">Página {pageNum} de {totalPages}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto print:block print:gap-0">

      {/* 📄 PÁGINA 1 de 4: DATOS DEL REGISTRO Y FORMATO ORIGINAL */}
      <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl w-full font-serif shadow-2xl overflow-hidden print:mb-0 print:shadow-none print:bg-white print:break-after-page">
        <PageHeader pageNum={1} />
        
        {/* Row 1: Fecha y Solicitado por */}
        <div className="flex border-b-[2px] border-black text-[9px] font-bold">
          <div className="w-1/2 p-2 border-r-[2px] border-black flex gap-2 items-center">
            <span>Fecha de presentación:</span>
            <span>{data.fechaPresentacion ? new Date(data.fechaPresentacion).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>
          <div className="w-1/2 p-2 flex gap-2 items-center">
            <span>Solicitado por:</span>
            <span className="uppercase text-gray-700">{data.sectorSolicitante || 'CALIDAD'}</span>
          </div>
        </div>

        {/* Row 2: Motivos */}
        <div className="flex border-b-[2px] border-black p-2 gap-4 items-center">
          <span className="text-[9px] font-bold mr-2">Motivo del cambio:</span>
          <Checkbox label="SENASA" checked={selectedMotivos.includes('SENASA')} />
          <Checkbox label="Nuevo producto" checked={selectedMotivos.includes('Nuevo producto')} />
          <Checkbox label="Modificación de existente" checked={selectedMotivos.includes('Modificación de existente') || selectedMotivos.length === 0} />
          <Checkbox label="Reactivación" checked={selectedMotivos.includes('Reactivación')} />
        </div>

        {/* Row 3: Nombre Producto */}
        <div className="flex border-b-[2px] border-black text-[9px] font-bold p-2 gap-2 items-center">
          <span>Nombre Producto:</span>
          <span className="flex-1 uppercase font-black tracking-tight">{data.nombreProducto || ''}</span>
        </div>

        {/* Row 4: Destino, Twins, Senasa */}
        <div className="flex border-b-[2px] border-black text-[9px] font-bold">
          <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
            <span>Destino:</span>
            <span className="uppercase">{data.destino || ''}</span>
          </div>
          <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
            <span>Código TWINS:</span>
            <span>{data.codigoTwins || data.codigoProducto || '21.8'}</span>
          </div>
          <div className="w-1/3 p-2 flex gap-2 items-center">
            <span>Código SENASA:</span>
            <span>{data.codigoSenasa || ''}</span>
          </div>
        </div>

        {/* Row 5: Impresoras */}
        <div className="flex border-b-[2px] border-black text-[9px] font-bold p-2 gap-2 items-center">
          <span>Impresoras afectadas:</span>
          <span className="flex-1 uppercase tracking-tight">{selectedImpresoras.join(' / ')}</span>
        </div>

        {/* Row 5b: Tipo de etiqueta a modificar */}
        <div className="flex border-b-[2px] border-black text-[9px] font-bold p-2 gap-2 items-center">
          <span>Tipo de etiqueta a modificar:</span>
          <span className="flex-1 uppercase tracking-tight">{selectedTipoEtiqueta.join(' / ')}</span>
        </div>

        {/* Formato Original Area */}
        <div className="relative min-h-[460px] flex">
          <div className="w-8 border-r-[2px] border-black flex items-center justify-center bg-gray-50/50 select-none">
            <span className="rotate-[-90deg] text-[9px] font-black uppercase tracking-widest whitespace-nowrap text-gray-500">Formato original</span>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white">
            {calidadAdjunto ? (
              <div className="flex flex-col items-center max-w-full relative group">
                {canEditOriginal && onDeleteAdjunto && (
                  <button
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
                    className="max-h-[380px] max-w-full object-contain border border-gray-300 shadow-md p-1 bg-white"
                    alt="Referencia Original"
                    loading="eager"
                  />
                ) : (
                  <div className="flex flex-col items-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-600 max-w-xs text-center shadow-inner">
                    <span className="font-bold text-xs uppercase truncate max-w-full">{calidadAdjunto.NombreArchivo}</span>
                    <span className="text-[9px] text-gray-400 mt-1.5 uppercase font-bold tracking-wider">Archivo de Referencia Calidad</span>
                  </div>
                )}
              </div>
            ) : (
              canEditOriginal && onUploadAdjunto ? (
                <label className="no-print border-2 border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer max-w-[210px] w-full h-[180px] active:scale-95 shadow-inner animate-in fade-in duration-300">
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
      </div>

      {/* 📄 PÁGINA 2 de 4: ETIQUETAS TÉCNICAS RESULTANTES EN PLANTA */}
      <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl w-full font-serif shadow-2xl overflow-hidden print:mb-0 print:shadow-none print:bg-white print:break-after-page">
        <PageHeader pageNum={2} />
        
        <div className="p-6 min-h-[600px] flex flex-col justify-between">
          <div className="text-center mb-6 border-b border-black pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Etiquetas Técnicas Resultantes (Modificadas en Planta)</h3>
            <p className="text-[8px] text-gray-500 italic mt-0.5 uppercase tracking-tighter">Suba capturas individuales de cada una de las etiquetas del circuito (máx. 9)</p>
          </div>
          
          {/* Grid de placeholders para subir imágenes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 items-center justify-items-center">
            {sistemasAdjuntos.map((img, idx) => (
              <div key={img.AdjuntoId} className="border border-black p-2 flex flex-col items-center relative bg-white max-w-[210px] w-full shadow-sm hover:shadow-md transition-shadow group">
                <span className="absolute top-1 right-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">
                  #{idx + 1}
                </span>
                {canEditProposed && onDeleteAdjunto && (
                  <button
                    onClick={() => onDeleteAdjunto(img.AdjuntoId)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 no-print"
                    title={`Eliminar etiqueta #${idx + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <img 
                  src={imgSrc(img.AdjuntoId)}
                  className="h-[140px] max-w-full object-contain border border-gray-200"
                  alt={`Etiqueta Modificada ${idx + 1}`}
                  loading="eager"
                />
                <span className="text-[8px] mt-1.5 text-gray-500 font-black truncate max-w-full uppercase tracking-tighter text-center">{img.NombreArchivo}</span>
              </div>
            ))}

            {/* Botón de carga integrado como placeholder en papel */}
            {canEditProposed && sistemasAdjuntos.length < 9 && (
              <label className="no-print border-2 border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer max-w-[210px] w-full h-[180px] active:scale-95 shadow-inner">
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => onUploadAdjunto(e, 'PROPUESTO')} />
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <Plus className="text-blue-600 animate-pulse" size={24} />
                </div>
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider text-center">Subir Etiqueta #{sistemasAdjuntos.length + 1}</span>
                {uploadLoading && <Loader2 className="animate-spin text-blue-600 mt-2" size={16} />}
              </label>
            )}

            {/* Placeholder estético si está vacío en lectura */}
            {!canEditProposed && sistemasAdjuntos.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-300 font-bold uppercase opacity-30 select-none border-2 border-dashed border-gray-100 p-10 rounded-xl">
                No se han cargado evidencias o muestras de etiquetas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📄 PÁGINA 3 de 4: ESPACIO ADICIONAL PARA ETIQUETAS (queda vacío si no hay más) */}
      <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl w-full font-serif shadow-2xl overflow-hidden print:mb-0 print:shadow-none print:bg-white print:break-after-page">
        <PageHeader pageNum={3} />
        <div className="p-6 min-h-[600px]">
          <div className="text-center mb-6 border-b border-black pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Etiquetas Técnicas Resultantes (Continuación)</h3>
            <p className="text-[8px] text-gray-500 italic mt-0.5 uppercase tracking-tighter">Espacio para etiquetas adicionales del circuito</p>
          </div>
        </div>
      </div>

      {/* 📄 PÁGINA 4 de 4: CAMBIO SOLICITADO Y PANEL DE FIRMAS / TRAZABILIDAD */}
      <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl w-full font-serif shadow-2xl overflow-hidden print:mb-0 print:shadow-none print:bg-white">
        <PageHeader pageNum={4} />

        {/* Espaciador solo-impresión: empuja Cambio Solicitado + firmas al pie de la
            hoja (margen inferior), como en el formulario oficial. */}
        <div className="hidden print:block print:flex-1" aria-hidden="true" />

        {/* (Se quitó el "Formato Propuesto": las etiquetas se cargan en la grilla
            "Etiquetas Técnicas Resultantes" de la página anterior.) */}

        {/* Cambio Solicitado Box */}
        <div className="border-b-[2px] border-black p-3 flex flex-col bg-white">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-700">Cambio Solicitado (Breve Descripción):</span>
          <div className="text-[10px] p-2 font-bold italic text-gray-700 bg-gray-50 border border-gray-200 min-h-[50px] mt-1 select-all">
            {data.cambioSolicitado || 'No se detallaron observaciones descriptivas adicionales en el circuito.'}
          </div>
        </div>

        {/* Panel de Firmas y Trazabilidad */}
        <div className="grid grid-cols-3 text-[7.5px] font-bold">
          
          {/* Sistemas Column */}
          <div className="border-r-[2px] border-black flex flex-col justify-between p-3 min-h-[140px] bg-white">
            <div className="text-center border-b border-black pb-1.5 uppercase tracking-wide font-black text-gray-800">Departamento de Sistemas</div>
            <div className="flex flex-col items-center justify-center py-2 flex-1">
              {sistemasFirma ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="font-serif italic text-base text-blue-900 border-b border-blue-200 px-4 select-none transform rotate-[-2deg] font-black py-0.5">{sistemasFirma.user}</div>
                  <div className="text-[7px] text-blue-500 uppercase tracking-widest mt-1 font-bold">Firma Digital Verificada</div>
                </div>
              ) : (
                <div className="h-6 flex items-center justify-center text-gray-300 italic uppercase tracking-wider">Pendiente de Firma</div>
              )}
            </div>
            <div className="border-t border-black/35 pt-1.5">
              <div className="text-gray-500">Fecha: {sistemasFirma ? new Date(sistemasFirma.date).toLocaleDateString() : '____/____/______'}</div>
              <div className="flex gap-3 mt-1.5">
                <Checkbox label="Aprobado" checked={!!sistemasFirma} />
                <Checkbox label="Parcialmente" checked={false} />
                <Checkbox label="Desaprobado" checked={false} />
              </div>
            </div>
          </div>

          {/* Calidad Column 1: Chequeo con formato propuesto */}
          <div className="border-r-[2px] border-black flex flex-col justify-between p-3 min-h-[140px] bg-white">
            <div className="text-center border-b border-black pb-1.5 uppercase tracking-wide font-black text-gray-800">Departamento de Calidad<br/><span className="text-[6.5px] font-bold text-gray-500">Chequeo con formato propuesto</span></div>
            <div className="flex flex-col items-center justify-center py-2 flex-1">
              {calidadFirma ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="font-serif italic text-base text-green-900 border-b border-green-200 px-4 select-none transform rotate-[-2deg] font-black py-0.5">{calidadFirma.user}</div>
                  <div className="text-[7px] text-green-500 uppercase tracking-widest mt-1 font-bold">Firma Digital Verificada</div>
                </div>
              ) : (
                <div className="h-6 flex items-center justify-center text-gray-300 italic uppercase tracking-wider">Pendiente de Firma</div>
              )}
            </div>
            <div className="border-t border-black/35 pt-1.5">
              <div className="text-gray-500">Fecha: {calidadFirma ? new Date(calidadFirma.date).toLocaleDateString() : '____/____/______'}</div>
              <div className="flex gap-3 mt-1.5">
                <Checkbox label="Aprobado" checked={!!calidadFirma} />
                <Checkbox label="Parcialmente" checked={false} />
                <Checkbox label="Desaprobado" checked={false} />
              </div>
            </div>
          </div>

          {/* Calidad Column 2: Chequeo en punto de impresión */}
          <div className="flex flex-col justify-between p-3 min-h-[140px] bg-white">
            <div className="text-center border-b border-black pb-1.5 uppercase tracking-wide font-black text-gray-800">Departamento de Calidad<br/><span className="text-[6.5px] font-bold text-gray-500">Chequeo en punto de impresión</span></div>
            <div className="flex flex-col items-center justify-center py-2 flex-1">
              {calidadFirma ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="font-serif italic text-base text-green-900 border-b border-green-200 px-4 select-none transform rotate-[-2deg] font-black py-0.5">{calidadFirma.user}</div>
                  <div className="text-[7px] text-green-500 uppercase tracking-widest mt-1 font-bold">Firma Digital Verificada</div>
                </div>
              ) : (
                <div className="h-6 flex items-center justify-center text-gray-300 italic uppercase tracking-wider">Pendiente de Firma</div>
              )}
            </div>
            <div className="border-t border-black/35 pt-1.5">
              <div className="text-gray-500">Fecha: {calidadFirma ? new Date(calidadFirma.date).toLocaleDateString() : '____/____/______'}</div>
              <div className="flex gap-3 mt-1.5">
                <Checkbox label="Aprobado" checked={!!calidadFirma} />
                <Checkbox label="Parcialmente" checked={false} />
                <Checkbox label="Desaprobado" checked={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (Corresponde a Solicitud) */}
        <div className="border-t border-black bg-gray-50 p-2.5 flex justify-between items-center text-[7.5px] font-bold">
          <div className="flex gap-2 items-center">
            <span>Corresponde a Solicitud:</span>
            <span className="uppercase font-black text-gray-800">{data.correspondeSolicitud || `REG-SIS-011 (#${solicitudId ? solicitudId.substring(0, 8) : 'S/D'})`}</span>
          </div>
          <div className="text-gray-400 uppercase italic">Formulario digital controlado por el área de Calidad e Inocuidad</div>
        </div>
      </div>
      
    </div>
  );
};

export default REG007PaperForm;
