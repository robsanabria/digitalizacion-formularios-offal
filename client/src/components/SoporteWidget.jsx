import React, { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';

const EMAIL_SOPORTE = 'tickets@offal.com.ar';

/**
 * Widget flotante de ayuda/soporte.
 * Abre un panel donde el usuario describe el problema y, al enviar, arma un
 * correo (ticket) a soporte con el usuario y la pantalla actuales.
 * Mismo criterio que el SoporteWidget de Control de Ingreso y Truck Wash.
 */
export default function SoporteWidget({ user }) {
  const [abierto, setAbierto] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const puedeEnviar = descripcion.trim().length > 0;

  const enviar = () => {
    const asuntoTxt = asunto.trim()
      ? `[Registro de Etiquetas] ${asunto.trim()}`
      : 'Soporte — Registro de Etiquetas (REG-SIS)';
    const cuerpo =
      `${descripcion.trim()}\n\n` +
      '------------------------------\n' +
      `Enviado por: ${user?.NombreUsuario || user?.Email || '(sin identificar)'}\n` +
      `Rol: ${user?.Rol || '-'}\n` +
      `Pantalla: ${window.location.href}\n`;
    const url = `mailto:${EMAIL_SOPORTE}?subject=${encodeURIComponent(asuntoTxt)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = url;
    setAbierto(false);
    setAsunto('');
    setDescripcion('');
  };

  return (
    <div className="no-print fixed bottom-6 right-6 z-[1300] flex flex-col items-end gap-3">
      {abierto && (
        <div className="w-[300px] sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-gray-800">¿Necesitás ayuda?</h3>
            <button
              onClick={() => setAbierto(false)}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">Contanos el problema y enviamos un ticket a soporte.</p>

          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto (ej: no puedo aprobar un REG-SIS-007)"
            className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Contá qué pasó…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={enviar}
            disabled={!puedeEnviar}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            <Send size={16} /> Enviar ticket
          </button>
        </div>
      )}

      <button
        onClick={() => setAbierto((v) => !v)}
        title="Ayuda / Soporte"
        aria-label="Ayuda / Soporte"
        className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
      >
        {abierto ? <X size={26} /> : <HelpCircle size={26} />}
      </button>
    </div>
  );
}
