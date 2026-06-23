// Plantillas HTML autocontenidas para generar los PDF con Puppeteer.
// No reutilizan los componentes React: layout fijo (tamaño Legal), inline CSS,
// e imágenes embebidas como data URI. Solo varían datos/imágenes.

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const parseArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : [v]; } catch { return [v]; }
};

const chk = (on) => `<span class="chk">${on ? '<span class="x">X</span>' : ''}</span>`;
const fecha = (v) => v ? new Date(v).toLocaleDateString('es-AR') : '';

const baseCss = `
  @page { size: legal; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
  body { color: #000; }
  .doc { width: 100%; }
  .page { border: 3px solid #000; width: 100%; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .row { display: flex; border-bottom: 2px solid #000; }
  .row:last-child { border-bottom: none; }
  .cell { padding: 4px 6px; font-size: 10px; font-weight: bold; border-right: 2px solid #000; }
  .cell:last-child { border-right: none; }
  .hdr { display: flex; border-bottom: 3px solid #000; }
  .hdr .c1 { width: 25%; border-right: 3px solid #000; padding: 8px; text-align: center; }
  .hdr .c2 { width: 50%; border-right: 3px solid #000; padding: 6px; text-align: center; }
  .hdr .c3 { width: 25%; font-size: 8px; }
  .hdr .c3 > div { padding: 2px 4px; border-bottom: 1px solid #000; text-align: center; }
  .hdr .c3 > div:last-child { border-bottom: none; }
  .title { font-size: 13px; font-weight: bold; }
  .chk { display:inline-block; width:12px; height:12px; border:1px solid #000; text-align:center; line-height:11px; margin-right:4px; vertical-align:middle; }
  .chk .x { font-size: 10px; font-weight: bold; }
  .opt { margin-right: 14px; font-size: 9px; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
  .label { font-weight: bold; margin-right: 6px; }
  .val { text-transform: uppercase; }
  .area { min-height: 360px; display: flex; }
  .area .side { width: 22px; border-right: 2px solid #000; writing-mode: vertical-rl; transform: rotate(180deg); text-align:center; font-size:8px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:#555; padding:6px 0; }
  .area .body { flex: 1; padding: 10px; display: flex; align-items: center; justify-content: center; }
  .area img { max-width: 100%; max-height: 340px; object-fit: contain; border: 1px solid #999; }
  .empty { color: #ccc; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 2px dashed #ccc; padding: 30px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; padding: 12px; min-height: 560px; }
  .gcell { border: 1px solid #000; padding: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
  .gcell img { max-width: 100%; max-height: 150px; object-fit: contain; }
  .gcell .num { position: absolute; top: 2px; right: 4px; background:#000; color:#fff; font-size:8px; font-weight:bold; padding:1px 4px; }
  .gcell .name { font-size: 7px; margin-top: 4px; text-transform: uppercase; text-align:center; word-break: break-all; }
  .secTitle { text-align:center; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; padding:8px; border-bottom:1px solid #000; }
  .cambio { padding: 8px; border-bottom: 2px solid #000; }
  .cambio .box { min-height: 50px; border: 1px solid #999; background:#f7f7f7; padding:6px; font-size:10px; font-style:italic; margin-top:4px; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .firma { border-right: 2px solid #000; padding: 6px; min-height: 130px; font-size: 8px; display:flex; flex-direction:column; }
  .firma:last-child { border-right: none; }
  .firma .ft { text-align:center; font-weight:bold; text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:4px; }
  .firma .sub { font-weight: normal; font-size: 6.5px; color:#555; }
  .firma .sign { flex:1; display:flex; align-items:center; justify-content:center; }
  .firma .sign .name { font-style: italic; font-weight: bold; font-size: 13px; border-bottom: 1px solid #999; padding: 0 8px; }
  .firma .opts { display:flex; gap:8px; margin-top:4px; }
  .footer { border-top: 1px solid #000; background:#f3f3f3; padding:5px; font-size:8px; font-weight:bold; display:flex; justify-content:space-between; }
`;

function pageHeader(reg, pageNum, totalPages, emision, revision) {
  return `<div class="hdr">
    <div class="c1"><div class="title" style="font-size:14px">OFFAL EXP SA</div><div style="font-size:8px">ESTABLECIMIENTO OFICIAL Nº 4407</div></div>
    <div class="c2"><div style="font-size:9px;font-weight:bold">SISTEMA DE GESTION DE CALIDAD E INOCUIDAD</div><div class="title">MODIFICACIÓN DE ETIQUETAS</div></div>
    <div class="c3"><div style="font-weight:bold;background:#eee">${reg}</div><div>Emisión: ${emision}</div><div>Revisión ${revision}</div><div style="font-weight:bold">Página ${pageNum} de ${totalPages}</div></div>
  </div>`;
}

// ── REG-SIS-007 ────────────────────────────────────────────────────────────────
function buildReg007Html(d, originalImg, etiquetas, firmas) {
  const motivos = parseArr(d.Motivo);
  const impresoras = parseArr(d.Impresoras);
  const tipos = parseArr(d.TipoEtiqueta);
  const sis = firmas.sistemas, cal = firmas.calidad;

  const gridCells = [];
  for (let i = 0; i < Math.max(9, etiquetas.length); i++) {
    const e = etiquetas[i];
    gridCells.push(e
      ? `<div class="gcell"><span class="num">#${i + 1}</span><img src="${e.src}"/><span class="name">${esc(e.name)}</span></div>`
      : `<div class="gcell"></div>`);
  }

  const firmaBlock = (titulo, sub, f, color) => `<div class="firma">
    <div class="ft">${titulo}${sub ? `<br/><span class="sub">${sub}</span>` : ''}</div>
    <div class="sign">${f ? `<span class="name" style="color:${color}">${esc(f.user)}</span>` : ''}</div>
    <div>Fecha: ${f ? fecha(f.date) : '____/____/______'}</div>
    <div class="opts">${chk(!!f)}Aprobado ${chk(false)}Parc. ${chk(false)}Desap.</div>
  </div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body><div class="doc">
    <div class="page">
      ${pageHeader('REG-SIS-007', 1, 4, '08-10-2024', '04-24')}
      <div class="row"><div class="cell" style="width:50%"><span class="label">Fecha de presentación:</span>${esc(fecha(d.FechaPresentacion))}</div><div class="cell" style="width:50%;border-right:none"><span class="label">Solicitado por:</span><span class="val">${esc(d.SectorSolicitante || 'CALIDAD')}</span></div></div>
      <div class="row"><div class="cell" style="width:100%;border-right:none"><span class="label">Motivo del cambio:</span>
        <span class="opt">${chk(motivos.includes('SENASA'))}SENASA</span>
        <span class="opt">${chk(motivos.includes('Nuevo producto'))}Nuevo producto</span>
        <span class="opt">${chk(motivos.includes('Modificación de existente'))}Modificación de existente</span>
        <span class="opt">${chk(motivos.includes('Reactivación'))}Reactivación</span></div></div>
      <div class="row"><div class="cell" style="width:100%;border-right:none"><span class="label">Nombre Producto:</span><span class="val">${esc(d.NombreProducto)}</span></div></div>
      <div class="row"><div class="cell" style="width:34%"><span class="label">Destino:</span><span class="val">${esc(d.Destino)}</span></div><div class="cell" style="width:33%"><span class="label">Código TWINS:</span>${esc(d.CodigoTwins || d.CodigoProducto)}</div><div class="cell" style="width:33%;border-right:none"><span class="label">Código SENASA:</span>${esc(d.CodigoSenasa)}</div></div>
      <div class="row"><div class="cell" style="width:100%;border-right:none"><span class="label">Impresoras afectadas:</span><span class="val">${esc(impresoras.join(' / '))}</span></div></div>
      <div class="row"><div class="cell" style="width:100%;border-right:none"><span class="label">Tipo de etiqueta a modificar:</span><span class="val">${esc(tipos.join(' / '))}</span></div></div>
      <div class="area"><div class="side">Formato original</div><div class="body">${originalImg ? `<img src="${originalImg}"/>` : '<div class="empty">Sin archivo de referencia original</div>'}</div></div>
    </div>

    <div class="page">
      ${pageHeader('REG-SIS-007', 2, 4, '08-10-2024', '04-24')}
      <div class="secTitle">Etiquetas Técnicas Resultantes (Modificadas en Planta)</div>
      <div class="grid">${gridCells.slice(0, 9).join('')}</div>
    </div>

    <div class="page">
      ${pageHeader('REG-SIS-007', 3, 4, '08-10-2024', '04-24')}
      <div class="secTitle">Etiquetas Técnicas Resultantes (Continuación)</div>
      <div class="grid">${gridCells.slice(9, 18).length ? gridCells.slice(9, 18).join('') : Array.from({length:9}).map(()=>'<div class="gcell"></div>').join('')}</div>
    </div>

    <div class="page">
      ${pageHeader('REG-SIS-007', 4, 4, '08-10-2024', '04-24')}
      <div class="cambio"><span class="label" style="font-size:9px;text-transform:uppercase">Cambio Solicitado (Breve Descripción):</span><div class="box">${esc(d.CambioSolicitado || '')}</div></div>
      <div class="firmas">
        ${firmaBlock('Departamento de Sistemas', '', sis, '#0a3')}
        ${firmaBlock('Departamento de Calidad', 'Chequeo con formato propuesto', cal, '#080')}
        ${firmaBlock('Departamento de Calidad', 'Chequeo en punto de impresión', cal, '#080')}
      </div>
      <div class="footer"><span>Corresponde a Solicitud: ${esc(d.CorrespondeSolicitud || ('REG-SIS-011 #' + String(d.SolicitudId).slice(0,8)))}</span><span>Formulario digital controlado por el área de Calidad e Inocuidad</span></div>
    </div>
  </div></body></html>`;
}

module.exports = { buildReg007Html };
