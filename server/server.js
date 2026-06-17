// =============================================
// SERVIDOR — Aventura Pro Shop
// =============================================
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");

const app    = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// ── CORS ──────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push("http://localhost:5500", "http://127.0.0.1:5500");
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ["POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// ── RATE LIMITING ─────────────────────────────
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intentá de nuevo en 15 minutos." },
});
const limiterReserva = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de reservas alcanzado. Intentá de nuevo en 1 hora." },
});
const limiterContacto = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de mensajes alcanzado. Intentá de nuevo en 1 hora." },
});

app.use(limiterGeneral);

// ── SANITIZACIÓN ──────────────────────────────
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizar(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? escapeHtml(v.trim()) : v;
  }
  return out;
}

function formatPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

// ── #1 GENERADOR DE NÚMERO DE RESERVA ────────────────────────────────────────
function generarNumeroReserva() {
  return "RPS-" + Date.now().toString(36).toUpperCase().slice(-6);
}

// ── #5 TARIFAS SERVER-SIDE (espejo de precios.js) ────────────────────────────
const PRECIOS = {
  ski_adulto:    { 1: 55000, 3: 141000, 4: 179000, 5: 212000, 6: 241000, 7: 267000 },
  ski_junior:    { 1: 43000, 3: 110000, 4: 140000, 5: 166000, 6: 188000, 7: 208000 },
  snow_adulto:   { 1: 58000, 3: 149000, 4: 189000, 5: 224000, 6: 254000, 7: 281000 },
  snow_junior:   { 1: 44000, 3: 113000, 4: 143000, 5: 170000, 6: 193000, 7: 213000 },
  solo_ski_adulto:   { 1: 38000, 3: 97000,  4: 124000, 5: 147000, 6: 167000, 7: 185000 },
  solo_ski_junior:   { 1: 30000, 3: 77000,  4: 98000,  5: 116000, 6: 132000, 7: 146000 },
  solo_snow_adulto:  { 1: 40000, 3: 103000, 4: 131000, 5: 155000, 6: 176000, 7: 195000 },
  solo_snow_junior:  { 1: 31000, 3: 79000,  4: 101000, 5: 120000, 6: 136000, 7: 150000 },
  solo_bota_ski:     { 1: 22000, 3: 56000,  4: 72000,  5: 85000,  6: 97000,  7: 107000 },
  solo_bota_snow:    { 1: 23000, 3: 59000,  4: 75000,  5: 89000,  6: 101000, 7: 112000 },
  casco:         { 1: 19000, 3: 49000,  4: 62000,  5: 73000,  6: 83000,  7: 92000  },
  antiparras:    { 1: 14000, 3: 39000,  4: 50000,  5: 60000,  6: 68000,  7: 75000  },
  guantes:       { 1: 13000, 3: 33000,  4: 42000,  5: 50000,  6: 57000,  7: 63000  },
  botas_preski:  { 1: 15000, 3: 38000,  4: 48000,  5: 58000,  6: 65500,  7: 73000  },
  campera_adulto:  { 1: 23000, 3: 61000,  4: 78000,  5: 92000,  6: 105000, 7: 116000 },
  campera_nino:    { 1: 17000, 3: 45000,  4: 58000,  5: 69000,  6: 79000,  7: 87000  },
  pantalon_adulto: { 1: 20000, 3: 53000,  4: 68000,  5: 80000,  6: 92000,  7: 102000 },
  pantalon_nino:   { 1: 14000, 3: 38000,  4: 48000,  5: 58000,  6: 66000,  7: 74000  },
  combo_adulto:    { 1: 39000, 3: 103000, 4: 131000, 5: 156000, 6: 177000, 7: 196000 },
  combo_nino:      { 1: 29000, 3: 76000,  4: 97000,  5: 115000, 6: 131000, 7: 145000 },
};

function getPrecioSrv(key, dias) {
  const tabla = PRECIOS[key];
  if (!tabla || dias <= 0) return 0;
  if (dias === 1) return tabla[1] ?? 0;
  if (dias === 2) return (tabla[1] ?? 0) * 2;
  if (dias <= 7)  return tabla[dias] ?? (tabla[1] ?? 0) * dias;
  return tabla[7] ?? tabla[1] ?? 0;
}

function calcularDiasSrv(inicio, fin) {
  if (!inicio || !fin) return 0;
  const d = Math.ceil((new Date(fin) - new Date(inicio)) / 86400000) + 1;
  return d > 0 ? d : 0;
}

// #5: calcula el total en el servidor ignorando el valor que envió el cliente
function calcularTotalEsquiador(esq) {
  const d = calcularDiasSrv(esq.fecha_inicio, esq.fecha_fin) || 1;
  const esNino = esq.edad === "nino";
  let total = 0;
  if (esq.tipo === "ski")                total += getPrecioSrv(esNino ? "ski_junior"       : "ski_adulto",       d);
  else if (esq.tipo === "snow")          total += getPrecioSrv(esNino ? "snow_junior"      : "snow_adulto",      d);
  else if (esq.tipo === "solo_ski")      total += getPrecioSrv(esNino ? "solo_ski_junior"  : "solo_ski_adulto",  d);
  else if (esq.tipo === "solo_snow")     total += getPrecioSrv(esNino ? "solo_snow_junior" : "solo_snow_adulto", d);
  else if (esq.tipo === "solo_bota_ski") total += getPrecioSrv("solo_bota_ski",  d);
  else if (esq.tipo === "solo_bota_snow")total += getPrecioSrv("solo_bota_snow", d);
  const cascoIncluido = esNino && (esq.tipo === "ski" || esq.tipo === "snow");
  if (esq.casco && !cascoIncluido) total += getPrecioSrv("casco", d);
  if (esq.antiparras)    total += getPrecioSrv("antiparras", d);
  if (esq.guantes)       total += getPrecioSrv("guantes", d);
  if (esq.botas_preski)  total += getPrecioSrv("botas_preski", d);
  if (esq.campera)       total += getPrecioSrv(esNino ? "campera_nino" : "campera_adulto", d);
  if (esq.pantalon_adulto) total += getPrecioSrv("pantalon_adulto", d);
  if (esq.pantalon_nino)   total += getPrecioSrv("pantalon_nino", d);
  if (esq.combo_adulto)    total += getPrecioSrv("combo_adulto", d);
  if (esq.combo_nino)      total += getPrecioSrv("combo_nino", d);
  return total;
}

// ── #7 VALORES VÁLIDOS DE TIPO ────────────────────────────────────────────────
const TIPOS_VALIDOS = new Set([
  "", "ski", "snow", "solo_ski", "solo_snow", "solo_bota_ski", "solo_bota_snow",
]);

// ── RUTA RESERVA ──────────────────────────────
app.post("/reserva", limiterReserva, async (req, res) => {
  const raw = req.body;

  if (!raw.nombre || !raw.email || !Array.isArray(raw.esquiadores) || raw.esquiadores.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  // #7: validar tipo de cada esquiador
  for (const esq of raw.esquiadores) {
    if (!TIPOS_VALIDOS.has(esq.tipo ?? "")) {
      return res.status(400).json({ error: `Tipo de equipo inválido: ${esq.tipo}` });
    }
  }

  const { nombre, email, telefono, dni, notas } = sanitizar(raw);
  const { esquiadores } = raw;

  // #5: total calculado en el servidor (no se confía en el valor del cliente)
  const total_calculado = esquiadores.reduce((acc, esq) => acc + calcularTotalEsquiador(esq), 0);

  // #1: número de reserva generado en el servidor
  const numero = generarNumeroReserva();

  try {
    const detalleEsquiadores = esquiadores
      .map((esq, i) => {
        const s = sanitizar(esq);
        const esNino = s.edad === "nino";
        const TIPO_LABELS = {
          ski:            esNino ? "Pack Ski Junior"       : "Pack Ski Adulto",
          snow:           esNino ? "Pack Snowboard Junior" : "Pack Snowboard Adulto",
          solo_ski:       esNino ? "Solo Esquí Junior"     : "Solo Esquí Adulto",
          solo_snow:      esNino ? "Solo Snowboard Junior" : "Solo Snowboard Adulto",
          solo_bota_ski:  "Solo Bota de Ski",
          solo_bota_snow: "Solo Bota de Snowboard",
        };
        const items = [];
        const pack  = TIPO_LABELS[s.tipo] || "";
        if (pack) items.push(pack);
        if (s.casco)         items.push(`Casco talle ${s.talleCasco}`);
        if (s.antiparras)    items.push(`Antiparras talle ${s.talleAntiparras}`);
        if (s.guantes)       items.push(`Guantes talle ${s.talleGuantes}`);
        if (s.botas_preski)  items.push("Botas Preski");
        if (s.campera)       items.push(`Campera ${esNino ? "niño" : "adulto"} talle ${s.talleCampera}`);
        if (s.pantalon_adulto) items.push(`Pantalón adulto talle ${s.tallePantalon}`);
        if (s.pantalon_nino)   items.push(`Pantalón/Enterito niño talle ${s.tallePantalon_nino}`);
        if (s.combo_adulto)    items.push("Campera + Pantalón adulto (combo)");
        if (s.combo_nino)      items.push("Campera + Pantalón niño (combo)");
        const fechas = s.fecha_inicio && s.fecha_fin
          ? `${s.fecha_inicio} al ${s.fecha_fin}`
          : "Sin fechas indicadas";
        return `
          <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid #1b35c4">
            <p style="margin:0 0 8px;font-weight:700;color:#111">
              Esquiador ${i + 1}${s.nombre ? ` — ${s.nombre}` : ""}
              <span style="font-weight:400;color:#555;font-size:13px">(${s.edad === "adulto" ? "Adulto" : "Niño"})</span>
            </p>
            <p style="margin:0 0 4px;font-size:13px;color:#555">📅 ${fechas}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#555">📐 Altura: ${s.altura || "No indicado"} cm &nbsp;|&nbsp; Bota EU: ${s.talleBota || "No indicado"}</p>
            <ul style="margin:8px 0 0;padding-left:16px;font-size:13px;color:#333">
              ${items.map(item => `<li style="margin-bottom:3px">${item}</li>`).join("")}
            </ul>
          </div>`;
      })
      .join("");

    const bloqueTotal = `
      <div style="background:#1b35c4;border-radius:8px;padding:16px;text-align:right">
        <p style="color:#fff;font-size:20px;font-weight:700;margin:0">
          Total estimado: $${formatPrecio(total_calculado)}
        </p>
      </div>`;

    // Email al negocio
    await resend.emails.send({
      from:    "Aventura Pro Shop <reservas@proshoprental.com>",
      replyTo: email,
      to:      "consultas@proshopaventura.com",
      subject: `Nueva reserva — ${nombre} · Nº ${numero}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🎿 Nueva Reserva</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Nº ${numero}</p>
          </div>
          <div style="padding:24px;background:#f5f7fa">
            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">👤 Datos del cliente</h2>
              <p style="margin:4px 0"><strong>Nombre:</strong> ${nombre}</p>
              <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0"><strong>Teléfono:</strong> ${telefono || "No indicado"}</p>
              <p style="margin:4px 0"><strong>DNI:</strong> ${dni || "No indicado"}</p>
              ${notas ? `<p style="margin:8px 0 0"><strong>Notas:</strong> ${notas}</p>` : ""}
            </div>
            <div style="background:#f5f7fa;border-radius:8px;padding:16px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">🎿 Equipos (${esquiadores.length} esquiador/es)</h2>
              ${detalleEsquiadores}
            </div>
            ${bloqueTotal}
          </div>
          <div style="padding:16px;text-align:center;background:#111;color:rgba(255,255,255,0.5);font-size:12px">
            Aventura Pro Shop — Av. Arrayanes 173, Villa La Angostura
          </div>
        </div>`,
    });

    // Email de confirmación al cliente
    await resend.emails.send({
      from:    "Aventura Pro Shop <reservas@proshoprental.com>",
      to:      email,
      subject: `Confirmación de reserva Nº ${numero} — Aventura Pro Shop`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">¡Reserva recibida! 🎿</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Nº ${numero}</p>
          </div>
          <div style="padding:24px;background:#f5f7fa">
            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
              <p style="margin:0 0 12px">Recibimos tu reserva correctamente. Nos contactaremos a la brevedad para confirmar la disponibilidad.</p>
            </div>
            <div style="background:#f5f7fa;border-radius:8px;padding:16px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">🎿 Tu reserva (${esquiadores.length} esquiador/es)</h2>
              ${detalleEsquiadores}
            </div>
            ${bloqueTotal}
            <div style="background:#fff;border-radius:8px;padding:20px;margin-top:16px">
              <h2 style="margin:0 0 12px;font-size:16px;color:#111">📍 Contacto</h2>
              <p style="margin:4px 0">Av. Arrayanes 173, Villa La Angostura</p>
              <p style="margin:4px 0">WhatsApp: <a href="https://wa.me/5492944646730">+54 9 2944 646730</a></p>
              <p style="margin:4px 0">Email: consultas@proshopaventura.com</p>
            </div>
          </div>
          <div style="padding:16px;text-align:center;background:#111;color:rgba(255,255,255,0.5);font-size:12px">
            Aventura Pro Shop — Av. Arrayanes 173, Villa La Angostura
          </div>
        </div>`,
    });

    // #1: devolver número y total calculado al cliente
    res.json({ ok: true, numero, total: total_calculado });
  } catch (error) {
    console.error("❌ Error al enviar mail:", error.message);
    res.status(500).json({ error: "Error al enviar mail. Intentá de nuevo." });
  }
});

// ── RUTA CONTACTO ─────────────────────────────
app.post("/contacto", limiterContacto, async (req, res) => {
  const raw = req.body;

  if (!raw.nombre || !raw.email || !raw.mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  const { nombre, email, telefono, mensaje } = sanitizar(raw);

  try {
    await resend.emails.send({
      from:    "Aventura Pro Shop <reservas@proshoprental.com>",
      replyTo: email,
      to:      "consultas@proshopaventura.com",
      subject: `Nuevo mensaje — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">✉️ Nuevo mensaje</h1>
          </div>
          <div style="padding:24px;background:#f5f7fa">
            <div style="background:#fff;border-radius:8px;padding:20px">
              <p style="margin:4px 0"><strong>Nombre:</strong> ${nombre}</p>
              <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0"><strong>Teléfono:</strong> ${telefono || "No indicado"}</p>
              <p style="margin:16px 0 4px"><strong>Mensaje:</strong></p>
              <p style="margin:0;padding:12px;background:#f5f7fa;border-radius:6px">${mensaje}</p>
            </div>
          </div>
        </div>`,
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Error al enviar mail:", error.message);
    res.status(500).json({ error: "Error al enviar mail. Intentá de nuevo." });
  }
});

// ── MANEJO DE ERRORES CORS ────────────────────
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "Origen no autorizado" });
  }
  next(err);
});

// ── SERVIDOR ──────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔒 Orígenes permitidos: ${ALLOWED_ORIGINS.join(", ")}`);
});
