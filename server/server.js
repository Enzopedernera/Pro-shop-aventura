// =============================================
// SERVIDOR — Rental Pro Shop
// =============================================
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// ── CORS ──────────────────────────────────────
// En producción, reemplazá con tu dominio real:  "https://www.proshopaventura.com"
// En desarrollo local se permite localhost.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Fallback para desarrollo: si no hay variable de entorno, acepta localhost
if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push("http://localhost:5500", "http://127.0.0.1:5500");
}

const corsOptions = {
  origin(origin, callback) {
    // Permite requests sin origin (ej: Postman, apps móviles, cURL en producción)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  methods: ["POST"], // Solo necesitamos POST
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// ── HELMET — cabeceras de seguridad HTTP ──────
app.use(helmet());

// ── BODY PARSER ───────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limita el tamaño del body

// ── RATE LIMITING ─────────────────────────────
// Límite general: 30 requests por IP cada 15 minutos
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intentá de nuevo en 15 minutos." },
});

// Límite estricto para /reserva: máx 5 reservas por IP por hora
const limiterReserva = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Límite de reservas alcanzado. Intentá de nuevo en 1 hora.",
  },
});

// Límite estricto para /contacto: máx 5 mensajes por IP por hora
const limiterContacto = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Límite de mensajes alcanzado. Intentá de nuevo en 1 hora.",
  },
});

app.use(limiterGeneral);

// ── SANITIZACIÓN ──────────────────────────────
// Escapa caracteres HTML para evitar XSS en los emails
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

// ── RUTA RESERVA ──────────────────────────────
app.post("/reserva", limiterReserva, async (req, res) => {
  const raw = req.body;

  if (
    !raw.nombre ||
    !raw.email ||
    !raw.esquiadores ||
    raw.esquiadores.length === 0
  ) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  // Validación básica de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  const { nombre, email, telefono, dni, notas } = sanitizar(raw);
  const { esquiadores, total_reserva } = raw;

  try {
    const detalleEsquiadores = esquiadores
      .map((esq, i) => {
        const s = sanitizar(esq);
        const items = [];
        const esNino = s.edad === "nino";
        const TIPO_LABELS = {
          ski: esNino ? "Pack Ski Junior" : "Pack Ski Adulto",
          snow: esNino ? "Pack Snowboard Junior" : "Pack Snowboard Adulto",
          solo_ski: esNino ? "Solo Esquí Junior" : "Solo Esquí Adulto",
          solo_snow: esNino ? "Solo Snowboard Junior" : "Solo Snowboard Adulto",
          solo_bota_ski: "Solo Bota de Ski",
          solo_bota_snow: "Solo Bota de Snowboard",
        };
        const pack = TIPO_LABELS[s.tipo] || "";
        if (pack) items.push(pack);
        if (s.casco) items.push(`Casco talle ${s.talleCasco}`);
        if (s.antiparras) items.push(`Antiparras talle ${s.talleAntiparras}`);
        if (s.guantes) items.push(`Guantes talle ${s.talleGuantes}`);
        if (s.botas_preski) items.push("Botas Preski");
        if (s.campera)
          items.push(
            `Campera ${esNino ? "niño" : "adulto"} talle ${s.talleCampera}`,
          );
        if (s.pantalon_adulto)
          items.push(`Pantalón adulto talle ${s.tallePantalon}`);
        if (s.pantalon_nino)
          items.push(`Pantalón/Enterito niño talle ${s.tallePantalon_nino}`);
        if (s.combo_adulto) items.push("Campera + Pantalón adulto (combo)");
        if (s.combo_nino) items.push("Campera + Pantalón niño (combo)");

        const fechas =
          s.fecha_inicio && s.fecha_fin
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
            ${items.map((item) => `<li style="margin-bottom:3px">${item}</li>`).join("")}
          </ul>
        </div>
      `;
      })
      .join("");

    // Email al negocio
    await resend.emails.send({
      from: "Aventura Pro Shop <reservas@proshoprental.com>",
      replyTo: email,
      to: "consultas@proshopaventura.com",
      subject: `Nueva reserva — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🎿 Nueva Reserva</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Aventura Pro Shop</p>
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
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">🎿 Equipos por esquiador (${esquiadores.length})</h2>
              ${detalleEsquiadores}
            </div>
            <div style="background:#1b35c4;border-radius:8px;padding:16px;text-align:right">
              <p style="color:#fff;font-size:20px;font-weight:700;margin:0">
                Total estimado: $${formatPrecio(total_reserva)}
              </p>
            </div>
          </div>
          <div style="padding:16px;text-align:center;background:#111;color:rgba(255,255,255,0.5);font-size:12px">
            Aventura Pro Shop— Av. Arrayanes 173, Villa La Angostura
          </div>
        </div>
      `,
    });

    // Email de confirmación al cliente
    await resend.emails.send({
      from: "Aventura Pro Shop <reservas@proshoprental.com>",
      to: email,
      subject: "Confirmación de reserva —Aventura Pro Shop",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">¡Reserva recibida! 🎿</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Aventura Pro Shop</p>
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
            <div style="background:#1b35c4;border-radius:8px;padding:16px;text-align:right">
              <p style="color:#fff;font-size:20px;font-weight:700;margin:0">
                Total estimado: $${formatPrecio(total_reserva)}
              </p>
            </div>
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
        </div>
      `,
    });

    res.json({ ok: true, mensaje: "Reserva enviada correctamente" });
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
      from: "Aventura Pro Shop <reservas@proshoprental.com>",
      replyTo: email,
      to: "consultas@proshopaventura.com",
      subject: `Nuevo mensaje — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">✉️ Nuevo mensaje</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Aventura Pro Shop</p>
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
        </div>
      `,
    });

    res.json({ ok: true, mensaje: "Mensaje enviado correctamente" });
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
