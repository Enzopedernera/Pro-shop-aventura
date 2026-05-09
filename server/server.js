// =============================================
// SERVIDOR — Rental Pro Shop
// =============================================
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

// ── TRANSPORTER ───────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── VERIFICAR CONEXIÓN ────────────────────────
transporter.verify((error) => {
  if (error) {
    console.error("❌ Error de conexión SMTP:", error.message);
  } else {
    console.log("✅ Servidor SMTP conectado correctamente");
  }
});

// ── RUTA RESERVA ──────────────────────────────
app.post("/reserva", async (req, res) => {
  const { nombre, email, telefono, dni, fecha_inicio, fecha_fin, carrito } = req.body;

  // Validación
  if (!nombre || !email || !carrito || carrito.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const detalleCarrito = carrito
      .map(
        (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd">${item.nombre}${item.medida ? ` (${item.medida})` : ""}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.cantidad}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">$${item.precio.toLocaleString("es-AR")}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">$${(item.precio * item.cantidad).toLocaleString("es-AR")}</td>
        </tr>`
      )
      .join("");

    await transporter.sendMail({
      from: `"Rental Pro Shop" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `Nueva reserva — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🎿 Nueva Reserva</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop</p>
          </div>

          <div style="padding:24px;background:#f5f7fa">

            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">👤 Datos del cliente</h2>
              <p style="margin:4px 0"><strong>Nombre:</strong> ${nombre}</p>
              <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0"><strong>Teléfono:</strong> ${telefono || "No indicado"}</p>
              <p style="margin:4px 0"><strong>DNI:</strong> ${dni || "No indicado"}</p>
            </div>

            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">📅 Fechas</h2>
              <p style="margin:4px 0"><strong>Desde:</strong> ${fecha_inicio}</p>
              <p style="margin:4px 0"><strong>Hasta:</strong> ${fecha_fin}</p>
            </div>

            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">🛒 Equipos seleccionados</h2>
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#111;color:#fff">
                    <th style="padding:8px;text-align:left">Producto</th>
                    <th style="padding:8px;text-align:center">Cant.</th>
                    <th style="padding:8px;text-align:right">Precio</th>
                    <th style="padding:8px;text-align:right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${detalleCarrito}
                </tbody>
              </table>
            </div>

            <div style="background:#1b35c4;border-radius:8px;padding:16px;text-align:right">
              <p style="color:#fff;font-size:20px;font-weight:700;margin:0">
                Total: $${total.toLocaleString("es-AR")}
              </p>
            </div>

          </div>

          <div style="padding:16px;text-align:center;background:#111;color:rgba(255,255,255,0.5);font-size:12px">
            Rental Pro Shop — Av. Arrayanes 173, Villa La Angostura
          </div>
        </div>
      `,
    });

    // Email de confirmación al cliente
    await transporter.sendMail({
      from: `"Rental Pro Shop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Confirmación de reserva — Rental Pro Shop`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">¡Reserva recibida! 🎿</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop</p>
          </div>

          <div style="padding:24px;background:#f5f7fa">
            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
              <p style="margin:0 0 12px">Recibimos tu reserva correctamente. Nos contactaremos a la brevedad para confirmar la disponibilidad.</p>
              <p style="margin:0"><strong>Fechas solicitadas:</strong> ${fecha_inicio} al ${fecha_fin}</p>
            </div>

            <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:16px">
              <h2 style="margin:0 0 16px;font-size:16px;color:#111">🛒 Tu pedido</h2>
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr style="background:#111;color:#fff">
                    <th style="padding:8px;text-align:left">Producto</th>
                    <th style="padding:8px;text-align:center">Cant.</th>
                    <th style="padding:8px;text-align:right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${carrito.map((item) => `
                    <tr>
                      <td style="padding:8px;border:1px solid #ddd">${item.nombre}${item.medida ? ` (${item.medida})` : ""}</td>
                      <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.cantidad}</td>
                      <td style="padding:8px;border:1px solid #ddd;text-align:right">$${(item.precio * item.cantidad).toLocaleString("es-AR")}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>

            <div style="background:#1b35c4;border-radius:8px;padding:16px;text-align:right">
              <p style="color:#fff;font-size:20px;font-weight:700;margin:0">
                Total: $${total.toLocaleString("es-AR")}
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
            Rental Pro Shop — Av. Arrayanes 173, Villa La Angostura
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
    await transporter.sendMail({
      from: `"Rental Pro Shop Web" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `Nuevo mensaje — ${nombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1b35c4;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">✉️ Nuevo mensaje</h1>
            <p style="color:rgba(255,255,255,0.8);margin:5px 0 0">Rental Pro Shop</p>
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