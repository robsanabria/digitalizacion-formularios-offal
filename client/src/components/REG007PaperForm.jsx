import React from 'react';
import { Check } from 'lucide-react';

const REG007PaperForm = ({ data, onChange, readOnly = false, children }) => {
  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  const selectedMotivos = parseArray(data.motivo);
  const selectedImpresoras = parseArray(data.impresoras);

  const Checkbox = ({ label, checked }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 border-2 border-black flex items-center justify-center bg-white`}>
        {checked && <Check size={14} strokeWidth={3} className="text-black" />}
      </div>
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </div>
  );

  return (
    <div className="bg-white text-black p-0 border-[3px] border-black max-w-4xl mx-auto font-serif shadow-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="flex border-b-[3px] border-black">
        <div className="w-1/4 p-4 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
          <div className="font-bold text-lg leading-tight text-black">OFFAL EXP SA</div>
          <div className="text-[9px]">Establecimiento Oficial Nº 4407</div>
        </div>
        <div className="w-1/2 p-2 border-r-[3px] border-black flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold">SISTEMA DE GESTION DE CALIDAD E INOCUIDAD</div>
          <div className="text-lg font-black mt-1">MODIFICACIÓN DE ETIQUETAS</div>
        </div>
        <div className="w-1/4 flex flex-col text-[9px]">
          <div className="p-1 border-b-[2px] border-black text-center font-bold">REG-SIS-007</div>
          <div className="p-1 border-b-[2px] border-black text-center">Emisión: 08-10-2024</div>
          <div className="p-1 border-b-[2px] border-black text-center">Revisión 04-24</div>
          <div className="p-1 text-center">Página 1 de 4</div>
        </div>
      </div>

      {/* Row 1: Fecha y Solicitado por */}
      <div className="flex border-b-[2px] border-black text-xs font-bold">
        <div className="w-1/2 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Fecha de presentación:</span>
          {readOnly ? (
            <span>{data.fechaPresentacion ? new Date(data.fechaPresentacion).toLocaleDateString() : ''}</span>
          ) : (
            <input 
              type="date" 
              className="flex-1 bg-blue-50/50 outline-none px-1" 
              value={data.fechaPresentacion || ''} 
              onChange={e => onChange('fechaPresentacion', e.target.value)}
            />
          )}
        </div>
        <div className="w-1/2 p-2 flex gap-2 items-center">
          <span>Solicitado por:</span>
          <span className="flex-1 uppercase">PRODUCCION/ CALIDAD</span>
        </div>
      </div>

      {/* Row 2: Motivos */}
      <div className="flex border-b-[2px] border-black p-2 gap-4 items-center">
        <span className="text-[10px] font-bold mr-2">Motivo del cambio:</span>
        <Checkbox label="SENASA" checked={selectedMotivos.includes('SENASA')} />
        <Checkbox label="Nuevo producto" checked={selectedMotivos.includes('Nuevo producto')} />
        <Checkbox label="Modificación de existente" checked={selectedMotivos.includes('Modificación de existente')} />
        <Checkbox label="Reactivación" checked={selectedMotivos.includes('Reactivación')} />
      </div>

      {/* Row 3: Nombre Producto */}
      <div className="flex border-b-[2px] border-black text-xs font-bold p-2 gap-2 items-center">
        <span>Nombre Producto:</span>
        <span className="flex-1 uppercase font-black">{data.nombreProducto || ''}</span>
      </div>

      {/* Row 4: Destino, Twins, Senasa */}
      <div className="flex border-b-[2px] border-black text-[10px] font-bold">
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Destino:</span>
          <span className="flex-1">{data.destino || ''}</span>
        </div>
        <div className="w-1/3 p-2 border-r-[2px] border-black flex gap-2 items-center">
          <span>Código TWINS:</span>
          {readOnly ? (
             <span>{data.codigoTwins || ''}</span>
          ) : (
             <input className="flex-1 bg-blue-50/50 outline-none" value={data.codigoTwins || ''} onChange={e => onChange('codigoTwins', e.target.value)} />
          )}
        </div>
        <div className="w-1/3 p-2 flex gap-2 items-center">
          <span>Código SENASA:</span>
          <span className="flex-1">{data.codigoSenasa || ''}</span>
        </div>
      </div>

      {/* Row 5: Impresoras */}
      <div className="flex border-b-[2px] border-black text-[10px] font-bold p-2 gap-2 items-center">
        <span>Impresoras afectadas:</span>
        <span className="flex-1 uppercase">{selectedImpresoras.join(' / ')}</span>
      </div>

      {/* Large Area for Label Previews */}
      <div className="relative min-h-[500px] border-b-[2px] border-black">
        <div className="absolute top-0 left-0 h-full w-8 border-r border-black flex items-center justify-center">
          <span className="rotate-[-90deg] text-[10px] font-bold whitespace-nowrap">Formato propuesto</span>
        </div>
        <div className="ml-8 p-4 flex flex-col items-center justify-center gap-6">
          {children ? children : (
            <div className="text-gray-300 font-bold text-2xl uppercase opacity-20 select-none">Espacio para etiquetas</div>
          )}
        </div>
      </div>

      {/* Bottom info (Relation) */}
      <div className="flex text-[10px] font-bold p-2">
         <div className="flex gap-2 items-center">
            <span>Corresponde a Solicitud:</span>
            {readOnly ? (
                <span>{data.correspondeSolicitud || ''}</span>
            ) : (
                <input className="bg-blue-50/50 outline-none px-1 border-b border-black/20" value={data.correspondeSolicitud || ''} onChange={e => onChange('correspondeSolicitud', e.target.value)} />
            )}
         </div>
      </div>
    </div>
  );
};

export default REG007PaperForm;
