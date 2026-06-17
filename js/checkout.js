// ── CHECKOUT — Aventura Pro Shop ──────────────────────────────────────────────
// Requiere: precios.js (window.getPrecio), js/toast.js (mostrarToast)

// ── #12 TIPO_LABELS — fuente única, elimina duplicación ───────────────────────
const TIPO_LABELS = {
  ski:            "Ski",
  snow:           "Snowboard",
  solo_ski:       "Solo Esquí",
  solo_snow:      "Solo Snowboard",
  solo_bota_ski:  "Bota Ski",
  solo_bota_snow: "Bota Snowboard",
};
function tipoLabel(tipo) { return TIPO_LABELS[tipo] || ""; }

// ── #6 ESCAPE DE ATRIBUTOS HTML — evita XSS en innerHTML ─────────────────────
function escAttr(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatearPrecio(num) { return Number(num).toLocaleString("es-AR"); }

// ── #3 DÍAS POR MES — evita seleccionar 31 de Febrero ────────────────────────
function getDiasEnMes(anio, mes) {
  if (!anio || !mes) return 31;
  return new Date(parseInt(anio), parseInt(mes), 0).getDate();
}

function calcularDiasEsq(inicio, fin) {
  if (!inicio || !fin) return 0;
  const d = Math.ceil((new Date(fin) - new Date(inicio)) / 86400000) + 1;
  return d > 0 ? d : 0;
}

// ── LEER DATOS PRE-CARGADOS DEL HOME ─────────────────────────────────────────
function initFechasCheckout() {
  localStorage.removeItem("reservaConfirmada");
  const desdeHome = sessionStorage.getItem("desdeHome");
  if (!desdeHome) {
    localStorage.removeItem("fechaLlegada");
    localStorage.removeItem("fechaSalida");
    localStorage.removeItem("cantPersonas");
  }
  sessionStorage.removeItem("desdeHome");
  window._fechaInicioPrecargada  = localStorage.getItem("fechaLlegada") || "";
  window._fechaFinPrecargada     = localStorage.getItem("fechaSalida")  || "";
  window._cantPersonasPrecargada = localStorage.getItem("cantPersonas") || "1";
  window._tipoPreseleccionado    = localStorage.getItem("tipoPreseleccionado") || "";
  localStorage.removeItem("tipoPreseleccionado");
}

// ── SELECTORES DE FECHA PERSONALIZADOS ───────────────────────────────────────
function generarSelectsFecha(idx, campo, valorActual) {
  const hoy   = new Date();
  const partes = valorActual ? valorActual.split("-") : ["", "", ""];
  const anioSel = partes[0] || "";
  const mesSel  = partes[1] || "";
  const diaSel  = partes[2] || "";

  const anios = [hoy.getFullYear(), hoy.getFullYear() + 1];
  const meses = [
    ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],
    ["05","Mayo"],["06","Junio"],["07","Julio"],["08","Agosto"],
    ["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"],
  ];

  // #3: días dinámicos según mes y año seleccionados
  const maxDias = getDiasEnMes(anioSel, mesSel);
  const dias = Array.from({ length: maxDias }, (_, i) => String(i + 1).padStart(2, "0"));

  const optsAnio = `<option value="">Año</option>` +
    anios.map(a => `<option value="${a}" ${anioSel == a ? "selected" : ""}>${a}</option>`).join("");

  const optsMes = `<option value="">Mes</option>` +
    meses.map(([v, l]) => `<option value="${v}" ${mesSel === v ? "selected" : ""}>${l}</option>`).join("");

  const optsDia = `<option value="">Día</option>` +
    dias.map(d => `<option value="${d}" ${diaSel === d ? "selected" : ""}>${parseInt(d)}</option>`).join("");

  const pickerId = `date-picker-${idx}-${campo}`;

  return `
    <div class="fecha-selects-wrapper">
      <div class="fecha-selects">
        <select id="sel-${idx}-${campo}-dia" class="fecha-select"
          onchange="actualizarFechaSelect(${idx}, '${campo}', 'dia', this.value)">
          ${optsDia}
        </select>
        <select id="sel-${idx}-${campo}-mes" class="fecha-select"
          onchange="actualizarFechaSelect(${idx}, '${campo}', 'mes', this.value)">
          ${optsMes}
        </select>
        <select id="sel-${idx}-${campo}-anio" class="fecha-select"
          onchange="actualizarFechaSelect(${idx}, '${campo}', 'anio', this.value)">
          ${optsAnio}
        </select>
        <button type="button" class="fecha-cal-btn"
          onclick="document.getElementById('${pickerId}').showPicker()"
          aria-label="Abrir calendario">📅</button>
      </div>
      <input type="date" id="${pickerId}" value="${escAttr(valorActual)}"
        style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;"
        onchange="sincronizarDesdePicker(${idx}, '${campo}', this.value)" />
    </div>
  `;
}

// ── GENERADOR DE RECOMENDACIÓN DE MEDIDAS ────────────────────────────────────
function generarRecomendacion(esq) {
  const h = parseInt(esq.altura) || 0;
  const b = parseInt(esq.talleBota) || 0;
  const esNino = esq.edad === "nino";
  const nivel  = esq.nivel || "principiante";
  const F_SKI  = { principiante:{min:.84,max:.90,nota:"más corto, fácil de manejar"}, intermedio:{min:.90,max:.95,nota:"longitud estándar"}, avanzado:{min:.95,max:1.00,nota:"más largo, mayor velocidad"} };
  const F_SNOW = { principiante:{min:.82,max:.86,nota:"tabla corta, más maniobrable"}, intermedio:{min:.86,max:.90,nota:"longitud estándar"}, avanzado:{min:.90,max:.94,nota:"más largo, mayor estabilidad"} };
  const F_BAST = { principiante:{min:.64,max:.66}, intermedio:{min:.66,max:.68}, avanzado:{min:.66,max:.68} };
  const FLEX   = { principiante:"Flex suave (60–80)", intermedio:"Flex medio (80–100)", avanzado:"Flex duro (100+)" };
  const NIVEL_LABELS = { principiante:"Principiante", intermedio:"Intermedio", avanzado:"Avanzado" };
  let titulo = "", items = [];

  if (esq.tipo === "ski" || esq.tipo === "solo_ski") {
    const f = esNino ? {min:.84,max:.90,nota:"para niños"} : F_SKI[nivel];
    const ski  = h ? `${Math.round(h*f.min)}–${Math.round(h*f.max)} cm` : "—";
    const bast = h ? `${Math.round(h*F_BAST[nivel].min)}–${Math.round(h*F_BAST[nivel].max)} cm` : "—";
    titulo = "Recomendación para esquí";
    items = [
      { label:"Longitud esquí", valor:ski, nota:f.nota },
      ...(esq.tipo === "ski" ? [{ label:"Bastones", valor:bast, nota:"" }] : []),
      { label:"Bota", valor:b ? `EU ${b}` : "—", nota:"" },
      ...(esNino && esq.tipo === "ski" ? [{ label:"Casco", valor:"incluido en el pack", nota:"" }] : []),
    ];
  } else if (esq.tipo === "snow" || esq.tipo === "solo_snow") {
    const f = esNino ? {min:.80,max:.85,nota:"para niños"} : F_SNOW[nivel];
    const tabla = h ? `${Math.round(h*f.min)}–${Math.round(h*f.max)} cm` : "—";
    titulo = "Recomendación para snowboard";
    items = [
      { label:"Longitud tabla", valor:tabla, nota:f.nota },
      { label:"Bota snowboard", valor:b ? `EU ${b}` : "—", nota:"" },
      ...(esNino && esq.tipo === "snow" ? [{ label:"Casco", valor:"incluido en el pack", nota:"" }] : []),
    ];
  } else if (esq.tipo === "solo_bota_ski" || esq.tipo === "solo_bota_snow") {
    titulo = "Recomendación para bota";
    items = [
      { label:"Talle bota",       valor:b ? `EU ${b}` : "—", nota:"" },
      { label:"Flex recomendado", valor:FLEX[nivel], nota:"" },
      { label:"Disponible",       valor:"EU 36 al 44", nota:"" },
    ];
  }

  if (!titulo) return "";
  const filas = items.map(d => `
    <div class="esq-recomendacion-item">
      <span class="esq-recomendacion-label">${d.label}</span>
      <span class="esq-recomendacion-valor">${d.valor}</span>
      ${d.nota ? `<span class="esq-recomendacion-nota">· ${d.nota}</span>` : ""}
    </div>`).join("");
  return `
    <div class="esq-recomendacion">
      <div class="esq-recomendacion-titulo">
        ${titulo}
        <span class="esq-recomendacion-tag">${NIVEL_LABELS[nivel]}</span>
      </div>
      <div class="esq-recomendacion-items">${filas}</div>
    </div>`;
}

// ── CÁLCULO DE PRECIO POR ESQUIADOR ──────────────────────────────────────────
function precioEsquiador(esq) {
  const d = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin) || 1;
  const esNino = esq.edad === "nino";
  const getPrecioLocal = window.getPrecio ?? (() => 0);
  let total = 0;
  if (esq.tipo === "ski")                total += getPrecioLocal(esNino ? "ski_junior"       : "ski_adulto",       d);
  else if (esq.tipo === "snow")          total += getPrecioLocal(esNino ? "snow_junior"      : "snow_adulto",      d);
  else if (esq.tipo === "solo_ski")      total += getPrecioLocal(esNino ? "solo_ski_junior"  : "solo_ski_adulto",  d);
  else if (esq.tipo === "solo_snow")     total += getPrecioLocal(esNino ? "solo_snow_junior" : "solo_snow_adulto", d);
  else if (esq.tipo === "solo_bota_ski") total += getPrecioLocal("solo_bota_ski",  d);
  else if (esq.tipo === "solo_bota_snow")total += getPrecioLocal("solo_bota_snow", d);
  const cascoIncluido = esNino && (esq.tipo === "ski" || esq.tipo === "snow");
  if (esq.casco && !cascoIncluido) total += getPrecioLocal("casco", d);
  if (esq.antiparras)    total += getPrecioLocal("antiparras", d);
  if (esq.guantes)       total += getPrecioLocal("guantes", d);
  if (esq.botas_preski)  total += getPrecioLocal("botas_preski", d);
  if (esq.campera)       total += getPrecioLocal(esNino ? "campera_nino" : "campera_adulto", d);
  if (esq.pantalon_adulto) total += getPrecioLocal("pantalon_adulto", d);
  if (esq.pantalon_nino)   total += getPrecioLocal("pantalon_nino", d);
  if (esq.combo_adulto)    total += getPrecioLocal("combo_adulto", d);
  if (esq.combo_nino)      total += getPrecioLocal("combo_nino", d);
  return total;
}

// ── INIT PRINCIPAL DEL CHECKOUT ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const listaEsquiadores = document.getElementById("listaEsquiadores");
  if (!listaEsquiadores) return;

  initFechasCheckout();

  // Banner de fechas pre-cargadas desde el home
  const resumenFechas = document.getElementById("checkoutFechasResumen");
  const textoFechas   = document.getElementById("checkoutFechasTexto");
  if (resumenFechas && textoFechas) {
    const llegada  = window._fechaInicioPrecargada;
    const salida   = window._fechaFinPrecargada;
    const personas = window._cantPersonasPrecargada;
    if (llegada && salida) {
      const ini  = new Date(llegada + "T00:00:00");
      const fin  = new Date(salida  + "T00:00:00");
      const dias = Math.ceil((fin - ini) / 86400000) + 1;
      const fmt  = d => d.toLocaleDateString("es-AR", { day:"numeric", month:"long" });
      textoFechas.textContent = `${fmt(ini)} al ${fmt(fin)} · ${dias} día${dias > 1 ? "s" : ""} · ${personas} persona${personas > 1 ? "s" : ""}`;
      resumenFechas.style.display = "flex";
    }
  }

  const getPrecioLocal = window.getPrecio ?? (() => 0);

  const fechaInicioDefault  = window._fechaInicioPrecargada  || "";
  const fechaFinDefault     = window._fechaFinPrecargada     || "";
  const cantPersonasDefault = parseInt(window._cantPersonasPrecargada || "1", 10);

  let cantEsq = Math.min(cantPersonasDefault, 10) || 1;
  const numEsqEl = document.getElementById("numEsq");
  if (numEsqEl) numEsqEl.textContent = cantEsq;

  let esquiadores = [];

  function esquiadorDefault() {
    return {
      nombre: "", edad: "adulto", nivel: "principiante",
      tipo: window._tipoPreseleccionado || "",
      altura: "", talleBota: "",
      fecha_inicio: fechaInicioDefault,
      fecha_fin:    fechaFinDefault,
      casco: false, talleCasco: "M",
      antiparras: false, talleAntiparras: "M",
      guantes: false, talleGuantes: "M",
      botas_preski: false,
      campera: false, talleCampera: "M",
      pantalon_adulto: false, tallePantalon: "M",
      combo_adulto: false,
      pantalon_nino: false, tallePantalon_nino: "4",
      combo_nino: false,
    };
  }

  document.getElementById("btnMasEsq")?.addEventListener("click", () => {
    if (cantEsq < 10) { cantEsq++; document.getElementById("numEsq").textContent = cantEsq; renderEsquiadores(); }
  });
  document.getElementById("btnMenosEsq")?.addEventListener("click", () => {
    if (cantEsq > 1) { cantEsq--; document.getElementById("numEsq").textContent = cantEsq; renderEsquiadores(); }
  });

  // ── RENDER TARJETAS DE ESQUIADORES ─────────────────────────────────────────
  function renderEsquiadores() {
    while (esquiadores.length < cantEsq) esquiadores.push(esquiadorDefault());
    while (esquiadores.length > cantEsq) esquiadores.pop();
    listaEsquiadores.innerHTML = "";

    esquiadores.forEach((esq, i) => {
      const diasEsq = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin);
      const esNino  = esq.edad === "nino";
      const div = document.createElement("div");
      div.classList.add("esquiador-card");

      // #12 usa tipoLabel() en lugar del ternario encadenado
      const badgeLabel = esq.tipo ? ` · ${tipoLabel(esq.tipo)}` : "";

      div.innerHTML = `
        <div class="esquiador-header">
          <div class="esq-num">${i + 1}</div>
          <span class="esq-titulo">Esquiador ${i + 1}</span>
          <span class="esq-badge">${esq.edad === "adulto" ? "Adulto" : "Niño"}${badgeLabel}</span>
        </div>
        <div class="checkout-grid checkout-grid--mb">
          <div class="campo">
            <label>Nombre (opcional)</label>
            <input type="text" value="${escAttr(esq.nombre)}" placeholder="Ej: Juan"
              onchange="actualizarEsq(${i}, 'nombre', this.value)" />
          </div>
          <div class="campo">
            <label>Edad</label>
            <select onchange="actualizarEsq(${i}, 'edad', this.value)">
              <option value="adulto" ${esq.edad === "adulto" ? "selected" : ""}>Adulto (12+ años)</option>
              <option value="nino"   ${esq.edad === "nino"   ? "selected" : ""}>Niño (hasta 12 años)</option>
            </select>
          </div>
        </div>
        <div class="tipo-toggle">
          <button type="button" class="tipo-btn ${esq.tipo === ""               ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', '')">Sin equipo</button>
          <button type="button" class="tipo-btn ${esq.tipo === "ski"            ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'ski')">Ski completo</button>
          <button type="button" class="tipo-btn ${esq.tipo === "snow"           ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'snow')">Snowboard completo</button>
          <button type="button" class="tipo-btn ${esq.tipo === "solo_ski"       ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'solo_ski')">Solo Esquí</button>
          <button type="button" class="tipo-btn ${esq.tipo === "solo_snow"      ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'solo_snow')">Solo Snowboard</button>
          <button type="button" class="tipo-btn ${esq.tipo === "solo_bota_ski"  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'solo_bota_ski')">Bota Ski</button>
          <button type="button" class="tipo-btn ${esq.tipo === "solo_bota_snow" ? "activo" : ""}" onclick="actualizarEsq(${i}, 'tipo', 'solo_bota_snow')">Bota Snowboard</button>
        </div>
        <div class="nivel-section">Nivel de experiencia</div>
        <div class="nivel-toggle">
          <button type="button" class="nivel-btn ${esq.nivel === 'principiante' ? 'activo' : ''}" onclick="actualizarEsq(${i}, 'nivel', 'principiante')">Principiante</button>
          <button type="button" class="nivel-btn ${esq.nivel === 'intermedio'   ? 'activo' : ''}" onclick="actualizarEsq(${i}, 'nivel', 'intermedio')">Intermedio</button>
          <button type="button" class="nivel-btn ${esq.nivel === 'avanzado'     ? 'activo' : ''}" onclick="actualizarEsq(${i}, 'nivel', 'avanzado')">Avanzado</button>
        </div>
        <div class="checkout-grid checkout-grid--my">
          <div class="campo">
            <label>Altura (cm)</label>
            <select onchange="actualizarEsq(${i}, 'altura', this.value)">
              <option value="">Seleccioná</option>
              ${(esNino
                ? [60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140]
                : [140,145,150,155,160,165,170,175,180,185,190]
              ).map(h => `<option value="${h}" ${esq.altura == h ? "selected" : ""}>${h} cm</option>`).join("")}
            </select>
          </div>
          <div class="campo">
            <label>Talle bota AR</label>
            <select onchange="actualizarEsq(${i}, 'talleBota', this.value)">
              <option value="">Seleccioná</option>
              ${(esNino
                ? [26,27,28,29,30,31,32,33,34,35,36,37,38]
                : [36,37,38,39,40,41,42,43,44,45,46,47,48]
              ).map(t => `<option value="${t}" ${esq.talleBota == t ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="esq-section">Fechas de alquiler</div>
        <div class="checkout-grid checkout-grid--mb-sm">
          <div class="campo">
            <label>Fecha inicio</label>
            ${generarSelectsFecha(i, "fecha_inicio", esq.fecha_inicio)}
          </div>
          <div class="campo">
            <label>Fecha fin</label>
            ${generarSelectsFecha(i, "fecha_fin", esq.fecha_fin)}
          </div>
        </div>
        ${diasEsq > 0 ? `<div class="checkout-dias checkout-dias--visible"><span>📅</span><strong>${diasEsq}</strong>&nbsp;día/s de alquiler</div>` : ""}
        ${generarRecomendacion(esq)}
        <div class="esq-section">Accesorios</div>
        <div class="accesorio-row">
          <span class="acc-label">Casco</span>
          ${esNino && (esq.tipo === "ski" || esq.tipo === "snow")
            ? `<span class="acc-incluido">✅ Incluido en el pack</span>
               <select onchange="actualizarEsq(${i}, 'talleCasco', this.value)">
                 ${["S","M","L","XL"].map(t => `<option ${esq.talleCasco === t ? "selected" : ""}>${t}</option>`).join("")}
               </select>`
            : `<div class="acc-toggle">
                 <button type="button" class="${esq.casco  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'casco', true)">Sí</button>
                 <button type="button" class="${!esq.casco ? "activo" : ""}" onclick="actualizarEsq(${i}, 'casco', false)">No</button>
               </div>
               ${esq.casco ? `<select onchange="actualizarEsq(${i}, 'talleCasco', this.value)">
                 ${["S","M","L","XL"].map(t => `<option ${esq.talleCasco === t ? "selected" : ""}>${t}</option>`).join("")}
               </select>` : ""}`
          }
        </div>
        <div class="accesorio-row">
          <span class="acc-label">Antiparras</span>
          <div class="acc-toggle">
            <button type="button" class="${esq.antiparras  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'antiparras', true)">Sí</button>
            <button type="button" class="${!esq.antiparras ? "activo" : ""}" onclick="actualizarEsq(${i}, 'antiparras', false)">No</button>
          </div>
          ${esq.antiparras ? `<select onchange="actualizarEsq(${i}, 'talleAntiparras', this.value)">
            ${["S","M","L","XL"].map(t => `<option ${esq.talleAntiparras === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>` : ""}
        </div>
        <div class="accesorio-row">
          <span class="acc-label">Guantes</span>
          <div class="acc-toggle">
            <button type="button" class="${esq.guantes  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'guantes', true)">Sí</button>
            <button type="button" class="${!esq.guantes ? "activo" : ""}" onclick="actualizarEsq(${i}, 'guantes', false)">No</button>
          </div>
          ${esq.guantes ? `<select onchange="actualizarEsq(${i}, 'talleGuantes', this.value)">
            ${["S","M","L","XL"].map(t => `<option ${esq.talleGuantes === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>` : ""}
        </div>
        <div class="accesorio-row">
          <span class="acc-label">Botas Preski</span>
          <div class="acc-toggle">
            <button type="button" class="${esq.botas_preski  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'botas_preski', true)">Sí</button>
            <button type="button" class="${!esq.botas_preski ? "activo" : ""}" onclick="actualizarEsq(${i}, 'botas_preski', false)">No</button>
          </div>
        </div>
        <div class="esq-section">Indumentaria</div>
        <div class="accesorio-row">
          <span class="acc-label">Campera ${esNino ? "niño" : "adulto"}</span>
          <div class="acc-toggle">
            <button type="button" class="${esq.campera  ? "activo" : ""}" onclick="actualizarEsq(${i}, 'campera', true)">Sí</button>
            <button type="button" class="${!esq.campera ? "activo" : ""}" onclick="actualizarEsq(${i}, 'campera', false)">No</button>
          </div>
          ${esq.campera ? `<select onchange="actualizarEsq(${i}, 'talleCampera', this.value)">
            ${(esNino ? ["4","6","8","10","12","14"] : ["S","M","L","XL"]).map(t => `<option ${esq.talleCampera === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>` : ""}
        </div>
        <div class="accesorio-row">
          <span class="acc-label">Pantalón ${esNino ? "niño / Enterito" : "adulto"}</span>
          <div class="acc-toggle">
            <button type="button" class="${(esNino ? esq.pantalon_nino : esq.pantalon_adulto) ? "activo" : ""}"
              onclick="actualizarEsq(${i}, '${esNino ? "pantalon_nino" : "pantalon_adulto"}', true)">Sí</button>
            <button type="button" class="${!(esNino ? esq.pantalon_nino : esq.pantalon_adulto) ? "activo" : ""}"
              onclick="actualizarEsq(${i}, '${esNino ? "pantalon_nino" : "pantalon_adulto"}', false)">No</button>
          </div>
          ${(esNino ? esq.pantalon_nino : esq.pantalon_adulto) ? `<select onchange="actualizarEsq(${i}, '${esNino ? "tallePantalon_nino" : "tallePantalon"}', this.value)">
            ${(esNino ? ["4","6","8","10","12","14"] : ["S","M","L","XL"]).map(t => `<option ${(esNino ? esq.tallePantalon_nino : esq.tallePantalon) === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>` : ""}
        </div>
        <div class="accesorio-row">
          <span class="acc-label">Campera + Pantalón ${esNino ? "niño" : "adulto"} (combo)</span>
          <div class="acc-toggle">
            <button type="button" class="${(esNino ? esq.combo_nino : esq.combo_adulto) ? "activo" : ""}"
              onclick="actualizarEsq(${i}, '${esNino ? "combo_nino" : "combo_adulto"}', true)">Sí</button>
            <button type="button" class="${!(esNino ? esq.combo_nino : esq.combo_adulto) ? "activo" : ""}"
              onclick="actualizarEsq(${i}, '${esNino ? "combo_nino" : "combo_adulto"}', false)">No</button>
          </div>
        </div>
      `;
      listaEsquiadores.appendChild(div);
    });
    actualizarResumen();
  }

  // ── ACTUALIZAR CAMPO DE UN ESQUIADOR ────────────────────────────────────────
  window.actualizarEsq = function (i, campo, valor) {
    esquiadores[i][campo] = valor;
    renderEsquiadores();
  };

  // ── #3 ACTUALIZAR SELECT DE FECHA (sin re-render completo) ──────────────────
  window.actualizarFechaSelect = function (idx, campo, parte, valor) {
    const actual = esquiadores[idx][campo] || "--";
    const partes = actual.split("-");
    let anio = partes[0] || "";
    let mes  = partes[1] || "";
    let dia  = partes[2] || "";
    if (parte === "anio") anio = valor;
    if (parte === "mes")  mes  = valor;
    if (parte === "dia")  dia  = valor;

    // Cuando cambia mes o año, regenerar opciones de día y corregir si excede el máximo
    if (parte === "mes" || parte === "anio") {
      const maxDias  = getDiasEnMes(anio, mes);
      const diaSelect = document.getElementById(`sel-${idx}-${campo}-dia`);
      if (diaSelect) {
        const diaActual = diaSelect.value;
        diaSelect.innerHTML = `<option value="">Día</option>` +
          Array.from({ length: maxDias }, (_, k) => {
            const d = String(k + 1).padStart(2, "0");
            return `<option value="${d}" ${d === diaActual ? "selected" : ""}>${k + 1}</option>`;
          }).join("");
        if (parseInt(diaActual) > maxDias) dia = "";
      }
    }

    esquiadores[idx][campo] = (anio || mes || dia) ? `${anio}-${mes}-${dia}` : "";
    actualizarResumen();
  };

  window.sincronizarDesdePicker = function (idx, campo, valor) {
    if (!valor) return;
    esquiadores[idx][campo] = valor;
    renderEsquiadores();
  };

  window.actualizarFechasGlobales = function (ini, fin) {
    esquiadores.forEach(esq => {
      if (ini) esq.fecha_inicio = ini;
      if (fin) esq.fecha_fin    = fin;
    });
    renderEsquiadores();
  };

  // ── RESUMEN LATERAL ─────────────────────────────────────────────────────────
  function actualizarResumen() {
    const resumenLista   = document.getElementById("resumenLista");
    const totalDiaEl     = document.getElementById("totalDia");
    const totalReservaEl = document.getElementById("totalReserva");
    if (!resumenLista) return;
    resumenLista.innerHTML = "";
    let totalGeneral = 0;

    esquiadores.forEach((esq, i) => {
      const esNino = esq.edad === "nino";
      const d = calcularDiasEsq(esq.fecha_inicio, esq.fecha_fin) || 1;
      totalGeneral += precioEsquiador(esq);

      const grupo = document.createElement("div");
      grupo.classList.add("resumen-grupo");
      const titulo = document.createElement("div");
      titulo.classList.add("resumen-grupo-titulo");
      // #12: usa tipoLabel()
      const tLabel = esq.tipo ? ` · ${tipoLabel(esq.tipo)}` : "";
      const nivel  = esq.nivel ? esq.nivel.charAt(0).toUpperCase() + esq.nivel.slice(1) : "";
      titulo.textContent = `${esq.nombre || `Esquiador ${i + 1}`} — ${esq.edad === "adulto" ? "Adulto" : "Niño"}${tLabel} · ${nivel} · ${d} día/s`;
      grupo.appendChild(titulo);

      const items = [];
      let packKey = "", packLabel = "";
      if (esq.tipo === "ski")               { packKey = esNino ? "ski_junior"       : "ski_adulto";       packLabel = esNino ? "Pack Ski Junior"       : "Pack Ski Adulto"; }
      else if (esq.tipo === "snow")         { packKey = esNino ? "snow_junior"      : "snow_adulto";      packLabel = esNino ? "Pack Snowboard Junior" : "Pack Snowboard Adulto"; }
      else if (esq.tipo === "solo_ski")     { packKey = esNino ? "solo_ski_junior"  : "solo_ski_adulto";  packLabel = esNino ? "Solo Esquí Junior"     : "Solo Esquí Adulto"; }
      else if (esq.tipo === "solo_snow")    { packKey = esNino ? "solo_snow_junior" : "solo_snow_adulto"; packLabel = esNino ? "Solo Snowboard Junior" : "Solo Snowboard Adulto"; }
      else if (esq.tipo === "solo_bota_ski")  { packKey = "solo_bota_ski";  packLabel = "Solo Bota de Ski"; }
      else if (esq.tipo === "solo_bota_snow") { packKey = "solo_bota_snow"; packLabel = "Solo Bota de Snowboard"; }
      if (packKey) items.push([packLabel, getPrecioLocal(packKey, d)]);

      const cascoIncluido = esNino && (esq.tipo === "ski" || esq.tipo === "snow");
      if (cascoIncluido)       items.push([`Casco talle ${esq.talleCasco} (incluido)`, 0]);
      else if (esq.casco)      items.push([`Casco talle ${esq.talleCasco}`, getPrecioLocal("casco", d)]);
      if (esq.antiparras)      items.push([`Antiparras talle ${esq.talleAntiparras}`, getPrecioLocal("antiparras", d)]);
      if (esq.guantes)         items.push([`Guantes talle ${esq.talleGuantes}`, getPrecioLocal("guantes", d)]);
      if (esq.botas_preski)    items.push(["Botas Preski", getPrecioLocal("botas_preski", d)]);
      if (esq.campera)         items.push([`Campera ${esNino ? "niño" : "adulto"} talle ${esq.talleCampera}`, getPrecioLocal(esNino ? "campera_nino" : "campera_adulto", d)]);
      if (esq.pantalon_adulto) items.push([`Pantalón adulto talle ${esq.tallePantalon}`, getPrecioLocal("pantalon_adulto", d)]);
      if (esq.pantalon_nino)   items.push([`Pantalón/Enterito niño talle ${esq.tallePantalon_nino}`, getPrecioLocal("pantalon_nino", d)]);
      if (esq.combo_adulto)    items.push(["Campera + Pantalón adulto (combo)", getPrecioLocal("combo_adulto", d)]);
      if (esq.combo_nino)      items.push(["Campera + Pantalón niño (combo)", getPrecioLocal("combo_nino", d)]);

      items.forEach(([label, precio]) => {
        const item = document.createElement("div");
        item.classList.add("checkout-item");
        item.innerHTML = `<span class="checkout-item-info">${label}</span><span class="checkout-item-precio">$${formatearPrecio(precio)}</span>`;
        grupo.appendChild(item);
      });
      resumenLista.appendChild(grupo);
    });

    if (totalDiaEl) {
      const totalPorDia = esquiadores.reduce((acc, esq) => {
        const esNino = esq.edad === "nino";
        let packKey = "";
        if (esq.tipo === "ski")               packKey = esNino ? "ski_junior"       : "ski_adulto";
        else if (esq.tipo === "snow")         packKey = esNino ? "snow_junior"      : "snow_adulto";
        else if (esq.tipo === "solo_ski")     packKey = esNino ? "solo_ski_junior"  : "solo_ski_adulto";
        else if (esq.tipo === "solo_snow")    packKey = esNino ? "solo_snow_junior" : "solo_snow_adulto";
        else if (esq.tipo === "solo_bota_ski")  packKey = "solo_bota_ski";
        else if (esq.tipo === "solo_bota_snow") packKey = "solo_bota_snow";
        let t = packKey ? getPrecioLocal(packKey, 1) : 0;
        if (esq.casco)           t += getPrecioLocal("casco", 1);
        if (esq.antiparras)      t += getPrecioLocal("antiparras", 1);
        if (esq.guantes)         t += getPrecioLocal("guantes", 1);
        if (esq.botas_preski)    t += getPrecioLocal("botas_preski", 1);
        if (esq.campera)         t += getPrecioLocal(esq.edad === "nino" ? "campera_nino" : "campera_adulto", 1);
        if (esq.pantalon_adulto) t += getPrecioLocal("pantalon_adulto", 1);
        if (esq.pantalon_nino)   t += getPrecioLocal("pantalon_nino", 1);
        if (esq.combo_adulto)    t += getPrecioLocal("combo_adulto", 1);
        if (esq.combo_nino)      t += getPrecioLocal("combo_nino", 1);
        return acc + t;
      }, 0);
      totalDiaEl.textContent = `$${formatearPrecio(totalPorDia)}`;
    }
    if (totalReservaEl) totalReservaEl.textContent = `$${formatearPrecio(totalGeneral)}`;
  }

  // ── ENVÍO DEL FORMULARIO ────────────────────────────────────────────────────
  const formReservaCheckout = document.getElementById("formReserva");
  if (formReservaCheckout) {
    formReservaCheckout.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Privacidad
      if (!document.getElementById("checkPrivacidad")?.checked) {
        mostrarToast("Aceptá los términos y la política de privacidad para continuar.", "warning");
        return;
      }

      // #2 Al menos un esquiador con equipo
      const sinEquipo = esquiadores.every(esq => !esq.tipo);
      if (sinEquipo) {
        mostrarToast("Seleccioná al menos un equipo para continuar.", "warning");
        return;
      }

      // #4 Validar fechas completas y coherentes
      const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
      for (let i = 0; i < esquiadores.length; i++) {
        const esq = esquiadores[i];
        if (!esq.tipo) continue;
        const nombre = esq.nombre || `Esquiador ${i + 1}`;
        if (!FECHA_RE.test(esq.fecha_inicio) || !FECHA_RE.test(esq.fecha_fin)) {
          mostrarToast(`${nombre}: completá las fechas de alquiler.`, "warning");
          return;
        }
        const ini = new Date(esq.fecha_inicio + "T00:00:00");
        const fin = new Date(esq.fecha_fin    + "T00:00:00");
        if (isNaN(ini.getTime()) || isNaN(fin.getTime())) {
          mostrarToast(`${nombre}: una fecha ingresada no es válida.`, "error");
          return;
        }
        if (fin < ini) {
          mostrarToast(`${nombre}: la fecha de fin es anterior a la de inicio.`, "warning");
          return;
        }
      }

      const formData  = new FormData(this);
      const btnConfirmar = document.getElementById("btnConfirmar");
      const textoOriginalBtn = btnConfirmar.textContent;
      btnConfirmar.textContent = "Enviando...";
      btnConfirmar.disabled = true;

      try {
        const response = await fetch("https://pro-shop-aventura-production.up.railway.app/reserva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre:      formData.get("nombre"),
            email:       formData.get("email"),
            telefono:    formData.get("telefono") || "No indicado",
            dni:         formData.get("dni") || "No indicado",
            notas:       formData.get("notas") || "",
            esquiadores: esquiadores,
          }),
        });
        const data = await response.json();
        if (data.ok) {
          // #1 el número y total vienen del servidor, no se generan en el cliente
          localStorage.setItem("reservaConfirmada", JSON.stringify({
            numero:      data.numero,
            nombre:      formData.get("nombre"),
            email:       formData.get("email"),
            telefono:    formData.get("telefono") || "",
            esquiadores: cantEsq,
            total:       data.total,
          }));
          localStorage.removeItem("fechaLlegada");
          localStorage.removeItem("fechaSalida");
          localStorage.removeItem("cantPersonas");
          window.location.href = "./reserva-confirmada.html";
        } else {
          mostrarToast(data.error || "Error al enviar la reserva. Intentá de nuevo.", "error");
          btnConfirmar.textContent = textoOriginalBtn;
          btnConfirmar.disabled = false;
        }
      } catch {
        mostrarToast("No se pudo conectar con el servidor. Intentá de nuevo.", "error");
        btnConfirmar.textContent = textoOriginalBtn;
        btnConfirmar.disabled = false;
      }
    });
  }

  renderEsquiadores();
});
