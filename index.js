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

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "consultas@proshopaventura.com",
        pass: "password", // ⚠️ esto después hay que protegerlo
      },
    });

    // 🛒 ARMAR DETALLE
    let detalleCarrito = "";

    carrito.forEach((item) => {
      detalleCarrito += `
Producto: ${item.nombre}
Talle: ${item.medida || "-"}
Cantidad: ${item.cantidad}
Precio: $${item.precio}
-------------------
`;
    });

    await transporter.sendMail({
      from: email,
      to: "consultas@proshopaventura.com",
      subject: "Nueva reserva RENTAL PRO SHOP",
      text: `
=== CLIENTE ===
Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono}
DNI: ${dni}

=== FECHAS ===
${fecha_inicio} al ${fecha_fin}

=== PRODUCTOS ===
${detalleCarrito}
`,
    });

    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al enviar mail" });
  }
});

// =========================
// 🚀 SERVIDOR
// =========================
app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});
