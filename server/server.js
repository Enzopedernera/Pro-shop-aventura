const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/reserva", async (req, res) => {
  const { nombre, email, telefono, dni, fecha_inicio, fecha_fin, carrito } =
    req.body;

  try {
    // 🔧 CONFIG MAIL
    const transporter = nodemailer.createTransport({
      service: "consultas@proshopaventura.com", // tu mail
      auth: {
        user: "consultas@proshopaventura.com",// tu mail
      pass: "proshop2026", // app password
      },
    });

    // 🛒 ARMAR CARRITO
    let detalle = carrito
      .map(
        (item) =>
          `• ${item.nombre} - $${item.precio} x ${item.cantidad}`
      )
      .join("\n");


    let detalleCarrito = "";

    carrito.forEach((item) => {
      detalleCarrito += `
Producto: ${item.nombre}
Días: ${item.dias}
Cantidad: ${item.cantidad || 1}
Precio: $${item.precio}
-------------------
`;
    });

    // 📩 ENVIAR MAIL
 let info =   await transporter.sendMail({
      from: email,
      to: "consultas@proshopaventura.com",
      subject: "Nueva reserva RENTAL PRO SHOP",
      text: `
=== RESERVA ===

Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono}
DNI: ${dni}

Fechas:
${fecha_inicio} al ${fecha_fin}

=== PRODUCTOS ===
${detalleCarrito}
`,
    });

    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al enviar" });
  }
});

app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});
