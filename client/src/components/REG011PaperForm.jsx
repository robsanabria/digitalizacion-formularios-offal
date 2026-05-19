import React from 'react';
import { Check } from 'lucide-react';

const REG011PaperForm = ({ data, onChange, readOnly = false }) => {
  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  const selectedMotivos = parseArray(data.motivo);
  const selectedImpresoras = parseArray(data.impresoras);

  const toggleOption = (field, option) => {
    if (readOnly) return;
    const current = parseArray(data[field]);
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
        {(field === 'motivo' ? selectedMotivos : selectedImpresoras).includes(option) && <Check size={16} strokeWidth={3} className="text-black" />}
      </div>
      <span className="text-xs font-bold uppercase">{label}</span>
    </div>
  );

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
          {readOnly ? (
            <span className="flex-1 border-b border-black/20 px-2">{data.fechaSolicitud ? new Date(data.fechaSolicitud).toLocaleDateString() : ''}</span>
          ) : (
            <input 
              type="date" 
              className="flex-1 bg-blue-50/50 outline-none px-1" 
              value={data.fechaSolicitud || ''} 
              onChange={e => onChange('fechaSolicitud', e.target.value)}
            />
          )}
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
      <div className="p-2 min-h-[100px]">
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

      {/* Footer / Signatures Area */}
      <div className="flex border-t-[3px] border-black h-24">
        <div className="w-2/3 border-r-[2px] border-black flex flex-col p-1">
          <div className="text-[9px] font-bold">SOLICITANTE:</div>
          <div className="flex-1 flex items-end">
            <div className="w-1/2 border-r border-black/20 text-[8px] p-1">Firma y Aclaración de Personal de calidad</div>
            <div className="w-1/2 text-[8px] p-1">Firma y Aclaración de Personal de Insumos</div>
          </div>
        </div>
        <div className="w-1/3 flex flex-col p-1">
          <div className="text-[9px] font-bold">SISTEMAS:</div>
          <div className="flex-1 flex flex-col justify-end">
             <div className="text-[8px] p-1">Firma y Aclaración del receptor</div>
             <div className="text-[8px] p-1">Fecha:</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default REG011PaperForm;
