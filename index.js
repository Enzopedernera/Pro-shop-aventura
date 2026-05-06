const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// 📩 RUTA RESERVA
// =========================
app.post("/reserva", async (req, res) => {
  const { nombre, email, telefono, dni, fecha_inicio, fecha_fin, carrito } =
    req.body;

  // Validación básica
  if (!nombre || !email || !carrito || carrito.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // FIX: contraseña leída desde variable de entorno, no hardcodeada
    // Para Gmail necesitás una "App Password" (no tu contraseña normal):
    // 1. Activá verificación en 2 pasos en tu cuenta Google
    // 2. Entrá a myaccount.google.com → Seguridad → Contraseñas de aplicaciones
    // 3. Generá una para "Nodemailer" y usala en EMAIL_PASS
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "consultas@proshopaventura.com",
        pass: process.env.EMAIL_PASS, // FIX: nunca hardcodear contraseñas
      },
    });

    // Armar detalle del carrito
    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const detalleCarrito = carrito
      .map(
        (item) =>
          `Producto: ${item.nombre}
          Talle/Medida: ${item.medida || "-"}
          Cantidad: ${item.cantidad}
          Precio unitario: $${item.precio.toLocaleString("es-AR")}
          Subtotal: $${(item.precio * item.cantidad).toLocaleString("es-AR")}
-------------------`
      )
      .join("\n");

    await transporter.sendMail({
      // FIX: from debe ser el email autenticado (Gmail no permite otros)
      from: `"Rental Pro Shop Web" <${process.env.EMAIL_USER || "consultas@proshopaventura.com"}>`,
      replyTo: email, // FIX: para poder responder al cliente directamente
      to: "consultas@proshopaventura.com",
      subject: `Nueva reserva - ${nombre}`,
      text: `
=== NUEVA RESERVA ===

=== CLIENTE ===
Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono || "No indicado"}
DNI: ${dni || "No indicado"}

=== FECHAS ===
Desde: ${fecha_inicio}
Hasta: ${fecha_fin}

=== PRODUCTOS ===
${detalleCarrito}

=== TOTAL: $${total.toLocaleString("es-AR")} ===
`,
    });

    res.json({ ok: true, mensaje: "Reserva enviada correctamente" });
  } catch (error) {
    console.error("Error al enviar mail:", error.message);
    res.status(500).json({ error: "Error al enviar mail. Intentá de nuevo." });
  }
});

// =========================
// 🚀 SERVIDOR
// =========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});