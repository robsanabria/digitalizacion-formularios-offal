import React, { useState, useEffect } from 'react';
import axios from 'axios';
import REG011PaperForm from './components/REG011PaperForm';
import REG007PaperForm from './components/REG007PaperForm';

/**
 * Página interna que renderiza un único documento (REG-SIS-011 / REG-SIS-007) a
 * pantalla completa, para que Puppeteer la convierta en PDF. Se sirve en
 * /print/:id?doc=REG007|REG011&k=<token>. El token permite leer datos e imágenes
 * a través del bypass de impresión del backend.
 */
export default function PrintView() {
  const [data, setData] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ready, setReady] = useState(false);

  const id = window.location.pathname.split('/print/')[1]?.split(/[/?]/)[0] || '';
  const params = new URLSearchParams(window.location.search);
  const doc = params.get('doc') === 'REG007' ? 'REG007' : 'REG011';
  const k = params.get('k') || '';
  const q = k ? `?k=${encodeURIComponent(k)}` : '';

  useEffect(() => {
    const load = async () => {
      try {
        const [sol, adj, hist] = await Promise.all([
          axios.get(`/api/solicitudes/${id}${q}`),
          axios.get(`/api/solicitudes/${id}/adjuntos${q}`),
          axios.get(`/api/solicitudes/${id}/historial${q}`).catch(() => ({ data: [] })),
        ]);
        const r = sol.data;
        setData({
          solicitudId: r.SolicitudId,
          fechaSolicitud: r.FechaSolicitud || r.FechaCreacion,
          sectorSolicitante: r.SectorSolicitante,
          motivo: r.Motivo,
          nombreProducto: r.NombreProducto,
          codigoProducto: r.CodigoProducto,
          destino: r.Destino,
          vidaUtil: r.VidaUtil,
          codigoSenasa: r.CodigoSenasa,
          impresoras: r.Impresoras,
          tipoEtiqueta: r.TipoEtiqueta,
          tara: r.Tara,
          pesoMinimo: r.PesoMinimo,
          pesoMaximo: r.PesoMaximo,
          pesoEstandar: r.PesoEstandar,
          numCaja: r.NumCaja,
          faja: r.Faja,
          codigoExterno: r.CodigoExterno,
          comentariosSolicitante: r.ComentariosSolicitante,
          cambioSolicitado: r.CambioSolicitado,
          estado: r.Estado,
          codigoTwins: r.CodigoTwins,
          correspondeSolicitud: r.CorrespondeSolicitud,
          solicitanteNombre: r.SolicitanteNombre,
          rolSolicitante: r.RolSolicitante,
          fechaCreacion: r.FechaCreacion,
        });
        setAdjuntos(adj.data || []);
        setHistorial(hist.data || []);
      } catch (e) {
        console.error('PrintView load error', e);
        setData({}); // marcar listo igual para no colgar a Puppeteer
      }
    };
    if (id) load(); else setData({});
  }, [id]);

  // Esperar a que las imágenes terminen de cargar y recién marcar #print-ready
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map(img => (img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; }))));
      setReady(true);
    }, 250);
    return () => clearTimeout(t);
  }, [data, adjuntos]);

  if (!data) return <div style={{ padding: 20, fontFamily: 'sans-serif' }}>Generando documento…</div>;

  const FormCmp = doc === 'REG007' ? REG007PaperForm : REG011PaperForm;

  return (
    <div className="bg-white" id="paper-form-container">
      <FormCmp
        solicitudId={id}
        data={data}
        readOnly={true}
        adjuntos={adjuntos}
        historial={historial}
        printToken={k}
      />
      {ready && <div id="print-ready" />}
    </div>
  );
}
