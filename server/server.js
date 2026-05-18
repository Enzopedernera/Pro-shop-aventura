// =============================================
// SERVIDOR — Rental Pro Shop
// =============================================
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

function formatPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

// ── RUTA RESERVA ──────────────────────────────
app.post("/reserva", async (req, res) => {
  const { nombre, email, telefono, dni, notas, esquiadores, total_reserva } = req.body;

  if (!nombre || !email || !esquiadores || esquiadores.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {

    // Armar HTML detalle de esquiadores
    const detalleEsquiadores = esquiadores.map((esq, i) => {
      const items = [];
      const esNino = esq.edad === "nino";
      const pack = esq.tipo === "ski"
        ? (esNino ? "Pack Ski Junior" : "Pack Ski Adulto")
        : (esNino ? "Pack Snowboard Junior" : "Pack Snowboard Adulto");

      items.push(pack);
      if (esq.casco) items.push(`Casco talle ${esq.talleCasco}`);
      if (esq.antiparras) items.push(`Antiparras talle ${esq.talleAntiparras}`);
      if (esq.guantes) items.push(`Guantes talle ${esq.talleGuantes}`);
      if (esq.botas_preski) items.push("Botas Preski");
      if (esq.campera) items.push(`Campera ${esNino ? "niño" : "adulto"} talle ${esq.talleCampera}`);
      if (esq.pantalon_adulto) items.push(`Pantalón adulto talle ${esq.tallePantalon}`);
      if (esq.pantalon_nino) items.push(`Pantalón/Enterito niño talle ${esq.tallePantalon_nino}`);
      if (esq.combo_adulto) items.push("Campera + Pantalón adulto (combo)");
      if (esq.combo_nino) items.push("Campera + Pantalón niño (combo)");

      const fechas = esq.fecha_inicio && esq.fecha_fin
        ? `${esq.fecha_inicio} al ${esq.fecha_fin}`
        : "Sin fechas indicadas";

      return `
        <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid #1b35c4">
          <p style="margin:0 0 8px;font-weight:700;color:#111">
            Esquiador ${i + 1}${esq.nombre ? ` — ${esq.nombre}` : ""} 
            <span style="font-weight:400;color:#555;font-size:13px">(${esq.edad === "adulto" ? "Adulto" : "Niño"})</span>
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:#555">📅 ${fechas}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#555">📐 Altura: ${esq.altura || "No indicado"} cm &nbsp;|&nbsp; Bota EU: ${esq.talleBota || "No indicado"}</p>
          <ul style="margin:8px 0 0;padding-left:16px;font-size:13px;color:#333">
            ${items.map(item => `<li style="margin-bottom:3px">${item}</li>`).join("")}
          </ul>
        </div>
      `;
    }).join("");

    // ── EMAIL AL NEGOCIO ──
    await resend.emails.send({
      from: "Rental Pro Shop Aventura <reservas@proshoprental.com>",
      replyTo: email,
      to: "consultas@proshopaventura.com",
      subject: `Nueva reserva — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🎿 Nueva Reserva</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop Aventura</p>
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
            Rental Pro Shop Aventura — Av. Arrayanes 173, Villa La Angostura
          </div>
        </div>
      `,
    });

    // ── EMAIL DE CONFIRMACIÓN AL CLIENTE ──
    await resend.emails.send({
      from: "Rental Pro Shop Aventura <reservas@proshoprental.com>",
      to: email,
      subject: `Confirmación de reserva — Rental Pro Shop Aventura`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">¡Reserva recibida! 🎿</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop Aventura</p>
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
            Rental Pro Shop Aventura — Av. Arrayanes 173, Villa La Angostura
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
app.post("/contacto", async (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    await resend.emails.send({
      from: "Rental Pro Shop Aventura <reservas@proshoprental.com>",
      replyTo: email,
      to: "consultas@proshopaventura.com",
      subject: `Nuevo mensaje — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">✉️ Nuevo mensaje</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop Aventura</p>
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

// ── SERVIDOR ──────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});